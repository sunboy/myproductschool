// src/app/api/admin/content/drafts/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAdminAction } from '@/lib/admin/audit-log'
import { checkAdminSecret } from '@/lib/content/admin-auth'
import { publishDraft } from '@/lib/content/publisher'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const { id } = await params

  try {
    const challengeId = await publishDraft(id)
    await logAdminAction(createAdminClient(), {
      action: 'draft_challenge.publish',
      targetType: 'draft_challenges',
      targetId: id,
      after: { challenge_id: challengeId },
    })
    // Publishing a new challenge changes the cached domain counts and the
    // trending list, so drop those caches immediately instead of waiting for TTL.
    revalidateTag('domains', 'max')
    revalidateTag('hot-challenges', 'max')
    return NextResponse.json({ ok: true, challenge_id: challengeId })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // Tag-policy failures are a reviewer-fixable validation error, not a server
    // fault — surface them as 422 so the admin UI shows the specific reason.
    const status = message.includes('Tag policy violation') ? 422 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
