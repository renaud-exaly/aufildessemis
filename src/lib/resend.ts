import { Resend } from 'resend'

let cached: Resend | null = null

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (cached) return cached
  cached = new Resend(key)
  return cached
}

export function getNewsletterAudienceId(): string | null {
  return process.env.RESEND_AUDIENCE_ID || null
}

/**
 * Add a contact to the configured Resend audience.
 * Idempotent — Resend itself returns the existing contact if email already exists.
 */
export async function addToAudience(args: {
  email: string
  firstName?: string
  unsubscribed?: boolean
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const resend = getResend()
  const audienceId = getNewsletterAudienceId()
  if (!resend || !audienceId) {
    console.info('[resend] audience sync skipped (not configured)', args.email)
    return { ok: true, skipped: true }
  }
  try {
    await resend.contacts.create({
      audienceId,
      email: args.email.toLowerCase(),
      firstName: args.firstName,
      unsubscribed: args.unsubscribed ?? false,
    })
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    if (message.toLowerCase().includes('already exists')) return { ok: true }
    console.error('[resend] addToAudience failed', message)
    return { ok: false, error: message }
  }
}

export async function unsubscribeFromAudience(
  email: string,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const resend = getResend()
  const audienceId = getNewsletterAudienceId()
  if (!resend || !audienceId) {
    console.info('[resend] unsubscribe skipped (not configured)', email)
    return { ok: true, skipped: true }
  }
  try {
    await resend.contacts.update({
      audienceId,
      email: email.toLowerCase(),
      unsubscribed: true,
    })
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    console.error('[resend] unsubscribe failed', message)
    return { ok: false, error: message }
  }
}
