'use client'

import { useActionState, useEffect, useRef, useState } from 'react'

import { createReplyAction } from '../../actions'
import { FormMessage, SubmitButton } from '@/components/AuthShell'
import { MarkdownEditor } from '@/components/MarkdownEditor'

export function ReplyForm({
  topicId,
  categorySlug,
  topicSlug,
}: {
  topicId: string
  categorySlug: string
  topicSlug: string
}) {
  const [state, action, pending] = useActionState(createReplyAction, null)
  const formRef = useRef<HTMLFormElement>(null)
  // Remount key pour reset l'éditeur Tiptap après succès.
  const [editorKey, setEditorKey] = useState(0)

  useEffect(() => {
    if (state?.ok && !pending) {
      formRef.current?.reset()
      setEditorKey((k) => k + 1)
    }
  }, [state?.ok, pending])

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <FormMessage error={state?.error} ok={state?.ok} message={state?.message} />
      <input type="hidden" name="topic" value={topicId} />
      <input type="hidden" name="categorySlug" value={categorySlug} />
      <input type="hidden" name="topicSlug" value={topicSlug} />
      <MarkdownEditor
        key={editorKey}
        name="body"
        placeholder="Ta réponse…"
        minHeight={140}
      />
      <SubmitButton>{pending ? 'Envoi…' : 'Répondre →'}</SubmitButton>
    </form>
  )
}
