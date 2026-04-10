import Link from 'next/link'
import { getStudyPlans } from '@/lib/data/study-plans'
import { StudyPlanCard } from '@/components/explore/StudyPlanCard'
import { createClient } from '@/lib/supabase/server'

const DIFFICULTY_FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const

export default async function StudyPlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const studyPlans = await getStudyPlans(user?.id)

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-on-surface-variant mb-5">
        <Link href="/explore" className="hover:text-primary transition-colors">
          Explore
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <span className="text-on-surface font-semibold">Study Plans</span>
      </nav>

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-headline font-bold text-on-surface">Study Plans</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Structured paths to build your product skills, curated by Luma
        </p>
      </div>

      {/* Filter pills (static) */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-xs font-label text-on-surface-variant mr-1">Difficulty:</span>
        {DIFFICULTY_FILTERS.map((filter, i) => (
          <button
            key={filter}
            className={`rounded-full text-xs px-3 py-1 font-label font-semibold transition-colors ${
              i === 0
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studyPlans.map(plan => (
          <StudyPlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  )
}
