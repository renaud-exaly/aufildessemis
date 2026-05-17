import type { Where } from 'payload'
import Link from 'next/link'

import { Container } from '@/components/Container'
import { TipCard } from '@/components/TipCard'
import { getPayloadClient } from '@/lib/payload'
import {
  TIP_CATEGORIES,
  TIP_CATEGORY_LABEL,
  type TipCategory,
} from '@/lib/tips'

export const metadata = {
  title: 'Tips & conseils — astuces de potager',
  description:
    'Conseils, astuces et bonnes pratiques pour ton potager — semis, sol, arrosage, maladies, récolte, climat belge.',
}

export const dynamic = 'force-dynamic'

type SearchParams = {
  q?: string
  categorie?: string
  plante?: string
}

type TipListItem = {
  id: number | string
  slug: string
  title: string
  excerpt?: string | null
  category?: TipCategory | null
  coverImage?: { url?: string | null; alt?: string | null } | null
  plants?: Array<{ id: number | string; name?: string | null; slug?: string | null } | number | string> | null
}

function isCategory(value: string | undefined): value is TipCategory {
  return Boolean(value && TIP_CATEGORIES.some((c) => c.value === value))
}

function buildQueryString(
  params: SearchParams,
  patch: Partial<SearchParams>,
): string {
  const next: Record<string, string> = {}
  for (const [k, v] of Object.entries({ ...params, ...patch })) {
    if (typeof v === 'string' && v.length > 0) next[k] = v
  }
  const qs = new URLSearchParams(next).toString()
  return qs ? `?${qs}` : ''
}

async function fetchPlantsWithTips(): Promise<
  Array<{ id: number | string; name: string; slug: string }>
> {
  try {
    const payload = await getPayloadClient()
    // Liste toutes les plantes — le select est petit (~85 docs).
    const { docs } = await payload.find({
      collection: 'plants',
      limit: 500,
      sort: 'name',
      depth: 0,
    })
    return (docs as Array<{ id: number | string; name?: string; slug?: string }>)
      .filter((p): p is { id: number | string; name: string; slug: string } =>
        Boolean(p.name && p.slug),
      )
      .map((p) => ({ id: p.id, name: p.name, slug: p.slug }))
  } catch {
    return []
  }
}

async function fetchTips(params: SearchParams): Promise<TipListItem[]> {
  try {
    const payload = await getPayloadClient()
    const filters: Where[] = [{ status: { equals: 'published' } }]

    if (isCategory(params.categorie)) {
      filters.push({ category: { equals: params.categorie } })
    }

    if (params.q) {
      const q = params.q.trim()
      if (q.length >= 2) {
        filters.push({
          or: [
            { title: { like: q } },
            { excerpt: { like: q } },
          ],
        })
      }
    }

    if (params.plante) {
      // Filtre par slug : on résout d'abord l'id.
      const { docs: plantDocs } = await payload.find({
        collection: 'plants',
        where: { slug: { equals: params.plante } },
        limit: 1,
        depth: 0,
      })
      const plant = plantDocs[0]
      if (plant) {
        filters.push({ plants: { in: [plant.id] } })
      } else {
        return []
      }
    }

    const { docs } = await payload.find({
      collection: 'tips',
      where: filters.length > 1 ? { and: filters } : filters[0],
      limit: 60,
      sort: '-updatedAt',
      depth: 2,
    })
    return docs as TipListItem[]
  } catch {
    return []
  }
}

export default async function TipsIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [tips, plants] = await Promise.all([fetchTips(params), fetchPlantsWithTips()])

  const activeCategory = isCategory(params.categorie) ? params.categorie : null
  const activePlant = params.plante ?? ''
  const activeQ = params.q ?? ''
  const hasFilter = Boolean(activeCategory || activePlant || activeQ)

  return (
    <>
      <section className="border-b border-green-soft/40 py-20">
        <Container>
          <h1 className="font-serif text-5xl text-green-deep md:text-7xl">
            Le carnet des astuces
          </h1>
          <p className="mt-4 font-serif text-xl italic text-ink-soft">
            Petites trouvailles, méthodes douces.
          </p>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink">
            Leçons apprises au potager — partagées au fil des saisons,
            sous climat belge.
          </p>
        </Container>
      </section>

      {/* Filtres */}
      <section className="border-b border-green-soft/40 bg-cream-warm py-10">
        <Container>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/tips${buildQueryString(params, { categorie: '' })}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium tracking-[0.04em] transition-colors ${
                !activeCategory
                  ? 'bg-green-deep text-white shadow-warm'
                  : 'border border-green-soft/60 bg-cream text-green-deep hover:bg-cream-warm'
              }`}
            >
              Toutes les catégories
            </Link>
            {TIP_CATEGORIES.map((c) => {
              const selected = activeCategory === c.value
              return (
                <Link
                  key={c.value}
                  href={`/tips${buildQueryString(params, { categorie: c.value })}`}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium tracking-[0.04em] transition-colors ${
                    selected
                      ? 'bg-green-deep text-white shadow-warm'
                      : 'border border-green-soft/60 bg-cream text-green-deep hover:bg-cream-warm'
                  }`}
                >
                  {c.label}
                </Link>
              )
            })}
          </div>

          <form
            method="get"
            action="/tips"
            className="mt-6 flex flex-wrap items-end gap-3"
          >
            {/* Garde la catégorie active dans la query si pas changée. */}
            {activeCategory ? (
              <input type="hidden" name="categorie" value={activeCategory} />
            ) : null}
            <label className="flex flex-col gap-1 grow min-w-[220px]">
              <span className="text-xs uppercase tracking-[0.14em] text-ink-soft">
                Rechercher
              </span>
              <input
                type="search"
                name="q"
                defaultValue={activeQ}
                placeholder="ex. mildiou, paillage…"
                className="rounded-soft border border-green-soft/60 bg-cream px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-green-deep focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 min-w-[200px]">
              <span className="text-xs uppercase tracking-[0.14em] text-ink-soft">
                Plante
              </span>
              <select
                name="plante"
                defaultValue={activePlant}
                className="rounded-soft border border-green-soft/60 bg-cream px-3 py-2 text-sm text-ink focus:border-green-deep focus:outline-none"
              >
                <option value="">Toutes les plantes</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-full bg-green-deep px-5 py-2.5 text-sm font-semibold text-white tracking-[0.04em] transition-colors hover:bg-[#234034]"
            >
              Filtrer
            </button>
            {hasFilter ? (
              <Link
                href="/tips"
                className="rounded-full border border-green-deep/30 bg-cream px-4 py-2 text-sm font-medium text-green-deep hover:bg-cream-warm"
              >
                Réinitialiser
              </Link>
            ) : null}
          </form>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <p className="mb-8 text-sm italic text-ink-soft">
            {tips.length === 0
              ? hasFilter
                ? 'Aucun tip ne correspond à ces filtres.'
                : 'Aucun tip publié pour le moment.'
              : `${tips.length} tip${tips.length > 1 ? 's' : ''}${
                  activeCategory
                    ? ` dans « ${TIP_CATEGORY_LABEL[activeCategory]} »`
                    : ''
                }.`}
          </p>

          {tips.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tips.map((tip) => (
                <TipCard key={tip.slug} tip={tip} />
              ))}
            </div>
          ) : null}
        </Container>
      </section>
    </>
  )
}
