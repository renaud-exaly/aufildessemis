import type { CollectionConfig } from 'payload'

import { anyone, staffOnly } from '@/lib/access'
import { MONTHS, SOWING_STAGES } from '@/lib/stages'

export const Plants: CollectionConfig = {
  slug: 'plants',
  labels: { singular: 'Plante', plural: 'Plantes' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'latinName', 'updatedAt'],
    description:
      'Fiches maîtresses des espèces cultivables. Éditées par admins/modérateurs.',
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
      label: 'Nom (français)',
    },
    {
      name: 'latinName',
      type: 'text',
      label: 'Nom latin',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL : /bibliotheque/<slug>' },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'array',
      labels: { singular: 'Photo', plural: 'Photos' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
    },
    {
      name: 'sowingWindow',
      type: 'group',
      label: 'Période de semis (Belgique)',
      fields: [
        {
          name: 'startMonth',
          type: 'select',
          options: [...MONTHS],
          required: true,
        },
        {
          name: 'endMonth',
          type: 'select',
          options: [...MONTHS],
          required: true,
        },
        {
          name: 'note',
          type: 'text',
          admin: {
            description: 'Ex. "intérieur en mars, extérieur dès mai".',
          },
        },
      ],
    },
    {
      name: 'typicalStages',
      type: 'array',
      label: 'Étapes typiques',
      labels: { singular: 'Étape', plural: 'Étapes' },
      admin: {
        description:
          "Étapes que cette plante traverse, dans l'ordre. Sert pour la timeline et les rappels.",
      },
      fields: [
        {
          name: 'stage',
          type: 'select',
          required: true,
          options: [...SOWING_STAGES],
        },
        {
          name: 'daysFromPrevious',
          type: 'number',
          label: 'Délai depuis étape précédente (jours, estim.)',
        },
        {
          name: 'tip',
          type: 'textarea',
          label: 'Conseil court pour cette étape',
        },
      ],
    },
    {
      name: 'companions',
      type: 'array',
      label: 'Cultures associées',
      labels: { singular: 'Compagnon', plural: 'Compagnons' },
      admin: {
        description:
          "Plantes qui se plaisent à côté de celle-ci (pluriculture / compagnonnage). Indique pourquoi.",
      },
      fields: [
        {
          name: 'plant',
          type: 'relationship',
          relationTo: 'plants',
          required: true,
        },
        {
          name: 'note',
          type: 'textarea',
          label: 'Pourquoi cette association ?',
          admin: {
            description:
              "Ex. « repousse les pucerons », « apporte de l'ombre », « fixe l'azote pour... »",
          },
        },
      ],
    },
    {
      name: 'incompatibles',
      type: 'array',
      label: 'À ne pas associer',
      labels: { singular: 'Incompatible', plural: 'Incompatibles' },
      admin: {
        description:
          "Plantes à éviter à côté de celle-ci (mêmes maladies, allélopathie, concurrence, etc.).",
      },
      fields: [
        {
          name: 'plant',
          type: 'relationship',
          relationTo: 'plants',
          required: true,
        },
        {
          name: 'note',
          type: 'textarea',
          label: 'Pourquoi éviter ?',
          admin: {
            description:
              "Ex. « mêmes maladies (mildiou) », « allélopathie », « inhibe la fixation d'azote »",
          },
        },
      ],
    },
    {
      name: 'relatedTips',
      type: 'relationship',
      relationTo: 'tips',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
  ],
}
