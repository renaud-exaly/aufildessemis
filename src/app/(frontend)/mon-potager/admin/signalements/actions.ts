'use server'

import { revalidatePath } from 'next/cache'

import { getSession } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

type ActionResult = { ok?: true; error?: string } | null

async function assertStaff() {
  const session = await getSession()
  if (!session) return null
  if (session.role !== 'admin' && session.role !== 'moderator') return null
  return session
}

export async function resolveReportAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertStaff()
  if (!session) return { error: 'Accès réservé.' }
  const id = Number(formData.get('reportId'))
  const status = String(formData.get('status') ?? '') as
    | 'resolved'
    | 'dismissed'
  if (!Number.isFinite(id) || (status !== 'resolved' && status !== 'dismissed')) {
    return { error: 'Paramètres invalides.' }
  }
  try {
    const payload = await getPayloadClient()
    await payload.update({
      collection: 'reports',
      id,
      data: { status },
      overrideAccess: true,
    })
    revalidatePath('/mon-potager/admin/signalements')
    return { ok: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Erreur.' }
  }
}

export async function hideTargetCommentAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await assertStaff()
  if (!session) return { error: 'Accès réservé.' }
  const reportId = Number(formData.get('reportId'))
  const commentId = Number(formData.get('commentId'))
  if (!Number.isFinite(reportId) || !Number.isFinite(commentId)) {
    return { error: 'Paramètres invalides.' }
  }
  try {
    const payload = await getPayloadClient()
    await payload.update({
      collection: 'comments',
      id: commentId,
      data: { status: 'hidden' },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'reports',
      id: reportId,
      data: { status: 'resolved' },
      overrideAccess: true,
    })
    revalidatePath('/mon-potager/admin/signalements')
    return { ok: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Erreur.' }
  }
}
