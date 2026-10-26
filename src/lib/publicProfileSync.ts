import { getDatabase } from '@netlify/database'
import { mapPhotographer } from './photographerRecord.ts'
import { profileVisibility } from './publicPhotographer.ts'

type LeadRow = Record<string, unknown>

export async function syncPublicProfile(row: LeadRow): Promise<void> {
  const lead = mapPhotographer(row)
  const id = Number(lead.id)
  if (!Number.isSafeInteger(id) || id <= 0) return

  const decision = profileVisibility(lead)
  const db = getDatabase()
  if (!decision.publish) {
    await db.sql`
      UPDATE photographer_profiles
      SET active = false, updated_at = now()
      WHERE photographer_id = ${id}
    `
    return
  }

  const profile = decision.profile
  await db.sql`
    INSERT INTO photographer_profiles (
      photographer_id,
      display_name,
      location,
      working_areas,
      specialties,
      hourly_rate_cents,
      currency,
      portfolio_urls,
      active,
      published_at,
      updated_at
    )
    VALUES (
      ${id},
      ${profile.name},
      ${profile.location},
      ${profile.workingAreas},
      ${profile.specialties},
      ${profile.hourlyRateCents},
      ${profile.currency},
      ${profile.portfolioUrls},
      ${decision.active},
      ${decision.active ? new Date() : null},
      now()
    )
    ON CONFLICT (photographer_id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      location = EXCLUDED.location,
      working_areas = EXCLUDED.working_areas,
      specialties = EXCLUDED.specialties,
      hourly_rate_cents = EXCLUDED.hourly_rate_cents,
      currency = EXCLUDED.currency,
      portfolio_urls = EXCLUDED.portfolio_urls,
      active = EXCLUDED.active,
      published_at = CASE
        WHEN EXCLUDED.active THEN COALESCE(photographer_profiles.published_at, now())
        ELSE photographer_profiles.published_at
      END,
      updated_at = now()
  `
}
