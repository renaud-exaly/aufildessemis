'use client'

import { useDeferredValue, useMemo, useState } from 'react'

import { PLANT_CATEGORIES, type PlantCategory } from '@/lib/categories'

import { PlantCard } from './PlantCard'

type Plant = Parameters<typeof PlantCard>[0]['plant'] & {
  id: string | number
  category?: PlantCategory | null
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

export function BibliothequeGrid({ plants }: { plants: Plant[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PlantCategory | 'all'>('all')
  const deferredQuery = useDeferredValue(query)

  const indexed = useMemo(
    () =>
      plants.map((plant) => ({
        plant,
        haystack: normalize(
          [plant.name, plant.latinName ?? '', plant.slug].join(' '),
        ),
      })),
    [plants],
  )

  const availableCategories = useMemo(() => {
    const present = new Set(
      plants.map((p) => p.category).filter(Boolean) as PlantCategory[],
    )
    return PLANT_CATEGORIES.filter((c) => present.has(c.value))
  }, [plants])

  const needle = normalize(deferredQuery)
  const filtered = indexed.filter(({ plant, haystack }) => {
    if (category !== 'all' && plant.category !== category) return false
    if (needle && !haystack.includes(needle)) return false
    return true
  })

  return (
    <>
      <div className="mb-6 max-w-xl">
        <label className="block">
          <span className="sr-only">Rechercher une plante</span>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 grid w-12 place-items-center text-ink-soft"
            >
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une plante…"
              className="w-full rounded-soft border border-green-soft/60 bg-cream-warm py-3 pl-12 pr-4 font-sans text-base text-ink placeholder:text-ink-soft/60 focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep/30"
            />
          </div>
        </label>
      </div>

      {availableCategories.length > 1 ? (
        <div
          className="mb-10 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0 md:pb-0"
          role="group"
          aria-label="Filtrer par catégorie"
        >
          <CategoryPill
            label="Tout"
            active={category === 'all'}
            onClick={() => setCategory('all')}
          />
          {availableCategories.map((c) => (
            <CategoryPill
              key={c.value}
              label={c.label}
              active={category === c.value}
              onClick={() => setCategory(c.value)}
            />
          ))}
        </div>
      ) : null}

      {filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ plant }, idx) => (
            <PlantCard key={plant.id} plant={plant} priority={idx < 3} />
          ))}
        </div>
      ) : (
        <p className="text-center text-ink-soft">
          Aucune plante ne correspond à cette recherche.
        </p>
      )}
    </>
  )
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-green-deep bg-green-deep text-cream-warm'
          : 'border-green-soft/60 bg-cream-warm text-ink-soft hover:border-green-deep hover:text-green-deep'
      }`}
    >
      {label}
    </button>
  )
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}
