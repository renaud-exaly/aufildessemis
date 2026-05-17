import Script from 'next/script'

/**
 * Plomberie analytics RGPD-friendly. Aucun provider activé par défaut.
 *
 * Au choix, configurer un (ou plusieurs) des blocs d'env vars suivants :
 *
 *   - Plausible (cloud ou self-hosted) :
 *       NEXT_PUBLIC_PLAUSIBLE_DOMAIN=aufildessemis.be
 *       NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL=https://plausible.io/js/script.js
 *         (ou https://plausible.aufildessemis.be/js/script.js si self-hosted)
 *
 *   - Umami (self-hosted habituellement) :
 *       NEXT_PUBLIC_UMAMI_WEBSITE_ID=<uuid>
 *       NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://umami.aufildessemis.be/script.js
 *
 * Si aucune des deux n'est configurée, ce composant ne rend rien — utile pour
 * un dev local "no-tracking" sans toucher au code.
 */
export function Analytics() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
  const plausibleScript =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL ??
    'https://plausible.io/js/script.js'

  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const umamiScript = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL

  if (!plausibleDomain && !umamiId) return null

  return (
    <>
      {plausibleDomain ? (
        <Script
          src={plausibleScript}
          data-domain={plausibleDomain}
          strategy="afterInteractive"
          defer
        />
      ) : null}
      {umamiId && umamiScript ? (
        <Script
          src={umamiScript}
          data-website-id={umamiId}
          strategy="afterInteractive"
          defer
        />
      ) : null}
    </>
  )
}
