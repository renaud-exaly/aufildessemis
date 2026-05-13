import type { MetadataRoute } from 'next'

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'

  // Static entries only for now; dynamic Plants/Sowings/Tips entries
  // are added once those collections land in step 2.
  return STATIC_PATHS.map((entry) => ({
    url: `${baseUrl}${entry.path}`,
    lastModified: new Date(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))
}
