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
            .select('flow_coverage, total_turns, status, calibration_snapshot')
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

          // Fetch latest hatch turn's signal
          const { data: latestHatchTurn } = await adminClient
            .from('live_interview_turns')
            .select('turn_index, flow_move_detected, competency_signals')
            .eq('session_id', id)
            .eq('role', 'hatch')
            .order('turn_index', { ascending: false })
            .limit(1)
            .maybeSingle()

          let latestSignal = null
          if (latestHatchTurn?.flow_move_detected || latestHatchTurn?.competency_signals) {
            const signals = latestHatchTurn.competency_signals as Record<string, string> | null
            latestSignal = {
              flowMove: latestHatchTurn.flow_move_detected ?? '',
              competency: signals?.competency ?? '',
              signal: signals?.signal ?? '',
              turnIndex: latestHatchTurn.turn_index as number,
            }
          }

          // Extract latest grading data (emotional beat, session phase) from calibration_snapshot
          const snapshot = session.calibration_snapshot as Record<string, unknown> | null
          const latestGrading = snapshot?._latestGrading as { emotionalBeat?: string; sessionPhase?: string } | undefined

          const payload = JSON.stringify({
            flowCoverage: session.flow_coverage,
            totalTurns: session.total_turns,
            latestSignal,
            emotionalBeat: latestGrading?.emotionalBeat ?? null,
            sessionPhase: latestGrading?.sessionPhase ?? null,
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
