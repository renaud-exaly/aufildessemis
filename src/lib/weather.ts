/**
 * Petit wrapper Open-Meteo pour alerter du gel à venir.
 * Open-Meteo est gratuit et sans clé API.
 *
 * Par défaut : Bruxelles. À terme, on pourra stocker la lat/lng de chaque
 * user dans `users.location` et personnaliser.
 */

export type FrostNight = {
  date: string
  minTemp: number
  label: string
}

const BRUSSELS = { lat: 50.85, lng: 4.35 }
const FROST_THRESHOLD = 2 // °C — risque de gel matinal en dessous.

/**
 * Renvoie les prochaines nuits dont la min descend ≤ FROST_THRESHOLD.
 * Cache 1h côté Next (revalidate: 3600).
 */
export async function getFrostForecast(
  lat: number = BRUSSELS.lat,
  lng: number = BRUSSELS.lng,
): Promise<FrostNight[]> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('daily', 'temperature_2m_min')
  url.searchParams.set('timezone', 'Europe/Brussels')
  url.searchParams.set('forecast_days', '4')

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = (await res.json()) as {
      daily?: { time?: string[]; temperature_2m_min?: number[] }
    }
    const days = data.daily?.time ?? []
    const mins = data.daily?.temperature_2m_min ?? []

    const out: FrostNight[] = []
    for (let i = 0; i < days.length; i++) {
      const minTemp = mins[i]
      if (typeof minTemp !== 'number') continue
      if (minTemp > FROST_THRESHOLD) continue
      const date = days[i]
      const label = new Date(date).toLocaleDateString('fr-BE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
      out.push({ date, minTemp, label })
    }
    return out
  } catch {
    return []
  }
}
