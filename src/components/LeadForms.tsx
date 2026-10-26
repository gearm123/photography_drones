import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useLanguage } from '../i18n/LanguageContext.tsx'
import { translateError } from '../i18n/translations.ts'
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
    <div className="sr-only" aria-hidden="true">
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
  const { t } = useLanguage()

  return (
    <section className="scroll-mt-24 border-t border-line bg-sand/50 px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-6xl">
        <Eyebrow>{t.leads.eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-2xl text-4xl sm:text-5xl">{t.leads.title}</h2>
        <p className="mt-5 max-w-2xl text-muted">
          {t.leads.intro}{' '}
          <a href="#pay" className="underline decoration-line underline-offset-4 hover:text-ink">
            {t.leads.payLink}
          </a>{' '}
          {t.leads.introAfter}
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
  const { t } = useLanguage()

  return (
    <article id="apps" className="scroll-mt-28 rounded-[1.8rem] bg-foam p-6 shadow-[0_24px_50px_-36px_rgba(26,24,20,0.65)] sm:p-8">
      <h3 className="text-3xl">{t.leads.travelersTitle}</h3>
      <p className="mt-3 text-sm text-muted">{t.leads.travelersBody}</p>
      <div className="mt-8">
        <AppDownloads />
      </div>
    </article>
  )
}

function PhotographerForm() {
  const { t, fill } = useLanguage()
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
  const show = (message?: string) => translateError(t.errors, message)
  const thanks = fill(
    lead.confirmation === 'failed' ? t.leads.successFailed : lead.confirmation === 'sent' ? t.leads.successSent : t.leads.successUnknown,
    { name: name.trim(), location: location.trim() },
  )

  return (
    <article id="photographers" className="scroll-mt-28 rounded-[1.8rem] bg-ink p-6 text-foam sm:p-8">
      <h3 className="text-3xl">{t.leads.formTitle}</h3>
      <p className={`mt-3 text-sm ${quiet}`}>{t.leads.formBody}</p>
      {lead.status === 'success' ? (
        <div role="status" className="mt-8 rounded-2xl bg-white/10 px-5 py-6">
          <p className="font-display text-2xl">{t.leads.received}</p>
          <p className={`mt-2 text-sm ${quiet}`}>{thanks}</p>
        </div>
      ) : (
        <form ref={formRef} className="relative mt-8 space-y-5" onSubmit={onSubmit} noValidate>
          <Honeypot formId={formId} />
          <Field id={`${formId}-name`} label={t.leads.name} error={show(lead.fieldErrors.name)} errorClassName={errorTone}>
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
          <Field id={`${formId}-email`} label={t.leads.email} error={show(lead.fieldErrors.email)} errorClassName={errorTone}>
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
            label={t.leads.phone}
            error={show(lead.fieldErrors.phone)}
            errorClassName={errorTone}
          >
            <input
              id={`${formId}-phone`}
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder={t.leads.phonePlaceholder}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.phone)}
              aria-describedby={lead.fieldErrors.phone ? `${formId}-phone-error` : undefined}
              required
            />
          </Field>
          <Field id={`${formId}-location`} label={t.leads.location} error={show(lead.fieldErrors.location)} errorClassName={errorTone}>
            <input
              id={`${formId}-location`}
              name="location"
              autoComplete="address-level2"
              placeholder={t.leads.locationPlaceholder}
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
            label={t.leads.areas}
            error={show(lead.fieldErrors.workingAreas)}
            errorClassName={errorTone}
          >
            <input
              id={`${formId}-working-areas`}
              name="workingAreas"
              placeholder={t.leads.areasPlaceholder}
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
            label={t.leads.equipment}
            error={show(lead.fieldErrors.equipment)}
            errorClassName={errorTone}
          >
            <textarea
              id={`${formId}-equipment`}
              name="equipment"
              rows={3}
              placeholder={t.leads.equipmentPlaceholder}
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
            label={t.leads.experience}
            error={show(lead.fieldErrors.experience)}
            errorClassName={errorTone}
          >
            <textarea
              id={`${formId}-experience`}
              name="experience"
              rows={3}
              placeholder={t.leads.experiencePlaceholder}
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
            label={t.leads.availability}
            error={show(lead.fieldErrors.availability)}
            errorClassName={errorTone}
          >
            <input
              id={`${formId}-availability`}
              name="availability"
              placeholder={t.leads.availabilityPlaceholder}
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
            <legend className="text-sm font-medium">{t.leads.specialties}</legend>
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
                  {t.services.items[option.value].title}
                </label>
              ))}
            </div>
            {lead.fieldErrors.specialties ? (
              <p id={`${formId}-specialties-error`} className={`mt-2 text-sm ${errorTone}`}>
                {show(lead.fieldErrors.specialties)}
              </p>
            ) : null}
          </fieldset>
          <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
            <Field
              id={`${formId}-rate`}
              label={t.leads.rate}
              error={show(lead.fieldErrors.hourlyRate)}
              errorClassName={errorTone}
            >
              <input
                id={`${formId}-rate`}
                name="hourlyRate"
                inputMode="decimal"
                placeholder={t.leads.ratePlaceholder}
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
              label={t.leads.currency}
              error={show(lead.fieldErrors.currency)}
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
            label={t.leads.portfolio}
            error={show(lead.fieldErrors.portfolio)}
            errorClassName={errorTone}
          >
            <input
              id={`${formId}-portfolio`}
              name="portfolio"
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder={t.leads.portfolioPlaceholder}
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
            label={t.leads.portfolioMore}
            error={show(lead.fieldErrors.portfolio2)}
            errorClassName={errorTone}
          >
            <input
              id={`${formId}-portfolio-2`}
              name="portfolio2"
              type="text"
              inputMode="url"
              placeholder={t.leads.portfolioPlaceholder}
              value={portfolio2}
              onChange={(event) => setPortfolio2(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.portfolio2)}
              aria-describedby={lead.fieldErrors.portfolio2 ? `${formId}-portfolio-2-error` : undefined}
            />
          </Field>
          <Field
            id={`${formId}-portfolio-3`}
            label={t.leads.portfolioMore}
            error={show(lead.fieldErrors.portfolio3)}
            errorClassName={errorTone}
          >
            <input
              id={`${formId}-portfolio-3`}
              name="portfolio3"
              type="text"
              inputMode="url"
              placeholder={t.leads.portfolioPlaceholder}
              value={portfolio3}
              onChange={(event) => setPortfolio3(event.target.value)}
              className={fieldClass}
              aria-invalid={Boolean(lead.fieldErrors.portfolio3)}
              aria-describedby={lead.fieldErrors.portfolio3 ? `${formId}-portfolio-3-error` : undefined}
            />
          </Field>
          {lead.formError ? (
            <p role="alert" className="text-sm text-[#f3c7b6]">
              {show(lead.formError)}
            </p>
          ) : null}
          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-foam px-6 text-base font-medium text-ink hover:bg-sand disabled:opacity-60 sm:w-auto"
            disabled={lead.status === 'submitting'}
          >
            {lead.status === 'submitting' ? t.leads.sending : t.leads.submit}
          </button>
          <noscript>
            <p className={`text-sm ${quiet}`}>
              {t.leads.noscript}
            </p>
          </noscript>
        </form>
      )}
    </article>
  )
}
