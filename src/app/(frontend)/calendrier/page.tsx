import { CalendarPicker } from './CalendarPicker'
import { Container } from '@/components/Container'
import { MONTHS } from '@/lib/stages'
import { currentMonth, isInWindow } from '@/lib/months'
import { getPayloadClient } from '@/lib/payload'

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

const SHORT_MONTHS: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fév',
  '03': 'Mars',
  '04': 'Avr',
  '05': 'Mai',
  '06': 'Juin',
  '07': 'Juil',
  '08': 'Août',
  '09': 'Sept',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Déc',
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
  const buckets = MONTHS.map((m) => ({
    value: m.value,
    label: m.label,
    short: SHORT_MONTHS[m.value] ?? m.label,
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
          <CalendarPicker months={buckets} initialMonth={month} />
        </Container>
      </section>
    </>
  )
}
