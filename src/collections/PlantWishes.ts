import type { CollectionConfig } from 'payload'

import { isAdminOrModerator, staffOnly } from '@/lib/access'

/**
 * "Envies de semis" : un user marque une plante de la bibliothèque comme
 * envie. Le cron quotidien envoie un email de rappel quand le mois courant
 * entre dans la fenêtre de semis de la plante (une fois par saison, throttlé
 * à 1 mail / 48h / user via Users.lastWishReminderAt).
 */
export const PlantWishes: CollectionConfig = {
  slug: 'plant-wishes',
  labels: { singular: 'Envie', plural: 'Envies de semis' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'plant', 'lastNotifiedYear', 'createdAt'],
    description:
      'Envies de semis posées depuis la bibliothèque. Une ligne = (user, plante).',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminOrModerator(user)) return true
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminOrModerator(user)) return true
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminOrModerator(user)) return true
      return { user: { equals: user.id } }
    },
    admin: ({ req: { user } }) => isAdminOrModerator(user),
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user && !data.user) {
          return { ...data, user: req.user.id }
        }
        return data
      },
    ],
  },
  indexes: [
    { fields: ['user', 'plant'], unique: true },
  ],
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'plant',
      type: 'relationship',
      relationTo: 'plants',
      required: true,
      index: true,
    },
    {
      name: 'lastNotifiedYear',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          "Année de la dernière notif envoyée. Empêche le re-spam la même saison.",
      },
    },
    {
      name: 'dismissed',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Mis à true si le user clique "pas cette année". Empêche le rappel sans supprimer l\'envie.',
      },
    },
  ],
  timestamps: true,
}
