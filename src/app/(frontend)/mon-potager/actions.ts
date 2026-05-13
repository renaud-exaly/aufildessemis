'use server'

import { randomBytes } from 'crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { clearAuthCookie, getSession, setAuthCookie } from '@/lib/auth'
import { plainTextToLexical } from '@/lib/lexical'
import { getPayloadClient } from '@/lib/payload'
import { addToAudience, unsubscribeFromAudience } from '@/lib/resend'
import { SOWING_STAGES, type SowingStage } from '@/lib/stages'

const STAGE_VALUES = SOWING_STAGES.map((s) => s.value) as readonly string[]
const MAX_PHOTOS = 6
const MAX_PHOTO_BYTES = 8 * 1024 * 1024 // 8 Mo / photo

type FormState = { error?: string; ok?: boolean; message?: string } | null

function asString(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : ''
}

export async function signUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = asString(formData.get('email')).toLowerCase()
  const password = asString(formData.get('password'))
  const displayName = asString(formData.get('displayName'))
  const newsletterOptIn = formData.get('newsletter') === 'on'

  if (!email || !password || !displayName) {
    return { error: 'Tous les champs sont requis.' }
  }
  if (password.length < 8) {
    return { error: 'Le mot de passe doit faire au moins 8 caractères.' }
  }

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        displayName,
        role: 'member',
        newsletterOptIn,
        reminderOptIn: true,
      },
      disableVerificationEmail: false,
    })

    if (newsletterOptIn) {
      // Double opt-in : on les ajoute à l'audience Resend mais ils ne reçoivent
      // pas encore d'email — c'est la vérification du compte qui scelle l'opt-in.
      await addToAudience({
        email,
        firstName: displayName,
        unsubscribed: false,
      })
    }

    return {
      ok: true,
      message:
        'Compte créé. Vérifie ta boîte mail pour confirmer ton adresse.',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    if (message.toLowerCase().includes('duplicate') || message.includes('unique')) {
      return { error: 'Cet email est déjà utilisé.' }
    }
    return { error: message }
  }
}

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = asString(formData.get('email')).toLowerCase()
  const password = asString(formData.get('password'))
  if (!email || !password) {
    return { error: 'Email et mot de passe requis.' }
  }

  try {
    const payload = await getPayloadClient()
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })
    if (!result.token) {
      return { error: 'Identifiants invalides.' }
    }
    await setAuthCookie(result.token, result.exp)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    if (
      message.toLowerCase().includes('verify') ||
      message.toLowerCase().includes('verification')
    ) {
      return {
        error:
          'Ton adresse email n\'est pas encore vérifiée. Vérifie ta boîte mail.',
      }
    }
    return { error: 'Identifiants invalides.' }
  }

  redirect('/mon-potager')
}

export async function signOutAction() {
  await clearAuthCookie()
  redirect('/mon-potager/connexion')
}

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = asString(formData.get('email')).toLowerCase()
  if (!email) return { error: 'Email requis.' }

  try {
    const payload = await getPayloadClient()
    await payload.forgotPassword({
      collection: 'users',
      data: { email },
      disableEmail: false,
    })
    return {
      ok: true,
      message:
        'Si un compte existe avec cet email, un lien de réinitialisation t\'a été envoyé.',
    }
  } catch {
    // Ne révèle pas l'existence du compte.
    return {
      ok: true,
      message:
        'Si un compte existe avec cet email, un lien de réinitialisation t\'a été envoyé.',
    }
  }
}

