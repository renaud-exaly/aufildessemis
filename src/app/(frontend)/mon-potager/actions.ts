'use server'

import { randomBytes } from 'crypto'
import { redirect } from 'next/navigation'

import { clearAuthCookie, getSession, setAuthCookie } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { addToAudience, unsubscribeFromAudience } from '@/lib/resend'

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
