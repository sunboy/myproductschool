import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — read-only, ignore
          }
        },
      },
    }
  )
}

// Per-request memoized auth. `supabase.auth.getUser()` is a NETWORK round-trip to
// Supabase Auth (GET /auth/v1/user), so calling it in the proxy, the page RSC, and
// each data loader triples the auth traffic for one visit. React `cache()` dedupes
// within a single server request (it is request-scoped and cannot leak across
// users), so the first caller pays the round-trip and the rest read the result.
// Prefer this over `createClient().auth.getUser()` on read paths.
export const getCachedUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
})
