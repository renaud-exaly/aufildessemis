import type { Payload } from 'payload'

import { SOWING_STAGES, type SowingStage } from './stages'

type ReminderResult = {
  scanned: number
  sent: number
  skipped: number
  errors: Array<{ sowingId: string | number; error: string }>
}

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

  for (const sowing of sowings as Array<Record<string, unknown>>) {
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
