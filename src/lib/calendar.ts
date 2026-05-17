import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import {
  PLANT_CATEGORIES,
  PLANT_CATEGORY_LABEL,
  type PlantCategory,
} from '@/lib/categories'
import { isInWindow, monthLabel } from '@/lib/months'
import { getPayloadClient } from '@/lib/payload'
import { MONTHS } from '@/lib/stages'

export type CalendarPlant = {
  id: string | number
  slug: string
  name: string
  category?: PlantCategory | null
  startMonth: string
  endMonth: string
}

export type CalendarPlantInMonth = CalendarPlant & {
  /** True si la fenêtre de cette plante démarre exactement le mois en cours. */
  startsHere: boolean
}

export type CalendarGroup = {
  category: PlantCategory | 'autres'
  label: string
  plants: CalendarPlantInMonth[]
}

export type MonthBucket = {
  value: string
  label: string
  short: string
  /** Plantes saisonnières à semer ce mois-ci, regroupées par catégorie. */
  groups: CalendarGroup[]
  /** Compte total de plantes saisonnières (toutes catégories confondues). */
  count: number
}

export const SHORT_MONTHS: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fév',
  '03': 'Mars',
  '04': 'Avr',
  '05': 'Mai',
  '06': 'Juin',
  '07': 'Juil',
  '08': 'Août',
  '09': 'Sept',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Déc',
}

const CATEGORY_ORDER: (PlantCategory | 'autres')[] = [
  ...PLANT_CATEGORIES.map((c) => c.value),
  'autres',
]

export const isYearRound = (start: string, end: string): boolean =>
  start === '01' && end === '12'

type RawPlant = {
  id: string | number
  slug: string
  name: string
  category?: PlantCategory | null
  sowingWindow?: { startMonth?: string; endMonth?: string; note?: string }
}

export async function fetchAllPlantsForCalendar(): Promise<RawPlant[]> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'plants',
      limit: 500,
      sort: 'name',
      depth: 0,
    })
    return docs as RawPlant[]
  } catch {
    return []
  }
}

export function splitSeasonal(raw: RawPlant[]): {
  seasonal: CalendarPlant[]
  yearRound: CalendarPlant[]
} {
  const withWindow: CalendarPlant[] = raw
    .filter((p) => p.sowingWindow?.startMonth && p.sowingWindow?.endMonth)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category ?? null,
      startMonth: p.sowingWindow!.startMonth!,
      endMonth: p.sowingWindow!.endMonth!,
    }))
  return {
    seasonal: withWindow.filter((p) => !isYearRound(p.startMonth, p.endMonth)),
    yearRound: withWindow.filter((p) => isYearRound(p.startMonth, p.endMonth)),
  }
}

export function groupForMonth(
  seasonal: CalendarPlant[],
  month: string,
): { groups: CalendarGroup[]; count: number } {
  const inMonth: CalendarPlantInMonth[] = seasonal
    .filter((p) => isInWindow(month, p.startMonth, p.endMonth))
    .map((p) => ({ ...p, startsHere: p.startMonth === month }))

  const byCategory = new Map<PlantCategory | 'autres', CalendarPlantInMonth[]>()
  for (const plant of inMonth) {
    const key = plant.category ?? 'autres'
    const list = byCategory.get(key) ?? []
    list.push(plant)
    byCategory.set(key, list)
  }

  const groups: CalendarGroup[] = CATEGORY_ORDER.filter((k) =>
    byCategory.has(k),
  ).map((k) => ({
    category: k,
    label: k === 'autres' ? 'Autres' : PLANT_CATEGORY_LABEL[k],
    plants: byCategory.get(k)!,
  }))

  return { groups, count: inMonth.length }
}

export function buildMonthBuckets(seasonal: CalendarPlant[]): MonthBucket[] {
  return MONTHS.map((m) => {
    const { groups, count } = groupForMonth(seasonal, m.value)
    return {
      value: m.value,
      label: m.label,
      short: SHORT_MONTHS[m.value] ?? m.label,
      groups,
      count,
    }
  })
}

/** Charge plantes + retourne buckets prêts à afficher. */
export async function getCalendarData(): Promise<{
  buckets: MonthBucket[]
  yearRound: CalendarPlant[]
}> {
  const raw = await fetchAllPlantsForCalendar()
  const { seasonal, yearRound } = splitSeasonal(raw)
  return { buckets: buildMonthBuckets(seasonal), yearRound }
}

/** Charge plantes + bucket pour un seul mois (utilisé par `/calendrier/[mois]`). */
export async function getMonthData(month: string): Promise<{
  bucket: MonthBucket
  yearRound: CalendarPlant[]
}> {
  const raw = await fetchAllPlantsForCalendar()
  const { seasonal, yearRound } = splitSeasonal(raw)
  const { groups, count } = groupForMonth(seasonal, month)
  return {
    bucket: {
      value: month,
      label: monthLabel(month),
      short: SHORT_MONTHS[month] ?? monthLabel(month),
      groups,
      count,
    },
    yearRound,
  }
}

/**
 * Charge l'intro éditoriale CMS pour un mois donné. Retourne `null` si pas
 * encore créée (la page utilisera son fallback hardcodé).
 */
export async function getMonthIntro(month: string): Promise<{
  intro: string
  extra: SerializedEditorState | null
} | null> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'month-intros',
      where: { month: { equals: month } },
      limit: 1,
      depth: 0,
    })
    const doc = docs[0] as
      | { intro?: string; extra?: SerializedEditorState | null }
      | undefined
    if (!doc?.intro) return null
    return { intro: doc.intro, extra: doc.extra ?? null }
  } catch {
    return null
  }
}
