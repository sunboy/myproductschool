import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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

  const destination = profile?.onboarding_completed_at ? '/dashboard' : '/onboarding/welcome'
  return NextResponse.redirect(new URL(destination, request.url))
}
