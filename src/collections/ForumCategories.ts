import type { CollectionConfig } from 'payload'

import { anyone, staffOnly } from '@/lib/access'

export const ForumCategories: CollectionConfig = {
  slug: 'forum-categories',
  labels: { singular: 'Catégorie forum', plural: 'Catégories forum' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order'],
    description:
      'Catégories du forum. Fixes — éditées par les admins uniquement.',
  },
  access: {
    read: anyone,
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nom',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL : /forum/<slug>' },
    },
    {
      name: 'description',
      type: 'text',
      label: 'Description courte',
      admin: { description: 'Une ligne affichée sous le titre.' },
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Icône (emoji)',
      admin: { description: 'Un emoji court, ex. 🌿' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      label: 'Ordre',
    },
  ],
}
