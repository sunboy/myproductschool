import { MOCK_COMPANIES } from '@/lib/mock-data'
import { getChallenges } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import { StartSimulationButton } from '@/components/interview/StartSimulationButton'
import { StudyTimeline } from '@/components/interview/StudyTimeline'
import { PrepStatusWidget } from '@/components/interview/PrepStatusWidget'

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const company = MOCK_COMPANIES.find(c => c.slug === companySlug)
  if (!company) notFound()

  // Keep data fetching for challenges
  const challenges = await getChallenges()
  // Show a curated subset (first 3) as recommended challenges
  const _recommended = challenges.slice(0, 3)

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-on-surface-variant mb-6 flex items-center gap-1">
        <a href="/interview-prep" className="hover:text-primary">
          Interview Prep
        </a>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-on-surface">{company.name}</span>
      </nav>

      <h1 className="font-headline text-3xl text-on-surface mb-2">{company.name}</h1>
      <p className="text-on-surface-variant mb-8">
        Interview prep plan — personalized by Luma
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Timeline (2/3 width) */}
        <div className="lg:col-span-2">
          <StudyTimeline
            phases={[
              {
                name: 'Product Sense & Logic',
                duration: '2 Days',
                difficulty: 'Medium',
                status: 'completed',
                challenges: [
                  { title: 'Design a feature for remote workers', difficulty: 'medium' },
                  { title: 'Improve user retention for a B2B SaaS', difficulty: 'hard' },
                ],
              },
              {
                name: 'Execution & Metrics',
                duration: '3 Days',
                difficulty: 'Easy',
                status: 'current',
                challenges: [
                  {
                    title: 'Define the north star metric for a marketplace',
                    difficulty: 'easy',
                  },
                  { title: 'Diagnose a 20% drop in DAU', difficulty: 'medium' },
                  {
                    title: 'Build a metrics framework for a new feature',
                    difficulty: 'hard',
                  },
                ],
              },
              {
                name: 'Leadership & Behavioral',
                duration: '2 Days',
                difficulty: 'Easy',
                status: 'locked',
                challenges: [
                  {
                    title: 'Tell me about a time you drove alignment',
                    difficulty: 'easy',
                  },
                  {
                    title: 'How do you handle competing stakeholder priorities?',
                    difficulty: 'medium',
                  },
                ],
              },
            ]}
          />
        </div>

        {/* Right: Widgets (1/3 width) */}
        <div className="space-y-4">
          <PrepStatusWidget
            companyName={company.name}
            interviewDate="Mar 28, 2026"
            daysRemaining={14}
            readinessPercent={35}
            comparativeInsight="Ahead of 72% of candidates at this stage"
          />

          {/* Mentor card */}
          <div className="bg-surface-container rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div>
                <p className="font-label font-semibold text-on-surface text-sm">
                  Community Support
                </p>
                <p className="text-xs text-on-surface-variant">Ask in the lounge</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant italic">
              &ldquo;The key to {company.name} interviews is showing product intuition backed by
              data.&rdquo;
            </p>
          </div>

          {/* Start simulation */}
          <div className="bg-surface-container rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">record_voice_over</span>
              <p className="font-label font-semibold text-on-surface text-sm">Run a simulation</p>
            </div>
            <p className="text-xs text-on-surface-variant">
              Luma will act as a {company.name} PM interviewer.
            </p>
            <StartSimulationButton companyId={company.id} companyName={company.name} />
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-background/90 backdrop-blur border-t border-outline-variant p-4 flex justify-between items-center">
        <p className="text-sm text-on-surface-variant">Ready to start?</p>
        <button className="flex items-center gap-2 bg-primary text-on-primary rounded-full px-6 py-2.5 font-semibold font-label text-sm">
          Start with Challenge 1
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}
