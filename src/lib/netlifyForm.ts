import { currencyOptions, serviceOptions, specializationOptions } from './leadRules.ts'
import type { PhotographerRecord } from './photographerRecord.ts'

const FORM_NAME = 'photographer-application'
const labels = [...serviceOptions, ...specializationOptions]

export async function submitPhotographerForm(
  photographer: PhotographerRecord,
  origin: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const site = origin.trim().replace(/\/$/, '') || 'https://tripframe.netlify.app'
  const specialties = photographer.specialties
    .map((value) => labels.find((option) => option.value === value)?.label ?? value)
    .join(', ')
  const params = new URLSearchParams({
    'form-name': FORM_NAME,
    'bot-field': '',
    subject: `New Tripframe photographer application: ${clip(photographer.name, 80)}`,
    name: clip(photographer.name, 80),
    email: clip(photographer.email, 120),
    phone: clip(photographer.phone, 40),
    location: clip(photographer.location, 120),
    'working-areas': clip(photographer.workingAreas, 300),
    specialties: clip(specialties, 200),
    'hourly-rate': clip(rateLine(photographer.hourlyRateCents, photographer.currency), 40),
    availability: clip(photographer.availability, 300),
    experience: clip(photographer.experience, 300),
    equipment: clip(photographer.equipment, 400),
    portfolio: clip(photographer.portfolioUrls.join('\n'), 1000),
  })

  try {
    const response = await fetch(`${site}/forms.html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    if (!response.ok) {
      return {
        ok: false,
        error: `Netlify Forms returned ${response.status}. Publish this deploy so the photographer-application form is detected, then try again.`,
      }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Netlify Forms could not be reached. Publish this deploy, then try again.' }
  }
}

function rateLine(cents: string, currency: string): string {
  const amount = Number(cents)
  if (!Number.isFinite(amount) || amount <= 0 || !currencyOptions.some((option) => option.value === currency)) {
    return 'Not provided'
  }
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount / 100)
}

function clip(value: string, max: number): string {
  const text = value.trim()
  return text.length <= max ? text : text.slice(0, max)
}
