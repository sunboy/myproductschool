import Link from 'next/link'
import { getStudyPlans } from '@/lib/data/study-plans'
import { getDomains } from '@/lib/data/domains'
import { StudyPlanCard } from '@/components/explore/StudyPlanCard'
import { SkillAreaCard } from '@/components/explore/SkillAreaCard'

export default async function ExplorePage() {
  const [studyPlans, domains] = await Promise.all([
    getStudyPlans(),
    getDomains(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-primary-container rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">explore</span>
        </div>
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Explore</h1>
          <p className="text-sm text-on-surface-variant">
            Study plans and skill areas to sharpen your product thinking
          </p>
        </div>
      </div>

      {/* Study Plans section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline font-semibold text-on-surface text-lg">Study Plans</h2>
          <Link
            href="/explore/plans"
            className="text-sm text-primary font-label font-semibold hover:underline"
          >
            View All →
          </Link>
        </div>

        {/* Horizontal scroll row */}
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          {studyPlans.map(plan => (
            <div key={plan.id} className="w-64 flex-shrink-0">
              <StudyPlanCard plan={plan} />
            </div>
          ))}
        </div>
      </section>

      {/* Skill Areas section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline font-semibold text-on-surface text-lg">Skill Areas</h2>
          <span className="text-xs text-on-surface-variant font-label">
            {domains.length} areas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map(domain => (
            <SkillAreaCard key={domain.id} domain={domain} />
          ))}
        </div>
      </section>
    </div>
  )
}
