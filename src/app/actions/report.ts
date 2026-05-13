'use server'

import { getSession } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export type ReportTargetCollection =
  | 'sowings'
  | 'sowing-updates'
  | 'comments'
  | 'tips'
  | 'users'

type ReportState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null

export async function submitReportAction(
  _prev: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const session = await getSession()
  if (!session) {
    return {
      ok: false,
      error: 'Tu dois être connecté·e pour signaler.',
    }
  }

  const targetCollection = formData.get(
    'targetCollection',
  ) as ReportTargetCollection | null
  const targetId = formData.get('targetId')
  const reason = String(formData.get('reason') ?? '')
  const note = String(formData.get('note') ?? '')

  if (!targetCollection || !targetId || !reason) {
    return { ok: false, error: 'Informations manquantes.' }
  }

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'reports',
      data: {
        target: { relationTo: targetCollection, value: targetId as string },
        reason,
        note: note || undefined,
        status: 'open',
        reporter: session.id,
      },
      overrideAccess: false,
      user: { ...session, collection: 'users' },
    })
    return {
      ok: true,
      message: 'Merci, ton signalement a été transmis à la modération.',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { ok: false, error: message }
  }
}
