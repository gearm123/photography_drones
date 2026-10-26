import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.tsx'

export function Logo({ tone = 'ink' }: { tone?: 'ink' | 'foam' }) {
  const color = tone === 'foam' ? '#fffcf8' : '#1a1814'
  return (
    <a href="#top" className="inline-flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="11" fill="none" stroke={color} strokeWidth="1.6" />
        <circle cx="16" cy="16" r="3" fill={color} />
      </svg>
      <span className={`font-display text-[1.35rem] tracking-tight ${tone === 'foam' ? 'text-foam' : 'text-ink'}`}>
        Tripframe
      </span>
    </a>
  )
}

export function Header() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const links = [
    { href: '#how-it-works', label: t.header.how },
    { href: '#services', label: t.header.services },
    { href: '#why-join', label: t.header.photographers },
    { href: '#faq', label: t.header.faq },
    { href: '#support', label: t.header.support },
  ]

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="header-safe mx-auto flex max-w-6xl items-center justify-between gap-4 py-3.5">
        <Logo />
        <nav aria-label={t.header.nav} className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-muted hover:text-ink">
              {link.label}
            </a>
          ))}
          <a
            href="#photographers"
            className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-medium text-foam hover:bg-sea"
          >
            {t.header.join}
          </a>
        </nav>
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-medium lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? t.header.close : t.header.menu}
        </button>
      </div>
      {open ? (
        <nav id="mobile-nav" aria-label={t.header.mobile} className="border-t border-line px-5 py-4 lg:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-xl px-3 py-3 text-base hover:bg-sand"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#photographers"
                className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-4 text-sm font-medium text-foam"
                onClick={() => setOpen(false)}
              >
                {t.header.join}
              </a>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
