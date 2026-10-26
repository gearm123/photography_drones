import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { localePath, localeUrl, ogLocale } from '../seo/site.ts'
import { fill, getDir, persistLocaleChoice } from './locale.ts'
import { translations, type Copy } from './translations.ts'
import type { Locale } from './types.ts'

type LanguageContextValue = {
  locale: Locale
  dir: 'ltr' | 'rtl'
  setLocale: (locale: Locale) => void
  t: Copy
  fill: typeof fill
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ initialLocale = 'en', children }: { initialLocale?: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((next: Locale) => {
    persistLocaleChoice(next)
    const nextPath = localePath(next)
    const current = window.location.pathname.replace(/\/+$/, '') || '/'
    if (current !== nextPath.replace(/\/+$/, '')) {
      window.location.assign(nextPath)
      return
    }
    setLocaleState(next)
  }, [])

  const dir = getDir(locale)
  const t = translations[locale]

  useEffect(() => {
    const url = localeUrl(locale)
    document.documentElement.lang = locale
    document.documentElement.dir = dir
    document.title = t.meta.title
    setMeta('meta[name="description"]', 'content', t.meta.description)
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[property="og:title"]', 'content', t.meta.title)
    setMeta('meta[property="og:description"]', 'content', t.meta.description)
    setMeta('meta[property="og:locale"]', 'content', ogLocale(locale))
    setMeta('meta[property="og:image:alt"]', 'content', t.hero.imageAlt)
    setMeta('meta[name="twitter:title"]', 'content', t.meta.title)
    setMeta('meta[name="twitter:description"]', 'content', t.meta.description)
  }, [locale, dir, t])

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, dir, setLocale, t, fill }),
    [locale, dir, setLocale, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

function setMeta(selector: string, attribute: string, value: string) {
  document.querySelector(selector)?.setAttribute(attribute, value)
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
