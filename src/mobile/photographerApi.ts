export type PublicPhotographer = {
  id: string
  name: string
  location: string
  workingAreas: string
  specialties: string[]
  hourlyRateCents: number | null
  currency: string | null
  portfolioUrls: string[]
}

export async function fetchPhotographers(baseUrl: string, specialty?: string): Promise<PublicPhotographer[]> {
  const url = new URL('/api/photographers', baseUrl)
  if (specialty) url.searchParams.set('specialty', specialty)
  const body = await readJson(url)
  if (!Array.isArray(body.photographers)) throw new Error('The photographer list was incomplete.')
  return body.photographers.map(readPhotographer)
}

export async function fetchPhotographer(baseUrl: string, id: string): Promise<PublicPhotographer> {
  const body = await readJson(new URL(`/api/photographers/${encodeURIComponent(id)}`, baseUrl))
  return readPhotographer(body.photographer)
}

async function readJson(url: URL): Promise<Record<string, unknown>> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    const message = typeof body.error === 'string' ? body.error : `Request failed (${response.status}).`
    throw new PhotographerApiError(message, response.status)
  }
  return body
}

function readPhotographer(value: unknown): PublicPhotographer {
  if (!value || typeof value !== 'object') throw new Error('The photographer profile was incomplete.')
  const row = value as Record<string, unknown>
  const privateKeys = ['email', 'phone', 'equipment', 'experience', 'availability', 'status']
  if (privateKeys.some((key) => key in row)) throw new Error('The photographer profile included private applicant details.')
  if (typeof row.id !== 'string' || typeof row.name !== 'string' || typeof row.location !== 'string') {
    throw new Error('The photographer profile was incomplete.')
  }
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    workingAreas: typeof row.workingAreas === 'string' ? row.workingAreas : '',
    specialties: Array.isArray(row.specialties) ? row.specialties.filter((item): item is string => typeof item === 'string') : [],
    hourlyRateCents: typeof row.hourlyRateCents === 'number' ? row.hourlyRateCents : null,
    currency: typeof row.currency === 'string' ? row.currency : null,
    portfolioUrls: Array.isArray(row.portfolioUrls) ? row.portfolioUrls.filter((item): item is string => typeof item === 'string') : [],
  }
}

export class PhotographerApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'PhotographerApiError'
    this.status = status
  }
}
