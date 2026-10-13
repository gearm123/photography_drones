import type { Config } from '@netlify/functions'
import { readTravelerBody } from '../../src/lib/leadRules.ts'
import { checkSpam, database, json, readJson, saveFailed } from './leadHttp.ts'

export default async function handler(req: Request): Promise<Response> {
  const parsed = await readJson(req)
  if (!parsed.ok) return parsed.response

  const spam = checkSpam(parsed.body)
  if (spam.action === 'discard') return json(200, { ok: true })
  if (spam.action === 'reject') return spam.response

  const lead = readTravelerBody(parsed.body)
  if (!lead.ok) return json(400, { error: 'Check the highlighted fields.', fields: lead.fields })

  try {
    const db = database()
    await db.sql`
      INSERT INTO traveler_leads (name, email, destination, service_tier)
      VALUES (${lead.value.name}, ${lead.value.email}, ${lead.value.destination}, ${lead.value.service})
    `
    return json(200, { ok: true })
  } catch (error) {
    return saveFailed('traveler lead', error)
  }
}

export const config: Config = {
  path: '/api/traveler-leads',
  method: 'POST',
  rateLimit: {
    windowLimit: 8,
    windowSize: 60,
    aggregateBy: 'ip',
  },
}
