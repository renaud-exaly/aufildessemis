import Image from 'next/image'
import Link from 'next/link'

import { deleteMyAccountAction, signOutAction } from './actions'
import { DangerZone } from './DangerZone'
import { ChangePasswordForm } from './ChangePasswordForm'
import { Container } from '@/components/Container'
import { getSession } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { SOWING_STAGES } from '@/lib/stages'

const stageLabel = (value?: string | null) =>
  value ? SOWING_STAGES.find((s) => s.value === value)?.label ?? value : null

type OwnerSowing = {
  id: string | number
  name: string
  currentStage?: string | null
  visibility?: string | null
  startedAt?: string | Date | null
  plant?: { name?: string | null } | string | number
  latestPhoto?: { url?: string | null; alt?: string | null }
}

function OwnerSowingCard({ sowing }: { sowing: OwnerSowing }) {
  const plantName =
    typeof sowing.plant === 'object' && sowing.plant ? sowing.plant.name : null
  const stage = stageLabel(sowing.currentStage)
  return (
    <Link
      href={`/mon-potager/${sowing.id}`}
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
        {stage ? (
          <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-green-deep backdrop-blur">
            {stage}
          </span>
        ) : null}
        {sowing.visibility === 'private' ? (
          <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-cream backdrop-blur">
            Privé
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <h3 className="font-serif text-xl text-green-deep">{sowing.name}</h3>
        <p className="text-xs text-ink-soft">
          {plantName ?? ''}
          {sowing.startedAt
            ? `${plantName ? ' · ' : ''}depuis ${new Date(
                sowing.startedAt,
              ).toLocaleDateString('fr-BE', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}`
            : ''}
        </p>
      </div>
    </Link>
  )
}

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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-3xl text-green-deep">
              {sowings.length ? 'Tes semis en cours' : 'Ton carnet est vide'}
            </h2>
            <Link
              href="/mon-potager/nouveau-semis"
              className="inline-flex items-center gap-2 rounded-full bg-tomato px-5 py-2.5 text-sm font-semibold text-white tracking-[0.04em] transition-colors hover:bg-[#a83b25]"
            >
              + Nouveau lot
            </Link>
          </div>

          {sowings.length ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sowings.map((sowing) => (
                <OwnerSowingCard key={sowing.id} sowing={sowing} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-pillow border border-green-soft/40 bg-cream-warm p-12 text-center">
              <p className="font-serif text-2xl text-green-deep">
                Pas encore de semis dans ton carnet.
              </p>
              <p className="mx-auto mt-4 max-w-prose text-ink-soft">
                Commence par ajouter ton premier lot — un nom, une plante de la
                bibliothèque, et c&apos;est parti.
              </p>
            </div>
          )}
        </div>

        {/* Sécurité — changement de mot de passe */}
        <div className="mt-20 max-w-xl">
          <h2 className="font-serif text-3xl text-green-deep">Mon compte</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Change ton mot de passe quand tu veux.
          </p>
          <div className="mt-6 rounded-pillow border border-green-soft/40 bg-cream-warm p-6">
            <ChangePasswordForm />
          </div>
        </div>

        <DangerZone deleteAction={deleteMyAccountAction} />
      </Container>
    </section>
  )
}
