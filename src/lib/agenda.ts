import type { Payload } from 'payload'

import { currentMonth, formatSowingWindow, isInWindow } from './months'
import { SOWING_STAGES, type SowingStage } from './stages'

const stageLabel = (value: string): string =>
  SOWING_STAGES.find((s) => s.value === value)?.label ?? value

export type AgendaWish = {
  plantId: number | string
  plantSlug: string
  plantName: string
  windowLabel: string
  cover: { url: string; alt: string } | null
}

export type AgendaPendingStage = {
  sowingId: number | string
  sowingName: string
  plantName: string
  nextStage: string
  nextStageLabel: string
  tip: string | null
  daysOverdue: number | null
  cover: { url: string; alt: string } | null
}

export type AgendaResult = {
  wishesToSow: AgendaWish[]
  pendingStages: AgendaPendingStage[]
}

function readCover(plant: unknown): { url: string; alt: string } | null {
  if (!plant || typeof plant !== 'object') return null
  const c = (plant as { coverImage?: unknown }).coverImage
  if (!c || typeof c !== 'object') return null
  const obj = c as { url?: string | null; alt?: string | null; sizes?: { card?: { url?: string | null } } }
  const url = obj.sizes?.card?.url ?? obj.url
  if (!url) return null
  return { url, alt: obj.alt ?? '' }
}

/**
 * Calcule l'agenda d'un utilisateur :
 *  - envies dont la fenêtre de semis est ouverte ce mois-ci ET pas encore semées cette année
 *  - lots actifs dont l'étape suivante est attendue dans ≤ 7 jours
 *    (ou déjà en retard).
 */
export async function getAgendaForUser(
  payload: Payload,
  userId: number | string,
): Promise<AgendaResult> {
  const month = currentMonth()
  const year = new Date().getUTCFullYear()

  // --- 1. Envies dont la fenêtre est ouverte ce mois-ci -----------------
  const { docs: wishes } = await payload.find({
    collection: 'plant-wishes',
    where: {
      and: [{ user: { equals: Number(userId) } }, { dismissed: { equals: false } }],
    },
    depth: 2,
    limit: 200,
    overrideAccess: true,
  })

  const wishesToSow: AgendaWish[] = []
  for (const w of wishes as unknown as Array<{
    plant?: {
      id: number | string
      slug: string
      name: string
      sowingWindow?: { startMonth?: string | null; endMonth?: string | null } | null
      coverImage?: unknown
    }
  }>) {
    const plant = w.plant
    if (!plant || typeof plant !== 'object') continue
    const start = plant.sowingWindow?.startMonth
    const end = plant.sowingWindow?.endMonth
    if (!start || !end) continue
    if (!isInWindow(month, start, end)) continue

    // Skip si l'utilisateur a déjà un Sowing pour cette plante cette année.
    const { totalDocs: alreadySown } = await payload.count({
      collection: 'sowings',
      where: {
        and: [
          { owner: { equals: Number(userId) } },
          { plant: { equals: plant.id } },
          {
            startedAt: { greater_than_equal: new Date(year, 0, 1).toISOString() },
          },
        ],
      },
      overrideAccess: true,
    })
    if (alreadySown > 0) continue

    wishesToSow.push({
      plantId: plant.id,
      plantSlug: plant.slug,
      plantName: plant.name,
      windowLabel: formatSowingWindow(start, end),
      cover: readCover(plant),
    })
  }

  // --- 2. Lots actifs dont la prochaine étape est due -------------------
  const { docs: sowings } = await payload.find({
    collection: 'sowings',
    where: { owner: { equals: Number(userId) } },
    depth: 2,
    limit: 200,
    overrideAccess: true,
  })

  const pendingStages: AgendaPendingStage[] = []
  for (const sowing of sowings as unknown as Array<{
    id: number | string
    name: string
    currentStage?: string | null
    plant?: {
      name?: string
      typicalStages?: Array<{
        stage: SowingStage
        daysFromPrevious?: number | null
        tip?: string | null
      }>
      coverImage?: unknown
    } | string | number
  }>) {
    if (!sowing.plant || typeof sowing.plant !== 'object') continue
    const stages = sowing.plant.typicalStages
    if (!Array.isArray(stages) || !stages.length) continue

    // Dernière update avec une étape, pour calculer "due date".
    const { docs: updates } = await payload.find({
      collection: 'sowing-updates',
      where: {
        and: [
          { sowing: { equals: sowing.id } },
          { stage: { exists: true } },
        ],
      },
      sort: '-date',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const lastStaged = updates[0] as { stage?: string; date?: string } | undefined

    let nextStageMeta:
      | { stage: SowingStage; daysFromPrevious?: number | null; tip?: string | null }
      | null = null
    let lastStageDate: Date | null = null

    if (!lastStaged?.stage) {
      // Aucune étape enregistrée → prochain pas attendu = première étape de la plante.
      nextStageMeta = stages[0]
      lastStageDate = null
    } else {
      const idx = stages.findIndex((s) => s.stage === lastStaged.stage)
      if (idx < 0 || idx >= stages.length - 1) continue // terminé / inconnu
      nextStageMeta = stages[idx + 1]
      lastStageDate = lastStaged.date ? new Date(lastStaged.date) : null
    }
    if (!nextStageMeta) continue

    const threshold = nextStageMeta.daysFromPrevious ?? 14
    let daysOverdue: number | null = null
    if (lastStageDate) {
      const daysSince =
        (Date.now() - lastStageDate.getTime()) / (1000 * 60 * 60 * 24)
      const overdue = daysSince - threshold
      // Surface dès que c'est dans les 7 derniers jours ou en retard.
      if (overdue < -7) continue
      daysOverdue = Math.round(overdue)
    }

    pendingStages.push({
      sowingId: sowing.id,
      sowingName: sowing.name,
      plantName: sowing.plant.name ?? '',
      nextStage: nextStageMeta.stage,
      nextStageLabel: stageLabel(nextStageMeta.stage),
      tip: nextStageMeta.tip ?? null,
      daysOverdue,
      cover: readCover(sowing.plant),
    })
  }

  // Trie : les plus en retard d'abord, puis les imminents.
  pendingStages.sort((a, b) => (b.daysOverdue ?? -999) - (a.daysOverdue ?? -999))

  return { wishesToSow, pendingStages }
}
