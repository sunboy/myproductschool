import { CompanyGrid } from '@/components/interview/CompanyGrid'
import { PrepStatusWidget } from '@/components/interview/PrepStatusWidget'

export default function InterviewPrepPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-headline text-4xl text-on-surface mb-2">
          Prep for the companies that matter
        </h1>
        <p className="text-on-surface-variant text-lg">
          Tell me where you&apos;re interviewing. Luma will build your study plan.
        </p>
      </div>

      {/* Company grid */}
      <section className="mb-10">
        <h2 className="font-label font-semibold text-on-surface-variant uppercase tracking-widest text-xs mb-4">
          Select a company
        </h2>
        <CompanyGrid />
      </section>

      {/* Prep Status section */}
      <section>
        <h2 className="font-headline text-xl text-on-surface mb-4">Your Prep Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            {/* Prep modules overview */}
            <div className="bg-surface-container rounded-2xl p-5 space-y-3">
              <h3 className="font-label font-semibold text-on-surface">Meta Study Plan</h3>
              {[
                { name: 'Product Sense & Logic', lessons: 4, status: 'completed' },
                { name: 'Execution & Metrics', lessons: 3, status: 'current' },
                { name: 'Leadership & Behavioral', lessons: 2, status: 'locked' },
              ].map((module, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-t border-outline-variant first:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-base ${
                        module.status === 'completed'
                          ? 'text-primary'
                          : module.status === 'current'
                          ? 'text-tertiary'
                          : 'text-on-surface-variant'
                      }`}
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                    >
                      {module.status === 'completed'
                        ? 'check_circle'
                        : module.status === 'current'
                        ? 'play_circle'
                        : 'lock'}
                    </span>
                    <span className="text-sm text-on-surface">{module.name}</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">{module.lessons} challenges</span>
                </div>
              ))}
            </div>
          </div>
          <PrepStatusWidget
            companyName="Meta"
            daysRemaining={14}
            readinessPercent={35}
            comparativeInsight="Ahead of 72% of candidates at this stage"
          />
        </div>
      </section>
    </div>
  )
}
