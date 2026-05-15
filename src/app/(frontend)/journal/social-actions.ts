'use server'

import { revalidatePath } from 'next/cache'

import { getSession } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

type Result<T = unknown> =
  | ({ ok: true } & (T extends unknown ? T : never))
  | { ok: false; error: string }

type SimpleResult = { ok: true } | { ok: false; error: string }

const COMMENT_MAX_LENGTH = 2000
const COMMENT_MIN_LENGTH = 2
/** Anti-spam : 5 commentaires max par heure et par user. */
const COMMENT_RATE_PER_HOUR = 5

function asString(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : ''
}

// --------- Réactions -------------------------------------------------------

export async function toggleReactionAction(
  sowingUpdateId: number,
): Promise<Result<{ reacted: boolean }>> {
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Connecte-toi pour réagir.' }
  }
  if (!Number.isFinite(sowingUpdateId)) {
    return { ok: false, error: 'Cible invalide.' }
  }
  try {
    const payload = await getPayloadClient()
    const userId = Number(session.id)
    const { docs: existing } = await payload.find({
      collection: 'reactions',
      where: {
        and: [
          { user: { equals: userId } },
          { sowingUpdate: { equals: sowingUpdateId } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing[0]) {
      await payload.delete({
        collection: 'reactions',
        id: existing[0].id,
        overrideAccess: true,
      })
      return { ok: true, reacted: false }
    }
    await payload.create({
      collection: 'reactions',
      data: { user: userId, sowingUpdate: sowingUpdateId, kind: 'heart' },
      overrideAccess: true,
    })
    return { ok: true, reacted: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { ok: false, error: message }
  }
}

// --------- Commentaires ----------------------------------------------------

export type CommentTarget =
  | { collection: 'sowing-updates'; id: number }
  | { collection: 'tips'; id: number }

export async function addCommentAction(
  target: CommentTarget,
  body: string,
): Promise<Result<{ commentId: number | string }>> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Connecte-toi pour commenter.' }

  const trimmed = body.trim()
  if (trimmed.length < COMMENT_MIN_LENGTH) {
    return { ok: false, error: 'Le commentaire est trop court.' }
  }
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    return { ok: false, error: `Le commentaire dépasse ${COMMENT_MAX_LENGTH} caractères.` }
  }
  if (!target || !Number.isFinite(target.id)) {
    return { ok: false, error: 'Cible invalide.' }
  }
  if (target.collection !== 'sowing-updates' && target.collection !== 'tips') {
    return { ok: false, error: 'Cible invalide.' }
  }

  try {
    const payload = await getPayloadClient()
    const userId = Number(session.id)

    // Rate-limit : nb de commentaires du user dans la dernière heure.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { totalDocs: recent } = await payload.count({
      collection: 'comments',
      where: {
        and: [
          { author: { equals: userId } },
          { createdAt: { greater_than: oneHourAgo } },
        ],
      },
      overrideAccess: true,
    })
    if (recent >= COMMENT_RATE_PER_HOUR) {
      return {
        ok: false,
        error: 'Tu as posté beaucoup de commentaires récemment. Réessaie dans un moment.',
      }
    }

    const created = await payload.create({
      collection: 'comments',
      data: {
        author: userId,
        body: trimmed,
        status: 'visible',
        target: { relationTo: target.collection, value: target.id },
      },
      overrideAccess: true,
    })

    if (target.collection === 'sowing-updates') {
      await notifySowingUpdateComment({
        sowingUpdateId: target.id,
        body: trimmed,
        senderId: userId,
        senderName:
          (session.displayName as string | undefined) ?? session.email,
      })
    } else {
      // Tips : pas d'email (les admins ont la file de modération).
      // Revalide la page Tip.
      const tip = await payload.findByID({
        collection: 'tips',
        id: target.id,
        depth: 0,
        overrideAccess: true,
      })
      if (tip?.slug) revalidatePath(`/tips/${tip.slug}`)
    }

    return { ok: true, commentId: created.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { ok: false, error: message }
  }
}

async function notifySowingUpdateComment({
  sowingUpdateId,
  body,
  senderId,
  senderName,
}: {
  sowingUpdateId: number
  body: string
  senderId: number
  senderName: string
}): Promise<void> {
  const payload = await getPayloadClient()
  const update = await payload.findByID({
    collection: 'sowing-updates',
    id: sowingUpdateId,
    depth: 1,
    overrideAccess: true,
  })

  const updateAuthor = update.author as
    | { id?: number | string; email?: string; displayName?: string; reminderOptIn?: boolean }
    | string
    | undefined
  if (
    updateAuthor &&
    typeof updateAuthor === 'object' &&
    updateAuthor.email &&
    String(updateAuthor.id) !== String(senderId) &&
    updateAuthor.reminderOptIn !== false
  ) {
    const sowing = update.sowing as
      | { id?: number | string; name?: string; owner?: number | string | { id?: number | string } }
      | string
      | number
    const sowingId =
      typeof sowing === 'object' ? sowing.id : (sowing as number | string)
    const ownerRaw = typeof sowing === 'object' ? sowing.owner : undefined
    const ownerId =
      typeof ownerRaw === 'object' && ownerRaw
        ? ownerRaw.id
        : (ownerRaw as number | string | undefined)
    const sowingName =
      typeof sowing === 'object' && sowing.name ? sowing.name : 'ton lot'
    const baseUrl =
      process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
    const link = `${baseUrl}/journal/${ownerId ?? 'inconnu'}/${sowingId}`
    const subject = `${senderName} a commenté ${sowingName}`
    const html = buildCommentEmailHtml({
      toName: updateAuthor.displayName,
      senderName,
      sowingName: String(sowingName),
      body,
      link,
    })
    try {
      await payload.sendEmail({ to: updateAuthor.email, subject, html })
    } catch {
      // n'empêche pas le commentaire
    }
  }

  if (update.sowing) {
    const sId =
      typeof update.sowing === 'object' ? update.sowing.id : update.sowing
    revalidatePath(`/journal/[user]/${sId}`, 'page')
    revalidatePath(`/mon-potager/${sId}`)
  }
}

export async function deleteCommentAction(
  commentId: number,
): Promise<SimpleResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Connecte-toi.' }

  try {
    const payload = await getPayloadClient()
    const existing = await payload.findByID({
      collection: 'comments',
      id: commentId,
      depth: 0,
      overrideAccess: true,
    })
    const authorId =
      typeof existing.author === 'object' ? existing.author.id : existing.author
    const isStaff =
      session.role === 'admin' || session.role === 'moderator'
    if (!isStaff && String(authorId) !== String(session.id)) {
      return { ok: false, error: "Ce commentaire ne t'appartient pas." }
    }
    await payload.delete({
      collection: 'comments',
      id: commentId,
      overrideAccess: true,
    })
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { ok: false, error: message }
  }
}

