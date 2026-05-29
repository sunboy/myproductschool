import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await admin
    .from('email_dedupes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
  console.log('error:', error?.message ?? 'none')
  console.log('rows:', JSON.stringify(data, null, 2))
}
main()
