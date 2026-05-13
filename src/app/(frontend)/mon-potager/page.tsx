import Link from 'next/link'

import { deleteMyAccountAction, signOutAction } from './actions'
import { DangerZone } from './DangerZone'
import { Container } from '@/components/Container'
import { SowingCard } from '@/components/SowingCard'
import { getSession } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export const metadata = {
  title: 'Mon potager',
  description:
    'Connecte-toi pour accéder à ton journal personnel, tes semis et tes rappels.',
}

async function getMySowings(userId: string | number) {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'sowings',
      where: { owner: { equals: userId } },
      limit: 50,
      sort: '-updatedAt',
      depth: 2,
    })
    return docs
  } catch {
    return []
  }
}

export default async function MonPotagerPage() {
  const session = await getSession()

  if (!session) {
    return (
      <section className="py-24">
        <Container className="max-w-2xl">
          <h1 className="font-serif text-5xl text-green-deep md:text-7xl">
            Mon potager
          </h1>
          <p className="mt-4 font-serif text-xl italic text-ink-soft">
            Ton espace personnel.
          </p>
          <p className="mt-8 text-lg leading-relaxed text-ink">
            Connecte-toi pour retrouver tes semis, ajouter des mises à jour et
            gérer tes rappels.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/mon-potager/connexion"
              className="inline-flex items-center gap-2 rounded-full bg-green-deep px-7 py-3.5 text-sm font-semibold text-white tracking-[0.04em] transition-colors hover:bg-[#234034]"
            >
              Se connecter
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/mon-potager/inscription"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-green-deep underline-offset-4 hover:underline"
            >
              Créer un compte
              <span aria-hidden>→</span>
            </Link>
          </div>
        </Container>
      </section>
    )
  }

  const sowings = await getMySowings(session.id)
  const greeting = session.displayName ?? session.email.split('@')[0]

  return (
    <section className="py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-5xl text-green-deep md:text-6xl">
              Salut, {greeting}.
            </h1>
            <p className="mt-3 font-serif text-lg italic text-ink-soft">
              Ton carnet personnel.
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-sm italic text-ink-soft underline-offset-4 hover:text-tomato hover:underline"
            >
              Se déconnecter
            </button>
          </form>
        </div>

        <div className="mt-12">
          {sowings.length ? (
            <>
              <h2 className="font-serif text-3xl text-green-deep">
                Tes semis en cours
              </h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sowings.map((sowing) => (
                  <SowingCard key={sowing.id} sowing={sowing} />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-pillow border border-green-soft/40 bg-cream-warm p-12 text-center">
              <p className="font-serif text-2xl text-green-deep">
                Pas encore de semis dans ton carnet.
              </p>
              <p className="mx-auto mt-4 max-w-prose text-ink-soft">
                Commence par ajouter ton premier lot — un nom, une plante de la
                bibliothèque, et c&apos;est parti. (L&apos;interface
                d&apos;ajout depuis le site arrive bientôt — en attendant tu
                peux passer par{' '}
                <Link
                  href="/admin"
                  className="text-tomato underline underline-offset-4"
                >
                  l&apos;admin
                </Link>
                .)
              </p>
            </div>
          )}
        </div>

        <DangerZone deleteAction={deleteMyAccountAction} />
      </Container>
    </section>
  )
}
