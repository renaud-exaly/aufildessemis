'use client'

import { useActionState } from 'react'

import { createSowingAction } from '../actions'
import { AuthField, FormMessage, SubmitButton } from '@/components/AuthShell'

type PlantOption = { id: string; name: string }

export function NewSowingForm({ plants }: { plants: PlantOption[] }) {
  const [state, action, pending] = useActionState(createSowingAction, null)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} />

      <AuthField
        label="Nom du lot"
        name="name"
        placeholder="Mes courgettes 2026"
        autoComplete="off"
      />

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
          Plante
        </span>
        <select
          name="plant"
          required
          defaultValue=""
          className="mt-2 w-full rounded-soft border border-green-soft/60 bg-cream-warm px-4 py-3 font-sans text-base text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep/30"
        >
          <option value="" disabled>
            — Choisis dans la bibliothèque —
          </option>
          {plants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <AuthField
        label="Date de démarrage"
        name="startedAt"
        type="date"
        defaultValue={today}
      />

      <label className="block">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
          Visibilité
        </span>
        <select
          name="visibility"
          defaultValue="public"
          className="mt-2 w-full rounded-soft border border-green-soft/60 bg-cream-warm px-4 py-3 font-sans text-base text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep/30"
        >
          <option value="public">Public — visible dans le journal</option>
          <option value="private">Privé — toi seul·e</option>
        </select>
      </label>

      <SubmitButton>{pending ? 'Création…' : 'Créer le lot →'}</SubmitButton>
    </form>
  )
}
