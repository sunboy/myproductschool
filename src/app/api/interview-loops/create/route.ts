// src/app/api/interview-loops/create/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LoopDiscipline } from '@/lib/interview-loops/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { targetCompany, targetRole, roundOrder } = await request.json() as {
    targetCompany: string
    targetRole: string
    roundOrder: LoopDiscipline[]
  }

  if (!roundOrder || roundOrder.length < 2) {
    return Response.json({ error: 'At least 2 rounds required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminClient = createAdminClient() as any

  const title = [targetCompany, targetRole, 'Loop'].filter(Boolean).join(' ')

  const { data: loop, error: loopError } = await adminClient
    .from('interview_loops')
    .insert({
      user_id: user.id,
      title,
      target_company: targetCompany || null,
      target_role: targetRole || null,
      status: 'draft',
      round_order: roundOrder,
      current_round_index: 0,
    })
    .select()
    .single()

  if (loopError || !loop) {
    return Response.json({ error: loopError?.message ?? 'Failed to create loop' }, { status: 500 })
  }

  const roundRows = roundOrder.map((discipline: LoopDiscipline, idx: number) => ({
    loop_id: loop.id,
    round_index: idx,
    discipline,
    status: 'pending' as const,
  }))

  const { error: roundsError } = await adminClient
    .from('loop_rounds')
    .insert(roundRows)

  if (roundsError) {
    return Response.json({ error: roundsError.message }, { status: 500 })
  }

  return Response.json({ loopId: loop.id, title })
}
