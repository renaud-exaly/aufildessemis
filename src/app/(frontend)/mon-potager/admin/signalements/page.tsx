import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { ReportRow, type ReportRowProps } from './ReportRow'
import { Container } from '@/components/Container'
import { getSession } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export const metadata = {
  title: 'Signalements — Modération',
  robots: 'noindex',
}

async function loadReports(): Promise<ReportRowProps['report'][]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'reports',
    where: { status: { equals: 'open' } },
    sort: '-createdAt',
    limit: 200,
    depth: 2,
    overrideAccess: true,
  })

  const out: ReportRowProps['report'][] = []
  for (const r of docs as Array<{
    id: number
    reason: string
    note?: string | null
    status: string
    createdAt: string
    reporter?: { displayName?: string; email?: string } | number | string
    target?: {
      relationTo: string
      value:
        | { id: number; body?: string; author?: { displayName?: string; email?: string } | number | string }
        | number
    }
  }>) {
    const reporterName =
      typeof r.reporter === 'object' && r.reporter
        ? r.reporter.displayName ?? r.reporter.email ?? '—'
        : '—'
    const targetType = r.target?.relationTo ?? '?'
    const rawValue = r.target?.value
    let targetId: number | string = 0
    let targetBody: string | null = null
    let targetAuthorName: string | null = null
    if (typeof rawValue === 'object' && rawValue) {
      targetId = rawValue.id
      targetBody = rawValue.body ?? null
      const a = rawValue.author
      if (a && typeof a === 'object') {
        targetAuthorName = a.displayName ?? a.email ?? null
      }
    } else if (typeof rawValue === 'number' || typeof rawValue === 'string') {
      targetId = rawValue
    }
    out.push({
      id: r.id,
      reason: r.reason,
      note: r.note ?? null,
      status: r.status,
      createdAt: r.createdAt,
      reporterName,
      targetType,
      targetId,
      targetBody,
      targetAuthorName,
    })
  }
  return out
}

export default async function SignalementsPage() {
  const session = await getSession()
  if (!session) redirect('/mon-potager/connexion?next=/mon-potager/admin/signalements')
  if (session.role !== 'admin' && session.role !== 'moderator') notFound()

  const reports = await loadReports()

  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <Link
          href="/mon-potager"
          className="text-sm uppercase tracking-[0.14em] text-ink-soft hover:text-tomato"
        >
          ← Mon potager
        </Link>
        <h1 className="mt-6 font-serif text-4xl text-green-deep md:text-5xl">
          File de modération
        </h1>
        <p className="mt-3 text-ink-soft">
          {reports.length === 0
            ? 'Rien à modérer pour l’instant.'
            : `${reports.length} signalement${reports.length > 1 ? 's' : ''} ouvert${reports.length > 1 ? 's' : ''}.`}
        </p>

        <div className="mt-10 space-y-4">
          {reports.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
        </div>
      </Container>
    </section>
  )
}
