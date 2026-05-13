import { Container } from '@/components/Container'

export const metadata = {
  title: 'Contact',
}

export default function ContactPage() {
  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <h1 className="font-serif text-5xl text-green-deep md:text-7xl">
          Une question, une idée, un coup de main&nbsp;?
        </h1>
        <p className="mt-4 font-serif text-xl italic text-ink-soft">
          Écris-nous, on lit tout.
        </p>
        <p className="mt-8 max-w-prose text-lg leading-relaxed text-ink-soft">
          Écris-nous à{' '}
          <a
            href="mailto:contact@aufildessemis.be"
            className="text-tomato underline underline-offset-4"
          >
            contact@aufildessemis.be
          </a>
          . On lit tout — réponse en quelques jours.
        </p>
      </Container>
    </section>
  )
}
