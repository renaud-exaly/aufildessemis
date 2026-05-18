import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Container } from '@/components/Container'
import { MonthTimeline } from '@/components/MonthTimeline'
import { RichText } from '@/components/RichText'
import { getMonthData, getMonthIntro } from '@/lib/calendar'
import {
  allMonthSlugs,
  monthLabel,
  monthSlug,
  nextMonth,
  prevMonth,
  slugToMonth,
} from '@/lib/months'

export const revalidate = 86400
export const dynamicParams = false

type Params = { mois: string }

export function generateStaticParams(): Params[] {
  return allMonthSlugs().map((mois) => ({ mois }))
}

/** Intro courte par mois, sous climat belge. À enrichir éditorialement plus tard. */
const MONTH_INTROS: Record<string, string> = {
  '01':
    "En janvier, le potager dort encore mais les semis sous abri démarrent : oignons, poireaux d'été, premiers piments pour qui aime jouer la patience.",
  '02':
    "Février, c'est le réveil discret. Les semis intérieurs s'enchaînent — aubergines, piments, tomates précoces — sous lampe ou véranda chaude.",
  '03':
    "Mars ouvre vraiment la saison. Les châssis se remplissent, on tente les premières salades dehors, on lance tomates et courgettes sous abri.",
  '04':
    "Avril bouscule tout. Le potager se remplit : semis directs de carottes, pois, radis, et la suite des solanacées sous abri en attendant les saints de glace.",
  '05':
    "Mai est le mois des grandes mises en terre — après les saints de glace mi-mai, courgettes, tomates, poivrons rejoignent enfin le plein air.",
  '06':
    "Juin entretient. On échelonne salades et haricots, on tuteurure, on récolte les premières fraises et les petits pois.",
  '07':
    "Juillet : on récolte autant qu'on sème. Salades d'été résistantes, mâche, choux d'hiver, navets — c'est le moment de penser à l'automne.",
  '08':
    "Août regarde déjà l'automne. Les derniers semis pour récolter avant le gel : épinards, mâche, radis d'hiver, engrais verts.",
  '09':
    "Septembre clôt en douceur. Mâche, épinards, salades d'hiver sous tunnel, et l'on couvre les sols nus d'engrais verts.",
  '10':
    "Octobre, on protège plus qu'on ne sème. Quelques fèves et pois pour passer l'hiver, ail et échalotes en place.",
  '11':
    "Novembre invite au repos. On plante l'ail, on pousse l'ail des ours en pleine terre, on prépare les sols pour la saison suivante.",
  '12':
    "Décembre : pause. Quelques rares semis sous serre chauffée, et beaucoup de planification pour l'année qui vient.",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { mois } = await params
  const month = slugToMonth(mois)
  if (!month) return { title: 'Mois introuvable' }

  const label = monthLabel(month)
  const labelLower = label.toLowerCase()
  return {
    title: `Que semer en ${labelLower} en Belgique`,
    description: `La liste complète des plantes à semer au potager en ${labelLower}, sous climat belge — légumes, aromatiques et fleurs.`,
    alternates: { canonical: `/calendrier/${mois}` },
    openGraph: {
      title: `Que semer en ${labelLower} en Belgique`,
      description: `Le calendrier de semis pour ${labelLower} — plantes regroupées par famille, climat belge.`,
      type: 'article',
      url: `/calendrier/${mois}`,
    },
  }
}

