'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import {
  addCommentAction,
  type CommentTarget,
  deleteCommentAction,
  hideCommentAction,
} from '@/app/(frontend)/journal/social-actions'

export type CommentView = {
  id: number
  body: string
  createdAt: string
  authorId: number | string
  authorName: string
}

type Props = {
  target: CommentTarget
  initialComments: CommentView[]
  currentUserId: number | string | null
  currentUserRole?: 'admin' | 'moderator' | 'member' | null
}

export function CommentThread({
  target,
  initialComments,
  currentUserId,
  currentUserRole,
}: Props) {
  const [comments, setComments] = useState<CommentView[]>(initialComments)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const isStaff = currentUserRole === 'admin' || currentUserRole === 'moderator'
  const loggedIn = currentUserId !== null

  const submit = () => {
    const trimmed = body.trim()
    if (trimmed.length < 2) {
      setError('Trop court.')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await addCommentAction(target, trimmed)
      if (!res.ok) {
        setError(res.error)
        return
      }
      // Optimiste : ajoute le commentaire (l'auteur est le current user).
      setComments((prev) => [
        ...prev,
        {
          id: Number(res.commentId),
          body: trimmed,
          createdAt: new Date().toISOString(),
          authorId: currentUserId!,
          authorName: 'Toi',
        },
      ])
      setBody('')
    })
  }

  const onDelete = (id: number) => {
    if (!confirm('Supprimer ce commentaire ?')) return
    startTransition(async () => {
      const res = await deleteCommentAction(id)
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id))
      } else {
        setError(res.error)
      }
    })
  }

  const onHide = (id: number) => {
    if (!confirm('Masquer ce commentaire ? (modération)')) return
    startTransition(async () => {
      const res = await hideCommentAction(id)
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id))
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="mt-5 border-t border-green-soft/40 pt-4">
      {comments.length ? (
        <ul className="space-y-3">
          {comments.map((c) => {
            const isAuthor = String(c.authorId) === String(currentUserId)
            return (
              <li
                key={c.id}
                className="rounded-soft bg-cream-warm px-4 py-3 text-sm"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-base text-green-deep">
                    {c.authorName}
                  </span>
                  <time className="text-xs text-ink-soft">
                    {new Date(c.createdAt).toLocaleDateString('fr-BE', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </time>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-ink">{c.body}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                  {isAuthor ? (
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className="italic text-tomato underline-offset-4 hover:underline"
                    >
                      Supprimer
                    </button>
                  ) : null}
                  {isStaff && !isAuthor ? (
                    <button
                      type="button"
                      onClick={() => onHide(c.id)}
                      className="italic text-tomato underline-offset-4 hover:underline"
                    >
                      Masquer (modé)
                    </button>
                  ) : null}
                  {loggedIn && !isAuthor ? (
                    <ReportInline targetId={c.id} targetType="comments" />
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-xs italic text-ink-soft">
          Aucun commentaire pour l&apos;instant.
        </p>
      )}

      {loggedIn ? (
        <div className="mt-4">
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.currentTarget.value)
              setError(null)
            }}
            rows={2}
            maxLength={2000}
            placeholder="Un mot d'encouragement, une question…"
            className="w-full rounded-soft border border-green-soft/60 bg-cream px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep/30"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            {error ? (
              <p className="text-xs text-tomato">{error}</p>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={submit}
              disabled={pending || body.trim().length < 2}
              className="rounded-full bg-green-deep px-5 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-cream transition-colors hover:bg-[#234034] disabled:opacity-50"
            >
              {pending ? 'Envoi…' : 'Commenter'}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs italic text-ink-soft">
          <Link
            href="/mon-potager/connexion"
            className="text-green-deep underline-offset-4 hover:underline"
          >
            Connecte-toi
          </Link>{' '}
          pour laisser un commentaire.
        </p>
      )}
    </div>
  )
}

// ---- Bouton "Signaler" pour un commentaire --------------------------------

function ReportInline({
  targetId,
  targetType,
}: {
  targetId: number | string
  targetType: 'comments' | 'sowing-updates'
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<'spam' | 'inappropriate' | 'harassment' | 'other'>(
    'inappropriate',
  )
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (status) {
    return <span className="italic text-green-deep">{status}</span>
  }
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="italic text-ink-soft underline-offset-4 hover:text-tomato hover:underline"
      >
        Signaler
      </button>
    )
  }

  const submit = () => {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('targetType', targetType)
      fd.append('targetId', String(targetId))
      fd.append('reason', reason)
      fd.append('note', note)
      const { reportContentAction } = await import(
        '@/app/(frontend)/journal/social-actions'
      )
      const res = await reportContentAction(null, fd)
      if (res?.ok) {
        setStatus('Signalé')
        setOpen(false)
      } else {
        setStatus(res?.error ?? 'Erreur')
      }
    })
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <select
        value={reason}
        onChange={(e) => setReason(e.currentTarget.value as typeof reason)}
        className="rounded border border-green-soft/60 bg-cream px-1.5 py-0.5 text-[11px]"
      >
        <option value="spam">Spam</option>
        <option value="inappropriate">Inapproprié</option>
        <option value="harassment">Harcèlement</option>
        <option value="other">Autre</option>
      </select>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.currentTarget.value)}
        placeholder="précision (optionnel)"
        maxLength={500}
        className="rounded border border-green-soft/60 bg-cream px-1.5 py-0.5 text-[11px]"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="italic text-tomato underline-offset-4 hover:underline disabled:opacity-50"
      >
        Envoyer
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="italic text-ink-soft underline-offset-4 hover:underline"
      >
        Annuler
      </button>
    </span>
  )
}
