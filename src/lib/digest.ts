import type { Payload } from 'payload'

import { isInWindow, monthLabel } from './months'

export type DigestResult = {
  scanned: number
  sent: number
  skipped: number
  errors: Array<{ userId: string | number; error: string }>
}

/**
 * Throttle : on n'envoie pas deux digests à moins de 6 jours d'intervalle.
 * Laisse de la marge si le cron est déclenché 2× par erreur, et aussi si on
 * change le jour d'envoi en cours de route.
 */
const DIGEST_THROTTLE_DAYS = 6

/**
 * Période d'inactivité au-delà de laquelle un lot est considéré "qui dort".
 * Affichée dans le digest pour gentiment relancer.
 */
const DORMANT_DAYS = 14

type MaybeRef<T> = T | number | string | null | undefined

function refId(ref: MaybeRef<{ id: number | string }>): number | string | null {
  if (ref == null) return null
  if (typeof ref === 'object') return ref.id ?? null
  return ref
}

type OwnedSowing = {
  id: number | string
  name: string
  plantName: string
  lastUpdateDate: string | null
}

type FollowedUpdate = {
  sowingId: number | string
  sowingName: string
  authorName: string
  date: string
  link: string
}

type OpeningWish = {
  plantName: string
  slug: string
  windowEndLabel: string
  coverUrl?: string
}

type DigestPayload = {
  userId: number | string
  userName: string
  userEmail: string
  since: Date
  newComments: number
  newReactions: number
  newFollowers: number
  followedUpdates: FollowedUpdate[]
  dormantSowings: Array<{ name: string; plantName: string; daysSince: number; link: string }>
  openingWishes: OpeningWish[]
}

