import type { MetadataRoute } from 'next'

import { allMonthSlugs } from '@/lib/months'
import { getPayloadClient } from '@/lib/payload'

const STATIC_PATHS: Array<{
  path: string
  priority: number
  changeFrequency: 'weekly' | 'monthly'
}> = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/bibliotheque', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/journal', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/tips', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/calendrier', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/a-propos', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/mentions-legales', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/confidentialite', priority: 0.3, changeFrequency: 'monthly' },
]

type SlugDoc = { slug: string; updatedAt?: string }

async function fetchSlugs(
  collection: 'plants' | 'tips',
): Promise<SlugDoc[]> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection,
      limit: 1000,
      depth: 0,
      pagination: false,
    })
    return (docs as Array<{ slug?: string; updatedAt?: string }>)
      .filter((d): d is SlugDoc => typeof d.slug === 'string' && d.slug.length > 0)
      .map((d) => ({ slug: d.slug, updatedAt: d.updatedAt }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const now = new Date()

  const [plants, tips] = await Promise.all([
    fetchSlugs('plants'),
    fetchSlugs('tips'),
  ])

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((entry) => ({
    url: `${baseUrl}${entry.path}`,
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))

  // 12 pages mois — coeur de la stratégie SEO long-tail.
  const monthEntries: MetadataRoute.Sitemap = allMonthSlugs().map((slug) => ({
    url: `${baseUrl}/calendrier/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.85,
  }))

  const plantEntries: MetadataRoute.Sitemap = plants.map((p) => ({
    url: `${baseUrl}/bibliotheque/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const tipEntries: MetadataRoute.Sitemap = tips.map((t) => ({
    url: `${baseUrl}/tips/${t.slug}`,
    lastModified: t.updatedAt ? new Date(t.updatedAt) : now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticEntries, ...monthEntries, ...plantEntries, ...tipEntries]
}
