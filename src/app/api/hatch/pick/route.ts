import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api/error'
import { getHatchPick } from '@/lib/hatch/weakest-move'

/**
 * GET /api/hatch/pick
 *
 * Cheap personalization read for Hatch's page cues: the user's weakest FLOW
 * move (same derivation as the dashboard, via the shared helper), a short
 * reason, and a study plan slug the user can open. No AI call.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return apiError(401, 'auth_required', 'Unauthorized')
  }

  const pick = await getHatchPick(user.id)
  return NextResponse.json(pick)
}
