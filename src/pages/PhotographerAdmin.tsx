import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { currencyOptions, serviceOptions, specializationOptions, validatePhotographer, type FieldErrors } from '../lib/leadRules.ts'
import type { PhotographerRecord } from '../lib/photographerRecord.ts'
import { isPhotographerStatus, profileFilters, reviewFilters, statusLabel, type PhotographerStatus, type ProfileAction } from '../lib/photographerStatus.ts'

type Filter = 'all' | PhotographerStatus

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...reviewFilters,
  ...profileFilters,
]

const fieldClass =
  'mt-2 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-base text-ink outline-none'

function labelFor(value: string, options: readonly { value: string; label: string }[]) {
  return options.find((option) => option.value === value)?.label ?? value
}

function formatWhen(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatRate(cents: string, currency: string) {
  const amount = Number(cents)
  if (!Number.isFinite(amount) || amount <= 0 || !currencyOptions.some((option) => option.value === currency)) {
    return 'Not provided'
  }
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount / 100)
}

function rateInput(cents: string) {
  const amount = Number(cents)
  if (!Number.isFinite(amount) || amount <= 0) return ''
  const major = amount / 100
  return Number.isInteger(major) ? String(major) : major.toFixed(2)
}

function shown(value: string) {
  return value.trim() || 'Not provided'
}

function actionsFor(status: string): { action: ProfileAction; label: string; tone: 'primary' | 'quiet' | 'warn' }[] {
  if (status === 'pending') {
    return [
      { action: 'approve', label: 'Approve', tone: 'primary' },
      { action: 'reject', label: 'Reject', tone: 'warn' },
    ]
  }
  if (status === 'rejected') return [{ action: 'approve', label: 'Approve', tone: 'primary' }]
  if (status === 'approved') {
    return [
      { action: 'suspend', label: 'Suspend', tone: 'warn' },
      { action: 'deactivate', label: 'Deactivate', tone: 'warn' },
    ]
  }
  if (status === 'suspended') {
    return [
      { action: 'restore', label: 'Restore', tone: 'primary' },
      { action: 'deactivate', label: 'Deactivate', tone: 'warn' },
    ]
  }
  if (status === 'deactivated') return [{ action: 'restore', label: 'Restore', tone: 'primary' }]
  return []
}

async function readError(response: Response) {
  return (await response.json().catch(() => ({}))) as {
    error?: string
    fields?: FieldErrors
    photographer?: PhotographerRecord
  }
}

