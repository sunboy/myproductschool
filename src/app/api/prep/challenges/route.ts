import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { coerceDifficulty, type PracticeDifficulty } from '@/lib/practice/difficulty'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminClient = createAdminClient()

  // Fetch published challenges ordered by difficulty then created_at
  const { data: challenges } = await adminClient
    .from('challenges')
    .select('id, title, difficulty, move_tags, relevant_roles, domain_id, domains(slug, title)')
    .eq('is_published', true)
    .neq('challenge_type', 'freeform')
    .order('difficulty', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(20)

  if (!challenges) return NextResponse.json({ chapters: [] })

  // Fetch user's best scores for these challenges if logged in
  const scoreMap: Record<string, number> = {}
  if (user) {
    const ids = challenges.map(c => c.id)
    const { data: attempts } = await adminClient
      .from('challenge_attempts')
      .select('challenge_id, total_score')
      .eq('user_id', user.id)
      .in('challenge_id', ids)
      .eq('status', 'completed')
      .order('total_score', { ascending: false })

    for (const a of attempts ?? []) {
      if (!scoreMap[a.challenge_id] || a.total_score > scoreMap[a.challenge_id]) {
        scoreMap[a.challenge_id] = a.total_score
      }
    }
  }

  // Group into chapters by canonical difficulty. Coerce each row so legacy
  // strings (warmup/standard/advanced/staff_plus/beginner/intermediate) and
  // canonical strings (easy/medium/hard) both bucket correctly.
  const toItem = (c: { id: string; title: string; difficulty: string }) => ({
    id: c.id,
    title: c.title,
    difficulty: c.difficulty,
    best_score: scoreMap[c.id] ?? null,
    is_completed: scoreMap[c.id] != null,
  })

  const grouped: Record<PracticeDifficulty, ReturnType<typeof toItem>[]> = { easy: [], medium: [], hard: [] }
  for (const c of challenges) {
    const bucket = coerceDifficulty(c.difficulty)
    if (bucket) grouped[bucket].push(toItem(c))
  }

  const CHAPTER_META: Record<PracticeDifficulty, { title: string; icon: string }> = {
    easy:   { title: 'Chapter 1: Product Sense & Foundations', icon: 'psychology' },
    medium: { title: 'Chapter 2: Execution & Metrics',         icon: 'monitoring' },
    hard:   { title: 'Chapter 3: Strategy & Leadership',       icon: 'diversity_3' },
  }
  const chapters = (['easy', 'medium', 'hard'] as const)
    .map(key => ({ key, ...CHAPTER_META[key], items: grouped[key] }))
    .filter(ch => ch.items.length > 0)

  return NextResponse.json({ chapters })
}
