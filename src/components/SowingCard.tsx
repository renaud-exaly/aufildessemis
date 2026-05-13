import Image from 'next/image'
import Link from 'next/link'

import { SOWING_STAGES } from '@/lib/stages'

type Sowing = {
  id: string | number
  name: string
  currentStage?: string | null
  startedAt?: string | Date | null
  owner?: { id: string | number; displayName?: string | null } | string | number
  plant?: { name?: string | null; slug?: string | null } | string | number
  latestPhoto?: { url?: string | null; alt?: string | null }
  latestNote?: string | null
}

const stageLabel = (value?: string | null) =>
  value ? SOWING_STAGES.find((s) => s.value === value)?.label ?? value : null

const ownerDisplay = (owner: Sowing['owner']) => {
  if (!owner || typeof owner !== 'object') return null
  return owner.displayName ?? null
}

const plantDisplay = (plant: Sowing['plant']) => {
  if (!plant || typeof plant !== 'object') return null
  return plant.name ?? null
}

export function SowingCard({ sowing }: { sowing: Sowing }) {
  const ownerName = ownerDisplay(sowing.owner)
  const plantName = plantDisplay(sowing.plant)
  const currentStage = stageLabel(sowing.currentStage)
  const href =
    typeof sowing.owner === 'object' && sowing.owner?.id
      ? `/journal/${sowing.owner.id}/${sowing.id}`
      : `/journal/inconnu/${sowing.id}`

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-pillow bg-surface shadow-warm transition-shadow hover:shadow-leaf"
    >
      <div className="aspect-[5/4] relative bg-sand-soft">
        {sowing.latestPhoto?.url ? (
          <Image
            src={sowing.latestPhoto.url}
            alt={sowing.latestPhoto.alt ?? ''}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl text-green-sage/40">
            🌱
          </div>
        )}
        {currentStage ? (
          <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-green-deep backdrop-blur">
            {currentStage}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <h3 className="font-serif text-xl text-green-deep">{sowing.name}</h3>
        <p className="text-xs text-ink-soft">
          {plantName ? `${plantName} · ` : ''}
          {ownerName ? `par ${ownerName}` : ''}
        </p>
        {sowing.latestNote ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
            {sowing.latestNote}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
