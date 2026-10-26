import type { CSSProperties } from 'react'
import { LOCALE_OPTIONS } from '../i18n/locales.ts'
import { useLanguage } from '../i18n/LanguageContext.tsx'
import { localePath } from '../seo/site.ts'

export function LanguageToggle() {
  const { locale, t } = useLanguage()
  const activeIndex = LOCALE_OPTIONS.findIndex((option) => option.code === locale)

  return (
    <div className="lang-toggle">
      <div
        className="lang-toggle__track"
        role="group"
        aria-label={t.lang.groupAria}
        style={{ '--lang-index': activeIndex } as CSSProperties}
      >
        <span className="lang-toggle__thumb" aria-hidden="true" />
        {LOCALE_OPTIONS.map((option) => (
          <a
            key={option.code}
            href={localePath(option.code)}
            hrefLang={option.code}
            className={locale === option.code ? 'lang-toggle__option lang-toggle__option--active' : 'lang-toggle__option'}
            aria-label={t.lang[option.aria]}
            aria-current={locale === option.code ? 'true' : undefined}
          >
            {option.label}
          </a>
        ))}
      </div>
    </div>
  )
}
