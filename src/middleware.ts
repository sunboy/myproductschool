import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { IS_MOCK } from '@/lib/mock'

// ── Pre-launch gate ──────────────────────────────────────────
// Set to true to restrict all routes to the waitlist page.
// Flip to false (or remove the block) when ready to launch.
const PRE_LAUNCH = false

const LAUNCH_ALLOWED = ['/waitlist', '/api/waitlist', '/luma-preview']

// ── Post-launch route config ─────────────────────────────────
// Marketing / auth pages — accessible without any session.
// These short-circuit BEFORE we talk to Supabase so they can
// never be blocked by an auth-service hiccup.
const MARKETING_ROUTES = ['/', '/waitlist', '/waitlist-b', '/waitlist-flow', '/pricing', '/flow', '/luma-preview']
const AUTH_ROUTES      = ['/login', '/signup', '/forgot-password', '/reset-password']

// Routes that require a user but NOT a completed profile/onboarding
const APP_PUBLIC_ROUTES = ['/onboarding', '/welcome', '/role', '/calibration']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Post-launch: normal auth flow ──────────────────────
  // Bypass auth in mock/testing mode
  if (IS_MOCK) {
    return NextResponse.next()
  }

  // ── A/B split for root → waitlist variants ──────────────
  // Authenticated users visiting / go straight to dashboard.
  // Unauthenticated visitors get a stable 50/50 split between waitlist variants.
  if (pathname === '/') {
    // Quick auth check — don't block on Supabase for the common unauthenticated case
    // but do redirect logged-in users away from the marketing page.
    const supabaseForRoot = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user: rootUser } } = await supabaseForRoot.auth.getUser()
    if (rootUser) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const existing = request.cookies.get('ab_waitlist')?.value
    const variant = existing === 'a' || existing === 'b'
      ? existing
      : Math.random() < 0.5 ? 'a' : 'b'

    const response = NextResponse.next({ request })
    response.headers.set('x-ab-waitlist', variant)
    if (!existing) {
      response.cookies.set('ab_waitlist', variant, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        sameSite: 'lax',
      })
    }
    return response
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

  // ── Marketing & auth pages: always public, skip Supabase ──
  const WAITLIST_ROUTES = ['/waitlist', '/waitlist-b', '/waitlist-flow']
  const isMarketing = MARKETING_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isWaitlist  = WAITLIST_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isAuthRoute = AUTH_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isApi       = pathname.startsWith('/api/')

  // For waitlist routes, check if user is already logged in — send them to dashboard
  if (isWaitlist) {
    const supabaseForWaitlist = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user: waitlistUser } } = await supabaseForWaitlist.auth.getUser()
    if (waitlistUser) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (isMarketing || isApi) {
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

  // Routes that don't require a completed profile
  const isAppPublic = APP_PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', user.id)
      .single()
    const onboardingDone = !!profile?.onboarding_completed_at

    // Logged-in users hitting auth pages → redirect to app
    if (isAuthRoute) {
      return NextResponse.redirect(new URL(
        onboardingDone ? '/dashboard' : '/onboarding/welcome',
        request.url
      ))
    }

    const isOnboarding = pathname.startsWith('/onboarding')
    const isAppRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/explore')
      || pathname.startsWith('/challenges') || pathname.startsWith('/progress')
      || pathname.startsWith('/cohort') || pathname.startsWith('/prep')
      || pathname.startsWith('/settings') || pathname.startsWith('/learn')

    if (isAppRoute && !isOnboarding && !onboardingDone) {
      return NextResponse.redirect(new URL('/onboarding/welcome', request.url))
    }
  }

  // Unauthenticated users on auth pages (login, signup, etc.) → allow through
  if (!user && isAuthRoute) {
    return supabaseResponse
  }

  // Unauthenticated users on app-public routes (onboarding) → allow through
  if (!user && isAppPublic) {
    return supabaseResponse
  }

  // Unauthenticated users on any other route → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
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
