import type { CollectionConfig } from 'payload'

import { isAdminOrModerator } from '@/lib/access'

export const ForumReplies: CollectionConfig = {
  slug: 'forum-replies',
  labels: { singular: 'Réponse forum', plural: 'Réponses forum' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['topic', 'author', 'status', 'createdAt'],
    description: 'Réponses aux sujets du forum.',
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdminOrModerator(user)) return true
      const visible = { status: { equals: 'visible' } }
      if (!user) return visible
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
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation !== 'create' || !data?.topic) return data
        // Refuse les réponses sur un sujet verrouillé (sauf staff).
        if (isAdminOrModerator(req.user)) return data
        try {
          const topicId =
            typeof data.topic === 'object' ? data.topic.id : data.topic
          const topic = await req.payload.findByID({
            collection: 'forum-topics',
            id: topicId,
            depth: 0,
            overrideAccess: true,
          })
          if (topic.locked) {
            throw new Error('Ce sujet est verrouillé — aucune nouvelle réponse.')
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('verrouillé')) {
            throw error
          }
          // Sinon on laisse Payload échouer naturellement plus tard.
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user && !data.author) {
          return { ...data, author: req.user.id }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation !== 'create' || !doc.topic) return
        try {
          const topicId =
            typeof doc.topic === 'object' ? doc.topic.id : doc.topic
          const topic = await req.payload.findByID({
            collection: 'forum-topics',
            id: topicId,
            depth: 0,
            overrideAccess: true,
          })
          await req.payload.update({
            collection: 'forum-topics',
            id: topicId,
            data: {
              replyCount: (topic.replyCount ?? 0) + 1,
              lastReplyAt: doc.createdAt ?? new Date().toISOString(),
            },
            overrideAccess: true,
          })
        } catch (error) {
          req.payload.logger.warn(
            { error, topic: doc.topic },
            '[ForumReplies] failed to bump topic counters',
          )
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        if (!doc.topic) return
        try {
          const topicId =
            typeof doc.topic === 'object' ? doc.topic.id : doc.topic
          const topic = await req.payload.findByID({
            collection: 'forum-topics',
            id: topicId,
            depth: 0,
            overrideAccess: true,
          })
          await req.payload.update({
            collection: 'forum-topics',
            id: topicId,
            data: {
              replyCount: Math.max(0, (topic.replyCount ?? 0) - 1),
            },
            overrideAccess: true,
          })
        } catch {
          // Topic peut-être supprimé en cascade — pas grave.
        }
      },
    ],
  },
  fields: [
    {
      name: 'topic',
      type: 'relationship',
      relationTo: 'forum-topics',
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
      admin: { description: 'Corps de la réponse en markdown.' },
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
