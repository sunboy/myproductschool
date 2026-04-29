// src/app/api/interview-loops/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
