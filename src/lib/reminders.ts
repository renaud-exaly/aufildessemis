import type { Payload } from 'payload'

import { isInWindow, monthLabel } from './months'
import { SOWING_STAGES, type SowingStage } from './stages'

type ReminderResult = {
  scanned: number
  sent: number
  skipped: number
  errors: Array<{ sowingId: string | number; error: string }>
}

export type WishReminderResult = {
  scanned: number
  sent: number
  throttled: number
  skipped: number
  errors: Array<{ wishId: string | number; error: string }>
}

/** Throttle : un même user ne reçoit pas plus d'un rappel "envie" toutes les N heures. */
const WISH_THROTTLE_HOURS = 48

const stageLabel = (value: string): string =>
  SOWING_STAGES.find((s) => s.value === value)?.label ?? value

function buildReminderEmail({
  ownerName,
  sowingName,
  plantName,
  nextStage,
  tip,
  link,
}: {
  ownerName: string
  sowingName: string
  plantName: string
  nextStage: string
  tip?: string
  link: string
}): { subject: string; html: string } {
  const subject = `Rappel — ${plantName} : c'est l'heure du stade « ${stageLabel(nextStage)} »`
  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #1f2a24;">
      <h1 style="font-family: Georgia, serif; font-weight: 500; color: #2d4a3e; font-size: 28px; margin: 0 0 8px;">
        Au fil des semis
      </h1>
      <p style="font-style: italic; color: #4a574f; margin: 0 0 24px;">Petit rappel du carnet</p>
      <p>Bonjour ${ownerName},</p>
      <p>D'après le rythme typique de ton ${plantName.toLowerCase()}, il serait temps de penser au stade :</p>
      <p style="font-family: Georgia, serif; font-size: 24px; color: #2d4a3e; margin: 20px 0;">
        ${stageLabel(nextStage)}
      </p>
      ${tip ? `<p style="background: #faf6ed; padding: 16px 18px; border-radius: 8px; font-size: 15px; color: #1f2a24;">${tip}</p>` : ''}
      <p style="margin: 28px 0;">
        <a href="${link}" style="background:#2d4a3e;color:#ffffff;padding:14px 26px;border-radius:9999px;text-decoration:none;font-weight:600;">
          Mettre à jour « ${sowingName} » →
        </a>
      </p>
      <p style="font-size: 13px; color: #4a574f;">Si tu ne souhaites plus recevoir ces rappels, tu peux les désactiver depuis ton profil.</p>
      <p style="font-size: 13px; color: #4a574f; margin-top: 32px;">— Au fil des semis</p>
    </div>
  `
  return { subject, html }
}

/**
 * Scan all eligible Sowings and send a reminder email when the next stage is due.
 *
 * "Due" means: time since the last staged update >= typicalStages[next].daysFromPrevious.
 * We never send twice for the same stage (tracked via Sowings.lastReminderStage).
 */
export async function runReminders(payload: Payload): Promise<ReminderResult> {
  const result: ReminderResult = { scanned: 0, sent: 0, skipped: 0, errors: [] }

  const { docs: sowings } = await payload.find({
    collection: 'sowings',
    where: { 'reminderSettings.enabled': { equals: true } },
    limit: 1000,
    depth: 2,
  })

  for (const sowing of sowings as unknown as Array<Record<string, unknown>>) {
    result.scanned++
    try {
      const owner = sowing.owner as
        | {
            email?: string
            displayName?: string
            reminderOptIn?: boolean
          }
        | string
        | undefined
      if (!owner || typeof owner !== 'object' || !owner.email) {
        result.skipped++
        continue
      }
      if (owner.reminderOptIn === false) {
        result.skipped++
        continue
      }

      const plant = sowing.plant as
        | {
            name?: string
            typicalStages?: Array<{
              stage: SowingStage
              daysFromPrevious?: number
              tip?: string
            }>
          }
        | string
        | undefined
      if (!plant || typeof plant !== 'object' || !plant.typicalStages?.length) {
        result.skipped++
        continue
      }

      // Most recent SowingUpdate with a stage tag.
      const { docs: updates } = await payload.find({
        collection: 'sowing-updates',
        where: {
          and: [
            { sowing: { equals: sowing.id } },
            { stage: { exists: true } },
          ],
        },
        sort: '-date',
        limit: 1,
        depth: 0,
      })
      const lastStaged = updates[0] as
        | { stage?: string; date?: string }
        | undefined
      if (!lastStaged?.stage || !lastStaged.date) {
        result.skipped++
        continue
      }

      const currentIdx = plant.typicalStages.findIndex(
        (s) => s.stage === lastStaged.stage,
      )
      if (currentIdx === -1 || currentIdx === plant.typicalStages.length - 1) {
        result.skipped++
        continue
      }

      const next = plant.typicalStages[currentIdx + 1]
      if (sowing.lastReminderStage === next.stage) {
        result.skipped++
        continue
      }

      const daysSince =
        (Date.now() - new Date(lastStaged.date).getTime()) / (1000 * 60 * 60 * 24)
      const threshold = next.daysFromPrevious ?? 14
      if (daysSince < threshold) {
        result.skipped++
        continue
      }

      const ownerId = typeof owner === 'object' ? '' : owner
      const baseUrl =
        process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
      const link = `${baseUrl}/journal/${ownerId}/${sowing.id}`

      const { subject, html } = buildReminderEmail({
        ownerName: owner.displayName ?? 'Bonjour',
        sowingName: String(sowing.name ?? 'ton lot'),
        plantName: plant.name ?? 'cette plante',
        nextStage: next.stage,
        tip: next.tip,
        link,
      })

      await payload.sendEmail({ to: owner.email, subject, html })

      await payload.update({
        collection: 'sowings',
        id: sowing.id as string | number,
        data: {
          lastReminderStage: next.stage,
          lastReminderAt: new Date().toISOString(),
        },
      })

      result.sent++
    } catch (error) {
      result.errors.push({
        sowingId: (sowing.id as string | number) ?? 'unknown',
        error: error instanceof Error ? error.message : 'unknown',
      })
    }
  }

  return result
}

// ============================================================
// Rappels d'envie : "c'est le moment de semer la plante X que tu as
// mise dans tes envies"
// ============================================================

function buildWishReminderEmail({
  ownerName,
  plantName,
  latinName,
  windowEndLabel,
  sowingNote,
  firstStages,
  coverUrl,
  link,
  createSowingLink,
  enviesLink,
}: {
  ownerName: string
  plantName: string
  latinName?: string
  windowEndLabel: string
  sowingNote?: string
  firstStages: Array<{ label: string; tip?: string; daysFromPrevious?: number }>
  coverUrl?: string
  link: string
  createSowingLink: string
  enviesLink: string
}): { subject: string; html: string } {
  const subject = `C'est le moment — sème tes ${plantName.toLowerCase()}`
  const stagesHtml = firstStages.length
    ? `
      <p style="margin: 24px 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #4a574f;">
        Les premières étapes
      </p>
      <ol style="padding-left: 20px; margin: 0;">
        ${firstStages
          .map(
            (s) => `
          <li style="margin-bottom: 10px;">
            <strong style="color: #2d4a3e;">${s.label}</strong>${
              s.daysFromPrevious ? ` <span style="color:#4a574f;font-size:13px;">(~${s.daysFromPrevious} j)</span>` : ''
            }
            ${s.tip ? `<div style="margin-top: 4px; color: #1f2a24; font-size: 14px;">${s.tip}</div>` : ''}
          </li>
        `,
          )
          .join('')}
      </ol>
    `
    : ''
  const noteHtml = sowingNote
    ? `<p style="background: #faf6ed; padding: 14px 16px; border-radius: 8px; font-size: 14px; color: #1f2a24; margin: 20px 0;">${sowingNote}</p>`
    : ''
  const coverHtml = coverUrl
    ? `<img src="${coverUrl}" alt="${plantName}" style="display:block;width:100%;max-width:560px;height:auto;border-radius:12px;margin:0 0 24px;" />`
    : ''
  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #1f2a24;">
      <h1 style="font-family: Georgia, serif; font-weight: 500; color: #2d4a3e; font-size: 28px; margin: 0 0 8px;">
        Au fil des semis
      </h1>
      <p style="font-style: italic; color: #4a574f; margin: 0 0 24px;">
        Une de tes envies entre en saison.
      </p>
      ${coverHtml}
      <p>Bonjour ${ownerName},</p>
      <p>C'est le moment de semer tes <strong>${plantName.toLowerCase()}</strong>${latinName ? ` <em style="color:#4a574f;">(${latinName})</em>` : ''}. Tu as encore jusqu'à <strong>${windowEndLabel}</strong> pour les démarrer en bonnes conditions.</p>
      ${noteHtml}
      ${stagesHtml}
      <p style="margin: 28px 0;">
        <a href="${createSowingLink}" style="background:#2d4a3e;color:#ffffff;padding:14px 26px;border-radius:9999px;text-decoration:none;font-weight:600;">
          Démarrer mon lot ${plantName.toLowerCase()} →
        </a>
      </p>
      <p style="font-size: 14px; color: #4a574f;">
        Tu peux aussi <a href="${link}" style="color:#2d4a3e;">revoir la fiche complète</a> ou <a href="${enviesLink}" style="color:#2d4a3e;">gérer tes envies</a>.
      </p>
      <p style="font-size: 13px; color: #4a574f; margin-top: 32px;">— Au fil des semis</p>
    </div>
  `
  return { subject, html }
}

const stageLabelFromStages = (value: string): string =>
  SOWING_STAGES.find((s) => s.value === value)?.label ?? value

/**
 * Scan toutes les envies éligibles et envoie un rappel "c'est le moment de
 * semer" quand le mois courant entre dans la fenêtre de semis de la plante.
 *
 * Règles :
 *  - une seule notif par envie par saison (tracking via lastNotifiedYear)
 *  - un seul mail toutes les WISH_THROTTLE_HOURS par user (Users.lastWishReminderAt)
 *  - skip si l'envie est dismissed
 *  - skip si l'user a déjà un Sowing actif pour cette plante cette année
 *  - on ne traite qu'UNE envie par user par run, la plus urgente (fenêtre qui
 *    se ferme le plus tôt) ; les autres attendent le run suivant — d'où le
 *    throttle qui lisse les pics si l'user a mis 10 plantes en avril
 */
export async function runWishReminders(payload: Payload): Promise<WishReminderResult> {
  const result: WishReminderResult = {
    scanned: 0,
    sent: 0,
    throttled: 0,
    skipped: 0,
    errors: [],
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const baseUrl =
    process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

  const { docs: wishes } = await payload.find({
    collection: 'plant-wishes',
    where: {
      and: [
        { dismissed: { not_equals: true } },
        {
          or: [
            { lastNotifiedYear: { exists: false } },
            { lastNotifiedYear: { less_than: year } },
          ],
        },
      ],
    },
    limit: 5000,
    depth: 2,
  })

  // Groupe les envies par user pour appliquer la règle "1 mail/user/run".
  type Hydrated = {
    wish: Record<string, unknown>
    user: { id: string | number; email?: string; displayName?: string; reminderOptIn?: boolean; lastWishReminderAt?: string | Date | null }
    plant: Record<string, unknown>
    endMonth: string
  }
  const byUser = new Map<string, Hydrated[]>()

  for (const w of wishes as unknown as Array<Record<string, unknown>>) {
    result.scanned++
    const user = w.user as Hydrated['user'] | string | undefined
    const plant = w.plant as Record<string, unknown> | string | undefined
    if (!user || typeof user !== 'object' || !user.email) {
      result.skipped++
      continue
    }
    if (user.reminderOptIn === false) {
      result.skipped++
      continue
    }
    if (!plant || typeof plant !== 'object') {
      result.skipped++
      continue
    }
    const sw = plant.sowingWindow as
      | { startMonth?: string; endMonth?: string; note?: string }
      | undefined
    if (!sw?.startMonth || !sw?.endMonth) {
      result.skipped++
      continue
    }
    if (!isInWindow(month, sw.startMonth, sw.endMonth)) {
      result.skipped++
      continue
    }

    const key = String(user.id)
    const bucket = byUser.get(key) ?? []
    bucket.push({ wish: w, user, plant, endMonth: sw.endMonth })
    byUser.set(key, bucket)
  }

  for (const [, bucket] of byUser) {
    try {
      // Throttle : si l'user a reçu un mail < 48h, on attend le prochain run.
      const user = bucket[0].user
      if (user.lastWishReminderAt) {
        const last = new Date(user.lastWishReminderAt).getTime()
        const hoursSince = (Date.now() - last) / (1000 * 60 * 60)
        if (hoursSince < WISH_THROTTLE_HOURS) {
          result.throttled += bucket.length
          continue
        }
      }

      // Skip si Sowing actif cette année pour cette plante : on prend la
      // première envie éligible après filtrage.
      const eligible: Hydrated[] = []
      for (const h of bucket) {
        const { docs: existingSowings } = await payload.find({
          collection: 'sowings',
          where: {
            and: [
              { owner: { equals: user.id } },
              { plant: { equals: (h.plant.id as number | string) } },
              {
                startedAt: {
                  greater_than_equal: new Date(year, 0, 1).toISOString(),
                },
              },
            ],
          },
          limit: 1,
          depth: 0,
        })
        if (existingSowings.length) {
          // Déjà semé cette année — on marque l'envie comme notifiée pour ne
          // pas la repousser indéfiniment, sans envoyer d'email.
          await payload.update({
            collection: 'plant-wishes',
            id: h.wish.id as string | number,
            data: { lastNotifiedYear: year },
            overrideAccess: true,
          })
          result.skipped++
          continue
        }
        eligible.push(h)
      }
      if (!eligible.length) continue

      // Tri par "endMonth" croissant : la fenêtre qui se ferme le plus tôt
      // gagne le créneau.
      eligible.sort((a, b) => parseInt(a.endMonth, 10) - parseInt(b.endMonth, 10))
      const pick = eligible[0]

      const plant = pick.plant
      const stages = (plant.typicalStages as
        | Array<{ stage: SowingStage; daysFromPrevious?: number; tip?: string }>
        | undefined) ?? []
      const firstStages = stages.slice(0, 3).map((s) => ({
        label: stageLabelFromStages(s.stage),
        tip: s.tip,
        daysFromPrevious: s.daysFromPrevious,
      }))

      const cover = plant.coverImage as { url?: string | null } | string | undefined
      const coverUrl =
        cover && typeof cover === 'object' && cover.url
          ? cover.url.startsWith('http')
            ? cover.url
            : `${baseUrl}${cover.url}`
          : undefined

      const slug = plant.slug as string
      const { subject, html } = buildWishReminderEmail({
        ownerName: user.displayName ?? 'Bonjour',
        plantName: (plant.name as string) ?? 'cette plante',
        latinName: (plant.latinName as string | undefined) ?? undefined,
        windowEndLabel: monthLabel(pick.endMonth),
        sowingNote: (plant.sowingWindow as { note?: string } | undefined)?.note,
        firstStages,
        coverUrl,
        link: `${baseUrl}/bibliotheque/${slug}`,
        createSowingLink: `${baseUrl}/mon-potager/nouveau-semis?plant=${plant.id}`,
        enviesLink: `${baseUrl}/mon-potager/envies`,
      })

      await payload.sendEmail({ to: user.email!, subject, html })

      await payload.update({
        collection: 'plant-wishes',
        id: pick.wish.id as string | number,
        data: { lastNotifiedYear: year },
        overrideAccess: true,
      })
      await payload.update({
        collection: 'users',
        id: user.id,
        data: { lastWishReminderAt: new Date().toISOString() },
        overrideAccess: true,
      })

      // Les autres envies éligibles du même user attendront un run suivant.
      result.throttled += eligible.length - 1
      result.sent++
    } catch (error) {
      const wishId = (bucket[0].wish.id as string | number) ?? 'unknown'
      result.errors.push({
        wishId,
        error: error instanceof Error ? error.message : 'unknown',
      })
    }
  }

  return result
}
