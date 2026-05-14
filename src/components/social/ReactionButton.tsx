'use client'

import { useState, useTransition } from 'react'

import { toggleReactionAction } from '@/app/(frontend)/journal/social-actions'

type Props = {
  sowingUpdateId: number
  initialReacted: boolean
  initialCount: number
  /** Si false, clic = redirection vers la connexion. */
  loggedIn: boolean
}

export function ReactionButton({
  sowingUpdateId,
  initialReacted,
  initialCount,
  loggedIn,
}: Props) {
  const [reacted, setReacted] = useState(initialReacted)
  const [count, setCount] = useState(initialCount)
  const [pending, startTransition] = useTransition()

  const onClick = () => {
    if (!loggedIn) {
      window.location.href = '/mon-potager/connexion?next=' + encodeURIComponent(window.location.pathname)
      return
    }
    const prevReacted = reacted
    const prevCount = count
    setReacted(!prevReacted)
    setCount(prevReacted ? Math.max(0, prevCount - 1) : prevCount + 1)
    startTransition(async () => {
      const res = await toggleReactionAction(sowingUpdateId)
      if (!res.ok) {
        setReacted(prevReacted)
        setCount(prevCount)
      } else {
        setReacted(res.reacted)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={reacted}
      aria-label={reacted ? 'Retirer mon ♥' : 'Aimer'}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors disabled:opacity-60 ${
        reacted
          ? 'bg-tomato/10 text-tomato hover:bg-tomato/15'
          : 'text-ink-soft hover:bg-green-soft/20 hover:text-tomato'
      }`}
    >
      <span aria-hidden>{reacted ? '♥' : '♡'}</span>
      <span className="font-mono text-xs">{count}</span>
    </button>
  )
}
