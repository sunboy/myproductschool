import { MOCK_LIVE_INTERVIEW_PERSONAS } from '@/lib/mock-live-interviews'
import FilteredPersonaGrid from './FilteredPersonaGrid'

async function getPersonas() {
  if (process.env.USE_MOCK_DATA === 'true') {
    return MOCK_LIVE_INTERVIEW_PERSONAS
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase
    .from('company_profiles')
    .select('id, name, icon, roles, interview_persona_prompt')
    .order('name')

  if (!data?.length) return MOCK_LIVE_INTERVIEW_PERSONAS

  return data.flatMap((company: {
    id: string
    name: string
    icon: string
    roles: string[]
    interview_persona_prompt?: string
  }) =>
    (company.roles ?? []).map((role: string) => ({
      companyId: company.id,
      companyName: company.name,
      role,
      slug: `${company.id}-${role.toLowerCase().replace(/\s+/g, '-')}`,
      icon: company.icon ?? 'corporate_fare',
      interviewStyle: '',
      difficulty: 'standard' as const,
      estimatedMins: 35,
      personaPrompt: company.interview_persona_prompt,
    }))
  )
}

export default async function LiveInterviewsPage() {
  const personas = await getPersonas()

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <section>
        <h1 className="font-headline text-3xl font-extrabold text-on-surface">Live Interviews</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Practice product sense with Luma as your interviewer. Pick a company and role.
        </p>
      </section>

      {/* Filtered grid — client component handles chips + cards */}
      <FilteredPersonaGrid personas={personas} />
    </div>
  )
}
