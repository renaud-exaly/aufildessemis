import type { CollectionConfig } from 'payload'

import { isAdminOrModerator } from '@/lib/access'

/**
 * Join collection : user qui suit un Sowing public.
 * Trigger d'envoi d'un email à chaque nouvelle SowingUpdate (cron).
 */
export const SowingFollows: CollectionConfig = {
  slug: 'sowing-follows',
  labels: { singular: 'Suivi de lot', plural: 'Suivis de lots' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'sowing', 'lastNotifiedUpdate', 'createdAt'],
  },
  indexes: [{ fields: ['user', 'sowing'], unique: true }],
  access: {
    // Privé : seul le user concerné et le staff peuvent lister leurs follows.
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminOrModerator(user)) return true
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminOrModerator(user)) return true
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminOrModerator(user)) return true
      return { user: { equals: user.id } }
    },
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user && !data.user) {
          return { ...data, user: req.user.id }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'sowing',
      type: 'relationship',
      relationTo: 'sowings',
      required: true,
      index: true,
    },
    {
      name: 'lastNotifiedUpdate',
      type: 'relationship',
      relationTo: 'sowing-updates',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          "Dernière update pour laquelle on a déjà envoyé un email. Sert d'anti-doublon.",
      },
    },
  ],
  timestamps: true,
}
