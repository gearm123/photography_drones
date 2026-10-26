import assert from 'node:assert/strict'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import adminLeads from '../netlify/functions/admin-leads.ts'
import { handlePublicPhotographers, type QueryDatabase } from '../src/lib/publicPhotographerApi.ts'
import { profileVisibility } from '../src/lib/publicPhotographer.ts'
import { fetchPhotographer, fetchPhotographers, PhotographerApiError } from '../src/mobile/photographerApi.ts'

const privateLead = {
  id: '9',
  name: 'Ada Lens',
  email: 'secret@example.com',
  phone: '+351900000000',
  location: 'Lisbon',
  equipment: 'Secret camera',
  experience: 'Secret years',
  availability: 'Secret nights',
  workingAreas: 'Lisbon and Cascais',
  specialties: ['drone'],
  hourlyRateCents: '7550',
  currency: 'EUR',
  portfolioUrls: ['https://example.com/ada'],
  status: 'pending',
}

const pending = profileVisibility(privateLead)
assert.equal(pending.publish, false)
assert.equal(JSON.stringify(pending).includes('secret@example.com'), false)

const approved = profileVisibility({ ...privateLead, status: 'approved' })
assert.equal(approved.publish, true)
if (approved.publish) {
  assert.equal(approved.active, true)
  assert.equal(approved.profile.name, 'Ada Lens')
  assert.equal(JSON.stringify(approved.profile).includes('secret@example.com'), false)
  assert.equal(JSON.stringify(approved.profile).includes('+351900000000'), false)
}

const suspended = profileVisibility({ ...privateLead, status: 'suspended' })
assert.equal(suspended.publish, true)
if (suspended.publish) assert.equal(suspended.active, false)

const profiles = [
  {
    photographer_id: 1,
    display_name: 'Ada Lens',
    location: 'Lisbon',
    working_areas: 'Lisbon and Cascais',
    specialties: ['drone'],
    hourly_rate_cents: 7550,
    currency: 'EUR',
    portfolio_urls: ['https://example.com/ada'],
    active: true,
    email: 'secret@example.com',
    phone: '+351900000000',
    equipment: 'Secret camera',
    experience: 'Secret years',
    availability: 'Secret nights',
  },
  {
    photographer_id: 2,
    display_name: 'Bo Hidden',
    location: 'Porto',
    working_areas: 'Porto',
    specialties: ['mobile'],
    hourly_rate_cents: 6000,
    currency: 'EUR',
    portfolio_urls: ['https://example.com/bo'],
    active: false,
    email: 'hidden@example.com',
    phone: '+351911111111',
    equipment: 'Hidden body',
    experience: 'Hidden years',
    availability: 'Hidden days',
  },
  {
    photographer_id: 3,
    display_name: 'Cia Frame',
    location: 'Faro',
    working_areas: 'Algarve',
    specialties: ['hotels'],
    hourly_rate_cents: 9000,
    currency: 'EUR',
    portfolio_urls: ['https://example.com/cia'],
    active: true,
    email: 'cia-private@example.com',
    phone: '+351922222222',
    equipment: 'Hotel kit',
    experience: 'Resort years',
    availability: 'Mornings',
  },
]

const queries: string[] = []

const db: QueryDatabase = {
  async sql(strings, ...values) {
    const text = strings.join(' ')
    queries.push(text)
    if (!text.includes('FROM photographer_profiles') || !text.includes('active = true')) {
      throw new Error(`Public query missed the active profile table: ${text}`)
    }
    if (/photographer_leads|\bemail\b|\bphone\b|\bequipment\b|\bexperience\b|\bavailability\b/.test(text)) {
      throw new Error(`Public query referenced private data: ${text}`)
    }
    let rows = profiles.filter((profile) => profile.active === true)
    if (text.includes('photographer_id =')) rows = rows.filter((profile) => profile.photographer_id === values[0])
    if (text.includes('ANY(specialties)')) {
      rows = rows.filter((profile) => profile.specialties.includes(String(values[0])))
    }
    if (!text.includes('LIMIT 1') && typeof values.at(-1) === 'number') {
      rows = rows.slice(0, values.at(-1) as number)
    }
    return rows
  },
}

const server = createServer((incoming, outgoing) => {
  void serve(incoming, outgoing)
})

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Test server did not start')
const baseUrl = `http://127.0.0.1:${address.port}`

try {
  const listed = await fetchPhotographers(baseUrl)
  assert.deepEqual(
    listed.map((photographer) => photographer.name),
    ['Ada Lens', 'Cia Frame'],
  )
  assert.equal(JSON.stringify(listed).includes('secret@example.com'), false)
  assert.equal(JSON.stringify(listed).includes('hidden@example.com'), false)
  assert.equal(JSON.stringify(listed).includes('Bo Hidden'), false)

  const drones = await fetchPhotographers(baseUrl, 'drone')
  assert.deepEqual(
    drones.map((photographer) => photographer.id),
    ['1'],
  )
  assert.equal(drones[0]?.hourlyRateCents, 7550)
  assert.deepEqual(drones[0]?.portfolioUrls, ['https://example.com/ada'])

  const hotels = await fetchPhotographers(baseUrl, 'hotels')
  assert.equal(hotels.length, 1)
  assert.equal(hotels[0]?.name, 'Cia Frame')

  const one = await fetchPhotographer(baseUrl, '1')
  assert.equal(one.location, 'Lisbon')
  assert.equal(JSON.stringify(one).includes('Secret camera'), false)

  await assert.rejects(() => fetchPhotographer(baseUrl, '2'), (error: unknown) => {
    return error instanceof PhotographerApiError && error.status === 404
  })

  const limited = await fetch(new URL('/api/photographers?limit=1', baseUrl))
  const limitedBody = (await limited.json()) as { photographers: { name: string }[] }
  assert.equal(limited.status, 200)
  assert.deepEqual(
    limitedBody.photographers.map((photographer) => photographer.name),
    ['Ada Lens'],
  )

  const badSpecialty = await fetch(new URL('/api/photographers?specialty=weddings', baseUrl))
  assert.equal(badSpecialty.status, 400)

  const posted = await fetch(new URL('/api/photographers', baseUrl), { method: 'POST' })
  assert.equal(posted.status, 405)

  const admin = await fetch(new URL('/api/admin/leads', baseUrl))
  assert.equal(admin.status, 401)
  const adminBody = await admin.text()
  assert.equal(adminBody.includes('secret@example.com'), false)
  assert.equal(adminBody.includes('Ada Lens'), false)

  assert.ok(queries.length > 0)
  console.log('mobile photographer api checks passed')
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
}

async function serve(incoming: IncomingMessage, outgoing: ServerResponse) {
  const url = new URL(incoming.url ?? '/', baseUrl)
  const request = new Request(url, { method: incoming.method })
  const response = url.pathname.startsWith('/api/admin/')
    ? await adminLeads(request)
    : await handlePublicPhotographers(request, db)
  const body = Buffer.from(await response.arrayBuffer())
  outgoing.writeHead(response.status, Object.fromEntries(response.headers))
  outgoing.end(body)
}
