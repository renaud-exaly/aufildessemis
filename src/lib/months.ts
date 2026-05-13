import { MONTHS } from '@/lib/stages'

export const monthLabel = (value: string): string =>
  MONTHS.find((m) => m.value === value)?.label ?? value

export const currentMonth = (): string =>
  String(new Date().getMonth() + 1).padStart(2, '0')

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
