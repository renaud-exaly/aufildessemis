import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // Payload pré-génère ces variantes au moment de l'upload via sharp.
    // Next/Image les sert ensuite directement (en AVIF/WebP côté optimiseur)
    // sans avoir à redimensionner le fichier original à chaque requête.
    imageSizes: [
      { name: 'thumbnail', width: 400, position: 'centre' },
      { name: 'card', width: 800, position: 'centre' },
      { name: 'content', width: 1200, position: 'centre' },
      { name: 'hero', width: 1920, position: 'centre' },
    ],
    formatOptions: {
      format: 'jpeg',
      options: { quality: 82, mozjpeg: true },
    },
  },
}
