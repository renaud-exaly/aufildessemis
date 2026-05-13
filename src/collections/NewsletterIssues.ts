import type { CollectionConfig } from 'payload'

import { staffOnly } from '@/lib/access'

export const NewsletterIssues: CollectionConfig = {
  slug: 'newsletter-issues',
  labels: { singular: 'Numéro newsletter', plural: 'Newsletters' },
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'month', 'sentAt'],
    description:
      'Archive des numéros mensuels envoyés via Resend Broadcasts.',
  },
  access: {
    read: staffOnly,
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  fields: [
    {
      name: 'month',
      type: 'text',
      required: true,
      admin: { description: "Format YYYY-MM (ex. '2026-05')." },
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'htmlSnapshot',
      type: 'code',
      admin: {
        language: 'html',
        description: 'Snapshot HTML envoyé (généré au moment du broadcast).',
      },
    },
    {
      name: 'resendBroadcastId',
      type: 'text',
      label: 'Resend Broadcast ID',
      admin: { readOnly: true },
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
