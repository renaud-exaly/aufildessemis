import Link from 'next/link'

import { Container } from './Container'
import { getSession } from '@/lib/auth'

const navItems = [
  { href: '/bibliotheque', label: 'Bibliothèque' },
  { href: '/journal', label: 'Journal' },
  { href: '/tips', label: 'Tips' },
  { href: '/calendrier', label: 'Calendrier' },
  { href: '/a-propos', label: 'À propos' },
]

export async function Header() {
  const session = await getSession()
  const loggedIn = Boolean(session)
  const ctaHref = loggedIn ? '/mon-potager' : '/mon-potager/connexion'
  const ctaLabel = loggedIn ? 'Mon potager' : 'Se connecter'

  return (
    <header className="border-b border-green-soft/40 bg-cream">
      <Container className="flex items-center justify-between py-7">
        <Link
          href="/"
          className="flex items-baseline gap-3"
          aria-label="Au fil des semis — accueil"
        >
          <span className="font-serif text-2xl leading-none text-green-deep">
            Au fil des semis
          </span>
          <span className="hidden text-xs italic text-ink-soft md:inline">
            — le carnet
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="flex items-center gap-7">
          <ul className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-ink-soft underline-offset-4 transition-colors hover:text-green-deep hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href={ctaHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-green-deep underline-offset-4 hover:underline"
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        </nav>
      </Container>
    </header>
  )
}
