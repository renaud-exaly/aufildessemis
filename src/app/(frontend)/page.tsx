import Link from 'next/link'

import { Container } from '@/components/Container'
import { PlantCard } from '@/components/PlantCard'
import { SowingCard } from '@/components/SowingCard'
import { TipCard } from '@/components/TipCard'
import { getPayloadClient } from '@/lib/payload'
import { currentMonth, isInWindow, monthLabel } from '@/lib/months'
import { getLatestSowingPhotos, plantCoverFromSowing } from '@/lib/sowings'


type PlantLite = {
  id: string | number
  name: string
  slug: string
  sowingWindow?: { startMonth?: string; endMonth?: string; note?: string }
}

const seasonLabel = (month: string): string => {
  const m = parseInt(month, 10)
  if (m === 12 || m === 1 || m === 2) return 'cœur de l’hiver'
  if (m === 3) return 'pré-printemps'
  if (m === 4 || m === 5) return 'printemps'
  if (m === 6) return 'lisière d’été'
  if (m === 7 || m === 8) return 'plein été'
  if (m === 9) return 'fin d’été'
  return 'automne'
}

async function getActivePlants(): Promise<PlantLite[]> {
  try {
    const payload = await getPayloadClient()
    const month = currentMonth()
    const { docs } = await payload.find({
      collection: 'plants',
      limit: 24,
      depth: 1,
      sort: 'name',
    })
    return (docs as PlantLite[]).filter((p) =>
      p.sowingWindow?.startMonth && p.sowingWindow?.endMonth
        ? isInWindow(month, p.sowingWindow.startMonth, p.sowingWindow.endMonth)
        : false,
    )
  } catch {
    return []
  }
}

async function getRecentSowings() {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'sowings',
      where: { visibility: { equals: 'public' } },
      limit: 6,
      sort: '-updatedAt',
      depth: 2,
    })
    return docs
  } catch {
    return []
  }
}

