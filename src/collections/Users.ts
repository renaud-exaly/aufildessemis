import type { CollectionConfig } from 'payload'

import { adminFieldOnly, adminsOnly, anyone } from '@/lib/access'

/**
 * Champs visibles seulement au user lui-même + staff (admin/mod).
 * Pour tout autre demandeur (anonyme, autre membre), supprimés par afterRead.
 * Couvre PII et secrets (apiKey, sessions).
 */
const SELF_OR_STAFF_FIELDS = [
  'email',
  'apiKey',
  'sessions',
  'newsletterOptIn',
  'reminderOptIn',
  'lastWishReminderAt',
  'lastDigestSentAt',
  'onboardedAt',
  '_verified',
  '_verificationToken',
] as const

/** Champs strictement staff (jamais exposés au user lui-même non plus). */
const STAFF_ONLY_FIELDS = [
  'bannedAt',
  'deletedAt',
  'enableAPIKey',
  'loginAttempts',
  'lockUntil',
] as const

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'email', 'role', 'createdAt'],
  },
  hooks: {
    afterRead: [
      ({ doc, req }) => {
        // CRITIQUE : ne PAS stripper sur les appels internes (Local API).
        // Payload utilise findByID en interne pendant payload.auth() pour
        // résoudre le user du JWT. À ce moment req.user n'est pas encore
        // peuplé. Si on enlève `_verified` du doc, Payload pense que le user
        // n'est pas vérifié et l'auth échoue silencieusement.
        // Les Server Actions tournent aussi en Local API et sont code de
        // confiance → leur exposer les champs n'est pas un risque.
        if ((req as { payloadAPI?: string }).payloadAPI === 'local') return doc

        const user = req.user as
          | { id: string | number; role?: string }
          | null
          | undefined
        const isStaff =
          !!user && (user.role === 'admin' || user.role === 'moderator')
        const isSelf = !!user && user.id === doc.id

        if (!isStaff && !isSelf) {
          for (const f of SELF_OR_STAFF_FIELDS) {
            if (f in doc) delete (doc as Record<string, unknown>)[f]
          }
        }
        if (!isStaff) {
          for (const f of STAFF_ONLY_FIELDS) {
            if (f in doc) delete (doc as Record<string, unknown>)[f]
          }
        }
        return doc
      },
    ],
  },
  auth: {
    // Active la génération de clés API personnelles (admin → user → bouton
    // "Generate API Key"). Utilisé par le MCP local pour publier depuis
    // Claude Code sans login/password. Voir mcp/README.md.
    useAPIKey: true,
    // 30 jours — défaut Payload est 2h, trop court pour un carnet perso.
    tokenExpiration: 60 * 60 * 24 * 30,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    verify: {
      generateEmailSubject: () => 'Confirme ton compte — Au fil des semis',
      generateEmailHTML: ({ token, user }) => {
        const base =
          process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
        const link = `${base}/mon-potager/verifier/${token}`
        const name =
          (user as { displayName?: string })?.displayName ?? 'Bonjour'
        return `
          <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #1f2a24;">
            <h1 style="font-family: Georgia, serif; font-weight: 500; color: #2d4a3e; font-size: 28px; margin: 0 0 16px;">
              Au fil des semis
            </h1>
            <p>Bienvenue ${name},</p>
            <p>Une dernière étape pour activer ton carnet&nbsp;: clique sur le lien ci-dessous pour confirmer ton adresse.</p>
            <p style="margin: 28px 0;">
              <a href="${link}" style="background:#2d4a3e;color:#ffffff;padding:14px 26px;border-radius:9999px;text-decoration:none;font-weight:600;">Confirmer mon adresse →</a>
            </p>
            <p style="font-size: 14px; color: #4a574f;">Ou copie-colle ce lien&nbsp;: <br><a href="${link}" style="color:#2d4a3e;">${link}</a></p>
            <p style="font-size: 13px; color: #4a574f; margin-top: 32px;">À très vite au potager 🌱<br>Au fil des semis</p>
          </div>
        `
      },
    },
    forgotPassword: {
      generateEmailSubject: () =>
        'Réinitialiser ton mot de passe — Au fil des semis',
      generateEmailHTML: (args) => {
        const token = (args as { token?: string })?.token ?? ''
        const base =
          process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
        const link = `${base}/mon-potager/reset/${token}`
        return `
          <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #1f2a24;">
            <h1 style="font-family: Georgia, serif; font-weight: 500; color: #2d4a3e; font-size: 28px; margin: 0 0 16px;">
              Au fil des semis
            </h1>
            <p>Tu as demandé à réinitialiser ton mot de passe.</p>
            <p>Clique sur le lien ci-dessous pour en choisir un nouveau (valide 1 heure).</p>
            <p style="margin: 28px 0;">
              <a href="${link}" style="background:#2d4a3e;color:#ffffff;padding:14px 26px;border-radius:9999px;text-decoration:none;font-weight:600;">Définir un nouveau mot de passe →</a>
            </p>
            <p style="font-size: 14px; color: #4a574f;">Si tu n'as rien demandé, ignore simplement cet email.</p>
            <p style="font-size: 13px; color: #4a574f; margin-top: 32px;">— Au fil des semis</p>
          </div>
        `
      },
    },
  },
  access: {
    // Profils publics : tout le monde lit (peut être restreint plus tard).
    read: anyone,
    // Inscription libre (alignée avec l'onboarding "modération a posteriori").
    create: anyone,
    // Un user édite ses propres champs ; les admins/mods éditent qui ils veulent.
    update: ({ req: { user }, id }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'moderator') return true
      return user.id === id
    },
    delete: adminsOnly,
    admin: ({ req: { user } }) =>
      user?.role === 'admin' || user?.role === 'moderator',
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      required: true,
      label: "Nom d'affichage",
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'member',
      options: [
        { label: 'Membre', value: 'member' },
        { label: 'Modérateur', value: 'moderator' },
        { label: 'Administrateur', value: 'admin' },
      ],
      access: {
        // Seuls les admins peuvent modifier le rôle d'un user.
        update: adminFieldOnly,
        create: adminFieldOnly,
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Bio courte',
      admin: { description: 'Quelques mots sur toi, ton potager.' },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'region',
      type: 'text',
      defaultValue: 'BE',
      admin: {
        description: 'Code pays/région (BE par défaut, pour le calendrier).',
      },
    },
    {
      name: 'newsletterOptIn',
      type: 'checkbox',
      defaultValue: false,
      label: 'Abonné à la newsletter mensuelle',
    },
    {
      name: 'reminderOptIn',
      type: 'checkbox',
      defaultValue: true,
      label: 'Reçoit les rappels par email',
    },
    {
      name: 'lastWishReminderAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          "Dernier envoi d'un rappel d'envie. Sert au throttle (max 1 mail / 48h / user).",
      },
    },
    {
      name: 'lastDigestSentAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          "Dernier envoi du digest hebdomadaire. Sert de borne pour calculer l'activité de la semaine.",
      },
    },
    {
      name: 'onboardedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          "Date où l'onboarding a été complété. Tant que c'est vide, /mon-potager/bienvenue prend le pas sur /mon-potager au login.",
      },
    },
    {
      name: 'bannedAt',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
      access: { update: adminFieldOnly },
    },
    {
      name: 'deletedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          'Anonymisation RGPD. PII effacée, contenu conservé.',
      },
    },
  ],
}
