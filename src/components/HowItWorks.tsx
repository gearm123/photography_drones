import { useLanguage } from '../i18n/LanguageContext.tsx'
import { Eyebrow, Reveal } from './Reveal.tsx'

export function HowItWorks() {
  const { t } = useLanguage()

  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-line px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-6xl">
        <Eyebrow>{t.how.eyebrow}</Eyebrow>
        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <h2 className="max-w-xl text-4xl sm:text-5xl">{t.how.title}</h2>
          <p className="max-w-sm text-muted">{t.how.intro}</p>
        </div>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {t.how.steps.map((step, index) => (
            <li key={step.title} className="border-t border-ink/15 pt-6">
              <p className="font-display text-3xl text-sea">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-4 text-2xl">{step.title}</h3>
              <p className="mt-3 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  )
}
