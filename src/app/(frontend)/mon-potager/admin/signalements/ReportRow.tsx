'use client'

import { useActionState } from 'react'

import {
  hideTargetCommentAction,
  resolveReportAction,
} from './actions'

export type ReportRowProps = {
  report: {
    id: number
    reason: string
    note: string | null
    status: string
    createdAt: string
    reporterName: string
    targetType: string
    targetId: number | string
    targetBody?: string | null
    targetAuthorName?: string | null
  }
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Inapproprié',
  harassment: 'Harcèlement',
  misinformation: 'Désinformation',
  other: 'Autre',
}

export function ReportRow({ report }: ReportRowProps) {
  const [resolveState, resolveAction, resolvePending] = useActionState(
    resolveReportAction,
    null,
  )
  const [hideState, hideAction, hidePending] = useActionState(
    hideTargetCommentAction,
    null,
  )
  const isComment = report.targetType === 'comments'

  return (
    <article className="rounded-pillow border border-green-soft/40 bg-cream-warm p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="rounded-full bg-tomato/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-tomato">
            {REASON_LABELS[report.reason] ?? report.reason}
          </span>
          <span className="ml-2 text-xs text-ink-soft">
            sur {report.targetType} #{report.targetId}
          </span>
        </div>
        <time className="text-xs text-ink-soft">
          {new Date(report.createdAt).toLocaleDateString('fr-BE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </time>
      </header>

      <p className="mt-2 text-xs italic text-ink-soft">
        Signalé par {report.reporterName}
      </p>
      {report.note ? (
        <p className="mt-2 rounded-soft bg-cream px-3 py-2 text-sm text-ink">
          {report.note}
        </p>
      ) : null}

      {isComment && report.targetBody ? (
        <div className="mt-3 rounded-soft border border-green-soft/40 bg-cream px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-ink-soft">
            Contenu signalé
            {report.targetAuthorName ? ` — par ${report.targetAuthorName}` : ''}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
            {report.targetBody}
          </p>
        </div>
      ) : null}

      <footer className="mt-4 flex flex-wrap items-center gap-2">
        {isComment ? (
          <form action={hideAction}>
            <input type="hidden" name="reportId" value={report.id} />
            <input type="hidden" name="commentId" value={report.targetId} />
            <button
              type="submit"
              disabled={hidePending}
              className="rounded-full bg-tomato px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#a83b25] disabled:opacity-60"
            >
              {hidePending ? '…' : 'Masquer le commentaire'}
            </button>
          </form>
        ) : null}

        <form action={resolveAction}>
          <input type="hidden" name="reportId" value={report.id} />
          <input type="hidden" name="status" value="resolved" />
          <button
            type="submit"
            disabled={resolvePending}
            className="rounded-full border border-green-deep/30 bg-cream px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-green-deep transition-colors hover:border-green-deep hover:bg-green-soft/30 disabled:opacity-60"
          >
            Résolu
          </button>
        </form>

        <form action={resolveAction}>
          <input type="hidden" name="reportId" value={report.id} />
          <input type="hidden" name="status" value="dismissed" />
          <button
            type="submit"
            disabled={resolvePending}
            className="rounded-full border border-green-soft/60 bg-cream px-4 py-1.5 text-xs italic text-ink-soft transition-colors hover:border-tomato hover:text-tomato disabled:opacity-60"
          >
            Rejeter
          </button>
        </form>

        {resolveState?.error ? (
          <span className="text-xs text-tomato">{resolveState.error}</span>
        ) : null}
        {hideState?.error ? (
          <span className="text-xs text-tomato">{hideState.error}</span>
        ) : null}
      </footer>
    </article>
  )
}
