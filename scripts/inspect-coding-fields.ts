import { createClient } from '@supabase/supabase-js'

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await sb
    .from('challenges')
    .select('title,scenario_question,scenario_context,metadata')
    .eq('challenge_type', 'coding')
    .limit(2)
  for (const c of data ?? []) {
    console.log('=== ', c.title)
    console.log('scenario_question:', (c.scenario_question ?? '').slice(0, 120))
    console.log('scenario_context:', (c.scenario_context ?? '').slice(0, 120))
    console.log('metadata keys:', Object.keys((c.metadata ?? {}) as Record<string, unknown>))
    const m = (c.metadata ?? {}) as Record<string, unknown>
    console.log('problem_statement_markdown:', (m.problem_statement_markdown as string ?? '').slice(0, 200))
    console.log()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
