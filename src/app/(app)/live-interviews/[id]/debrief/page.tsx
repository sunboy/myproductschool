import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import CompetencyRadar from '@/components/live-interview/CompetencyRadar'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'
import { MOCK_LIVE_DEBRIEF, MOCK_LIVE_TURNS } from '@/lib/mock-live-interviews'
import type { LiveInterviewDebrief, LiveInterviewTurn } from '@/lib/mock-live-interviews'
import type { FlowStep } from '@/lib/types'

interface DebriefPageProps {
  params: Promise<{ id: string }>
}

const FLOW_STEPS: FlowStep[] = ['frame', 'list', 'optimize', 'win']

const FLOW_LABELS: Record<FlowStep, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

function getScoreDescriptor(score: number): string {
  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Good'
  if (score > 0) return 'Developing'
  return 'Not reached'
}

function getGradeDescriptor(score: number): string {
  if (score >= 90) return 'Excellent performance'
  if (score >= 75) return 'Strong performance with room to grow'
  if (score >= 60) return 'Good foundation — focus on the areas below'
  return 'Keep practicing — review the suggestions below'
}

const COMPETENCY_LABELS: Record<string, string> = {
  motivation_theory: 'Motivation Theory',
  cognitive_empathy: 'Cognitive Empathy',
  taste: 'Taste',
  strategic_thinking: 'Strategic Thinking',
  creative_execution: 'Creative Execution',
  domain_expertise: 'Domain Expertise',
}

