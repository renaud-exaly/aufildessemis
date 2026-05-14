import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { AddUpdateForm } from './AddUpdateForm'
import { DeleteSowingForm } from './DeleteSowingForm'
import { UpdateTimelineItem, type UpdateView } from './UpdateTimelineItem'
import { Container } from '@/components/Container'
import { getSession } from '@/lib/auth'
import { lexicalToPlainText } from '@/lib/lexical'
import { getPayloadClient } from '@/lib/payload'
import { SOWING_STAGES } from '@/lib/stages'

type Params = { sowing: string }

const stageLabel = (value?: string | null) =>
  value ? SOWING_STAGES.find((s) => s.value === value)?.label ?? value : null

async function getOwnSowing(id: string, userId: string | number) {
  try {
    const payload = await getPayloadClient()
    const doc = await payload.findByID({
      collection: 'sowings',
      id,
      depth: 2,
      overrideAccess: true,
    })
    const ownerId = typeof doc.owner === 'object' ? doc.owner.id : doc.owner
    if (String(ownerId) !== String(userId)) return null
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
    overrideAccess: true,
  })
  return docs
}

export const metadata = {
  title: 'Lot de semis — Mon potager',
}

export default async function OwnerSowingPage({
  params,
}: {
  params: Promise<Params>
}) {
  const session = await getSession()
  if (!session) redirect('/mon-potager/connexion')

  const { sowing: sowingId } = await params
  const sowing = await getOwnSowing(sowingId, session.id)
  if (!sowing) notFound()

  const updates = await getUpdates(sowing.id)
  const plantName =
    typeof sowing.plant === 'object' && sowing.plant ? sowing.plant.name : null
  const plantSlug =
    typeof sowing.plant === 'object' && sowing.plant ? sowing.plant.slug : null

  const availableStages: { value: string; label: string }[] = (() => {
    if (typeof sowing.plant === 'object' && sowing.plant?.typicalStages?.length) {
      const out: { value: string; label: string }[] = []
      for (const s of sowing.plant.typicalStages as Array<{
        stage?: string | null
      }>) {
        if (!s.stage) continue
        const meta = SOWING_STAGES.find((x) => x.value === s.stage)
        if (meta) out.push({ value: meta.value, label: meta.label })
      }
      return out
    }
    return SOWING_STAGES.map((s) => ({ value: s.value, label: s.label }))
  })()

  return (
    <>
      {/* Header */}
      <section className="border-b border-green-soft/40 py-12">
        <Container>
          <Link
            href="/mon-potager"
            className="text-sm uppercase tracking-[0.14em] text-ink-soft hover:text-tomato"
          >
            ← Mon potager
          </Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl text-green-deep md:text-5xl">
                {sowing.name}
              </h1>
              <p className="mt-2 text-sm text-ink-soft">
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
                {sowing.startedAt ? (
                  <>
                    {plantName ? ' · ' : ''}démarré le{' '}
                    {new Date(sowing.startedAt).toLocaleDateString('fr-BE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </>
                ) : null}
                {' · '}
                <span className="italic">
                  {sowing.visibility === 'public' ? 'public' : 'privé'}
                </span>
              </p>
            </div>
            {sowing.visibility === 'public' ? (
              <Link
                href={`/journal/${session.id}/${sowing.id}`}
                className="text-sm italic text-ink-soft underline-offset-4 hover:text-tomato hover:underline"
              >
                Voir la version publique →
              </Link>
            ) : null}
          </div>
          {sowing.currentStage ? (
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-tomato/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-tomato">
              <span aria-hidden>●</span>
              Stade : {stageLabel(sowing.currentStage)}
            </span>
          ) : null}
        </Container>
      </section>

      {/* Formulaire d'ajout */}
      <section className="bg-cream-warm py-12">
        <Container className="max-w-2xl">
          <h2 className="font-serif text-2xl text-green-deep">
            Nouvelle entrée
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Une photo, deux lignes — c&apos;est ça l&apos;idée.
          </p>
          <div className="mt-6">
            <AddUpdateForm
              sowingId={String(sowing.id)}
              stages={availableStages}
            />
          </div>
        </Container>
      </section>

      {/* Timeline */}
      <section className="py-12">
        <Container>
          <h2 className="font-serif text-2xl text-green-deep">
            Le fil de ce lot
          </h2>
          <div className="mt-8">
            {updates.length ? (
              <ol className="relative space-y-10 border-l border-green-soft/60 pl-8">
                {updates.map((u) => {
                  const view: UpdateView = {
                    id: String(u.id),
                    date: u.date ?? null,
                    stage: u.stage ?? null,
                    stageLabel: stageLabel(u.stage),
                    note: u.note ?? null,
                    notePlain: lexicalToPlainText(u.note),
                    photos: (Array.isArray(u.photos) ? u.photos : []).map(
                      (p) => ({
                        image:
                          p.image && typeof p.image === 'object'
                            ? {
                                url: p.image.url ?? null,
                                alt: p.image.alt ?? null,
                                width: p.image.width ?? null,
                                height: p.image.height ?? null,
                              }
                            : null,
                      }),
                    ),
                  }
                  return (
                    <li key={u.id} className="relative">
                      <span
                        aria-hidden
                        className="absolute -left-[35px] grid h-3.5 w-3.5 place-items-center rounded-full bg-green-sage ring-4 ring-cream"
                      />
                      <UpdateTimelineItem
                        update={view}
                        stages={availableStages}
                      />
                    </li>
                  )
                })}
              </ol>
            ) : (
              <p className="text-ink-soft">
                Aucune mise à jour pour l&apos;instant — la première vit en
                haut.
              </p>
            )}
          </div>

          <div className="mt-16 border-t border-green-soft/30 pt-6">
            <DeleteSowingForm sowingId={String(sowing.id)} />
          </div>
        </Container>
      </section>
    </>
  )
}
