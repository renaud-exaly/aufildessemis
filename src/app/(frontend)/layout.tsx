import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import React from 'react'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

import './styles.css'

// Le Header rend l'état de session via cookies() ; force le dynamic SSR
// sur tout le layout (frontend) sinon Next pré-rend en static et le
// header affiche "Se connecter" même quand l'user est loggé.
export const dynamic = 'force-dynamic'

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'opsz'],
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Au fil des semis — Un carnet vivant, partagé',
    template: '%s — Au fil des semis',
  },
  description:
    'Au fil des semis est un carnet vivant pour suivre ses semis et plantations, consulter des fiches plantes et partager avec une communauté de jardiniers francophones.',
  metadataBase: new URL(
    process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
  ),
  applicationName: 'Au fil des semis',
  authors: [{ name: 'Au fil des semis' }],
  keywords: [
    'semis',
    'potager',
    'jardin',
    'jardinage',
    'permaculture',
    'Belgique',
    'communauté jardiniers',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_BE',
    siteName: 'Au fil des semis',
    title: 'Au fil des semis — Un carnet vivant, partagé',
    description:
      'Suis tes semis saison après saison, consulte des fiches plantes et partage avec une communauté de jardiniers.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Au fil des semis',
    description:
      'Carnet de semis et bibliothèque de plantes — communauté francophone.',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="bg-cream text-ink flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
