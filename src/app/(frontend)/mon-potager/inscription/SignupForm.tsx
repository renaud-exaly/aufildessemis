'use client'

import { useActionState } from 'react'

import { signUpAction } from '../actions'
import {
  AuthField,
  FormMessage,
  SubmitButton,
} from '@/components/AuthShell'

export function SignupForm() {
  const [state, action, pending] = useActionState(signUpAction, null)

  if (state?.ok) {
    return <FormMessage ok message={state.message} />
  }

  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state?.error} />
      <AuthField
        label="Prénom ou nom d'affichage"
        name="displayName"
        autoComplete="name"
        placeholder="Comment t'appeler ?"
      />
      <AuthField label="Email" name="email" type="email" autoComplete="email" />
      <AuthField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="8 caractères minimum"
      />
      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input
          type="checkbox"
          name="newsletter"
          className="mt-1 h-4 w-4 rounded border-green-soft accent-green-deep"
        />
        <span>
          Je veux recevoir la newsletter mensuelle{' '}
          <em>« Ce mois au potager »</em>.
        </span>
      </label>
      <SubmitButton>{pending ? 'Création…' : 'Créer mon compte →'}</SubmitButton>
      <p className="text-xs italic text-ink-soft">
        En t&apos;inscrivant, tu acceptes notre{' '}
        <a
          href="/confidentialite"
          className="underline underline-offset-2 hover:text-tomato"
        >
          politique de confidentialité
        </a>
        .
      </p>
    </form>
  )
}
