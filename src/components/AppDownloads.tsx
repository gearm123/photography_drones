import { appStores, storeUrl } from '../content/photographerOffer.ts'

export function AppDownloads({ tone = 'ink' }: { tone?: 'ink' | 'foam' }) {
  const buttonClass =
    tone === 'foam'
      ? 'border border-white/20 bg-white/10 text-foam hover:bg-white/15'
      : 'border border-ink/15 bg-foam text-ink hover:border-ink/40'
  const detailClass = tone === 'foam' ? 'text-foam/70' : 'text-muted'

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {appStores.map((store) => {
        const href = storeUrl(store.href)
        const className = `inline-flex min-h-14 min-w-44 flex-col items-start justify-center rounded-2xl px-4 py-2 text-left ${buttonClass}`
        const label = href
          ? `${store.detail} on the ${store.name}`
          : `${store.detail} on the ${store.name}. The app is still being built, so this does not open a download.`
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
