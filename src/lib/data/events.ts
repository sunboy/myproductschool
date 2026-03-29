export function logEvent(
  userId: string,
  eventType: string,
  payload: Record<string, unknown> = {}
): void {
  if (process.env.USE_MOCK_DATA === 'true') return

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
