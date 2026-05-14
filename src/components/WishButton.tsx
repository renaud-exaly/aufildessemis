'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import { toggleWishAction } from '@/app/(frontend)/mon-potager/envies/actions'

type Props = {
  plantId: number
  plantName: string
  initialWished: boolean
  /** Si false, le bouton renvoie vers la connexion au lieu d'appeler l'action. */
  loggedIn: boolean
}

export function WishButton({ plantId, plantName, initialWished, loggedIn }: Props) {
  const [wished, setWished] = useState(initialWished)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!loggedIn) {
    return (
      <Link
        href="/mon-potager/connexion?next=/bibliotheque"
        className="inline-flex items-center gap-2 rounded-full border border-green-deep/30 bg-cream-warm px-4 py-2 text-sm font-medium text-green-deep transition-colors hover:border-green-deep hover:bg-green-soft/30"
      >
        <span aria-hidden>♡</span>
        Ajouter à mes envies
      </Link>
    )
  }

  const onClick = () => {
    setError(null)
    const previous = wished
    setWished(!previous)
    startTransition(async () => {
      const res = await toggleWishAction(plantId)
      if (!res.ok) {
        setWished(previous)
        setError(res.error)
        return
      }
      setWished(res.wished)
    })
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={wished}
        aria-label={
          wished
            ? `Retirer ${plantName} de mes envies`
            : `Ajouter ${plantName} à mes envies`
        }
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
          wished
            ? 'bg-tomato/10 text-tomato hover:bg-tomato/15'
            : 'border border-green-deep/30 bg-cream-warm text-green-deep hover:border-green-deep hover:bg-green-soft/30'
        }`}
      >
        <span aria-hidden>{wished ? '♥' : '♡'}</span>
        {wished ? 'Dans mes envies' : 'Ajouter à mes envies'}
      </button>
      {error ? <p className="text-xs text-tomato">{error}</p> : null}
    </div>
  )
}
