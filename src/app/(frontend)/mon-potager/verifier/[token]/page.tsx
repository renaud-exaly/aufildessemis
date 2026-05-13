import Link from 'next/link'

import { AuthShell } from '@/components/AuthShell'
import { getPayloadClient } from '@/lib/payload'

export const metadata = { title: 'Vérification' }

async function verify(token: string): Promise<boolean> {
  try {
    const payload = await getPayloadClient()
    const ok = await payload.verifyEmail({
      collection: 'users',
      token,
    })
    return Boolean(ok)
  } catch {
    return false
  }
}

export default async function VerifierPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const ok = await verify(token)

  if (ok) {
    return (
      <AuthShell
        title="Bienvenue parmi nous."
        subtitle="Ton compte est confirmé."
        footer={
          <p>
            <Link
              href="/mon-potager/connexion"
              className="font-medium text-green-deep underline-offset-4 hover:underline"
            >
              Se connecter →
            </Link>
          </p>
        }
      >
        <p className="rounded-soft border border-green-sage/40 bg-green-sage/10 p-4 text-sm text-green-deep">
          🌱 Ton adresse email est vérifiée. Tu peux maintenant te connecter
          pour commencer à tenir ton carnet.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Lien invalide ou expiré."
      subtitle="Demande un nouveau lien depuis la connexion."
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
      <p className="rounded-soft border border-tomato/40 bg-tomato/[0.06] p-4 text-sm text-tomato">
        Ce lien ne fonctionne plus. Il a peut-être déjà été utilisé, ou il a
        expiré.
      </p>
    </AuthShell>
  )
}