export async function deleteMyAccountAction() {
  const session = await getSession()
  if (!session) {
    redirect('/mon-potager/connexion')
  }

  const payload = await getPayloadClient()
  const originalEmail = session.email
  const anonEmail = `deleted+${session.id}@aufildessemis.invalid`
  const randomPassword = randomBytes(32).toString('base64')

  try {
    await payload.update({
      collection: 'users',
      id: session.id,
      data: {
        displayName: 'Membre supprimé',
        email: anonEmail,
        password: randomPassword,
        bio: '',
        avatar: null,
        newsletterOptIn: false,
        reminderOptIn: false,
        bannedAt: new Date().toISOString(),
        deletedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })

    // Désabonne aussi de la liste Resend si elle existe.
    await unsubscribeFromAudience(originalEmail)
  } catch (error) {
    console.error('[delete-account] failed', error)
  }

  await clearAuthCookie()
  redirect('/')
}

/* ---------------------------------------------------------------------------
 * Journal — création de Sowings et ajout de mises à jour
 * ------------------------------------------------------------------------ */

export async function createSowingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession()
  if (!session) {
    redirect('/mon-potager/connexion')
  }

  const name = asString(formData.get('name'))
  const plantId = asString(formData.get('plant'))
  const startedAt = asString(formData.get('startedAt'))
  const visibility =
    asString(formData.get('visibility')) === 'private' ? 'private' : 'public'

  if (!name) return { error: 'Donne un nom à ton lot.' }
  if (!plantId) return { error: 'Choisis une plante dans la bibliothèque.' }

  const startedAtIso = startedAt
    ? new Date(startedAt).toISOString()
    : new Date().toISOString()
  if (Number.isNaN(Date.parse(startedAtIso))) {
    return { error: 'Date de démarrage invalide.' }
  }

  const plantIdNum = Number(plantId)
  if (!Number.isFinite(plantIdNum)) {
    return { error: 'Plante invalide.' }
  }

  try {
    const payload = await getPayloadClient()
    const created = await payload.create({
      collection: 'sowings',
      data: {
        name,
        plant: plantIdNum,
        owner: Number(session.id),
        startedAt: startedAtIso,
        visibility,
        reminderSettings: { enabled: true },
      },
      overrideAccess: true,
    })
    revalidatePath('/mon-potager')
    revalidatePath('/journal')
    redirect(`/mon-potager/${created.id}`)
  } catch (error) {
    // redirect() throws — laisse remonter Next.
    if (error && typeof error === 'object' && 'digest' in error) throw error
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { error: message }
  }
}

type UploadedPhoto = { id: string | number }

async function uploadPhotos(
  files: File[],
  altFallback: string,
): Promise<UploadedPhoto[]> {
  if (!files.length) return []
  const payload = await getPayloadClient()
  const uploaded: UploadedPhoto[] = []
  for (const file of files.slice(0, MAX_PHOTOS)) {
    if (!file || file.size === 0) continue
    if (file.size > MAX_PHOTO_BYTES) {
      throw new Error(
        `Photo trop lourde : ${file.name} dépasse ${MAX_PHOTO_BYTES / (1024 * 1024)} Mo.`,
      )
    }
    if (!file.type.startsWith('image/')) {
      throw new Error(`Fichier non supporté : ${file.name} (image attendue).`)
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    const doc = await payload.create({
      collection: 'media',
      data: { alt: altFallback || file.name },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      overrideAccess: true,
    })
    uploaded.push({ id: doc.id })
  }
  return uploaded
}

export async function addSowingUpdateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession()
  if (!session) {
    redirect('/mon-potager/connexion')
  }

  const sowingId = asString(formData.get('sowing'))
  if (!sowingId) return { error: 'Lot manquant.' }

  const date = asString(formData.get('date'))
  const note = asString(formData.get('note'))
  const rawStage = asString(formData.get('stage'))
  const stage =
    rawStage && STAGE_VALUES.includes(rawStage) ? (rawStage as SowingStage) : null

  if (!note && !formData.getAll('photos').some((f) => f instanceof File && f.size > 0)) {
    return { error: 'Ajoute au moins une note ou une photo.' }
  }

  const dateIso = date ? new Date(date).toISOString() : new Date().toISOString()
  if (Number.isNaN(Date.parse(dateIso))) {
    return { error: 'Date invalide.' }
  }

  try {
    const payload = await getPayloadClient()

    // Garde-fou : seul le owner ou un modérateur peut ajouter ici.
    const sowing = await payload.findByID({
      collection: 'sowings',
      id: sowingId,
      depth: 0,
      overrideAccess: true,
    })
    const ownerId =
      typeof sowing.owner === 'object' ? sowing.owner.id : sowing.owner
    if (
      String(ownerId) !== String(session.id) &&
      session.role !== 'admin' &&
      session.role !== 'moderator'
    ) {
      return { error: "Ce lot ne t'appartient pas." }
    }

    const photoFiles = formData
      .getAll('photos')
      .filter((f): f is File => f instanceof File && f.size > 0)

    const photos = await uploadPhotos(photoFiles, `${sowing.name} — ${dateIso.slice(0, 10)}`)

    await payload.create({
      collection: 'sowing-updates',
      data: {
        sowing: Number(sowingId),
        author: Number(session.id),
        date: dateIso,
        note: note ? plainTextToLexical(note) : undefined,
        photos: photos.map((p) => ({ image: Number(p.id) })),
        stage: stage ?? undefined,
      },
      overrideAccess: true,
    })

    revalidatePath(`/mon-potager/${sowingId}`)
    revalidatePath(`/journal/${ownerId}/${sowingId}`)
    revalidatePath('/journal')
    revalidatePath('/mon-potager')

    return { ok: true, message: 'Mise à jour ajoutée.' }
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { error: message }
  }
}

