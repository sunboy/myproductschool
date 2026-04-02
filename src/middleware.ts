import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { IS_MOCK } from '@/lib/mock'

// ── Pre-launch gate ──────────────────────────────────────────
// Set to true to restrict all routes to the waitlist page.
// Flip to false (or remove the block) when ready to launch.
const PRE_LAUNCH = false

const LAUNCH_ALLOWED = ['/waitlist', '/api/waitlist', '/luma-preview']

// ── Post-launch route config ─────────────────────────────────
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/waitlist', '/waitlist-b', '/pricing', '/onboarding', '/dashboard', '/explore', '/challenges', '/progress', '/cohort', '/settings', '/prep', '/welcome', '/role', '/calibration', '/interview-prep', '/workspace', '/learn/modules', '/learn/domains', '/learn/plans']
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Post-launch: normal auth flow ──────────────────────
  // Bypass auth in mock/testing mode
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || IS_MOCK) {
    return NextResponse.next()
  }

  // ── Pre-launch: only waitlist + its API are accessible ──
  if (PRE_LAUNCH) {
    const isAllowed = LAUNCH_ALLOWED.some(r => pathname === r || pathname.startsWith(r + '/'))
      || pathname.startsWith('/api/waitlist')
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/waitlist', request.url))
    }
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect authenticated users away from auth pages
  if (user && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    // Check if onboarding is done — if not, send to onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', user.id)
      .single()
    const dest = profile?.onboarding_completed_at ? '/dashboard' : '/onboarding/welcome'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Protect app routes — allow onboarding, API, and public routes without profile check
  const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/')) || pathname.startsWith('/api/')
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // For authenticated users on app routes (not onboarding), check onboarding status
  const isOnboarding = pathname.startsWith('/onboarding')
  const isAppRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/explore')
    || pathname.startsWith('/challenges') || pathname.startsWith('/progress')
    || pathname.startsWith('/cohort') || pathname.startsWith('/prep')
    || pathname.startsWith('/settings') || pathname.startsWith('/learn')

  if (user && isAppRoute && !isOnboarding) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', user.id)
      .single()
    if (profile && !profile.onboarding_completed_at) {
      return NextResponse.redirect(new URL('/onboarding/welcome', request.url))
    }
  }

  // Admin route protection (role check done in page/layout)
  if (pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
