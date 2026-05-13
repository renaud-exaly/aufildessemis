import type { CollectionConfig } from 'payload'

import { isAdminOrModerator } from '@/lib/access'

export const ForumTopics: CollectionConfig = {
  slug: 'forum-topics',
  labels: { singular: 'Sujet', plural: 'Sujets' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'title',
      'category',
      'author',
      'replyCount',
      'lastReplyAt',
      'pinned',
      'locked',
      'status',
    ],
    description: 'Sujets du forum.',
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdminOrModerator(user)) return true
      const visible = { status: { equals: 'visible' } }
      if (!user) return visible
      // L'auteur·rice voit ses propres sujets même flagged/hidden.
      return {
        or: [visible, { author: { equals: user.id } }],
      }
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
      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user && !data.author) {
          data = { ...data, author: req.user.id }
        }
        if (operation === 'create' && !data.slug && data.title) {
          // Slug kebab-case + suffixe court pour éviter les collisions.
          const base = String(data.title)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '') // strip diacritics
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60) || 'sujet'
          const suffix = Math.random().toString(36).slice(2, 7)
          data.slug = `${base}-${suffix}`
        }
        if (operation === 'create' && !data.lastReplyAt) {
          data.lastReplyAt = new Date().toISOString()
        }
        // Seuls les staff peuvent toggle pinned / locked.
        if (operation === 'update' && !isAdminOrModerator(req.user)) {
          delete data.pinned
          delete data.locked
          delete data.status
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
      maxLength: 200,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'forum-categories',
      required: true,
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
      name: 'body',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Corps du sujet en markdown.',
      },
    },
    {
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Épinglé en haut de la catégorie.',
      },
    },
    {
      name: 'locked',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Bloque les nouvelles réponses.',
      },
    },
    {
      name: 'replyCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Compteur dénormalisé, mis à jour par hook.',
      },
    },
    {
      name: 'lastReplyAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Pour le tri "fil chaud".',
      },
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
