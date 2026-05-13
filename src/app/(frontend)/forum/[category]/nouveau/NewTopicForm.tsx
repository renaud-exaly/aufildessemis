'use client'

import { useActionState } from 'react'

import { createTopicAction } from '../../actions'
import { AuthField, FormMessage, SubmitButton } from '@/components/AuthShell'
import { MarkdownEditor } from '@/components/MarkdownEditor'

export function NewTopicForm({ categorySlug }: { categorySlug: string }) {
  const [state, action, pending] = useActionState(createTopicAction, null)

  return (
    <form action={action} className="space-y-6">
      <FormMessage error={state?.error} />
      <input type="hidden" name="categorySlug" value={categorySlug} />

      <AuthField
        label="Titre"
        name="title"
        placeholder="Par exemple : « Pourquoi mes courgettes jaunissent ? »"
        autoComplete="off"
      />

      <div>
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
          Message
        </span>
        <div className="mt-2">
          <MarkdownEditor
            name="body"
            placeholder="Décris ta question, raconte ton histoire…"
            minHeight={220}
          />
        </div>
      </div>

      <p className="text-xs italic text-ink-soft">
        Les formats sont au markdown : <strong>**gras**</strong>,{' '}
        <em>*italique*</em>, <code>{'>'}</code> citation, <code>1.</code> liste,
        <code>[texte](url)</code> lien. La toolbar t&apos;aide aussi.
      </p>

      <SubmitButton>{pending ? 'Publication…' : 'Publier le sujet →'}</SubmitButton>
    </form>
  )
}
