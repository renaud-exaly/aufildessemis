'use client'

import { useActionState, useState } from 'react'

import {
  submitReportAction,
  type ReportTargetCollection,
} from '@/app/actions/report'

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Contenu inapproprié' },
  { value: 'harassment', label: 'Harcèlement' },
  { value: 'misinformation', label: 'Désinformation jardinage' },
  { value: 'other', label: 'Autre' },
]

export function ReportLink({
  targetCollection,
  targetId,
  label = 'Signaler',
}: {
  targetCollection: ReportTargetCollection
  targetId: string | number
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(submitReportAction, null)

  if (state?.ok) {
    return (
      <p className="text-xs italic text-ink-soft">
        Merci — signalement transmis.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs italic text-ink-soft underline-offset-4 hover:text-tomato hover:underline"
      >
        {label}
      </button>
    )
  }

  return (
    <form
      action={action}
      className="mt-3 max-w-md rounded-soft bg-cream-warm p-5 shadow-warm"
    >
      <input type="hidden" name="targetCollection" value={targetCollection} />
      <input type="hidden" name="targetId" value={String(targetId)} />
      <p className="font-serif text-lg text-green-deep">Signaler ce contenu</p>
      <p className="mt-1 text-xs italic text-ink-soft">
        Un modérateur regardera dès que possible.
      </p>

      {state?.ok === false ? (
        <p className="mt-3 rounded-soft border border-tomato/40 bg-tomato/[0.06] p-2 text-xs text-tomato">
          {state.error}
        </p>
      ) : null}

      <fieldset className="mt-4 space-y-2">
        <legend className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
          Motif
        </legend>
        {REASONS.map((r) => (
          <label
            key={r.value}
            className="flex items-center gap-2 text-sm text-ink"
          >
            <input
              type="radio"
              name="reason"
              value={r.value}
              required
              className="accent-green-deep"
            />
            {r.label}
          </label>
        ))}
      </fieldset>

      <label className="mt-4 block">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
          Précisions (optionnel)
        </span>
        <textarea
          name="note"
          rows={3}
          className="mt-2 w-full rounded-soft border border-green-soft/60 bg-cream px-3 py-2 text-sm text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep/30"
        />
      </label>

      <div className="mt-5 flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs italic text-ink-soft hover:text-tomato"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-green-deep px-5 py-2 text-xs font-semibold text-white tracking-[0.04em] transition-colors hover:bg-[#234034] disabled:opacity-60"
        >
          {pending ? 'Envoi…' : 'Envoyer'}
        </button>
      </div>
    </form>
  )
}
