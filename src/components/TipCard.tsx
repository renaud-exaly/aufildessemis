import Image from 'next/image'
import Link from 'next/link'

type Tip = {
  slug: string
  title: string
  coverImage?: { url?: string | null; alt?: string | null } | null
  plants?: Array<{ name?: string | null } | string | number> | null
}

export function TipCard({ tip }: { tip: Tip }) {
  const tags =
    tip.plants
      ?.map((p) => (typeof p === 'object' && p?.name ? p.name : null))
      .filter(Boolean) ?? []

  return (
    <Link
      href={`/tips/${tip.slug}`}
      className="group flex flex-col overflow-hidden rounded-pillow bg-surface shadow-warm transition-shadow hover:shadow-leaf"
    >
      <div className="aspect-[16/10] relative bg-green-deep/10">
        {tip.coverImage?.url ? (
          <Image
            src={tip.coverImage.url}
            alt={tip.coverImage.alt ?? ''}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl text-green-sage/40">
            ✎
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-serif text-xl text-green-deep">{tip.title}</h3>
        {tags.length ? (
          <p className="text-xs uppercase tracking-[0.14em] text-tomato">
            {tags.join(' · ')}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
