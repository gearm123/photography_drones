import { Logo } from './Header.tsx'

const links = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#services', label: 'Services' },
  { href: '#why', label: 'Why Tripframe' },
  { href: '#travelers', label: 'Find a photographer' },
  { href: '#photographers', label: 'Join as a photographer' },
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
            Tripframe connects travelers with local photographers. Early access is open. Booking is
            not live yet.
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
            <a href="mailto:hello@tripframe.com" className="underline decoration-foam/30 underline-offset-4">
              hello@tripframe.com
            </a>
          </p>
          <p className="mt-3 text-sm text-foam/70">We read every early-access request.</p>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-xs text-foam/50">
        © 2026 Tripframe. Early-access product. Booking is not live yet. Photographs on this page are from Unsplash.
      </p>
    </footer>
  )
}
