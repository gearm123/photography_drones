import type { Config } from '@netlify/functions'
import {
  adminIsConfigured,
  createSessionToken,
  passwordsMatch,
  sessionCookie,
  sessionMaxAge,
} from './adminSession.ts'
import { json, readJson } from './leadHttp.ts'

export default async function handler(req: Request): Promise<Response> {
  const parsed = await readJson(req)
  if (!parsed.ok) return parsed.response

  if (!adminIsConfigured()) {
    return json(503, {
      error: 'Admin access is not configured. Set ADMIN_PASSWORD in the Netlify site environment.',
    })
  }

  const password = typeof parsed.body.password === 'string' ? parsed.body.password : ''
  if (!passwordsMatch(password)) {
    return json(401, { error: 'That password is not correct.' })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'set-cookie': sessionCookie(createSessionToken(), req, sessionMaxAge),
    },
  })
}

export const config: Config = {
  path: '/api/admin/login',
  method: 'POST',
  rateLimit: {
    windowLimit: 8,
    windowSize: 300,
    aggregateBy: 'ip',
  },
}
