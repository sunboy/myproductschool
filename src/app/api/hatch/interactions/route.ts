import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api/error'
import { rateLimit } from '@/lib/security/rate-limit'
import { recordHatchInteraction } from '@/lib/hatch/interactions'

const ROUTE_KEY = 'hatch_interactions'

const RequestSchema = z.object({
  kind: z.string().trim().min(1).max(40),
  payload: z.record(z.string(), z.unknown()).default({}),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return apiError(401, 'auth_required', 'Unauthorized')
  }

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  // Rate-sane: beyond 30/min per user, drop the write silently. Interaction
  // logging is best-effort memory, never something a client should retry.
  const throttle = await rateLimit({
    key: `ai:${user.id}:${ROUTE_KEY}`,
    limit: 30,
    windowSec: 60,
  })
  if (throttle.allowed) {
    recordHatchInteraction(user.id, body.kind, body.payload)
  }

  return NextResponse.json({ ok: true })
}
