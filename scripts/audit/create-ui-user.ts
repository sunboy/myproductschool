/**
 * Phase 2 audit helper — create a fully-onboarded test user via Supabase Auth Admin.
 *
 * Why this approach:
 * - The site UI signup writes hasSession=false and redirects to /verify-email (see CODEX2-2).
 * - The same pattern e2e/auth.spec.ts:252-267 uses (auth.admin.createUser + email_confirm:true)
 *   is the sanctioned bypass per the plan.
 * - Onboarding gate is satisfied by writing `profiles.onboarding_completed_at` directly.
 *
 * Usage:
 *   npx tsx scripts/audit/create-ui-user.ts <email> [password]
 *   npx tsx scripts/audit/create-ui-user.ts paywall-audit-free-1234@hackproduct.com
 *
 * Output (stdout): JSON { userId, email, password }
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function main() {
  const args = process.argv.slice(2)
  const email = args[0] ?? `paywall-audit-${Date.now()}@hackproduct.com`
  const password = args[1] ?? 'PaywallAudit!2026'

  const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1) Create the auth user with email_confirm=true (bypasses /verify-email)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: 'Paywall Audit User' },
  })
  if (error || !data.user) {
    throw new Error(`createUser failed: ${error?.message ?? 'no user'}`)
  }
  const userId = data.user.id

  // 2) Ensure profile row exists + bypass onboarding via onboarding_completed_at
  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      display_name: 'Paywall Audit User',
      role: 'user',
      preferred_role: 'SWE',
      active_role: 'swe',
      plan: 'free',
      pro_access: false,
      streak_days: 0,
      xp_total: 0,
      onboarding_completed_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )
  if (profileError) {
    console.error(`profile upsert warn: ${profileError.message}`)
  }

  console.log(JSON.stringify({ userId, email, password }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
