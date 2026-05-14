'use client'

import { useActionState } from 'react'

import { createSowingAction } from '../actions'
import { AuthField, FormMessage, SubmitButton } from '@/components/AuthShell'
import { Combobox } from '@/components/Combobox'
import { DatePicker } from '@/components/DatePicker'

type PlantOption = { id: string; name: string }

export function NewSowingForm({
  plants,
  defaultPlantId,
}: {
  plants: PlantOption[]
  defaultPlantId?: string
}) {
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

      <Combobox
        name="plant"
        label="Plante"
        placeholder="Tape pour chercher (tomate, basilic…)"
        required
        defaultValue={defaultPlantId}
        options={plants.map((p) => ({ value: p.id, label: p.name }))}
        emptyMessage="Aucune plante de ce nom dans la bibliothèque."
      />

      <DatePicker
        name="startedAt"
        label="Date de démarrage"
        defaultValue={today}
        required
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
