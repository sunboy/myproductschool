import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  // Use the same approach as middleware: request.cookies
  const reqCookies = request.cookies.getAll()
  
  // Also use the same approach as server.ts: cookies()
  const cookieStore = await cookies()
  const storeCookies = cookieStore.getAll()
  
  const hasAuthReq = reqCookies.some(c => c.name.includes('auth-token'))
  const hasAuthStore = storeCookies.some(c => c.name.includes('auth-token'))
  
  // Try with request.cookies (middleware style)
  const supabase1 = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return reqCookies },
        setAll() {},
      },
    }
  )
  const { data: { user: user1 }, error: error1 } = await supabase1.auth.getUser()
  
  // Try with cookieStore (server component style)
  const supabase2 = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return storeCookies },
        setAll() {},
      },
    }
  )
  const { data: { user: user2 }, error: error2 } = await supabase2.auth.getUser()
  
  return NextResponse.json({
    reqCookieCount: reqCookies.length,
    storeCookieCount: storeCookies.length,
    hasAuthReq,
    hasAuthStore,
    user1: user1?.email ?? null,
    error1: error1?.message ?? null,
    user2: user2?.email ?? null,
    error2: error2?.message ?? null,
    cookieNames: reqCookies.map(c => c.name),
  })
}
