import { CalendarPicker } from './CalendarPicker'
import { Container } from '@/components/Container'
import {
  PLANT_CATEGORIES,
  PLANT_CATEGORY_LABEL,
  type PlantCategory,
} from '@/lib/categories'
import { MONTHS } from '@/lib/stages'
import { currentMonth, isInWindow } from '@/lib/months'
import { getPayloadClient } from '@/lib/payload'

export const metadata = {
  title: 'Calendrier de semis',
  description:
    'Quoi planter à quel mois en Belgique — vue annuelle des fenêtres de semis.',
}

export type CalendarPlant = {
  id: string | number
  slug: string
  name: string
  category?: PlantCategory | null
  startMonth: string
  endMonth: string
}

export type CalendarPlantInMonth = CalendarPlant & {
  /** True si la fenêtre de cette plante démarre exactement le mois en cours. */
  startsHere: boolean
}

export type CalendarGroup = {
  category: PlantCategory | 'autres'
  label: string
  plants: CalendarPlantInMonth[]
}

export type MonthBucket = {
  value: string
  label: string
  short: string
  /** Plantes saisonnières à semer ce mois-ci, regroupées par catégorie. */
  groups: CalendarGroup[]
  /** Compte total de plantes saisonnières (toutes catégories confondues). */
  count: number
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

/** Ordre d'affichage des catégories dans la liste d'un mois. */
const CATEGORY_ORDER: (PlantCategory | 'autres')[] = [
  ...PLANT_CATEGORIES.map((c) => c.value),
  'autres',
]

function isYearRound(start: string, end: string) {
  return start === '01' && end === '12'
}

export default async function CalendrierPage() {
  type Raw = {
    id: string | number
    slug: string
    name: string
    category?: PlantCategory | null
    sowingWindow?: { startMonth?: string; endMonth?: string; note?: string }
  }

  let raw: Raw[] = []
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'plants',
      limit: 500,
      sort: 'name',
      depth: 0,
    })
    raw = docs as Raw[]
  } catch {
    raw = []
  }

  const withWindow: CalendarPlant[] = raw
    .filter((p) => p.sowingWindow?.startMonth && p.sowingWindow?.endMonth)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category ?? null,
      startMonth: p.sowingWindow!.startMonth!,
      endMonth: p.sowingWindow!.endMonth!,
    }))

  const seasonal = withWindow.filter((p) => !isYearRound(p.startMonth, p.endMonth))
  const yearRound = withWindow.filter((p) => isYearRound(p.startMonth, p.endMonth))

  const buckets: MonthBucket[] = MONTHS.map((m) => {
    const inMonth: CalendarPlantInMonth[] = seasonal
      .filter((p) => isInWindow(m.value, p.startMonth, p.endMonth))
      .map((p) => ({ ...p, startsHere: p.startMonth === m.value }))

    const byCategory = new Map<PlantCategory | 'autres', CalendarPlantInMonth[]>()
    for (const plant of inMonth) {
      const key = plant.category ?? 'autres'
      const list = byCategory.get(key) ?? []
      list.push(plant)
      byCategory.set(key, list)
    }

    const groups: CalendarGroup[] = CATEGORY_ORDER.filter((k) =>
      byCategory.has(k),
    ).map((k) => ({
      category: k,
      label: k === 'autres' ? 'Autres' : PLANT_CATEGORY_LABEL[k],
      plants: byCategory.get(k)!,
    }))

    return {
      value: m.value,
      label: m.label,
      short: SHORT_MONTHS[m.value] ?? m.label,
      groups,
      count: inMonth.length,
    }
  })

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
    </>
  )
}
