'use client'

import Link from 'next/link'
import { useState } from 'react'

import { MonthTimeline } from '@/components/MonthTimeline'

import type { CalendarPlant, MonthBucket } from './page'

export function CalendarPicker({
  months,
  initialMonth,
  yearRound,
}: {
  months: MonthBucket[]
  initialMonth: string
  yearRound: CalendarPlant[]
}) {
  const [active, setActive] = useState(initialMonth)
  const [yearRoundOpen, setYearRoundOpen] = useState(false)
  const current = months.find((m) => m.value === active) ?? months[0]
  const isCurrentMonth = active === initialMonth

  return (
    <>
      {/* Pills mois */}
      <div className="relative">
        <div
          role="tablist"
          aria-label="Mois"
          className="flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:thin] sm:flex-wrap sm:gap-2.5 sm:overflow-visible"
        >
          {months.map((m) => {
            const selected = m.value === active
            const isCurrent = m.value === initialMonth
            return (
              <button
                key={m.value}
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(m.value)}
                className={`relative shrink-0 snap-start rounded-full px-4 py-2 text-sm font-medium tracking-[0.04em] transition-colors ${
                  selected
                    ? 'bg-green-deep text-white shadow-warm'
                    : 'border border-green-soft/60 bg-cream-warm text-green-deep hover:bg-cream'
                }`}
              >
                <span className="sm:hidden">{m.short}</span>
                <span className="hidden sm:inline">{m.label}</span>
                {isCurrent && !selected ? (
                  <span
                    aria-hidden
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-tomato ring-2 ring-cream"
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      {/* Liste du mois actif */}
      <div className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-green-soft/40 pb-4">
          <h2 className="font-serif text-3xl text-green-deep md:text-4xl">
            {current.label}
            {isCurrentMonth ? (
              <span className="ml-3 align-middle text-xs uppercase tracking-[0.16em] text-tomato">
                Ce mois-ci
              </span>
            ) : null}
          </h2>
          <p className="text-sm text-ink-soft">
            {current.count
              ? `${current.count} plante${current.count > 1 ? 's' : ''} saisonnière${current.count > 1 ? 's' : ''} à semer`
              : 'Aucune fenêtre de semis saisonnière ouverte'}
          </p>
        </div>

        {current.groups.length ? (
          <div className="mt-10 flex flex-col gap-12">
            {current.groups.map((group) => (
              <section key={group.category}>
                <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-green-sage">
                  {group.label}
                  <span className="ml-2 normal-case tracking-normal text-ink-soft/70">
                    · {group.plants.length}
                  </span>
                </h3>
                <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                  {group.plants.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/bibliotheque/${p.slug}`}
                        className="group flex items-center justify-between gap-3 rounded-soft px-3 py-2.5 transition-colors hover:bg-cream-warm"
                      >
                        <span className="flex items-baseline gap-2 min-w-0">
                          <span className="font-serif text-lg text-green-deep group-hover:text-tomato truncate">
                            {p.name}
                          </span>
                          {p.startsHere ? (
                            <span
                              className="shrink-0 rounded-full bg-tomato/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-tomato"
                              title="La fenêtre de semis démarre ce mois-ci"
                            >
                              Démarre
                            </span>
                          ) : null}
                        </span>
                        <MonthTimeline
                          startMonth={p.startMonth}
                          endMonth={p.endMonth}
                          activeMonth={current.value}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <p className="mt-8 max-w-prose text-ink-soft">
            Pause hivernale (ou estivale) — rien à semer ici. Explore un autre
            mois ci-dessus.
          </p>
        )}

        {/* Section repliable : plantes à fenêtre toute l'année */}
        {yearRound.length ? (
          <section className="mt-16 border-t border-green-soft/40 pt-8">
            <button
              type="button"
              onClick={() => setYearRoundOpen((v) => !v)}
              aria-expanded={yearRoundOpen}
              className="group flex w-full items-center justify-between gap-3 rounded-soft text-left transition-colors hover:text-green-deep"
            >
              <span>
                <span className="font-serif text-xl text-green-deep">
                  Toujours possibles
                </span>
                <span className="ml-2 text-sm text-ink-soft">
                  · {yearRound.length} plantes à fenêtre ouverte toute
                  l&apos;année
                </span>
              </span>
              <span
                aria-hidden
                className={`shrink-0 text-green-sage transition-transform ${
                  yearRoundOpen ? 'rotate-180' : ''
                }`}
              >
                <ChevronIcon />
              </span>
            </button>
            {yearRoundOpen ? (
              <ul className="mt-6 flex flex-wrap gap-x-2 gap-y-2">
                {yearRound.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/bibliotheque/${p.slug}`}
                      className="inline-flex rounded-full border border-green-soft/60 bg-cream-warm px-3 py-1.5 text-sm text-green-deep transition-colors hover:border-green-deep hover:bg-cream"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  )
}

function ChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
