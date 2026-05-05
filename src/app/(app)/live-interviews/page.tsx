import { MOCK_LIVE_INTERVIEW_PERSONAS } from '@/lib/mock-live-interviews'
import { UsageProvider } from '@/context/UsageContext'
import { BillingUsageFromProfile } from '@/components/billing/BillingUsageFromProfile'
import { LiveInterviewsShell } from './LiveInterviewsShell'
import {
  challengeTypeToDiscipline,
  type LiveInterviewDiscipline,
} from '@/lib/live-interview/disciplines'

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
  if (process.env.USE_MOCK_DATA === 'true') {
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
      difficulty: 'standard' as const,
      estimatedMins: 35,
      personaPrompt: company.interview_persona_prompt,
    }))
  )
}

async function getScenarios(): Promise<ScenarioBrief[]> {
  if (process.env.USE_MOCK_DATA === 'true') return []

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

export default async function LiveInterviewsPage() {
  const [personas, scenarios] = await Promise.all([getPersonas(), getScenarios()])

  return (
    <UsageProvider>
      <div className="max-w-[1440px] mx-auto px-6 py-7 space-y-6">
        <section className="relative overflow-hidden rounded-[28px] border border-outline-variant/40 bg-[#14241c] px-6 py-6 sm:px-8 sm:py-7">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              maskImage: 'radial-gradient(ellipse 80% 100% at 78% 50%, black 30%, transparent 78%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 78% 50%, black 30%, transparent 78%)',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'radial-gradient(520px 360px at 86% 48%, rgba(126,224,153,0.18), transparent 62%)' }}
          />
          <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-label font-bold uppercase tracking-[0.12em] text-[#9ee0b8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7ee099]" />
                AI interviewer online
              </div>
              <h1 className="mt-4 font-headline text-[38px] sm:text-[46px] font-semibold leading-[1.03] text-[#f3ede0]" style={{ letterSpacing: '-0.02em' }}>
                Live interviews, run entirely by Hatch.
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#f3ede0]/70">
                Pick a discipline, open the room, and work out loud. Hatch probes, watches the canvas or editor, carries context across rounds, and writes the debrief.
              </p>
            </div>
            <div className="hidden lg:flex justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hatch-mascot.png"
                alt="Hatch"
                className="h-40 w-40 rounded-[24px] object-cover shadow-2xl shadow-black/20"
              />
            </div>
          </div>
        </section>

        <BillingUsageFromProfile />

        <LiveInterviewsShell personas={personas} scenarios={scenarios} />
      </div>
    </UsageProvider>
  )
}
