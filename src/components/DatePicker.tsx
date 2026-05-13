'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

type Props = {
  name: string
  label: string
  defaultValue?: string // YYYY-MM-DD
  required?: boolean
  min?: string
  max?: string
}

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const
const MONTHS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const

function fmtIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseIso(value: string): Date | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(d.getTime())) return null
  return d
}

function fmtHuman(d: Date): string {
  return d.toLocaleDateString('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Date picker custom : popover mois, navigation clavier (←/→/↑/↓), aujourd'hui
// en raccourci, valeur synchronisée dans un hidden input pour FormData.
export function DatePicker({
  name,
  label,
  defaultValue,
  required = false,
  min,
  max,
}: Props) {
  const id = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const initial = defaultValue ? parseIso(defaultValue) : new Date()
  const [selected, setSelected] = useState<Date | null>(
    initial && !Number.isNaN(initial.getTime()) ? initial : null,
  )
  const [view, setView] = useState<Date>(initial ?? new Date())
  const [open, setOpen] = useState(false)

  const minDate = min ? parseIso(min) : null
  const maxDate = max ? parseIso(max) : null

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const grid = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1)
    const startOffset = (first.getDay() + 6) % 7 // lundi = 0
    const daysInMonth = new Date(
      view.getFullYear(),
      view.getMonth() + 1,
      0,
    ).getDate()
    const cells: Array<{ date: Date | null }> = []
    for (let i = 0; i < startOffset; i++) cells.push({ date: null })
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(view.getFullYear(), view.getMonth(), d) })
    }
    while (cells.length % 7 !== 0) cells.push({ date: null })
    return cells
  }, [view])

  function isDisabled(d: Date): boolean {
    if (minDate && d < minDate) return true
    if (maxDate && d > maxDate) return true
    return false
  }
  function isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  function pick(d: Date) {
    if (isDisabled(d)) return
    setSelected(d)
    setView(d)
    setOpen(false)
  }

  function shift(months: number) {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + months, 1))
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (!selected) return
    const map: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    }
    const delta = map[e.key]
    if (delta !== undefined) {
      e.preventDefault()
      const next = new Date(selected)
      next.setDate(next.getDate() + delta)
      if (!isDisabled(next)) {
        setSelected(next)
        setView(next)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      setOpen(false)
    }
  }

  const today = new Date()

  return (
    <div ref={wrapperRef} className="relative" onKeyDown={onKeyDown}>
      <label htmlFor={`${id}-btn`} className="block">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
          {label}
        </span>
      </label>
      <button
        id={`${id}-btn`}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="mt-2 flex w-full items-center justify-between gap-3 rounded-soft border border-green-soft/60 bg-cream-warm px-4 py-3 text-left font-sans text-base text-ink hover:bg-cream focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep/30"
      >
        <span className={selected ? '' : 'text-ink-soft/70'}>
          {selected ? fmtHuman(selected) : 'Choisis une date'}
        </span>
        <span aria-hidden className="text-ink-soft">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2.5" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </span>
      </button>

      <input
        type="hidden"
        name={name}
        value={selected ? fmtIso(selected) : ''}
        required={required}
      />

      {open ? (
        <div
          role="dialog"
          aria-label="Choisir une date"
          className="absolute z-30 mt-2 w-[20rem] rounded-pillow border border-green-soft/60 bg-cream p-4 shadow-leaf"
        >
          {/* Nav mois */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shift(-1)}
              aria-label="Mois précédent"
              className="rounded-full p-2 text-green-deep hover:bg-cream-warm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div className="font-serif text-lg text-green-deep">
              {MONTHS_FR[view.getMonth()]} {view.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() => shift(1)}
              aria-label="Mois suivant"
              className="rounded-full p-2 text-green-deep hover:bg-cream-warm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Jours de semaine */}
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
            {WEEK_DAYS.map((d, i) => (
              <div key={i} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Grille jours */}
          <div className="mt-1 grid grid-cols-7 gap-1">
            {grid.map((cell, i) => {
              if (!cell.date) {
                return <div key={i} aria-hidden />
              }
              const d = cell.date
              const isSel = selected && isSameDay(d, selected)
              const isToday = isSameDay(d, today)
              const disabled = isDisabled(d)
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => pick(d)}
                  disabled={disabled}
                  className={`aspect-square rounded-full text-sm transition-colors ${
                    isSel
                      ? 'bg-green-deep text-white'
                      : disabled
                        ? 'cursor-not-allowed text-ink-soft/30'
                        : isToday
                          ? 'border border-tomato/60 text-tomato hover:bg-tomato/[0.06]'
                          : 'text-ink hover:bg-cream-warm'
                  }`}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          {/* Raccourcis */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-green-soft/40 pt-3 text-xs">
            <button
              type="button"
              onClick={() => {
                pick(new Date())
              }}
              className="rounded-full px-3 py-1.5 text-green-deep hover:bg-cream-warm"
            >
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-green-deep px-4 py-1.5 font-semibold text-white hover:bg-[#234034]"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
