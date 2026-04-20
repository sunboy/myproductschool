import { createClient } from '@supabase/supabase-js'

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: existing } = await s.from('learn_chapters').select('figures').limit(1)
  if (existing) {
    console.log('[migration] figures column already exists')
    return
  }

  // Use the postgres REST RPC that service role can invoke. We rely on a
  // small SQL-execution function. If none exists, fall back to direct PG HTTP.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sql: `alter table public.learn_chapters add column if not exists figures jsonb not null default '[]'::jsonb`,
    }),
  })
  console.log('[migration] rpc status:', res.status, await res.text())
}

main().catch(e => { console.error(e); process.exit(1) })
