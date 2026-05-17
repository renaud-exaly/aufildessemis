import { ImageResponse } from 'next/og'

import { formatSowingWindow } from '@/lib/months'
import { getPayloadClient } from '@/lib/payload'

export const runtime = 'nodejs'
export const alt = 'Au fil des semis'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Tokens DA — alignés avec globals.css
const COLORS = {
  greenDeep: '#2D4A3E',
  cream: '#F5F1E8',
  creamWarm: '#FAF5E8',
  tomato: '#C84B31',
  ink: '#1F2A24',
  inkSoft: '#5C6660',
  greenSage: '#7A8B6F',
}

async function getPlant(slug: string) {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'plants',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    return docs[0] ?? null
  } catch {
    return null
  }
}

export default async function PlantOgImage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params
  const plant = await getPlant(slug)
  const name = plant?.name ?? 'Plante'
  const latin = plant?.latinName ?? ''
  const start = plant?.sowingWindow?.startMonth
  const end = plant?.sowingWindow?.endMonth
  const window = start && end ? formatSowingWindow(start, end) : null

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
        {/* Bande supérieure : brand */}
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
          Au fil des semis
        </div>

        {/* Bloc central */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            paddingTop: 40,
          }}
        >
          <p
            style={{
              fontSize: 32,
              color: COLORS.inkSoft,
              fontStyle: 'italic',
              margin: 0,
            }}
          >
            Bibliothèque du potager
          </p>
          <h1
            style={{
              fontSize: 128,
              color: COLORS.greenDeep,
              lineHeight: 1.02,
              margin: '24px 0 0 0',
              fontWeight: 500,
            }}
          >
            {name}
          </h1>
          {latin ? (
            <p
              style={{
                fontSize: 36,
                color: COLORS.inkSoft,
                fontStyle: 'italic',
                margin: '20px 0 0 0',
              }}
            >
              {latin}
            </p>
          ) : null}
        </div>

        {/* Bande inférieure */}
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
          {window ? (
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ color: COLORS.tomato, fontWeight: 600 }}>
                Semer
              </span>
              <span>{window.toLowerCase()}</span>
            </span>
          ) : (
            <span>Fiche plante</span>
          )}
          <span style={{ color: COLORS.greenSage, fontStyle: 'italic' }}>
            Climat belge
          </span>
        </div>
      </div>
    ),
    size,
  )
}
