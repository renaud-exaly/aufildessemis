import { Container } from '@/components/Container'

export const metadata = {
  title: 'À propos',
}

export default function AProposPage() {
  return (
    <article className="py-20">
      <Container className="max-w-3xl">
        <h1 className="font-serif text-5xl text-green-deep md:text-7xl">
          Un carnet vivant, partagé.
        </h1>
        <p className="mt-4 font-serif text-xl italic text-ink-soft">
          Pour observer ce qui pousse.
        </p>

        <div className="prose prose-stone mt-12 max-w-prose leading-relaxed text-ink">
          <p>
            <em>Au fil des semis</em> est né d&apos;une envie simple&nbsp;:
            garder une trace de ce qui pousse, d&apos;une saison à l&apos;autre,
            et partager ce qu&apos;on apprend en route. Un peu comme un journal
            de bord — mais ouvert, parce que le jardin se vit mieux à
            plusieurs.
          </p>
          <p>
            Tu y trouves une bibliothèque de fiches plantes, un journal
            communautaire de semis en cours, des conseils glanés au fil des
            essais, et un calendrier adapté au climat belge.
          </p>
          <p>
            Le site est pensé pour les jardiniers amateurs, débutants ou
            confirmés. Pas d&apos;injonction, pas de jargon&nbsp;: juste un
            espace doux pour observer ce qui pousse.
          </p>
        </div>
      </Container>
    </article>
  )
}
