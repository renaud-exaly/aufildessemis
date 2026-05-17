import { NextResponse } from 'next/server'

import { runDigest } from '@/lib/digest'
import { getPayloadClient } from '@/lib/payload'

// Le digest itère sur tous les users + plusieurs requêtes par user ; 10 minutes
// de marge si la base grossit. Le cron tourne 1×/semaine donc OK côté charge.
export const maxDuration = 600

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
    const digest = await runDigest(payload)
    return NextResponse.json({ ok: true, digest })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export const GET = handler
export const POST = handler
