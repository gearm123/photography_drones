import {
  parseMailbox,
  replaceIdempotencyKey,
  type DnsRecord,
  type EmailSetup,
  type MailConfig,
  type OutboundMail,
} from './mailMessages.ts'

const RESEND = 'https://api.resend.com'
const CACHE_MS = 60_000

type CacheEntry = { at: number; setup: EmailSetup }

let domainCache: { key: string; entry: CacheEntry } | null = null

export function emptyEmailSetup(config: MailConfig, detail: string): EmailSetup {
  const parsed = parseMailbox(config.from)
  return {
    configured: false,
    from: config.from,
    adminEmail: config.adminEmail,
    domain: parsed?.domain ?? '',
    domainStatus: 'unconfigured',
    detail,
    records: [],
  }
}

export async function inspectSendingDomain(config: MailConfig): Promise<EmailSetup> {
  const parsed = parseMailbox(config.from)
  if (!config.apiKey || !parsed) {
    return emptyEmailSetup(
      config,
      'Set RESEND_API_KEY and EMAIL_FROM. Applications are saved either way.',
    )
  }

  const adminNote = parseMailbox(config.adminEmail) ? '' : ' ADMIN_EMAIL is missing, so new-application notices cannot be sent.'

  if (parsed.domain === 'resend.dev') {
    return {
      configured: true,
      from: config.from,
      adminEmail: config.adminEmail,
      domain: parsed.domain,
      domainStatus: 'verified',
      detail: `Using Resend's test sender at ${parsed.email}. It only delivers to the inbox on the Resend account. Verify your own domain before production.${adminNote}`,
      records: [],
    }
  }

  const cacheKey = `${config.apiKey.slice(-6)}:${parsed.domain}`
  if (domainCache && domainCache.key === cacheKey && Date.now() - domainCache.entry.at < CACHE_MS) {
    return domainCache.entry.setup
  }

  const listed = await resendJson(config.apiKey, '/domains?limit=100')
  if (!listed.ok) {
    return {
      configured: true,
      from: config.from,
      adminEmail: config.adminEmail,
      domain: parsed.domain,
      domainStatus: 'unknown',
      detail: `Resend could not be reached (${listed.error}). Applications are still saved.${adminNote}`,
      records: [],
    }
  }

  const domains = Array.isArray(listed.body.data) ? listed.body.data : []
  const match = domains.find((domain) => stringField(domain, 'name').toLowerCase() === parsed.domain)
  if (!match || typeof match !== 'object') {
    const setup: EmailSetup = {
      configured: true,
      from: config.from,
      adminEmail: config.adminEmail,
      domain: parsed.domain,
      domainStatus: 'missing',
      detail: `Add ${parsed.domain} in Resend, then publish the SPF and DKIM records it shows.${adminNote}`,
      records: [],
    }
    remember(cacheKey, setup)
    return setup
  }

  const domainRecord = match as Record<string, unknown>
  const status = stringField(domainRecord, 'status')
  const id = stringField(domainRecord, 'id')
  let records = sendingRecords(domainRecord.records)
  if (records.length === 0 && id && status !== 'verified') {
    const single = await resendJson(config.apiKey, `/domains/${encodeURIComponent(id)}`)
    if (single.ok) records = sendingRecords(single.body.records)
  }

  const domainStatus = mapDomainStatus(status)
  const setup: EmailSetup = {
    configured: true,
    from: config.from,
    adminEmail: config.adminEmail,
    domain: parsed.domain,
    domainStatus,
    detail: domainDetail(parsed.domain, status, domainStatus) + adminNote,
    records: domainStatus === 'verified' ? [] : records,
  }
  remember(cacheKey, setup)
  return setup
}

export async function sendWithResend(
  config: MailConfig,
  mail: OutboundMail,
  idempotencyKey: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string; replaceKey: boolean }> {
  const from = parseMailbox(config.from)
  if (!config.apiKey || !from) {
    return { ok: false, error: 'Transactional email is not configured.', replaceKey: true }
  }
  if (from.domain !== 'resend.dev') {
    const domain = await inspectSendingDomain(config)
    if (domain.domainStatus !== 'verified') {
      return { ok: false, error: domain.detail.trim() || `The domain ${from.domain} is not verified.`, replaceKey: true }
    }
  }

  const replyTo = parseMailbox(config.adminEmail)?.email
  try {
    const response = await fetch(`${RESEND}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        from: config.from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    })
    const body = (await response.json().catch(() => ({}))) as { id?: unknown; message?: unknown; name?: unknown }
    if (response.ok && typeof body.id === 'string' && body.id) return { ok: true, id: body.id }
    const name = typeof body.name === 'string' ? body.name : ''
    const message = typeof body.message === 'string' && body.message ? body.message : `Resend returned ${response.status}.`
    return { ok: false, error: message.slice(0, 500), replaceKey: replaceIdempotencyKey(response.status, name) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The email provider could not be reached.'
    return { ok: false, error: message.slice(0, 500), replaceKey: false }
  }
}

async function resendJson(
  apiKey: string,
  path: string,
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    const response = await fetch(`${RESEND}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>
    if (!response.ok) {
      const message = typeof body.message === 'string' ? body.message : `Resend returned ${response.status}.`
      return { ok: false, error: message.slice(0, 300) }
    }
    return { ok: true, body }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message.slice(0, 300) : 'network error' }
  }
}

function remember(key: string, setup: EmailSetup) {
  if (setup.domainStatus !== 'verified') return
  domainCache = { key, entry: { at: Date.now(), setup } }
}

function mapDomainStatus(status: string): EmailSetup['domainStatus'] {
  if (status === 'verified' || status === 'partially_verified') return 'verified'
  if (status === 'failed') return 'failed'
  if (status === 'pending' || status === 'not_started' || status === 'partially_failed') return 'pending'
  return 'unknown'
}

function domainDetail(domain: string, status: string, mapped: EmailSetup['domainStatus']): string {
  if (mapped === 'verified' && status === 'partially_verified') {
    return `${domain} is partially verified. Sending can start, and remaining DNS records can still be published.`
  }
  if (mapped === 'verified') return `Messages can send from ${domain}. The domain is verified.`
  if (mapped === 'failed') return `Resend reports that ${domain} failed verification. Check the DNS records and retry.`
  if (mapped === 'pending') return `${domain} is not verified yet. Publish the DNS records below, then retry failed emails.`
  return `Resend returned an unexpected status for ${domain}.`
}

function sendingRecords(value: unknown): DnsRecord[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = stringField(item as Record<string, unknown>, 'record')
      if (record !== 'SPF' && record !== 'DKIM') return null
      return {
        record,
        name: stringField(item as Record<string, unknown>, 'name'),
        type: stringField(item as Record<string, unknown>, 'type'),
        value: stringField(item as Record<string, unknown>, 'value'),
        status: stringField(item as Record<string, unknown>, 'status'),
      }
    })
    .filter((item): item is DnsRecord => item !== null)
}

function stringField(value: unknown, key: string): string {
  if (!value || typeof value !== 'object') return ''
  const field = (value as Record<string, unknown>)[key]
  return typeof field === 'string' ? field : ''
}
