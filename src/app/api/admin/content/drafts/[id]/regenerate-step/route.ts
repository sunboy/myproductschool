// src/app/api/admin/content/drafts/[id]/regenerate-step/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminSecret } from '@/lib/content/admin-auth'
import { regenerateStep } from '@/lib/content/generator'
import type { ChallengeJson, FlowStep } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminSecret(req)
  if (authErr) return authErr

  const { id } = await params
  const { step } = await req.json() as { step: FlowStep }

  const supabase = createAdminClient()
  const { data: draft, error: fetchErr } = await supabase
    .from('draft_challenges')
    .select('challenge_json')
    .eq('id', id)
    .single()

  if (fetchErr || !draft) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = draft.challenge_json as ChallengeJson

  try {
    const newStep = await regenerateStep(existing, step)
    const updatedSteps = existing.flow_steps.map(s => s.step === step ? newStep : s)
    const updatedJson: ChallengeJson = { ...existing, flow_steps: updatedSteps }

    const { error } = await supabase
      .from('draft_challenges')
      .update({ challenge_json: updatedJson, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, step: newStep })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
