import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { serviceOptions } from '../lib/leadRules.ts'
import type { PhotographerRecord } from '../lib/photographerRecord.ts'
import { PhotographerAdmin } from './PhotographerAdmin.tsx'

type TravelerLead = {
  id: string
  name: string
  email: string
  destination: string
  serviceTier: string
  createdAt: string
}

type PhotographerLead = PhotographerRecord

type LeadsResponse = {
  travelers: TravelerLead[]
  photographers: PhotographerLead[]
}

const fieldClass =
  'mt-2 w-full rounded-2xl border border-line bg-foam px-4 py-3 text-base text-ink outline-none'

function labelFor(value: string, options: readonly { value: string; label: string }[]) {
  return options.find((option) => option.value === value)?.label ?? value
}

function formatWhen(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const type = response.headers.get('content-type') ?? ''
  if (!type.includes('application/json')) throw new Error('The leads service is unavailable.')
  return (await response.json()) as Record<string, unknown>
}

async function readError(response: Response, fallback: string) {
  try {
    const data = await readJson(response)
    return typeof data.error === 'string' ? data.error : fallback
  } catch (error) {
    return error instanceof Error ? error.message : fallback
  }
}

export function AdminPage() {
  const [password, setPassword] = useState('')
  const [leads, setLeads] = useState<LeadsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.documentElement.classList.add('admin-ready')
    const previousTitle = document.title
    document.title = 'Admin — Tripframe'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.append(meta)
    return () => {
      document.title = previousTitle
      meta.remove()
    }
  }, [])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const response = await fetch('/api/admin/leads', { headers: { Accept: 'application/json' } })
        if (!active) return
        if (response.status === 401) {
          setLeads(null)
          return
        }
        if (!response.ok) {
          setError(await readError(response, 'The leads could not be loaded.'))
          return
        }
        setLeads((await readJson(response)) as unknown as LeadsResponse)
      } catch {
        if (active) setError('The leads service is unavailable.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Sign-in failed.'))
        return
      }
      const leadsResponse = await fetch('/api/admin/leads', { headers: { Accept: 'application/json' } })
      if (!leadsResponse.ok) {
        setError(await readError(leadsResponse, 'Signed in, but the leads could not be loaded.'))
        return
      }
      setPassword('')
      setLeads((await readJson(leadsResponse)) as unknown as LeadsResponse)
    } catch {
      setError('The leads service is unavailable.')
    } finally {
      setSubmitting(false)
    }
  }

  async function onLogout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => undefined)
    setLeads(null)
    setError('')
  }

  function replacePhotographer(photographer: PhotographerRecord) {
    setLeads((current) =>
      current
        ? {
            ...current,
            photographers: current.photographers.map((item) => (item.id === photographer.id ? photographer : item)),
          }
        : current,
    )
  }

  return (
    <div className="min-h-svh bg-paper text-ink">
      <header className="border-b border-line bg-paper/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/" className="font-display text-2xl tracking-tight">
            Tripframe
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/" className="text-muted hover:text-ink">
              Back to site
            </a>
            {leads ? (
              <button type="button" className="font-medium text-ink hover:text-sea" onClick={() => void onLogout()}>
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-xs font-medium tracking-[0.18em] text-clay uppercase">Admin</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">Photographer dashboard</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Sign in with the admin password to review photographer applications. The password stays on the server.
        </p>
        {loading ? <p className="mt-10 text-muted">Loading leads…</p> : null}
        {!loading && !leads ? <LoginForm password={password} setPassword={setPassword} submitting={submitting} error={error} onSubmit={onLogin} /> : null}
        {leads ? <LeadLists leads={leads} onUpdated={replacePhotographer} /> : null}
      </main>
    </div>
  )
}

function LoginForm({
  password,
  setPassword,
  submitting,
  error,
  onSubmit,
}: {
  password: string
  setPassword: (value: string) => void
  submitting: boolean
  error: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className="mt-10 max-w-md rounded-[1.8rem] bg-foam p-6 sm:p-8" onSubmit={onSubmit}>
      <h2 className="text-3xl">Sign in</h2>
      <p className="mt-3 text-sm text-muted">Use the admin password stored in Netlify. It is not saved in the browser.</p>
      <label htmlFor="admin-password" className="mt-6 block text-sm font-medium">
        Password
      </label>
      <input
        id="admin-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className={fieldClass}
        required
      />
      {error ? (
        <p role="alert" className="mt-4 text-sm text-clay">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 text-base font-medium text-foam hover:bg-sea disabled:opacity-60"
        disabled={submitting}
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

function LeadLists({
  leads,
  onUpdated,
}: {
  leads: LeadsResponse
  onUpdated: (photographer: PhotographerRecord) => void
}) {
  return (
    <div className="mt-12 space-y-16">
      <PhotographerAdmin photographers={leads.photographers} onUpdated={onUpdated} />
      <section aria-labelledby="traveler-leads">
        <h2 id="traveler-leads" className="text-3xl">
          Earlier traveler requests
        </h2>
        <p className="mt-2 text-sm text-muted">
          {leads.travelers.length} saved. New traveler requests are no longer collected on this website.
        </p>
        <LeadTable
          empty="No traveler leads yet."
          headers={['Name', 'Email', 'Destination', 'Service', 'Submitted']}
          rows={leads.travelers.map((lead) => [
            lead.name,
            <a key="email" href={`mailto:${lead.email}`} className="underline decoration-line underline-offset-4">
              {lead.email}
            </a>,
            lead.destination,
            labelFor(lead.serviceTier, serviceOptions),
            formatWhen(lead.createdAt),
          ])}
        />
      </section>
    </div>
  )
}

function LeadTable({ headers, rows, empty }: { headers: string[]; rows: ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <p className="mt-6 text-muted">{empty}</p>
  return (
    <div className="mt-6 overflow-x-auto rounded-[1.4rem] border border-line bg-foam">
      <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs tracking-[0.12em] text-muted uppercase">
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-line/70 last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
