import { getPayloadClient } from './payload'

export type CoverPhoto = {
  url: string
  alt?: string | null
}

/**
 * Pour un ensemble de sowings, retourne pour chacun la photo à afficher en card :
 * première photo de la mise à jour la plus récente qui en a une.
 *
 * Une seule requête Payload (en filtrant par `sowing IN [...]`) plutôt que N+1.
 * On itère ensuite côté JS — les updates arrivent triées par date desc, donc
 * la première rencontrée pour un sowing donné est aussi sa dernière photo.
 */
export async function getLatestSowingPhotos(
  sowingIds: Array<string | number>,
): Promise<Map<string, CoverPhoto>> {
  const out = new Map<string, CoverPhoto>()
  if (!sowingIds.length) return out

  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'sowing-updates',
      where: { sowing: { in: sowingIds } },
      sort: '-date',
      limit: 1000,
      depth: 1,
      overrideAccess: true,
    })

    for (const u of docs as Array<{
      sowing: string | number | { id: string | number }
      photos?: Array<{ image?: unknown }> | null
    }>) {
      const sowingKey = String(
        typeof u.sowing === 'object' ? u.sowing.id : u.sowing,
      )
      if (out.has(sowingKey)) continue // on a déjà sa dernière photo
      const first = u.photos?.find((p) => {
        if (!p?.image || typeof p.image !== 'object') return false
        return typeof (p.image as { url?: unknown }).url === 'string'
      })?.image as { url?: string; alt?: string | null } | undefined
      if (first?.url) {
        out.set(sowingKey, { url: first.url, alt: first.alt ?? null })
      }
    }
  } catch {
    // Silent — le placeholder prendra le relais sur les cards.
  }
  return out
}

/** Photo de couverture de la plante d'un sowing (fallback quand pas de photo perso). */
export function plantCoverFromSowing(sowing: {
  plant?: unknown
}): CoverPhoto | null {
  const plant = sowing.plant
  if (!plant || typeof plant !== 'object') return null
  const cover = (plant as { coverImage?: unknown }).coverImage
  if (!cover || typeof cover !== 'object') return null
  const url = (cover as { url?: unknown }).url
  if (typeof url !== 'string') return null
  const alt = (cover as { alt?: unknown }).alt
  return { url, alt: typeof alt === 'string' ? alt : null }
}
