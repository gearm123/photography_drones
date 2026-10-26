import { appsAreLive, commissionPercent, photographerPercent, supportEmail } from '../content/photographerOffer.ts'
import { useLanguage } from '../i18n/LanguageContext.tsx'
import { serviceOptions } from '../lib/leadRules.ts'
import { AppDownloads } from './AppDownloads.tsx'
import { Eyebrow, Reveal } from './Reveal.tsx'

export function PhotographerProgram() {
  const { t, fill } = useLanguage()
  const share = { keep: photographerPercent, commission: commissionPercent }
  const steps = [
    ...t.program.steps,
    {
      title: appsAreLive ? t.program.stepLiveTitle : t.program.stepSoonTitle,
      body: appsAreLive ? t.program.stepLiveBody : t.program.stepSoonBody,
    },
  ]

  return (
    <section id="why-join" className="scroll-mt-24 border-t border-line px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-6xl">
        <Eyebrow>{t.program.eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-3xl text-4xl sm:text-5xl">{t.program.title}</h2>
        <p className="mt-5 max-w-2xl text-muted">{t.program.intro}</p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {t.program.reasons.map((reason) => (
            <li key={reason.title} className="rounded-[1.4rem] border border-line bg-foam p-6">
              <h3 className="text-2xl">{reason.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{reason.body}</p>
            </li>
          ))}
        </ul>

        <div id="pay" className="mt-20 scroll-mt-28">
          <Eyebrow>{t.program.payEyebrow}</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-4xl sm:text-5xl">{fill(t.program.keepHeading, share)}</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4 text-muted">
              <p>{fill(t.program.payBody, share)}</p>
              <p>{t.program.payBody2}</p>
            </div>
            <aside className="rounded-[1.4rem] bg-ink p-6 text-foam">
              <p className="text-xs font-medium tracking-[0.16em] text-foam/60 uppercase">{t.program.example}</p>
              <p className="mt-4 font-display text-3xl">{t.program.session}</p>
              <p className="mt-3 text-sm text-foam/80">{t.program.sessionDetail}</p>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt>{fill(t.program.tripframeShare, share)}</dt>
                  <dd>{t.program.tripframeAmount}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-white/15 pt-3 text-base">
                  <dt>{fill(t.program.youReceive, share)}</dt>
                  <dd>{t.program.youAmount}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>

        <div id="launch" className="mt-20 scroll-mt-28">
          <Eyebrow>{t.program.launchEyebrow}</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-4xl sm:text-5xl">{t.program.launchTitle}</h2>
          <p className="mt-5 max-w-2xl text-muted">{t.program.launchIntro}</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-2xl">{t.program.locationsTitle}</h3>
              <ul className="mt-4 space-y-3">
                {t.program.cities.map((city) => (
                  <li key={city} className="rounded-2xl border border-line bg-foam px-4 py-3">
                    {city}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-2xl">{t.program.specialtiesTitle}</h3>
              <ul className="mt-4 space-y-3">
                {serviceOptions.map((service) => (
                  <li key={service.value} className="rounded-2xl border border-line bg-foam px-4 py-3">
                    {t.services.items[service.value].title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div id="onboarding" className="mt-20 scroll-mt-28">
          <Eyebrow>{t.program.onboardingEyebrow}</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-4xl sm:text-5xl">{t.program.onboardingTitle}</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-2">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t border-ink/15 pt-5">
                <p className="font-display text-3xl text-sea">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-3 text-2xl">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div id="faq" className="mt-20 scroll-mt-28">
          <Eyebrow>{t.program.faqEyebrow}</Eyebrow>
          <h2 className="mt-4 text-4xl sm:text-5xl">{t.program.faqTitle}</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {t.program.questions.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="cursor-pointer text-lg font-medium">{item.question}</summary>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div id="support" className="mt-20 scroll-mt-28">
          <Eyebrow>{t.program.supportEyebrow}</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-4xl sm:text-5xl">{t.program.supportTitle}</h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-muted">{t.program.supportBody}</p>
              <a
                href={`mailto:${supportEmail}?subject=${encodeURIComponent(t.program.supportSubject)}`}
                className="mt-6 inline-flex min-h-12 items-center rounded-full bg-ink px-6 text-base font-medium text-foam hover:bg-sea"
              >
                {supportEmail}
              </a>
              <p className="mt-4 text-sm text-muted">{t.program.noPhone}</p>
            </div>
            <div>
              <h3 className="text-2xl">{t.program.appsTitle}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{appsAreLive ? t.program.appsLive : t.program.appsSoon}</p>
              <div className="mt-5">
                <AppDownloads />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
