import { redirect } from 'next/navigation'

import { NewSowingForm } from './NewSowingForm'
import { AuthShell } from '@/components/AuthShell'
import { getSession } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export const metadata = {
  title: 'Nouveau lot — Mon potager',
  description: 'Ajoute un nouveau lot de semis à ton carnet.',
}

async function getPlants() {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'plants',
      limit: 200,
      sort: 'name',
      depth: 0,
    })
    return docs.map((p) => ({ id: String(p.id), name: p.name }))
  } catch {
    return []
  }
}

export default async function NewSowingPage() {
  const session = await getSession()
  if (!session) redirect('/mon-potager/connexion')

  const plants = await getPlants()

  return (
    <AuthShell
      title="Nouveau lot"
      subtitle="Un nom, une plante, une date — tu pourras compléter ensuite."
    >
      <NewSowingForm plants={plants} />
    </AuthShell>
  )
}
