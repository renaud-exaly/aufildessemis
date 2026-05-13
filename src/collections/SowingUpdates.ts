import type { CollectionConfig } from 'payload'

import { anyone, isAdminOrModerator } from '@/lib/access'
import { SOWING_STAGES } from '@/lib/stages'

export const SowingUpdates: CollectionConfig = {
  slug: 'sowing-updates',
  labels: { singular: 'Mise à jour', plural: 'Mises à jour' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['sowing', 'date', 'stage', 'author'],
    description: 'Une entrée datée du journal (photo + note, étape optionnelle).',
  },
  access: {
    // Lisible par tous si le Sowing parent est public — Payload n'évalue pas
    // la chaîne ici ; on filtre côté frontend via `depth` + filtres. Les
    // membres voient leurs propres updates.
    read: anyone,
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
    afterChange: [
      async ({ doc, req }) => {
        if (!doc.stage || !doc.sowing) return
        try {
          await req.payload.update({
            collection: 'sowings',
            id: typeof doc.sowing === 'object' ? doc.sowing.id : doc.sowing,
            data: { currentStage: doc.stage },
          })
        } catch (error) {
          req.payload.logger.warn(
            { error, sowing: doc.sowing },
            '[SowingUpdates] failed to sync currentStage',
          )
        }
      },
    ],
  },
  fields: [
    {
      name: 'sowing',
      type: 'relationship',
      relationTo: 'sowings',
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
      name: 'date',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'note',
      type: 'richText',
      label: 'Note',
    },
    {
      name: 'photos',
      type: 'array',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      name: 'stage',
      type: 'select',
      options: [...SOWING_STAGES],
      admin: {
        description:
          'Optionnel : tague cette mise à jour à une étape (semis, repiquage, récolte…).',
      },
    },
  ],
}
