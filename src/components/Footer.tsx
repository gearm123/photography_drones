import { appsAreLive, supportEmail } from '../content/photographerOffer.ts'
import { useLanguage } from '../i18n/LanguageContext.tsx'
import { AppDownloads } from './AppDownloads.tsx'
import { Logo } from './Header.tsx'

export function Footer() {
  const { t } = useLanguage()
  const links = [
    { href: '#why-join', label: t.footer.whyJoin },
    { href: '#pay', label: t.footer.pay },
    { href: '#launch', label: t.footer.cities },
    { href: '#onboarding', label: t.footer.onboarding },
    { href: '#faq', label: t.footer.faq },
    { href: '#support', label: t.footer.support },
    { href: '#photographers', label: t.footer.apply },
    { href: '/privacy/', label: t.footer.privacy },
    { href: '/admin', label: t.footer.leads },
  ]

  return (
    <footer className="bg-ink px-5 py-14 text-foam sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo tone="foam" />
          <p className="mt-4 max-w-sm text-sm text-foam/75">{t.footer.blurb}</p>
        </div>
        <nav aria-label={t.footer.nav}>
          <p className="text-xs font-medium tracking-[0.16em] text-foam/50 uppercase">{t.footer.explore}</p>
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
          <p className="text-xs font-medium tracking-[0.16em] text-foam/50 uppercase">{t.footer.contact}</p>
          <p className="mt-4 text-sm text-foam/85">
            <a href={`mailto:${supportEmail}`} className="underline decoration-foam/30 underline-offset-4">
              {supportEmail}
            </a>
          </p>
          <p className="mt-2 text-sm text-foam/70">
            <a href="#support" className="underline decoration-foam/30 underline-offset-4">
              {t.footer.supportLink}
            </a>
          </p>
          <p className="mt-6 text-xs font-medium tracking-[0.16em] text-foam/50 uppercase">{t.footer.getApp}</p>
          <div className="mt-4">
            <AppDownloads tone="foam" />
          </div>
          <p className="mt-3 text-sm text-foam/70">{appsAreLive ? t.footer.appsLive : t.footer.appsSoon}</p>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-xs text-foam/50">{t.footer.legal}</p>
    </footer>
  )
}
