/**
 * Seed initial Plants. Idempotent — skips any plant whose slug already exists.
 *
 * Usage:
 *   pnpm seed
 *
 * Requires DATABASE_URI and PAYLOAD_SECRET to be set (loaded from .env).
 */

import 'dotenv/config'

import { getPayloadClient } from '@/lib/payload'

import type { SowingStage } from '@/lib/stages'

type StageSeed = {
  stage: SowingStage
  daysFromPrevious?: number
  tip: string
}

type PlantSeed = {
  name: string
  latinName: string
  slug: string
  sowingWindow: {
    startMonth: string
    endMonth: string
    note?: string
  }
  description: string
  typicalStages: StageSeed[]
}

const richTextParagraph = (text: string) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: [
      {
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        children: [
          {
            type: 'text',
            format: 0,
            style: '',
            mode: 'normal' as const,
            text,
            detail: 0,
            version: 1,
          },
        ],
      },
    ],
  },
})

const PLANTS: PlantSeed[] = [
  {
    name: 'Courgette',
    latinName: 'Cucurbita pepo',
    slug: 'courgette',
    sowingWindow: {
      startMonth: '04',
      endMonth: '06',
      note: 'Intérieur dès avril, en pleine terre à partir de la mi-mai (gel passé).',
    },
    description:
      'Cucurbitacée généreuse, facile pour démarrer. Un seul pied produit énormément — prévois 1 à 2 plants pour une famille.',
    typicalStages: [
      { stage: 'semis', tip: 'Sème en godet, 2-3 graines par trou, 2 cm de profondeur.' },
      { stage: 'levee', daysFromPrevious: 7, tip: 'Lève en 5-10 jours à 20°C. Garde au chaud et à la lumière.' },
      { stage: 'repiquage', daysFromPrevious: 14, tip: 'Repique dans un pot plus grand quand les 2 premières vraies feuilles apparaissent.' },
      { stage: 'endurcissement', daysFromPrevious: 7, tip: "Sors les godets en journée pendant une semaine pour les habituer à l'extérieur." },
      { stage: 'mise-en-terre', daysFromPrevious: 7, tip: 'Plante en pleine terre quand les nuits dépassent 12°C. Espace de 80 cm entre pieds.' },
      { stage: 'floraison', daysFromPrevious: 35, tip: 'Fleurs mâles puis femelles (celles avec un petit fruit à la base).' },
      { stage: 'recolte', daysFromPrevious: 14, tip: 'Récolte jeune (15-20 cm) pour des fruits tendres. Plus tu cueilles, plus elle produit.' },
    ],
  },
  {
    name: 'Poivron',
    latinName: 'Capsicum annuum',
    slug: 'poivron',
    sowingWindow: {
      startMonth: '02',
      endMonth: '03',
      note: 'Intérieur uniquement (plante frileuse, long cycle).',
    },
    description:
      "Long cycle, demande de la chaleur et de la patience. Sème tôt en février-mars pour espérer une belle récolte avant l'automne.",
    typicalStages: [
      { stage: 'semis', tip: 'Sème en mini-pots, 0,5 cm de profondeur, à 22-25°C.' },
      { stage: 'levee', daysFromPrevious: 12, tip: 'Lève en environ 2 semaines. Garde lumineux et chaud.' },
      { stage: 'repiquage', daysFromPrevious: 21, tip: 'Repique en pot individuel quand 4 vraies feuilles.' },
      { stage: 'endurcissement', daysFromPrevious: 7, tip: "Acclimate progressivement à l'extérieur fin mai." },
      { stage: 'mise-en-terre', daysFromPrevious: 7, tip: 'En pleine terre ou en pot après les Saints de Glace (mi-mai). Soleil garanti.' },
      { stage: 'floraison', daysFromPrevious: 45, tip: 'Petites fleurs blanches. Confirme un arrosage régulier.' },
      { stage: 'recolte', daysFromPrevious: 40, tip: 'Récolte vert ou attends la couleur définitive (rouge/jaune/orange) selon variété.' },
    ],
  },
  {
    name: 'Basilic',
    latinName: 'Ocimum basilicum',
    slug: 'basilic',
    sowingWindow: {
      startMonth: '03',
      endMonth: '05',
      note: 'Intérieur, à la chaleur. Plante très frileuse.',
    },
    description:
      "Compagnon de la tomate au potager comme à l'assiette. Pince les sommités régulièrement pour qu'il se ramifie.",
    typicalStages: [
      { stage: 'semis', tip: 'Sème en surface, à peine recouvert de terreau, à 20°C minimum.' },
      { stage: 'levee', daysFromPrevious: 10, tip: 'Lève en 1 à 2 semaines.' },
      { stage: 'eclaircissage', daysFromPrevious: 10, tip: 'Garde le plus vigoureux par godet.' },
      { stage: 'repiquage', daysFromPrevious: 14, tip: "Repique en pot ou pleine terre à l'abri du vent." },
      { stage: 'recolte', daysFromPrevious: 30, tip: 'Pince les sommités régulièrement. Récolte continue tout l\'été.' },
    ],
  },
  {
    name: 'Tomate',
    latinName: 'Solanum lycopersicum',
    slug: 'tomate',
    sowingWindow: {
      startMonth: '03',
      endMonth: '04',
      note: 'Intérieur, à la chaleur. Repique une seule fois en enfonçant la tige.',
    },
    description:
      "Reine du potager. Variétés à tailler (à gourmands) ou à laisser libres selon le type. Plante en enterrant la tige jusqu'aux cotylédons : elle fera de nouvelles racines.",
    typicalStages: [
      { stage: 'semis', tip: 'Sème en terrine, 0,5 cm de profondeur, à 20°C.' },
      { stage: 'levee', daysFromPrevious: 8, tip: 'Lève en 1 à 2 semaines.' },
      { stage: 'repiquage', daysFromPrevious: 21, tip: "Repique en godet quand 2 vraies feuilles. Enfonce jusqu'aux cotylédons." },
      { stage: 'endurcissement', daysFromPrevious: 7, tip: 'Sors progressivement début mai, abri du vent.' },
      { stage: 'mise-en-terre', daysFromPrevious: 10, tip: 'Pleine terre après les Saints de Glace (mi-mai). 60 cm entre plants.' },
      { stage: 'tuteurage', daysFromPrevious: 3, tip: 'Pose tuteur immédiatement après plantation. Attache au fil du temps.' },
      { stage: 'floraison', daysFromPrevious: 30, tip: 'Petites fleurs jaunes. Pince les gourmands (variétés à tailler).' },
      { stage: 'recolte', daysFromPrevious: 45, tip: 'Récolte rouge et ferme. Garde les graines de tes plus beaux fruits.' },
    ],
  },
  {
    name: 'Salade',
    latinName: 'Lactuca sativa',
    slug: 'salade',
    sowingWindow: {
      startMonth: '03',
      endMonth: '09',
      note: 'Semis échelonnés tous les 15 jours pour une récolte continue.',
    },
    description:
      "Culture facile et rapide (5-7 semaines). Échelonne les semis pour ne jamais manquer de feuilles fraîches. Évite la pleine chaleur de l'été pour les laitues sensibles.",
    typicalStages: [
      { stage: 'semis', tip: 'Sème en ligne, à peine recouvert, lignes espacées de 30 cm.' },
      { stage: 'levee', daysFromPrevious: 6, tip: "Lève en moins d'une semaine." },
      { stage: 'eclaircissage', daysFromPrevious: 14, tip: 'Éclaircis à 25 cm entre plants — les petits arrachés se mangent en jeunes pousses.' },
      { stage: 'recolte', daysFromPrevious: 45, tip: 'Récolte feuille à feuille ou la pomme entière au couteau, au ras du sol.' },
    ],
  },
  {
    name: 'Radis',
    latinName: 'Raphanus sativus',
    slug: 'radis',
    sowingWindow: {
      startMonth: '03',
      endMonth: '09',
      note: 'Semis échelonnés tous les 10-15 jours. Culture éclair (3-4 semaines).',
    },
    description:
      "Le plus rapide du potager. Parfait pour démarrer avec des enfants ou pour combler les vides entre cultures plus longues. N'attends pas trop pour récolter sinon ça pique et c'est creux.",
    typicalStages: [
      { stage: 'semis', tip: 'Sème en ligne, 1 cm de profondeur, espace 3 cm entre graines.' },
      { stage: 'levee', daysFromPrevious: 5, tip: "Lève en moins d'une semaine." },
      { stage: 'eclaircissage', daysFromPrevious: 7, tip: 'Éclaircis à 5 cm pour des radis bien formés.' },
      { stage: 'recolte', daysFromPrevious: 21, tip: 'Récolte dès que la racine fait la taille d\'une bille. Trop attendre = piquant et creux.' },
    ],
  },
]

async function seed() {
  const payload = await getPayloadClient()

  let created = 0
  let skipped = 0

  for (const plant of PLANTS) {
    const existing = await payload.find({
      collection: 'plants',
      where: { slug: { equals: plant.slug } },
      limit: 1,
      depth: 0,
    })

    if (existing.totalDocs > 0) {
      console.log(`  ↷  ${plant.name} déjà présente (slug: ${plant.slug}) — skip.`)
      skipped++
      continue
    }

    await payload.create({
      collection: 'plants',
      data: {
        name: plant.name,
        latinName: plant.latinName,
        slug: plant.slug,
        sowingWindow: plant.sowingWindow,
        description: richTextParagraph(plant.description),
        typicalStages: plant.typicalStages,
      },
    })

    console.log(`  ✓  ${plant.name} créée.`)
    created++
  }

  console.log(`\nSeed terminé — ${created} créées, ${skipped} ignorées.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('[seed] erreur :', err)
  process.exit(1)
})
