import { MOCK_FEEDBACK, MOCK_CHALLENGES } from '@/lib/mock-data'

export default function HatchQueuePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Hatch Review Queue</h1>
        <p className="text-on-surface-variant text-sm mt-1">Quality-check AI feedback before it contributes to training data.</p>
      </div>

      {/* Sample review card */}
      <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant uppercase tracking-wide">Challenge</span>
            <h3 className="font-medium text-on-surface mt-0.5">{MOCK_CHALLENGES[0]?.title ?? 'Sample challenge'}</h3>
          </div>
          <span className="text-xs px-2 py-1 bg-tertiary-container text-on-tertiary-container rounded-full">Pending review</span>
        </div>

        {/* First feedback dimension as preview */}
        {MOCK_FEEDBACK[0] && (
          <div className="p-4 bg-primary-container rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-primary uppercase">{MOCK_FEEDBACK[0].dimension}</span>
              <span className="text-xs text-on-primary-container ml-auto">Score: {MOCK_FEEDBACK[0].score}/10</span>
            </div>
            <p className="text-sm text-on-primary-container">{MOCK_FEEDBACK[0].commentary}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-sm">check</span>
            Approve
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-error-container text-on-error-container rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-sm">flag</span>
            Flag for review
          </button>
        </div>
      </div>

      <div className="text-center py-8 text-on-surface-variant text-sm">
        No more items in the queue.
      </div>
    </div>
  )
}