function buildDigestEmail(d: DigestPayload, baseUrl: string): {
  subject: string
  html: string
} {
  const total = d.newComments + d.newReactions + d.newFollowers
  const subject = total
    ? `Cette semaine au potager — ${total} activité${total > 1 ? 's' : ''}`
    : 'Cette semaine au potager'

  const statsRow = total
    ? `
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:24px 0;border-collapse:collapse;">
        <tr>
          ${
            d.newComments > 0
              ? `<td style="padding:14px;background:#faf6ed;border-radius:10px;text-align:center;width:33%;">
                  <div style="font-family:Georgia,serif;font-size:32px;color:#2d4a3e;font-weight:600;">${d.newComments}</div>
                  <div style="font-size:13px;color:#4a574f;margin-top:4px;">commentaire${d.newComments > 1 ? 's' : ''}</div>
                </td><td style="width:8px;"></td>`
              : ''
          }
          ${
            d.newReactions > 0
              ? `<td style="padding:14px;background:#faf6ed;border-radius:10px;text-align:center;width:33%;">
                  <div style="font-family:Georgia,serif;font-size:32px;color:#c84b31;font-weight:600;">${d.newReactions}</div>
                  <div style="font-size:13px;color:#4a574f;margin-top:4px;">réaction${d.newReactions > 1 ? 's' : ''}</div>
                </td><td style="width:8px;"></td>`
              : ''
          }
          ${
            d.newFollowers > 0
              ? `<td style="padding:14px;background:#faf6ed;border-radius:10px;text-align:center;width:33%;">
                  <div style="font-family:Georgia,serif;font-size:32px;color:#7a8b6f;font-weight:600;">${d.newFollowers}</div>
                  <div style="font-size:13px;color:#4a574f;margin-top:4px;">nouvel·le abonné·e${d.newFollowers > 1 ? 's' : ''}</div>
                </td>`
              : ''
          }
        </tr>
      </table>
    `
    : ''

  const followedHtml = d.followedUpdates.length
    ? `
      <p style="margin: 24px 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #4a574f;">
        Les lots que tu suis
      </p>
      <ul style="padding-left: 0; list-style: none; margin: 0;">
        ${d.followedUpdates
          .map(
            (u) => `
          <li style="margin: 0 0 10px; padding: 12px 14px; background: #faf6ed; border-radius: 8px;">
            <strong style="color: #2d4a3e;">${u.authorName}</strong>
            <span style="color: #4a574f;"> a posté sur </span>
            <a href="${u.link}" style="color:#2d4a3e;text-decoration:underline;"><strong>${u.sowingName}</strong></a>
          </li>
        `,
          )
          .join('')}
      </ul>
    `
    : ''

  const dormantHtml = d.dormantSowings.length
    ? `
      <p style="margin: 28px 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #4a574f;">
        Tes lots qui dorment
      </p>
      <p style="font-size: 14px; color: #4a574f; margin: 0 0 12px;">
        Pas de nouvelle depuis plus de ${DORMANT_DAYS} jours — un mot, une photo&nbsp;?
      </p>
      <ul style="padding-left: 0; list-style: none; margin: 0;">
        ${d.dormantSowings
          .map(
            (s) => `
          <li style="margin: 0 0 8px;">
            <a href="${s.link}" style="color:#2d4a3e;text-decoration:none;">
              <strong>${s.name}</strong>
              <span style="color:#4a574f;"> · ${s.plantName} · ${s.daysSince} j</span>
            </a>
          </li>
        `,
          )
          .join('')}
      </ul>
    `
    : ''

  const wishesHtml = d.openingWishes.length
    ? `
      <p style="margin: 28px 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #4a574f;">
        De tes envies, en saison
      </p>
      <ul style="padding-left: 0; list-style: none; margin: 0;">
        ${d.openingWishes
          .map(
            (w) => `
          <li style="margin: 0 0 8px;">
            <a href="${baseUrl}/bibliotheque/${w.slug}" style="color:#2d4a3e;text-decoration:none;">
              <strong>${w.plantName}</strong>
              <span style="color:#4a574f;"> — fenêtre jusqu'à ${w.windowEndLabel.toLowerCase()}</span>
            </a>
          </li>
        `,
          )
          .join('')}
      </ul>
    `
    : ''

  const emptyHtml =
    !total && !d.followedUpdates.length && !d.dormantSowings.length && !d.openingWishes.length
      ? `<p style="margin: 24px 0; color: #4a574f; font-style: italic;">
          Semaine calme côté carnet. C'est aussi ça, le potager.
        </p>`
      : ''

  const html = `
    <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; padding: 32px; color: #1f2a24;">
      <h1 style="font-family: Georgia, serif; font-weight: 500; color: #2d4a3e; font-size: 28px; margin: 0 0 8px;">
        Au fil des semis
      </h1>
      <p style="font-style: italic; color: #4a574f; margin: 0 0 24px;">
        Cette semaine au potager
      </p>
      <p>Bonjour ${d.userName},</p>
      ${statsRow}
      ${emptyHtml}
      ${followedHtml}
      ${dormantHtml}
      ${wishesHtml}
      <p style="margin: 32px 0;">
        <a href="${baseUrl}/mon-potager" style="background:#2d4a3e;color:#ffffff;padding:14px 26px;border-radius:9999px;text-decoration:none;font-weight:600;">
          Ouvrir mon potager →
        </a>
      </p>
      <p style="font-size: 13px; color: #4a574f; margin-top: 32px;">
        Tu reçois ce résumé une fois par semaine. Tu peux le désactiver depuis ton profil.
      </p>
      <p style="font-size: 13px; color: #4a574f;">— Au fil des semis</p>
    </div>
  `
  return { subject, html }
}

