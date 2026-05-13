import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'
import { runReminders } from '@/lib/reminders'

// 5 minutes — laisse de la marge si la file devient grosse plus tard.
export const maxDuration = 300

async function handler(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 503 },
    )
  }

  const auth = request.headers.get('authorization') ?? ''
  const provided = auth.replace(/^Bearer\s+/i, '')
  if (provided !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayloadClient()
    const result = await runReminders(payload)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export const GET = handler
export const POST = handler
