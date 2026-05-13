'use client'

import { useActionState, useEffect, useRef } from 'react'

import { changePasswordAction } from './actions'
import { AuthField, FormMessage, SubmitButton } from '@/components/AuthShell'

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok && !pending) {
      formRef.current?.reset()
    }
  }, [state?.ok, pending])

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <FormMessage error={state?.error} ok={state?.ok} message={state?.message} />
      <AuthField
        label="Mot de passe actuel"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
      />
      <AuthField
        label="Nouveau mot de passe"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        placeholder="8 caractères minimum"
      />
      <AuthField
        label="Confirme le nouveau mot de passe"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
      />
      <SubmitButton>
        {pending ? 'Mise à jour…' : 'Changer mon mot de passe →'}
      </SubmitButton>
    </form>
  )
}
