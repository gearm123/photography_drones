import type { Config } from '@netlify/functions'
import { sessionCookie } from './adminSession.ts'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { 'cache-control': 'no-store' } })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'set-cookie': sessionCookie('', req, 0),
    },
  })
}

export const config: Config = {
  path: '/api/admin/logout',
  method: 'POST',
}
