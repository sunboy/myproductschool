import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { InterviewLoop, LoopRound, LoopDebriefResult } from '@/lib/interview-loops/types'
import { StartRoundButton } from './StartRoundButton'

const DISCIPLINE_LABELS: Record<string, string> = {
  product_sense: 'Product Sense',
  system_design: 'System Design',
  data_modeling: 'Data Modeling',
  coding: 'Coding',
}

export default async function LoopDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const [loopResult, roundsResult] = await Promise.all([
    adminClient.from('interview_loops' as string).select('*').eq('id', id).eq('user_id', user.id).single(),
    adminClient.from('loop_rounds' as string).select('*').eq('loop_id', id).order('round_index', { ascending: true }),
  ])

  const loop = loopResult.data as InterviewLoop | null
  if (!loop) redirect('/live-interviews')

  const rounds = (roundsResult.data ?? []) as LoopRound[]
  const nextRound = rounds.find((r) => r.status === 'pending' || r.status === 'paused')
  const pausedRound = rounds.find((r) => r.status === 'paused')

  const debrief = loop.loop_debrief_json as LoopDebriefResult | null

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-headline font-bold text-on-surface text-xl mb-1">{loop.title}</h1>
        <p className="font-body text-sm text-on-surface-variant capitalize">{loop.status.replace('_', ' ')}</p>
      </div>

      {/* Rounds list */}
      <div className="flex flex-col gap-3">
        {rounds.map((round) => {
          const isDone = round.status === 'completed'
          const isPaused = round.status === 'paused'
          const isNext = round.id === nextRound?.id

          return (
            <div
              key={round.id}
              className={[
                'rounded-xl p-4 border flex items-center gap-3',
                isDone
                  ? 'bg-primary-fixed border-primary/20'
                  : isPaused
                  ? 'bg-tertiary-container/40 border-tertiary-container'
                  : isNext
                  ? 'bg-surface-container border-outline'
                  : 'bg-surface-container-low border-outline-variant opacity-50',
              ].join(' ')}
            >
              <div
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  isDone
                    ? 'bg-primary text-on-primary'
                    : isPaused
                    ? 'bg-tertiary-container text-on-surface'
                    : 'bg-surface-container-high text-on-surface-variant',
                ].join(' ')}
              >
                {isDone ? (
                  <span className="material-symbols-outlined text-sm leading-none">check</span>
                ) : (
                  round.round_index + 1
                )}
              </div>

              <div className="flex-1">
                <div className="font-label font-semibold text-sm text-on-surface">
                  {DISCIPLINE_LABELS[round.discipline] ?? round.discipline}
                </div>
                {round.round_score !== null && (
                  <div className="font-label text-xs text-primary">{round.round_score}/100</div>
                )}
                {isPaused && (
                  <div className="font-label text-xs text-on-surface-variant">Paused</div>
                )}
              </div>

              {isDone && round.session_id && (
                <Link
                  href={`/live-interviews/${round.session_id}/debrief`}
                  className="font-label text-xs text-primary"
                >
                  View debrief →
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA */}
      {loop.status !== 'completed' && nextRound && (
        <div>
          {pausedRound?.session_id ? (
            <Link href={`/live-interviews/${pausedRound.session_id}?loop_id=${id}&round_index=${pausedRound.round_index}${pausedRound.discipline ? `&discipline=${pausedRound.discipline}` : ''}`}>
              <button className="w-full bg-primary text-on-primary rounded-xl py-3 font-label font-bold text-sm">
                Resume Round {pausedRound.round_index + 1} →
              </button>
            </Link>
          ) : (
            <StartRoundButton
              loopId={id}
              label={`Start Round ${nextRound.round_index + 1}: ${DISCIPLINE_LABELS[nextRound.discipline] ?? nextRound.discipline} →`}
            />
          )}
        </div>
      )}

      {/* Loop debrief (when complete) */}
      {loop.status === 'completed' && debrief && (
        <div className="bg-inverse-surface rounded-xl p-5 flex flex-col gap-3">
          <div className="font-label font-bold text-inverse-on-surface">Loop complete</div>
          <div className="font-body text-3xl font-bold text-primary">
            {debrief.hire_signal?.replace('_', ' ') ?? 'Done'}
          </div>
          {debrief.cross_round_insights?.[0]?.pattern && (
            <div className="font-body text-xs text-inverse-on-surface/60">
              {debrief.cross_round_insights[0].pattern}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
