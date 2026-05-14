import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CommentThread, type CommentView } from '@/components/social/CommentThread'
import { FollowButton } from '@/components/social/FollowButton'
import { ReactionButton } from '@/components/social/ReactionButton'
import { Container } from '@/components/Container'
import { ReportLink } from '@/components/ReportLink'
import { RichText } from '@/components/RichText'
import { getSession } from '@/lib/auth'
import { SOWING_STAGES } from '@/lib/stages'
import { getPayloadClient } from '@/lib/payload'


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

type SocialBundle = {
  reactionCount: number
  myReaction: boolean
  comments: CommentView[]
}

async function loadSocialPerUpdate(
  updateIds: Array<number | string>,
  userId: number | string | null,
): Promise<Map<string, SocialBundle>> {
  const map = new Map<string, SocialBundle>()
  if (!updateIds.length) return map
  const payload = await getPayloadClient()

  // Réactions : on charge tout en un find (limit large).
  const { docs: reactions } = await payload.find({
    collection: 'reactions',
    where: { sowingUpdate: { in: updateIds } },
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })
  const reactionByUpdate = new Map<string, { count: number; my: boolean }>()
  for (const r of reactions as Array<{
    sowingUpdate: number | string | { id: number | string }
    user: number | string | { id: number | string }
  }>) {
    const upd =
      typeof r.sowingUpdate === 'object' ? r.sowingUpdate.id : r.sowingUpdate
    const u = typeof r.user === 'object' ? r.user.id : r.user
    const key = String(upd)
    const prev = reactionByUpdate.get(key) ?? { count: 0, my: false }
    prev.count++
    if (userId !== null && String(u) === String(userId)) prev.my = true
    reactionByUpdate.set(key, prev)
  }

  // Commentaires : per-update (small N, OK pour MVP). En parallèle.
  const commentResults = await Promise.all(
    updateIds.map(async (id) => {
      const { docs } = await payload.find({
        collection: 'comments',
        where: {
          and: [
            { 'target.value': { equals: id } },
            { 'target.relationTo': { equals: 'sowing-updates' } },
            { status: { equals: 'visible' } },
          ],
        },
        sort: 'createdAt',
        limit: 100,
        depth: 1,
        overrideAccess: true,
      })
      return { id, docs }
    }),
  )

  for (const updId of updateIds) {
    const key = String(updId)
    const rx = reactionByUpdate.get(key) ?? { count: 0, my: false }
    const found = commentResults.find((r) => String(r.id) === key)
    const comments: CommentView[] = found
      ? (found.docs as Array<{
          id: number | string
          body: string
          createdAt: string
          author?:
            | { id: number | string; displayName?: string; email?: string }
            | number
            | string
        }>).map((c) => ({
          id: Number(c.id),
          body: c.body,
          createdAt: c.createdAt,
          authorId:
            typeof c.author === 'object' && c.author
              ? c.author.id
              : (c.author as number | string) ?? 0,
          authorName:
            typeof c.author === 'object' && c.author
              ? c.author.displayName ?? c.author.email ?? 'Anon'
              : 'Anon',
        }))
      : []
    map.set(key, {
      reactionCount: rx.count,
      myReaction: rx.my,
      comments,
    })
  }
  return map
}

async function getIsFollowing(
  userId: number | string | null,
  sowingId: number | string,
): Promise<boolean> {
  if (userId === null) return false
  const payload = await getPayloadClient()
  const { totalDocs } = await payload.count({
    collection: 'sowing-follows',
    where: {
      and: [
        { user: { equals: Number(userId) } },
        { sowing: { equals: sowingId } },
      ],
    },
    overrideAccess: true,
  })
  return totalDocs > 0
}

export default async function SowingDetailPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { sowing: sowingId } = await params
  const [sowing, session] = await Promise.all([getSowing(sowingId), getSession()])
  if (!sowing) notFound()
  if (sowing.visibility !== 'public') notFound()

  const updates = await getUpdates(sowing.id)
  const ownerId =
    typeof sowing.owner === 'object' && sowing.owner ? sowing.owner.id : null
  const userId = session?.id ?? null
  const isOwner = userId !== null && String(userId) === String(ownerId)
  const [social, isFollowing] = await Promise.all([
    loadSocialPerUpdate(
      updates.map((u) => u.id),
      userId,
    ),
    isOwner ? Promise.resolve(false) : getIsFollowing(userId, sowing.id),
  ])

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
          {!isOwner ? (
            <div className="mt-6">
              <FollowButton
                sowingId={Number(sowing.id)}
                initialFollowing={isFollowing}
                loggedIn={userId !== null}
              />
            </div>
          ) : null}
        </Container>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <Container>
          {updates.length ? (
            <ol className="relative space-y-12 border-l border-green-soft/60 pl-8">
              {updates.map((u) => {
                const bundle = social.get(String(u.id)) ?? {
                  reactionCount: 0,
                  myReaction: false,
                  comments: [],
                }
                return (
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
                              className="overflow-hidden rounded-soft bg-sand-soft"
                            >
                              <Image
                                src={img.url}
                                alt={img.alt ?? ''}
                                width={img.width ?? 800}
                                height={img.height ?? 600}
                                sizes="(min-width: 640px) 50vw, 100vw"
                                className="h-auto w-full"
                              />
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                    <div className="mt-4">
                      <ReactionButton
                        sowingUpdateId={Number(u.id)}
                        initialReacted={bundle.myReaction}
                        initialCount={bundle.reactionCount}
                        loggedIn={userId !== null}
                      />
                    </div>
                    <CommentThread
                      sowingUpdateId={Number(u.id)}
                      initialComments={bundle.comments}
                      currentUserId={userId}
                      currentUserRole={session?.role ?? null}
                    />
                  </li>
                )
              })}
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
