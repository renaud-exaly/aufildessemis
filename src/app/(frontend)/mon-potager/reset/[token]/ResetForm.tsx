'use client'

import { useActionState } from 'react'

import { resetPasswordAction } from '../../actions'
import {
  AuthField,
  FormMessage,
  SubmitButton,
} from '@/components/AuthShell'

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null)

  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} />
      <input type="hidden" name="token" value={token} />
      <AuthField
        label="Nouveau mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="8 caractères minimum"
      />
      <SubmitButton>
        {pending ? 'Enregistrement…' : 'Définir le mot de passe →'}
      </SubmitButton>
    </form>
  )
}
