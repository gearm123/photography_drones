import { Eyebrow, Reveal } from './Reveal.tsx'

const services = [
  {
    title: 'Mobile Photography',
    body: 'Affordable travel photos, social media content, and spontaneous sessions.',
    image: '/images/service-mobile.webp',
    alt: 'A traveler with a backpack walking through a narrow city street',
  },
  {
    title: 'Professional Photography',
    body: 'DSLR photography, portraits, couples, families, and edited photos.',
    image: '/images/service-professional.webp',
    alt: 'A couple photographed outdoors in warm evening light',
  },
  {
    title: 'Drone Photography',
    body: 'Aerial photography and scenic travel shots, subject to local regulations.',
    image: '/images/service-drone.webp',
    alt: 'Aerial view of boats along a turquoise shoreline',
  },
  {
    title: 'Hotels & Resorts',
    body: 'Photography services arranged through participating hotels and resorts.',
    image: '/images/service-hotel.webp',
    alt: 'A resort pool at dusk beside a lit pavilion and lounge chairs',
  },
]

export function Services() {
  return (
    <section id="services" className="scroll-mt-24 bg-sand/70 px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-6xl">
        <Eyebrow>Photography services</Eyebrow>
        <h2 className="mt-4 max-w-2xl text-4xl sm:text-5xl">A photographer for the kind of trip you are actually on.</h2>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <li key={service.title}>
              <article className="flex h-full flex-col overflow-hidden rounded-[1.7rem] bg-foam shadow-[0_24px_50px_-36px_rgba(26,24,20,0.7)]">
                <img
                  src={service.image}
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
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
