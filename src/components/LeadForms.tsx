import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  serviceOptions,
  specializationOptions,
  validatePhotographer,
  validateTraveler,
  type FieldErrors,
} from '../lib/leadRules.ts'
import { Eyebrow, Reveal } from './Reveal.tsx'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const fieldClass =
  'mt-2 w-full rounded-2xl border border-line bg-foam px-4 py-3 text-base text-ink outline-none placeholder:text-muted/70'

function Field({
  id,
  label,
  error,
  errorClassName = 'text-clay',
  children,
}: {
  id: string
  label: string
  error?: string
  errorClassName?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className={`mt-2 text-sm ${errorClassName}`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

function Honeypot({ formId }: { formId: string }) {
  return (
    <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
      <label htmlFor={`${formId}-hp`}>Company</label>
      <input id={`${formId}-hp`} name="hp_field" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  )
}

function useLeadSubmit(endpoint: string) {
  const [status, setStatus] = useState<Status>('idle')
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const startedAt = useRef(0)

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  async function send(payload: Record<string, string>, website: string) {
    setStatus('submitting')
    setFormError('')
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...payload, hp_field: website, startedAt: startedAt.current }),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string; fields?: FieldErrors }
      if (!response.ok) {
        setFieldErrors(data.fields ?? {})
        setFormError(data.error || 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }
      setFieldErrors({})
      setStatus('success')
    } catch {
      setFormError('We could not reach the server. Check your connection and try again.')
      setStatus('error')
    }
  }

  return { status, formError, fieldErrors, setFieldErrors, setFormError, setStatus, send }
}

export function LeadForms() {
  return (
    <section className="scroll-mt-24 border-t border-line bg-sand/50 px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-6xl">
        <Eyebrow>Early access</Eyebrow>
        <h2 className="mt-4 max-w-2xl text-4xl sm:text-5xl">Tell us where you are headed.</h2>
        <p className="mt-5 max-w-2xl text-muted">
          Two short forms. Travelers get first notice when a city opens. Photographers join the
          network we are building. Nothing here books a shoot today.
        </p>
        <div className="mt-12 grid items-start gap-6 lg:grid-cols-2">
          <TravelerForm />
          <PhotographerForm />
        </div>
      </Reveal>
    </section>
  )
}

function TravelerForm() {
  const formId = useId()
  const lead = useLeadSubmit('/api/traveler-leads')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [destination, setDestination] = useState('')
  const [service, setService] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateTraveler({ name, email, destination, service })
    if (!result.ok) {
      lead.setFieldErrors(result.fields)
      lead.setFormError('Check the highlighted fields.')
      lead.setStatus('error')
      return
    }
    lead.setFieldErrors({})
    lead.setFormError('')
    const website = formRef.current?.querySelector<HTMLInputElement>('input[name="hp_field"]')?.value ?? ''
    void lead.send(
      {
        name: result.value.name,
        email: result.value.email,
        destination: result.value.destination,
        service: result.value.service,
      },
      website,
    )
  }

  return (
    <article id="travelers" className="scroll-mt-28 rounded-[1.8rem] bg-foam p-6 shadow-[0_24px_50px_-36px_rgba(26,24,20,0.65)] sm:p-8">
      <h3 id="traveler-heading" className="text-3xl">
        For travelers
      </h3>
      <p className="mt-3 text-sm text-muted">
        Share a destination and the kind of photos you want. We will email you when a photographer
        can take them.
      </p>
      {lead.status === 'success' ? (
        <div role="status" className="mt-8 rounded-2xl bg-sand px-5 py-6">
          <p className="font-display text-2xl">You are on the list.</p>
          <p className="mt-2 text-sm text-muted">
            Thanks, {name.trim()}. We saved your request for {destination.trim()}. This is early
            access, not a confirmed booking.
          </p>
        </div>
      ) : (
        <form ref={formRef} className="relative mt-8 space-y-5" onSubmit={onSubmit} noValidate>
          <Honeypot formId={formId} />
          <Field id={`${formId}-name`} label="Name" error={lead.fieldErrors.name}>
            <input
              id={`${formId}-name`}
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.name)}
              aria-describedby={lead.fieldErrors.name ? `${formId}-name-error` : undefined}
              required
            />
          </Field>
          <Field id={`${formId}-email`} label="Email" error={lead.fieldErrors.email}>
            <input
              id={`${formId}-email`}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.email)}
              aria-describedby={lead.fieldErrors.email ? `${formId}-email-error` : undefined}
              required
            />
          </Field>
          <Field id={`${formId}-destination`} label="Destination" error={lead.fieldErrors.destination}>
            <input
              id={`${formId}-destination`}
              name="destination"
              autoComplete="off"
              placeholder="Lisbon, Kyoto, Mexico City"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.destination)}
              aria-describedby={lead.fieldErrors.destination ? `${formId}-destination-error` : undefined}
              required
            />
          </Field>
          <Field id={`${formId}-service`} label="Photography service" error={lead.fieldErrors.service}>
            <select
              id={`${formId}-service`}
              name="service"
              value={service}
              onChange={(event) => setService(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.service)}
              aria-describedby={lead.fieldErrors.service ? `${formId}-service-error` : undefined}
              required
            >
              <option value="">Select a service</option>
              {serviceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          {lead.formError ? (
            <p role="alert" className="text-sm text-clay">
              {lead.formError}
            </p>
          ) : null}
          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-sea px-6 text-base font-medium text-foam hover:bg-sea-deep disabled:opacity-60 sm:w-auto"
            disabled={lead.status === 'submitting'}
          >
            {lead.status === 'submitting' ? 'Sending…' : 'Get Early Access'}
          </button>
          <noscript>
            <p className="text-sm text-muted">
              JavaScript is required to send this form. Email hello@tripframe.com instead.
            </p>
          </noscript>
        </form>
      )}
    </article>
  )
}

