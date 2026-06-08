import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import {
  MARKETING_ROUTES,
  AUTH_ROUTES,
  EXACT_MARKETING_ROUTES,
  PUBLIC_SCORECARD_ROUTE,
} from '@/lib/routes/public'

// ── Pre-launch gate ──────────────────────────────────────────
// Set to true to restrict all routes to the waitlist page.
// Flip to false (or remove the block) when ready to launch.
const PRE_LAUNCH = false

const LAUNCH_ALLOWED = ['/waitlist', '/api/waitlist', '/hatch-preview', '/hatch-motion']

// ── Post-launch route config ─────────────────────────────────
// Marketing / auth pages live in @/lib/routes/public (shared with the
// client-side V3AuthGate so both use one source of truth). Pure-marketing
// routes short-circuit BEFORE we talk to Supabase so they can never be
// blocked by an auth-service hiccup.
const AUTH_CALLBACK_ROUTES = ['/auth/callback']

// Routes that can be reached before signing in.
const APP_PUBLIC_ROUTES = ['/canvas-harness']

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === '/marketing' || pathname.startsWith('/marketing/')) {
    const destination = request.nextUrl.clone()
    destination.pathname = pathname === '/marketing' ? '/' : pathname.replace(/^\/marketing/, '') || '/'
    return NextResponse.redirect(destination, 308)
  }

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
  const isExactMarketing = EXACT_MARKETING_ROUTES.includes(pathname)
  const isWaitlist  = WAITLIST_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isAuthRoute = AUTH_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isAuthCallback = AUTH_CALLBACK_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isPublicScorecard = PUBLIC_SCORECARD_ROUTE.test(pathname)
  const isApi       = pathname.startsWith('/api/')
  const isAdminApi  = pathname.startsWith('/api/admin')

  // Pure marketing routes that never need auth (not / or waitlist which need redirect logic)
  const isPureMarketing = (isMarketing && !isRoot && !isWaitlist) || isExactMarketing

  // NOTE: /, waitlist, and auth routes intentionally do NOT short-circuit here.
  // They need an auth-aware client so a logged-in visitor is redirected to
  // /dashboard (the redirect blocks below are otherwise dead code). The no-user
  // path in each of those blocks still serves the page, so an auth-service
  // hiccup degrades to "show the public page", never a hard block.
  if (isPureMarketing || isAuthCallback || isPublicScorecard || (isApi && !isAdminApi)) {
    return NextResponse.next()
  }

  // ── Single unified Supabase client for all routes that need auth awareness ──
  // This MUST use the full supabaseResponse + setAll pattern so that token
  // refresh works correctly. A lightweight client with setAll(){} no-op causes
  // getUser() / getSession() to return null when the access token needs refreshing.
  const supabaseResponse = NextResponse.next({ request })

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

  if (isAdminApi) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return supabaseResponse
  }

  // Authenticated users visiting / go straight to dashboard.
  // Unauthenticated visitors see the landing page.
  if (isRoot) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
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
    // Password reset page must stay accessible even after setSession() establishes a session
    if (pathname === '/reset-password') return supabaseResponse
    // Logged-in users hitting auth pages → redirect to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Authenticated users can access all app routes freely.
    // The dashboard owns the calibrated/uncalibrated experience.
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
