'use client'

import { useActionState } from 'react'

import { deleteSowingAction } from '../actions'
import { FormMessage } from '@/components/AuthShell'

export function DeleteSowingForm({ sowingId }: { sowingId: string }) {
  const [state, action, pending] = useActionState(deleteSowingAction, null)

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const ok = window.confirm(
          'Supprimer ce lot et toutes ses mises à jour ? Cette action est définitive.',
        )
        if (!ok) e.preventDefault()
      }}
      className="space-y-3"
    >
      <FormMessage error={state?.error} />
      <input type="hidden" name="sowing" value={sowingId} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm italic text-ink-soft underline-offset-4 hover:text-tomato hover:underline disabled:opacity-50"
      >
        {pending ? 'Suppression…' : 'Supprimer ce lot'}
      </button>
    </form>
  )
}
