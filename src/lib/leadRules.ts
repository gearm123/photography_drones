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

export const currencyOptions = [
  { value: 'ILS', label: 'ILS' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
] as const

export type Currency = (typeof currencyOptions)[number]['value']

export type PhotographerLead = {
  name: string
  email: string
  phone: string
  location: string
  equipment: string | null
  experience: string | null
  availability: string | null
  workingAreas: string
  hourlyRateCents: number | null
  currency: Currency | null
  specialties: ServiceTier[]
  specialization: Specialization
  portfolioUrls: string[]
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

export function normalizePhone(value: string): { error?: string; value: string } {
  let compact = value.trim().replace(/[\s().-]/g, '')
  if (compact.startsWith('00')) compact = `+${compact.slice(2)}`
  if (/^0[2-9]\d{7,8}$/.test(compact)) compact = `+972${compact.slice(1)}`
  if (/^5\d{8}$/.test(compact)) compact = `+972${compact}`
  if (/^972\d{8,9}$/.test(compact)) compact = `+${compact}`
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return { value: compact }
  const loose = compact.replace(/[^\d+]/g, '')
  if (loose.length >= 9 && loose.length <= 16) return { value: loose }
  return { error: 'Enter a WhatsApp number, like +972 50 123 4567.', value: '' }
}

function checkRate(value: string): { cents: number | null } {
  const raw = value.trim()
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(raw)) return { cents: null }
  const [whole, fraction = ''] = raw.split('.')
  const cents = Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2))
  if (!Number.isSafeInteger(cents) || cents < 100 || cents > 1_000_000) return { cents: null }
  return { cents }
}

function isCurrency(value: string): value is Currency {
  return currencyOptions.some((option) => option.value === value)
}

function checkSpecialties(values: string[]): { error?: string; value: ServiceTier[] } {
  const unique = [...new Set(values.map((value) => value.trim()).filter(Boolean))]
  if (unique.length === 0) return { error: 'Select at least one specialty.', value: [] }
  if (!unique.every(isService)) return { error: 'Select a specialty from the list.', value: [] }
  return { value: unique }
}

function checkPortfolios(values: string[]): { value: string[] } {
  const urls: string[] = []
  for (const raw of values) {
    const trimmed = raw.trim()
    if (!trimmed || urls.length >= 3) continue
    const normalized = normalizePortfolio(trimmed)
    const saved = normalized.value ?? trimmed.replace(/[<>]/g, '').slice(0, 300)
    if (saved.length >= 2 && !urls.includes(saved)) urls.push(saved)
  }
  return { value: urls }
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

type PhotographerLegacy = {
  location?: string
  equipment?: string
  experience?: string
  availability?: string
  workingAreas?: string
  hourlyRate?: string
}

function clipText(value: string, max: number): string {
  return collapse(value).replace(/[<>]/g, '').slice(0, max)
}

function keepOptional(value: string, max: number): string | null {
  const text = clipText(value, max)
  return text.length >= 2 ? text : null
}

function checkCity(value: string): { error?: string; value: string } {
  const city = clipText(value, 120)
  if (city.length >= 2) return { value: city }
  return { error: 'Choose a city in Israel.', value: '' }
}

function checkWorkingAreas(value: string, location: string): { value: string } {
  return { value: keepOptional(value, 800) ?? location }
}

export function validatePhotographer(
  input: {
    name: string
    email: string
    phone: string
    location: string
    equipment: string
    experience: string
    availability: string
    workingAreas: string
    hourlyRate: string
    currency: string
    specialties: string[]
    portfolios: string[]
  },
  legacy: PhotographerLegacy = {},
): { ok: true; value: PhotographerLead } | { ok: false; fields: FieldErrors } {
  const fields: FieldErrors = {}
  const name = checkName(input.name)
  const email = checkEmail(input.email)
  const phone = normalizePhone(input.phone)
  const location = checkCity(input.location || legacy.location || '')
  const equipment = { value: keepOptional(input.equipment || legacy.equipment || '', 400) }
  const experience = { value: keepOptional(input.experience || legacy.experience || '', 300) }
  const availability = { value: keepOptional(input.availability || legacy.availability || '', 300) }
  const workingAreas = checkWorkingAreas(input.workingAreas || legacy.workingAreas || '', location.value)
  const rate = checkRate(input.hourlyRate || legacy.hourlyRate || '')
  const specialties = checkSpecialties(input.specialties)
  const portfolios = checkPortfolios(input.portfolios)
  const currency = rate.cents == null ? null : isCurrency(input.currency) ? input.currency : 'ILS'

  if (name.error) fields.name = name.error
  if (email.error) fields.email = email.error
  if (phone.error) fields.phone = phone.error
  if (location.error) fields.location = location.error
  if (specialties.error) fields.specialties = specialties.error

  if (Object.keys(fields).length > 0 || specialties.value.length === 0) {
    return { ok: false, fields }
  }

  const portfolioUrls = portfolios.value
  return {
    ok: true,
    value: {
      name: name.value,
      email: email.value,
      phone: phone.value,
      location: location.value,
      equipment: equipment.value,
      experience: experience.value,
      availability: availability.value,
      workingAreas: workingAreas.value,
      hourlyRateCents: rate.cents,
      currency,
      specialties: specialties.value,
      specialization: specialties.value.length === 1 ? specialties.value[0] : 'multiple',
      portfolioUrls,
      portfolioUrl: portfolioUrls[0] ?? null,
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

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

export function readPhotographerBody(body: unknown) {
  const record = isRecord(body) ? body : {}
  const portfolios = Array.isArray(record.portfolios)
    ? asStringList(record.portfolios)
    : [asString(record.portfolio), asString(record.portfolio2), asString(record.portfolio3)]
  const hourlyRate =
    typeof record.hourlyRate === 'number' && Number.isFinite(record.hourlyRate)
      ? String(record.hourlyRate)
      : asString(record.hourlyRate)
  return validatePhotographer({
    name: asString(record.name),
    email: asString(record.email),
    phone: asString(record.phone),
    location: asString(record.location),
    equipment: asString(record.equipment),
    experience: asString(record.experience),
    availability: asString(record.availability),
    workingAreas: asString(record.workingAreas),
    hourlyRate,
    currency: asString(record.currency),
    specialties: asStringList(record.specialties),
    portfolios,
  })
}
