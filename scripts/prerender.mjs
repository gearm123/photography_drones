import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const distIndex = path.resolve('dist/index.html')
const serverEntry = path.resolve('dist-server/entry-server.js')
const template = readFileSync(distIndex, 'utf8')

if (!template.includes('<!--app-html-->') || !template.includes('<!--seo:start-->') || !template.includes('<!--seo:end-->')) {
  throw new Error('Prerender placeholders missing from dist/index.html')
}

const { render, seoHead, htmlTag } = await import(pathToFileURL(serverEntry).href)

function applyHead(html, kind) {
  return html
    .replace('<html lang="en">', htmlTag(kind))
    .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n${seoHead(kind)}\n    <!--seo:end-->`)
}

function page(kind) {
  const body = kind === 'admin' ? '' : render(kind).replace(/<link rel="preload" as="image"[^>]*>/g, '')
  let html = applyHead(template, kind).replace('<!--app-html-->', body)
  if (kind === 'admin') html = html.replace(/<link rel="preload" as="image"[\s\S]*?\/>\s*/g, '')
  return html
}

const english = page('en')
const visible = english.replaceAll('<!-- -->', '')
if (!visible.includes('Your Trip Deserves More Than Selfies.')) {
  throw new Error('Prerendered HTML is missing the headline')
}
if (!visible.includes('Join Our Photographer Network') || !visible.includes('App Store') || !visible.includes('Google Play')) {
  throw new Error('Prerendered HTML is missing the photographer form or the app downloads')
}
if (!visible.includes('Why photographers join Tripframe.') || !visible.includes('You keep 80%') || !visible.includes('Lisbon')) {
  throw new Error('Prerendered HTML is missing the photographer program')
}
if (!visible.includes('Photographer questions.') || !visible.includes('hello@tripframe.com')) {
  throw new Error('Prerendered HTML is missing photographer support')
}
if (visible.includes('Get Early Access') || visible.includes('id="travelers"')) {
  throw new Error('Prerendered HTML still includes the traveler signup form')
}
if (!visible.includes('Language selection') || !visible.includes('>EN<') || !visible.includes('href="/he/"') || !visible.includes('href="/fr/"') || !visible.includes('href="/ru/"')) {
  throw new Error('Prerendered HTML is missing the language links')
}
if (!visible.includes('rel="canonical" href="https://tripframe.netlify.app/"') || !visible.includes('"@type":"FAQPage"') || !visible.includes('hreflang="x-default"')) {
  throw new Error('Prerendered HTML is missing search metadata')
}

writeFileSync(distIndex, english)

for (const locale of ['he', 'fr', 'ru']) {
  const html = page(locale)
  if (!html.includes(`lang="${locale}"`) || !html.includes('"@type":"FAQPage"') || !html.includes(`hreflang="${locale}"`)) {
    throw new Error(`Prerendered ${locale} page is missing search metadata`)
  }
  const directory = path.resolve('dist', locale)
  mkdirSync(directory, { recursive: true })
  writeFileSync(path.join(directory, 'index.html'), html)
}

const admin = page('admin')
if (!admin.includes('noindex, nofollow') || admin.includes('Your Trip Deserves More Than Selfies.')) {
  throw new Error('Admin page is still indexable or still contains the public homepage')
}
mkdirSync(path.resolve('dist/admin'), { recursive: true })
writeFileSync(path.resolve('dist/admin/index.html'), admin)

const privacy = readFileSync(path.resolve('dist/privacy/index.html'), 'utf8')
if (!privacy.includes('WebPage') || !privacy.includes('BreadcrumbList') || !privacy.includes('rel="canonical" href="https://tripframe.netlify.app/privacy/"')) {
  throw new Error('Privacy page is missing search metadata')
}
const sitemap = readFileSync(path.resolve('dist/sitemap.xml'), 'utf8')
for (const url of [
  'https://tripframe.netlify.app/',
  'https://tripframe.netlify.app/he/',
  'https://tripframe.netlify.app/fr/',
  'https://tripframe.netlify.app/ru/',
  'https://tripframe.netlify.app/privacy/',
]) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) throw new Error(`Sitemap is missing ${url}`)
}
if (sitemap.includes('/admin')) throw new Error('Sitemap includes the admin page')

console.log('Prerendered dist/index.html, language pages, and admin')
