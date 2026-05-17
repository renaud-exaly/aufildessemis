/**
 * Seed des 12 intros de mois pour `/calendrier/[mois]`.
 *
 * Usage local :
 *   pnpm tsx src/scripts/seed-month-intros.ts
 *
 * Idempotent : update si la fiche existe, create sinon.
 */

import 'dotenv/config'

import { getPayloadClient } from '@/lib/payload'

const INTROS: Array<{ month: string; intro: string }> = [
  {
    month: '01',
    intro:
      "En janvier, le potager dort encore mais les semis sous abri démarrent : oignons, poireaux d'été, premiers piments pour qui aime jouer la patience.",
  },
  {
    month: '02',
    intro:
      "Février, c'est le réveil discret. Les semis intérieurs s'enchaînent — aubergines, piments, tomates précoces — sous lampe ou véranda chaude.",
  },
  {
    month: '03',
    intro:
      "Mars ouvre vraiment la saison. Les châssis se remplissent, on tente les premières salades dehors, on lance tomates et courgettes sous abri.",
  },
  {
    month: '04',
    intro:
      "Avril bouscule tout. Le potager se remplit : semis directs de carottes, pois, radis, et la suite des solanacées sous abri en attendant les saints de glace.",
  },
  {
    month: '05',
    intro:
      "Mai est le mois des grandes mises en terre — après les saints de glace mi-mai, courgettes, tomates, poivrons rejoignent enfin le plein air.",
  },
  {
    month: '06',
    intro:
      "Juin entretient. On échelonne salades et haricots, on tuteure, on récolte les premières fraises et les petits pois.",
  },
  {
    month: '07',
    intro:
      "Juillet : on récolte autant qu'on sème. Salades d'été résistantes, mâche, choux d'hiver, navets — c'est le moment de penser à l'automne.",
  },
  {
    month: '08',
    intro:
      "Août regarde déjà l'automne. Les derniers semis pour récolter avant le gel : épinards, mâche, radis d'hiver, engrais verts.",
  },
  {
    month: '09',
    intro:
      "Septembre clôt en douceur. Mâche, épinards, salades d'hiver sous tunnel, et l'on couvre les sols nus d'engrais verts.",
  },
  {
    month: '10',
    intro:
      "Octobre, on protège plus qu'on ne sème. Quelques fèves et pois pour passer l'hiver, ail et échalotes en place.",
  },
  {
    month: '11',
    intro:
      "Novembre invite au repos. On plante l'ail, on prépare les sols, on rêve déjà de la saison qui vient.",
  },
  {
    month: '12',
    intro:
      "Décembre : pause. Quelques rares semis sous serre chauffée, et beaucoup de planification pour l'année qui vient.",
  },
]

async function main() {
  const payload = await getPayloadClient()

  for (const item of INTROS) {
    const { docs } = await payload.find({
      collection: 'month-intros',
      where: { month: { equals: item.month } },
      limit: 1,
    })
    if (docs.length) {
      // Ne pas écraser si déjà éditée — on update seulement si vide.
      const existing = docs[0] as { intro?: string }
      if (existing.intro && existing.intro.trim().length > 0) {
        console.log(`↷ skip ${item.month} (déjà rédigée)`)
        continue
      }
      await payload.update({
        collection: 'month-intros',
        id: docs[0].id,
        data: item,
        overrideAccess: true,
      })
      console.log(`↻ updated ${item.month}`)
    } else {
      await payload.create({
        collection: 'month-intros',
        data: item,
        overrideAccess: true,
      })
      console.log(`✓ created ${item.month}`)
    }
  }

  console.log('\nMonth intros seeded.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