function PhotographerForm() {
  const formId = useId()
  const lead = useLeadSubmit('/api/photographer-leads')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [location, setLocation] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validatePhotographer({ name, email, location, specialization, portfolio })
    if (!result.ok) {
      lead.setFieldErrors(result.fields)
      lead.setFormError('Check the highlighted fields.')
      lead.setStatus('error')
      return
    }
    lead.setFieldErrors({})
    lead.setFormError('')
    const website = formRef.current?.querySelector<HTMLInputElement>('input[name="hp_field"]')?.value ?? ''
    void lead.send(
      {
        name: result.value.name,
        email: result.value.email,
        location: result.value.location,
        specialization: result.value.specialization,
        portfolio: result.value.portfolioUrl ?? '',
      },
      website,
    )
  }

  const quiet = 'text-foam/75'

  return (
    <article id="photographers" className="scroll-mt-28 rounded-[1.8rem] bg-ink p-6 text-foam sm:p-8">
      <h3 className="text-3xl">For photographers</h3>
      <p className={`mt-3 text-sm ${quiet}`}>
        Tell us where you shoot and what you do best. We will email you when the network opens in
        your city.
      </p>
      {lead.status === 'success' ? (
        <div role="status" className="mt-8 rounded-2xl bg-white/10 px-5 py-6">
          <p className="font-display text-2xl">Welcome to the network.</p>
          <p className={`mt-2 text-sm ${quiet}`}>
            Thanks, {name.trim()}. We saved your registration for {location.trim()}. We will be in
            touch about photographer early access.
          </p>
        </div>
      ) : (
        <form ref={formRef} className="relative mt-8 space-y-5" onSubmit={onSubmit} noValidate>
          <Honeypot formId={formId} />
          <Field id={`${formId}-name`} label="Name" error={lead.fieldErrors.name} errorClassName="text-[#f6cfc2]">
            <input
              id={`${formId}-name`}
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.name)}
              aria-describedby={lead.fieldErrors.name ? `${formId}-name-error` : undefined}
              required
            />
          </Field>
          <Field id={`${formId}-email`} label="Email" error={lead.fieldErrors.email} errorClassName="text-[#f6cfc2]">
            <input
              id={`${formId}-email`}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.email)}
              aria-describedby={lead.fieldErrors.email ? `${formId}-email-error` : undefined}
              required
            />
          </Field>
          <Field id={`${formId}-location`} label="Location" error={lead.fieldErrors.location} errorClassName="text-[#f6cfc2]">
            <input
              id={`${formId}-location`}
              name="location"
              autoComplete="address-level2"
              placeholder="Where you are based"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.location)}
              aria-describedby={lead.fieldErrors.location ? `${formId}-location-error` : undefined}
              required
            />
          </Field>
          <Field
            id={`${formId}-specialization`}
            label="Photography specialization"
            error={lead.fieldErrors.specialization}
            errorClassName="text-[#f6cfc2]"
          >
            <select
              id={`${formId}-specialization`}
              name="specialization"
              value={specialization}
              onChange={(event) => setSpecialization(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.specialization)}
              aria-describedby={
                lead.fieldErrors.specialization ? `${formId}-specialization-error` : undefined
              }
              required
            >
              <option value="">Select a specialization</option>
              {specializationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id={`${formId}-portfolio`}
            label="Portfolio or Instagram link (optional)"
            error={lead.fieldErrors.portfolio}
            errorClassName="text-[#f6cfc2]"
          >
            <input
              id={`${formId}-portfolio`}
              name="portfolio"
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder="https:// or @handle"
              value={portfolio}
              onChange={(event) => setPortfolio(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.portfolio)}
              aria-describedby={lead.fieldErrors.portfolio ? `${formId}-portfolio-error` : undefined}
            />
          </Field>
          {lead.formError ? (
            <p role="alert" className="text-sm text-[#f3c7b6]">
              {lead.formError}
            </p>
          ) : null}
          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-foam px-6 text-base font-medium text-ink hover:bg-sand disabled:opacity-60 sm:w-auto"
            disabled={lead.status === 'submitting'}
          >
            {lead.status === 'submitting' ? 'Sending…' : 'Join Our Photographer Network'}
          </button>
          <noscript>
            <p className={`text-sm ${quiet}`}>
              JavaScript is required to send this form. Email hello@tripframe.com instead.
            </p>
          </noscript>
        </form>
      )}
    </article>
  )
}
