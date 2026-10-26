import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const distIndex = path.resolve('dist/index.html')
const serverEntry = path.resolve('dist-server/entry-server.js')
const template = readFileSync(distIndex, 'utf8')

if (!template.includes('<!--app-html-->')) {
  throw new Error('Prerender placeholder missing from dist/index.html')
}

const { render } = await import(pathToFileURL(serverEntry).href)
const appHtml = render().replace(/<link rel="preload" as="image"[^>]*>/g, '')
const visible = appHtml.replaceAll('<!-- -->', '')
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

writeFileSync(distIndex, template.replace('<!--app-html-->', appHtml))
console.log('Prerendered dist/index.html')
