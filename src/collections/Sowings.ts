import type { CollectionConfig } from 'payload'

import { anyone, isAdminOrModerator } from '@/lib/access'

export const Sowings: CollectionConfig = {
  slug: 'sowings',
  labels: { singular: 'Semis', plural: 'Semis (lots)' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'plant', 'owner', 'currentStage', 'startedAt'],
    description:
      "Un lot de semis (ex. 'Mes courgettes 2026') tenu par un membre.",
  },
  access: {
    // Tout le monde voit les semis publics ; les membres voient aussi les leurs.
    read: ({ req: { user } }) => {
      if (isAdminOrModerator(user)) return true
      const publicCond = { visibility: { equals: 'public' } }
      if (!user) return publicCond
      return {
        or: [publicCond, { owner: { equals: user.id } }],
      }
    },
    // Tout membre connecté crée ses semis.
    create: ({ req: { user } }) => Boolean(user),
    // Propriétaire + staff.
    update: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminOrModerator(user)) return true
      return { owner: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminOrModerator(user)) return true
      return { owner: { equals: user.id } }
    },
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        // Auto-assigne le owner à la création.
        if (operation === 'create' && req.user && !data.owner) {
          return { ...data, owner: req.user.id }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nom du lot',
      admin: { placeholder: 'Mes courgettes 2026' },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'plant',
      type: 'relationship',
      relationTo: 'plants',
      required: true,
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      label: 'Date de démarrage',
    },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'public',
      required: true,
      options: [
        { label: 'Public (visible dans le journal)', value: 'public' },
        { label: 'Privé (toi seul)', value: 'private' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'currentStage',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          'Dérivé automatiquement de la dernière SowingUpdate taguée.',
      },
    },
    {
      name: 'reminderSettings',
      type: 'group',
      label: 'Rappels',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Recevoir des rappels pour ce lot',
        },
      ],
    },
    {
      name: 'lastReminderStage',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          'Dernière étape pour laquelle un rappel a été envoyé. Bloque les doublons.',
      },
    },
    {
      name: 'lastReminderAt',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
