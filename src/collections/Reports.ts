import type { CollectionConfig } from 'payload'

import { staffOnly } from '@/lib/access'

export const Reports: CollectionConfig = {
  slug: 'reports',
  labels: { singular: 'Signalement', plural: 'Signalements' },
  admin: {
    useAsTitle: 'reason',
    defaultColumns: ['target', 'reason', 'status', 'reporter', 'createdAt'],
    description: "File d'attente de modération. Triable par statut.",
  },
  access: {
    // Seul le staff lit/édite les rapports.
    read: staffOnly,
    create: ({ req: { user } }) => Boolean(user),
    update: staffOnly,
    delete: staffOnly,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user && !data.reporter) {
          return { ...data, reporter: req.user.id }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'reporter',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'target',
      type: 'relationship',
      relationTo: ['sowings', 'sowing-updates', 'comments', 'tips', 'users'],
      required: true,
    },
    {
      name: 'reason',
      type: 'select',
      required: true,
      options: [
        { label: 'Spam', value: 'spam' },
        { label: 'Contenu inapproprié', value: 'inappropriate' },
        { label: 'Harcèlement', value: 'harassment' },
        { label: 'Désinformation jardinage', value: 'misinformation' },
        { label: 'Autre', value: 'other' },
      ],
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'Précisions',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      required: true,
      options: [
        { label: 'Ouvert', value: 'open' },
        { label: 'Résolu', value: 'resolved' },
        { label: 'Rejeté', value: 'dismissed' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
