import { isServiceTier, toPublicPhotographer, type PublicPhotographer } from './publicPhotographer.ts'

export type QueryDatabase = {
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => PromiseLike<unknown>
}

export async function handlePublicPhotographers(req: Request, db: QueryDatabase): Promise<Response> {
  if (req.method !== 'GET') return publicJson(405, { error: 'Method not allowed.' })

  const url = new URL(req.url)
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts[0] !== 'api' || parts[1] !== 'photographers' || parts.length > 3) {
    return publicJson(404, { error: 'Photographer not found.' })
  }

  try {
    if (parts.length === 3) return await onePhotographer(db, parts[2] ?? '')
    return await listPhotographers(db, url)
  } catch (error) {
    console.error(`public photographer read failed: ${error instanceof Error ? error.message : 'unknown error'}`)
    return publicJson(503, { error: 'Photographers are unavailable right now. Please try again shortly.' })
  }
}

async function listPhotographers(db: QueryDatabase, url: URL): Promise<Response> {
  const specialty = url.searchParams.get('specialty')?.trim() ?? ''
  if (specialty && !isServiceTier(specialty)) return publicJson(400, { error: 'Choose a known photography specialty.' })

  const limit = readLimit(url.searchParams.get('limit'))
  if (limit === null) return publicJson(400, { error: 'Limit must be a whole number from 1 to 100.' })

  const rows = specialty
    ? await db.sql`
        SELECT photographer_id, display_name, location, working_areas, specialties, hourly_rate_cents, currency, portfolio_urls, active
        FROM photographer_profiles
        WHERE active = true AND ${specialty} = ANY(specialties)
        ORDER BY published_at DESC NULLS LAST, photographer_id DESC
        LIMIT ${limit}
      `
    : await db.sql`
        SELECT photographer_id, display_name, location, working_areas, specialties, hourly_rate_cents, currency, portfolio_urls, active
        FROM photographer_profiles
        WHERE active = true
        ORDER BY published_at DESC NULLS LAST, photographer_id DESC
        LIMIT ${limit}
      `

  const photographers = asRows(rows).flatMap((row) => {
    const photographer = toPublicPhotographer(row)
    return photographer ? [photographer] : []
  })
  return publicJson(200, { photographers })
}

async function onePhotographer(db: QueryDatabase, rawId: string): Promise<Response> {
  if (!/^\d{1,18}$/.test(rawId)) return publicJson(404, { error: 'Photographer not found.' })
  const id = Number(rawId)
  if (!Number.isSafeInteger(id) || id <= 0) return publicJson(404, { error: 'Photographer not found.' })

  const rows = await db.sql`
    SELECT photographer_id, display_name, location, working_areas, specialties, hourly_rate_cents, currency, portfolio_urls, active
    FROM photographer_profiles
    WHERE photographer_id = ${id} AND active = true
    LIMIT 1
  `
  const photographer = asRows(rows).map((row) => toPublicPhotographer(row)).find((item): item is PublicPhotographer => item !== null)
  if (!photographer) return publicJson(404, { error: 'Photographer not found.' })
  return publicJson(200, { photographer })
}

function readLimit(value: string | null): number | null {
  if (value === null || value.trim() === '') return 50
  if (!/^\d{1,3}$/.test(value)) return null
  const limit = Number(value)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return null
  return limit
}

function asRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item))
}

export function publicJson(status: number, body: unknown): Response {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': 'public, max-age=60',
      'access-control-allow-origin': '*',
    },
  })
}
