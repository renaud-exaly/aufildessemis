import { formatSowingWindow, currentMonth, isInWindow } from '@/lib/months'

type Props = {
  startMonth: string
  endMonth: string
  highlightActive?: boolean
}

export function SowingWindowBadge({ startMonth, endMonth, highlightActive = true }: Props) {
  const active = highlightActive && isInWindow(currentMonth(), startMonth, endMonth)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${
        active
          ? 'bg-tomato/10 text-tomato'
          : 'bg-green-soft/40 text-green-deep'
      }`}
      title={active ? 'C’est le moment de semer' : undefined}
    >
      <span aria-hidden>{active ? '●' : '◦'}</span>
      {formatSowingWindow(startMonth, endMonth)}
    </span>
  )
}
