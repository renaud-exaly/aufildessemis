import Image from 'next/image'
import Link from 'next/link'

import { SowingWindowBadge } from './SowingWindowBadge'

type Plant = {
  slug: string
  name: string
  latinName?: string | null
  coverImage?: { url?: string | null; alt?: string | null } | string | null
  sowingWindow?: { startMonth?: string | null; endMonth?: string | null } | null
}

function imageUrl(cover: Plant['coverImage']): { url: string; alt: string } | null {
  if (!cover || typeof cover === 'string') return null
  if (!cover.url) return null
  return { url: cover.url, alt: cover.alt ?? '' }
}

export function PlantCard({ plant }: { plant: Plant }) {
  const cover = imageUrl(plant.coverImage)
  return (
    <Link
      href={`/bibliotheque/${plant.slug}`}
      className="group flex flex-col overflow-hidden rounded-pillow bg-surface shadow-warm transition-shadow hover:shadow-leaf"
    >
      <div className="aspect-square relative bg-sand-soft">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl text-green-sage/40">
            ✿
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-serif text-2xl text-green-deep">{plant.name}</h3>
        {plant.latinName ? (
          <p className="text-xs italic text-ink-soft">{plant.latinName}</p>
        ) : null}
        {plant.sowingWindow?.startMonth && plant.sowingWindow?.endMonth ? (
          <div className="mt-2">
            <SowingWindowBadge
              startMonth={plant.sowingWindow.startMonth}
              endMonth={plant.sowingWindow.endMonth}
            />
          </div>
        ) : null}
      </div>
    </Link>
  )
}
