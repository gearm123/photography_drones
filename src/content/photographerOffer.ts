export const supportEmail = 'hello@tripframe.com'

export const commissionPercent = 20
export const photographerPercent = 100 - commissionPercent

export const launchLocations = ['Lisbon', 'Cascais', 'Sintra'] as const

export const appStores = [
  { name: 'App Store', detail: 'Download for iPhone', href: '' },
  { name: 'Google Play', detail: 'Download for Android', href: '' },
] as const

export function storeUrl(href: string): string | null {
  try {
    const url = new URL(href)
    if (url.protocol !== 'https:') return null
    return url.href
  } catch {
    return null
  }
}

export const appsAreLive = appStores.every((store) => storeUrl(store.href))
