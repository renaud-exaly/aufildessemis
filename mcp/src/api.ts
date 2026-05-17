import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'

const API_URL = process.env.AU_FIL_API_URL ?? 'http://localhost:3001'
const API_KEY = process.env.AU_FIL_API_KEY ?? ''

if (!API_KEY) {
  // On ne `throw` pas tout de suite — laisse le serveur démarrer et renvoyer
  // une erreur claire au premier appel.
  console.error(
    '[au-fil-mcp] AU_FIL_API_KEY manquante. Génère une clé dans /admin/collections/users/[me] et configure-la dans Claude Code.',
  )
}

const AUTH_HEADER = `users API-Key ${API_KEY}`

type FetchOpts = {
  method?: string
  body?: unknown
  query?: Record<string, string | number | undefined>
}

async function request<T = unknown>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = new URL(`${API_URL}${path}`)
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: {
      Authorization: AUTH_HEADER,
      'Content-Type': 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Payload ${res.status} ${res.statusText} on ${path}: ${text.slice(0, 400)}`)
  }
  return (await res.json()) as T
}

export type Plant = {
  id: string | number
  slug: string
  name: string
  latinName?: string
  sowingWindow?: { startMonth?: string; endMonth?: string; note?: string }
  typicalStages?: Array<{ stage: string; daysFromPrevious?: number; tip?: string }>
}

export type Sowing = {
  id: string | number
  name: string
  startedAt?: string
  visibility?: 'public' | 'private'
  currentStage?: string | null
  plant: Plant | string | number
  owner: { id: string | number; displayName?: string } | string | number
}

export type SowingUpdate = {
  id: string | number
  date: string
  stage?: string | null
  note?: unknown
  photos?: Array<{ image?: { id: string | number; url?: string } | string }>
  sowing: Sowing | string | number
}

export const api = {
  async me() {
    // `/api/users/me` exige une session JWT en v3 ; avec l'auth API-Key on
    // passe par l'endpoint custom `/api/whoami` qui lit req.user.
    const data = await request<{
      user: {
        id: string | number
        email: string
        displayName?: string
        role?: string
      }
    }>('/api/whoami')
    return data.user
  },

  async listPlants() {
    const data = await request<{ docs: Plant[] }>('/api/plants', {
      query: { limit: 100, depth: 0, sort: 'name' },
    })
    return data.docs
  },

  async getPlantBySlug(slug: string): Promise<Plant | null> {
    const data = await request<{ docs: Plant[] }>('/api/plants', {
      query: {
        'where[slug][equals]': slug,
        limit: 1,
        depth: 0,
      },
    })
    return data.docs[0] ?? null
  },

  async listMySowings(includePrivate: boolean) {
    const me = await this.me()
    const filters: Record<string, string | number> = {
      'where[owner][equals]': String(me.id),
      limit: 200,
      depth: 2,
      sort: '-updatedAt',
    }
    if (!includePrivate) filters['where[visibility][equals]'] = 'public'
    const data = await request<{ docs: Sowing[] }>('/api/sowings', { query: filters })
    return data.docs
  },

  async createSowing(args: {
    name: string
    plantId: string | number
    startedAt?: string
    visibility?: 'public' | 'private'
  }) {
    const data = await request<{ doc: Sowing }>('/api/sowings', {
      method: 'POST',
      body: {
        name: args.name,
        plant: args.plantId,
        startedAt: args.startedAt ?? new Date().toISOString(),
        visibility: args.visibility ?? 'public',
      },
    })
    return data.doc
  },

  async updateSowing(
    id: string | number,
    patch: Record<string, unknown>,
  ) {
    const data = await request<{ doc: Sowing }>(`/api/sowings/${id}`, {
      method: 'PATCH',
      body: patch,
    })
    return data.doc
  },

  async listSowingUpdates(sowingId: string | number, limit = 50) {
    const data = await request<{ docs: SowingUpdate[] }>('/api/sowing-updates', {
      query: {
        'where[sowing][equals]': String(sowingId),
        sort: '-date',
        limit,
        depth: 1,
      },
    })
    return data.docs
  },

  async createSowingUpdate(args: {
    sowingId: string | number
    date?: string
    stage?: string
    note?: unknown
    photoIds?: Array<string | number>
  }) {
    const photos = (args.photoIds ?? []).map((id) => ({ image: id }))
    const data = await request<{ doc: SowingUpdate }>('/api/sowing-updates', {
      method: 'POST',
      body: {
        sowing: args.sowingId,
        date: args.date ?? new Date().toISOString(),
        stage: args.stage,
        note: args.note,
        photos,
      },
    })
    return data.doc
  },

  async deleteSowingUpdate(id: string | number) {
    return request(`/api/sowing-updates/${id}`, { method: 'DELETE' })
  },

  async setPlantCompanions(
    plantId: string | number,
    companions: Array<{ plant: string | number; note?: string }>,
  ) {
    const data = await request<{ doc: Plant }>(`/api/plants/${plantId}`, {
      method: 'PATCH',
      body: { companions },
    })
    return data.doc
  },

  async setPlantIncompatibles(
    plantId: string | number,
    incompatibles: Array<{ plant: string | number; note?: string }>,
  ) {
    const data = await request<{ doc: Plant }>(`/api/plants/${plantId}`, {
      method: 'PATCH',
      body: { incompatibles },
    })
    return data.doc
  },

  async setPlantCover(plantId: string | number, mediaId: string | number) {
    const data = await request<{ doc: Plant }>(`/api/plants/${plantId}`, {
      method: 'PATCH',
      body: { coverImage: mediaId },
    })
    return data.doc
  },

  async createPlant(args: {
    name: string
    slug: string
    latinName?: string
    description?: unknown
    coverImageId?: string | number
    sowingWindow: { startMonth: string; endMonth: string; note?: string }
    typicalStages: Array<{
      stage: string
      daysFromPrevious?: number
      tip?: string
    }>
  }) {
    const data = await request<{ doc: Plant }>('/api/plants', {
      method: 'POST',
      body: {
        name: args.name,
        slug: args.slug,
        latinName: args.latinName,
        description: args.description,
        coverImage: args.coverImageId,
        sowingWindow: args.sowingWindow,
        typicalStages: args.typicalStages,
      },
    })
    return data.doc
  },

  async createTip(args: {
    title: string
    slug: string
    body: unknown
    plantIds?: Array<string | number>
    coverImageId?: string | number
    status?: 'draft' | 'published'
    excerpt?: string
    category?: string
  }) {
    const data = await request<{ doc: { id: string | number; slug: string } }>(
      '/api/tips',
      {
        method: 'POST',
        body: {
          title: args.title,
          slug: args.slug,
          body: args.body,
          plants: args.plantIds,
          coverImage: args.coverImageId,
          status: args.status ?? 'published',
          excerpt: args.excerpt,
          category: args.category,
        },
      },
    )
    return data.doc
  },

  async getTipBySlug(slug: string) {
    const data = await request<{
      docs: Array<{ id: string | number; slug: string; title: string }>
    }>('/api/tips', {
      query: {
        'where[slug][equals]': slug,
        limit: 1,
        depth: 0,
      },
    })
    return data.docs[0] ?? null
  },

  async updateTip(
    id: string | number,
    patch: Record<string, unknown>,
  ) {
    const data = await request<{ doc: { id: string | number; slug: string } }>(
      `/api/tips/${id}`,
      { method: 'PATCH', body: patch },
    )
    return data.doc
  },

  /**
   * Upload un fichier local vers /api/media. Renvoie l'ID du media créé.
   */
  async uploadMedia(filePath: string, alt: string): Promise<string | number> {
    const buffer = await readFile(filePath)
    const filename = basename(filePath)
    const ext = extname(filename).toLowerCase()
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.gif'
          ? 'image/gif'
          : ext === '.webp'
            ? 'image/webp'
            : ext === '.heic'
              ? 'image/heic'
              : 'image/jpeg'

    const form = new FormData()
    const fileBlob = new Blob([new Uint8Array(buffer)], { type: mime })
    form.append('file', fileBlob, filename)
    form.append('_payload', JSON.stringify({ alt }))

    const res = await fetch(`${API_URL}/api/media`, {
      method: 'POST',
      headers: { Authorization: AUTH_HEADER },
      body: form,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Upload failed ${res.status}: ${text.slice(0, 400)}`)
    }
    const data = (await res.json()) as { doc: { id: string | number } }
    return data.doc.id
  },
}
