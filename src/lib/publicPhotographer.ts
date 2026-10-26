import { serviceOptions, type ServiceTier } from './leadRules.ts'

export type PublicPhotographer = {
  id: string
  name: string
  location: string
  workingAreas: string
  specialties: ServiceTier[]
  hourlyRateCents: number | null
  currency: 'USD' | 'EUR' | 'GBP' | null
  portfolioUrls: string[]
}

const serviceValues = new Set<string>(serviceOptions.map((option) => option.value))
const currencies = new Set(['USD', 'EUR', 'GBP'])

export function isServiceTier(value: string): value is ServiceTier {
  return serviceValues.has(value)
}

export function profileVisibility(lead: {
  id: string
  name: string
  location: string
  workingAreas: string
  specialties: string[]
  hourlyRateCents: string
  currency: string
  portfolioUrls: string[]
  status: string
}): { publish: false } | { publish: true; active: boolean; profile: PublicPhotographer } {
  const kept = lead.status === 'approved' || lead.status === 'suspended' || lead.status === 'deactivated'
  if (!kept) return { publish: false }

  const name = lead.name.trim()
  const location = lead.location.trim()
  const workingAreas = lead.workingAreas.trim() || location
  const specialties = lead.specialties.filter(isServiceTier).slice(0, 4)
  if (name.length < 2 || location.length < 2 || workingAreas.length < 2 || specialties.length === 0) {
    return { publish: false }
  }

  const cents = Number(lead.hourlyRateCents)
  const hourlyRateCents = Number.isInteger(cents) && cents >= 100 && cents <= 1_000_000 ? cents : null
  const currency = currencies.has(lead.currency) ? (lead.currency as 'USD' | 'EUR' | 'GBP') : null

  return {
    publish: true,
    active: lead.status === 'approved',
    profile: {
      id: lead.id,
      name,
      location,
      workingAreas,
      specialties,
      hourlyRateCents: currency ? hourlyRateCents : null,
      currency: hourlyRateCents ? currency : null,
      portfolioUrls: lead.portfolioUrls.filter((url) => url.startsWith('https://') || url.startsWith('http://')).slice(0, 3),
    },
  }
}

export function toPublicPhotographer(row: Record<string, unknown>): PublicPhotographer | null {
  if (row.active === false) return null
  const specialties = list(row.specialties).filter(isServiceTier).slice(0, 4)
  const name = text(row.display_name)
  const location = text(row.location)
  const workingAreas = text(row.working_areas)
  if (!name || !location || !workingAreas || specialties.length === 0) return null
  const cents = integer(row.hourly_rate_cents)
  const currency = text(row.currency)
  const validCurrency = currencies.has(currency) ? (currency as 'USD' | 'EUR' | 'GBP') : null
  return {
    id: text(row.photographer_id),
    name,
    location,
    workingAreas,
    specialties,
    hourlyRateCents: validCurrency ? cents : null,
    currency: cents ? validCurrency : null,
    portfolioUrls: list(row.portfolio_urls).filter((url) => url.startsWith('https://') || url.startsWith('http://')).slice(0, 3),
  }
}

function text(value: unknown): string {
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

function integer(value: unknown): number | null {
  if (typeof value === 'bigint') value = Number(value)
  if (typeof value === 'string' && value.trim()) value = Number(value)
  if (typeof value !== 'number' || !Number.isInteger(value)) return null
  if (value < 100 || value > 1_000_000) return null
  return value
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean)
  return []
}
