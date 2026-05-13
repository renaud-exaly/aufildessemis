import { Container } from '@/components/Container'
import { TipCard } from '@/components/TipCard'
import { getPayloadClient } from '@/lib/payload'


export const metadata = {
  title: 'Tips & conseils',
  description: 'Conseils, astuces et bonnes pratiques pour ton potager.',
}

export default async function TipsPage() {
  let tips: Array<{ slug: string; title: string }> = []
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'tips',
      where: { status: { equals: 'published' } },
      limit: 50,
      sort: '-updatedAt',
      depth: 2,
    })
    tips = docs
  } catch {
    tips = []
  }

  return (
    <>
      <section className="border-b border-green-soft/40 py-20">
        <Container>
          <h1 className="font-serif text-5xl text-green-deep md:text-7xl">
            Le carnet des astuces
          </h1>
          <p className="mt-4 font-serif text-xl italic text-ink-soft">
            Petites trouvailles, méthodes douces.
          </p>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink">
            Leçons apprises au potager — partagées au fil des saisons.
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          {tips.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tips.map((tip) => (
                <TipCard key={tip.slug} tip={tip} />
              ))}
            </div>
          ) : (
            <p className="text-center text-ink-soft">
              Aucun tip publié pour le moment.
            </p>
          )}
        </Container>
      </section>
    </>
  )
}
