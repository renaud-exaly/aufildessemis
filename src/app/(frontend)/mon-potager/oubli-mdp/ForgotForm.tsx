'use client'

import { useActionState } from 'react'

import { requestPasswordResetAction } from '../actions'
import {
  AuthField,
  FormMessage,
  SubmitButton,
} from '@/components/AuthShell'

export function ForgotForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    null,
  )

  if (state?.ok) return <FormMessage ok message={state.message} />

  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} />
      <AuthField label="Email" name="email" type="email" autoComplete="email" />
      <SubmitButton>
        {pending ? 'Envoi…' : 'Envoyer le lien de réinitialisation →'}
      </SubmitButton>
    </form>
  )
}
