import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { finishOnboardingAction, shouldShowOnboarding } from './actions'
import { Container } from '@/components/Container'
import { SowingWindowBadge } from '@/components/SowingWindowBadge'
import { WishButton } from '@/components/WishButton'
import { getSession } from '@/lib/auth'
import { getMyWishedPlantIds } from '@/app/(frontend)/mon-potager/envies/actions'
import { fetchAllPlantsForCalendar, splitSeasonal } from '@/lib/calendar'
import { currentMonth, isInWindow, monthLabel } from '@/lib/months'

export const metadata = { title: 'Bienvenue — Au fil des semis' }

type PlantCard = {
  id: number | string
  slug: string
  name: string
  latinName?: string | null
  category?: string | null
  coverUrl: string | null
  coverAlt: string | null
  startMonth: string
  endMonth: string
}

async function getSeasonalSuggestions(): Promise<PlantCard[]> {
  const raw = await fetchAllPlantsForCalendar()
  const { seasonal } = splitSeasonal(raw)
  const month = currentMonth()
  const inMonth = seasonal.filter((p) =>
    isInWindow(month, p.startMonth, p.endMonth),
  )

  // On veut 6 propositions variées : 1 par catégorie en priorité.
  const byCategory = new Map<string, (typeof inMonth)[number]>()
  for (const p of inMonth) {
    const key = p.category ?? 'autres'
    if (!byCategory.has(key)) byCategory.set(key, p)
  }
  const picks = Array.from(byCategory.values()).slice(0, 6)
  // Si pas assez de catégories distinctes, compléter avec les premières plantes restantes.
  if (picks.length < 6) {
    const pickedIds = new Set(picks.map((p) => p.id))
    for (const p of inMonth) {
      if (picks.length >= 6) break
      if (!pickedIds.has(p.id)) picks.push(p)
    }
  }

  // Hydrate avec coverImage en allant chercher la plante complète.
  // (raw contient déjà depth=0 sans image — on re-fetch les 6 sélectionnées.)
  const { getPayloadClient } = await import('@/lib/payload')
  const payload = await getPayloadClient()
  const out: PlantCard[] = []
  for (const p of picks) {
    const full = await payload.findByID({
      collection: 'plants',
      id: p.id,
      depth: 1,
    })
    const cover =
      full.coverImage && typeof full.coverImage === 'object'
        ? (full.coverImage as { url?: string | null; alt?: string | null })
        : null
    out.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      latinName: (full as { latinName?: string | null }).latinName ?? null,
      category: p.category ?? null,
      coverUrl: cover?.url ?? null,
      coverAlt: cover?.alt ?? null,
      startMonth: p.startMonth,
      endMonth: p.endMonth,
    })
  }
  return out
}

export default async function BienvenuePage() {
  const session = await getSession()
  if (!session) redirect('/mon-potager/connexion')

  const show = await shouldShowOnboarding(session.id)
  if (!show) redirect('/mon-potager')

  const [suggestions, wishedIds] = await Promise.all([
    getSeasonalSuggestions(),
    getMyWishedPlantIds(),
  ])

  const month = currentMonth()
  const monthLower = monthLabel(month).toLowerCase()
  const name = session.displayName ?? 'Bienvenue'

  return (
    <>
      <section className="border-b border-green-soft/40 py-20">
        <Container>
          <p className="font-serif text-xl italic text-ink-soft">
            — Premier pas au potager —
          </p>
          <h1 className="mt-6 font-serif text-5xl text-green-deep md:text-7xl">
            Bienvenue {name}.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink">
            Ton carnet est prêt. On le commence ensemble&nbsp;? Voici quelques
            plantes à semer dès ce mois de {monthLower}, en climat belge. Glisse
            celles qui t&apos;intéressent dans tes envies — on te rappellera le
            bon moment, et tu pourras les transformer en lots quand tu seras
            prêt·e.
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <h2 className="font-serif text-3xl text-green-deep">
            À semer en {monthLower}
          </h2>
          <p className="mt-2 max-w-prose text-sm text-ink-soft">
            Une sélection variée — clique sur le cœur pour ajouter à tes envies.
          </p>

          {suggestions.length ? (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((p) => {
                const isWished = wishedIds.has(p.id)
                return (
                  <li
                    key={p.id}
                    className="overflow-hidden rounded-pillow bg-surface shadow-warm"
                  >
                    <Link
                      href={`/bibliotheque/${p.slug}`}
                      className="block aspect-[5/4] relative bg-sand-soft"
                    >
                      {p.coverUrl ? (
                        <Image
                          src={p.coverUrl}
                          alt={p.coverAlt ?? p.name}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl text-green-sage/40">
                          ✿
                        </div>
                      )}
                    </Link>
                    <div className="flex flex-col gap-3 p-5">
                      <div>
                        <h3 className="font-serif text-2xl text-green-deep">
                          <Link
                            href={`/bibliotheque/${p.slug}`}
                            className="hover:text-tomato"
                          >
                            {p.name}
                          </Link>
                        </h3>
                        {p.latinName ? (
                          <p className="text-sm italic text-ink-soft">
                            {p.latinName}
                          </p>
                        ) : null}
                      </div>
                      <SowingWindowBadge
                        startMonth={p.startMonth}
                        endMonth={p.endMonth}
                      />
                      <div className="mt-1">
                        <WishButton
                          plantId={Number(p.id)}
                          plantName={p.name}
                          initialWished={isWished}
                          loggedIn
                        />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-8 max-w-prose text-ink-soft">
              Aucune fenêtre saisonnière ouverte ce mois-ci. C&apos;est rare —
              regarde la <Link href="/bibliotheque" className="underline">bibliothèque</Link> pour
              t&apos;inspirer.
            </p>
          )}
        </Container>
      </section>

      <section className="border-t border-green-soft/40 bg-cream-warm py-16">
        <Container>
          <h2 className="font-serif text-3xl text-green-deep">
            Ou démarre tout de suite un premier lot.
          </h2>
          <p className="mt-2 max-w-prose text-ink-soft">
            Un <em>lot</em>, c&apos;est une session de semis d&apos;une plante —
            par ex. «&nbsp;Mes tomates 2026&nbsp;». Tu pourras y ajouter des
            photos et des notes au fil des semaines.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/mon-potager/nouveau-semis"
              className="inline-flex items-center gap-2 rounded-full bg-green-deep px-7 py-3.5 text-sm font-semibold text-white tracking-[0.04em] transition-colors hover:bg-[#234034]"
            >
              Démarrer mon premier lot
              <span aria-hidden>→</span>
            </Link>
            <form action={finishOnboardingAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-green-deep/30 bg-cream px-6 py-3 text-sm font-medium text-green-deep transition-colors hover:border-green-deep hover:bg-green-soft/30"
              >
                Aller à mon potager
                <span aria-hidden>→</span>
              </button>
            </form>
          </div>
          <p className="mt-6 text-xs italic text-ink-soft">
            Tu peux toujours revenir ici plus tard — mais on ne te reproposera
            pas cet écran automatiquement.
          </p>
        </Container>
      </section>
    </>
  )
}
