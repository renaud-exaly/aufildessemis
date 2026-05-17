import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CommentThread, type CommentView } from '@/components/social/CommentThread'
import { Container } from '@/components/Container'
import { ReportLink } from '@/components/ReportLink'
import { RichText } from '@/components/RichText'
import { ShareButton } from '@/components/ShareButton'
import { TipCard } from '@/components/TipCard'
import { getSession } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { TIP_CATEGORY_LABEL, type TipCategory } from '@/lib/tips'


type Params = { slug: string }

type TipDoc = {
  id: number | string
  title: string
  slug: string
  excerpt?: string | null
  category?: TipCategory | null
  body: unknown
  coverImage?: { url?: string | null; alt?: string | null } | null
  author?: { id: number | string; displayName?: string | null } | number | string | null
  plants?: Array<{ id: number | string; name?: string | null; slug?: string | null } | number | string> | null
  createdAt?: string
  updatedAt?: string
}

async function getTip(slug: string): Promise<TipDoc | null> {
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
  return (docs[0] as TipDoc | undefined) ?? null
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

/**
 * Tips associés au tip courant.
 *  - Priorité 1 : même catégorie (sauf le tip lui-même)
 *  - Priorité 2 : plante en commun (si la catégorie ne suffit pas à remplir 3)
 *  - Statut publié uniquement
 */
async function getRelatedTips(tip: TipDoc): Promise<TipDoc[]> {
  try {
    const payload = await getPayloadClient()
    const plantIds = Array.isArray(tip.plants)
      ? tip.plants
          .map((p) => (typeof p === 'object' && p ? p.id : (p as number | string)))
          .filter((v): v is number | string => v != null)
      : []

    const collected: TipDoc[] = []
    const seen = new Set<string>([String(tip.id)])

    if (tip.category) {
      const { docs } = await payload.find({
        collection: 'tips',
        where: {
          and: [
            { status: { equals: 'published' } },
            { category: { equals: tip.category } },
            { id: { not_equals: tip.id } },
          ],
        },
        sort: '-updatedAt',
        limit: 3,
        depth: 1,
      })
      for (const d of docs as TipDoc[]) {
        if (!seen.has(String(d.id))) {
          collected.push(d)
          seen.add(String(d.id))
        }
      }
    }

    if (collected.length < 3 && plantIds.length) {
      const { docs } = await payload.find({
        collection: 'tips',
        where: {
          and: [
            { status: { equals: 'published' } },
            { plants: { in: plantIds } },
            { id: { not_equals: tip.id } },
          ],
        },
        sort: '-updatedAt',
        limit: 6,
        depth: 1,
      })
      for (const d of docs as TipDoc[]) {
        if (collected.length >= 3) break
        if (!seen.has(String(d.id))) {
          collected.push(d)
          seen.add(String(d.id))
        }
      }
    }

    return collected.slice(0, 3)
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const tip = await getTip(slug)
  if (!tip) return { title: 'Tip introuvable' }

  const description =
    tip.excerpt ??
    `${tip.title} — un conseil potager d'Au fil des semis, climat belge.`
  const author =
    typeof tip.author === 'object' && tip.author
      ? tip.author.displayName ?? undefined
      : undefined

  return {
    title: tip.title,
    description,
    alternates: { canonical: `/tips/${slug}` },
    openGraph: {
      title: tip.title,
      description,
      type: 'article',
      url: `/tips/${slug}`,
      publishedTime: tip.createdAt,
      modifiedTime: tip.updatedAt,
      authors: author ? [author] : undefined,
    },
  }
}

export default async function TipPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const tip = await getTip(slug)
  if (!tip) notFound()

  const [comments, session, related] = await Promise.all([
    getTipComments(tip.id),
    getSession(),
    getRelatedTips(tip),
  ])

  const author =
    typeof tip.author === 'object' && tip.author ? tip.author.displayName : null
  const cover =
    tip.coverImage && typeof tip.coverImage === 'object' ? tip.coverImage : null
  const categoryLabel = tip.category ? TIP_CATEGORY_LABEL[tip.category] : null

  // JSON-LD : Article (déclenche les rich results) + BreadcrumbList.
  const articleJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: tip.title,
    description: tip.excerpt ?? undefined,
    datePublished: tip.createdAt,
    dateModified: tip.updatedAt,
    author: author
      ? { '@type': 'Person', name: author }
      : { '@type': 'Organization', name: 'Au fil des semis' },
    publisher: {
      '@type': 'Organization',
      name: 'Au fil des semis',
    },
  }
  if (cover?.url) {
    articleJsonLd.image = cover.url
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'Tips & conseils', item: '/tips' },
      ...(tip.category
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: TIP_CATEGORY_LABEL[tip.category],
              item: `/tips/categorie/${tip.category}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: tip.title,
              item: `/tips/${slug}`,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 3,
              name: tip.title,
              item: `/tips/${slug}`,
            },
          ]),
    ],
  }

  return (
    <article className="py-16">
      <Container>
        <nav
          aria-label="Fil d'Ariane"
          className="text-sm uppercase tracking-[0.14em] text-ink-soft"
        >
          <Link href="/tips" className="hover:text-tomato">
            ← Tips
          </Link>
          {tip.category ? (
            <>
              {' / '}
              <Link
                href={`/tips/categorie/${tip.category}`}
                className="hover:text-tomato"
              >
                {categoryLabel}
              </Link>
            </>
          ) : null}
        </nav>
        <h1 className="mt-8 max-w-3xl font-serif text-5xl text-green-deep md:text-6xl">
          {tip.title}
        </h1>
        {tip.excerpt ? (
          <p className="mt-6 max-w-2xl font-serif text-xl italic leading-relaxed text-ink-soft">
            {tip.excerpt}
          </p>
        ) : null}
        {author ? (
          <p className="mt-6 text-sm text-ink-soft">par {author}</p>
        ) : null}

        <div className="mt-6">
          <ShareButton
            url={`/tips/${slug}`}
            title={`${tip.title} — Au fil des semis`}
            text={
              tip.excerpt ??
              (author
                ? `Un conseil potager partagé par ${author}.`
                : 'Un conseil potager à découvrir.')
            }
          />
        </div>

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
          <RichText data={tip.body as Parameters<typeof RichText>[0]['data']} />
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

        {related.length ? (
          <section className="mt-16 border-t border-green-soft/30 pt-12">
            <h2 className="font-serif text-3xl text-green-deep">
              À lire aussi
            </h2>
            <p className="mt-2 text-sm italic text-ink-soft">
              {tip.category
                ? `D'autres tips dans « ${categoryLabel} ».`
                : 'Des tips reliés à celui-ci.'}
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <TipCard
                  key={r.slug}
                  tip={{
                    slug: r.slug,
                    title: r.title,
                    coverImage: r.coverImage ?? null,
                    plants: (r.plants ?? null) as Array<{ name?: string | null }> | null,
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-16 flex justify-end border-t border-green-soft/30 pt-6">
          <ReportLink targetCollection="tips" targetId={tip.id} />
        </div>
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </article>
  )
}
