import { commissionPercent, photographerPercent } from '../content/photographerOffer.ts'
import { fill } from '../i18n/locale.ts'
import { translations } from '../i18n/translations.ts'
import type { Locale } from '../i18n/types.ts'
import { SITE_NAME, SITE_ORIGIN, SUPPORT_EMAIL, localeUrl } from './site.ts'

const CITIES = [
  { '@type': 'City', name: 'Lisbon', addressCountry: 'PT' },
  { '@type': 'City', name: 'Cascais', addressCountry: 'PT' },
  { '@type': 'City', name: 'Sintra', addressCountry: 'PT' },
] as const

const organizationId = `${SITE_ORIGIN}/#organization`
const websiteId = `${SITE_ORIGIN}/#website`

export function homeStructuredData(locale: Locale) {
  const t = translations[locale]
  const pageUrl = localeUrl(locale)
  const serviceKeys = ['mobile', 'professional', 'drone', 'hotels'] as const

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: SITE_NAME,
        url: `${SITE_ORIGIN}/`,
        email: SUPPORT_EMAIL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_ORIGIN}/favicon.svg`,
        },
        image: `${SITE_ORIGIN}/images/og.webp`,
        description: t.meta.description,
        areaServed: CITIES,
        contactPoint: {
          '@type': 'ContactPoint',
          email: SUPPORT_EMAIL,
          contactType: 'customer support',
          availableLanguage: ['English', 'Hebrew', 'French', 'Russian'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: SITE_NAME,
        url: `${SITE_ORIGIN}/`,
        description: t.meta.description,
        inLanguage: locale,
        publisher: { '@id': organizationId },
      },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: t.meta.title,
        description: t.meta.description,
        inLanguage: locale,
        isPartOf: { '@id': websiteId },
        about: { '@id': organizationId },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: `${SITE_ORIGIN}/images/og.webp`,
          width: 1200,
          height: 630,
          caption: t.hero.imageAlt,
        },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: SITE_NAME,
            item: pageUrl,
          },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${pageUrl}#services`,
        name: t.services.title,
        itemListElement: serviceKeys.map((key, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: t.services.items[key].title,
          description: t.services.items[key].body,
        })),
      },
      {
        '@type': 'Service',
        '@id': `${SITE_ORIGIN}/#photography`,
        name: t.services.title,
        serviceType: 'Travel photography',
        provider: { '@id': organizationId },
        areaServed: CITIES,
        description: fill(t.program.keepHeading, { keep: photographerPercent, commission: commissionPercent }),
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        url: `${pageUrl}#faq`,
        inLanguage: locale,
        isPartOf: { '@id': `${pageUrl}#webpage` },
        mainEntity: t.program.questions.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  }
}