export async function deleteSowingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession()
  if (!session) {
    redirect('/mon-potager/connexion')
  }

  const sowingId = asString(formData.get('sowing'))
  if (!sowingId) return { error: 'Lot manquant.' }

  try {
    const payload = await getPayloadClient()
    const sowing = await payload.findByID({
      collection: 'sowings',
      id: sowingId,
      depth: 0,
      overrideAccess: true,
    })
    const ownerId =
      typeof sowing.owner === 'object' ? sowing.owner.id : sowing.owner
    if (
      String(ownerId) !== String(session.id) &&
      session.role !== 'admin' &&
      session.role !== 'moderator'
    ) {
      return { error: "Ce lot ne t'appartient pas." }
    }

    await payload.delete({
      collection: 'sowings',
      id: sowingId,
      overrideAccess: true,
    })
    revalidatePath('/mon-potager')
    revalidatePath('/journal')
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { error: message }
  }

  redirect('/mon-potager')
}

/* ---------------------------------------------------------------------------
 * Sécurité — changement de mot de passe
 * ------------------------------------------------------------------------ */

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession()
  if (!session) {
    redirect('/mon-potager/connexion')
  }

  const currentPassword = asString(formData.get('currentPassword'))
  const newPassword = asString(formData.get('newPassword'))
  const confirmPassword = asString(formData.get('confirmPassword'))

  if (!currentPassword || !newPassword) {
    return { error: 'Tous les champs sont requis.' }
  }
  if (newPassword.length < 8) {
    return { error: 'Le nouveau mot de passe doit faire au moins 8 caractères.' }
  }
  if (newPassword !== confirmPassword) {
    return { error: 'Les deux nouveaux mots de passe ne correspondent pas.' }
  }
  if (newPassword === currentPassword) {
    return { error: "Le nouveau mot de passe doit être différent de l'actuel." }
  }

  try {
    const payload = await getPayloadClient()
    // Re-vérifie le mot de passe actuel via login local.
    try {
      await payload.login({
        collection: 'users',
        data: { email: session.email, password: currentPassword },
      })
    } catch {
      return { error: 'Mot de passe actuel incorrect.' }
    }

    await payload.update({
      collection: 'users',
      id: session.id,
      data: { password: newPassword },
      overrideAccess: true,
    })
    return { ok: true, message: 'Mot de passe mis à jour.' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { error: message }
  }
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = asString(formData.get('token'))
  const password = asString(formData.get('password'))
  if (!token || !password) return { error: 'Lien invalide.' }
  if (password.length < 8) {
    return { error: 'Le mot de passe doit faire au moins 8 caractères.' }
  }

  try {
    const payload = await getPayloadClient()
    const result = await payload.resetPassword({
      collection: 'users',
      data: { token, password },
      overrideAccess: true,
    })
    if (result.token) {
      await setAuthCookie(result.token)
    }
  } catch {
    return { error: 'Lien invalide ou expiré.' }
  }

  redirect('/mon-potager')
}
