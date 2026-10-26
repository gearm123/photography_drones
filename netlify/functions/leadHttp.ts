import { getDatabase } from '@netlify/database'

const MIN_FILL_MS = 800
const MAX_AGE_MS = 12 * 60 * 60 * 1000

export function json(status: number, body: unknown): Response {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function readJson(
  req: Request,
  method: string | string[] = 'POST',
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; response: Response }> {
  const allowed = Array.isArray(method) ? method : [method]
  if (!allowed.includes(req.method)) return { ok: false, response: json(405, { error: 'Method not allowed.' }) }

  const contentType = req.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return { ok: false, response: json(415, { error: 'Submit the form as JSON.' }) }
  }

  const raw = await req.text()
  if (raw.length > 12000) return { ok: false, response: json(413, { error: 'That submission is too large.' }) }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return { ok: false, response: json(400, { error: 'Invalid submission.' }) }
    return { ok: true, body: parsed }
  } catch {
    return { ok: false, response: json(400, { error: 'Invalid submission.' }) }
  }
}

export function checkSpam(body: Record<string, unknown>):
  | { action: 'accept' }
  | { action: 'discard' }
  | { action: 'reject'; response: Response } {
  const website = typeof body.hp_field === 'string' ? body.hp_field.trim() : ''
  if (website) return { action: 'discard' }

  const startedAt = typeof body.startedAt === 'number' ? body.startedAt : Number(body.startedAt)
  const elapsed = Date.now() - startedAt
  if (!Number.isFinite(startedAt) || elapsed < MIN_FILL_MS || elapsed > MAX_AGE_MS) {
    return {
      action: 'reject',
      response: json(400, { error: 'Please wait a moment and try again.' }),
    }
  }

  return { action: 'accept' }
}

export function database() {
  return getDatabase()
}

export function saveFailed(scope: string, error: unknown): Response {
  const message = error instanceof Error ? error.message : 'unknown error'
  console.error(`${scope} save failed: ${message}`)
  return json(503, { error: 'We could not save your request right now. Please try again shortly.' })
}

export function errorText(error: unknown): string {
  const parts: string[] = []
  let current: unknown = error
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (typeof current === 'object' && current) {
      if ('message' in current && typeof current.message === 'string') parts.push(current.message)
      if ('code' in current) parts.push(String(current.code))
      current = 'cause' in current ? current.cause : null
      continue
    }
    parts.push(String(current))
    break
  }
  return parts.join(' ')
}
