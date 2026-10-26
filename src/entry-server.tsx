import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageContext.tsx'
import type { Locale } from './i18n/types.ts'
import { seoHead } from './seo/documentHead.ts'
import { htmlTag } from './seo/site.ts'

export function render(locale: Locale = 'en') {
  return renderToString(
    <StrictMode>
      <LanguageProvider initialLocale={locale}>
        <App />
      </LanguageProvider>
    </StrictMode>,
  )
}

export { htmlTag, seoHead }
