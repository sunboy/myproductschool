import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const adminClient = createAdminClient()

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 120; i++) {
        try {
          const { data: session } = await adminClient
            .from('live_interview_sessions')
            .select('flow_coverage, total_turns, status')
            .eq('id', id)
            .single()

          if (!session || session.status !== 'active') {
            // Send final payload then close
            if (session) {
              const payload = JSON.stringify({
                flowCoverage: session.flow_coverage,
                totalTurns: session.total_turns,
                latestSignal: null,
                done: true,
              })
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
            }
            break
          }

          // Fetch latest luma turn's signal
          const { data: latestLumaTurn } = await adminClient
            .from('live_interview_turns')
            .select('turn_index, flow_move_detected, competency_signals')
            .eq('session_id', id)
            .eq('role', 'luma')
            .order('turn_index', { ascending: false })
            .limit(1)
            .maybeSingle()

          let latestSignal = null
          if (latestLumaTurn?.flow_move_detected || latestLumaTurn?.competency_signals) {
            const signals = latestLumaTurn.competency_signals as Record<string, string> | null
            latestSignal = {
              flowMove: latestLumaTurn.flow_move_detected ?? '',
              competency: signals?.competency ?? '',
              signal: signals?.signal ?? '',
              turnIndex: latestLumaTurn.turn_index as number,
            }
          }

          const payload = JSON.stringify({
            flowCoverage: session.flow_coverage,
            totalTurns: session.total_turns,
            latestSignal,
          })
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
        } catch {
          // silently continue on DB error
        }

        await new Promise((r) => setTimeout(r, 3000))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
