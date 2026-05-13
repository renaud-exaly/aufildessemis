import Link from 'next/link'

import { ForgotForm } from './ForgotForm'
import { AuthShell } from '@/components/AuthShell'

export const metadata = { title: 'Mot de passe oublié' }

export default function OubliMdpPage() {
  return (
    <AuthShell
      title="Mot de passe oublié."
      subtitle="On t'envoie un lien pour le réinitialiser."
      footer={
        <p>
          <Link
            href="/mon-potager/connexion"
            className="font-medium text-green-deep underline-offset-4 hover:underline"
          >
            ← Retour à la connexion
          </Link>
        </p>
      }
    >
      <ForgotForm />
    </AuthShell>
  )
}
