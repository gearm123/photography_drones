import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  currencyOptions,
  serviceOptions,
  validatePhotographer,
  type FieldErrors,
} from '../lib/leadRules.ts'
import { AppDownloads } from './AppDownloads.tsx'
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
  const [confirmation, setConfirmation] = useState<'' | 'sent' | 'failed'>('')
  const startedAt = useRef(0)

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  async function send(payload: Record<string, unknown>, website: string) {
    setStatus('submitting')
    setFormError('')
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...payload, hp_field: website, startedAt: startedAt.current }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        fields?: FieldErrors
        confirmation?: string
      }
      if (!response.ok) {
        setFieldErrors(data.fields ?? {})
        setFormError(data.error || 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }
      setFieldErrors({})
      setConfirmation(data.confirmation === 'failed' ? 'failed' : data.confirmation === 'sent' ? 'sent' : '')
      setStatus('success')
    } catch {
      setFormError('We could not reach the server. Check your connection and try again.')
      setStatus('error')
    }
  }

  return { status, formError, fieldErrors, confirmation, setFieldErrors, setFormError, setStatus, send }
}

export function LeadForms() {
  return (
    <section className="scroll-mt-24 border-t border-line bg-sand/50 px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-6xl">
        <Eyebrow>Early access</Eyebrow>
        <h2 className="mt-4 max-w-2xl text-4xl sm:text-5xl">Photographers apply here.</h2>
        <p className="mt-5 max-w-2xl text-muted">
          This website registers photographers only.{' '}
          <a href="#pay" className="underline decoration-line underline-offset-4 hover:text-ink">
            Read the pay terms
          </a>{' '}
          before you apply. Travelers find a photographer in the Tripframe apps for iPhone and Android.
          Those apps are still being built.
        </p>
        <div className="mt-12 grid items-start gap-6 lg:grid-cols-2">
          <TravelerApps />
          <PhotographerForm />
        </div>
      </Reveal>
    </section>
  )
}

function TravelerApps() {
  return (
    <article id="apps" className="scroll-mt-28 rounded-[1.8rem] bg-foam p-6 shadow-[0_24px_50px_-36px_rgba(26,24,20,0.65)] sm:p-8">
      <h3 className="text-3xl">For travelers</h3>
      <p className="mt-3 text-sm text-muted">
        Find a photographer in the Tripframe app. There is no traveler sign-up on this website. The
        iPhone and Android apps are still being built, so the buttons below do not open a store.
      </p>
      <div className="mt-8">
        <AppDownloads />
      </div>
    </article>
  )
}

