import type { Locale } from '../i18n/types.ts'

/** Public site origin. Replace this when Tripframe has its own domain. */
export const SITE_ORIGIN = 'https://tripframe.netlify.app'

export const SITE_NAME = 'Tripframe'
export const SUPPORT_EMAIL = 'hello@tripframe.com'

export const INDEXABLE_LOCALES = ['en', 'he', 'fr', 'ru'] as const satisfies readonly Locale[]

const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  he: 'he_IL',
  fr: 'fr_FR',
  ru: 'ru_RU',
}

export function localePath(locale: Locale): string {
  return locale === 'en' ? '/' : `/${locale}/`
}

export function localeUrl(locale: Locale): string {
  return new URL(localePath(locale), `${SITE_ORIGIN}/`).href
}

export function localeFromPath(pathname: string): Locale {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/he' || path === '/fr' || path === '/ru') return path.slice(1) as Locale
  return 'en'
}

export function ogLocale(locale: Locale): string {
  return OG_LOCALE[locale]
}

export function htmlTag(kind: Locale | 'admin'): string {
  if (kind === 'admin') return '<html lang="en" class="admin-route">'
  const dir = kind === 'he' ? 'rtl' : 'ltr'
  return `<html lang="${kind}" dir="${dir}">`
}
