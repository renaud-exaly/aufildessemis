import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

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

type DecodedJWT = {
  id: string | number
  collection: string
  sid?: string
  exp?: number
}

/**
 * Résout la session courante en décodant le JWT `payload-token` avec `jose`,
 * puis en chargeant le user via la Local API.
 *
 * On contourne `payload.auth({ headers })` qui retourne `user: null` dans
 * certains contextes (Next 16 RSC / server actions) alors que le cookie est
 * bien présent et valide. Le décodage manuel utilise la même lib (`jose`) et
 * la même clé (`payload.secret`) que la stratégie JWT interne de Payload v3
 * — strictement équivalent côté sécurité.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies()
    const token = store.get(COOKIE_NAME)?.value
    if (!token) return null

    const payload = await getPayloadClient()

    // CRITIQUE : on utilise `payload.secret` (chargé via la config au boot)
    // et pas `process.env.PAYLOAD_SECRET` directement. Les deux peuvent
    // différer (CRLF, whitespace de trailing, .env.local override, var shell
    // qui surcharge…). Payload signe ses JWT avec `payload.secret`, donc on
    // vérifie avec exactement le même.
    let decoded: DecodedJWT
    try {
      const { payload: payloadJwt } = await jwtVerify(
        token,
        new TextEncoder().encode(payload.secret),
      )
      decoded = payloadJwt as unknown as DecodedJWT
    } catch {
      return null
    }

    if (!decoded?.id || decoded.collection !== 'users') return null

    const userDoc = (await payload.findByID({
      collection: 'users',
      id: decoded.id,
      overrideAccess: true,
      depth: 0,
    })) as unknown as SessionUser & {
      sessions?: Array<{ id: string }>
      bannedAt?: string | null
    }
    if (!userDoc) return null

    // Si Payload utilise les sessions (defaut v3), on s'assure que le sid du
    // JWT existe encore dans user.sessions — pour que les logouts serveur
    // invalident bien les tokens.
    if (decoded.sid && Array.isArray(userDoc.sessions)) {
      if (!userDoc.sessions.find((s) => s.id === decoded.sid)) return null
    }

    if (userDoc.bannedAt) return null

    return {
      id: userDoc.id,
      email: userDoc.email,
      displayName: userDoc.displayName,
      role: userDoc.role,
      bannedAt: userDoc.bannedAt ?? null,
      collection: 'users',
    }
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
