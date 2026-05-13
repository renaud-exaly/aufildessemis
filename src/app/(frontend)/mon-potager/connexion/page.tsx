import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LoginForm } from './LoginForm'
import { AuthShell } from '@/components/AuthShell'
import { getSession } from '@/lib/auth'

export const metadata = { title: 'Connexion' }

export default async function ConnexionPage() {
  const session = await getSession()
  if (session) redirect('/mon-potager')

  return (
    <AuthShell
      title="Bon retour."
      subtitle="Connecte-toi à ton carnet."
      footer={
        <>
          <p>
            Pas encore de compte ?{' '}
            <Link
              href="/mon-potager/inscription"
              className="font-medium text-green-deep underline-offset-4 hover:underline"
            >
              Inscris-toi
            </Link>
            .
          </p>
          <p className="mt-2">
            <Link
              href="/mon-potager/oubli-mdp"
              className="italic underline-offset-4 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </p>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
