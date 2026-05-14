'use client'

import Image from 'next/image'
import { useActionState, useRef, useState } from 'react'

import {
  deleteSowingUpdateAction,
  updateSowingUpdateAction,
} from '../actions'
import { FormMessage, SubmitButton } from '@/components/AuthShell'
import { DatePicker } from '@/components/DatePicker'
import { RichText } from '@/components/RichText'

type StageOption = { value: string; label: string }
type Photo = {
  image: {
    url?: string | null
    alt?: string | null
    width?: number | null
    height?: number | null
  } | null
}

export type UpdateView = {
  id: string
  date: string | null
  stage: string | null
  stageLabel: string | null
  note: unknown
  notePlain: string
  photos: Photo[]
}

export function UpdateTimelineItem({
  update,
  stages,
}: {
  update: UpdateView
  stages: StageOption[]
}) {
  const [editing, setEditing] = useState(false)
  const [editState, editAction, editPending] = useActionState(
    updateSowingUpdateAction,
    null,
  )
  const [delState, delAction, delPending] = useActionState(
    deleteSowingUpdateAction,
    null,
  )
  const formRef = useRef<HTMLFormElement>(null)
  const [photoCount, setPhotoCount] = useState(0)

  // Sortie du mode édition au succès.
  if (editState?.ok && editing && !editPending) {
    queueMicrotask(() => {
      setEditing(false)
      setPhotoCount(0)
    })
  }

  const dateISO = update.date ? update.date.slice(0, 10) : ''
  const formattedDate = update.date
    ? new Date(update.date).toLocaleDateString('fr-BE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  if (editing) {
    return (
      <div className="rounded-soft border border-green-soft/60 bg-cream-warm p-5">
        <form ref={formRef} action={editAction} className="space-y-5">
          <FormMessage
            error={editState?.error}
            ok={editState?.ok}
            message={editState?.message}
          />
          <input type="hidden" name="updateId" value={update.id} />

          <div className="grid gap-5 sm:grid-cols-2">
            <DatePicker
              name="date"
              label="Date"
              defaultValue={dateISO}
              required
            />
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
                Étape (optionnel)
              </span>
              <select
                name="stage"
                defaultValue={update.stage ?? ''}
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
              defaultValue={update.notePlain}
              className="mt-2 w-full rounded-soft border border-green-soft/60 bg-cream px-4 py-3 font-sans text-base text-ink placeholder:text-ink-soft/60 focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep/30"
            />
          </label>

          {update.photos.length ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
                Photos existantes ({update.photos.length}) — conservées
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {update.photos.map((p, idx) =>
                  p.image?.url ? (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-soft bg-sand-soft"
                    >
                      <Image
                        src={p.image.url}
                        alt={p.image.alt ?? ''}
                        width={p.image.width ?? 400}
                        height={p.image.height ?? 400}
                        sizes="33vw"
                        className="h-auto w-full"
                      />
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          ) : null}

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
              Ajouter des photos (jusqu&apos;à 6)
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
                {photoCount} photo{photoCount > 1 ? 's' : ''} prête
                {photoCount > 1 ? 's' : ''} à ajouter.
              </p>
            ) : null}
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton>
              {editPending ? 'Enregistrement…' : 'Enregistrer'}
            </SubmitButton>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm italic text-ink-soft underline-offset-4 hover:text-tomato hover:underline"
            >
              Annuler
            </button>
          </div>
        </form>

        <form action={delAction} className="mt-6 border-t border-green-soft/40 pt-4">
          <input type="hidden" name="updateId" value={update.id} />
          <FormMessage error={delState?.error} />
          <button
            type="submit"
            disabled={delPending}
            onClick={(e) => {
              if (!confirm('Supprimer cette entrée ? Cette action est définitive.')) {
                e.preventDefault()
              }
            }}
            className="text-xs uppercase tracking-[0.14em] text-tomato underline-offset-4 hover:underline disabled:opacity-60"
          >
            {delPending ? 'Suppression…' : 'Supprimer cette entrée'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <time className="font-serif text-xl text-green-deep">
          {formattedDate}
        </time>
        {update.stageLabel ? (
          <span className="rounded-full bg-green-soft/40 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-green-deep">
            {update.stageLabel}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ml-auto text-xs uppercase tracking-[0.14em] text-ink-soft underline-offset-4 hover:text-tomato hover:underline"
        >
          Modifier
        </button>
      </div>
      {update.note ? (
        <div className="prose prose-stone mt-3 max-w-prose text-ink">
          <RichText data={update.note as never} />
        </div>
      ) : null}
      {update.photos.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {update.photos.map((p, idx) =>
            p.image?.url ? (
              <div
                key={idx}
                className="overflow-hidden rounded-soft bg-sand-soft"
              >
                <Image
                  src={p.image.url}
                  alt={p.image.alt ?? ''}
                  width={p.image.width ?? 800}
                  height={p.image.height ?? 600}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="h-auto w-full"
                />
              </div>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  )
}
