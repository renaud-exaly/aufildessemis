import Link from 'next/link'

import { Container } from '@/components/Container'
import { getPayloadClient } from '@/lib/payload'

export const metadata = {
  title: 'Forum',
  description:
    "Le coin discussion de la communauté : entraide, tips, partages d'expérience.",
}

type Category = {
  id: string | number
  slug: string
  name: string
  description?: string | null
  icon?: string | null
  order?: number | null
}

type LastTopic = {
  id: string | number
  title: string
  slug: string
  category: Category | string | number
  author?: { displayName?: string | null } | string | number
  lastReplyAt?: string | null
  createdAt: string
}

async function getCategories(): Promise<Category[]> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'forum-categories',
      limit: 50,
      sort: 'order',
    })
    return docs as Category[]
  } catch {
    return []
  }
}

async function getRecentTopics(): Promise<LastTopic[]> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'forum-topics',
      where: { status: { equals: 'visible' } },
      limit: 6,
      sort: '-lastReplyAt',
      depth: 2,
    })
    return docs as unknown as LastTopic[]
  } catch {
    return []
  }
}

async function getCategoryCounts(
  categories: Category[],
): Promise<Record<string, number>> {
  if (!categories.length) return {}
  try {
    const payload = await getPayloadClient()
    const entries = await Promise.all(
      categories.map(async (c) => {
        const { totalDocs } = await payload.count({
          collection: 'forum-topics',
          where: {
            and: [
              { category: { equals: c.id } },
              { status: { equals: 'visible' } },
            ],
          },
        })
        return [String(c.id), totalDocs] as const
      }),
    )
    return Object.fromEntries(entries)
  } catch {
    return {}
  }
}

export default async function ForumIndexPage() {
  const categories = await getCategories()
  const [recent, counts] = await Promise.all([
    getRecentTopics(),
    getCategoryCounts(categories),
  ])

  return (
    <>
      <section className="border-b border-green-soft/40 py-20">
        <Container>
          <h1 className="font-serif text-5xl text-green-deep md:text-7xl">
            Le forum
          </h1>
          <p className="mt-4 font-serif text-xl italic text-ink-soft">
            Ici on cause potager, et on s&apos;entraide.
          </p>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink">
            Pose une question, partage une astuce, raconte ta saison. Tout le
            monde a sa place — du débutant qui sème ses premiers radis au
            jardinier qui a tout vu.
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <h2 className="sr-only">Catégories</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {categories.map((cat) => {
              const count = counts[String(cat.id)] ?? 0
              return (
                <Link
                  key={cat.id}
                  href={`/forum/${cat.slug}`}
                  className="group flex items-start gap-5 rounded-pillow border border-green-soft/40 bg-surface p-6 transition-shadow hover:shadow-warm"
                >
                  <span
                    aria-hidden
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-cream-warm text-2xl"
                  >
                    {cat.icon ?? '•'}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-serif text-2xl text-green-deep group-hover:text-tomato">
                        {cat.name}
                      </h3>
                      <span className="text-xs uppercase tracking-[0.12em] text-ink-soft">
                        {count} sujet{count > 1 ? 's' : ''}
                      </span>
                    </div>
                    {cat.description ? (
                      <p className="mt-1 text-sm text-ink-soft">
                        {cat.description}
                      </p>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>

          {recent.length ? (
            <div className="mt-16">
              <h2 className="font-serif text-3xl text-green-deep">
                Activité récente
              </h2>
              <ul className="mt-6 divide-y divide-green-soft/30 border-y border-green-soft/30">
                {recent.map((t) => {
                  const cat =
                    typeof t.category === 'object' ? t.category : null
                  const author =
                    typeof t.author === 'object' && t.author
                      ? t.author.displayName
                      : null
                  const when = new Date(t.lastReplyAt ?? t.createdAt)
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/forum/${cat?.slug ?? 'entraide'}/${t.slug}`}
                        className="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4 transition-colors hover:bg-cream-warm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-serif text-lg text-green-deep group-hover:text-tomato">
                            {t.title}
                          </div>
                          <div className="text-xs text-ink-soft">
                            {cat ? (
                              <>
                                <span>{cat.name}</span>
                                {author ? <span> · par {author}</span> : null}
                              </>
                            ) : null}
                          </div>
                        </div>
                        <time className="text-xs italic text-ink-soft">
                          {when.toLocaleDateString('fr-BE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </time>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </Container>
      </section>
    </>
  )
}
