import { ImageResponse } from 'next/og'

import { getMonthData } from '@/lib/calendar'
import { monthLabel, slugToMonth } from '@/lib/months'

export const runtime = 'nodejs'
export const alt = 'Au fil des semis — calendrier du potager'
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

export default async function MonthOgImage({
  params,
}: {
  params: { mois: string }
}) {
  const { mois } = params
  const month = slugToMonth(mois)
  const label = month ? monthLabel(month) : '—'
  let count = 0
  if (month) {
    try {
      const data = await getMonthData(month)
      count = data.bucket.count
    } catch {
      count = 0
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: COLORS.greenDeep,
          padding: '70px 90px',
          color: COLORS.cream,
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            color: COLORS.cream,
            opacity: 0.7,
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
              background: COLORS.cream,
              opacity: 0.7,
              display: 'block',
            }}
          />
          Au fil des semis
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
          <p
            style={{
              fontSize: 32,
              color: COLORS.cream,
              opacity: 0.75,
              fontStyle: 'italic',
              margin: 0,
            }}
          >
            Que semer
          </p>
          <h1
            style={{
              fontSize: 152,
              color: COLORS.cream,
              lineHeight: 1.02,
              margin: '8px 0 0 0',
              fontWeight: 500,
            }}
          >
            en {label.toLowerCase()}
          </h1>
          <p
            style={{
              fontSize: 44,
              color: COLORS.cream,
              opacity: 0.85,
              fontStyle: 'italic',
              margin: '30px 0 0 0',
            }}
          >
            sous climat belge
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: `1px solid ${COLORS.cream}`,
            paddingTop: 26,
            fontSize: 28,
            fontFamily: 'sans-serif',
            opacity: 0.9,
          }}
        >
          {count > 0 ? (
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ color: '#FFB7A1', fontWeight: 700 }}>{count}</span>
              <span>{count > 1 ? 'plantes à semer' : 'plante à semer'}</span>
            </span>
          ) : (
            <span style={{ fontStyle: 'italic' }}>Pause au potager</span>
          )}
          <span style={{ fontStyle: 'italic', opacity: 0.7 }}>
            aufildessemis.be
          </span>
        </div>
      </div>
    ),
    size,
  )
}
