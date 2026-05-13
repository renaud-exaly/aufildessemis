'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { getSession } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

type FormState = { error?: string; ok?: boolean; message?: string } | null

function asString(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : ''
}

const TITLE_MAX = 200
const BODY_MIN = 8
const BODY_MAX = 20_000

export async function createTopicAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession()
  if (!session) redirect('/mon-potager/connexion')

  const title = asString(formData.get('title'))
  const body = asString(formData.get('body'))
  const categorySlug = asString(formData.get('categorySlug'))

  if (!title) return { error: 'Donne un titre à ton sujet.' }
  if (title.length > TITLE_MAX) {
    return { error: `Titre trop long (max ${TITLE_MAX} caractères).` }
  }
  if (!body || body.length < BODY_MIN) {
    return { error: 'Le corps du message est trop court.' }
  }
  if (body.length > BODY_MAX) {
    return { error: 'Message trop long.' }
  }
  if (!categorySlug) return { error: 'Catégorie manquante.' }

  let createdSlug = ''
  try {
    const payload = await getPayloadClient()

    const { docs: cats } = await payload.find({
      collection: 'forum-categories',
      where: { slug: { equals: categorySlug } },
      limit: 1,
    })
    if (!cats.length) return { error: 'Catégorie inconnue.' }

    // Slug calculé ici (le hook beforeChange le ferait aussi, mais TS
    // exige le champ `slug` au create — autant le générer en amont).
    const slugBase =
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'sujet'
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`

    const created = await payload.create({
      collection: 'forum-topics',
      data: {
        title,
        slug,
        body,
        category: Number(cats[0].id),
        author: Number(session.id),
        status: 'visible',
      },
      overrideAccess: true,
    })
    createdSlug = (created as { slug?: string }).slug ?? ''

    revalidatePath('/forum')
    revalidatePath(`/forum/${categorySlug}`)
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { error: message }
  }

  redirect(`/forum/${categorySlug}/${createdSlug}`)
}

export async function createReplyAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession()
  if (!session) redirect('/mon-potager/connexion')

  const topicId = asString(formData.get('topic'))
  const body = asString(formData.get('body'))
  const categorySlug = asString(formData.get('categorySlug'))
  const topicSlug = asString(formData.get('topicSlug'))

  if (!topicId) return { error: 'Sujet manquant.' }
  if (!body || body.length < BODY_MIN) {
    return { error: 'Ta réponse est trop courte.' }
  }
  if (body.length > BODY_MAX) {
    return { error: 'Réponse trop longue.' }
  }

  try {
    const payload = await getPayloadClient()

    // Sanity check sur le topic (existence + état)
    const topic = await payload.findByID({
      collection: 'forum-topics',
      id: topicId,
      depth: 0,
      overrideAccess: true,
    })
    if (
      topic.locked &&
      session.role !== 'admin' &&
      session.role !== 'moderator'
    ) {
      return { error: 'Ce sujet est verrouillé.' }
    }

    await payload.create({
      collection: 'forum-replies',
      data: {
        topic: Number(topicId),
        author: Number(session.id),
        body,
        status: 'visible',
      },
      overrideAccess: true,
    })

    if (categorySlug && topicSlug) {
      revalidatePath(`/forum/${categorySlug}/${topicSlug}`)
      revalidatePath(`/forum/${categorySlug}`)
      revalidatePath('/forum')
    }

    return { ok: true, message: 'Réponse publiée.' }
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { error: message }
  }
}

export async function deleteTopicAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession()
  if (!session) redirect('/mon-potager/connexion')

  const topicId = asString(formData.get('topic'))
  const categorySlug = asString(formData.get('categorySlug'))
  if (!topicId) return { error: 'Sujet manquant.' }

  try {
    const payload = await getPayloadClient()
    const topic = await payload.findByID({
      collection: 'forum-topics',
      id: topicId,
      depth: 0,
      overrideAccess: true,
    })
    const authorId =
      typeof topic.author === 'object' ? topic.author.id : topic.author
    if (
      String(authorId) !== String(session.id) &&
      session.role !== 'admin' &&
      session.role !== 'moderator'
    ) {
      return { error: 'Tu ne peux pas supprimer ce sujet.' }
    }

    // Supprime aussi les réponses associées.
    await payload.delete({
      collection: 'forum-replies',
      where: { topic: { equals: topicId } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'forum-topics',
      id: topicId,
      overrideAccess: true,
    })

    revalidatePath('/forum')
    if (categorySlug) revalidatePath(`/forum/${categorySlug}`)
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { error: message }
  }

  redirect(categorySlug ? `/forum/${categorySlug}` : '/forum')
}

export async function deleteReplyAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession()
  if (!session) redirect('/mon-potager/connexion')

  const replyId = asString(formData.get('reply'))
  const categorySlug = asString(formData.get('categorySlug'))
  const topicSlug = asString(formData.get('topicSlug'))
  if (!replyId) return { error: 'Réponse manquante.' }

  try {
    const payload = await getPayloadClient()
    const reply = await payload.findByID({
      collection: 'forum-replies',
      id: replyId,
      depth: 0,
      overrideAccess: true,
    })
    const authorId =
      typeof reply.author === 'object' ? reply.author.id : reply.author
    if (
      String(authorId) !== String(session.id) &&
      session.role !== 'admin' &&
      session.role !== 'moderator'
    ) {
      return { error: 'Tu ne peux pas supprimer cette réponse.' }
    }
    await payload.delete({
      collection: 'forum-replies',
      id: replyId,
      overrideAccess: true,
    })

    if (categorySlug && topicSlug) {
      revalidatePath(`/forum/${categorySlug}/${topicSlug}`)
    }
    return { ok: true, message: 'Réponse supprimée.' }
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return { error: message }
  }
}
