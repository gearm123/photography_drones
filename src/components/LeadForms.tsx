import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useLanguage } from '../i18n/LanguageContext.tsx'
import { translateError } from '../i18n/translations.ts'
import { serviceOptions, validatePhotographer, type FieldErrors } from '../lib/leadRules.ts'
import {
  availabilityOptions,
  equipmentOptions,
  experienceOptions,
  israelCities,
  rateOptions,
  type IsraelCity,
} from '../lib/photographerChoices.ts'
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
      }
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
  const [workingAreas, setWorkingAreas] = useState<string[]>([])
  const [hourlyRate, setHourlyRate] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [portfolio, setPortfolio] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)

  function toggleSpecialty(value: string) {
    setSpecialties((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
  }

  function toggleArea(value: string) {
    setWorkingAreas((current) =>
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
      workingAreas: workingAreas.join(', '),
      hourlyRate,
      currency: hourlyRate ? 'ILS' : '',
      specialties,
      portfolios: [portfolio],
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
        hourlyRate: result.value.hourlyRateCents == null ? '' : (result.value.hourlyRateCents / 100).toFixed(2),
        currency: result.value.currency ?? '',
        specialties: result.value.specialties,
        portfolios: result.value.portfolioUrls,
      },
      website,
    )
  }

  useEffect(() => {
    if (lead.status !== 'error') return
    alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [lead.status, lead.formError, lead.fieldErrors])

  const quiet = 'text-foam/75'
  const errorTone = 'text-base font-semibold text-[#ffd7cc]'
  const show = (message?: string) => translateError(t.errors, message)
  const controlClass = (invalid: boolean) =>
    invalid
      ? 'mt-2 w-full rounded-2xl border-2 border-[#ff8f73] bg-[#fff4f0] px-4 py-3 text-base text-ink outline-none ring-2 ring-[#ff8f73]'
      : fieldClass
  const fieldLabel = (key: string) => {
    const labels: Record<string, string> = {
      name: t.leads.name,
      email: t.leads.email,
      phone: t.leads.phone,
      location: t.leads.location,
      specialties: t.leads.specialties,
      workingAreas: t.leads.areas,
      equipment: t.leads.equipment,
      experience: t.leads.experience,
      availability: t.leads.availability,
      hourlyRate: t.leads.rate,
      currency: t.leads.currency,
      portfolio: t.leads.portfolio,
      portfolio2: t.leads.portfolioMore,
      portfolio3: t.leads.portfolioMore,
    }
    return labels[key] ?? key
  }
  const problems = Object.entries(lead.fieldErrors).flatMap(([key, message]) =>
    message ? [{ key, label: fieldLabel(key), message: show(message) ?? message }] : [],
  )
  const cityName = (value: string) => (value in t.leads.cityNames ? t.leads.cityNames[value as IsraelCity] : value)
  const thanks = fill(t.leads.success, { name: name.trim(), location: cityName(location) })

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
          {lead.status === 'error' ? (
            <div ref={alertRef} role="alert" className="rounded-2xl border-2 border-[#ff8f73] bg-[#4a2420] px-4 py-4 text-[#ffe8e1]">
              <p className="text-lg font-semibold">{t.leads.couldNotSave}</p>
              {problems.length > 0 ? (
                <>
                  <p className="mt-2 text-sm">{t.leads.fixThese}</p>
                  <ul className="mt-2 list-disc space-y-1 ps-5 text-base">
                    {problems.map((problem) => (
                      <li key={problem.key}>
                        <span className="font-semibold">{problem.label}:</span> {problem.message}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-2 text-base">{show(lead.formError)}</p>
              )}
            </div>
          ) : null}
          <Field id={`${formId}-name`} label={t.leads.name} error={show(lead.fieldErrors.name)} errorClassName={errorTone}>
            <input
              id={`${formId}-name`}
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={controlClass(Boolean(lead.fieldErrors.name))}
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
              className={controlClass(Boolean(lead.fieldErrors.email))}
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
              className={controlClass(Boolean(lead.fieldErrors.phone))}
              aria-invalid={Boolean(lead.fieldErrors.phone)}
              aria-describedby={lead.fieldErrors.phone ? `${formId}-phone-error` : undefined}
              required
            />
          </Field>
          <Field id={`${formId}-location`} label={t.leads.location} error={show(lead.fieldErrors.location)} errorClassName={errorTone}>
            <select
              id={`${formId}-location`}
              name="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className={controlClass(Boolean(lead.fieldErrors.location))}
              aria-invalid={Boolean(lead.fieldErrors.location)}
              aria-describedby={lead.fieldErrors.location ? `${formId}-location-error` : undefined}
              required
            >
              <option value="">{t.leads.chooseCity}</option>
              {israelCities.map((city) => (
                <option key={city} value={city}>
                  {cityName(city)}
                </option>
              ))}
            </select>
          </Field>
          <fieldset
            aria-invalid={Boolean(lead.fieldErrors.specialties)}
            aria-describedby={lead.fieldErrors.specialties ? `${formId}-specialties-error` : undefined}
            className={lead.fieldErrors.specialties ? 'rounded-2xl border-2 border-[#ff8f73] p-3' : undefined}
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
          <div className="border-t border-white/10 pt-5">
            <p className={`text-sm ${quiet}`}>{t.leads.optionalIntro}</p>
          </div>
          <fieldset aria-describedby={lead.fieldErrors.workingAreas ? `${formId}-areas-error` : undefined}>
            <legend className="text-sm font-medium">{t.leads.areas}</legend>
            <p className={`mt-1 text-sm ${quiet}`}>{t.leads.areasHint}</p>
            <div className="mt-2 grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
              {israelCities.map((city) => (
                <label key={city} className="flex min-h-11 items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm">
                  <input
                    type="checkbox"
                    name="workingAreas"
                    value={city}
                    checked={workingAreas.includes(city)}
                    onChange={() => toggleArea(city)}
                    className="size-4 accent-sea"
                  />
                  {cityName(city)}
                </label>
              ))}
            </div>
            {lead.fieldErrors.workingAreas ? (
              <p id={`${formId}-areas-error`} className={`mt-2 text-sm ${errorTone}`}>
                {show(lead.fieldErrors.workingAreas)}
              </p>
            ) : null}
          </fieldset>
          <Field id={`${formId}-equipment`} label={t.leads.equipment} error={show(lead.fieldErrors.equipment)} errorClassName={errorTone}>
            <select id={`${formId}-equipment`} name="equipment" value={equipment} onChange={(event) => setEquipment(event.target.value)} className={fieldClass}>
              <option value="">{t.leads.skip}</option>
              {equipmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t.leads.equipmentOptions[option.value]}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${formId}-experience`} label={t.leads.experience} error={show(lead.fieldErrors.experience)} errorClassName={errorTone}>
            <select id={`${formId}-experience`} name="experience" value={experience} onChange={(event) => setExperience(event.target.value)} className={fieldClass}>
              <option value="">{t.leads.skip}</option>
              {experienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t.leads.experienceOptions[option.value]}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${formId}-availability`} label={t.leads.availability} error={show(lead.fieldErrors.availability)} errorClassName={errorTone}>
            <select id={`${formId}-availability`} name="availability" value={availability} onChange={(event) => setAvailability(event.target.value)} className={fieldClass}>
              <option value="">{t.leads.skip}</option>
              {availabilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t.leads.availabilityOptions[option.value]}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${formId}-rate`} label={t.leads.rate} error={show(lead.fieldErrors.hourlyRate)} errorClassName={errorTone}>
            <select id={`${formId}-rate`} name="hourlyRate" value={hourlyRate} onChange={(event) => setHourlyRate(event.target.value)} className={fieldClass}>
              <option value="">{t.leads.skip}</option>
              {rateOptions.map((amount) => (
                <option key={amount} value={String(amount)}>
                  ₪{amount}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${formId}-portfolio`} label={t.leads.portfolio} error={show(lead.fieldErrors.portfolio)} errorClassName={errorTone}>
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
            />
          </Field>
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