async function getUserOwnedSowings(
  payload: Payload,
  userId: number | string,
): Promise<OwnedSowing[]> {
  const { docs } = await payload.find({
    collection: 'sowings',
    where: { owner: { equals: userId } },
    limit: 200,
    depth: 1,
    overrideAccess: true,
  })
  const out: OwnedSowing[] = []
  for (const s of docs as unknown as Array<{
    id: number | string
    name?: string
    plant?: { name?: string } | number | string
  }>) {
    const plantName =
      s.plant && typeof s.plant === 'object' ? s.plant.name ?? 'plante' : 'plante'
    // Date de la dernière update
    const { docs: ups } = await payload.find({
      collection: 'sowing-updates',
      where: { sowing: { equals: s.id } },
      sort: '-date',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const lastUpdateDate =
      (ups[0] as { date?: string } | undefined)?.date ?? null
    out.push({
      id: s.id,
      name: s.name ?? 'lot sans nom',
      plantName,
      lastUpdateDate,
    })
  }
  return out
}

async function countNewComments(
  payload: Payload,
  ownedSowingIds: Array<number | string>,
  since: Date,
  userId: number | string,
): Promise<number> {
  if (!ownedSowingIds.length) return 0
  const { totalDocs } = await payload.find({
    collection: 'comments',
    where: {
      and: [
        { 'target.value': { in: ownedSowingIds } },
        { createdAt: { greater_than: since.toISOString() } },
        { author: { not_equals: userId } },
        { status: { equals: 'visible' } },
      ],
    },
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })
  return totalDocs
}

async function countNewReactions(
  payload: Payload,
  ownedSowingIds: Array<number | string>,
  since: Date,
  userId: number | string,
): Promise<number> {
  if (!ownedSowingIds.length) return 0
  // Réactions visent les sowing-updates — il faut donc d'abord récupérer les IDs
  // des updates appartenant aux lots du user.
  const { docs: updates } = await payload.find({
    collection: 'sowing-updates',
    where: { sowing: { in: ownedSowingIds } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  const updateIds = (updates as Array<{ id: number | string }>).map((u) => u.id)
  if (!updateIds.length) return 0
  const { totalDocs } = await payload.find({
    collection: 'reactions',
    where: {
      and: [
        { sowingUpdate: { in: updateIds } },
        { createdAt: { greater_than: since.toISOString() } },
        { user: { not_equals: userId } },
      ],
    },
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })
  return totalDocs
}

async function countNewFollowers(
  payload: Payload,
  ownedSowingIds: Array<number | string>,
  since: Date,
): Promise<number> {
  if (!ownedSowingIds.length) return 0
  const { totalDocs } = await payload.find({
    collection: 'sowing-follows',
    where: {
      and: [
        { sowing: { in: ownedSowingIds } },
        { createdAt: { greater_than: since.toISOString() } },
      ],
    },
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })
  return totalDocs
}

async function getFollowedUpdates(
  payload: Payload,
  userId: number | string,
  since: Date,
  baseUrl: string,
): Promise<FollowedUpdate[]> {
  const { docs: follows } = await payload.find({
    collection: 'sowing-follows',
    where: { user: { equals: userId } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  const sowingIds = (follows as Array<{ sowing?: number | string }>)
    .map((f) => f.sowing)
    .filter((v): v is number | string => v != null)
  if (!sowingIds.length) return []

  const { docs: updates } = await payload.find({
    collection: 'sowing-updates',
    where: {
      and: [
        { sowing: { in: sowingIds } },
        { date: { greater_than: since.toISOString() } },
      ],
    },
    sort: '-date',
    limit: 5,
    depth: 2,
    overrideAccess: true,
  })

  const out: FollowedUpdate[] = []
  for (const u of updates as unknown as Array<{
    id: number | string
    date?: string
    sowing?:
      | { id: number | string; name?: string; owner?: { id: number | string; displayName?: string } | number | string }
      | number
      | string
  }>) {
    if (!u.sowing || typeof u.sowing !== 'object') continue
    const owner = u.sowing.owner
    const ownerId = refId(owner as MaybeRef<{ id: number | string }>)
    const authorName =
      owner && typeof owner === 'object'
        ? owner.displayName ?? 'Quelqu’un'
        : 'Quelqu’un'
    out.push({
      sowingId: u.sowing.id,
      sowingName: u.sowing.name ?? 'ce lot',
      authorName,
      date: u.date ?? '',
      link: `${baseUrl}/journal/${ownerId ?? 'inconnu'}/${u.sowing.id}`,
    })
  }
  return out
}

function getDormantSowings(
  owned: OwnedSowing[],
  ownerId: number | string,
  baseUrl: string,
): DigestPayload['dormantSowings'] {
  const now = Date.now()
  const threshold = DORMANT_DAYS * 24 * 60 * 60 * 1000
  return owned
    .filter((s) => {
      if (!s.lastUpdateDate) return false
      return now - new Date(s.lastUpdateDate).getTime() > threshold
    })
    .map((s) => ({
      name: s.name,
      plantName: s.plantName,
      daysSince: Math.floor(
        (now - new Date(s.lastUpdateDate!).getTime()) / (1000 * 60 * 60 * 24),
      ),
      link: `${baseUrl}/journal/${ownerId}/${s.id}`,
    }))
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 5)
}

async function getOpeningWishes(
  payload: Payload,
  userId: number | string,
): Promise<OpeningWish[]> {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()

  const { docs } = await payload.find({
    collection: 'plant-wishes',
    where: {
      and: [
        { user: { equals: userId } },
        { dismissed: { not_equals: true } },
      ],
    },
    limit: 200,
    depth: 2,
    overrideAccess: true,
  })

  const out: OpeningWish[] = []
  for (const w of docs as unknown as Array<{
    plant?: Record<string, unknown> | number | string
  }>) {
    const plant = w.plant
    if (!plant || typeof plant !== 'object') continue
    const sw = plant.sowingWindow as
      | { startMonth?: string; endMonth?: string }
      | undefined
    if (!sw?.startMonth || !sw?.endMonth) continue
    if (!isInWindow(month, sw.startMonth, sw.endMonth)) continue

    // Skip si lot déjà semé cette année.
    const { totalDocs: activeCount } = await payload.find({
      collection: 'sowings',
      where: {
        and: [
          { owner: { equals: userId } },
          { plant: { equals: plant.id as number | string } },
          {
            startedAt: {
              greater_than_equal: new Date(year, 0, 1).toISOString(),
            },
          },
        ],
      },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    })
    if (activeCount > 0) continue

    out.push({
      plantName: (plant.name as string) ?? 'plante',
      slug: (plant.slug as string) ?? '',
      windowEndLabel: monthLabel(sw.endMonth),
    })
    if (out.length >= 5) break
  }
  return out
}

/**
 * Génère et envoie le digest hebdomadaire pour chaque user éligible.
 *
 * Règles :
 *  - skip si `reminderOptIn === false`, `bannedAt`, `deletedAt`
 *  - skip si déjà envoyé il y a moins de DIGEST_THROTTLE_DAYS jours
 *  - skip silencieusement s'il n'y a rien à dire (0 activité, 0 dormant,
 *    0 envie qui s'ouvre, 0 update de lots suivis)
 */
export async function runDigest(payload: Payload): Promise<DigestResult> {
  const result: DigestResult = { scanned: 0, sent: 0, skipped: 0, errors: [] }
  const baseUrl =
    process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

  // Tous les users actifs et opt-in.
  const { docs: users } = await payload.find({
    collection: 'users',
    where: {
      and: [
        { reminderOptIn: { not_equals: false } },
        {
          or: [
            { bannedAt: { exists: false } },
            { bannedAt: { equals: null } },
          ],
        },
        {
          or: [
            { deletedAt: { exists: false } },
            { deletedAt: { equals: null } },
          ],
        },
      ],
    },
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })

  const now = new Date()
  const throttleMs = DIGEST_THROTTLE_DAYS * 24 * 60 * 60 * 1000
  // Borne d'activité : on prend la dernière date de digest, sinon 7 jours en arrière.
  const fallbackSince = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  for (const u of users as unknown as Array<{
    id: number | string
    email?: string
    displayName?: string
    lastDigestSentAt?: string | Date | null
  }>) {
    result.scanned++
    try {
      if (!u.email) {
        result.skipped++
        continue
      }
      if (u.lastDigestSentAt) {
        const last = new Date(u.lastDigestSentAt).getTime()
        if (now.getTime() - last < throttleMs) {
          result.skipped++
          continue
        }
      }

      const since = u.lastDigestSentAt
        ? new Date(u.lastDigestSentAt)
        : fallbackSince

      const owned = await getUserOwnedSowings(payload, u.id)
      const ownedIds = owned.map((s) => s.id)

      const [newComments, newReactions, newFollowers, followedUpdates, openingWishes] =
        await Promise.all([
          countNewComments(payload, ownedIds, since, u.id),
          countNewReactions(payload, ownedIds, since, u.id),
          countNewFollowers(payload, ownedIds, since),
          getFollowedUpdates(payload, u.id, since, baseUrl),
          getOpeningWishes(payload, u.id),
        ])

      const dormantSowings = getDormantSowings(owned, u.id, baseUrl)

      const totalActivity = newComments + newReactions + newFollowers
      const hasContent =
        totalActivity > 0 ||
        followedUpdates.length > 0 ||
        dormantSowings.length > 0 ||
        openingWishes.length > 0

      if (!hasContent) {
        result.skipped++
        continue
      }

      const { subject, html } = buildDigestEmail(
        {
          userId: u.id,
          userName: u.displayName ?? 'Bonjour',
          userEmail: u.email,
          since,
          newComments,
          newReactions,
          newFollowers,
          followedUpdates,
          dormantSowings,
          openingWishes,
        },
        baseUrl,
      )

      await payload.sendEmail({ to: u.email, subject, html })
      await payload.update({
        collection: 'users',
        id: u.id,
        data: { lastDigestSentAt: now.toISOString() },
        overrideAccess: true,
      })
      result.sent++
    } catch (error) {
      result.errors.push({
        userId: u.id,
        error: error instanceof Error ? error.message : 'unknown',
      })
    }
  }

  return result
}
