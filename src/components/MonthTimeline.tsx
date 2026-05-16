import { MONTHS } from '@/lib/stages'
import { formatSowingWindow, isInWindow } from '@/lib/months'

type Props = {
  startMonth: string
  endMonth: string
  /** The month being viewed (gets a distinct highlight). */
  activeMonth?: string | null
}

/**
 * Petite bande de 12 cellules représentant l'année. Les mois "ouverts" sont
 * colorés, le mois actif est marqué d'un anneau, et le mois de départ porte
 * un point plus foncé. Plus lisible qu'un badge texte quand on liste plein
 * de plantes côte à côte.
 */
export function MonthTimeline({ startMonth, endMonth, activeMonth = null }: Props) {
  const label = formatSowingWindow(startMonth, endMonth)
  return (
    <div
      className="inline-flex items-center gap-[3px]"
      role="img"
      aria-label={`Fenêtre de semis : ${label}`}
      title={label}
    >
      {MONTHS.map((m) => {
        const open = isInWindow(m.value, startMonth, endMonth)
        const isActive = activeMonth === m.value
        const isStart = open && m.value === startMonth

        let cellClass: string
        if (isActive && open) {
          cellClass = 'bg-green-deep'
        } else if (open) {
          cellClass = 'bg-green-sage'
        } else {
          cellClass = 'bg-green-soft/40'
        }

        return (
          <span
            key={m.value}
            aria-hidden
            className={`relative h-2.5 w-2 rounded-[2px] ${cellClass} ${
              isActive ? 'ring-1 ring-green-deep ring-offset-1 ring-offset-cream-warm' : ''
            }`}
          >
            {isStart ? (
              <span
                className={`absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                  isActive ? 'bg-cream-warm' : 'bg-green-deep'
                }`}
              />
            ) : null}
          </span>
        )
      })}
    </div>
  )
}
