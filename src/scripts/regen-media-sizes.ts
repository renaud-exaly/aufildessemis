/**
 * Force la régénération des variantes (`imageSizes`) pour toutes les media
 * existantes. À lancer **une seule fois** après avoir ajouté/modifié
 * `imageSizes` dans `src/collections/Media.ts`.
 *
 * Mécanisme : on télécharge le fichier original via l'URL servie par Payload,
 * puis on appelle `payload.update({ collection: 'media', id, file })` qui
 * relance le pipeline sharp et écrit toutes les nouvelles variantes sur disque.
 *
 * Usage local :
 *   pnpm regen:media
 *
 * Usage prod (depuis le container app) :
 *   docker compose exec app pnpm regen:media
 */

import 'dotenv/config'

import { getPayloadClient } from '@/lib/payload'

async function fetchAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

async function main() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'media',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  console.log(`▶ ${docs.length} media à régénérer`)

  let ok = 0
  let fail = 0
  for (const doc of docs as Array<{
    id: number | string
    filename?: string | null
    mimeType?: string | null
    url?: string | null
  }>) {
    if (!doc.filename || !doc.url) {
      console.warn(`  ↷ skip media#${doc.id} (pas de filename/url)`)
      continue
    }
    try {
      const data = await fetchAsBuffer(doc.url)
      await payload.update({
        collection: 'media',
        id: doc.id,
        data: {},
        file: {
          data,
          name: doc.filename,
          mimetype: doc.mimeType ?? 'image/jpeg',
          size: data.byteLength,
        },
        overrideAccess: true,
      })
      console.log(`  ✓ ${doc.filename}`)
      ok++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ✗ ${doc.filename}: ${msg}`)
      fail++
    }
  }

  console.log(`\n✅ ${ok} régénérées, ${fail} échecs`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
