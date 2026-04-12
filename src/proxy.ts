import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { IS_MOCK } from '@/lib/mock'

// ── Pre-launch gate ──────────────────────────────────────────
// Set to true to restrict all routes to the waitlist page.
// Flip to false (or remove the block) when ready to launch.
const PRE_LAUNCH = false

const LAUNCH_ALLOWED = ['/waitlist', '/waitlist-quick', '/waitlist-flow', '/api/waitlist', '/luma-preview']

// ── Post-launch route config ─────────────────────────────────
// Marketing / auth pages — accessible without any session.
// These short-circuit BEFORE we talk to Supabase so they can
// never be blocked by an auth-service hiccup.
const MARKETING_ROUTES = ['/', '/waitlist', '/waitlist-quick', '/waitlist-flow', '/pricing', '/flow', '/luma-preview']
const AUTH_ROUTES      = ['/login', '/signup', '/forgot-password', '/reset-password']

// Routes that require a user but NOT a completed profile/onboarding
const APP_PUBLIC_ROUTES = ['/onboarding', '/welcome', '/role', '/calibration']

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Post-launch: normal auth flow ──────────────────────
  // Bypass auth in mock/testing mode
  if (IS_MOCK) {
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

  // ── Marketing & auth pages classification ──
  const WAITLIST_ROUTES = ['/waitlist', '/waitlist-quick', '/waitlist-flow']
  const isRoot      = pathname === '/'
  const isMarketing = MARKETING_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isWaitlist  = WAITLIST_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isAuthRoute = AUTH_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isApi       = pathname.startsWith('/api/')

  // Pure marketing routes that never need auth (not / or waitlist which need redirect logic)
  const isPureMarketing = isMarketing && !isRoot && !isWaitlist
  if (isPureMarketing || isApi) {
    return NextResponse.next()
  }

  // ── Single unified Supabase client for all routes that need auth awareness ──
  // This MUST use the full supabaseResponse + setAll pattern so that token
  // refresh works correctly. A lightweight client with setAll(){} no-op causes
  // getUser() / getSession() to return null when the access token needs refreshing.
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
          // Must set on both request (for downstream server reads) and response (to send to browser)
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── A/B split for root → waitlist variants ──────────────
  // Authenticated users visiting / go straight to dashboard.
  // Unauthenticated visitors get a stable 50/50 split between waitlist variants.
  if (isRoot) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    const existing = request.cookies.get('ab_waitlist')?.value
    const variant = existing === 'a' || existing === 'b'
      ? existing
      : Math.random() < 0.5 ? 'a' : 'b'

    supabaseResponse.headers.set('x-ab-waitlist', variant)
    if (!existing) {
      supabaseResponse.cookies.set('ab_waitlist', variant, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        sameSite: 'lax',
      })
    }
    return supabaseResponse
  }

  // ── Waitlist routes: redirect logged-in users to dashboard ──
  if (isWaitlist) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  if (user) {
    // Logged-in users hitting auth pages → redirect to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Authenticated users can access all app routes freely.
    // Onboarding is optional — dashboard shows CalibrationHero for uncalibrated users.
    return supabaseResponse
  }

  // Unauthenticated users on auth pages (login, signup, etc.) → allow through
  if (isAuthRoute) {
    return supabaseResponse
  }

  // Unauthenticated users on onboarding pages → allow through
  const isAppPublic = APP_PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  if (isAppPublic) {
    return supabaseResponse
  }

  // Unauthenticated users on any other route → redirect to login
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
