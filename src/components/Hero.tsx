import { appsAreLive } from '../content/photographerOffer.ts'
import { AppDownloads } from './AppDownloads.tsx'

export function Hero() {
  return (
    <section className="grid lg:min-h-[calc(100svh-7.5rem)] lg:grid-cols-2">
      <div className="order-2 flex flex-col justify-center px-5 py-12 sm:px-10 lg:order-1 lg:px-14 lg:py-16 xl:px-20">
        <p className="text-xs font-medium tracking-[0.18em] text-clay uppercase">
          Early access · On-demand travel photography
        </p>
        <h1 className="mt-5 max-w-xl text-[2.7rem] text-ink sm:text-6xl lg:text-[4.1rem]">
          Your Trip Deserves More Than Selfies.
        </h1>
        <p className="mt-6 max-w-lg text-lg text-muted sm:text-xl">
          Find local photographers wherever you travel. From spontaneous snapshots to professional
          shoots, capture your best moments effortlessly.
        </p>
        <div className="mt-8">
          <a
            href="#photographers"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 text-base font-medium text-foam hover:bg-sea"
          >
            Join as a Photographer
          </a>
        </div>
        <p className="mt-8 max-w-md text-sm text-muted">
          {appsAreLive
            ? 'Travelers find a photographer in the Tripframe apps.'
            : 'Travelers find a photographer in the Tripframe apps. The apps are still being built, so these buttons stay on this page.'}
        </p>
        <div className="mt-4">
          <AppDownloads />
        </div>
      </div>
      <div className="order-1 relative min-h-[46vh] lg:order-2 lg:min-h-full">
        <img
          src="/images/hero-900.webp"
          srcSet="/images/hero-900.webp 900w, /images/hero-1800.webp 1800w"
          sizes="(min-width: 1024px) 50vw, 100vw"
          width={1800}
          height={1200}
          alt="A photographer taking a picture of a traveler in Cappadocia, with hot air balloons overhead"
          decoding="async"
          className="h-full w-full object-cover object-[center_62%]"
        />
      </div>
    </section>
  )
}
