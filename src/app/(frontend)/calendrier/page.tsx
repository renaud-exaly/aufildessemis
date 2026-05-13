import Link from 'next/link'

import { Container } from '@/components/Container'
import { SowingWindowBadge } from '@/components/SowingWindowBadge'
import { MONTHS } from '@/lib/stages'
import { currentMonth, isInWindow } from '@/lib/months'
import { getPayloadClient } from '@/lib/payload'

export const revalidate = 300

export const metadata = {
  title: 'Calendrier de semis',
  description:
    'Quoi planter à quel mois en Belgique — vue annuelle des fenêtres de semis.',
}

type Plant = {
  id: string | number
  slug: string
  name: string
  sowingWindow?: { startMonth?: string; endMonth?: string; note?: string }
}

export default async function CalendrierPage() {
  let plants: Plant[] = []
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'plants',
      limit: 200,
      sort: 'name',
      depth: 0,
    })
    plants = docs as Plant[]
  } catch {
    plants = []
  }

  const month = currentMonth()
  const plantsByMonth = MONTHS.map((m) => ({
    ...m,
    plants: plants.filter((p) =>
      p.sowingWindow?.startMonth && p.sowingWindow?.endMonth
        ? isInWindow(m.value, p.sowingWindow.startMonth, p.sowingWindow.endMonth)
        : false,
    ),
  }))

  return (
    <>
      <section className="border-b border-green-soft/40 py-20">
        <Container>
          <h1 className="font-serif text-5xl text-green-deep md:text-7xl">
            Que semer, quand&nbsp;?
          </h1>
          <p className="mt-4 font-serif text-xl italic text-ink-soft">
            La carte annuelle, climat belge.
          </p>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink">
            Les dates restent indicatives — fie-toi aussi à ton sol et à la
            météo de l&apos;année.
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plantsByMonth.map((m) => {
              const active = m.value === month
              return (
                <div
                  key={m.value}
                  className={`rounded-pillow border p-6 ${
                    active
                      ? 'border-tomato/40 bg-tomato/[0.04]'
                      : 'border-green-soft/40 bg-surface'
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-serif text-2xl text-green-deep">
                      {m.label}
                    </h2>
                    {active ? (
                      <span className="text-xs uppercase tracking-[0.14em] text-tomato">
                        Ce mois-ci
                      </span>
                    ) : null}
                  </div>
                  {m.plants.length ? (
                    <ul className="mt-4 space-y-2">
                      {m.plants.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/bibliotheque/${p.slug}`}
                            className="flex items-center justify-between gap-3 rounded-soft px-3 py-2 transition-colors hover:bg-cream"
                          >
                            <span className="font-serif text-lg text-green-deep">
                              {p.name}
                            </span>
                            {p.sowingWindow?.startMonth &&
                            p.sowingWindow?.endMonth ? (
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
                    <p className="mt-4 text-sm text-ink-soft">
                      Rien à semer ce mois-ci pour le moment.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Container>
      </section>
    </>
  )
}
