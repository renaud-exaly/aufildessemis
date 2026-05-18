import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Container } from '@/components/Container'
import { TipCard } from '@/components/TipCard'
import { getPayloadClient } from '@/lib/payload'
import {
  TIP_CATEGORIES,
  TIP_CATEGORY_INTRO,
  TIP_CATEGORY_LABEL,
  type TipCategory,
} from '@/lib/tips'

export const revalidate = 86400
export const dynamicParams = false

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return TIP_CATEGORIES.map((c) => ({ slug: c.value }))
}

function isCategory(value: string): value is TipCategory {
  return TIP_CATEGORIES.some((c) => c.value === value)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  if (!isCategory(slug)) return { title: 'Catégorie introuvable' }
  const label = TIP_CATEGORY_LABEL[slug]
  return {
    title: `${label} — Tips & conseils`,
    description: `${TIP_CATEGORY_INTRO[slug]} Toutes nos astuces dans la catégorie ${label.toLowerCase()}.`,
    alternates: { canonical: `/tips/categorie/${slug}` },
    openGraph: {
      title: `${label} — Tips & conseils`,
      description: TIP_CATEGORY_INTRO[slug],
      type: 'website',
      url: `/tips/categorie/${slug}`,
    },
  }
}

async function fetchTipsForCategory(category: TipCategory) {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'tips',
      where: {
        and: [
          { status: { equals: 'published' } },
          { category: { equals: category } },
        ],
      },
      sort: '-updatedAt',
      limit: 100,
      depth: 2,
    })
    return docs
  } catch {
    return []
  }
}

export default async function TipsCategoryPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  if (!isCategory(slug)) notFound()

  const tips = await fetchTipsForCategory(slug)
  const label = TIP_CATEGORY_LABEL[slug]
  const intro = TIP_CATEGORY_INTRO[slug]

  const otherCategories = TIP_CATEGORIES.filter((c) => c.value !== slug)

  // Schema.org exige des URLs absolues pour `item` / `url` (Google Search Console).
  const baseUrl =
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Tips — ${label}`,
    numberOfItems: tips.length,
    itemListElement: tips.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: (t as { title: string }).title,
      url: `${baseUrl}/tips/${(t as { slug: string }).slug}`,
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Tips & conseils', item: `${baseUrl}/tips` },
      {
        '@type': 'ListItem',
        position: 3,
        name: label,
        item: `${baseUrl}/tips/categorie/${slug}`,
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
            <Link href="/tips" className="hover:text-tomato">
              ← Tips & conseils
            </Link>
          </nav>
          <h1 className="mt-8 font-serif text-5xl text-green-deep md:text-7xl">
            {label}
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink">
            {intro}
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <p className="mb-8 text-sm italic text-ink-soft">
            {tips.length === 0
              ? 'Pas encore de tips dans cette catégorie.'
              : `${tips.length} tip${tips.length > 1 ? 's' : ''} dans cette catégorie.`}
          </p>

          {tips.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tips.map((tip) => (
                <TipCard
                  key={(tip as { slug: string }).slug}
                  tip={tip as Parameters<typeof TipCard>[0]['tip']}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-pillow border border-green-soft/40 bg-cream-warm p-12 text-center">
              <p className="font-serif text-2xl text-green-deep">
                Bientôt ici.
              </p>
              <p className="mx-auto mt-4 max-w-prose text-ink-soft">
                Cette catégorie attend ses premiers conseils. En attendant,
                explore les autres rayons du carnet d&apos;astuces.
              </p>
              <Link
                href="/tips"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-green-deep underline-offset-4 hover:underline"
              >
                Tous les tips
                <span aria-hidden>→</span>
              </Link>
            </div>
          )}
        </Container>
      </section>

      <section className="border-t border-green-soft/40 bg-cream-warm py-12">
        <Container>
          <h2 className="font-serif text-xl text-green-deep">
            Autres catégories
          </h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {otherCategories.map((c) => (
              <li key={c.value}>
                <Link
                  href={`/tips/categorie/${c.value}`}
                  className="inline-flex rounded-full border border-green-soft/60 bg-cream px-4 py-2 text-sm font-medium text-green-deep transition-colors hover:border-green-deep hover:bg-cream-warm"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
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
