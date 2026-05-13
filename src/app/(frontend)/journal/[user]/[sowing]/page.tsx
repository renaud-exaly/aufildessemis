import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Container } from '@/components/Container'
import { ReportLink } from '@/components/ReportLink'
import { RichText } from '@/components/RichText'
import { SOWING_STAGES } from '@/lib/stages'
import { getPayloadClient } from '@/lib/payload'

export const revalidate = 30

type Params = { user: string; sowing: string }

const stageLabel = (value?: string | null) =>
  value ? SOWING_STAGES.find((s) => s.value === value)?.label ?? value : null

async function getSowing(id: string) {
  const payload = await getPayloadClient()
  try {
    const doc = await payload.findByID({
      collection: 'sowings',
      id,
      depth: 2,
    })
    return doc
  } catch {
    return null
  }
}

async function getUpdates(sowingId: string | number) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'sowing-updates',
    where: { sowing: { equals: sowingId } },
    limit: 200,
    sort: '-date',
    depth: 2,
  })
  return docs
}

export default async function SowingDetailPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { sowing: sowingId } = await params
  const sowing = await getSowing(sowingId)
  if (!sowing) notFound()
  if (sowing.visibility !== 'public') notFound()

  const updates = await getUpdates(sowing.id)

  const ownerName =
    typeof sowing.owner === 'object' && sowing.owner
      ? sowing.owner.displayName
      : null
  const plantName =
    typeof sowing.plant === 'object' && sowing.plant
      ? sowing.plant.name
      : null
  const plantSlug =
    typeof sowing.plant === 'object' && sowing.plant
      ? sowing.plant.slug
      : null

  return (
    <>
      {/* Header */}
      <section className="border-b border-green-soft/40 py-16">
        <Container>
          <Link
            href="/journal"
            className="text-sm uppercase tracking-[0.14em] text-ink-soft hover:text-tomato"
          >
            ← Journal
          </Link>
          <h1 className="mt-8 font-serif text-5xl text-green-deep md:text-6xl">
            {sowing.name}
          </h1>
          <p className="mt-4 text-ink-soft">
            {plantName ? (
              plantSlug ? (
                <Link
                  href={`/bibliotheque/${plantSlug}`}
                  className="text-green-deep underline-offset-4 hover:underline"
                >
                  {plantName}
                </Link>
              ) : (
                plantName
              )
            ) : null}
            {ownerName ? <> · par {ownerName}</> : null}
            {sowing.startedAt ? (
              <>
                {' '}
                · démarré le{' '}
                {new Date(sowing.startedAt).toLocaleDateString('fr-BE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </>
            ) : null}
          </p>
          {sowing.currentStage ? (
            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-tomato/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-tomato">
              <span aria-hidden>●</span>
              Stade : {stageLabel(sowing.currentStage)}
            </span>
          ) : null}
        </Container>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <Container>
          {updates.length ? (
            <ol className="relative space-y-12 border-l border-green-soft/60 pl-8">
              {updates.map((u) => (
                <li key={u.id} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[35px] grid h-3.5 w-3.5 place-items-center rounded-full bg-green-sage ring-4 ring-cream"
                  />
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <time className="font-serif text-2xl text-green-deep">
                      {u.date
                        ? new Date(u.date).toLocaleDateString('fr-BE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : null}
                    </time>
                    {u.stage ? (
                      <span className="rounded-full bg-green-soft/40 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-green-deep">
                        {stageLabel(u.stage)}
                      </span>
                    ) : null}
                  </div>
                  {u.note ? (
                    <div className="prose prose-stone mt-4 max-w-prose text-ink">
                      <RichText data={u.note as never} />
                    </div>
                  ) : null}
                  {u.photos?.length ? (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {u.photos.map((photo, idx) => {
                        const img = photo.image
                        if (!img || typeof img !== 'object' || !img.url) return null
                        return (
                          <div
                            key={idx}
                            className="aspect-[4/3] relative overflow-hidden rounded-soft bg-sand-soft"
                          >
                            <Image
                              src={img.url}
                              alt={img.alt ?? ''}
                              fill
                              sizes="(min-width: 640px) 50vw, 100vw"
                              className="object-cover"
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-ink-soft">
              Ce lot n&apos;a pas encore de mise à jour.
            </p>
          )}

          <div className="mt-16 flex justify-end border-t border-green-soft/30 pt-6">
            <ReportLink targetCollection="sowings" targetId={sowing.id} />
          </div>
        </Container>
      </section>
    </>
  )
}
