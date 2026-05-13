import type { EmailAdapter } from 'payload'

import { getResend } from './resend'

/**
 * Payload email adapter backed by Resend.
 *
 * If `RESEND_API_KEY` is not set (typical in local dev), returns `undefined`,
 * which makes Payload fall back to its console logger — verify links and
 * reset tokens are simply printed in the dev server output.
 */
export function buildResendEmailAdapter(): EmailAdapter | undefined {
  if (!process.env.RESEND_API_KEY) return undefined

  const fromName = 'Au fil des semis'
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'noreply@aufildessemis.be'

  return () => ({
    name: 'resend',
    defaultFromName: fromName,
    defaultFromAddress: fromAddress,
    sendEmail: async (message) => {
      const resend = getResend()
      if (!resend) {
        throw new Error('Resend client missing — RESEND_API_KEY not set')
      }
      const to = Array.isArray(message.to)
        ? message.to.filter((v): v is string => typeof v === 'string')
        : typeof message.to === 'string'
          ? [message.to]
          : []

      const result = await resend.emails.send({
        from: (message.from as string) ?? `${fromName} <${fromAddress}>`,
        to,
        subject: message.subject ?? '(sans objet)',
        html: (message.html as string) ?? '',
        text: (message.text as string) ?? '',
      })
      return result
    },
  })
}
