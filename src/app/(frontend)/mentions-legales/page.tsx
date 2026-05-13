import { Container } from '@/components/Container'

export const metadata = {
  title: 'Mentions légales',
  description: "Éditeur, hébergement et contact d'Au fil des semis.",
}

export default function MentionsLegalesPage() {
  return (
    <article className="py-20">
      <Container className="max-w-3xl">
        <h1 className="font-serif text-5xl text-green-deep md:text-6xl">
          Mentions légales
        </h1>
        <p className="mt-4 font-serif text-xl italic text-ink-soft">
          Les informations essentielles.
        </p>

        <div className="prose prose-stone mt-12 max-w-prose leading-relaxed text-ink">
          <h2>Éditeur du site</h2>
          <p>
            <strong>Au fil des semis</strong>
            <br />
            Projet personnel — Belgique.
            <br />
            Contact :{' '}
            <a href="mailto:contact@aufildessemis.be" className="text-tomato">
              contact@aufildessemis.be
            </a>
          </p>

          <h2>Directeur de la publication</h2>
          <p>
            Le propriétaire du site (information complète disponible sur
            demande à l&apos;adresse de contact ci-dessus).
          </p>

          <h2>Hébergement</h2>
          <p>
            Le site est hébergé sur un serveur VPS situé en Europe. Les détails
            techniques précis (datacenter, prestataire) sont communiqués sur
            demande.
          </p>

          <h2>Propriété intellectuelle</h2>
          <p>
            Les contenus du site (textes, photos, fiches plantes, code source
            applicatif) sont protégés par le droit d&apos;auteur. Les contenus
            publiés par les membres dans leur journal restent leur propriété —
            ils accordent simplement à Au fil des semis le droit de les
            afficher publiquement tant que leur compte est actif.
          </p>

          <h2>Données personnelles</h2>
          <p>
            Le traitement de tes données est décrit dans notre{' '}
            <a href="/confidentialite" className="text-tomato">
              politique de confidentialité
            </a>
            .
          </p>

          <h2>Loi applicable</h2>
          <p>
            Le présent site est soumis au droit belge. Tout litige relatif à
            son utilisation relève des tribunaux compétents.
          </p>
        </div>
      </Container>
    </article>
  )
}
