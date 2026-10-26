import type { Config } from '@netlify/functions'
import { attachEmails } from '../../src/lib/mailDelivery.ts'
import { mailConfigFrom, type EmailSetup } from '../../src/lib/mailMessages.ts'
import { mapPhotographer } from '../../src/lib/photographerRecord.ts'
import { inspectSendingDomain } from '../../src/lib/resendMail.ts'
import { sessionIsValid } from './adminSession.ts'
import { database, json, saveFailed } from './leadHttp.ts'

type LeadRow = Record<string, unknown>

function text(value: unknown): string {
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

function mapTraveler(row: LeadRow) {
  return {
    id: text(row.id),
    name: text(row.name),
    email: text(row.email),
    destination: text(row.destination),
    serviceTier: text(row.service_tier),
    createdAt: text(row.created_at),
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') return json(405, { error: 'Method not allowed.' })
  if (!sessionIsValid(req)) return json(401, { error: 'Sign in required.' })

  try {
    const db = database()
    const travelers = await db.sql<LeadRow>`
      SELECT id, name, email, destination, service_tier, created_at
      FROM traveler_leads
      ORDER BY created_at DESC
      LIMIT 500
    `
    const photographers = await db.sql<LeadRow>`
      SELECT
        id,
        name,
        email,
        phone,
        location,
        equipment,
        experience,
        availability,
        working_areas,
        hourly_rate_cents,
        currency,
        specialties,
        specialization,
        portfolio_urls,
        portfolio_url,
        status,
        created_at
      FROM photographer_leads
      ORDER BY created_at DESC
      LIMIT 500
    `
    const mapped = (Array.isArray(photographers) ? photographers : []).map(mapPhotographer)
    let withMail = mapped
    try {
      withMail = await attachEmails(mapped)
    } catch (error) {
      console.error(`photographer email list failed: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
    const email = await emailSetup()
    return json(200, {
      travelers: (Array.isArray(travelers) ? travelers : []).map(mapTraveler),
      photographers: withMail,
      email,
    })
  } catch (error) {
    return saveFailed('admin leads', error)
  }
}

async function emailSetup(): Promise<EmailSetup> {
  try {
    return await inspectSendingDomain(mailConfigFrom(process.env))
  } catch (error) {
    console.error(`email domain check failed: ${error instanceof Error ? error.message : 'unknown error'}`)
    return {
      configured: false,
      from: '',
      adminEmail: '',
      domain: '',
      domainStatus: 'unknown',
      detail: 'The email provider could not be checked. Applications are still saved.',
      records: [],
    }
  }
}

export const config: Config = {
  path: '/api/admin/leads',
  method: 'GET',
}
