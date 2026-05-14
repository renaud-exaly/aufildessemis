'use server'

import { revalidatePath } from 'next/cache'

import { getSession } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

type ToggleResult =
  | { ok: true; wished: boolean }
  | { ok: false; error: string }

/**
 * Bascule l'envie d'un user pour une plante. Retourne l'état final (wished
 * true/false). Crée la ligne si elle n'existe pas, la supprime si elle existe.
 */
export async function toggleWishAction(plantId: number): Promise<ToggleResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Connecte-toi pour mettre cette plante dans tes envies.' }

  if (!Number.isFinite(plantId)) {
    return { ok: false, error: 'Plante invalide.' }
  }

  try {
    const payload = await getPayloadClient()
    const userId = Number(session.id)

    const { docs: existing } = await payload.find({
      collection: 'plant-wishes',
      where: {
        and: [
          { user: { equals: userId } },
          { plant: { equals: plantId } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existing[0]) {
      await payload.delete({
        collection: 'plant-wishes',
        id: existing[0].id,
        overrideAccess: true,
      })
      revalidatePath('/mon-potager/envies')
      return { ok: true, wished: false }
    }

    await payload.create({
      collection: 'plant-wishes',
      data: { user: userId, plant: plantId },
      overrideAccess: true,
    })
    revalidatePath('/mon-potager/envies')
    return { ok: true, wished: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { ok: false, error: message }
  }
}

/**
 * Marque définitivement une envie comme "pas cette année" sans la supprimer :
 * le user garde la plante dans ses envies mais ne recevra plus de rappel cette
 * saison.
 */
export async function dismissWishAction(plantId: number): Promise<ToggleResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Connecte-toi.' }

  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'plant-wishes',
      where: {
        and: [
          { user: { equals: Number(session.id) } },
          { plant: { equals: plantId } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const wish = docs[0]
    if (!wish) return { ok: false, error: 'Envie introuvable.' }

    await payload.update({
      collection: 'plant-wishes',
      id: wish.id,
      data: {
        dismissed: true,
        lastNotifiedYear: new Date().getFullYear(),
      },
      overrideAccess: true,
    })
    revalidatePath('/mon-potager/envies')
    return { ok: true, wished: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { ok: false, error: message }
  }
}

export type WishWithPlant = {
  id: number | string
  dismissed: boolean
  lastNotifiedYear: number | null
  plant: {
    id: number | string
    slug: string
    name: string
    latinName: string | null
    coverImage: { url?: string | null; alt?: string | null } | null
    sowingWindow: {
      startMonth?: string | null
      endMonth?: string | null
      note?: string | null
    } | null
  }
}

/** Liste les envies du user courant, plante hydratée. */
export async function getMyWishes(): Promise<WishWithPlant[]> {
  const session = await getSession()
  if (!session) return []

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'plant-wishes',
    where: { user: { equals: Number(session.id) } },
    sort: '-createdAt',
    depth: 2,
    limit: 200,
    overrideAccess: true,
  })

  const out: WishWithPlant[] = []
  for (const d of docs as unknown as Array<Record<string, unknown>>) {
    const plant = d.plant as Record<string, unknown> | undefined
    if (!plant || typeof plant !== 'object') continue
    const cover =
      plant.coverImage && typeof plant.coverImage === 'object'
        ? (plant.coverImage as { url?: string | null; alt?: string | null })
        : null
    const sw = plant.sowingWindow as
      | { startMonth?: string | null; endMonth?: string | null; note?: string | null }
      | null
      | undefined
    out.push({
      id: d.id as number | string,
      dismissed: Boolean(d.dismissed),
      lastNotifiedYear: (d.lastNotifiedYear as number | null) ?? null,
      plant: {
        id: plant.id as number | string,
        slug: plant.slug as string,
        name: plant.name as string,
        latinName: (plant.latinName as string | null) ?? null,
        coverImage: cover,
        sowingWindow: sw ?? null,
      },
    })
  }
  return out
}

/** Renvoie l'ensemble des plant IDs déjà dans les envies du user (pour les boutons). */
export async function getMyWishedPlantIds(): Promise<Set<number | string>> {
  const session = await getSession()
  if (!session) return new Set()

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'plant-wishes',
    where: { user: { equals: Number(session.id) } },
    depth: 0,
    limit: 500,
    overrideAccess: true,
  })

  const set = new Set<number | string>()
  for (const d of docs as unknown as Array<{ plant: number | string | { id: number | string } }>) {
    const p = d.plant
    set.add(typeof p === 'object' ? p.id : p)
  }
  return set
}
