import { ResetForm } from './ResetForm'
import { AuthShell } from '@/components/AuthShell'

export const metadata = { title: 'Nouveau mot de passe' }

export default async function ResetPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return (
    <AuthShell
      title="Nouveau mot de passe."
      subtitle="Choisis-en un solide — au moins 8 caractères."
    >
      <ResetForm token={token} />
    </AuthShell>
  )
}
