import { MOCK_LIVE_INTERVIEW_PERSONAS } from '@/lib/mock-live-interviews'
import FilteredPersonaGrid from './FilteredPersonaGrid'
import PastInterviews from './PastInterviews'
import { GuidedTab } from '../challenges/GuidedTab'

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

export default async function LiveInterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab === 'prep' ? 'prep' : 'mock'

  const [personas, scenarios] = await Promise.all([getPersonas(), getScenarios()])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <section>
        <h1 className="font-headline text-3xl font-extrabold text-on-surface">Interviews</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Practice with real interviewers from top companies. Pick a seat.
        </p>
      </section>

      {/* Tab Toggle */}
      <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 w-fit">
        <a
          href="/live-interviews"
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'mock'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Mock Interviews
        </a>
        <a
          href="/live-interviews?tab=prep"
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'prep'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Study Plans
        </a>
      </div>

      {activeTab === 'mock' ? (
        <>
          <FilteredPersonaGrid personas={personas} scenarios={scenarios} />
          <PastInterviews />
        </>
      ) : (
        <GuidedTab />
      )}
    </div>
  )
}
