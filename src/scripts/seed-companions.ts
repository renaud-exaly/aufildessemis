/**
 * Seed les associations de pluriculture (compagnonnage) entre plantes existantes.
 * Idempotent : ne touche pas une plante qui a déjà des companions.
 *
 * Usage : pnpm seed:companions
 */

import 'dotenv/config'

import { getPayloadClient } from '@/lib/payload'

type Pairing = {
  plantSlug: string
  companions: Array<{ slug: string; note: string }>
}

/**
 * Note : la lecture des compagnons sur la page est bi-directionnelle, donc on
 * peut se contenter de déclarer chaque association d'un seul côté (la base
 * naturelle = la plante "principale" qui héberge l'autre).
 */
const PAIRINGS: Pairing[] = [
  {
    plantSlug: 'tomate',
    companions: [
      {
        slug: 'basilic',
        note:
          "Le parfum du basilic repousse les pucerons et les aleurodes qui aiment la tomate. En retour, la tomate apporte une ombre légère qui empêche le basilic de monter trop vite en graines.",
      },
      {
        slug: 'carotte',
        note:
          "Les racines profondes de la tomate et le pivot fin de la carotte ne se concurrencent pas. La carotte aère le sol au pied de la tomate.",
      },
    ],
  },
  {
    plantSlug: 'courgette',
    companions: [
      {
        slug: 'basilic',
        note:
          "Le basilic éloigne quelques ravageurs des cucurbitacées (mouches, pucerons) et son odeur n'effraie pas les abeilles dont la courgette a besoin pour être pollinisée.",
      },
    ],
  },
  {
    plantSlug: 'salade',
    companions: [
      {
        slug: 'radis',
        note:
          "Le radis pousse vite et libère sa place avant que la salade ait besoin de l'espace. On peut semer les deux en mélange sur la même ligne.",
      },
      {
        slug: 'carotte',
        note:
          "Cultures lentes côte à côte : la salade ombre légèrement le sol pendant que la carotte germe (étape difficile).",
      },
    ],
  },
  {
    plantSlug: 'carotte',
    companions: [
      {
        slug: 'radis',
        note:
          "Classique maraîcher : on mélange les graines avant le semis. Le radis lève vite et signale la ligne pendant que la carotte germe en 2-3 semaines.",
      },
    ],
  },
  {
    plantSlug: 'poivron',
    companions: [
      {
        slug: 'basilic',
        note:
          "Comme pour la tomate, le basilic au pied du poivron éloigne pucerons et favorise une croissance régulière.",
      },
    ],
  },
]

async function seedCompanions() {
  const payload = await getPayloadClient()

  let updated = 0
  let skipped = 0

  for (const p of PAIRINGS) {
    const { docs } = await payload.find({
      collection: 'plants',
      where: { slug: { equals: p.plantSlug } },
      limit: 1,
      depth: 0,
    })
    const plant = docs[0]
    if (!plant) {
      console.log(`  ↷  ${p.plantSlug} : introuvable, skip.`)
      skipped++
      continue
    }
    if (Array.isArray(plant.companions) && plant.companions.length > 0) {
      console.log(`  ↷  ${p.plantSlug} : déjà ${plant.companions.length} compagnons, skip.`)
      skipped++
      continue
    }

    // Résoudre chaque slug en ID
    const resolved: Array<{ plant: string | number; note: string }> = []
    for (const c of p.companions) {
      const { docs: cdocs } = await payload.find({
        collection: 'plants',
        where: { slug: { equals: c.slug } },
        limit: 1,
        depth: 0,
      })
      if (!cdocs[0]) {
        console.log(`     ⚠  ${c.slug} introuvable pour ${p.plantSlug}, skip pairing.`)
        continue
      }
      resolved.push({ plant: cdocs[0].id as string | number, note: c.note })
    }

    if (!resolved.length) {
      skipped++
      continue
    }

    await payload.update({
      collection: 'plants',
      id: plant.id,
      data: { companions: resolved },
    })
    console.log(`  ✓  ${p.plantSlug} : ${resolved.length} compagnons ajoutés.`)
    updated++
  }

  console.log(`\nSeed compagnons terminé — ${updated} màj, ${skipped} ignorés.`)
  process.exit(0)
}

seedCompanions().catch((err) => {
  console.error('[seed-companions] erreur :', err)
  process.exit(1)
})
