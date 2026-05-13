import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CompanionsList, type Companion } from '@/components/CompanionsList'
import { Container } from '@/components/Container'
import { RichText } from '@/components/RichText'
import { SowingCard } from '@/components/SowingCard'
import { SowingWindowBadge } from '@/components/SowingWindowBadge'
import { StageTimeline } from '@/components/StageTimeline'
import { TipCard } from '@/components/TipCard'
import { getPayloadClient } from '@/lib/payload'


type Params = { slug: string }

async function getPlant(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'plants',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
}

type Pairing = { plant: PlantLite | string | number; note?: string | null }
type PlantLite = {
  id: string | number
  slug: string
  name: string
  latinName?: string | null
  coverImage?: { url?: string | null; alt?: string | null } | string | null
  companions?: Pairing[]
  incompatibles?: Pairing[]
}

/**
 * Lecture bi-directionnelle d'un champ d'associations (companions ou
 * incompatibles) sur une plante :
 *  - direct : entrées listées par CETTE plante
 *  - reverse : entrées d'autres plantes qui mentionnent CELLE-ci
 * Dédupliqué par slug, la note de l'entrée directe l'emporte si conflit.
 */
async function getPairings(
  plantId: string | number,
  field: 'companions' | 'incompatibles',
): Promise<Companion[]> {
  try {
    const payload = await getPayloadClient()

    const own = (await payload.findByID({
      collection: 'plants',
      id: plantId,
      depth: 2,
    })) as PlantLite

    const { docs: reverseDocs } = await payload.find({
      collection: 'plants',
      where: { [`${field}.plant`]: { equals: plantId } },
      limit: 50,
      depth: 1,
    })

    const map = new Map<string, Companion>()

    for (const c of (own[field] ?? []) as Pairing[]) {
      const p = c.plant
      if (!p || typeof p !== 'object' || !p.slug) continue
      const img =
        p.coverImage && typeof p.coverImage === 'object' ? p.coverImage : null
      map.set(p.slug, {
        slug: p.slug,
        name: p.name,
        latinName: p.latinName,
        coverImage: img,
        note: c.note ?? null,
      })
    }

    for (const r of reverseDocs as PlantLite[]) {
      if (map.has(r.slug)) continue
      const matching = (r[field] ?? []).find((c: Pairing) => {
        const p = c.plant
        return (
          (typeof p === 'object' && p?.id === plantId) || p === plantId
        )
      })
      const img =
        r.coverImage && typeof r.coverImage === 'object' ? r.coverImage : null
      map.set(r.slug, {
        slug: r.slug,
        name: r.name,
        latinName: r.latinName,
        coverImage: img,
        note: matching?.note ?? null,
      })
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

async function getSowingsForPlant(plantId: string | number) {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'sowings',
      where: {
        and: [
          { plant: { equals: plantId } },
          { visibility: { equals: 'public' } },
        ],
      },
      limit: 6,
      sort: '-updatedAt',
      depth: 2,
    })
    return docs
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const plant = await getPlant(slug)
  if (!plant) return { title: 'Plante introuvable' }
  return {
    title: plant.name,
    description: plant.latinName ? `${plant.name} (${plant.latinName})` : plant.name,
  }
}

export default async function PlantPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const plant = await getPlant(slug)
  if (!plant) notFound()

  const [sowings, companions, incompatibles] = await Promise.all([
    getSowingsForPlant(plant.id),
    getPairings(plant.id, 'companions'),
    getPairings(plant.id, 'incompatibles'),
  ])
  const cover =
    plant.coverImage && typeof plant.coverImage === 'object'
      ? plant.coverImage
      : null

  type ResolvedTip = { slug: string; title: string }
  const tips: ResolvedTip[] = Array.isArray(plant.relatedTips)
    ? (plant.relatedTips.filter(
        (t) => typeof t === 'object' && t !== null && 'slug' in t,
      ) as unknown as ResolvedTip[])
    : []

  return (
    <>
      {/* Header plante */}
      <section className="border-b border-green-soft/40 py-16">
        <Container>
          <Link
            href="/bibliotheque"
            className="text-sm uppercase tracking-[0.14em] text-ink-soft hover:text-tomato"
          >
            ← Bibliothèque
          </Link>
          <div className="mt-8 grid gap-12 md:grid-cols-[auto,1fr] md:items-start">
            <div className="aspect-square relative w-full max-w-[360px] overflow-hidden rounded-pillow bg-sand-soft">
              {cover?.url ? (
                <Image
                  src={cover.url}
                  alt={cover.alt ?? ''}
                  fill
                  priority
                  sizes="(min-width: 768px) 360px, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-8xl text-green-sage/40">
                  ✿
                </div>
              )}
            </div>
            <div>
              <h1 className="font-serif text-5xl text-green-deep md:text-6xl">
                {plant.name}
              </h1>
              {plant.latinName ? (
                <p className="mt-2 text-lg italic text-ink-soft">
                  {plant.latinName}
                </p>
              ) : null}
              {plant.sowingWindow?.startMonth && plant.sowingWindow?.endMonth ? (
                <div className="mt-6">
                  <SowingWindowBadge
                    startMonth={plant.sowingWindow.startMonth}
                    endMonth={plant.sowingWindow.endMonth}
                  />
                  {plant.sowingWindow.note ? (
                    <p className="mt-3 max-w-prose text-sm text-ink-soft">
                      {plant.sowingWindow.note}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {plant.description ? (
                <div className="prose prose-stone mt-8 max-w-prose leading-relaxed text-ink">
                  <RichText data={plant.description} />
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      {/* Étapes */}
      {plant.typicalStages?.length ? (
        <section className="py-16">
          <Container>
            <h2 className="font-serif text-3xl text-green-deep">
              Étapes typiques
            </h2>
            <p className="mt-2 max-w-prose text-sm text-ink-soft">
              Repères indicatifs — chaque jardin et chaque saison écrivent leur
              propre histoire.
            </p>
            <div className="mt-10">
              <StageTimeline stages={plant.typicalStages} />
            </div>
          </Container>
        </section>
      ) : null}

      {/* Cultures associées (pluriculture) */}
      {companions.length ? (
        <section className="bg-cream-warm py-16">
          <Container>
            <h2 className="font-serif text-3xl text-green-deep">
              Cultures associées
            </h2>
            <p className="mt-2 max-w-prose text-sm text-ink-soft">
              Les plantes qui se plaisent à côté du {plant.name.toLowerCase()} —
              et pourquoi. Glanées d&apos;une saison à l&apos;autre.
            </p>
            <div className="mt-10">
              <CompanionsList companions={companions} />
            </div>
          </Container>
        </section>
      ) : null}

      {/* Cultures à éviter */}
      {incompatibles.length ? (
        <section className="py-16">
          <Container>
            <h2 className="font-serif text-3xl text-green-deep">
              À ne pas planter ensemble
            </h2>
            <p className="mt-2 max-w-prose text-sm text-ink-soft">
              Voisinages connus pour mal tourner avec le {plant.name.toLowerCase()} —
              concurrences, maladies partagées, allélopathie.
            </p>
            <div className="mt-10">
              <CompanionsList companions={incompatibles} variant="warn" />
            </div>
          </Container>
        </section>
      ) : null}

      {/* Tips associés */}
      {tips.length ? (
        <section className="bg-green-deep/[0.04] py-16">
          <Container>
            <h2 className="font-serif text-3xl text-green-deep">
              Tips associés
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tips.map((tip) => (
                <TipCard key={tip.slug} tip={tip} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Semis de la communauté pour cette plante */}
      {sowings.length ? (
        <section className="py-16">
          <Container>
            <h2 className="font-serif text-3xl text-green-deep">
              {plant.name} dans la communauté
            </h2>
            <p className="mt-2 max-w-prose text-sm text-ink-soft">
              Comment d&apos;autres jardiniers s&apos;y prennent.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sowings.map((sowing) => (
                <SowingCard key={sowing.id} sowing={sowing} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  )
}
