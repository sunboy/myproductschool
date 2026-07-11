import { MOCK_LIVE_INTERVIEW_PERSONAS } from '@/lib/mock-live-interviews'
import { IS_MOCK } from '@/lib/mock'
import { UsageProvider } from '@/context/UsageContext'
import { BillingUsageFromProfile } from '@/components/billing/BillingUsageFromProfile'
import {
  challengeTypeToDiscipline,
  DISCIPLINE_META,
  type LiveInterviewDiscipline,
} from '@/lib/live-interview/disciplines'
import { HatchImage } from '@/components/redesign/HatchImage'
import { HatchSays } from '@/components/redesign/HatchSays'
import { LiveInterviewsShellClient } from './LiveInterviewsShellClient'

export interface ScenarioBrief {
  id: string
  title: string
  scenarioQuestion: string
  difficulty: string
  estimatedMinutes: number
  relevantRoles: string[]
  primaryCompetencies: string[]
  discipline: LiveInterviewDiscipline
}

async function getPersonas() {
  if (IS_MOCK) {
    return MOCK_LIVE_INTERVIEW_PERSONAS
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase
    .from('company_profiles')
    .select('slug, name, icon, roles, interview_persona_prompt, interview_style')
    .order('name')

  if (!data?.length) return MOCK_LIVE_INTERVIEW_PERSONAS

  return data.flatMap((company: {
    slug: string
    name: string
    icon: string
    roles: string[]
    interview_persona_prompt?: string
    interview_style?: string
  }) =>
    (company.roles ?? []).map((role: string) => ({
      companyId: company.slug,
      companyName: company.name,
      role,
      slug: `${company.slug}-${role.toLowerCase().replace(/\s+/g, '-')}`,
      icon: company.icon ?? 'corporate_fare',
      interviewStyle: company.interview_style ?? '',
      difficulty: 'medium' as const,
      estimatedMins: 35,
      personaPrompt: company.interview_persona_prompt,
    }))
  )
}

async function getScenarios(): Promise<ScenarioBrief[]> {
  if (IS_MOCK) return []

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase
    .from('challenges')
    .select('id, title, scenario_question, difficulty, estimated_minutes, relevant_roles, primary_competencies, challenge_type')
    .eq('is_published', true)
    .not('scenario_question', 'is', null)
    .in('challenge_type', [
      'flow',
      'freeform',
      'quick_take',
      'system_design',
      'data_modeling',
      'sql',
      'algorithm',
    ])
    .order('difficulty')
    .limit(120)

  return (data ?? [])
    .map((c) => {
      const discipline = challengeTypeToDiscipline(c.challenge_type)
      if (!discipline) return null
      return {
        id: c.id,
        title: c.title,
        scenarioQuestion: c.scenario_question ?? '',
        difficulty: c.difficulty ?? 'standard',
        estimatedMinutes: c.estimated_minutes ?? 20,
        relevantRoles: c.relevant_roles ?? [],
        primaryCompetencies: c.primary_competencies ?? [],
        discipline,
      } satisfies ScenarioBrief
    })
    .filter((s): s is ScenarioBrief => s !== null)
}

interface LastSessionBrief {
  id: string
  overallScore: number
  disciplineLabel: string | null
}

/**
 * Latest scored session, used only for the hero HatchSays observation
 * (spec §4: HatchSays names real state, never filler). Read-only; mirrors
 * the /api/live-interview/history access pattern (admin client scoped to
 * the signed-in user, since RLS on live_interview_sessions blocks the
 * anon-key client).
 */
async function getLastSessionBrief(): Promise<LastSessionBrief | null> {
  if (IS_MOCK) return null
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()
    const { data: sessions } = await adminClient
      .from('live_interview_sessions')
      .select('id, challenge_id, debrief_json, ended_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('ended_at', { ascending: false })
      .limit(1)

    const session = sessions?.[0]
    if (!session) return null
    const debrief = session.debrief_json as Record<string, unknown> | null
    const overallScore = typeof debrief?.overallScore === 'number' ? debrief.overallScore : null
    // A zero score means the debrief never produced a real signal; showing
    // "scored 0" would be noise, not an observation. Fall back to the starter line.
    if (overallScore == null || overallScore <= 0) return null

    let disciplineLabel: string | null = null
    if (session.challenge_id) {
      const { data: challenge } = await adminClient
        .from('challenges')
        .select('challenge_type')
        .eq('id', session.challenge_id)
        .maybeSingle()
      const discipline = challenge ? challengeTypeToDiscipline(challenge.challenge_type) : null
      disciplineLabel = discipline ? DISCIPLINE_META[discipline].label : null
    }

    return { id: session.id, overallScore, disciplineLabel }
  } catch {
    return null
  }
}

export default async function LiveInterviewsPage() {
  const [personas, scenarios, lastSession] = await Promise.all([
    getPersonas(),
    getScenarios(),
    getLastSessionBrief(),
  ])

  const hatchMessage = lastSession
    ? `Your last session scored ${lastSession.overallScore}${lastSession.disciplineLabel ? ` on ${lastSession.disciplineLabel}` : ''}. The debrief lists what to fix before the next round.`
    : 'First session: pick a discipline below. Hatch grades it on the same four moves as your reps.'

  return (
    <UsageProvider>
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-8 sm:py-5">
        {/* ── Compact dense dark hero (previews/round4/interviews-hub.html) ── */}
        <section
          data-tour-target="interviews-hero"
          className="relative overflow-hidden rounded-2xl px-[26px] py-6 text-white"
          style={{
            background:
              'radial-gradient(900px 400px at 88% -10%, rgba(30,71,45,.55), transparent 60%), linear-gradient(115deg, var(--color-forest-950) 0%, var(--color-forest-850) 55%, var(--color-forest-800) 100%)',
          }}
        >
          <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_230px]">
            <div className="min-w-0 lg:pr-32">
              <div className="mb-2 font-label text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-mint-glow">
                Live interviews
              </div>
              <h1 className="mb-2 max-w-[34ch] font-headline text-[28px] sm:text-[30px] font-semibold leading-[1.2] text-[#f9faf5]">
                A 45-minute mock with follow-ups, graded on the same rubric as your <span className="hl-word">reps</span>.
              </h1>
              <p className="max-w-[58ch] text-[13px] leading-[1.55] text-white/72">
                Hatch probes, watches the canvas or editor, carries context across rounds, and writes the debrief.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[12.5px] leading-none">
                  <span className="font-extrabold text-[#f9faf5]">Voice or chat</span>{' '}
                  <span className="text-white/60">mic optional</span>
                </span>
                <span className="text-[12px] text-white/30">·</span>
                <span className="text-[12.5px] leading-none">
                  <span className="font-extrabold text-[#f9faf5]">Whiteboard and CoderPad</span>{' '}
                  <span className="text-white/60">when the question needs one</span>
                </span>
              </div>
            </div>

            <div className="relative flex items-center lg:col-start-2">
              <div className="pointer-events-none absolute -left-[150px] bottom-[-28px] z-[1] hidden w-[132px] lg:block">
                <HatchImage state="thinking" size={132} priority className="drop-shadow-[0_10px_18px_rgba(0,0,0,.35)]" />
              </div>
              <HatchSays
                className="relative z-10 w-full"
                tint="mint"
                message={hatchMessage}
                ctaLabel={lastSession ? 'Start the next round' : 'Set up an interview'}
                ctaHref="#interview-setup"
              />
            </div>
          </div>
        </section>

        <div className="mt-4">
          <BillingUsageFromProfile />
        </div>

        <div id="interview-setup" className="mt-4 scroll-mt-24">
          <LiveInterviewsShellClient personas={personas} scenarios={scenarios} />
        </div>
      </div>
    </UsageProvider>
  )
}
