import { Container } from '@/components/Container'
import { SowingCard } from '@/components/SowingCard'
import { getPayloadClient } from '@/lib/payload'
import { getLatestSowingPhotos, plantCoverFromSowing } from '@/lib/sowings'


export const metadata = {
  title: 'Journal',
  description:
    'Le fil des semis et plantations de la communauté, en direct des potagers.',
}

export default async function JournalPage() {
  type SowingDoc = {
    id: string | number
    name: string
    plant?:
      | string
      | number
      | { name?: string | null; slug?: string | null; coverImage?: unknown }
  }
  let sowings: SowingDoc[] = []
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'sowings',
      where: { visibility: { equals: 'public' } },
      limit: 50,
      sort: '-updatedAt',
      depth: 2,
    })
    sowings = docs
  } catch {
    sowings = []
  }

  const photoMap = await getLatestSowingPhotos(sowings.map((s) => s.id))
  const sowingsWithCover = sowings.map((s) => ({
    ...s,
    latestPhoto: photoMap.get(String(s.id)) ?? plantCoverFromSowing(s) ?? undefined,
  }))

  return (
    <>
      <section className="border-b border-green-soft/40 py-20">
        <Container>
          <h1 className="font-serif text-5xl text-green-deep md:text-7xl">
            Le journal
          </h1>
          <p className="mt-4 font-serif text-xl italic text-ink-soft">
            Au jour le jour, ce qui pousse.
          </p>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink">
            Ce qui peine, ce qui surprend. Chaque lot de semis est tenu par un
            membre de la communauté.
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          {sowingsWithCover.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sowingsWithCover.map((sowing) => (
                <SowingCard key={sowing.id} sowing={sowing} />
              ))}
            </div>
          ) : (
            <div className="rounded-pillow border border-green-soft/40 bg-surface p-12 text-center">
              <p className="font-serif text-2xl text-green-deep">
                Le journal est encore tout neuf.
              </p>
              <p className="mt-3 max-w-prose text-ink-soft mx-auto">
                Sois le premier à partager tes courgettes, tes poivrons, ton
                basilic naissant.
              </p>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
