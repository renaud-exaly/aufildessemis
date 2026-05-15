import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CommentThread, type CommentView } from '@/components/social/CommentThread'
import { Container } from '@/components/Container'
import { ReportLink } from '@/components/ReportLink'
import { RichText } from '@/components/RichText'
import { getSession } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'


type Params = { slug: string }

async function getTip(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'tips',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
}

async function getTipComments(tipId: number | string): Promise<CommentView[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'comments',
    where: {
      and: [
        { 'target.value': { equals: tipId } },
        { 'target.relationTo': { equals: 'tips' } },
        { status: { equals: 'visible' } },
      ],
    },
    sort: 'createdAt',
    limit: 200,
    depth: 1,
    overrideAccess: true,
  })
  return (docs as Array<{
    id: number | string
    body: string
    createdAt: string
    author?:
      | { id: number | string; displayName?: string; email?: string }
      | number
      | string
  }>).map((c) => ({
    id: Number(c.id),
    body: c.body,
    createdAt: c.createdAt,
    authorId:
      typeof c.author === 'object' && c.author
        ? c.author.id
        : (c.author as number | string) ?? 0,
    authorName:
      typeof c.author === 'object' && c.author
        ? c.author.displayName ?? c.author.email ?? 'Anon'
        : 'Anon',
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const tip = await getTip(slug)
  if (!tip) return { title: 'Tip introuvable' }
  return { title: tip.title }
}

export default async function TipPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const tip = await getTip(slug)
  if (!tip) notFound()

  const [comments, session] = await Promise.all([
    getTipComments(tip.id),
    getSession(),
  ])

  const author =
    typeof tip.author === 'object' && tip.author ? tip.author.displayName : null
  const cover =
    tip.coverImage && typeof tip.coverImage === 'object' ? tip.coverImage : null

  return (
    <article className="py-16">
      <Container>
        <Link
          href="/tips"
          className="text-sm uppercase tracking-[0.14em] text-ink-soft hover:text-tomato"
        >
          ← Tips
        </Link>
        <h1 className="mt-8 max-w-3xl font-serif text-5xl text-green-deep md:text-6xl">
          {tip.title}
        </h1>
        {author ? (
          <p className="mt-4 text-sm text-ink-soft">par {author}</p>
        ) : null}

        {cover?.url ? (
          <div className="aspect-[16/9] relative mt-10 overflow-hidden rounded-pillow bg-sand-soft">
            <Image
              src={cover.url}
              alt={cover.alt ?? ''}
              fill
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="prose prose-stone mt-12 max-w-prose text-ink">
          <RichText data={tip.body} />
        </div>

        <section className="mt-16 max-w-prose border-t border-green-soft/30 pt-8">
          <h2 className="font-serif text-2xl text-green-deep">
            Échanges
          </h2>
          <p className="mt-1 text-sm italic text-ink-soft">
            Une question, un retour d&apos;expérience ?
          </p>
          <CommentThread
            target={{ collection: 'tips', id: Number(tip.id) }}
            initialComments={comments}
            currentUserId={session?.id ?? null}
            currentUserRole={session?.role ?? null}
          />
        </section>

        <div className="mt-16 flex justify-end border-t border-green-soft/30 pt-6">
          <ReportLink targetCollection="tips" targetId={tip.id} />
        </div>
      </Container>
    </article>
  )
}
