import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminClient = createAdminClient()

  // Fetch published challenges ordered by difficulty then created_at
  const { data: challenges } = await adminClient
    .from('challenges')
    .select('id, title, difficulty, move_tags, relevant_roles, domain_id, domains(slug, title)')
    .eq('is_published', true)
    .order('difficulty', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(20)

  if (!challenges) return NextResponse.json({ chapters: [] })

  // Fetch user's best scores for these challenges if logged in
  let scoreMap: Record<string, number> = {}
  if (user) {
    const ids = challenges.map(c => c.id)
    const { data: attempts } = await adminClient
      .from('challenge_attempts')
      .select('challenge_id, total_score')
      .eq('user_id', user.id)
      .in('challenge_id', ids)
      .not('submitted_at', 'is', null)
      .order('total_score', { ascending: false })

    for (const a of attempts ?? []) {
      if (!scoreMap[a.challenge_id] || a.total_score > scoreMap[a.challenge_id]) {
        scoreMap[a.challenge_id] = a.total_score
      }
    }
  }

  // Group into chapters by difficulty
  const beginner = challenges.filter(c => c.difficulty === 'beginner')
  const intermediate = challenges.filter(c => c.difficulty === 'intermediate')
  const advanced = challenges.filter(c => c.difficulty === 'advanced')

  const toItem = (c: { id: string; title: string; difficulty: string }) => ({
    id: c.id,
    title: c.title,
    difficulty: c.difficulty,
    best_score: scoreMap[c.id] ?? null,
    is_completed: scoreMap[c.id] != null,
  })

  const chapters = [
    {
      key: 'beginner',
      title: 'Chapter 1: Product Sense & Foundations',
      icon: 'psychology',
      items: beginner.map(toItem),
    },
    {
      key: 'intermediate',
      title: 'Chapter 2: Execution & Metrics',
      icon: 'monitoring',
      items: intermediate.map(toItem),
    },
    {
      key: 'advanced',
      title: 'Chapter 3: Strategy & Leadership',
      icon: 'diversity_3',
      items: advanced.map(toItem),
    },
  ].filter(ch => ch.items.length > 0)

  return NextResponse.json({ chapters })
}
