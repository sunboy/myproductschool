import 'server-only'

// Claim-on-signup: an anonymous /job-fit run sets an httpOnly claim cookie;
// when that visitor signs up, the report is copied into their
// career_fit_evaluations history (where Hatch's career context already reads)
// and a roast resume seeds career_profiles.resume_text if the profile has
// none. Mirrors the referral-attribution pattern in the signup + oauth
// callback routes: best-effort, never blocks account creation.

import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { EVENT_FIT_RESULT_CLAIMED } from '@/lib/posthog/events'
import { captureServerImmediate } from '@/lib/posthog/server'
import { logger } from '@/lib/log'
import type { PublicFitMode } from './types'

export const FIT_CLAIM_COOKIE = 'hp_fit_claim'

const CLAIM_WINDOW_DAYS = 30

export function hashClaimToken(token: string): string {
  return createHash('sha256').update(`fit-claim-v1:${token}`).digest('hex')
}

interface ClaimableRow {
  id: string
  mode: PublicFitMode
  company: string | null
  role_title: string | null
  resume_text: string | null
  score: number | string | null
  grade: string | null
  breakdown: unknown
  gaps: unknown
  readiness_map: unknown
  report_md: string | null
}

export async function claimPublicFitReports(
  admin: SupabaseClient,
  userId: string,
  rawToken: string | null | undefined,
): Promise<void> {
  try {
    const token = rawToken?.trim()
    if (!token || !userId) return

    const cutoff = new Date(Date.now() - CLAIM_WINDOW_DAYS * 24 * 3600 * 1000).toISOString()
    const { data: rows } = await admin
      .from('public_fit_reports')
      .select('id, mode, company, role_title, resume_text, score, grade, breakdown, gaps, readiness_map, report_md')
      .eq('claim_token_hash', hashClaimToken(token))
      .is('claimed_by', null)
      .gte('created_at', cutoff)

    if (!rows?.length) return

    for (const row of rows as ClaimableRow[]) {
      // job_fit reports become evaluation history; a roast has no readiness
      // map worth keeping, its value to the member is the seeded resume below.
      if (row.mode === 'job_fit') {
        await admin.from('career_fit_evaluations').insert({
          user_id: userId,
          company: row.company,
          role_title: row.role_title,
          score: row.score,
          grade: row.grade,
          breakdown: row.breakdown,
          report_md: row.report_md,
          gaps: row.gaps,
          readiness_map: row.readiness_map,
        })
      }

      if (row.mode === 'resume_roast' && row.resume_text) {
        const { data: profile } = await admin
          .from('career_profiles')
          .select('id, resume_text')
          .eq('user_id', userId)
          .maybeSingle()
        if (!profile) {
          await admin.from('career_profiles').insert({ user_id: userId, resume_text: row.resume_text })
        } else if (!profile.resume_text) {
          await admin
            .from('career_profiles')
            .update({ resume_text: row.resume_text, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
        }
      }

      await admin
        .from('public_fit_reports')
        .update({ claimed_by: userId, claimed_at: new Date().toISOString() })
        .eq('id', row.id)
        .is('claimed_by', null)

      await captureServerImmediate({
        distinctId: userId,
        event: EVENT_FIT_RESULT_CLAIMED,
        properties: { mode: row.mode, score: row.score == null ? null : Number(row.score) },
      })
    }
  } catch (error) {
    logger.warn('[careerops.claim] claim failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
