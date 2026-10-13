import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE = 'tripframe_admin'
const SESSION_MS = 7 * 24 * 60 * 60 * 1000
const MIN_PASSWORD = 8

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() ?? ''
}

export function adminIsConfigured(): boolean {
  return adminPassword().length >= MIN_PASSWORD
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

export function passwordsMatch(input: string): boolean {
  if (!adminIsConfigured()) return false
  return timingSafeEqual(digest(input), digest(adminPassword()))
}

function sign(payload: string): string {
  return createHmac('sha256', adminPassword()).update(payload).digest('base64url')
}

export function createSessionToken(): string {
  const payload = String(Date.now() + SESSION_MS)
  return `${payload}.${sign(payload)}`
}

export function sessionIsValid(req: Request): boolean {
  if (!adminIsConfigured()) return false
  const header = req.headers.get('cookie') ?? ''
  const pair = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))
  if (!pair) return false

  const token = decodeURIComponent(pair.slice(COOKIE.length + 1))
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return false
  const payload = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  const expected = sign(payload)
  const actualBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) return false

  const expiresAt = Number(payload)
  return Number.isFinite(expiresAt) && expiresAt > Date.now()
}

export function sessionCookie(token: string, req: Request, maxAge: number): string {
  const secure = new URL(req.url).protocol === 'https:'
  const parts = [`${COOKIE}=${token}`, 'HttpOnly', 'Path=/', 'SameSite=Lax', `Max-Age=${maxAge}`]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export const sessionMaxAge = Math.floor(SESSION_MS / 1000)
