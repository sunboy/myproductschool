import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function safeNextPath(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('next')
  if (!raw) return null

  try {
    const candidate = new URL(raw, request.url)
    if (candidate.origin !== request.nextUrl.origin) return null
    return `${candidate.pathname}${candidate.search}${candidate.hash}`
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', data.user.id)
    .single()

  const destination = profile?.onboarding_completed_at
    ? safeNextPath(request) ?? '/dashboard'
    : '/onboarding/welcome'
  return NextResponse.redirect(new URL(destination, request.url))
}
