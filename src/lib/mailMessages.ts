import { serviceOptions } from './leadRules.ts'

export const emailKinds = ['confirmation', 'admin_notice', 'approved', 'rejected'] as const

export type EmailKind = (typeof emailKinds)[number]
export type EmailDeliveryStatus = 'pending' | 'sending' | 'sent' | 'failed'

export type EmailDelivery = {
  kind: EmailKind
  recipient: string
  status: EmailDeliveryStatus
  attempts: number
  lastError: string
  sentAt: string
}

export type DnsRecord = {
  record: string
  name: string
  type: string
  value: string
  status: string
}

export type EmailSetup = {
  configured: boolean
  from: string
  adminEmail: string
  domain: string
  domainStatus: 'unconfigured' | 'verified' | 'pending' | 'missing' | 'failed' | 'unknown'
  detail: string
  records: DnsRecord[]
}

export type MailProfile = {
  name: string
  email: string
  phone: string
  location: string
  specialties: string[]
  hourlyRateCents: string
  currency: string
  portfolioUrls: string[]
}

export type OutboundMail = {
  to: string
  subject: string
  text: string
  html: string
}

export type MailConfig = {
  apiKey: string
  from: string
  adminEmail: string
  siteUrl: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
const MAX_ATTEMPTS = 5

export function mailConfigFrom(env: {
  RESEND_API_KEY?: string
  EMAIL_FROM?: string
  ADMIN_EMAIL?: string
  URL?: string
  DEPLOY_PRIME_URL?: string
}): MailConfig {
  const site = (env.URL || env.DEPLOY_PRIME_URL || 'https://tripframe.netlify.app').trim().replace(/\/$/, '')
  return {
    apiKey: env.RESEND_API_KEY?.trim() ?? '',
    from: env.EMAIL_FROM?.trim() ?? '',
    adminEmail: env.ADMIN_EMAIL?.trim() ?? '',
    siteUrl: site || 'https://tripframe.netlify.app',
  }
}

export function isEmailKind(value: string): value is EmailKind {
  return emailKinds.some((kind) => kind === value)
}

export function parseMailbox(value: string): { email: string; domain: string } | null {
  const trimmed = value.trim()
  const wrapped = trimmed.match(/<([^<>]+)>\s*$/)
  const email = (wrapped?.[1] ?? trimmed).trim().toLowerCase()
  if (!EMAIL.test(email) || email.length > 200) return null
  const domain = email.split('@')[1] ?? ''
  if (!domain || domain.includes(' ')) return null
  return { email, domain }
}

export function requiredEmailKinds(status: string): EmailKind[] {
  const kinds: EmailKind[] = ['confirmation', 'admin_notice']
  if (status === 'rejected') kinds.push('rejected')
  if (status === 'approved' || status === 'suspended' || status === 'deactivated') kinds.push('approved')
  return kinds
}

export function emailNeedsAttention(status: string, emails: { kind: string; status: string }[]): boolean {
  return requiredEmailKinds(status).some((kind) => {
    const row = emails.find((email) => email.kind === kind)
    return !row || row.status === 'failed' || row.status === 'pending'
  })
}

export function emailKindLabel(kind: string): string {
  if (kind === 'confirmation') return 'Confirmation'
  if (kind === 'admin_notice') return 'Admin notice'
  if (kind === 'approved') return 'Approval'
  if (kind === 'rejected') return 'Rejection'
  return kind
}

export function messageFor(
  kind: EmailKind,
  profile: MailProfile,
  config: Pick<MailConfig, 'adminEmail' | 'siteUrl'>,
): { ok: true; mail: OutboundMail } | { ok: false; error: string } {
  const name = collapse(profile.name) || 'there'
  if (kind === 'admin_notice') {
    const admin = parseMailbox(config.adminEmail)
    if (!admin) return { ok: false, error: 'ADMIN_EMAIL is missing or invalid, so the admin notice cannot be sent.' }
    const lines = [
      `${name} applied to photograph with Tripframe and is pending review.`,
      '',
      `Email: ${profile.email}`,
      `WhatsApp: ${profile.phone || 'Not provided'}`,
      `Location: ${profile.location || 'Not provided'}`,
      `Specialties: ${specialtyLine(profile.specialties)}`,
      `Hourly rate: ${rateLine(profile.hourlyRateCents, profile.currency)}`,
      'Portfolio:',
      ...(profile.portfolioUrls.length > 0 ? profile.portfolioUrls : ['Not provided']),
      '',
      `Review it at ${config.siteUrl}/admin`,
    ]
    return {
      ok: true,
      mail: {
        to: admin.email,
        subject: `New photographer application: ${name}`,
        text: lines.join('\n'),
        html: paragraphs(lines),
      },
    }
  }

  const photographer = parseMailbox(profile.email)
  if (!photographer) return { ok: false, error: 'The photographer email address is invalid.' }

  if (kind === 'confirmation') {
    const lines = [
      `Hello ${name},`,
      '',
      `We received your photographer application${profile.location ? ` for ${profile.location}` : ''}. It is saved as pending.`,
      '',
      'We will email you when it has been reviewed. This is not a booking, and the Tripframe apps are still being built.',
      '',
      'If you did not apply, you can ignore this message or write to hello@tripframe.com.',
      '',
      'Tripframe',
      config.siteUrl,
    ]
    return { ok: true, mail: { to: photographer.email, subject: 'We received your Tripframe application', text: lines.join('\n'), html: paragraphs(lines) } }
  }

  if (kind === 'approved') {
    const lines = [
      `Hello ${name},`,
      '',
      'Your Tripframe photographer application has been approved.',
      '',
      'We will contact you as the photographer network opens. This does not assign a trip yet. Travelers will find photographers in the Tripframe apps, which are still being built.',
      '',
      'Tripframe',
      config.siteUrl,
    ]
    return { ok: true, mail: { to: photographer.email, subject: 'Your Tripframe application was approved', text: lines.join('\n'), html: paragraphs(lines) } }
  }

  const lines = [
    `Hello ${name},`,
    '',
    'Thank you for applying to photograph with Tripframe. We are not able to approve your application right now.',
    '',
    'If you think this was a mistake, write to hello@tripframe.com.',
    '',
    'Tripframe',
    config.siteUrl,
  ]
  return { ok: true, mail: { to: photographer.email, subject: 'An update on your Tripframe application', text: lines.join('\n'), html: paragraphs(lines) } }
}

export function replaceIdempotencyKey(status: number, errorName: string): boolean {
  if (status === 0 || status >= 500) return false
  if (status === 409 && (errorName === 'concurrent_idempotent_requests' || errorName === 'invalid_idempotent_request')) return false
  return true
}

export { MAX_ATTEMPTS }

function collapse(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function specialtyLine(values: string[]): string {
  if (values.length === 0) return 'Not provided'
  return values.map((value) => serviceOptions.find((option) => option.value === value)?.label ?? value).join(', ')
}

function rateLine(cents: string, currency: string): string {
  const amount = Number(cents)
  if (!Number.isFinite(amount) || amount <= 0) return 'Not provided'
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency}`
  }
}

function paragraphs(lines: string[]): string {
  const blocks: string[] = []
  let buffer: string[] = []
  const flush = () => {
    if (buffer.length === 0) return
    blocks.push(`<p>${buffer.map(escapeHtml).join('<br>')}</p>`)
    buffer = []
  }
  for (const line of lines) {
    if (!line) flush()
    else buffer.push(line)
  }
  flush()
  return `<div>${blocks.join('')}</div>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
