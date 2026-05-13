import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Container } from '@/components/Container'
import { getSession } from '@/lib/auth'
import { markdownExcerpt } from '@/lib/markdown'
import { getPayloadClient } from '@/lib/payload'

type Params = { category: string }

type Category = {
  id: string | number
  slug: string
  name: string
  description?: string | null
  icon?: string | null
}

type Topic = {
  id: string | number
  title: string
  slug: string
  body: string
  pinned?: boolean | null
  locked?: boolean | null
  replyCount?: number | null
  lastReplyAt?: string | null
  createdAt: string
  author?: { displayName?: string | null } | string | number
}

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'forum-categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    return (docs[0] as Category) ?? null
  } catch {
    return null
  }
}

async function getTopics(categoryId: string | number): Promise<Topic[]> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'forum-topics',
      where: {
        and: [
          { category: { equals: categoryId } },
          { status: { equals: 'visible' } },
        ],
      },
      // Tri : épinglés en haut, puis dernière activité.
      sort: ['-pinned', '-lastReplyAt'],
      limit: 100,
      depth: 2,
    })
    return docs as unknown as Topic[]
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}) {
  const { category: slug } = await params
  const cat = await getCategory(slug)
  if (!cat) return { title: 'Forum' }
  return {
    title: `${cat.name} — Forum`,
    description: cat.description ?? undefined,
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { category: slug } = await params
  const cat = await getCategory(slug)
  if (!cat) notFound()

  const [topics, session] = await Promise.all([
    getTopics(cat.id),
    getSession(),
  ])

  return (
    <>
      <section className="border-b border-green-soft/40 py-12">
        <Container>
          <Link
            href="/forum"
            className="text-sm uppercase tracking-[0.14em] text-ink-soft hover:text-tomato"
          >
            ← Forum
          </Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              {cat.icon ? (
                <span aria-hidden className="text-4xl">
                  {cat.icon}
                </span>
              ) : null}
              <div>
                <h1 className="font-serif text-4xl text-green-deep md:text-5xl">
                  {cat.name}
                </h1>
                {cat.description ? (
                  <p className="mt-2 text-sm text-ink-soft">
                    {cat.description}
                  </p>
                ) : null}
              </div>
            </div>
            <Link
              href={
                session
                  ? `/forum/${cat.slug}/nouveau`
                  : '/mon-potager/connexion'
              }
              className="inline-flex items-center gap-2 rounded-full bg-tomato px-5 py-2.5 text-sm font-semibold text-white tracking-[0.04em] transition-colors hover:bg-[#a83b25]"
            >
              + Nouveau sujet
            </Link>
          </div>
        </Container>
      </section>

      <section className="py-12">
        <Container>
          {topics.length ? (
            <ul className="divide-y divide-green-soft/30 border-y border-green-soft/30">
              {topics.map((t) => {
                const author =
                  typeof t.author === 'object' && t.author
                    ? t.author.displayName
                    : null
                const when = new Date(t.lastReplyAt ?? t.createdAt)
                const excerpt = markdownExcerpt(t.body, 140)
                return (
                  <li key={t.id}>
                    <Link
                      href={`/forum/${cat.slug}/${t.slug}`}
                      className="group flex flex-col gap-2 py-5 transition-colors hover:bg-cream-warm sm:flex-row sm:items-start sm:gap-6"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          {t.pinned ? (
                            <span className="rounded-full bg-tomato/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-tomato">
                              Épinglé
                            </span>
                          ) : null}
                          {t.locked ? (
                            <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                              Verrouillé
                            </span>
                          ) : null}
                          <h3 className="font-serif text-xl text-green-deep group-hover:text-tomato">
                            {t.title}
                          </h3>
                        </div>
                        {excerpt ? (
                          <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
                            {excerpt}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-ink-soft">
                          {author ? `par ${author} · ` : ''}
                          {when.toLocaleDateString('fr-BE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-xs uppercase tracking-[0.12em] text-ink-soft">
                        {t.replyCount ?? 0} réponse
                        {(t.replyCount ?? 0) > 1 ? 's' : ''}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="rounded-pillow border border-green-soft/40 bg-cream-warm p-12 text-center">
              <p className="font-serif text-2xl text-green-deep">
                Personne n&apos;a encore lancé de sujet ici.
              </p>
              <p className="mx-auto mt-4 max-w-prose text-ink-soft">
                C&apos;est l&apos;occasion d&apos;ouvrir la conversation.
              </p>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
