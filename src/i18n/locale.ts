import type { Locale } from './types.ts'
import { SUPPORTED_LOCALES } from './locales.ts'

export const LOCALE_STORAGE_KEY = 'tripframe-locale'
const LOCALE_EXPLICIT_KEY = 'tripframe-locale-explicit'

const DEFAULT_LOCALE: Locale = 'en'

function isLocale(value: string | null): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

/** Resolves locale from an explicit user choice, otherwise English. */
export function readInitialLocale(): Locale {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_LOCALE
    const explicit = localStorage.getItem(LOCALE_EXPLICIT_KEY) === '1'
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (explicit && isLocale(stored)) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

export function persistLocaleChoice(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    localStorage.setItem(LOCALE_EXPLICIT_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function fill(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ''))
}

export function getDir(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'he' ? 'rtl' : 'ltr'
}
