import { createClient } from '@supabase/supabase-js'

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb
    .from('challenges')
    .select('id,title,difficulty,challenge_type,metadata')
    .eq('challenge_type', 'coding')
  console.log('error:', error?.message ?? 'none')
  console.log('count:', data?.length ?? 0)
  data?.forEach(c => {
    const isSql = c.metadata && (c.metadata as Record<string, unknown>).sql_schema
    console.log(' -', c.title, '/', c.difficulty, '/', isSql ? 'SQL' : 'algo')
  })
}

main().catch(e => { console.error(e); process.exit(1) })
