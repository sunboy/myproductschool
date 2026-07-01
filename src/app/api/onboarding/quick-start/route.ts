import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { logEvent } from '@/lib/data/events'
import { VALID_ONBOARDING_ROLES } from '@/lib/onboarding/calibration-submit'
import {
  DEFAULT_FIRST_REP_SLUG,
  FIRST_REP_FALLBACK_HREF,
  getCuratedFirstRepSlug,
} from '@/lib/onboarding/curated-first-rep'
import { challengePath } from '@/lib/challenges/challengeNumber'
import { z, ZodError } from 'zod'

// One-tap onboarding path (behind the onboarding_value_first flag): a single
// role select completes onboarding immediately and routes into a curated
// first rep. This intentionally sets profiles.onboarding_completed_at the
// same way the full calibration submit route does (see
// src/lib/onboarding/calibration-submit.ts) so every downstream reader of
// that column (dashboard isCalibrated branching, proxy checks, cron jobs)
// keeps working unchanged. proxy.ts does not gate routes on this column
// today (see src/proxy.ts comment "the dashboard owns the calibrated/
// uncalibrated experience"), so setting it early here cannot lock a user
// out of anything — it only flips the dashboard into its calibrated UI.
//
// Deliberately skinny compared to calibration submit: no scores, no
// move_levels/learner_competencies writes (those stay at their neutral
// defaults, already seeded elsewhere, or absent until real calibration
// runs), no archetype. Calibration remains available afterward as a
// dashboard CTA and fully overwrites these fields when completed.

const RequestSchema = z.object({
  role: z.enum(VALID_ONBOARDING_ROLES),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function POST(request: Request) {
  if (IS_MOCK) {
    return NextResponse.json({
      success: true,
      challenge_href: challengePath({ slug: DEFAULT_FIRST_REP_SLUG, id: DEFAULT_FIRST_REP_SLUG }),
    })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'role is required', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { role } = body
  const now = new Date().toISOString()
  const adminClient = createAdminClient()

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({
      preferred_role: role,
      onboarding_completed_at: now,
      updated_at: now,
    })
    .eq('id', user.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Best-effort cleanup of any partial full-calibration draft so a later visit
  // to the calibration CTA starts fresh instead of resuming a stale screen.
  await adminClient.from('onboarding_state').delete().eq('user_id', user.id)

  logEvent(user.id, 'onboarding.quick_start', { role })

  const slug = getCuratedFirstRepSlug(role)
  const { data: challengeRow } = await adminClient
    .from('challenges')
    .select('id, slug, challenge_type, display_number')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  const challengeHref = challengeRow ? challengePath(challengeRow) : FIRST_REP_FALLBACK_HREF

  return NextResponse.json({ success: true, challenge_href: challengeHref })
}
