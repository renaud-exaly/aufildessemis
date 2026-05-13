'use client'

import { useActionState, useRef, useState } from 'react'

import { addSowingUpdateAction } from '../actions'
import { FormMessage, SubmitButton } from '@/components/AuthShell'
import { DatePicker } from '@/components/DatePicker'

type StageOption = { value: string; label: string }

export function AddUpdateForm({
  sowingId,
  stages,
}: {
  sowingId: string
  stages: StageOption[]
}) {
  const [state, action, pending] = useActionState(addSowingUpdateAction, null)
  const today = new Date().toISOString().slice(0, 10)
  const formRef = useRef<HTMLFormElement>(null)
  const [photoCount, setPhotoCount] = useState(0)

  // Reset après succès.
  if (state?.ok && formRef.current && !pending) {
    queueMicrotask(() => {
      formRef.current?.reset()
      setPhotoCount(0)
    })
  }

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <FormMessage error={state?.error} ok={state?.ok} message={state?.message} />
      <input type="hidden" name="sowing" value={sowingId} />

      <div className="grid gap-5 sm:grid-cols-2">
        <DatePicker
          name="date"
          label="Date"
          defaultValue={today}
          required
        />
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
            Étape (optionnel)
          </span>
          <select
            name="stage"
            defaultValue=""
            className="mt-2 w-full rounded-soft border border-green-soft/60 bg-cream px-4 py-3 font-sans text-base text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep/30"
          >
            <option value="">— Aucune —</option>
            {stages.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
          Note
        </span>
        <textarea
          name="note"
          rows={4}
          placeholder="Comment ça va ? Ce qui pousse, ce qui peine…"
          className="mt-2 w-full rounded-soft border border-green-soft/60 bg-cream px-4 py-3 font-sans text-base text-ink placeholder:text-ink-soft/60 focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep/30"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
          Photos (jusqu&apos;à 6)
        </span>
        <input
          type="file"
          name="photos"
          accept="image/*"
          multiple
          capture="environment"
          onChange={(e) => setPhotoCount(e.currentTarget.files?.length ?? 0)}
          className="mt-2 block w-full text-sm text-ink-soft file:mr-4 file:rounded-full file:border-0 file:bg-green-deep file:px-5 file:py-2.5 file:text-sm file:font-semibold file:text-white file:cursor-pointer hover:file:bg-[#234034]"
        />
        {photoCount > 0 ? (
          <p className="mt-2 text-xs italic text-ink-soft">
            {photoCount} photo{photoCount > 1 ? 's' : ''} prête{photoCount > 1 ? 's' : ''}.
          </p>
        ) : null}
      </label>

      <SubmitButton>
        {pending ? 'Envoi…' : 'Ajouter la mise à jour →'}
      </SubmitButton>
    </form>
  )
}
