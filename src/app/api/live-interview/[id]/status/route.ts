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
      for (let i = 0; i < 5; i++) {
        try {
          const { data: session } = await adminClient
            .from('live_interview_sessions')
            .select('flow_coverage, total_turns')
            .eq('id', id)
            .single()

          if (session) {
            const payload = JSON.stringify({
              flowCoverage: session.flow_coverage,
              totalTurns: session.total_turns,
            })
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
          }
        } catch {
          // silently continue on DB error
        }

        await new Promise((r) => setTimeout(r, 2000))
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
