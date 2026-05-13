import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { NewTopicForm } from './NewTopicForm'
import { Container } from '@/components/Container'
import { getSession } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

type Params = { category: string }

async function getCategory(slug: string) {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'forum-categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    return docs[0] ?? null
  } catch {
    return null
  }
}

export const metadata = {
  title: 'Nouveau sujet — Forum',
}

export default async function NewTopicPage({
  params,
}: {
  params: Promise<Params>
}) {
  const session = await getSession()
  if (!session) redirect('/mon-potager/connexion')

  const { category: slug } = await params
  const cat = await getCategory(slug)
  if (!cat) notFound()

  return (
    <section className="py-12">
      <Container className="max-w-3xl">
        <Link
          href={`/forum/${slug}`}
          className="text-sm uppercase tracking-[0.14em] text-ink-soft hover:text-tomato"
        >
          ← {cat.name}
        </Link>
        <h1 className="mt-6 font-serif text-4xl text-green-deep md:text-5xl">
          Nouveau sujet
        </h1>
        <p className="mt-3 font-serif text-lg italic text-ink-soft">
          Dans <strong className="font-medium not-italic">{cat.name}</strong>{' '}
          — pose ta question, partage ton retour.
        </p>

        <div className="mt-10">
          <NewTopicForm categorySlug={slug} />
        </div>
      </Container>
    </section>
  )
}
