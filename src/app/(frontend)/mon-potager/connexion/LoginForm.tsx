'use client'

import { useActionState } from 'react'

import { signInAction } from '../actions'
import {
  AuthField,
  FormMessage,
  SubmitButton,
} from '@/components/AuthShell'

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, null)

  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} ok={state?.ok} message={state?.message} />
      <AuthField label="Email" name="email" type="email" autoComplete="email" />
      <AuthField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
      />
      <SubmitButton>{pending ? 'Connexion…' : 'Se connecter →'}</SubmitButton>
    </form>
  )
}
