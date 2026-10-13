import type { Config } from '@netlify/functions'
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

function mapPhotographer(row: LeadRow) {
  return {
    id: text(row.id),
    name: text(row.name),
    email: text(row.email),
    location: text(row.location),
    specialization: text(row.specialization),
    portfolioUrl: text(row.portfolio_url),
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
      SELECT id, name, email, location, specialization, portfolio_url, created_at
      FROM photographer_leads
      ORDER BY created_at DESC
      LIMIT 500
    `
    return json(200, {
      travelers: travelers.map(mapTraveler),
      photographers: photographers.map(mapPhotographer),
    })
  } catch (error) {
    return saveFailed('admin leads', error)
  }
}

export const config: Config = {
  path: '/api/admin/leads',
  method: 'GET',
}