export function PhotographerAdmin({
  photographers,
  onUpdated,
}: {
  photographers: PhotographerRecord[]
  onUpdated: (photographer: PhotographerRecord) => void
}) {
  const [filter, setFilter] = useState<Filter>('pending')
  const [selectedId, setSelectedId] = useState<string | null>(photographers[0]?.id ?? null)
  const visible = useMemo(
    () => (filter === 'all' ? photographers : photographers.filter((lead) => lead.status === filter)),
    [filter, photographers],
  )
  const selected = photographers.find((lead) => lead.id === selectedId) ?? visible[0] ?? null

  function handleUpdated(next: PhotographerRecord) {
    onUpdated(next)
    if (isPhotographerStatus(next.status)) setFilter(next.status)
    setSelectedId(next.id)
  }

  return (
    <section aria-labelledby="photographer-leads">
      <h2 id="photographer-leads" className="text-3xl">
        Photographer applications
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Open an application to see the full profile and portfolio. Pending applications can be approved or rejected.
        Approved photographers can be edited, suspended, or deactivated.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Netlify emails an application when you press Email this application, and again when someone new applies. Add an
        email notification for the form photographer-application. The reply address is the photographer. Approving or
        rejecting does not send another email.
      </p>
      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter applications">
        {filters.map((item) => {
          const count = item.value === 'all' ? photographers.length : photographers.filter((lead) => lead.status === item.value).length
          const active = filter === item.value
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={active}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium ${active ? 'bg-ink text-foam' : 'border border-line bg-foam text-ink hover:border-ink/30'}`}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
              <span className="ml-2 text-xs opacity-70">{count}</span>
            </button>
          )
        })}
      </div>
      {visible.length === 0 ? (
        <p className="mt-8 text-muted">
          {filter === 'all' ? 'No photographer applications yet.' : `No ${statusLabel(filter).toLowerCase()} applications.`}
        </p>
      ) : (
        <div className="mt-6 grid items-start gap-4 lg:grid-cols-[18rem_1fr]">
          <ul className="space-y-2">
            {visible.map((lead) => {
              const active = selected?.id === lead.id
              return (
                <li key={lead.id}>
                  <button
                    type="button"
                    className={`w-full rounded-2xl border px-4 py-3 text-left ${active ? 'border-ink bg-foam' : 'border-line bg-foam/60 hover:border-ink/30'}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => setSelectedId(lead.id)}
                  >
                    <span className="block font-medium">{lead.name || 'Unnamed photographer'}</span>
                    <span className="mt-1 block text-sm text-muted">{shown(lead.location)}</span>
                    <span className="mt-2 inline-flex rounded-full bg-sand px-2 py-1 text-[0.7rem] font-medium tracking-[0.12em] uppercase">
                      {statusLabel(lead.status)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {selected ? <PhotographerDetail key={selected.id} lead={selected} onUpdated={handleUpdated} /> : null}
        </div>
      )}
    </section>
  )
}

function PhotographerDetail({
  lead,
  onUpdated,
}: {
  lead: PhotographerRecord
  onUpdated: (photographer: PhotographerRecord) => void
}) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [serverFields, setServerFields] = useState<FieldErrors>({})
  const whatsapp = lead.phone.replace(/[^\d]/g, '')

  async function patch(body: Record<string, unknown>, action: string) {
    setBusy(action)
    setError('')
    setNotice('')
    setServerFields({})
    try {
      const response = await fetch(`/api/admin/photographers/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await readError(response)
      if (response.status === 401) {
        setError('Your admin session expired. Sign in again.')
        return
      }
      if (!response.ok) {
        setServerFields(action === 'edit' && data.fields ? data.fields : {})
        setError(data.error || 'The photographer could not be updated.')
        return
      }
      const photographer = data.photographer
      if (!photographer) {
        setError('The photographer could not be updated.')
        return
      }
      onUpdated(photographer)
      if (action === 'notify') {
        setNotice('Submitted to Netlify Forms. It is emailed to the address you set for photographer-application.')
      }
      setEditing(false)
    } catch {
      setError('The leads service is unavailable.')
    } finally {
      setBusy('')
    }
  }

  async function changeStatus(action: ProfileAction, label: string) {
    const needsConfirm = action === 'reject' || action === 'suspend' || action === 'deactivate'
    if (needsConfirm && !window.confirm(`${label} ${lead.name}?`)) return
    await patch({ action }, action)
  }

  if (editing) {
    return (
      <EditForm
        lead={lead}
        busy={busy === 'edit'}
        error={error}
        serverFields={serverFields}
        onCancel={() => {
          setEditing(false)
          setError('')
          setServerFields({})
        }}
        onSave={(body) => void patch(body, 'edit')}
      />
    )
  }

  return (
    <article className="rounded-[1.4rem] border border-line bg-foam p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl">{lead.name}</h3>
          <p className="mt-1 text-sm text-muted">{shown(lead.location)}</p>
        </div>
        <span className="rounded-full bg-sand px-3 py-1 text-xs font-medium tracking-[0.14em] uppercase">
          {statusLabel(lead.status)}
        </span>
      </div>
      <p className="mt-4 text-sm text-muted">
        {lead.status === 'approved'
          ? 'Visible in the app. Email, WhatsApp, equipment, experience, and availability stay private.'
          : 'Hidden from the app until this application is approved. Email, WhatsApp, equipment, experience, and availability stay private.'}
      </p>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <Detail label="Email">
          <a href={`mailto:${lead.email}`} className="underline decoration-line underline-offset-4">
            {lead.email}
          </a>
        </Detail>
        <Detail label="WhatsApp">
          {whatsapp ? (
            <a href={`https://wa.me/${whatsapp}`} className="underline decoration-line underline-offset-4" target="_blank" rel="noreferrer">
              {lead.phone}
            </a>
          ) : (
            'Not provided'
          )}
        </Detail>
        <Detail label="Specialties">
          {lead.specialties.length > 0
            ? lead.specialties.map((item) => labelFor(item, [...serviceOptions, ...specializationOptions])).join(', ')
            : 'Not provided'}
        </Detail>
        <Detail label="Hourly rate">{formatRate(lead.hourlyRateCents, lead.currency)}</Detail>
        <Detail label="Working areas">{shown(lead.workingAreas)}</Detail>
        <Detail label="Availability">{shown(lead.availability)}</Detail>
        <Detail label="Experience">{shown(lead.experience)}</Detail>
        <Detail label="Equipment">{shown(lead.equipment)}</Detail>
        <Detail label="Portfolio">
          {lead.portfolioUrls.length > 0 ? (
            <ul className="space-y-1">
              {lead.portfolioUrls.map((url) => (
                <li key={url}>
                  <a href={url} className="break-all underline decoration-line underline-offset-4" target="_blank" rel="noreferrer">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            'Not provided'
          )}
        </Detail>
        <Detail label="Submitted">{formatWhen(lead.createdAt)}</Detail>
      </dl>
      {notice ? <p className="mt-5 text-sm text-muted">{notice}</p> : null}
      {error ? (
        <p role="alert" className="mt-5 text-sm text-clay">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-medium hover:border-ink/30 disabled:opacity-60"
          disabled={Boolean(busy)}
          onClick={() => setEditing(true)}
        >
          Edit profile
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-medium hover:border-ink/30 disabled:opacity-60"
          disabled={Boolean(busy)}
          onClick={() => void patch({ action: 'notify' }, 'notify')}
        >
          {busy === 'notify' ? 'Sending…' : 'Email this application'}
        </button>
        {actionsFor(lead.status).map((item) => (
          <button
            key={item.action}
            type="button"
            className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium disabled:opacity-60 ${item.tone === 'primary' ? 'bg-sea text-foam hover:bg-sea-deep' : 'border border-clay text-clay hover:bg-sand'}`}
            disabled={Boolean(busy)}
            onClick={() => void changeStatus(item.action, item.label)}
          >
            {busy === item.action ? 'Saving…' : item.label}
          </button>
        ))}
      </div>
    </article>
  )
}

function EditForm({
  lead,
  busy,
  error,
  serverFields,
  onCancel,
  onSave,
}: {
  lead: PhotographerRecord
  busy: boolean
  error: string
  serverFields: FieldErrors
  onCancel: () => void
  onSave: (body: Record<string, unknown>) => void
}) {
  const [name, setName] = useState(lead.name)
  const [email, setEmail] = useState(lead.email)
  const [phone, setPhone] = useState(lead.phone)
  const [location, setLocation] = useState(lead.location)
  const [workingAreas, setWorkingAreas] = useState(lead.workingAreas)
  const [equipment, setEquipment] = useState(lead.equipment)
  const [experience, setExperience] = useState(lead.experience)
  const [availability, setAvailability] = useState(lead.availability)
  const [hourlyRate, setHourlyRate] = useState(rateInput(lead.hourlyRateCents))
  const [currency, setCurrency] = useState(currencyOptions.some((option) => option.value === lead.currency) ? lead.currency : 'USD')
  const validSpecialties = lead.specialties.filter((item) => serviceOptions.some((option) => option.value === item))
  const [specialties, setSpecialties] = useState<string[]>(validSpecialties)
  const [portfolio, setPortfolio] = useState(lead.portfolioUrls[0] ?? '')
  const [portfolio2, setPortfolio2] = useState(lead.portfolioUrls[1] ?? '')
  const [portfolio3, setPortfolio3] = useState(lead.portfolioUrls[2] ?? '')
  const [fields, setFields] = useState<FieldErrors>({})

  function toggleSpecialty(value: string) {
    setSpecialties((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validatePhotographer({
      name,
      email,
      phone,
      location,
      equipment,
      experience,
      availability,
      workingAreas,
      hourlyRate,
      currency,
      specialties,
      portfolios: [portfolio, portfolio2, portfolio3],
    })
    if (!result.ok) {
      setFields(result.fields)
      return
    }
    setFields({})
    onSave({
      action: 'edit',
      name: result.value.name,
      email: result.value.email,
      phone: result.value.phone,
      location: result.value.location,
      equipment: result.value.equipment,
      experience: result.value.experience,
      availability: result.value.availability,
      workingAreas: result.value.workingAreas,
      hourlyRate: (result.value.hourlyRateCents / 100).toFixed(2),
      currency: result.value.currency,
      specialties: result.value.specialties,
      portfolios: result.value.portfolioUrls,
    })
  }

  return (
    <form className="rounded-[1.4rem] border border-line bg-foam p-5 sm:p-6" onSubmit={onSubmit} noValidate>
      <h3 className="text-2xl">Edit {lead.name}</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <EditorField label="Name" error={fields.name || serverFields.name}>
          <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required />
        </EditorField>
        <EditorField label="Email" error={fields.email || serverFields.email}>
          <input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </EditorField>
        <EditorField label="WhatsApp" error={fields.phone || serverFields.phone}>
          <input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} required />
        </EditorField>
        <EditorField label="Location" error={fields.location}>
          <input className={fieldClass} value={location} onChange={(event) => setLocation(event.target.value)} required />
        </EditorField>
        <EditorField label="Working areas" error={fields.workingAreas}>
          <input className={fieldClass} value={workingAreas} onChange={(event) => setWorkingAreas(event.target.value)} required />
        </EditorField>
        <EditorField label="Availability" error={fields.availability}>
          <input className={fieldClass} value={availability} onChange={(event) => setAvailability(event.target.value)} required />
        </EditorField>
        <EditorField label="Equipment" error={fields.equipment}>
          <textarea className={`${fieldClass} min-h-24`} value={equipment} onChange={(event) => setEquipment(event.target.value)} required />
        </EditorField>
        <EditorField label="Experience" error={fields.experience}>
          <textarea className={`${fieldClass} min-h-24`} value={experience} onChange={(event) => setExperience(event.target.value)} required />
        </EditorField>
        <EditorField label="Hourly rate" error={fields.hourlyRate}>
          <input className={fieldClass} inputMode="decimal" value={hourlyRate} onChange={(event) => setHourlyRate(event.target.value)} required />
        </EditorField>
        <EditorField label="Currency" error={fields.currency}>
          <select className={fieldClass} value={currency} onChange={(event) => setCurrency(event.target.value)}>
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </EditorField>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Specialties</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {serviceOptions.map((option) => (
            <label key={option.value} className="flex min-h-11 items-center gap-3 rounded-2xl border border-line px-3 text-sm">
              <input
                type="checkbox"
                checked={specialties.includes(option.value)}
                onChange={() => toggleSpecialty(option.value)}
                className="size-4 accent-sea"
              />
              {option.label}
            </label>
          ))}
        </div>
        {fields.specialties ? <p className="mt-2 text-sm text-clay">{fields.specialties}</p> : null}
      </fieldset>
      <div className="mt-4 grid gap-4">
        <EditorField label="Portfolio sample or link" error={fields.portfolio || serverFields.portfolio}>
          <input className={fieldClass} value={portfolio} onChange={(event) => setPortfolio(event.target.value)} required />
        </EditorField>
        <EditorField label="Another sample or link" error={fields.portfolio2 || serverFields.portfolio2}>
          <input className={fieldClass} value={portfolio2} onChange={(event) => setPortfolio2(event.target.value)} />
        </EditorField>
        <EditorField label="Another sample or link" error={fields.portfolio3 || serverFields.portfolio3}>
          <input className={fieldClass} value={portfolio3} onChange={(event) => setPortfolio3(event.target.value)} />
        </EditorField>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-clay">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-foam disabled:opacity-60"
          disabled={busy}
        >
          {busy ? 'Saving…' : 'Save profile'}
        </button>
        <button type="button" className="inline-flex min-h-11 items-center rounded-full border border-line px-5 text-sm font-medium" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-[0.12em] text-muted uppercase">{label}</dt>
      <dd className="mt-1 break-words">{children}</dd>
    </div>
  )
}

function EditorField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
      {error ? <span className="mt-2 block text-sm font-normal text-clay">{error}</span> : null}
    </label>
  )
}
