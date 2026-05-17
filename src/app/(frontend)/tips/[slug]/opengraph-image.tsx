import { ImageResponse } from 'next/og'

import { getPayloadClient } from '@/lib/payload'
import { TIP_CATEGORY_LABEL, type TipCategory } from '@/lib/tips'

export const runtime = 'nodejs'
export const alt = 'Au fil des semis — Tips & conseils'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const COLORS = {
  greenDeep: '#2D4A3E',
  cream: '#F5F1E8',
  tomato: '#C84B31',
  ink: '#1F2A24',
  inkSoft: '#5C6660',
  greenSage: '#7A8B6F',
}

async function getTip(slug: string) {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'tips',
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } },
        ],
      },
      limit: 1,
      depth: 0,
    })
    return docs[0] ?? null
  } catch {
    return null
  }
}

export default async function TipOgImage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params
  const tip = await getTip(slug)
  const title = tip?.title ?? 'Tip'
  const excerpt = (tip as { excerpt?: string | null })?.excerpt ?? ''
  const category = (tip as { category?: TipCategory | null })?.category
  const categoryLabel = category ? TIP_CATEGORY_LABEL[category] : 'Tips & conseils'

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: COLORS.cream,
          padding: '70px 90px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            color: COLORS.greenSage,
            fontSize: 24,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontFamily: 'sans-serif',
          }}
        >
          <span
            style={{
              width: 36,
              height: 1,
              background: COLORS.greenSage,
              display: 'block',
            }}
          />
          Au fil des semis · {categoryLabel}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            paddingTop: 30,
          }}
        >
          <h1
            style={{
              fontSize: title.length > 60 ? 84 : 104,
              color: COLORS.greenDeep,
              lineHeight: 1.05,
              margin: 0,
              fontWeight: 500,
              maxWidth: '95%',
            }}
          >
            {title}
          </h1>
          {excerpt ? (
            <p
              style={{
                fontSize: 30,
                color: COLORS.inkSoft,
                fontStyle: 'italic',
                margin: '32px 0 0 0',
                maxWidth: '90%',
                lineHeight: 1.35,
              }}
            >
              {excerpt.length > 180 ? excerpt.slice(0, 177) + '…' : excerpt}
            </p>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: `1px solid ${COLORS.greenSage}`,
            paddingTop: 26,
            color: COLORS.ink,
            fontSize: 28,
            fontFamily: 'sans-serif',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ color: COLORS.tomato, fontWeight: 600 }}>Tip</span>
            <span>au potager</span>
          </span>
          <span style={{ color: COLORS.greenSage, fontStyle: 'italic' }}>
            aufildessemis.be
          </span>
        </div>
      </div>
    ),
    size,
  )
}
