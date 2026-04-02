import { createAdminClient } from '@/lib/supabase/admin'

// STUB — see TODO.md for full Luma Brain architecture
export async function getLumaContext(
  userId: string,
  _challengeId: string,
  _step: string
): Promise<string> {
  try {
    const admin = createAdminClient()
    const [{ data: insights }, { data: competencies }] = await Promise.all([
      admin.from('luma_context')
        .select('content')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3),
      admin.from('learner_competencies')
        .select('competency, score, trend')
        .eq('user_id', userId),
    ])
    const parts: string[] = []
    if (competencies?.length) {
      const sorted = [...competencies].sort((a, b) => a.score - b.score)
      const weakest = sorted[0]
      parts.push(`Learner's weakest area: ${weakest.competency} (score ${weakest.score}/100, ${weakest.trend})`)
    }
    if (insights?.length) {
      parts.push('Recent Luma insights: ' + insights.map((i: { content: string }) => i.content).join(' | '))
    }
    return parts.length ? parts.join('\n') : ''
  } catch {
    return ''
  }
}
