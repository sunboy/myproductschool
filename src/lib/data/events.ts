import { IS_MOCK } from '@/lib/mock'

export function logEvent(
  userId: string,
  eventType: string,
  payload: Record<string, unknown> = {}
): void {
  if (IS_MOCK) return

  // Fire-and-forget — intentionally not awaited
  import('@/lib/supabase/server').then(({ createClient }) =>
    createClient().then(supabase =>
      supabase.from('session_events').insert({
        user_id: userId,
        event_type: eventType,
        payload,
        created_at: new Date().toISOString(),
      })
    )
  )
}
