import { Container } from '@/components/Container'
import { PlantCard } from '@/components/PlantCard'
import { getPayloadClient } from '@/lib/payload'


export const metadata = {
  title: 'Bibliothèque',
  description:
    'Toutes les fiches plantes : période de semis Belgique, étapes typiques, conseils.',
}

export default async function BibliothequePage() {
  let plants: Array<{ id: string | number; slug: string; name: string }> = []
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'plants',
      limit: 100,
      sort: 'name',
      depth: 1,
    })
    plants = docs
  } catch {
    plants = []
  }

  return (
    <>
      <section className="border-b border-green-soft/40 py-20">
        <Container>
          <h1 className="font-serif text-5xl text-green-deep md:text-7xl">
            La bibliothèque
          </h1>
          <p className="mt-4 font-serif text-xl italic text-ink-soft">
            Une fiche par espèce.
          </p>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink">
            Fenêtre de semis adaptée à la Belgique, étapes typiques et conseils
            glanés au fil des saisons.
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          {plants.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plants.map((plant) => (
                <PlantCard key={plant.id} plant={plant} />
              ))}
            </div>
          ) : (
            <p className="text-center text-ink-soft">
              La bibliothèque est vide pour le moment. Lance{' '}
              <code className="rounded bg-surface px-2 py-0.5">pnpm seed</code>{' '}
              pour insérer les fiches initiales.
            </p>
          )}
        </Container>
      </section>
    </>
  )
}
