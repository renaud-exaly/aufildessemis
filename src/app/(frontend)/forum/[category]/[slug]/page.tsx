import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DeleteReplyButton, DeleteTopicButton } from './OwnerControls'
import { ReplyForm } from './ReplyForm'
import { Container } from '@/components/Container'
import { ReportLink } from '@/components/ReportLink'
import { getSession } from '@/lib/auth'
import { renderMarkdown } from '@/lib/markdown'
import { getPayloadClient } from '@/lib/payload'

type Params = { category: string; slug: string }

type Author = { id: string | number; displayName?: string | null } | string | number

type Topic = {
  id: string | number
  title: string
  slug: string
  body: string
  pinned?: boolean | null
  locked?: boolean | null
  replyCount?: number | null
  createdAt: string
  updatedAt: string
  status: string
  author?: Author
  category?:
    | { id: string | number; slug: string; name: string; icon?: string | null }
    | string
    | number
}

type Reply = {
  id: string | number
  body: string
  createdAt: string
  updatedAt: string
  status: string
  author?: Author
}

async function getTopic(slug: string): Promise<Topic | null> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'forum-topics',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
    })
    return (docs[0] as unknown as Topic) ?? null
  } catch {
    return null
  }
}

async function getReplies(topicId: string | number): Promise<Reply[]> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'forum-replies',
      where: {
        and: [
          { topic: { equals: topicId } },
          { status: { equals: 'visible' } },
        ],
      },
      sort: 'createdAt',
      limit: 500,
      depth: 1,
    })
    return docs as unknown as Reply[]
  } catch {
    return []
  }
}

function authorName(author?: Author): string | null {
  if (!author || typeof author !== 'object') return null
  return author.displayName ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const t = await getTopic(slug)
  if (!t) return { title: 'Sujet introuvable' }
  return { title: t.title }
}

export default async function TopicPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { category: catSlug, slug } = await params
  const [topic, session] = await Promise.all([getTopic(slug), getSession()])
  if (!topic) notFound()
  if (topic.status !== 'visible') {
    // Auteur·rice et staff peuvent voir leur propre topic flagged/hidden.
    const isAuthor =
      session && typeof topic.author === 'object' && topic.author
        ? String(topic.author.id) === String(session.id)
        : false
    const isStaff =
      session?.role === 'admin' || session?.role === 'moderator'
    if (!isAuthor && !isStaff) notFound()
  }

  const replies = await getReplies(topic.id)
  const cat = typeof topic.category === 'object' ? topic.category : null
  const opAuthor = authorName(topic.author)
  const isStaff = session?.role === 'admin' || session?.role === 'moderator'
  const topicAuthorId =
    typeof topic.author === 'object' && topic.author ? topic.author.id : null
  const canManageTopic =
    isStaff ||
    (session && topicAuthorId && String(topicAuthorId) === String(session.id))

  return (
    <>
      <section className="border-b border-green-soft/40 py-10">
        <Container className="max-w-3xl">
          <Link
            href={`/forum/${catSlug}`}
            className="text-sm uppercase tracking-[0.14em] text-ink-soft hover:text-tomato"
          >
            ← {cat?.name ?? 'Forum'}
          </Link>
          <h1 className="mt-5 font-serif text-4xl text-green-deep md:text-5xl">
            {topic.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
            {opAuthor ? <span>par {opAuthor}</span> : null}
            <span>·</span>
            <time>
              {new Date(topic.createdAt).toLocaleDateString('fr-BE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
            {topic.locked ? (
              <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                Verrouillé
              </span>
            ) : null}
          </div>
        </Container>
      </section>

      {/* OP */}
      <section className="py-10">
        <Container className="max-w-3xl">
          <article className="rounded-pillow border border-green-soft/40 bg-surface p-6 md:p-8">
            <div
              className="prose prose-stone max-w-none leading-relaxed text-ink"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(topic.body) }}
            />
            <div className="mt-6 flex flex-wrap items-center justify-end gap-4 border-t border-green-soft/30 pt-4 text-xs">
              {canManageTopic ? (
                <DeleteTopicButton
                  topicId={String(topic.id)}
                  categorySlug={catSlug}
                />
              ) : null}
              <ReportLink targetCollection="forum-topics" targetId={topic.id} />
            </div>
          </article>

          {/* Réponses */}
          <div className="mt-12">
            <h2 className="font-serif text-2xl text-green-deep">
              {replies.length
                ? `${replies.length} réponse${replies.length > 1 ? 's' : ''}`
                : 'Pas encore de réponses'}
            </h2>
            {replies.length ? (
              <ul className="mt-6 space-y-6">
                {replies.map((r) => {
                  const a = authorName(r.author)
                  const replyAuthorId =
                    typeof r.author === 'object' && r.author ? r.author.id : null
                  const canDeleteReply =
                    isStaff ||
                    (session &&
                      replyAuthorId &&
                      String(replyAuthorId) === String(session.id))
                  return (
                    <li
                      key={r.id}
                      className="rounded-pillow border border-green-soft/40 bg-cream-warm p-5 md:p-6"
                    >
                      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-green-soft/30 pb-3">
                        <div className="text-sm">
                          <span className="font-serif text-base text-green-deep">
                            {a ?? 'Anonyme'}
                          </span>
                          <span className="ml-2 text-xs italic text-ink-soft">
                            {new Date(r.createdAt).toLocaleDateString('fr-BE', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {canDeleteReply ? (
                            <DeleteReplyButton
                              replyId={String(r.id)}
                              categorySlug={catSlug}
                              topicSlug={topic.slug}
                            />
                          ) : null}
                          <ReportLink
                            targetCollection="forum-replies"
                            targetId={r.id}
                          />
                        </div>
                      </header>
                      <div
                        className="prose prose-stone mt-4 max-w-none leading-relaxed text-ink"
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(r.body),
                        }}
                      />
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>

          {/* Form réponse */}
          <div className="mt-12">
            {topic.locked ? (
              <div className="rounded-pillow border border-dashed border-green-soft/60 bg-cream-warm/60 p-6 text-center">
                <p className="text-sm italic text-ink-soft">
                  Ce sujet est verrouillé — aucune nouvelle réponse possible.
                </p>
              </div>
            ) : session ? (
              <>
                <h3 className="font-serif text-xl text-green-deep">
                  Ta réponse
                </h3>
                <div className="mt-4">
                  <ReplyForm
                    topicId={String(topic.id)}
                    categorySlug={catSlug}
                    topicSlug={topic.slug}
                  />
                </div>
              </>
            ) : (
              <div className="rounded-pillow border border-dashed border-green-soft/60 bg-cream-warm/60 p-6 text-center">
                <p className="text-sm text-ink-soft">
                  <Link
                    href="/mon-potager/connexion"
                    className="text-tomato underline underline-offset-4"
                  >
                    Connecte-toi
                  </Link>{' '}
                  pour répondre.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>
    </>
  )
}
