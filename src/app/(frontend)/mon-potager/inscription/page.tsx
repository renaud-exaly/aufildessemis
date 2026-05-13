import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SignupForm } from './SignupForm'
import { AuthShell } from '@/components/AuthShell'
import { getSession } from '@/lib/auth'

export const metadata = { title: 'Inscription' }

export default async function InscriptionPage() {
  const session = await getSession()
  if (session) redirect('/mon-potager')

  return (
    <AuthShell
      title="Rejoindre le carnet."
      subtitle="Pour partager tes semis et suivre les autres."
      footer={
        <p>
          Déjà un compte ?{' '}
          <Link
            href="/mon-potager/connexion"
            className="font-medium text-green-deep underline-offset-4 hover:underline"
          >
            Connecte-toi
          </Link>
          .
        </p>
      }
    >
      <SignupForm />
    </AuthShell>
  )
}