export default async function DebriefPage({ params }: DebriefPageProps) {
  const { id } = await params

  let debrief: LiveInterviewDebrief
  let companyName = ''
  let role = ''
  let sessionDate = ''
  let durationMins = 0
  let turns: LiveInterviewTurn[] = []

  if (IS_MOCK) {
    debrief = MOCK_LIVE_DEBRIEF
    companyName = 'Uber'
    role = 'PM'
    sessionDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    durationMins = 23
    turns = MOCK_LIVE_TURNS
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const adminClient = createAdminClient()
    const { data: session } = await adminClient
      .from('live_interview_sessions')
      .select('debrief_json, company_id, role_id, flow_coverage, total_turns, started_at, ended_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!session?.debrief_json) {
      redirect('/live-interviews')
    }

    debrief = session.debrief_json as LiveInterviewDebrief

    // Fetch company name
    if (session.company_id) {
      const { data: company } = await adminClient
        .from('companies')
        .select('name')
        .eq('id', session.company_id)
        .single()
      companyName = company?.name ?? ''
    }

    role = session.role_id ?? ''
    sessionDate = session.started_at
      ? new Date(session.started_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : ''

    if (session.started_at && session.ended_at) {
      durationMins = Math.round(
        (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000
      )
    }

    // Fetch transcript turns
    const { data: turnData } = await adminClient
      .from('live_interview_turns')
      .select('id, session_id, turn_index, role, content, flow_move_detected, created_at')
      .eq('session_id', id)
      .order('turn_index', { ascending: true })

    if (turnData) {
      turns = turnData.map(t => ({
        id: t.id,
        sessionId: t.session_id,
        turnIndex: t.turn_index,
        role: t.role,
        content: t.content,
        flowMoveDetected: t.flow_move_detected,
        createdAt: t.created_at,
      }))
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6">
      {/* Back navigation */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/live-interviews"
          className="p-2 rounded-lg hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <span className="text-sm text-on-surface-variant font-label">Back to interviews</span>
      </div>

      {/* Page title */}
      <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">
        Live Interview Debrief
      </h1>
      <p className="text-sm text-on-surface-variant font-label mb-6">
        {companyName} {role && `· ${role}`} {sessionDate && `· ${sessionDate}`}{' '}
        {durationMins > 0 && `· ${durationMins} min`}
      </p>

      <div className="space-y-5">
        {/* Score card */}
        <div className="bg-surface-container rounded-xl p-6 border-t-4 border-primary">
          <div className="flex items-center gap-4 mb-4">
            <LumaGlyph size={64} state="celebrating" className="text-primary shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-headline font-extrabold text-primary">
                  {debrief.overallScore}
                </span>
                <span className="bg-primary-container text-on-primary-container rounded-full px-4 py-1 font-label font-semibold text-sm">
                  {debrief.grade}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mt-1">
                {getGradeDescriptor(debrief.overallScore)}
              </p>
            </div>
          </div>
        </div>

        {/* FLOW Scores */}
        <div className="bg-surface-container rounded-xl p-6">
          <h2 className="font-headline text-lg font-bold text-on-surface mb-4">FLOW Scores</h2>
          <div className="space-y-3">
            {FLOW_STEPS.map(step => {
              const score = debrief.flowScores[step] ?? 0
              const descriptor = getScoreDescriptor(score)
              return (
                <div key={step} className="flex items-center gap-4">
                  <span className="w-20 text-sm font-label font-semibold text-on-surface">
                    {FLOW_LABELS[step]}
                  </span>
                  <div className="flex-1 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-label font-bold text-primary">
                    {score}%
                  </span>
                  <span className="w-24 text-right text-xs font-label text-on-surface-variant">
                    {descriptor}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="bg-surface border-l-4 border-primary rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-primary text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                stars
              </span>
              <h3 className="font-headline font-bold text-on-surface text-lg">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {debrief.strengths.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-lg shrink-0">
                    check_circle
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-surface border-l-4 border-secondary rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-secondary text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lightbulb
              </span>
              <h3 className="font-headline font-bold text-on-surface text-lg">Areas for Growth</h3>
            </div>
            <ul className="space-y-2">
              {debrief.improvements.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-secondary text-lg shrink-0">
                    arrow_forward
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Competency Signals */}
        {debrief.competencySignals.length > 0 && (
          <div className="bg-surface-container rounded-xl p-6">
            <h2 className="font-headline text-lg font-bold text-on-surface mb-4">
              Competency Signals
            </h2>
            <div className="space-y-3">
              {debrief.competencySignals.map((signal, i) => (
                <div
                  key={i}
                  className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary-container text-on-primary-container rounded-full px-3 py-0.5 text-xs font-label font-semibold">
                      {COMPETENCY_LABELS[signal.competency] ?? signal.competency}
                    </span>
                    <span className="text-xs text-on-surface-variant font-label">
                      Detected in {FLOW_LABELS[signal.stepDetected as FlowStep] ?? signal.stepDetected}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{signal.signal}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failure Patterns */}
        {debrief.failurePatternsDetected.length > 0 && (
          <div className="bg-surface-container rounded-xl p-6">
            <h2 className="font-headline text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-error">warning</span>
              Failure Patterns Detected
            </h2>
            <div className="space-y-3">
              {debrief.failurePatternsDetected.map((pattern, i) => (
                <div
                  key={i}
                  className="bg-surface-container-high rounded-lg p-4 border-l-4 border-error"
                >
                  <p className="font-label font-semibold text-on-surface text-sm mb-1">
                    {pattern.patternName}
                  </p>
                  <p className="text-sm text-on-surface-variant">{pattern.evidence}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Challenge Recommendation */}
        {debrief.nextChallengeRecommendation && (
          <div className="bg-tertiary-fixed rounded-xl p-5 flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary shrink-0 mt-0.5">
              lightbulb
            </span>
            <div>
              <p className="font-label font-semibold text-on-tertiary-fixed-variant mb-1">
                Recommended Next
              </p>
              <p className="text-sm text-on-tertiary-fixed-variant">
                {debrief.nextChallengeRecommendation}
              </p>
            </div>
          </div>
        )}

        {/* Per-Turn Timeline */}
        {turns.length > 0 && (
          <div className="bg-surface-container rounded-xl p-6">
            <h2 className="font-headline text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">chat</span>
              Turn-by-Turn Timeline
            </h2>
            <div className="space-y-0">
              {(() => {
                // Group turns into pairs (user + luma)
                const pairs: Array<{ user?: typeof turns[0]; luma?: typeof turns[0]; index: number }> = []
                let pairIndex = 0
                for (let i = 0; i < turns.length; i++) {
                  pairIndex++
                  const turn = turns[i]
                  if (turn.role === 'user') {
                    const next = turns[i + 1]
                    if (next?.role === 'luma') {
                      pairs.push({ user: turn, luma: next, index: pairIndex })
                      i++ // skip the luma turn
                    } else {
                      pairs.push({ user: turn, index: pairIndex })
                    }
                  } else {
                    // Luma turn without user (opening message)
                    pairs.push({ luma: turn, index: pairIndex })
                  }
                }

                const flowBorderColors: Record<string, string> = {
                  frame: 'var(--color-primary, #4a7c59)',
                  list: 'var(--color-tertiary, #705c30)',
                  optimize: '#4a6fa5',
                  win: '#6b4a7c',
                }
                const defaultBorderColor = 'var(--color-outline-variant, #c4c8bc)'

                const startTime = turns[0]?.createdAt ? new Date(turns[0].createdAt).getTime() : 0

                return pairs.map((pair) => {
                  const flowMove = pair.luma?.flowMoveDetected
                  const borderColorValue = flowMove ? flowBorderColors[flowMove] ?? defaultBorderColor : defaultBorderColor
                  const relTime = pair.user?.createdAt && startTime
                    ? Math.round((new Date(pair.user.createdAt).getTime() - startTime) / 1000)
                    : null
                  const timeStr = relTime != null ? `${Math.floor(relTime / 60)}:${String(relTime % 60).padStart(2, '0')}` : ''

                  return (
                    <details key={pair.index} className="border-l-4 pl-4 py-3" style={{ borderLeftColor: borderColorValue }}>
                      <summary className="cursor-pointer select-none flex items-center gap-3">
                        <span className="font-label text-xs font-bold text-on-surface-variant w-6 shrink-0">
                          #{pair.index}
                        </span>
                        {timeStr && (
                          <span className="font-label text-[10px] text-on-surface-variant/60 w-10 shrink-0">
                            {timeStr}
                          </span>
                        )}
                        <span className="flex-1 text-sm text-on-surface-variant truncate font-body">
                          {pair.user ? pair.user.content.slice(0, 100) : pair.luma?.content.slice(0, 100)}
                          {((pair.user?.content ?? pair.luma?.content) ?? '').length > 100 ? '...' : ''}
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          {flowMove && (
                            <span className="bg-primary-fixed text-primary rounded-full px-2 py-0.5 text-[10px] font-label font-bold uppercase">
                              {FLOW_LABELS[flowMove as FlowStep] ?? flowMove}
                            </span>
                          )}
                        </span>
                      </summary>
                      <div className="mt-2 space-y-2 ml-9">
                        {pair.user && (
                          <div className="bg-surface-container-high rounded-lg p-3">
                            <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase">You</span>
                            <p className="text-sm text-on-surface-variant leading-relaxed mt-0.5">{pair.user.content}</p>
                          </div>
                        )}
                        {pair.luma && (
                          <div className="bg-primary-fixed/50 border border-primary/10 rounded-lg p-3">
                            <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase">Luma</span>
                            <p className="text-sm text-on-surface-variant leading-relaxed mt-0.5">{pair.luma.content}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  )
                })
              })()}
            </div>
          </div>
        )}

        {/* Competency Radar */}
        {debrief.competencySignals.length > 0 && (
          <div className="bg-surface-container rounded-xl p-6">
            <h2 className="font-headline text-lg font-bold text-on-surface mb-4">
              Competency Radar
            </h2>
            <div className="flex justify-center">
              <CompetencyRadar signals={debrief.competencySignals} />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2 pb-6">
          <Link
            href="/live-interviews"
            className="flex-1 py-3 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 shadow-md shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 font-label text-sm"
          >
            <span className="material-symbols-outlined">mic</span>
            Start Another Interview
          </Link>
          <Link
            href="/challenges"
            className="flex-1 py-3 border border-primary text-primary rounded-full font-bold hover:bg-primary/5 transition-all active:scale-95 flex items-center justify-center gap-2 font-label text-sm"
          >
            <span className="material-symbols-outlined">fitness_center</span>
            Practice Challenges
          </Link>
        </div>
      </div>
    </div>
  )
}
