import type { CollectionConfig } from 'payload'

import { anyone, staffOnly } from '@/lib/access'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    description:
      'Pages éditoriales (Accueil, À propos, Contact, Mentions légales, Confidentialité…).',
  },
  access: {
    read: anyone,
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
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
      admin: {
        description: "Sans le slash (ex. 'a-propos', 'mentions-legales').",
      },
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Chapô / sous-titre',
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Contenu',
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        { name: 'title', type: 'text', label: 'Titre SEO' },
        { name: 'description', type: 'textarea', label: 'Description SEO' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
