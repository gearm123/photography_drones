import { useLanguage } from '../i18n/LanguageContext.tsx'
import { Eyebrow, Reveal } from './Reveal.tsx'

const images = {
  mobile: '/images/service-mobile.webp',
  professional: '/images/service-professional.webp',
  drone: '/images/service-drone.webp',
  hotels: '/images/service-hotel.webp',
} as const

export function Services() {
  const { t } = useLanguage()
  const items = [
    ['mobile', images.mobile],
    ['professional', images.professional],
    ['drone', images.drone],
    ['hotels', images.hotels],
  ] as const

  return (
    <section id="services" className="scroll-mt-24 bg-sand/70 px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-6xl">
        <Eyebrow>{t.services.eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-2xl text-4xl sm:text-5xl">{t.services.title}</h2>
        <p className="mt-5 max-w-2xl text-muted">{t.services.intro}</p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {items.map(([key, image]) => {
            const service = t.services.items[key]
            return (
              <li key={key}>
                <article className="flex h-full flex-col overflow-hidden rounded-[1.7rem] bg-foam shadow-[0_24px_50px_-36px_rgba(26,24,20,0.7)]">
                  <img
                    src={image}
                    width={900}
                    height={1125}
                    alt={service.alt}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/5] w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-[1.65rem]">{service.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{service.body}</p>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </Reveal>
    </section>
  )
}
