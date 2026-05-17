import type { CollectionConfig } from 'payload'

import { anyone, staffOnly } from '@/lib/access'
import { MONTHS } from '@/lib/stages'

/**
 * Intros éditoriales pour chaque page `/calendrier/[mois]`. Une fiche par mois,
 * éditable depuis l'admin. Fallback : intro générique en dur dans la page
 * (cf. MONTH_INTROS dans /calendrier/[mois]/page.tsx) si la fiche n'existe pas.
 */
export const MonthIntros: CollectionConfig = {
  slug: 'month-intros',
  labels: { singular: 'Intro de mois', plural: 'Intros de mois' },
  admin: {
    useAsTitle: 'month',
    defaultColumns: ['month', 'intro', 'updatedAt'],
    description:
      'Texte d\'intro affiché en haut de chaque page mois du calendrier de semis.',
  },
  access: {
    read: anyone,
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  fields: [
    {
      name: 'month',
      type: 'select',
      required: true,
      unique: true,
      index: true,
      options: [...MONTHS],
      admin: {
        description: 'Un seul document par mois. Sert de clé.',
      },
    },
    {
      name: 'intro',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'Phrase d\'accroche (2-3 phrases) qui plante le décor du mois. Affichée sous le H1.',
      },
    },
    {
      name: 'extra',
      type: 'richText',
      label: 'Texte complémentaire (optionnel)',
      admin: {
        description:
          'Bloc plus long, affiché en bas de page mois — conseils, anecdotes, ce que tu veux mettre en avant.',
      },
    },
  ],
}
