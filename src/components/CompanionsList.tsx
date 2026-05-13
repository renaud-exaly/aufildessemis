import Image from 'next/image'
import Link from 'next/link'

export type Companion = {
  slug: string
  name: string
  latinName?: string | null
  coverImage?: { url?: string | null; alt?: string | null } | null
  note?: string | null
}

function cover(c: Companion['coverImage']) {
  if (!c || typeof c !== 'object' || !c.url) return null
  return { url: c.url, alt: c.alt ?? '' }
}

export function CompanionsList({
  companions,
  variant = 'good',
}: {
  companions: Companion[]
  variant?: 'good' | 'warn'
}) {
  if (!companions.length) return null

  const cardBg =
    variant === 'warn' ? 'bg-cream shadow-warm' : 'bg-cream-warm shadow-warm'
  const dashColor =
    variant === 'warn' ? 'text-tomato' : 'text-green-sage'

  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {companions.map((c) => {
        const img = cover(c.coverImage)
        return (
          <li
            key={c.slug}
            className={`overflow-hidden rounded-pillow ${cardBg}`}
          >
            <Link
              href={`/bibliotheque/${c.slug}`}
              className="flex items-stretch gap-4 p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-soft bg-sand-soft">
                {img ? (
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl text-green-sage/40">
                    ✿
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <p className="font-serif text-xl text-green-deep">{c.name}</p>
                {c.latinName ? (
                  <p className="text-xs italic text-ink-soft">{c.latinName}</p>
                ) : null}
                {c.note ? (
                  <p className="mt-2 text-sm leading-snug text-ink-soft">
                    <span className={`italic ${dashColor}`}>— </span>
                    {c.note}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
