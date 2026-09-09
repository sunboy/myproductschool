import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getSessionHistory } from '@/lib/live-interview/history'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '10')
  const sessions = await getSessionHistory(user.id, limit)
  return Response.json({ sessions })
}
