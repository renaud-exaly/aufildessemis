'use client'

import { useActionState } from 'react'

import { deleteReplyAction, deleteTopicAction } from '../../actions'
import { FormMessage } from '@/components/AuthShell'

export function DeleteTopicButton({
  topicId,
  categorySlug,
}: {
  topicId: string
  categorySlug: string
}) {
  const [state, action, pending] = useActionState(deleteTopicAction, null)
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const ok = window.confirm(
          'Supprimer ce sujet et toutes ses réponses ? Définitif.',
        )
        if (!ok) e.preventDefault()
      }}
      className="inline-flex items-center gap-3"
    >
      <input type="hidden" name="topic" value={topicId} />
      <input type="hidden" name="categorySlug" value={categorySlug} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs italic text-ink-soft underline-offset-4 hover:text-tomato hover:underline disabled:opacity-50"
      >
        {pending ? 'Suppression…' : 'Supprimer le sujet'}
      </button>
      {state?.error ? <FormMessage error={state.error} /> : null}
    </form>
  )
}

export function DeleteReplyButton({
  replyId,
  categorySlug,
  topicSlug,
}: {
  replyId: string
  categorySlug: string
  topicSlug: string
}) {
  const [state, action, pending] = useActionState(deleteReplyAction, null)
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const ok = window.confirm('Supprimer cette réponse ?')
        if (!ok) e.preventDefault()
      }}
      className="inline"
    >
      <input type="hidden" name="reply" value={replyId} />
      <input type="hidden" name="categorySlug" value={categorySlug} />
      <input type="hidden" name="topicSlug" value={topicSlug} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs italic text-ink-soft underline-offset-4 hover:text-tomato hover:underline disabled:opacity-50"
      >
        {pending ? '…' : 'Supprimer'}
      </button>
      {state?.error ? (
        <span className="ml-2 text-xs text-tomato">{state.error}</span>
      ) : null}
    </form>
  )
}
