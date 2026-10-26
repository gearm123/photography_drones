import { en, type Copy } from './en.ts'
import { fr } from './fr.ts'
import { he } from './he.ts'
import { ru } from './ru.ts'
import type { Locale } from './types.ts'

export const translations: Record<Locale, Copy> = { en, he, fr, ru }

export function translateError(errors: Copy['errors'], message: string | undefined): string | undefined {
  if (!message) return undefined
  return message in errors ? errors[message as keyof Copy['errors']] : message
}

export type { Copy }
