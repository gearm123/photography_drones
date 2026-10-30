export type PhotographerRecord = {
  id: string
  name: string
  email: string
  phone: string
  location: string
  equipment: string
  experience: string
  availability: string
  workingAreas: string
  hourlyRateCents: string
  currency: string
  specialties: string[]
  portfolioUrls: string[]
  status: string
  createdAt: string
}

type LeadRow = Record<string, unknown>

function text(value: unknown): string {
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

function textList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean)
  const raw = text(value)
  if (!raw) return []
  if (raw.startsWith('{') && raw.endsWith('}')) {
    return raw
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim().replace(/^"|"$/g, ''))
      .filter(Boolean)
  }
  return [raw]
}

export function mapPhotographer(row: LeadRow): PhotographerRecord {
  const portfolioUrls = textList(row.portfolio_urls)
  const portfolioUrl = text(row.portfolio_url)
  const specialties = textList(row.specialties)
  return {
    id: text(row.id),
    name: text(row.name),
    email: text(row.email),
    phone: text(row.phone),
    location: text(row.location),
    equipment: text(row.equipment),
    experience: text(row.experience),
    availability: text(row.availability),
    workingAreas: text(row.working_areas),
    hourlyRateCents: text(row.hourly_rate_cents),
    currency: text(row.currency),
    specialties: specialties.length > 0 ? specialties : textList(row.specialization),
    portfolioUrls: portfolioUrls.length > 0 ? portfolioUrls : portfolioUrl ? [portfolioUrl] : [],
    status: text(row.status) || 'pending',
    createdAt: text(row.created_at),
  }
}
