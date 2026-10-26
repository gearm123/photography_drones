import { appsAreLive, supportEmail } from '../content/photographerOffer.ts'
import { AppDownloads } from './AppDownloads.tsx'
import { Logo } from './Header.tsx'

const links = [
  { href: '#why-join', label: 'Why join' },
  { href: '#pay', label: 'Pay and commission' },
  { href: '#launch', label: 'Launch cities' },
  { href: '#onboarding', label: 'Onboarding' },
  { href: '#faq', label: 'FAQ' },
  { href: '#support', label: 'Support' },
  { href: '#photographers', label: 'Apply' },
  { href: '/privacy/', label: 'Privacy policy' },
  { href: '/admin', label: 'Leads' },
]

export function Footer() {
  return (
    <footer className="bg-ink px-5 py-14 text-foam sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo tone="foam" />
          <p className="mt-4 max-w-sm text-sm text-foam/75">
            Travelers find a photographer in the Tripframe apps. Photographers apply on this website.
            Booking is not live yet.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="text-xs font-medium tracking-[0.16em] text-foam/50 uppercase">Explore</p>
          <ul className="mt-4 space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-sm text-foam/85 hover:text-foam">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-foam/50 uppercase">Contact</p>
          <p className="mt-4 text-sm text-foam/85">
            <a href={`mailto:${supportEmail}`} className="underline decoration-foam/30 underline-offset-4">
              {supportEmail}
            </a>
          </p>
          <p className="mt-2 text-sm text-foam/70">
            <a href="#support" className="underline decoration-foam/30 underline-offset-4">
              Photographer support
            </a>
          </p>
          <p className="mt-6 text-xs font-medium tracking-[0.16em] text-foam/50 uppercase">Get the app</p>
          <div className="mt-4">
            <AppDownloads tone="foam" />
          </div>
          <p className="mt-3 text-sm text-foam/70">
            {appsAreLive
              ? 'Download Tripframe for iPhone or Android.'
              : 'The iPhone and Android apps are still being built.'}
          </p>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-xs text-foam/50">
        © 2026 Tripframe. Early-access product. Booking is not live yet. Photographs on this page are from Unsplash.
      </p>
    </footer>
  )
}
