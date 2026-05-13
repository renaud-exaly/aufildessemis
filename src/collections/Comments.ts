import type { CollectionConfig } from 'payload'

import { isAdminOrModerator } from '@/lib/access'

export const Comments: CollectionConfig = {
  slug: 'comments',
  labels: { singular: 'Commentaire', plural: 'Commentaires' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['author', 'target', 'status', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdminOrModerator(user)) return true
      return { status: { equals: 'visible' } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminOrModerator(user)) return true
      return { author: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminOrModerator(user)) return true
      return { author: { equals: user.id } }
    },
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user && !data.author) {
          return { ...data, author: req.user.id }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'target',
      type: 'relationship',
      relationTo: ['sowings', 'sowing-updates', 'tips'],
      required: true,
      admin: {
        description: 'Cible du commentaire (un Sowing, une mise à jour, ou un Tip).',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      maxLength: 2000,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'visible',
      required: true,
      options: [
        { label: 'Visible', value: 'visible' },
        { label: 'Signalé', value: 'flagged' },
        { label: 'Masqué', value: 'hidden' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
