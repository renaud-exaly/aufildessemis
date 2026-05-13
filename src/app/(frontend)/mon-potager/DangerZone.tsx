'use client'

import { useState } from 'react'

export function DangerZone({ deleteAction }: { deleteAction: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <section className="mt-24 rounded-pillow border border-green-soft/40 bg-cream-warm p-8">
      <h2 className="font-serif text-2xl text-green-deep">Compte & confidentialité</h2>
      <p className="mt-3 max-w-prose text-sm text-ink-soft">
        Tu peux supprimer ton compte à tout moment. Conformément au RGPD, tes
        données personnelles (email, nom, bio, avatar) seront effacées. Les
        contenus que tu as publiés (semis, mises à jour) resteront visibles mais
        seront attribués à <em>« Membre supprimé »</em>.
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-6 text-sm italic text-tomato underline-offset-4 hover:underline"
        >
          Supprimer mon compte
        </button>
      ) : (
        <form action={deleteAction} className="mt-6">
          <p className="rounded-soft border border-tomato/40 bg-tomato/[0.06] p-4 text-sm text-tomato">
            Cette action est <strong>définitive</strong>. Tu seras déconnecté·e
            immédiatement et il ne sera plus possible de récupérer ce compte.
          </p>
          <div className="mt-4 flex items-center gap-6">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-sm italic text-ink-soft hover:text-green-deep"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-tomato px-6 py-3 text-sm font-semibold text-white tracking-[0.04em] transition-colors hover:bg-[#a83b25]"
            >
              Oui, supprimer définitivement →
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