export async function hideCommentAction(
  commentId: number,
): Promise<SimpleResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Connecte-toi.' }
  if (session.role !== 'admin' && session.role !== 'moderator') {
    return { ok: false, error: 'Réservé à la modération.' }
  }
  try {
    const payload = await getPayloadClient()
    await payload.update({
      collection: 'comments',
      id: commentId,
      data: { status: 'hidden' },
      overrideAccess: true,
    })
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { ok: false, error: message }
  }
}

// --------- Follow d'un lot --------------------------------------------------

export async function toggleFollowSowingAction(
  sowingId: number,
): Promise<Result<{ following: boolean }>> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Connecte-toi pour suivre.' }
  if (!Number.isFinite(sowingId)) {
    return { ok: false, error: 'Lot invalide.' }
  }
  try {
    const payload = await getPayloadClient()
    const userId = Number(session.id)

    // Sécurité : on ne suit que des Sowings publics.
    const sowing = await payload.findByID({
      collection: 'sowings',
      id: sowingId,
      depth: 0,
      overrideAccess: true,
    })
    if (sowing.visibility !== 'public') {
      return { ok: false, error: 'Ce lot est privé.' }
    }
    // Pas de follow sur son propre lot — n'aurait pas de sens.
    const ownerId =
      typeof sowing.owner === 'object' ? sowing.owner.id : sowing.owner
    if (String(ownerId) === String(userId)) {
      return { ok: false, error: 'Tu suis déjà ton propre lot.' }
    }

    const { docs: existing } = await payload.find({
      collection: 'sowing-follows',
      where: {
        and: [
          { user: { equals: userId } },
          { sowing: { equals: sowingId } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing[0]) {
      await payload.delete({
        collection: 'sowing-follows',
        id: existing[0].id,
        overrideAccess: true,
      })
      return { ok: true, following: false }
    }
    // À la création on initialise lastNotifiedUpdate à la dernière update
    // existante : on ne renvoie pas d'email pour les updates antérieurs.
    const { docs: latest } = await payload.find({
      collection: 'sowing-updates',
      where: { sowing: { equals: sowingId } },
      sort: '-date',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    await payload.create({
      collection: 'sowing-follows',
      data: {
        user: userId,
        sowing: sowingId,
        lastNotifiedUpdate: latest[0]?.id ?? null,
      },
      overrideAccess: true,
    })
    return { ok: true, following: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { ok: false, error: message }
  }
}

// --------- Signalement ------------------------------------------------------

const REPORT_REASONS = [
  'spam',
  'inappropriate',
  'harassment',
  'misinformation',
  'other',
] as const
type ReportReason = (typeof REPORT_REASONS)[number]
const REPORT_TARGET_TYPES = [
  'sowings',
  'sowing-updates',
  'comments',
  'tips',
  'forum-topics',
  'forum-replies',
] as const
type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number]

export async function reportContentAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok?: true; error?: string; message?: string } | null> {
  const session = await getSession()
  if (!session) return { error: 'Connecte-toi pour signaler.' }

  const targetType = asString(formData.get('targetType')) as ReportTargetType
  const targetId = asString(formData.get('targetId'))
  const reason = asString(formData.get('reason')) as ReportReason
  const note = asString(formData.get('note'))

  if (!REPORT_TARGET_TYPES.includes(targetType)) {
    return { error: 'Type de cible invalide.' }
  }
  if (!targetId) return { error: 'Cible manquante.' }
  if (!REPORT_REASONS.includes(reason)) {
    return { error: 'Motif invalide.' }
  }

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'reports',
      data: {
        reporter: Number(session.id),
        target: { relationTo: targetType, value: Number(targetId) },
        reason,
        note: note || undefined,
        status: 'open',
      },
      overrideAccess: true,
    })
    return { ok: true, message: 'Merci, le signalement est transmis à la modération.' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { error: message }
  }
}

// --------- Email helpers ---------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildCommentEmailHtml({
  toName,
  senderName,
  sowingName,
  body,
  link,
}: {
  toName?: string
  senderName: string
  sowingName: string
  body: string
  link: string
}): string {
  const greeting = toName ? `Bonjour ${escapeHtml(toName)},` : 'Bonjour,'
  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #1f2a24;">
      <h1 style="font-family: Georgia, serif; font-weight: 500; color: #2d4a3e; font-size: 28px; margin: 0 0 8px;">
        Au fil des semis
      </h1>
      <p style="font-style: italic; color: #4a574f; margin: 0 0 24px;">Quelqu'un a réagi sur ton journal</p>
      <p>${greeting}</p>
      <p><strong>${escapeHtml(senderName)}</strong> a laissé un commentaire sur ${escapeHtml(sowingName)} :</p>
      <blockquote style="border-left: 3px solid #b9d3c2; padding: 8px 16px; margin: 16px 0; color: #1f2a24; font-style: italic; background: #faf6ed;">
        ${escapeHtml(body).replace(/\n/g, '<br>')}
      </blockquote>
      <p style="margin: 28px 0;">
        <a href="${link}" style="background:#2d4a3e;color:#ffffff;padding:14px 26px;border-radius:9999px;text-decoration:none;font-weight:600;">
          Voir et répondre →
        </a>
      </p>
      <p style="font-size: 13px; color: #4a574f;">Tu reçois ce mail parce que tu es l'auteur de l'entrée commentée.</p>
    </div>
  `
}
