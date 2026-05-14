import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getMyWishes } from './actions'
import { Container } from '@/components/Container'
import { SowingWindowBadge } from '@/components/SowingWindowBadge'
import { WishButton } from '@/components/WishButton'
import { getSession } from '@/lib/auth'
import { currentMonth, isInWindow } from '@/lib/months'

export const metadata = {
  title: 'Mes envies de semis',
  description:
    'Les plantes que tu prévois de semer. On t\'envoie un rappel quand la fenêtre s\'ouvre.',
}

export default async function EnviesPage() {
  const session = await getSession()
  if (!session) redirect('/mon-potager/connexion?next=/mon-potager/envies')

  const wishes = await getMyWishes()
  const month = currentMonth()
  const year = new Date().getFullYear()

  const active = wishes.filter(
    (w) =>
      !w.dismissed &&
      w.plant.sowingWindow?.startMonth &&
      w.plant.sowingWindow?.endMonth &&
      isInWindow(
        month,
        w.plant.sowingWindow.startMonth,
        w.plant.sowingWindow.endMonth,
      ),
  )
  const upcoming = wishes.filter((w) => !active.includes(w) && !w.dismissed)
  const dismissed = wishes.filter((w) => w.dismissed)

  return (
    <Container className="py-12">
      <Link
        href="/mon-potager"
        className="text-sm uppercase tracking-[0.14em] text-ink-soft hover:text-tomato"
      >
        ← Mon potager
      </Link>
      <h1 className="mt-4 font-serif text-4xl text-green-deep">Mes envies de semis</h1>
      <p className="mt-2 max-w-prose text-ink-soft">
        Les plantes que tu prévois de semer. On t&apos;envoie un rappel par
        email quand le mois s&apos;ouvre — pas plus d&apos;un toutes les 48h
        pour ne pas t&apos;inonder.
      </p>

      {wishes.length === 0 ? (
        <div className="mt-12 rounded-pillow border border-dashed border-green-soft bg-cream-warm p-12 text-center">
          <p className="font-serif text-2xl text-green-deep">
            Rien dans tes envies pour l&apos;instant.
          </p>
          <p className="mt-3 text-ink-soft">
            Parcours la bibliothèque et ajoute les plantes que tu veux semer
            cette saison.
          </p>
          <Link
            href="/bibliotheque"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-deep px-5 py-2 text-sm font-medium text-cream hover:bg-green-deep/90"
          >
            Aller à la bibliothèque →
          </Link>
        </div>
      ) : null}

      {active.length ? (
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-tomato">
            C&apos;est le moment ({active.length})
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            La fenêtre de semis est ouverte aujourd&apos;hui.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((w) => (
              <WishCard key={String(w.id)} wish={w} alreadyNotified={w.lastNotifiedYear === year} />
            ))}
          </div>
        </section>
      ) : null}

      {upcoming.length ? (
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-green-deep">
            À venir ({upcoming.length})
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            On te préviendra dès que la fenêtre s&apos;ouvre.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((w) => (
              <WishCard key={String(w.id)} wish={w} />
            ))}
          </div>
        </section>
      ) : null}

      {dismissed.length ? (
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-ink-soft">
            Mises de côté ({dismissed.length})
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Pas de rappel cette année. Tu peux les retirer ou les réactiver
            depuis la fiche plante.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dismissed.map((w) => (
              <WishCard key={String(w.id)} wish={w} muted />
            ))}
          </div>
        </section>
      ) : null}
    </Container>
  )
}

type WishCardProps = {
  wish: Awaited<ReturnType<typeof getMyWishes>>[number]
  alreadyNotified?: boolean
  muted?: boolean
}

function WishCard({ wish, alreadyNotified, muted }: WishCardProps) {
  const { plant } = wish
  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-pillow bg-surface shadow-warm transition-shadow hover:shadow-leaf ${
        muted ? 'opacity-70' : ''
      }`}
    >
      <Link
        href={`/bibliotheque/${plant.slug}`}
        className="aspect-[5/4] relative block bg-sand-soft"
      >
        {plant.coverImage?.url ? (
          <Image
            src={plant.coverImage.url}
            alt={plant.coverImage.alt ?? plant.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl text-green-sage/40">
            ✿
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link
          href={`/bibliotheque/${plant.slug}`}
          className="font-serif text-2xl text-green-deep hover:text-tomato"
        >
          {plant.name}
        </Link>
        {plant.latinName ? (
          <p className="-mt-2 text-sm italic text-ink-soft">{plant.latinName}</p>
        ) : null}
        {plant.sowingWindow?.startMonth && plant.sowingWindow?.endMonth ? (
          <SowingWindowBadge
            startMonth={plant.sowingWindow.startMonth}
            endMonth={plant.sowingWindow.endMonth}
          />
        ) : null}
        {alreadyNotified ? (
          <p className="text-xs text-ink-soft">
            ✓ Rappel envoyé cette saison.
          </p>
        ) : null}
        <div className="mt-auto pt-2">
          <WishButton
            plantId={Number(plant.id)}
            plantName={plant.name}
            initialWished={true}
            loggedIn
          />
        </div>
      </div>
    </article>
  )
}
