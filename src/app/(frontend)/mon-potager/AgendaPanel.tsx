import Image from 'next/image'
import Link from 'next/link'

import type { AgendaResult } from '@/lib/agenda'
import type { FrostNight } from '@/lib/weather'

type Props = {
  agenda: AgendaResult
  frost: FrostNight[]
}

export function AgendaPanel({ agenda, frost }: Props) {
  const { wishesToSow, pendingStages } = agenda
  const hasContent =
    wishesToSow.length > 0 || pendingStages.length > 0 || frost.length > 0
  if (!hasContent) return null

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-3">
      {/* Météo / gel ----------------------------------------------------- */}
      {frost.length ? (
        <section className="rounded-pillow border border-tomato/40 bg-tomato/[0.04] p-6">
          <header className="flex items-center gap-2">
            <span aria-hidden className="text-2xl">❄</span>
            <h3 className="font-serif text-xl text-tomato">Alerte gel</h3>
          </header>
          <p className="mt-2 text-sm text-ink-soft">
            À Bruxelles, prochaines nuits froides :
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink">
            {frost.map((f) => (
              <li key={f.date} className="flex items-baseline justify-between gap-3">
                <span className="capitalize">{f.label}</span>
                <span className="font-mono text-tomato">
                  {f.minTemp.toFixed(1)}°C
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs italic text-ink-soft">
            Pense à rentrer tes jeunes plants ou à les couvrir.
          </p>
        </section>
      ) : null}

      {/* Lots à faire avancer ------------------------------------------- */}
      {pendingStages.length ? (
        <section className="rounded-pillow border border-green-soft/60 bg-cream-warm p-6 lg:col-span-2">
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-serif text-xl text-green-deep">
              Tes lots à faire avancer
            </h3>
            <span className="text-xs uppercase tracking-[0.16em] text-ink-soft">
              {pendingStages.length}
              {pendingStages.length > 1 ? ' lots' : ' lot'}
            </span>
          </header>
          <ul className="mt-4 space-y-3">
            {pendingStages.slice(0, 5).map((p) => (
              <li key={p.sowingId}>
                <Link
                  href={`/mon-potager/${p.sowingId}`}
                  className="flex items-center gap-4 rounded-soft bg-cream p-3 transition-colors hover:bg-green-soft/15"
                >
                  <div className="aspect-square relative h-14 w-14 shrink-0 overflow-hidden rounded-soft bg-sand-soft">
                    {p.cover ? (
                      <Image
                        src={p.cover.url}
                        alt={p.cover.alt}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl text-green-sage/40">
                        🌱
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-base text-green-deep">
                      {p.sowingName}
                    </p>
                    <p className="text-xs text-ink-soft">
                      Prochain stade :{' '}
                      <span className="text-green-deep">{p.nextStageLabel}</span>
                      {p.daysOverdue === null ? null : p.daysOverdue >= 0 ? (
                        <span className="ml-2 rounded-full bg-tomato/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-tomato">
                          {p.daysOverdue === 0
                            ? 'aujourd’hui'
                            : `+${p.daysOverdue}j de retard`}
                        </span>
                      ) : (
                        <span className="ml-2 rounded-full bg-green-soft/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-green-deep">
                          dans {Math.abs(p.daysOverdue)}j
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Semis à lancer (depuis envies) --------------------------------- */}
      {wishesToSow.length ? (
        <section className="rounded-pillow border border-green-deep/30 bg-green-soft/15 p-6 lg:col-span-3">
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-serif text-xl text-green-deep">
              C&apos;est le moment de semer
            </h3>
            <Link
              href="/mon-potager/envies"
              className="text-xs italic text-ink-soft underline-offset-4 hover:text-tomato hover:underline"
            >
              Voir toutes mes envies →
            </Link>
          </header>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {wishesToSow.map((w) => (
              <li key={w.plantId}>
                <Link
                  href={`/mon-potager/nouveau-semis?plant=${w.plantId}`}
                  className="flex items-center gap-4 rounded-soft bg-cream p-3 transition-colors hover:bg-green-soft/30"
                >
                  <div className="aspect-square relative h-14 w-14 shrink-0 overflow-hidden rounded-soft bg-sand-soft">
                    {w.cover ? (
                      <Image
                        src={w.cover.url}
                        alt={w.cover.alt}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl text-green-sage/40">
                        ✿
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-base text-green-deep">
                      {w.plantName}
                    </p>
                    <p className="text-xs text-ink-soft">{w.windowLabel}</p>
                  </div>
                  <span aria-hidden className="text-tomato">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
