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
  const targetIdRaw = formData.get('targetId')
  const reasonRaw = String(formData.get('reason') ?? '')
  const note = String(formData.get('note') ?? '')

  const ALLOWED_REASONS = [
    'spam',
    'inappropriate',
    'harassment',
    'misinformation',
    'other',
  ] as const
  const reason = ALLOWED_REASONS.find((r) => r === reasonRaw)

  if (!targetCollection || !targetIdRaw || !reason) {
    return { ok: false, error: 'Informations manquantes.' }
  }

  const targetId = Number(targetIdRaw)
  if (!Number.isFinite(targetId)) {
    return { ok: false, error: 'Cible invalide.' }
  }

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'reports',
      data: {
        target: { relationTo: targetCollection, value: targetId },
        reason,
        note: note || undefined,
        status: 'open',
        reporter: Number(session.id),
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
