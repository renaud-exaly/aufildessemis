import { MONTHS } from '@/lib/stages'

export const monthLabel = (value: string): string =>
  MONTHS.find((m) => m.value === value)?.label ?? value

export const currentMonth = (): string =>
  String(new Date().getMonth() + 1).padStart(2, '0')

/**
 * Slugs ASCII pour les URLs SEO `/calendrier/[mois]`. Sans accent ni cédille
 * (`fevrier`, `aout`, `decembre`) pour des URLs propres et compatibles partout.
 */
export const MONTH_SLUGS: Record<string, string> = {
  '01': 'janvier',
  '02': 'fevrier',
  '03': 'mars',
  '04': 'avril',
  '05': 'mai',
  '06': 'juin',
  '07': 'juillet',
  '08': 'aout',
  '09': 'septembre',
  '10': 'octobre',
  '11': 'novembre',
  '12': 'decembre',
}

const SLUG_TO_MONTH: Record<string, string> = Object.fromEntries(
  Object.entries(MONTH_SLUGS).map(([value, slug]) => [slug, value]),
)

export const monthSlug = (value: string): string | undefined =>
  MONTH_SLUGS[value]

export const slugToMonth = (slug: string): string | undefined =>
  SLUG_TO_MONTH[slug]

export const allMonthSlugs = (): string[] => Object.values(MONTH_SLUGS)

/** Mois précédent (01 → 12, 12 → 11). */
export const prevMonth = (value: string): string => {
  const m = parseInt(value, 10)
  const prev = m === 1 ? 12 : m - 1
  return String(prev).padStart(2, '0')
}

/** Mois suivant (12 → 01). */
export const nextMonth = (value: string): string => {
  const m = parseInt(value, 10)
  const next = m === 12 ? 1 : m + 1
  return String(next).padStart(2, '0')
}

/** True if `month` (e.g. '05') is within the inclusive window [start, end]. */
export const isInWindow = (month: string, start: string, end: string): boolean => {
  const m = parseInt(month, 10)
  const s = parseInt(start, 10)
  const e = parseInt(end, 10)
  if (s <= e) return m >= s && m <= e
  // Window wraps across year-end (rare but supported).
  return m >= s || m <= e
}

export const formatSowingWindow = (
  startMonth: string,
  endMonth: string,
): string => {
  if (startMonth === endMonth) return monthLabel(startMonth)
  return `${monthLabel(startMonth)} → ${monthLabel(endMonth)}`
}
