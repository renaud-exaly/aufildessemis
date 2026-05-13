/**
 * Seed des 4 catégories du forum.
 *
 * Usage local :
 *   pnpm tsx src/scripts/seed-forum-categories.ts
 *
 * En production, lance ça via le profil `migrate` du docker-compose.
 */

import 'dotenv/config'

import { getPayloadClient } from '@/lib/payload'

const CATEGORIES = [
  {
    slug: 'entraide',
    name: 'Entraide',
    description: 'Pose tes questions, demande un coup de main.',
    icon: '🤝',
    order: 1,
  },
  {
    slug: 'tips-astuces',
    name: 'Tips & Astuces',
    description: 'Partage ce qui marche dans ton potager.',
    icon: '🌿',
    order: 2,
  },
  {
    slug: 'mon-potager',
    name: 'Mon potager',
    description: 'Montre tes plantations, raconte ta saison.',
    icon: '🌱',
    order: 3,
  },
  {
    slug: 'off-topic',
    name: 'Off-topic',
    description: 'Tout le reste — du moment qu’on se respecte.',
    icon: '☕',
    order: 4,
  },
]

async function main() {
  const payload = await getPayloadClient()

  for (const cat of CATEGORIES) {
    const { docs } = await payload.find({
      collection: 'forum-categories',
      where: { slug: { equals: cat.slug } },
      limit: 1,
    })
    if (docs.length) {
      await payload.update({
        collection: 'forum-categories',
        id: docs[0].id,
        data: cat,
        overrideAccess: true,
      })
      console.log(`↻ updated ${cat.slug}`)
    } else {
      await payload.create({
        collection: 'forum-categories',
        data: cat,
        overrideAccess: true,
      })
      console.log(`✓ created ${cat.slug}`)
    }
  }

  console.log('\nForum categories seeded.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