export default async function MoisPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { mois } = await params
  const month = slugToMonth(mois)
  if (!month) notFound()

  const [{ bucket, yearRound }, cmsIntro] = await Promise.all([
    getMonthData(month),
    getMonthIntro(month),
  ])
  const label = monthLabel(month)
  const labelLower = label.toLowerCase()
  // CMS wins; fallback sur la constante hardcodée si pas encore éditée en admin.
  const intro = cmsIntro?.intro ?? MONTH_INTROS[month]
  const extra = cmsIntro?.extra ?? null

  const prev = prevMonth(month)
  const next = nextMonth(month)
  const prevSlug = monthSlug(prev)!
  const nextSlug = monthSlug(next)!

  // Schema.org exige des URLs absolues pour `item` / `url` (Google Search Console).
  const baseUrl =
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'

  // JSON-LD ItemList : ce que Google adore pour les pages "liste".
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Plantes à semer en ${labelLower} en Belgique`,
    numberOfItems: bucket.count,
    itemListElement: bucket.groups
      .flatMap((g) => g.plants)
      .map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: p.name,
        url: `${baseUrl}/bibliotheque/${p.slug}`,
      })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${baseUrl}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Calendrier',
        item: `${baseUrl}/calendrier`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: label,
        item: `${baseUrl}/calendrier/${mois}`,
      },
    ],
  }

  return (
    <>
      <section className="border-b border-green-soft/40 py-20">
        <Container>
          <nav
            aria-label="Fil d'Ariane"
            className="text-sm uppercase tracking-[0.14em] text-ink-soft"
          >
            <Link href="/calendrier" className="hover:text-tomato">
              ← Calendrier annuel
            </Link>
          </nav>
          <h1 className="mt-8 font-serif text-5xl text-green-deep md:text-7xl">
            Que semer en {labelLower}
            <br />
            <em className="font-light">en Belgique</em>
          </h1>
          {intro ? (
            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-ink">
              {intro}
            </p>
          ) : null}
          <p className="mt-6 max-w-2xl text-sm italic text-ink-soft">
            {bucket.count > 0
              ? `${bucket.count} plante${bucket.count > 1 ? 's' : ''} saisonnière${bucket.count > 1 ? 's' : ''} à semer ce mois-ci.`
              : 'Pas de fenêtre saisonnière ouverte ce mois-ci.'}
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          {bucket.groups.length ? (
            <div className="flex flex-col gap-12">
              {bucket.groups.map((group) => (
                <section key={group.category}>
                  <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-green-sage">
                    {group.label}
                    <span className="ml-2 normal-case tracking-normal text-ink-soft/70">
                      · {group.plants.length}
                    </span>
                  </h2>
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
                            activeMonth={month}
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <p className="max-w-prose text-ink-soft">
              Pause dans la bibliothèque ce mois-ci. Explore un autre mois
              ci-dessous, ou consulte les plantes à fenêtre annuelle.
            </p>
          )}

          {extra ? (
            <section className="mt-16 border-t border-green-soft/40 pt-12">
              <div className="prose prose-stone max-w-prose leading-relaxed text-ink">
                <RichText data={extra} />
              </div>
            </section>
          ) : null}

          {yearRound.length ? (
            <section className="mt-16 border-t border-green-soft/40 pt-8">
              <h2 className="font-serif text-xl text-green-deep">
                Toujours possibles
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                {yearRound.length} plante{yearRound.length > 1 ? 's' : ''} à
                fenêtre ouverte toute l&apos;année.
              </p>
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
            </section>
          ) : null}
        </Container>
      </section>

      {/* Navigation mois précédent / suivant — bon pour SEO (link juice) et UX. */}
      <section className="border-t border-green-soft/40 bg-cream-warm py-12">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2">
            <Link
              href={`/calendrier/${prevSlug}`}
              className="group rounded-soft border border-green-soft/60 bg-cream p-6 transition-colors hover:border-green-deep"
            >
              <span className="text-xs uppercase tracking-[0.14em] text-ink-soft">
                ← Mois précédent
              </span>
              <p className="mt-2 font-serif text-2xl text-green-deep group-hover:text-tomato">
                Que semer en {monthLabel(prev).toLowerCase()}
              </p>
            </Link>
            <Link
              href={`/calendrier/${nextSlug}`}
              className="group rounded-soft border border-green-soft/60 bg-cream p-6 text-right transition-colors hover:border-green-deep"
            >
              <span className="text-xs uppercase tracking-[0.14em] text-ink-soft">
                Mois suivant →
              </span>
              <p className="mt-2 font-serif text-2xl text-green-deep group-hover:text-tomato">
                Que semer en {monthLabel(next).toLowerCase()}
              </p>
            </Link>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/calendrier"
              className="text-sm font-medium text-green-deep underline-offset-4 hover:underline"
            >
              Voir le calendrier annuel →
            </Link>
          </div>
        </Container>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  )
}
