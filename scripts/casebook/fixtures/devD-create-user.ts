import { createClient } from '@supabase/supabase-js'

async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const email = `devd-throwaway-${Date.now()}@hackproduct-test.local`
  const password = 'ThrowawayTest89!'

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) {
    console.error('createUser failed', error)
    process.exit(1)
  }
  const userId = data.user.id

  // Grant analytics access + onboarding completion so the session/start route
  // doesn't bounce us on entitlement or onboarding gates.
  const { error: profErr } = await admin
    .from('profiles')
    .update({
      cc_analytics_access: true,
      onboarding_completed_at: new Date().toISOString(),
      role: 'user',
      plan: 'free',
    })
    .eq('id', userId)
  if (profErr) {
    console.error('profile update failed', profErr)
    process.exit(1)
  }

  console.log(JSON.stringify({ userId, email, password }, null, 2))
}
main()
