import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getChallengeById } from '@/lib/data/challenges'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { FailurePattern } from '@/lib/types'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { DiagnosisCard } from '@/components/challenge/DiagnosisCard'
import { SkillMovementRow } from '@/components/challenge/SkillMovementRow'
import { PrescriptionCard } from '@/components/challenge/PrescriptionCard'
import { IS_MOCK } from '@/lib/mock'

// Interview risk per pattern (consequence sentence)
const PATTERN_CONSEQUENCES: Record<string, string> = {
  'FP-01': "In interviews, anchoring on headlines signals you haven't done first-principles thinking.",
  'FP-02': "Interviewers notice when you name symptoms without explaining the causal chain — it reads as shallow analysis.",
  'FP-03': "Treating all users as one segment is a red flag — strong PMs immediately ask 'which users?'",
  'FP-04': "Reciting metrics without explaining your selection criteria signals metric knowledge without metric judgment.",
  'FP-05': "Missing economic implications makes your analysis feel academic rather than business-grounded.",
  'FP-06': "Jumping to solutions before diagnosing the problem is the most common PM interview failure mode.",
  'FP-07': "Completeness without prioritization signals inability to make hard calls under pressure.",
  'FP-08': "Template thinking shows you've memorized frameworks but can't adapt them to novel situations.",
  'FP-09': "In live interviews, an unordered list of investigations reads as inability to prioritize under pressure.",
  'FP-10': "Never saying what NOT to do signals you don't understand opportunity cost — a core PM skill.",
  'FP-11': "Claims without evidence make interviewers doubt your judgment and rigor.",
  'FP-12': "Vague recommendations are the single most common feedback engineers receive in PM loop debriefs.",
  'FP-13': "When your diagnosis and recommendations don't connect, interviewers lose confidence in your reasoning.",
  'FP-14': "Forgetting stakeholder translation signals you've been heads-down in execution without cross-functional experience.",
}

interface ScoreDimension {
  dimension: string
  score: number
}

interface SkillDelta {
  dimension: string
  delta: number
}

interface PatternOccurrence {
  pattern_id: string
  pattern_name: string
  occurrence_count: number
  last_seen_at: string
}

interface DiagnosisPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ attempt?: string; confidence?: string }>
}

const ZERO_DELTAS: SkillDelta[] = [
  { dimension: 'diagnostic_accuracy', delta: 0 },
  { dimension: 'metric_fluency', delta: 0 },
  { dimension: 'framing_precision', delta: 0 },
  { dimension: 'recommendation_strength', delta: 0 },
]

