import { cookies, headers as getHeaders } from 'next/headers'

import { getPayloadClient } from './payload'

const COOKIE_NAME = 'payload-token'

export type SessionUser = {
  id: string | number
  email: string
  displayName?: string
  role?: 'admin' | 'moderator' | 'member'
  bannedAt?: string | null
  collection: 'users'
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const payload = await getPayloadClient()
    const headers = await getHeaders()
    const auth = await payload.auth({ headers })
    if (!auth.user) return null
    if (auth.user.collection !== 'users') return null
    const user = auth.user as SessionUser
    // Banni·e ? On coupe la session côté serveur. Le cookie reste valide tant
    // que Payload ne le révoque pas, mais aucune action protégée ne passera.
    if (user.bannedAt) return null
    return user
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[auth] getSession fell back to null:', error)
    }
    return null
  }
}

export async function setAuthCookie(token: string, exp?: number) {
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: exp ? new Date(exp * 1000) : undefined,
  })
}

export async function clearAuthCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
