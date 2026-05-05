// src/app/api/interview-loops/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LoopDiscipline } from '@/lib/interview-loops/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const adminClient = createAdminClient()

  const [loopResult, roundsResult] = await Promise.all([
    adminClient
      .from('interview_loops' as string)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    adminClient
      .from('loop_rounds' as string)
      .select('*')
      .eq('loop_id', id)
      .order('round_index', { ascending: true }),
  ])

  if (!loopResult.data) return new Response('Not found', { status: 404 })

  return Response.json({
    loop: loopResult.data,
    rounds: roundsResult.data ?? [],
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminClient = createAdminClient() as any

  const { data: existing } = await adminClient
    .from('interview_loops')
    .select('id, status, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) return new Response('Not found', { status: 404 })
  if (existing.status !== 'draft') {
    return Response.json({ error: 'Can only edit draft loops' }, { status: 400 })
  }

  const { targetCompany, targetRole, roundOrder } = await request.json() as {
    targetCompany?: string
    targetRole?: string
    roundOrder?: LoopDiscipline[]
  }

  const title = [targetCompany, targetRole, 'Loop'].filter(Boolean).join(' ')

  const { error: updateError } = await adminClient
    .from('interview_loops')
    .update({
      title,
      target_company: targetCompany ?? null,
      target_role: targetRole ?? null,
      ...(roundOrder ? { round_order: roundOrder } : {}),
    })
    .eq('id', id)

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 })
  }

  if (roundOrder) {
    await adminClient.from('loop_rounds').delete().eq('loop_id', id)

    const roundRows = roundOrder.map((discipline: LoopDiscipline, idx: number) => ({
      loop_id: id,
      round_index: idx,
      discipline,
      status: 'pending' as const,
    }))

    const { error: roundsError } = await adminClient.from('loop_rounds').insert(roundRows)
    if (roundsError) {
      return Response.json({ error: roundsError.message }, { status: 500 })
    }
  }

  return Response.json({ loopId: id, title })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminClient = createAdminClient() as any

  const { data: existing } = await adminClient
    .from('interview_loops')
    .select('id, status, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) return new Response('Not found', { status: 404 })
  if (existing.status !== 'draft' && existing.status !== 'abandoned') {
    return Response.json({ error: 'Can only delete draft or abandoned loops' }, { status: 400 })
  }

  await adminClient.from('loop_rounds').delete().eq('loop_id', id)
  const { error } = await adminClient.from('interview_loops').delete().eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