export default async function DiagnosisPage({ params, searchParams }: DiagnosisPageProps) {
  const { id } = await params
  const { attempt, confidence } = await searchParams

  const challenge = await getChallengeById(id)
  if (!challenge) notFound()

  const isMock = IS_MOCK || attempt === 'mock' || !attempt

  let detectedPatterns: FailurePattern[] = []
  let skillDeltas: SkillDelta[] = ZERO_DELTAS
  let userPatterns: PatternOccurrence[] = []
  let actualScore: number | null = null
  let actualMaxScore: number | null = null

  if (!isMock) {
    // Fetch real user + attempt data
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const adminClient = createAdminClient()

      const [attemptResult, patternsResult] = await Promise.all([
        adminClient
          .from('challenge_attempts')
          .select('score_json, feedback_json')
          .eq('id', attempt)
          .eq('user_id', user.id)
          .single(),
        adminClient
          .from('user_failure_patterns')
          .select('pattern_id, pattern_name, occurrence_count, last_seen_at')
          .eq('user_id', user.id)
          .order('occurrence_count', { ascending: false })
          .limit(5),
      ])

      const attemptData = attemptResult.data
      userPatterns = (patternsResult.data as PatternOccurrence[]) ?? []

      if (attemptData) {
        const scoreJson = attemptData.score_json as Record<string, unknown>

        // Extract detected patterns from score_json
        detectedPatterns = (scoreJson?.detected_patterns as FailurePattern[]) ?? []

        // Calculate skill deltas from dimensions (baseline 5.0 on a 0–10 scale)
        const dimensions = scoreJson?.dimensions as ScoreDimension[] | undefined
        if (dimensions && dimensions.length > 0) {
          skillDeltas = dimensions.map((d) => ({
            dimension: d.dimension,
            delta: (d.score / 10) - 0.5,
          }))
        }

        // Extract overall score for confidence calibration
        const overallScore = scoreJson?.overall_score
        if (typeof overallScore === 'number') {
          actualScore = overallScore
          actualMaxScore = 10
        }
      }
    }
  }

  const primaryPattern = detectedPatterns[0] ?? null
  const hasPatterns = detectedPatterns.length > 0

  // Confidence calibration
  const confidenceRating = confidence ? parseInt(confidence) : null
  const displayScore = actualScore ?? 2.3
  const displayMaxScore = actualMaxScore ?? 4

  // Mock prescription (kept as-is per instructions)
  const prescription = {
    mode: 'live',
    challenge_slug: id,
    challenge_title: 'The Engagement Cliff',
    reason: "Your last 4 submissions listed investigations without ordering them. Live mode forces you to prioritize in real time.",
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/challenges/${id}/feedback${attempt ? `?attempt=${attempt}` : ''}`} className="p-2 rounded-lg hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <div>
          <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Session Diagnosis</p>
          <h1 className="font-headline text-xl text-on-surface">{challenge.title}</h1>
        </div>
      </div>

      {!hasPatterns ? (
        /* Empty state — strong submission */
        <div className="flex flex-col items-center text-center py-10 space-y-4 max-w-lg mx-auto">
          <HatchGlyph size={48} className="text-primary" animated />
          <div>
            <h2 className="font-headline text-2xl text-on-surface mb-2">Strong session.</h2>
            <p className="text-on-surface-variant text-sm">No failure patterns detected this session. Keep building.</p>
          </div>
          <div className="w-full bg-surface-container rounded-2xl p-5 text-left space-y-2">
            <p className="text-xs font-label font-semibold text-on-surface-variant uppercase tracking-widest">Weakest dimension</p>
            <p className="font-headline text-lg text-on-surface">Recommendation Strength</p>
            <p className="text-sm text-on-surface-variant">Keep working on the specificity and tradeoff awareness of your recommendations.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            {/* 1. One-line diagnosis */}
            <div className="bg-primary-container rounded-2xl p-5 flex gap-3 items-start">
              <HatchGlyph size={28} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-label font-semibold text-on-primary-container uppercase tracking-widest mb-1">Hatch&apos;s diagnosis</p>
                <p className="text-on-primary-container text-base font-medium">
                  {primaryPattern.pattern_id === 'FP-09'
                    ? "You recognized the right area quickly, but failed to prioritize the first move."
                    : primaryPattern.pattern_id === 'FP-04'
                    ? "You know the right metrics — but you haven't explained why they're the right metrics."
                    : `Pattern detected: ${primaryPattern.pattern_name}.`}
                </p>
              </div>
            </div>

            {/* 5. Confidence calibration */}
            {confidenceRating && (
              <div className="bg-surface-container rounded-2xl p-5 space-y-1">
                <p className="text-xs font-label font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Confidence calibration</p>
                <p className="text-sm text-on-surface">
                  You rated yourself <span className="font-semibold">{confidenceRating}/5</span>. Your score was <span className="font-semibold">{displayScore.toFixed(1)}/{displayMaxScore.toFixed(1)}</span>.
                </p>
                <p className="text-sm text-on-surface-variant italic">
                  {confidenceRating / 5 > displayScore / displayMaxScore + 0.1
                    ? "You tend to overestimate your performance on this type of challenge."
                    : confidenceRating / 5 < displayScore / displayMaxScore - 0.1
                    ? "You tend to underestimate yourself — trust your product instincts more."
                    : "Your confidence is well-calibrated to your actual performance."}
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-6">
            {/* 2. Skill movement */}
            <div className="space-y-2">
              <p className="text-xs font-label font-semibold text-on-surface-variant uppercase tracking-widest">Skill movement this session</p>
              <SkillMovementRow deltas={skillDeltas} />
            </div>

            {/* 3. Primary failure pattern card */}
            <DiagnosisCard
              pattern={primaryPattern}
              occurrenceCount={
                userPatterns.find((p) => p.pattern_id === primaryPattern.pattern_id)?.occurrence_count ?? 1
              }
              isNew={false}
              interviewRisk={PATTERN_CONSEQUENCES[primaryPattern.pattern_id]}
            />

            {/* 4. Secondary patterns (if any) */}
            {detectedPatterns.slice(1).map(p => (
              <DiagnosisCard
                key={p.pattern_id}
                pattern={p}
                occurrenceCount={
                  userPatterns.find((up) => up.pattern_id === p.pattern_id)?.occurrence_count ?? 1
                }
                isNew={false}
              />
            ))}

            {/* 6. Prescription */}
            <div className="space-y-2">
              <p className="text-xs font-label font-semibold text-on-surface-variant uppercase tracking-widest">Next prescription</p>
              <PrescriptionCard
                mode={prescription.mode}
                challengeTitle={prescription.challenge_title}
                challengeSlug={prescription.challenge_slug}
                reason={prescription.reason}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
