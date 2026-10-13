export const serviceOptions = [
  { value: 'mobile', label: 'Mobile Photography' },
  { value: 'professional', label: 'Professional Photography' },
  { value: 'drone', label: 'Drone Photography' },
  { value: 'hotels', label: 'Hotels & Resorts' },
] as const

export const specializationOptions = [
  ...serviceOptions,
  { value: 'multiple', label: 'Multiple services' },
] as const

export type ServiceTier = (typeof serviceOptions)[number]['value']
export type Specialization = (typeof specializationOptions)[number]['value']

export type TravelerLead = {
  name: string
  email: string
  destination: string
  service: ServiceTier
}

export type PhotographerLead = {
  name: string
  email: string
  location: string
  specialization: Specialization
  portfolioUrl: string | null
}

export type FieldErrors = Record<string, string>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
const NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function collapse(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function checkName(value: string): { error?: string; value: string } {
  const name = collapse(value)
  if (name.length < 2) return { error: 'Enter your name.', value: name }
  if (name.length > 80) return { error: 'Use 80 characters or fewer.', value: name }
  if (!NAME.test(name)) return { error: 'Use letters, spaces, hyphens, or apostrophes.', value: name }
  return { value: name }
}

function checkEmail(value: string): { error?: string; value: string } {
  const email = collapse(value).toLowerCase()
  if (!email) return { error: 'Enter your email.', value: email }
  if (email.length > 120 || !EMAIL.test(email)) return { error: 'Enter a valid email address.', value: email }
  return { value: email }
}

function checkPlace(value: string, emptyMessage: string): { error?: string; value: string } {
  const place = collapse(value)
  if (place.length < 2) return { error: emptyMessage, value: place }
  if (place.length > 120) return { error: 'Use 120 characters or fewer.', value: place }
  if (/https?:|www\.|<|>/i.test(place)) return { error: 'Enter a place, not a link.', value: place }
  return { value: place }
}

export function normalizePortfolio(value: string): { error?: string; value: string | null } {
  const raw = value.trim()
  if (!raw) return { value: null }
  if (raw.length > 300) return { error: 'That link is too long.', value: null }

  if (raw.startsWith('@')) {
    const handle = raw.slice(1)
    if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
      return { error: 'Enter a valid Instagram handle or link.', value: null }
    }
    return { value: `https://instagram.com/${handle}` }
  }

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { error: 'Enter a valid link.', value: null }
    }
    if (!url.hostname.includes('.')) return { error: 'Enter a valid link.', value: null }
    const normalized = url.toString()
    if (normalized.length > 300) return { error: 'That link is too long.', value: null }
    return { value: normalized }
  } catch {
    return { error: 'Enter a valid portfolio or Instagram link.', value: null }
  }
}

function isService(value: string): value is ServiceTier {
  return serviceOptions.some((option) => option.value === value)
}

function isSpecialization(value: string): value is Specialization {
  return specializationOptions.some((option) => option.value === value)
}

export function validateTraveler(input: {
  name: string
  email: string
  destination: string
  service: string
}): { ok: true; value: TravelerLead } | { ok: false; fields: FieldErrors } {
  const fields: FieldErrors = {}
  const name = checkName(input.name)
  const email = checkEmail(input.email)
  const destination = checkPlace(input.destination, 'Enter a destination.')
  if (name.error) fields.name = name.error
  if (email.error) fields.email = email.error
  if (destination.error) fields.destination = destination.error
  if (!isService(input.service)) fields.service = 'Select a photography service.'
  if (Object.keys(fields).length > 0 || !isService(input.service)) return { ok: false, fields }
  return {
    ok: true,
    value: {
      name: name.value,
      email: email.value,
      destination: destination.value,
      service: input.service,
    },
  }
}

export function validatePhotographer(input: {
  name: string
  email: string
  location: string
  specialization: string
  portfolio: string
}): { ok: true; value: PhotographerLead } | { ok: false; fields: FieldErrors } {
  const fields: FieldErrors = {}
  const name = checkName(input.name)
  const email = checkEmail(input.email)
  const location = checkPlace(input.location, 'Enter your location.')
  const portfolio = normalizePortfolio(input.portfolio)
  if (name.error) fields.name = name.error
  if (email.error) fields.email = email.error
  if (location.error) fields.location = location.error
  if (!isSpecialization(input.specialization)) fields.specialization = 'Select a specialization.'
  if (portfolio.error) fields.portfolio = portfolio.error
  if (Object.keys(fields).length > 0 || !isSpecialization(input.specialization)) {
    return { ok: false, fields }
  }
  return {
    ok: true,
    value: {
      name: name.value,
      email: email.value,
      location: location.value,
      specialization: input.specialization,
      portfolioUrl: portfolio.value,
    },
  }
}

export function readTravelerBody(body: unknown) {
  const record = isRecord(body) ? body : {}
  return validateTraveler({
    name: asString(record.name),
    email: asString(record.email),
    destination: asString(record.destination),
    service: asString(record.service),
  })
}

export function readPhotographerBody(body: unknown) {
  const record = isRecord(body) ? body : {}
  return validatePhotographer({
    name: asString(record.name),
    email: asString(record.email),
    location: asString(record.location),
    specialization: asString(record.specialization),
    portfolio: asString(record.portfolio),
  })
}
