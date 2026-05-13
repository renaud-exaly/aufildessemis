import { SOWING_STAGES, type SowingStage } from '@/lib/stages'

type Stage = {
  stage: SowingStage
  daysFromPrevious?: number | null
  tip?: string | null
}

const stageLabel = (value: string): string =>
  SOWING_STAGES.find((s) => s.value === value)?.label ?? value

export function StageTimeline({
  stages,
  currentStage,
}: {
  stages: Stage[]
  currentStage?: string | null
}) {
  if (!stages?.length) return null

  return (
    <ol className="relative border-l border-green-soft/60 pl-6">
      {stages.map((s, i) => {
        const isCurrent = currentStage === s.stage
        const isPast =
          currentStage &&
          stages.findIndex((x) => x.stage === currentStage) > i

        return (
          <li key={`${s.stage}-${i}`} className="mb-8 last:mb-0">
            <span
              className={`absolute -left-[7px] grid h-3.5 w-3.5 place-items-center rounded-full ${
                isCurrent
                  ? 'bg-tomato ring-4 ring-tomato/20'
                  : isPast
                    ? 'bg-green-sage'
                    : 'bg-cream ring-2 ring-green-soft/70'
              }`}
              aria-hidden
            />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h4 className="font-serif text-xl text-green-deep">
                {stageLabel(s.stage)}
              </h4>
              {s.daysFromPrevious != null ? (
                <span className="text-xs text-ink-soft">
                  ~{s.daysFromPrevious} j
                </span>
              ) : null}
              {isCurrent ? (
                <span className="rounded-full bg-tomato/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-tomato">
                  En cours
                </span>
              ) : null}
            </div>
            {s.tip ? (
              <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-soft">
                {s.tip}
              </p>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