function PhotographerForm() {
  const formId = useId()
  const lead = useLeadSubmit('/api/photographer-leads')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [equipment, setEquipment] = useState('')
  const [experience, setExperience] = useState('')
  const [availability, setAvailability] = useState('')
  const [workingAreas, setWorkingAreas] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [portfolio, setPortfolio] = useState('')
  const [portfolio2, setPortfolio2] = useState('')
  const [portfolio3, setPortfolio3] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function toggleSpecialty(value: string) {
    setSpecialties((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
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
      },
      website,
    )
  }

  const quiet = 'text-foam/75'
  const errorTone = 'text-[#f6cfc2]'

  return (
    <article id="photographers" className="scroll-mt-28 rounded-[1.8rem] bg-ink p-6 text-foam sm:p-8">
      <h3 className="text-3xl">For photographers</h3>
      <p className={`mt-3 text-sm ${quiet}`}>
        Apply with your equipment, rates, and working areas. We save every application as pending
        and email you after review. This does not book a shoot today.
      </p>
      {lead.status === 'success' ? (
        <div role="status" className="mt-8 rounded-2xl bg-white/10 px-5 py-6">
          <p className="font-display text-2xl">Application received.</p>
          <p className={`mt-2 text-sm ${quiet}`}>
            {lead.confirmation === 'failed'
              ? `Thanks, ${name.trim()}. Your application for ${location.trim()} is saved as Pending. The confirmation email could not be sent, and it can be retried from the admin dashboard.`
              : lead.confirmation === 'sent'
                ? `Thanks, ${name.trim()}. Your application for ${location.trim()} is saved as Pending. We emailed you a confirmation and will email you again after review.`
                : `Thanks, ${name.trim()}. Your application for ${location.trim()} is saved as Pending. We will email you a confirmation and again after review.`}
          </p>
        </div>
      ) : (
        <form ref={formRef} className="relative mt-8 space-y-5" onSubmit={onSubmit} noValidate>
          <Honeypot formId={formId} />
          <Field id={`${formId}-name`} label="Name" error={lead.fieldErrors.name} errorClassName={errorTone}>
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
          <Field id={`${formId}-email`} label="Email" error={lead.fieldErrors.email} errorClassName={errorTone}>
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
          <Field
            id={`${formId}-phone`}
            label="Phone / WhatsApp"
            error={lead.fieldErrors.phone}
            errorClassName={errorTone}
          >
            <input
              id={`${formId}-phone`}
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+351 912 345 678"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.phone)}
              aria-describedby={lead.fieldErrors.phone ? `${formId}-phone-error` : undefined}
              required
            />
          </Field>
          <Field id={`${formId}-location`} label="Location" error={lead.fieldErrors.location} errorClassName={errorTone}>
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
            id={`${formId}-working-areas`}
            label="Working areas"
            error={lead.fieldErrors.workingAreas}
            errorClassName={errorTone}
          >
            <input
              id={`${formId}-working-areas`}
              name="workingAreas"
              placeholder="Lisbon, Cascais, Sintra"
              value={workingAreas}
              onChange={(event) => setWorkingAreas(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.workingAreas)}
              aria-describedby={lead.fieldErrors.workingAreas ? `${formId}-working-areas-error` : undefined}
              required
            />
          </Field>
          <Field
            id={`${formId}-equipment`}
            label="Equipment"
            error={lead.fieldErrors.equipment}
            errorClassName={errorTone}
          >
            <textarea
              id={`${formId}-equipment`}
              name="equipment"
              rows={3}
              placeholder="Camera bodies, lenses, drone"
              value={equipment}
              onChange={(event) => setEquipment(event.target.value)}
              className={`${fieldClass} min-h-24 resize-y`}
              aria-invalid={Boolean(lead.fieldErrors.equipment)}
              aria-describedby={lead.fieldErrors.equipment ? `${formId}-equipment-error` : undefined}
              required
            />
          </Field>
          <Field
            id={`${formId}-experience`}
            label="Experience"
            error={lead.fieldErrors.experience}
            errorClassName={errorTone}
          >
            <textarea
              id={`${formId}-experience`}
              name="experience"
              rows={3}
              placeholder="8 years, mostly travel and portraits"
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
              className={`${fieldClass} min-h-24 resize-y`}
              aria-invalid={Boolean(lead.fieldErrors.experience)}
              aria-describedby={lead.fieldErrors.experience ? `${formId}-experience-error` : undefined}
              required
            />
          </Field>
          <Field
            id={`${formId}-availability`}
            label="Availability"
            error={lead.fieldErrors.availability}
            errorClassName={errorTone}
          >
            <input
              id={`${formId}-availability`}
              name="availability"
              placeholder="Weekends and weekday evenings"
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.availability)}
              aria-describedby={lead.fieldErrors.availability ? `${formId}-availability-error` : undefined}
              required
            />
          </Field>
          <fieldset
            aria-describedby={lead.fieldErrors.specialties ? `${formId}-specialties-error` : undefined}
          >
            <legend className="text-sm font-medium">Photography specialties</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {serviceOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm"
                >
                  <input
                    type="checkbox"
                    name="specialties"
                    value={option.value}
                    checked={specialties.includes(option.value)}
                    onChange={() => toggleSpecialty(option.value)}
                    className="size-4 accent-sea"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {lead.fieldErrors.specialties ? (
              <p id={`${formId}-specialties-error`} className={`mt-2 text-sm ${errorTone}`}>
                {lead.fieldErrors.specialties}
              </p>
            ) : null}
          </fieldset>
          <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
            <Field
              id={`${formId}-rate`}
              label="Proposed hourly rate"
              error={lead.fieldErrors.hourlyRate}
              errorClassName={errorTone}
            >
              <input
                id={`${formId}-rate`}
                name="hourlyRate"
                inputMode="decimal"
                placeholder="75"
                value={hourlyRate}
                onChange={(event) => setHourlyRate(event.target.value)}
                className={fieldClass}
                aria-invalid={Boolean(lead.fieldErrors.hourlyRate)}
                aria-describedby={lead.fieldErrors.hourlyRate ? `${formId}-rate-error` : undefined}
                required
              />
            </Field>
            <Field
              id={`${formId}-currency`}
              label="Currency"
              error={lead.fieldErrors.currency}
              errorClassName={errorTone}
            >
              <select
                id={`${formId}-currency`}
                name="currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className={fieldClass}
                aria-invalid={Boolean(lead.fieldErrors.currency)}
                aria-describedby={lead.fieldErrors.currency ? `${formId}-currency-error` : undefined}
                required
              >
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field
            id={`${formId}-portfolio`}
            label="Portfolio sample or link"
            error={lead.fieldErrors.portfolio}
            errorClassName={errorTone}
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
              required
            />
          </Field>
          <Field
            id={`${formId}-portfolio-2`}
            label="Another sample or link (optional)"
            error={lead.fieldErrors.portfolio2}
            errorClassName={errorTone}
          >
            <input
              id={`${formId}-portfolio-2`}
              name="portfolio2"
              type="text"
              inputMode="url"
              placeholder="https:// or @handle"
              value={portfolio2}
              onChange={(event) => setPortfolio2(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.portfolio2)}
              aria-describedby={lead.fieldErrors.portfolio2 ? `${formId}-portfolio-2-error` : undefined}
            />
          </Field>
          <Field
            id={`${formId}-portfolio-3`}
            label="Another sample or link (optional)"
            error={lead.fieldErrors.portfolio3}
            errorClassName={errorTone}
          >
            <input
              id={`${formId}-portfolio-3`}
              name="portfolio3"
              type="text"
              inputMode="url"
              placeholder="https:// or @handle"
              value={portfolio3}
              onChange={(event) => setPortfolio3(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.portfolio3)}
              aria-describedby={lead.fieldErrors.portfolio3 ? `${formId}-portfolio-3-error` : undefined}
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
