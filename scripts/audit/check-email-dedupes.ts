/**
 * Dump latest email_dedupes rows.
 * Usage: npx tsx scripts/audit/check-email-dedupes.ts [filter]
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const filter = process.argv[2]
  const base = sb.from('email_dedupes').select('*').order('created_at', { ascending: false }).limit(15)
  const { data, error } = filter
    ? await sb.from('email_dedupes').select('*').ilike('dedupe_key', `%${filter}%`).order('created_at', { ascending: false }).limit(15)
    : await base
  console.log(JSON.stringify({ error: error?.message ?? null, rows: data }, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
