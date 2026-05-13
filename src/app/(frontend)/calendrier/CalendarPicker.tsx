'use client'

import Link from 'next/link'
import { useState } from 'react'

import { SowingWindowBadge } from '@/components/SowingWindowBadge'

type Plant = {
  id: string | number
  slug: string
  name: string
  sowingWindow?: { startMonth?: string; endMonth?: string; note?: string }
}

type MonthBucket = {
  value: string
  label: string
  short: string
  plants: Plant[]
}

export function CalendarPicker({
  months,
  initialMonth,
}: {
  months: MonthBucket[]
  initialMonth: string
}) {
  const [active, setActive] = useState(initialMonth)
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
            {current.plants.length
              ? `${current.plants.length} plante${
                  current.plants.length > 1 ? 's' : ''
                } à semer`
              : 'Aucune fenêtre de semis ouverte'}
          </p>
        </div>

        {current.plants.length ? (
          <ul className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {current.plants.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/bibliotheque/${p.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-soft px-3 py-2.5 transition-colors hover:bg-cream-warm"
                >
                  <span className="font-serif text-lg text-green-deep group-hover:text-tomato">
                    {p.name}
                  </span>
                  {p.sowingWindow?.startMonth && p.sowingWindow?.endMonth ? (
                    <SowingWindowBadge
                      startMonth={p.sowingWindow.startMonth}
                      endMonth={p.sowingWindow.endMonth}
                      highlightActive={false}
                    />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 max-w-prose text-ink-soft">
            Pause hivernale (ou estivale) — rien à semer ici. Explore un autre
            mois ci-dessus.
          </p>
        )}
      </div>
    </>
  )
}
