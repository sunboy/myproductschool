import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminClient = createAdminClient()

  // Fetch published v2 challenges ordered by difficulty then created_at
  const { data: challenges } = await adminClient
    .from('challenges')
    .select('id, slug, title, difficulty, tags, relevant_roles, created_at')
    .eq('is_published', true)
    .order('difficulty', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(20)

  if (!challenges) return NextResponse.json({ chapters: [] })

  // Fetch user's best scores from v2 challenge_attempts
  let scoreMap: Record<string, number> = {}
  if (user) {
    const ids = challenges.map(c => c.id)
    const { data: attempts } = await adminClient
      .from('challenge_attempts')
      .select('challenge_id, total_score')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .in('challenge_id', ids)
      .order('total_score', { ascending: false })

    for (const a of (attempts ?? []) as { challenge_id: string; total_score: number }[]) {
      if (!scoreMap[a.challenge_id] || a.total_score > scoreMap[a.challenge_id]) {
        scoreMap[a.challenge_id] = a.total_score
      }
    }
  }

  // Map v2 difficulty to chapter groupings
  // v2 uses: 'entry', 'junior', 'mid', 'senior', 'staff'
  const beginner = challenges.filter(c => ['entry', 'junior'].includes(c.difficulty))
  const intermediate = challenges.filter(c => c.difficulty === 'mid')
  const advanced = challenges.filter(c => ['senior', 'staff'].includes(c.difficulty))
  // Fall back: if all challenges have same difficulty, put them all in one chapter
  const hasGroups = beginner.length || intermediate.length || advanced.length

  const toItem = (c: { id: string; slug: string | null; title: string; difficulty: string }) => ({
    id: c.id,
    slug: c.slug ?? c.id.replace(/^c\d+-/, ''),
    title: c.title,
    difficulty: c.difficulty,
    best_score: scoreMap[c.id] != null ? Math.round(scoreMap[c.id] * 100 / 3) : null,
    is_completed: scoreMap[c.id] != null,
  })

  const chapters = hasGroups
    ? [
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
    : [
        {
          key: 'all',
          title: 'Chapter 1: FLOW Challenges',
          icon: 'psychology',
          items: challenges.map(toItem),
        },
      ]

  return NextResponse.json({ chapters })
}
