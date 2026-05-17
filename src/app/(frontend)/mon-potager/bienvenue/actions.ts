'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { getSession } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

/**
 * Décide si l'onboarding doit être affiché pour ce user.
 *
 * Règle :
 *   - si `onboardedAt` est posé → non
 *   - si le user a au moins 1 sowing ou 1 envie → on backfill `onboardedAt`
 *     et on retourne `false` (utilisateurs antérieurs au feature)
 *   - sinon → oui
 */
export async function shouldShowOnboarding(
  userId: number | string,
): Promise<boolean> {
  const payload = await getPayloadClient()
  const user = (await payload.findByID({
    collection: 'users',
    id: userId,
    overrideAccess: true,
  })) as { onboardedAt?: string | null }

  if (user.onboardedAt) return false

  const [sowings, wishes] = await Promise.all([
    payload.find({
      collection: 'sowings',
      where: { owner: { equals: userId } },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'plant-wishes',
      where: { user: { equals: userId } },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  if (sowings.totalDocs > 0 || wishes.totalDocs > 0) {
    // Legacy : déjà des contenus → considère comme onboardé.
    await payload.update({
      collection: 'users',
      id: userId,
      data: { onboardedAt: new Date().toISOString() },
      overrideAccess: true,
    })
    return false
  }
  return true
}

/** Marque l'utilisateur courant comme onboardé. */
export async function markOnboardedAction(): Promise<void> {
  const session = await getSession()
  if (!session) return
  const payload = await getPayloadClient()
  await payload.update({
    collection: 'users',
    id: session.id,
    data: { onboardedAt: new Date().toISOString() },
    overrideAccess: true,
  })
}

/**
 * Bouton "Aller à mon potager" en fin d'onboarding : marque + redirige.
 * Form action pour rester dans le pattern Server Action.
 */
export async function finishOnboardingAction(): Promise<void> {
  await markOnboardedAction()
  revalidatePath('/mon-potager')
  redirect('/mon-potager')
}
