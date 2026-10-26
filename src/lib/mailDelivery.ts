import { getDatabase } from '@netlify/database'
import {
  MAX_ATTEMPTS,
  isEmailKind,
  messageFor,
  requiredEmailKinds,
  type EmailDelivery,
  type EmailKind,
  type MailConfig,
} from './mailMessages.ts'
import { mapPhotographer, type PhotographerRecord } from './photographerRecord.ts'
import { sendWithResend } from './resendMail.ts'

type LeadRow = Record<string, unknown>

export async function attachEmails(photographers: PhotographerRecord[]): Promise<PhotographerRecord[]> {
  const ids = photographers.map((photographer) => Number(photographer.id)).filter((id) => Number.isSafeInteger(id) && id > 0)
  if (ids.length === 0) return photographers.map((photographer) => ({ ...photographer, emails: photographer.emails ?? [] }))
  const rows = await getDatabase().sql<LeadRow>`
    SELECT photographer_id, kind, recipient, status, attempts, last_error, sent_at
    FROM photographer_emails
    WHERE photographer_id = ANY(${ids})
  `
  const grouped = new Map<string, EmailDelivery[]>()
  for (const row of asRows(rows)) {
    const id = text(row.photographer_id)
    const delivery = mapEmail(row)
    if (!id || !delivery) continue
    const list = grouped.get(id) ?? []
    list.push(delivery)
    grouped.set(id, list)
  }
  return photographers.map((photographer) => ({ ...photographer, emails: grouped.get(photographer.id) ?? [] }))
}

export async function deliverEmails(
  row: LeadRow,
  kinds: EmailKind[],
  config: MailConfig,
  force = false,
): Promise<EmailDelivery[]> {
  const photographer = mapPhotographer(row)
  const id = Number(photographer.id)
  if (!Number.isSafeInteger(id) || id <= 0) return []
  for (const kind of kinds) {
    await deliverOne(id, photographer, kind, config, force)
  }
  return emailsFor(id)
}

export async function retryPhotographerEmails(row: LeadRow, config: MailConfig): Promise<EmailDelivery[]> {
  const photographer = mapPhotographer(row)
  return deliverEmails(row, requiredEmailKinds(photographer.status), config, true)
}

async function deliverOne(
  id: number,
  photographer: PhotographerRecord,
  kind: EmailKind,
  config: MailConfig,
  force: boolean,
): Promise<void> {
  const built = messageFor(kind, photographer, config)
  const recipient = deliveryRecipient(kind, built.ok ? built.mail.to : '', photographer.email, config.adminEmail)
  const db = getDatabase()
  await db.sql`
    INSERT INTO photographer_emails (photographer_id, kind, recipient, status)
    VALUES (${id}, ${kind}, ${recipient.slice(0, 200)}, 'pending')
    ON CONFLICT (photographer_id, kind) DO NOTHING
  `
  if (!built.ok) {
    await db.sql`
      UPDATE photographer_emails
      SET status = 'failed', last_error = ${built.error.slice(0, 500)}, updated_at = now()
      WHERE photographer_id = ${id} AND kind = ${kind} AND status IN ('pending', 'failed')
    `
    return
  }

  if (force) {
    await db.sql`
      UPDATE photographer_emails
      SET attempts = 0, idempotency_key = NULL, status = 'failed', updated_at = now()
      WHERE photographer_id = ${id}
        AND kind = ${kind}
        AND attempts >= ${MAX_ATTEMPTS}
        AND (
          status = 'failed'
          OR (status = 'sending' AND claimed_at < now() - make_interval(mins => 10))
        )
    `
  }

  const claimed = await db.sql<LeadRow>`
    UPDATE photographer_emails
    SET
      status = 'sending',
      recipient = ${built.mail.to},
      attempts = attempts + 1,
      idempotency_key = COALESCE(idempotency_key, concat('tf-', photographer_id, '-', kind, '-', attempts + 1)),
      claimed_at = now(),
      updated_at = now()
    WHERE photographer_id = ${id}
      AND kind = ${kind}
      AND attempts < ${MAX_ATTEMPTS}
      AND (
        status IN ('pending', 'failed')
        OR (status = 'sending' AND claimed_at < now() - make_interval(mins => 10))
      )
    RETURNING idempotency_key
  `
  const claim = asRows(claimed)[0]
  const idempotencyKey = text(claim?.idempotency_key)
  if (!claim || !idempotencyKey) return

  const sent = await sendWithResend(config, built.mail, idempotencyKey)
  if (sent.ok) {
    await db.sql`
      UPDATE photographer_emails
      SET status = 'sent', provider_id = ${sent.id}, sent_at = now(), last_error = NULL, updated_at = now()
      WHERE photographer_id = ${id} AND kind = ${kind} AND status = 'sending'
    `
    return
  }

  await db.sql`
    UPDATE photographer_emails
    SET
      status = 'failed',
      last_error = ${sent.error.slice(0, 500)},
      idempotency_key = ${sent.replaceKey ? null : idempotencyKey},
      updated_at = now()
    WHERE photographer_id = ${id} AND kind = ${kind} AND status = 'sending'
  `
}

async function emailsFor(id: number): Promise<EmailDelivery[]> {
  const rows = await getDatabase().sql<LeadRow>`
    SELECT kind, recipient, status, attempts, last_error, sent_at
    FROM photographer_emails
    WHERE photographer_id = ${id}
    ORDER BY created_at ASC
  `
  return asRows(rows).flatMap((row) => {
    const delivery = mapEmail(row)
    return delivery ? [delivery] : []
  })
}

function mapEmail(row: LeadRow): EmailDelivery | null {
  const kind = text(row.kind)
  const status = text(row.status)
  if (!isEmailKind(kind)) return null
  if (status !== 'pending' && status !== 'sending' && status !== 'sent' && status !== 'failed') return null
  const attempts = Number(text(row.attempts) || '0')
  return {
    kind,
    recipient: text(row.recipient),
    status,
    attempts: Number.isFinite(attempts) ? attempts : 0,
    lastError: text(row.last_error),
    sentAt: text(row.sent_at),
  }
}

function deliveryRecipient(kind: EmailKind, readyTo: string, photographerEmail: string, adminEmail: string): string {
  if (readyTo) return readyTo.slice(0, 200)
  if (kind === 'admin_notice') {
    const admin = adminEmail.trim()
    return (admin.length >= 3 ? admin : 'admin-not-set').slice(0, 200)
  }
  return photographerEmail.slice(0, 200)
}

function asRows(rows: LeadRow[] | LeadRow): LeadRow[] {
  return Array.isArray(rows) ? rows : []
}

function text(value: unknown): string {
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}
