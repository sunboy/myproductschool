import Link from 'next/link'
import { MOCK_LIVE_INTERVIEW_PERSONAS } from '@/lib/mock-live-interviews'
import FilteredPersonaGrid from './FilteredPersonaGrid'
import PastInterviews from './PastInterviews'
import { UsageProvider } from '@/context/UsageContext'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

export interface ScenarioBrief {
  id: string
  title: string
  scenarioQuestion: string
  difficulty: string
  estimatedMinutes: number
  relevantRoles: string[]
  primaryCompetencies: string[]
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
    .select('id, title, scenario_question, difficulty, estimated_minutes, relevant_roles, primary_competencies')
    .eq('is_published', true)
    .not('scenario_question', 'is', null)
    .order('difficulty')

  return (data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    scenarioQuestion: c.scenario_question ?? '',
    difficulty: c.difficulty ?? 'standard',
    estimatedMinutes: c.estimated_minutes ?? 20,
    relevantRoles: c.relevant_roles ?? [],
    primaryCompetencies: c.primary_competencies ?? [],
  }))
}

export default async function LiveInterviewsPage() {
  const [personas, scenarios] = await Promise.all([getPersonas(), getScenarios()])

  return (
    <UsageProvider>
      <div className="max-w-[1440px] mx-auto px-6 py-7 space-y-6">
        {/* Luma Interview CTA Hero Card */}
        <div
          className="relative rounded-2xl p-6 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #3e6a4b 0%, #264a34 100%)',
            color: '#f3ede0',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-4">
            <LumaGlyph size={64} state="listening" className="text-white shrink-0" />
            <div>
              <div className="font-label font-bold text-xs uppercase tracking-widest opacity-60 mb-1">Live Mock Interview</div>
              <h2 className="font-headline text-2xl font-medium mb-2">Ready to be interviewed by Luma?</h2>
              <p className="text-sm opacity-75 mb-4">Pick a persona and scenario. Luma will ask real PM interview questions and give you a debrief.</p>
              <Link
                href="/live-interviews"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-label font-bold text-sm"
                style={{ background: '#f3ede0', color: '#1e1b14' }}
              >
                <span className="material-symbols-outlined text-[18px]">mic</span>
                Start interview
              </Link>
            </div>
          </div>
        </div>

        {/* Header */}
        <section>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface">Interviews</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Practice with real interviewers from top companies. Pick a seat.
          </p>
        </section>

        <FilteredPersonaGrid personas={personas} scenarios={scenarios} />
        <PastInterviews />
      </div>
    </UsageProvider>
  )
}
