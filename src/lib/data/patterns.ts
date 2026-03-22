import { createClient } from '@/lib/supabase/server'
import type { PatternSummary, UserFailurePattern } from '@/lib/types'

export async function getUserPatternSummary(userId: string): Promise<PatternSummary[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return [
      { user_id: userId, pattern_id: 'FP-09', pattern_name: 'Unprioritized Investigation', occurrence_count: 4, last_seen: new Date().toISOString(), avg_confidence: 0.85 },
      { user_id: userId, pattern_id: 'FP-04', pattern_name: 'Metric Recitation', occurrence_count: 2, last_seen: new Date().toISOString(), avg_confidence: 0.75 },
    ]
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_pattern_summary')
    .select('*')
    .eq('user_id', userId)
    .order('occurrence_count', { ascending: false })

  if (error) {
    console.error('getUserPatternSummary error:', error)
    return []
  }
  return (data ?? []) as PatternSummary[]
}

export async function getPatternsByAttempt(attemptId: string): Promise<UserFailurePattern[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return [
      {
        id: 'mock-pattern-1',
        user_id: 'mock-user',
        attempt_id: attemptId,
        pattern_id: 'FP-09',
        pattern_name: 'Unprioritized Investigation',
        confidence: 0.85,
        evidence: 'Listed 5 investigation areas without indicating which to pursue first',
        question: 'q2',
        created_at: new Date().toISOString(),
      },
    ]
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_failure_patterns')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('confidence', { ascending: false })

  if (error) {
    console.error('getPatternsByAttempt error:', error)
    return []
  }
  return (data ?? []) as UserFailurePattern[]
}

// Consequence sentences per pattern (for interview risk display)
export const PATTERN_CONSEQUENCES: Record<string, string> = {
  'FP-01': 'In interviews, anchoring on headlines signals you haven\'t done first-principles thinking.',
  'FP-02': 'Interviewers notice when you name symptoms without explaining the causal chain — it reads as shallow analysis.',
  'FP-03': 'Treating all users as one segment is a red flag — strong PMs immediately ask "which users?"',
  'FP-04': 'Reciting metrics without explaining your selection criteria signals metric knowledge without metric judgment.',
  'FP-05': 'Missing economic implications makes your analysis feel academic rather than business-grounded.',
  'FP-06': 'Jumping to solutions before diagnosing the problem is the most common PM interview failure mode.',
  'FP-07': 'Completeness without prioritization signals inability to make hard calls under pressure.',
  'FP-08': 'Template thinking shows you\'ve memorized frameworks but can\'t adapt them to novel situations.',
  'FP-09': 'In live interviews, an unordered list of investigations reads as inability to prioritize under pressure.',
  'FP-10': 'Never saying what NOT to do signals you don\'t understand opportunity cost — a core PM skill.',
  'FP-11': 'Claims without evidence make interviewers doubt your judgment and rigor.',
  'FP-12': 'Vague recommendations are the single most common feedback engineers receive in PM loop debriefs.',
  'FP-13': 'When your diagnosis and recommendations don\'t connect, interviewers lose confidence in your reasoning.',
  'FP-14': 'Forgetting stakeholder translation signals you\'ve been heads-down in execution without cross-functional experience.',
}
