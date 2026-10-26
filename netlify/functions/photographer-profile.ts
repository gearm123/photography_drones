import type { Config } from '@netlify/functions'
import { handlePublicPhotographers } from '../../src/lib/publicPhotographerApi.ts'
import { database } from './leadHttp.ts'

export default function handler(req: Request): Promise<Response> {
  return handlePublicPhotographers(req, database())
}

export const config: Config = {
  path: '/api/photographers/:id',
  method: 'GET',
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: 'ip',
  },
}
