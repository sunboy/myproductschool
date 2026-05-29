import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

export const metadata = { title: 'Submission History | HackProduct' }

const CANVAS_TYPES = new Set(['system_design', 'data_modeling'])

interface SubmissionRow {
  attemptId: string
  challengeId: string
  challengeTitle: string
  challengeType: string | null
  language: string | null
  testsPassed: number | null
  testsTotal: number | null
  overallScore: number | null
  submittedAt: string
  canvasPngUrl: string | null
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Query: interview_grades joined through challenge_attempts to challenges
  // Includes coding (sql, algorithm) and canvas (system_design, data_modeling) submissions
  const { data: grades, error } = await supabase
    .from('interview_grades')
    .select(`
      attempt_id,
      overall_score,
      graded_at,
      challenge_type,
      challenge_attempts!inner (
        id,
        user_id,
        challenge_id,
        final_language,
        test_results,
        canvas_png_url,
        challenges!inner (
          id,
          title
        )
      )
    `)
    .eq('challenge_attempts.user_id', user.id)
    .in('challenge_type', ['sql', 'algorithm', 'system_design', 'data_modeling'])
    .order('graded_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('History query error:', error)
  }

  // Normalise the joined rows into flat SubmissionRow objects
  const rows: SubmissionRow[] = (grades ?? []).map((grade) => {
    // Supabase returns nested objects; handle both array and object shapes
    const attempt = Array.isArray(grade.challenge_attempts)
      ? grade.challenge_attempts[0]
      : grade.challenge_attempts
    type AttemptWithChallenge = {
      challenges: { id: string; title: string } | { id: string; title: string }[]
      canvas_png_url?: string | null
    }
    const typedAttempt = attempt as unknown as AttemptWithChallenge | null
    const challenge = typedAttempt
      ? Array.isArray(typedAttempt.challenges)
        ? typedAttempt.challenges[0]
        : typedAttempt.challenges as { id: string; title: string }
      : null

    const testResults = attempt?.test_results as
      | { tests_passed?: number; tests_total?: number }
      | null
      | undefined

    return {
      attemptId: grade.attempt_id,
      challengeId: challenge?.id ?? '',
      challengeTitle: challenge?.title ?? 'Unknown challenge',
      challengeType: grade.challenge_type ?? null,
      language: attempt?.final_language ?? null,
      testsPassed: testResults?.tests_passed ?? null,
      testsTotal: testResults?.tests_total ?? null,
      overallScore: grade.overall_score ?? null,
      submittedAt: grade.graded_at ?? '',
      canvasPngUrl: typedAttempt?.canvas_png_url ?? null,
    }
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <HatchGlyph size={32} state="idle" className="text-primary flex-shrink-0" />
        <div>
          <h1 className="font-headline text-2xl text-on-surface">Submission History</h1>
          <p className="text-sm text-on-surface-variant font-body">
            Your past coding interview attempts and Hatch grades
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">
            history
          </span>
          <p className="font-headline text-lg text-on-surface mb-1">No submissions yet</p>
          <p className="text-sm text-on-surface-variant font-body mb-6">
            Complete a coding or design challenge to see your history here.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-label font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[16px]">explore</span>
            Browse challenges
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <SubmissionRowCard key={row.attemptId} row={row} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SubmissionRowCard - one row per graded attempt
// ---------------------------------------------------------------------------

function SubmissionRowCard({ row }: { row: SubmissionRow }) {
  const isCanvas = CANVAS_TYPES.has(row.challengeType ?? '')

  // Canvas types link to the feedback page; coding types go back to workspace
  const href = isCanvas
    ? `/challenges/${row.challengeId}/feedback?attempt=${row.attemptId}`
    : `/workspace/challenges/${row.challengeId}?attempt=${row.attemptId}`

  const date = row.submittedAt
    ? new Date(row.submittedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '-'
  const time = row.submittedAt
    ? new Date(row.submittedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  const passRatio =
    row.testsPassed !== null && row.testsTotal !== null
      ? `${row.testsPassed}/${row.testsTotal} tests`
      : null

  const typeLabel =
    row.challengeType === 'system_design' ? 'System design'
    : row.challengeType === 'data_modeling' ? 'Data modeling'
    : null

  const scoreColor =
    row.overallScore === null
      ? 'text-on-surface-variant'
      : row.overallScore >= 4.5
      ? 'text-primary'
      : row.overallScore >= 3
      ? 'text-tertiary'
      : 'text-error'

  const scoreBg =
    row.overallScore === null
      ? 'bg-surface-container'
      : row.overallScore >= 4.5
      ? 'bg-primary-container text-on-primary-container'
      : row.overallScore >= 3
      ? 'bg-tertiary-container text-on-tertiary-container'
      : 'bg-error/10 text-error'

  return (
    <Link
      href={href}
      data-testid="submission-row"
      className="block bg-surface-container rounded-xl border border-outline-variant/60 hover:border-outline-variant hover:bg-surface-container-high transition-all group overflow-hidden"
    >
      {/* Canvas thumbnail strip */}
      {isCanvas && row.canvasPngUrl && (
        <div className="relative w-full bg-surface-container-low border-b border-outline-variant/40" style={{ height: '100px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.canvasPngUrl}
            alt="Canvas diagram"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container/60" />
        </div>
      )}
      {isCanvas && !row.canvasPngUrl && (
        <div className="w-full h-10 bg-surface-container-low border-b border-outline-variant/40 flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant/30 text-[24px]">schema</span>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap p-4">
        {/* Challenge title */}
        <div className="flex-1 min-w-0">
          <p className="font-label font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
            {row.challengeTitle}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-on-surface-variant font-body">
              {date} {time && `· ${time}`}
            </span>
            {typeLabel && (
              <span className="text-xs font-label px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                {typeLabel}
              </span>
            )}
            {row.language && (
              <span className="text-xs font-label px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                {row.language}
              </span>
            )}
            {passRatio && (
              <span className="text-xs text-on-surface-variant font-body">{passRatio}</span>
            )}
          </div>
        </div>

        {/* Score badge */}
        {row.overallScore !== null ? (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label font-bold text-sm ${scoreBg}`}
          >
            <span className={`material-symbols-outlined text-[15px] ${scoreColor}`}
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
              star
            </span>
            {row.overallScore.toFixed(1)}
          </div>
        ) : (
          <span className="text-xs text-on-surface-variant font-body italic">No score</span>
        )}

        {/* Arrow */}
        <span className="material-symbols-outlined text-on-surface-variant/50 group-hover:text-primary transition-colors text-[18px]">
          chevron_right
        </span>
      </div>
    </Link>
  )
}
