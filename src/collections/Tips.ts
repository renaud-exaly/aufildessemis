import type { CollectionConfig } from 'payload'

import { anyone, isAdminOrModerator, staffOnly } from '@/lib/access'

export const Tips: CollectionConfig = {
  slug: 'tips',
  labels: { singular: 'Tip', plural: 'Tips & conseils' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'updatedAt'],
    description:
      'Conseils & astuces. En MVP v1, créés par les admins/modérateurs uniquement.',
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdminOrModerator(user)) return true
      return { status: { equals: 'published' } }
    },
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
    },
    {
      name: 'plants',
      type: 'relationship',
      relationTo: 'plants',
      hasMany: true,
      admin: {
        description: 'Plantes concernées (optionnel — laisse vide si général).',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'published',
      required: true,
      options: [
        { label: 'Publié', value: 'published' },
        { label: 'Brouillon', value: 'draft' },
        { label: 'Masqué', value: 'flagged' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
