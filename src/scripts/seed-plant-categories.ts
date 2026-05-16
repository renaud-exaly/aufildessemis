/**
 * Backfill la catégorie sur les fiches plantes existantes.
 * Idempotent : ne touche pas une plante qui a déjà une catégorie.
 *
 * Usage : pnpm seed:categories
 */

import 'dotenv/config'

import type { PlantCategory } from '@/lib/categories'
import { getPayloadClient } from '@/lib/payload'

const CATEGORY_BY_SLUG: Record<string, PlantCategory> = {
  // Légume-fruit
  aubergine: 'legume-fruit',
  butternut: 'legume-fruit',
  concombre: 'legume-fruit',
  cornichon: 'legume-fruit',
  courgette: 'legume-fruit',
  feve: 'legume-fruit',
  'haricot-vert': 'legume-fruit',
  'petit-pois': 'legume-fruit',
  poivron: 'legume-fruit',
  potiron: 'legume-fruit',
  tomate: 'legume-fruit',

  // Légume-feuille
  blette: 'legume-feuille',
  chicon: 'legume-feuille',
  'chou-kale': 'legume-feuille',
  'chou-de-bruxelles': 'legume-feuille',
  epinard: 'legume-feuille',
  mache: 'legume-feuille',
  oseille: 'legume-feuille',
  roquette: 'legume-feuille',
  salade: 'legume-feuille',

  // Légume-racine (et tubercules)
  betterave: 'legume-racine',
  carotte: 'legume-racine',
  'celeri-rave': 'legume-racine',
  crosne: 'legume-racine',
  navet: 'legume-racine',
  panais: 'legume-racine',
  'pomme-de-terre': 'legume-racine',
  radis: 'legume-racine',
  rutabaga: 'legume-racine',
  topinambour: 'legume-racine',

  // Légume-bulbe
  ail: 'legume-bulbe',
  echalote: 'legume-bulbe',
  fenouil: 'legume-bulbe',
  oignon: 'legume-bulbe',
  poireau: 'legume-bulbe',

  // Légume-tige
  asperge: 'legume-tige',
  'celeri-branche': 'legume-tige',
  rhubarbe: 'legume-tige',

  // Légume-fleur
  artichaut: 'legume-fleur',
  'chou-fleur': 'legume-fleur',

  // Aromatique
  aneth: 'aromatique',
  basilic: 'aromatique',
  'camomille-romaine': 'aromatique',
  cerfeuil: 'aromatique',
  ciboulette: 'aromatique',
  coriandre: 'aromatique',
  estragon: 'aromatique',
  melisse: 'aromatique',
  menthe: 'aromatique',
  origan: 'aromatique',
  persil: 'aromatique',
  romarin: 'aromatique',
  sauge: 'aromatique',
  thym: 'aromatique',

  // Fleur du potager
  bourrache: 'fleur',
  capucine: 'fleur',
  cosmos: 'fleur',
  souci: 'fleur',
  tagetes: 'fleur',
  tournesol: 'fleur',

  // Petit fruit
  cassissier: 'petit-fruit',
  fraisier: 'petit-fruit',
  framboisier: 'petit-fruit',
  groseillier: 'petit-fruit',
  myrtille: 'petit-fruit',

  // Arbre fruitier
  cerisier: 'arbre-fruitier',
  cognassier: 'arbre-fruitier',
  figuier: 'arbre-fruitier',
  kiwi: 'arbre-fruitier',
  'murier-platane': 'arbre-fruitier',
  neflier: 'arbre-fruitier',
  noisetier: 'arbre-fruitier',
  noyer: 'arbre-fruitier',
  pecher: 'arbre-fruitier',
  poirier: 'arbre-fruitier',
  pommier: 'arbre-fruitier',
  prunier: 'arbre-fruitier',
  sureau: 'arbre-fruitier',

  // Engrais vert
  moutarde: 'engrais-vert',
  phacelie: 'engrais-vert',
  sarrasin: 'engrais-vert',
  vesce: 'engrais-vert',

  // Exotique d'intérieur
  ananas: 'exotique-interieur',
  avocat: 'exotique-interieur',
  citron: 'exotique-interieur',
  curcuma: 'exotique-interieur',
  dattier: 'exotique-interieur',
  'fruit-de-la-passion': 'exotique-interieur',
  gingembre: 'exotique-interieur',
  goyave: 'exotique-interieur',
  grenade: 'exotique-interieur',
  litchi: 'exotique-interieur',
  mangue: 'exotique-interieur',
  papaye: 'exotique-interieur',
  tamarin: 'exotique-interieur',
}

async function main() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'plants',
    limit: 500,
    depth: 0,
  })

  let updated = 0
  let skipped = 0
  let unmapped: string[] = []

  for (const plant of docs) {
    const slug = plant.slug as string
    if (plant.category) {
      skipped++
      continue
    }
    const category = CATEGORY_BY_SLUG[slug]
    if (!category) {
      unmapped.push(slug)
      continue
    }
    await payload.update({
      collection: 'plants',
      id: plant.id,
      data: { category },
    })
    updated++
    console.log(`✓ ${slug} → ${category}`)
  }

  console.log(`\nMis à jour : ${updated}`)
  console.log(`Déjà catégorisés : ${skipped}`)
  if (unmapped.length) {
    console.log(`\nNon mappés (${unmapped.length}) :`)
    for (const slug of unmapped) console.log(`  - ${slug}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
