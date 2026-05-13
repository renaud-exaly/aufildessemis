#!/usr/bin/env node
/**
 * Upload bulk des illustrations en prod : pour chaque .png/.jpg dans
 * assets/plants/, upload comme media + set comme coverImage de la plante
 * correspondante. Idempotent : skip si la plante a déjà une cover (sauf si
 * --force).
 *
 * Usage:
 *   PROD_API_KEY=<key> node scripts/upload-prod-covers.mjs
 *   PROD_API_KEY=<key> node scripts/upload-prod-covers.mjs --force
 */

import { readFile, readdir } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const API_URL = process.env.PROD_URL ?? 'https://aufildessemis.be'
const API_KEY = process.env.PROD_API_KEY
const FORCE = process.argv.includes('--force')
if (!API_KEY) {
  console.error('❌ PROD_API_KEY manquante.')
  process.exit(1)
}

const auth = `users API-Key ${API_KEY}`
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ASSETS_DIR = join(__dirname, '..', 'assets', 'plants')

/**
 * Normalise un nom de fichier vers un slug DB.
 * - retire l'extension
 * - retire les diacritiques (échalote → echalote)
 * - mappings spéciaux
 */
const FILE_TO_SLUG_OVERRIDES = {
  'poivron-jaune': 'poivron',
}

function fileToSlug(filename) {
  const base = basename(filename, extname(filename))
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
  return FILE_TO_SLUG_OVERRIDES[base] ?? base
}

async function request(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} on ${path}: ${text.slice(0, 300)}`)
  }
  return res.json()
}

async function getPlant(slug) {
  const q = new URLSearchParams({
    'where[slug][equals]': slug,
    limit: '1',
    depth: '0',
  })
  const data = await request(`/api/plants?${q.toString()}`)
  return data.docs?.[0] ?? null
}

async function uploadMedia(filePath, alt) {
  const buffer = await readFile(filePath)
  const filename = basename(filePath)
  const ext = extname(filename).toLowerCase()
  const mime =
    ext === '.png' ? 'image/png'
    : ext === '.webp' ? 'image/webp'
    : ext === '.gif' ? 'image/gif'
    : 'image/jpeg'

  const form = new FormData()
  const blob = new Blob([new Uint8Array(buffer)], { type: mime })
  form.append('file', blob, filename)
  form.append('_payload', JSON.stringify({ alt }))

  const res = await fetch(`${API_URL}/api/media`, {
    method: 'POST',
    headers: { Authorization: auth },
    body: form,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`upload ${res.status}: ${text.slice(0, 300)}`)
  }
  const data = await res.json()
  return data.doc.id
}

async function main() {
  const entries = await readdir(ASSETS_DIR)
  const images = entries
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort()
  console.log(`→ ${images.length} fichiers à traiter\n`)

  let uploaded = 0
  let skipped = 0
  let failed = 0
  const missingPlants = []

  for (const filename of images) {
    const slug = fileToSlug(filename)
    const filePath = join(ASSETS_DIR, filename)
    try {
      const plant = await getPlant(slug)
      if (!plant) {
        console.log(`  ✗ ${filename.padEnd(25)} → slug "${slug}" introuvable`)
        missingPlants.push(slug)
        failed++
        continue
      }
      if (plant.coverImage && !FORCE) {
        console.log(`  ↷ ${filename.padEnd(25)} → ${plant.name}: cover déjà présente, skip (--force pour écraser)`)
        skipped++
        continue
      }
      const mediaId = await uploadMedia(
        filePath,
        `Illustration aquarelle d'un plant de ${plant.name.toLowerCase()}, style planche botanique sur fond crème.`,
      )
      await request(`/api/plants/${plant.id}`, {
        method: 'PATCH',
        body: { coverImage: mediaId },
      })
      console.log(`  ✓ ${filename.padEnd(25)} → ${plant.name} (media id ${mediaId})`)
      uploaded++
    } catch (err) {
      console.log(`  ✗ ${filename}: ${err.message}`)
      failed++
    }
  }

  console.log(`\n— ${uploaded} uploadés, ${skipped} déjà OK, ${failed} échecs.`)
  if (missingPlants.length) {
    console.log(`   plantes introuvables : ${missingPlants.join(', ')}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
