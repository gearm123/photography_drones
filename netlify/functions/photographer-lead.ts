import type { Config } from '@netlify/functions'
import { deliverEmails } from '../../src/lib/mailDelivery.ts'
import { mailConfigFrom } from '../../src/lib/mailMessages.ts'
import { readPhotographerBody, type FieldErrors } from '../../src/lib/leadRules.ts'
import { checkSpam, database, errorText, json, readJson, saveFailed } from './leadHttp.ts'

type ExistingRow = { email: string; phone: string | null }
type LeadRow = Record<string, unknown>

function alreadyRegistered(rows: ExistingRow[], email: string, phone: string): FieldErrors | null {
  const emailTaken = rows.some((row) => row.email.toLowerCase() === email)
  const phoneTaken = rows.some((row) => row.phone === phone)
  if (!emailTaken && !phoneTaken) return null
  const fields: FieldErrors = {}
  if (emailTaken) fields.email = 'An application with this email is already saved.'
  if (phoneTaken) fields.phone = 'An application with this WhatsApp number is already saved.'
  return fields
}

export default async function handler(req: Request): Promise<Response> {
  const parsed = await readJson(req)
  if (!parsed.ok) return parsed.response

  const spam = checkSpam(parsed.body)
  if (spam.action === 'discard') return json(200, { ok: true })
  if (spam.action === 'reject') return spam.response

  const lead = readPhotographerBody(parsed.body)
  if (!lead.ok) return json(400, { error: 'Check the highlighted fields.', fields: lead.fields })

  try {
    const db = database()
    const existing = await db.sql<ExistingRow>`
      SELECT email, phone
      FROM photographer_leads
      WHERE lower(email) = ${lead.value.email} OR phone = ${lead.value.phone}
      LIMIT 5
    `
    const duplicate = alreadyRegistered(Array.isArray(existing) ? existing : [], lead.value.email, lead.value.phone)
    if (duplicate) return json(409, { error: 'This photographer is already registered.', fields: duplicate })

    const inserted = await db.sql<LeadRow>`
      INSERT INTO photographer_leads (
        name,
        email,
        location,
        specialization,
        portfolio_url,
        phone,
        equipment,
        experience,
        availability,
        working_areas,
        hourly_rate_cents,
        currency,
        specialties,
        portfolio_urls,
        status
      )
      VALUES (
        ${lead.value.name},
        ${lead.value.email},
        ${lead.value.location},
        ${lead.value.specialization},
        ${lead.value.portfolioUrl},
        ${lead.value.phone},
        ${lead.value.equipment},
        ${lead.value.experience},
        ${lead.value.availability},
        ${lead.value.workingAreas},
        ${lead.value.hourlyRateCents},
        ${lead.value.currency},
        ${lead.value.specialties},
        ${lead.value.portfolioUrls},
        'pending'
      )
      RETURNING id, name, email, phone, location, equipment, experience, availability, working_areas,
        hourly_rate_cents, currency, specialties, specialization, portfolio_urls, portfolio_url, status, created_at
    `
    const row = asRows(inserted)[0]
    let confirmation: 'sent' | 'failed' = 'failed'
    if (row) {
      try {
        const emails = await deliverEmails(row, ['confirmation', 'admin_notice'], mailConfigFrom(process.env))
        confirmation = emails.find((email) => email.kind === 'confirmation')?.status === 'sent' ? 'sent' : 'failed'
      } catch (error) {
        console.error(`photographer email failed: ${error instanceof Error ? error.message : 'unknown error'}`)
      }
    }
    return json(200, { ok: true, status: 'pending', confirmation })
  } catch (error) {
    const duplicate = duplicateFromError(error)
    if (duplicate) return json(409, { error: 'This photographer is already registered.', fields: duplicate })
    return saveFailed('photographer lead', error)
  }
}

function asRows(rows: LeadRow[] | LeadRow): LeadRow[] {
  return Array.isArray(rows) ? rows : []
}

function duplicateFromError(error: unknown): FieldErrors | null {
  const text = errorText(error)
  if (!text.includes('23505') && !text.toLowerCase().includes('duplicate key')) return null
  const email = text.includes('email')
  const phone = text.includes('phone')
  const fields: FieldErrors = {}
  if (email || !phone) fields.email = 'An application with this email is already saved.'
  if (phone || !email) fields.phone = 'An application with this WhatsApp number is already saved.'
  return fields
}

export const config: Config = {
  path: '/api/photographer-leads',
  method: 'POST',
  rateLimit: {
    windowLimit: 8,
    windowSize: 60,
    aggregateBy: 'ip',
  },
}
