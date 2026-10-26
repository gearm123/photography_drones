import type { Locale } from './types.ts'

export const SUPPORTED_LOCALES: Locale[] = ['en', 'he', 'fr', 'ru']

export const LOCALE_OPTIONS = [
  { code: 'en' as const, label: 'EN', aria: 'en' as const },
  { code: 'he' as const, label: 'HE', aria: 'he' as const },
  { code: 'fr' as const, label: 'FR', aria: 'fr' as const },
  { code: 'ru' as const, label: 'RU', aria: 'ru' as const },
]
