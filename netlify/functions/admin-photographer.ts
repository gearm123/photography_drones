import type { Config } from '@netlify/functions'
import { attachEmails, deliverEmails, retryPhotographerEmails } from '../../src/lib/mailDelivery.ts'
import { mailConfigFrom } from '../../src/lib/mailMessages.ts'
import { readPhotographerBody } from '../../src/lib/leadRules.ts'
import { mapPhotographer } from '../../src/lib/photographerRecord.ts'
import { statusAfter } from '../../src/lib/photographerStatus.ts'
import { syncPublicProfile } from '../../src/lib/publicProfileSync.ts'
import { sessionIsValid } from './adminSession.ts'
import { database, errorText, json, readJson, saveFailed } from './leadHttp.ts'

type LeadRow = Record<string, unknown>

function photographerId(req: Request): number | null {
  const id = new URL(req.url).pathname.split('/').filter(Boolean).at(-1) ?? ''
  if (!/^\d{1,18}$/.test(id)) return null
  const value = Number(id)
  return Number.isSafeInteger(value) && value > 0 ? value : null
}

function firstRow(rows: LeadRow[] | LeadRow): LeadRow | undefined {
  return Array.isArray(rows) ? rows[0] : undefined
}

async function withEmails(row: LeadRow, mode: 'keep' | 'retry' | 'approved' | 'rejected') {
  const config = mailConfigFrom(process.env)
  try {
    await syncPublicProfile(row)
  } catch (error) {
    console.error(`public profile sync failed: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
  try {
    const emails =
      mode === 'retry'
        ? await retryPhotographerEmails(row, config)
        : mode === 'approved' || mode === 'rejected'
          ? await deliverEmails(row, [mode], config)
          : (await attachEmails([mapPhotographer(row)]))[0]?.emails ?? []
    return { ...mapPhotographer(row), emails }
  } catch (error) {
    console.error(`photographer email failed: ${error instanceof Error ? error.message : 'unknown error'}`)
    return mapPhotographer(row)
  }
}

function duplicateFields(rows: LeadRow[], email: string, phone: string) {
  const fields: Record<string, string> = {}
  if (rows.some((row) => String(row.email).toLowerCase() === email)) {
    fields.email = 'Another photographer already uses this email.'
  }
  if (rows.some((row) => row.phone === phone)) {
    fields.phone = 'Another photographer already uses this WhatsApp number.'
  }
  return Object.keys(fields).length > 0 ? fields : null
}

export default async function handler(req: Request): Promise<Response> {
  if (!sessionIsValid(req)) return json(401, { error: 'Sign in required.' })

  const id = photographerId(req)
  if (!id) return json(404, { error: 'Photographer not found.' })

  const parsed = await readJson(req, 'PATCH')
  if (!parsed.ok) return parsed.response

  const action = typeof parsed.body.action === 'string' ? parsed.body.action : ''

  try {
    const db = database()
    const found = await db.sql<LeadRow>`
      SELECT id, name, email, phone, location, equipment, experience, availability, working_areas,
        hourly_rate_cents, currency, specialties, specialization, portfolio_urls, portfolio_url, status, created_at
      FROM photographer_leads
      WHERE id = ${id}
      LIMIT 1
    `
    const current = firstRow(found)
    if (!current) return json(404, { error: 'Photographer not found.' })
    const currentStatus = typeof current.status === 'string' ? current.status : 'pending'

    if (action === 'retry-emails') return json(200, { photographer: await withEmails(current, 'retry') })

    if (action === 'edit') {
      const lead = readPhotographerBody(parsed.body)
      if (!lead.ok) return json(400, { error: 'Check the highlighted fields.', fields: lead.fields })

      const clashes = await db.sql<LeadRow>`
        SELECT email, phone
        FROM photographer_leads
        WHERE id <> ${id} AND (lower(email) = ${lead.value.email} OR phone = ${lead.value.phone})
        LIMIT 5
      `
      const fields = duplicateFields(Array.isArray(clashes) ? clashes : [], lead.value.email, lead.value.phone)
      if (fields) return json(409, { error: 'Those contact details are already in use.', fields })

      const updated = await db.sql<LeadRow>`
        UPDATE photographer_leads
        SET
          name = ${lead.value.name},
          email = ${lead.value.email},
          phone = ${lead.value.phone},
          location = ${lead.value.location},
          equipment = ${lead.value.equipment},
          experience = ${lead.value.experience},
          availability = ${lead.value.availability},
          working_areas = ${lead.value.workingAreas},
          hourly_rate_cents = ${lead.value.hourlyRateCents},
          currency = ${lead.value.currency},
          specialties = ${lead.value.specialties},
          specialization = ${lead.value.specialization},
          portfolio_urls = ${lead.value.portfolioUrls},
          portfolio_url = ${lead.value.portfolioUrl}
        WHERE id = ${id}
        RETURNING id, name, email, phone, location, equipment, experience, availability, working_areas,
          hourly_rate_cents, currency, specialties, specialization, portfolio_urls, portfolio_url, status, created_at
      `
      const row = firstRow(updated)
      if (!row) return json(404, { error: 'Photographer not found.' })
      return json(200, { photographer: await withEmails(row, 'keep') })
    }

    const next = statusAfter(action, currentStatus)
    if (!next) return json(409, { error: 'That status change is not available for this photographer.' })

    const updated = await db.sql<LeadRow>`
      UPDATE photographer_leads
      SET status = ${next}
      WHERE id = ${id} AND status = ${currentStatus}
      RETURNING id, name, email, phone, location, equipment, experience, availability, working_areas,
        hourly_rate_cents, currency, specialties, specialization, portfolio_urls, portfolio_url, status, created_at
    `
    const row = firstRow(updated)
    if (!row) return json(409, { error: 'That application changed. Refresh and try again.' })
    const decision = next === 'approved' || next === 'rejected' ? next : null
    return json(200, { photographer: await withEmails(row, decision ?? 'keep') })
  } catch (error) {
    const text = errorText(error)
    if (text.includes('23505') || text.toLowerCase().includes('duplicate key')) {
      const fields: Record<string, string> = {}
      if (text.includes('email') || !text.includes('phone')) {
        fields.email = 'Another photographer already uses this email.'
      }
      if (text.includes('phone') || !text.includes('email')) {
        fields.phone = 'Another photographer already uses this WhatsApp number.'
      }
      return json(409, { error: 'Those contact details are already in use.', fields })
    }
    return saveFailed('photographer profile', error)
  }
}

export const config: Config = {
  path: '/api/admin/photographers/:id',
  method: 'PATCH',
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: 'ip',
  },
}
