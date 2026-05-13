import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-green-soft/40 bg-green-deep text-cream/85">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl text-cream">Au fil des semis</p>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            Un carnet vivant, partagé, où l&apos;on suit ses semis saison après
            saison. Bibliothèque, journal et communauté.
          </p>
        </div>

        <nav aria-label="Liens utiles" className="text-sm">
          <p className="mb-4 text-xs uppercase tracking-[0.16em] text-cream/60">
            Naviguer
          </p>
          <ul className="space-y-2">
            <li><Link href="/bibliotheque" className="hover:text-tomato-soft">Bibliothèque</Link></li>
            <li><Link href="/journal" className="hover:text-tomato-soft">Journal</Link></li>
            <li><Link href="/tips" className="hover:text-tomato-soft">Tips</Link></li>
            <li><Link href="/calendrier" className="hover:text-tomato-soft">Calendrier</Link></li>
          </ul>
        </nav>

        <nav aria-label="Mentions" className="text-sm">
          <p className="mb-4 text-xs uppercase tracking-[0.16em] text-cream/60">
            Mentions
          </p>
          <ul className="space-y-2">
            <li><Link href="/a-propos" className="hover:text-tomato-soft">À propos</Link></li>
            <li><Link href="/contact" className="hover:text-tomato-soft">Contact</Link></li>
            <li><Link href="/mentions-legales" className="hover:text-tomato-soft">Mentions légales</Link></li>
            <li><Link href="/confidentialite" className="hover:text-tomato-soft">Confidentialité</Link></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-cream/10 px-6 py-6 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} Au fil des semis · Site fait avec soin en Belgique.
      </div>
    </footer>
  )
}
