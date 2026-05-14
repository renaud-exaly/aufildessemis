import type { CollectionConfig } from 'payload'

import { anyone, isAdminOrModerator } from '@/lib/access'

/**
 * Une réaction "♥" sur un SowingUpdate.
 * Une seule par (user, sowingUpdate) — appliqué via index unique.
 */
export const Reactions: CollectionConfig = {
  slug: 'reactions',
  labels: { singular: 'Réaction', plural: 'Réactions' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'sowingUpdate', 'kind', 'createdAt'],
  },
  indexes: [{ fields: ['user', 'sowingUpdate'], unique: true }],
  access: {
    read: anyone,
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
      name: 'sowingUpdate',
      type: 'relationship',
      relationTo: 'sowing-updates',
      required: true,
      index: true,
    },
    {
      name: 'kind',
      type: 'select',
      defaultValue: 'heart',
      required: true,
      options: [{ label: 'Cœur', value: 'heart' }],
    },
  ],
  timestamps: true,
}
