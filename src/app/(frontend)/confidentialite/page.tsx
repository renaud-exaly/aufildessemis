import { Container } from '@/components/Container'

export const metadata = {
  title: 'Politique de confidentialité',
  description:
    'Comment Au fil des semis collecte, utilise et protège tes données — RGPD.',
}

export default function ConfidentialitePage() {
  return (
    <article className="py-20">
      <Container className="max-w-3xl">
        <h1 className="font-serif text-5xl text-green-deep md:text-6xl">
          Confidentialité
        </h1>
        <p className="mt-4 font-serif text-xl italic text-ink-soft">
          Ce que nous savons de toi, et ce que nous en faisons.
        </p>

        <div className="prose prose-stone mt-12 max-w-prose leading-relaxed text-ink">
          <h2>1. Quelles données nous collectons</h2>
          <ul>
            <li>
              <strong>Compte membre</strong> : adresse email, nom
              d&apos;affichage, mot de passe (haché), bio courte, avatar (si tu
              en uploads un), région (par défaut : BE), préférences (newsletter,
              rappels).
            </li>
            <li>
              <strong>Contenus que tu publies</strong> : tes lots de semis,
              tes mises à jour datées, photos, notes, étapes, commentaires.
            </li>
            <li>
              <strong>Données techniques</strong> : un cookie de session
              strictement nécessaire (<code>payload-token</code>) pour te
              maintenir connecté·e. Pas de tracker tiers, pas de Google
              Analytics, pas de Facebook Pixel.
            </li>
          </ul>

          <h2>2. Pourquoi (base légale)</h2>
          <ul>
            <li>
              <strong>Exécution du contrat</strong> : gérer ton compte et te
              permettre d&apos;utiliser le site.
            </li>
            <li>
              <strong>Consentement</strong> : newsletter mensuelle et rappels
              email. Tu peux retirer ton consentement à tout moment depuis ton
              profil ou via le lien de désinscription dans chaque email.
            </li>
            <li>
              <strong>Intérêt légitime</strong> : modération des contenus,
              prévention du spam.
            </li>
          </ul>

          <h2>3. Combien de temps</h2>
          <p>
            Tes données sont conservées tant que ton compte est actif. Si tu
            supprimes ton compte (depuis{' '}
            <a href="/mon-potager" className="text-tomato">
              Mon potager
            </a>
            ), tes données personnelles (email, nom, bio, avatar) sont
            immédiatement effacées. Les contenus publiés (semis, mises à jour)
            restent visibles, mais attribués à <em>« Membre supprimé »</em>.
            Tu peux demander leur retrait complet par email.
          </p>

          <h2>4. Avec qui nous les partageons</h2>
          <p>
            Aucune donnée n&apos;est revendue. Nous utilisons{' '}
            <strong>Resend</strong> (Europe) pour l&apos;envoi des emails
            transactionnels et de la newsletter. Resend reçoit ton email et ton
            nom d&apos;affichage uniquement à des fins d&apos;envoi.
          </p>

          <h2>5. Tes droits</h2>
          <p>Conformément au RGPD, tu peux à tout moment :</p>
          <ul>
            <li>
              <strong>Accéder</strong> à tes données : via{' '}
              <a href="/mon-potager" className="text-tomato">
                Mon potager
              </a>
              {' '}ou sur demande.
            </li>
            <li>
              <strong>Rectifier</strong> tes informations depuis ton profil.
            </li>
            <li>
              <strong>Supprimer</strong> ton compte via la section
              &quot;Compte & confidentialité&quot; en bas de{' '}
              <a href="/mon-potager" className="text-tomato">
                Mon potager
              </a>
              .
            </li>
            <li>
              <strong>Demander la portabilité</strong> de tes données par email
              à{' '}
              <a href="mailto:contact@aufildessemis.be" className="text-tomato">
                contact@aufildessemis.be
              </a>
              .
            </li>
            <li>
              <strong>Déposer une réclamation</strong> auprès de l&apos;
              <a
                href="https://www.autoriteprotectiondonnees.be/"
                className="text-tomato"
                rel="noopener noreferrer"
                target="_blank"
              >
                Autorité de Protection des Données
              </a>
              {' '}(Belgique).
            </li>
          </ul>

          <h2>6. Cookies</h2>
          <p>
            Au fil des semis utilise <strong>uniquement un cookie de session
            strictement nécessaire</strong> au fonctionnement du site (te
            garder connecté·e). Aucun cookie de mesure d&apos;audience tiers,
            aucun cookie publicitaire. Pas de bandeau cookies imposé par la
            législation.
          </p>

          <h2>7. Mises à jour</h2>
          <p>
            Cette politique peut évoluer. Toute modification substantielle te
            sera notifiée par email si tu as un compte.
          </p>

          <p className="mt-12 text-sm italic text-ink-soft">
            Dernière mise à jour : mai 2026.
          </p>
        </div>
      </Container>
    </article>
  )
}
