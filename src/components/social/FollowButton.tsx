'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import { toggleFollowSowingAction } from '@/app/(frontend)/journal/social-actions'

type Props = {
  sowingId: number
  initialFollowing: boolean
  loggedIn: boolean
}

export function FollowButton({ sowingId, initialFollowing, loggedIn }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!loggedIn) {
    return (
      <Link
        href="/mon-potager/connexion"
        className="inline-flex items-center gap-2 rounded-full border border-green-deep/30 bg-cream-warm px-4 py-2 text-sm font-medium text-green-deep transition-colors hover:border-green-deep hover:bg-green-soft/30"
      >
        Suivre ce lot
      </Link>
    )
  }

  const onClick = () => {
    setError(null)
    const previous = following
    setFollowing(!previous)
    startTransition(async () => {
      const res = await toggleFollowSowingAction(sowingId)
      if (!res.ok) {
        setFollowing(previous)
        setError(res.error)
        return
      }
      setFollowing(res.following)
    })
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={following}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
          following
            ? 'bg-green-deep text-cream hover:bg-[#234034]'
            : 'border border-green-deep/30 bg-cream-warm text-green-deep hover:border-green-deep hover:bg-green-soft/30'
        }`}
      >
        <span aria-hidden>{following ? '✓' : '+'}</span>
        {following ? 'Suivi' : 'Suivre ce lot'}
      </button>
      {error ? <p className="text-xs text-tomato">{error}</p> : null}
    </div>
  )
}