async function getRecentTips() {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'tips',
      where: { status: { equals: 'published' } },
      limit: 3,
      sort: '-updatedAt',
      depth: 2,
    })
    return docs
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [activePlants, recentSowings, recentTips] = await Promise.all([
    getActivePlants(),
    getRecentSowings(),
    getRecentTips(),
  ])
  const photoMap = await getLatestSowingPhotos(
    recentSowings.map((s) => s.id),
  )
  const recentSowingsWithCover = recentSowings.map((s) => ({
    ...s,
    latestPhoto:
      photoMap.get(String(s.id)) ?? plantCoverFromSowing(s) ?? undefined,
  }))
  const month = currentMonth()
  const year = new Date().getFullYear()

  return (
    <>
      {/* HERO — spread de carnet */}
      <section className="border-b border-green-soft/40">
        <Container className="grid items-start gap-14 py-20 md:grid-cols-[1.45fr,1fr] md:gap-20 md:py-28">
          <div>
            <p className="font-serif text-xl italic text-ink-soft">
              — {monthLabel(month).toLowerCase()} {year}, {seasonLabel(month)} —
            </p>
            <h1 className="mt-8 font-serif text-5xl leading-[1.05] text-green-deep md:text-[5.5rem]">
              Suivons nos semis,
              <br />
              <em className="font-light">au fil des saisons.</em>
            </h1>
            <p className="mt-10 max-w-xl text-lg leading-relaxed text-ink">
              Un carnet vivant pour observer ce qui pousse, partager ce
              qu&apos;on apprend, et tenir le rythme du potager. Pour celles et
              ceux qui commencent — et qui n&apos;ont jamais fini
              d&apos;apprendre.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="/bibliotheque"
                className="inline-flex items-center gap-2 rounded-full bg-green-deep px-7 py-3.5 text-sm font-semibold text-white tracking-[0.04em] transition-colors hover:bg-[#234034]"
              >
                Parcourir les plantes
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/journal"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-deep underline-offset-[6px] hover:underline"
              >
                Lire le journal
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          {/* Encart "Aujourd'hui au potager" — note de carnet */}
          <aside className="rounded-soft bg-cream-warm p-8 shadow-warm md:mt-4">
            <p className="font-serif text-sm italic text-ink-soft">
              Aujourd&apos;hui au potager —{' '}
              <span className="not-italic">
                {monthLabel(month).toLowerCase()} {year}
              </span>
            </p>
            <h2 className="mt-3 font-serif text-3xl text-green-deep">
              {activePlants.length > 0 ? (
                <>
                  {activePlants.length}{' '}
                  {activePlants.length === 1 ? 'plante' : 'plantes'} à semer.
                </>
              ) : (
                <>Pause dans la bibliothèque ce mois-ci.</>
              )}
            </h2>
            {activePlants.length > 0 ? (
              <ul className="mt-6 divide-y divide-green-soft/40">
                {activePlants.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-baseline gap-4 py-2.5">
                    <Link
                      href={`/bibliotheque/${p.slug}`}
                      className="font-serif text-lg text-green-deep underline-offset-4 hover:underline"
                    >
                      {p.name}
                    </Link>
                    {p.sowingWindow?.note ? (
                      <span className="ml-auto truncate text-xs italic text-ink-soft">
                        {p.sowingWindow.note.split('.')[0]}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <Link
              href="/calendrier"
              className="mt-6 inline-flex items-center gap-1.5 text-sm italic text-ink-soft hover:text-tomato"
            >
              voir le calendrier annuel
              <span aria-hidden>→</span>
            </Link>
          </aside>
        </Container>
      </section>

      {/* SEMIS DE LA COMMUNAUTÉ */}
      <section className="py-20">
        <Container>
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-4xl text-green-deep md:text-5xl">
                Au fil de la communauté
              </h2>
              <p className="mt-3 font-serif text-lg italic text-ink-soft">
                Les derniers semis partagés.
              </p>
            </div>
            <Link
              href="/journal"
              className="text-sm font-medium text-green-deep underline-offset-4 hover:underline"
            >
              Tout le journal →
            </Link>
          </div>
          {recentSowingsWithCover.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentSowingsWithCover.map((sowing) => (
                <SowingCard key={sowing.id} sowing={sowing} />
              ))}
            </div>
          ) : (
            <div className="rounded-pillow border border-green-soft/40 bg-cream-warm p-12 text-center">
              <p className="font-serif text-2xl text-green-deep">
                Le journal est encore tout neuf.
              </p>
              <p className="mx-auto mt-4 max-w-prose text-ink-soft">
                Sois le premier à partager tes courgettes, tes poivrons, ton
                basilic naissant.
              </p>
              <Link
                href="/mon-potager"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-green-deep underline-offset-4 hover:underline"
              >
                Ouvrir mon potager
                <span aria-hidden>→</span>
              </Link>
            </div>
          )}
        </Container>
      </section>

      {/* APERÇU BIBLIOTHÈQUE */}
      {activePlants.length ? (
        <section className="bg-green-deep/[0.04] py-20">
          <Container>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-4xl text-green-deep md:text-5xl">
                  Ce qui se sème en {monthLabel(month).toLowerCase()}
                </h2>
                <p className="mt-3 font-serif text-lg italic text-ink-soft">
                  Sélection adaptée au climat belge.
                </p>
              </div>
              <Link
                href="/bibliotheque"
                className="text-sm font-medium text-green-deep underline-offset-4 hover:underline"
              >
                Toute la bibliothèque →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activePlants.slice(0, 6).map((plant) => (
                <PlantCard key={plant.id} plant={plant} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* CARNET D'ASTUCES — tips récents */}
      {recentTips.length ? (
        <section className="py-20">
          <Container>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-4xl text-green-deep md:text-5xl">
                  Le carnet d&apos;astuces
                </h2>
                <p className="mt-3 font-serif text-lg italic text-ink-soft">
                  Petites trouvailles, méthodes douces.
                </p>
              </div>
              <Link
                href="/tips"
                className="text-sm font-medium text-green-deep underline-offset-4 hover:underline"
              >
                Tous les tips →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentTips.map((tip) => (
                <TipCard
                  key={(tip as { slug: string }).slug}
                  tip={tip as Parameters<typeof TipCard>[0]['tip']}
                />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  )
}
