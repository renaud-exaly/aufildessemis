'use client'

import { useEffect, useRef, useState } from 'react'

type ShareTarget = 'whatsapp' | 'telegram' | 'email' | 'copy'

type Props = {
  /** URL absolue ou relative (sera résolue côté client). */
  url: string
  /** Titre court — affiché dans le sujet d'email / accroche. */
  title: string
  /** Texte d'accroche court, ex. "Mes courgettes 2026, déjà au stade levée 🌱". */
  text?: string
  /** Label du bouton, défaut "Partager". */
  label?: string
  /** Style compact (bouton secondaire) ou primary. */
  variant?: 'primary' | 'ghost'
}

function resolveUrl(url: string): string {
  if (typeof window === 'undefined') return url
  try {
    return new URL(url, window.location.origin).toString()
  } catch {
    return url
  }
}

export function ShareButton({
  url,
  title,
  text,
  label = 'Partager',
  variant = 'ghost',
}: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hasWebShare, setHasWebShare] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHasWebShare(
      typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    )
  }, [])

  // Ferme le menu sur clic extérieur ou Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const triggerWebShare = async () => {
    const fullUrl = resolveUrl(url)
    try {
      await navigator.share({ title, text, url: fullUrl })
    } catch {
      // AbortError = user a annulé : on n'ouvre pas le menu, c'est OK.
    }
  }

  const onPrimaryClick = () => {
    if (hasWebShare) {
      triggerWebShare()
    } else {
      setOpen((v) => !v)
    }
  }

  const onTarget = async (kind: ShareTarget) => {
    const fullUrl = resolveUrl(url)
    if (kind === 'copy') {
      try {
        await navigator.clipboard.writeText(fullUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      } catch {
        // Permission refusée : on garde le menu ouvert pour que l'user
        // puisse copier manuellement depuis le href.
      }
      return
    }
    const encUrl = encodeURIComponent(fullUrl)
    const encText = encodeURIComponent(text ?? title)
    let href = ''
    if (kind === 'whatsapp') {
      href = `https://wa.me/?text=${encText}%20${encUrl}`
    } else if (kind === 'telegram') {
      href = `https://t.me/share/url?url=${encUrl}&text=${encText}`
    } else if (kind === 'email') {
      const subject = encodeURIComponent(title)
      const body = encodeURIComponent(`${text ?? ''}\n\n${fullUrl}`)
      href = `mailto:?subject=${subject}&body=${body}`
    }
    if (href) window.open(href, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const baseBtn =
    variant === 'primary'
      ? 'inline-flex items-center gap-2 rounded-full bg-green-deep px-5 py-2.5 text-sm font-semibold text-white tracking-[0.04em] transition-colors hover:bg-[#234034]'
      : 'inline-flex items-center gap-2 rounded-full border border-green-deep/30 bg-cream-warm px-4 py-2 text-sm font-medium text-green-deep transition-colors hover:border-green-deep hover:bg-green-soft/30'

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={onPrimaryClick}
        aria-haspopup={hasWebShare ? undefined : 'menu'}
        aria-expanded={hasWebShare ? undefined : open}
        className={baseBtn}
      >
        <ShareIcon />
        {label}
      </button>

      {!hasWebShare && open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-soft border border-green-soft/40 bg-cream shadow-leaf"
        >
          <MenuItem onClick={() => onTarget('copy')}>
            <CopyIcon />
            {copied ? 'Lien copié' : 'Copier le lien'}
          </MenuItem>
          <MenuItem onClick={() => onTarget('whatsapp')}>
            <WhatsAppIcon />
            WhatsApp
          </MenuItem>
          <MenuItem onClick={() => onTarget('telegram')}>
            <TelegramIcon />
            Telegram
          </MenuItem>
          <MenuItem onClick={() => onTarget('email')}>
            <MailIcon />
            Email
          </MenuItem>
        </div>
      ) : null}
    </div>
  )
}

function MenuItem({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink hover:bg-cream-warm"
    >
      {children}
    </button>
  )
}

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.6 6.32A8 8 0 0 0 4.18 14.7L3 21l6.45-1.16a8 8 0 0 0 12.4-6.74 8 8 0 0 0-4.24-6.78ZM12 19.6a6.62 6.62 0 0 1-3.36-.92l-.24-.14-3.59.65.69-3.52-.16-.25A6.64 6.64 0 1 1 12 19.6Zm3.61-4.98c-.2-.1-1.18-.58-1.36-.65-.18-.07-.31-.1-.45.1-.13.2-.5.65-.62.78-.12.13-.23.15-.43.05a5.4 5.4 0 0 1-2.7-2.36c-.2-.34.2-.32.58-1.06.06-.13.03-.24-.02-.34l-.6-1.43c-.16-.39-.33-.34-.45-.34l-.39-.01a.75.75 0 0 0-.54.25 2.27 2.27 0 0 0-.7 1.69 3.93 3.93 0 0 0 .82 2.1c.1.13 1.4 2.16 3.39 3.04a11.61 11.61 0 0 0 1.13.42 2.73 2.73 0 0 0 1.25.08c.38-.06 1.18-.48 1.34-.95.17-.46.17-.86.12-.94-.05-.08-.18-.13-.38-.23Z" />
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21.5 4.5 2.86 11.86c-.92.36-.92.95-.18 1.18l4.76 1.48 1.85 5.7c.22.6.4.8.78.8.36 0 .51-.17.7-.4l2.4-2.34 4.97 3.68c.91.5 1.56.24 1.79-.84l3.24-15.3c.34-1.32-.5-1.92-1.37-1.53Zm-3.86 3.94-8.65 7.79-.34 3.7-1.84-5.62 10.84-5.87Z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3,7 12,13 21,7" />
    </svg>
  )
}
