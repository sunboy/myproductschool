import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { IS_MOCK } from '@/lib/mock'

// ── Pre-launch gate ──────────────────────────────────────────
// Set to true to restrict all routes to the waitlist page.
// Flip to false (or remove the block) when ready to launch.
const PRE_LAUNCH = false

const LAUNCH_ALLOWED = ['/waitlist', '/api/waitlist', '/luma-preview']

// ── Post-launch route config ─────────────────────────────────
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/waitlist', '/waitlist-b', '/waitlist-flow', '/pricing', '/flow', '/onboarding', '/dashboard', '/explore', '/challenges', '/progress', '/cohort', '/settings', '/prep', '/welcome', '/role', '/calibration', '/interview-prep', '/workspace', '/learn/modules', '/learn/domains', '/learn/plans']
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Post-launch: normal auth flow ──────────────────────
  // Bypass auth in mock/testing mode
  if (IS_MOCK) {
    return NextResponse.next()
  }

  // ── A/B split for root → waitlist variants ──────────────
  // Assign a stable variant via cookie so the same visitor always
  // sees the same page. 50/50 split between /waitlist and /waitlist-b.
  if (pathname === '/') {
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

  // Protect app routes — allow onboarding, API, and public routes without profile check
  const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/')) || pathname.startsWith('/api/')

  if (user) {
    // Authenticated users on auth routes → always go to dashboard
    if (AUTH_ROUTES.some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Protect app routes for unauthenticated users
  if (!user && !isPublic) {
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
