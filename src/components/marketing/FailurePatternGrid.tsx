import { FAILURE_PATTERNS } from '@/lib/luma/system-prompt'

export function FailurePatternGrid() {
  return (
    <section className="py-20">
      <div className="text-center mb-10">
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface">
          Most PMs repeat the same 3 mistakes.{' '}
          <span className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">
            Luma finds yours.
          </span>
        </h2>
        <p className="text-on-surface-variant mt-4 max-w-xl mx-auto">
          14 failure patterns, identified from thousands of product responses.
          Luma tracks which ones you hit so you can break the cycle.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {FAILURE_PATTERNS.map((pattern) => (
          <div
            key={pattern.id}
            className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 text-center"
          >
            <p className="text-xs text-on-surface-variant font-label">
              {pattern.id}
            </p>
            <p className="text-sm font-medium text-on-surface mt-1">
              {pattern.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
