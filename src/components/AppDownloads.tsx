import { appStores, storeUrl } from '../content/photographerOffer.ts'
import { useLanguage } from '../i18n/LanguageContext.tsx'

export function AppDownloads({ tone = 'ink' }: { tone?: 'ink' | 'foam' }) {
  const { t, fill } = useLanguage()
  const buttonClass =
    tone === 'foam'
      ? 'border border-white/20 bg-white/10 text-foam hover:bg-white/15'
      : 'border border-ink/15 bg-foam text-ink hover:border-ink/40'
  const detailClass = tone === 'foam' ? 'text-foam/70' : 'text-muted'
  const stores = [
    { href: appStores[0].href, detail: t.stores.iphone, name: t.stores.appStore },
    { href: appStores[1].href, detail: t.stores.android, name: t.stores.googlePlay },
  ]

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {stores.map((store) => {
        const href = storeUrl(store.href)
        const className = `inline-flex min-h-14 min-w-44 flex-col items-start justify-center rounded-2xl px-4 py-2 text-start ${buttonClass}`
        const label = fill(href ? t.stores.ariaLive : t.stores.ariaSoon, { detail: store.detail, name: store.name })
        const content = (
          <>
            <span className={`text-[0.7rem] tracking-[0.12em] uppercase ${detailClass}`}>{store.detail}</span>
            <span className="text-base font-medium">{store.name}</span>
          </>
        )
        if (!href) {
          return (
            <button key={store.name} type="button" className={className} aria-label={label}>
              {content}
            </button>
          )
        }
        return (
          <a key={store.name} href={href} className={className} aria-label={label} target="_blank" rel="noreferrer">
            {content}
          </a>
        )
      })}
    </div>
  )
}
