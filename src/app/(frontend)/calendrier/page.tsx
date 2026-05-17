import Link from 'next/link'

import { CalendarPicker } from './CalendarPicker'
import { Container } from '@/components/Container'
import { getCalendarData } from '@/lib/calendar'
import { currentMonth, MONTH_SLUGS, monthLabel } from '@/lib/months'
import { MONTHS } from '@/lib/stages'

export const revalidate = 86400

export const metadata = {
  title: 'Calendrier de semis — que planter mois par mois en Belgique',
  description:
    'Le calendrier annuel des semis adapté au climat belge. Légumes, herbes et fleurs : quoi planter chaque mois au potager.',
  alternates: { canonical: '/calendrier' },
}

// Types réexportés pour compat avec CalendarPicker (qui importe depuis ./page)
export type {
  CalendarPlant,
  CalendarPlantInMonth,
  CalendarGroup,
  MonthBucket,
} from '@/lib/calendar'

export default async function CalendrierPage() {
  const { buckets, yearRound } = await getCalendarData()

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
          <CalendarPicker
            months={buckets}
            initialMonth={currentMonth()}
            yearRound={yearRound}
          />
        </Container>
      </section>

      {/* Liens explicites vers chaque mois — bookmarkables et crawlables. */}
      <section className="border-t border-green-soft/40 bg-cream-warm py-16">
        <Container>
          <h2 className="font-serif text-3xl text-green-deep">
            Mois par mois
          </h2>
          <p className="mt-2 max-w-prose text-sm text-ink-soft">
            Une page par mois, avec la liste complète des plantes à semer en
            Belgique.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {MONTHS.map((m) => {
              const slug = MONTH_SLUGS[m.value]
              const bucket = buckets.find((b) => b.value === m.value)
              const count = bucket?.count ?? 0
              return (
                <li key={m.value}>
                  <Link
                    href={`/calendrier/${slug}`}
                    className="group flex items-baseline justify-between gap-3 rounded-soft border border-green-soft/60 bg-cream px-4 py-3 transition-colors hover:border-green-deep hover:bg-cream-warm"
                  >
                    <span className="font-serif text-lg text-green-deep group-hover:text-tomato">
                      Que semer en {monthLabel(m.value).toLowerCase()}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {count > 0 ? `${count} plantes` : '—'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Container>
      </section>
    </>
  )
}
