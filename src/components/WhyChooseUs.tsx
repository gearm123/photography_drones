import { useLanguage } from '../i18n/LanguageContext.tsx'
import { Eyebrow, Reveal } from './Reveal.tsx'

export function WhyChooseUs() {
  const { t } = useLanguage()

  return (
    <section id="why" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <figure className="overflow-hidden rounded-[1.7rem]">
          <img
            src="/images/why.webp"
            width={1200}
            height={1500}
            alt={t.why.imageAlt}
            loading="lazy"
            decoding="async"
            className="aspect-[4/5] w-full object-cover object-center sm:aspect-[5/4] lg:aspect-[4/5]"
          />
        </figure>
        <div>
          <Eyebrow>{t.why.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-4xl sm:text-5xl">{t.why.title}</h2>
          <p className="mt-5 max-w-xl text-muted">{t.why.intro}</p>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2">
            {t.why.reasons.map((reason) => (
              <li key={reason.title}>
                <h3 className="text-2xl">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{reason.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}
