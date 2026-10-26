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
if (!appHtml.includes('Your Trip Deserves More Than Selfies.')) {
  throw new Error('Prerendered HTML is missing the headline')
}
if (!appHtml.includes('Join Our Photographer Network') || !appHtml.includes('App Store') || !appHtml.includes('Google Play')) {
  throw new Error('Prerendered HTML is missing the photographer form or the app downloads')
}
if (!appHtml.includes('Why photographers join Tripframe.') || !appHtml.includes('You keep 80%') || !appHtml.includes('Lisbon')) {
  throw new Error('Prerendered HTML is missing the photographer program')
}
if (!appHtml.includes('Photographer questions.') || !appHtml.includes('hello@tripframe.com')) {
  throw new Error('Prerendered HTML is missing photographer support')
}
if (appHtml.includes('Get Early Access') || appHtml.includes('id="travelers"')) {
  throw new Error('Prerendered HTML still includes the traveler signup form')
}

writeFileSync(distIndex, template.replace('<!--app-html-->', appHtml))
console.log('Prerendered dist/index.html')
