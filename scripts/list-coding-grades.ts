import { createClient } from '@supabase/supabase-js'

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  console.log('=== interview_grades (any) ===')
  const { data: anyG, error: e1 } = await sb
    .from('interview_grades')
    .select('id,challenge_type,overall_score,headline,graded_at')
    .order('graded_at', { ascending: false })
    .limit(5)
  console.log('error:', e1?.message ?? 'none')
  console.log('count:', anyG?.length)
  anyG?.forEach(g => console.log(' -', g.challenge_type, '/', g.overall_score, '/', (g.headline ?? '').slice(0, 90), '/', g.graded_at))

  console.log('\n=== challenge_attempts (status=completed, recent) ===')
  const { data: att, error: e2 } = await sb
    .from('challenge_attempts')
    .select('id,user_id,challenge_id,status,final_code,final_language,test_results,completed_at')
    .order('completed_at', { ascending: false })
    .limit(5)
  console.log('error:', e2?.message ?? 'none')
  console.log('count:', att?.length)
  att?.forEach(a => console.log(' -', a.id, a.status, a.final_language, a.completed_at, 'has_code:', !!a.final_code, 'has_results:', !!a.test_results))
}

main().catch(e => { console.error(e); process.exit(1) })
