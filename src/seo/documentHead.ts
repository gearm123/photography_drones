import type { Locale } from '../i18n/types.ts'
import { translations } from '../i18n/translations.ts'
import { INDEXABLE_LOCALES, SITE_ORIGIN, localeUrl, ogLocale } from './site.ts'
import { homeStructuredData } from './structuredData.ts'

function jsonScript(data: unknown): string {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">${json}</script>`
}

function homeHead(locale: Locale): string {
  const t = translations[locale]
  const url = localeUrl(locale)
  const image = `${SITE_ORIGIN}/images/og.webp`
  const alternates = INDEXABLE_LOCALES.filter((code) => code !== locale)
    .map((code) => `    <meta property="og:locale:alternate" content="${ogLocale(code)}" />`)
    .join('\n')
  const languages = [
    ...INDEXABLE_LOCALES.map((code) => `    <link rel="alternate" hreflang="${code}" href="${localeUrl(code)}" />`),
    `    <link rel="alternate" hreflang="x-default" href="${localeUrl('en')}" />`,
  ].join('\n')

  return `    <title>${escapeText(t.meta.title)}</title>
    <meta name="description" content="${escapeAttr(t.meta.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${url}" />
${languages}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Tripframe" />
    <meta property="og:locale" content="${ogLocale(locale)}" />
${alternates}
    <meta property="og:title" content="${escapeAttr(t.meta.title)}" />
    <meta property="og:description" content="${escapeAttr(t.meta.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeAttr(t.hero.imageAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(t.meta.title)}" />
    <meta name="twitter:description" content="${escapeAttr(t.meta.description)}" />
    <meta name="twitter:image" content="${image}" />
    ${jsonScript(homeStructuredData(locale))}`
}

function adminHead(): string {
  return `    <title>Admin — Tripframe</title>
    <meta name="description" content="Sign in to review Tripframe photographer applications." />
    <meta name="robots" content="noindex, nofollow" />`
}

export function seoHead(kind: Locale | 'admin'): string {
  return kind === 'admin' ? adminHead() : homeHead(kind)
}

function escapeAttr(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
}

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
}
