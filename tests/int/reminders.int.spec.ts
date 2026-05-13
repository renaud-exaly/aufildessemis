import { describe, expect, it, vi } from 'vitest'

import { runReminders } from '@/lib/reminders'

type FakeDoc = Record<string, unknown> & { id: string | number }

function makePayload({
  sowings,
  updates,
}: {
  sowings: FakeDoc[]
  updates: FakeDoc[]
}) {
  const sentEmails: Array<{ to: string; subject: string }> = []
  const updated: Array<{ id: string | number; data: unknown }> = []
  const payload = {
    find: vi.fn(async ({ collection, where }) => {
      if (collection === 'sowings') {
        return { docs: sowings, totalDocs: sowings.length }
      }
      if (collection === 'sowing-updates') {
        // The reminders code passes a where on `sowing.equals` AND `stage.exists`.
        // We mimic a basic filter on the sowing id.
        const sowingId = (where as { and?: Array<{ sowing?: { equals: unknown } }> })
          ?.and?.[0]?.sowing?.equals
        const docs = sowingId
          ? updates.filter((u) => u.sowing === sowingId && u.stage)
          : updates.filter((u) => u.stage)
        // Sort desc by date string
        docs.sort((a, b) =>
          String(b.date ?? '').localeCompare(String(a.date ?? '')),
        )
        return { docs, totalDocs: docs.length }
      }
      return { docs: [], totalDocs: 0 }
    }),
    update: vi.fn(async ({ id, data }) => {
      updated.push({ id, data })
      return { id, ...data }
    }),
    sendEmail: vi.fn(async ({ to, subject }) => {
      sentEmails.push({ to, subject })
      return { id: 'fake' }
    }),
  }
  return { payload, sentEmails, updated }
}

describe('runReminders', () => {
  it("sends a reminder when the next stage is due and hasn't been sent yet", async () => {
    const ancient = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { payload, sentEmails, updated } = makePayload({
      sowings: [
        {
          id: 's1',
          name: 'Courgettes 2026',
          reminderSettings: { enabled: true },
          lastReminderStage: null,
          owner: {
            email: 'renaud@example.com',
            displayName: 'Renaud',
            reminderOptIn: true,
          },
          plant: {
            name: 'Courgette',
            typicalStages: [
              { stage: 'semis', daysFromPrevious: 0, tip: 'sème' },
              { stage: 'levee', daysFromPrevious: 7, tip: 'lève' },
              { stage: 'repiquage', daysFromPrevious: 14, tip: 'repique' },
            ],
          },
        },
      ],
      updates: [
        { id: 'u1', sowing: 's1', stage: 'levee', date: ancient },
      ],
    })

    const result = await runReminders(payload as never)

    expect(result.scanned).toBe(1)
    expect(result.sent).toBe(1)
    expect(sentEmails).toHaveLength(1)
    expect(sentEmails[0].subject).toContain('Repiquage')
    expect(updated).toHaveLength(1)
    expect(updated[0].data).toMatchObject({ lastReminderStage: 'repiquage' })
  })

  it('skips when the threshold is not reached yet', async () => {
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const { payload, sentEmails } = makePayload({
      sowings: [
        {
          id: 's2',
          name: 'Tomate',
          reminderSettings: { enabled: true },
          owner: { email: 'a@b.c', displayName: 'A', reminderOptIn: true },
          plant: {
            name: 'Tomate',
            typicalStages: [
              { stage: 'semis', daysFromPrevious: 0 },
              { stage: 'levee', daysFromPrevious: 10 },
            ],
          },
        },
      ],
      updates: [{ id: 'u', sowing: 's2', stage: 'semis', date: recent }],
    })

    const result = await runReminders(payload as never)
    expect(result.sent).toBe(0)
    expect(result.skipped).toBe(1)
    expect(sentEmails).toHaveLength(0)
  })

  it('does not send twice for the same stage', async () => {
    const ancient = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const { payload, sentEmails } = makePayload({
      sowings: [
        {
          id: 's3',
          name: 'Radis',
          reminderSettings: { enabled: true },
          lastReminderStage: 'recolte', // déjà notifié
          owner: { email: 'r@a.b', displayName: 'R', reminderOptIn: true },
          plant: {
            name: 'Radis',
            typicalStages: [
              { stage: 'semis', daysFromPrevious: 0 },
              { stage: 'recolte', daysFromPrevious: 21 },
            ],
          },
        },
      ],
      updates: [{ id: 'u', sowing: 's3', stage: 'semis', date: ancient }],
    })

    const result = await runReminders(payload as never)
    expect(result.sent).toBe(0)
    expect(sentEmails).toHaveLength(0)
  })

  it('respects the owner reminderOptIn=false toggle', async () => {
    const ancient = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { payload, sentEmails } = makePayload({
      sowings: [
        {
          id: 's4',
          name: 'Basilic',
          reminderSettings: { enabled: true },
          owner: { email: 'b@b.b', displayName: 'B', reminderOptIn: false },
          plant: {
            name: 'Basilic',
            typicalStages: [
              { stage: 'semis', daysFromPrevious: 0 },
              { stage: 'levee', daysFromPrevious: 7 },
            ],
          },
        },
      ],
      updates: [{ id: 'u', sowing: 's4', stage: 'semis', date: ancient }],
    })

    const result = await runReminders(payload as never)
    expect(result.skipped).toBe(1)
    expect(sentEmails).toHaveLength(0)
  })
})
