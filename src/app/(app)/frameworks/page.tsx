import { MOCK_FRAMEWORKS } from '@/lib/mock-data/frameworks'

const DOMAIN_LABELS: Record<string, string> = {
  'product-strategy': 'Product Strategy',
  'metrics-analytics': 'Metrics & Analytics',
  'prioritization': 'Prioritization',
  'user-research': 'User Research',
}

export default function FrameworksPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline text-3xl font-bold text-on-surface">
          The PM Toolkit
        </h1>
        <p className="text-on-surface-variant mt-2">
          The frameworks interviewers expect. Learn them. Then learn when NOT to use them.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_FRAMEWORKS.map(framework => (
          <div
            key={framework.id}
            className="bg-surface-container rounded-xl p-6 border border-outline-variant/30"
          >
            {/* Name */}
            <h2 className="font-headline text-lg font-bold text-on-surface">
              {framework.name}
            </h2>

            {/* Purpose */}
            <p className="text-sm text-on-surface-variant mt-1">
              {framework.purpose}
            </p>

            {/* Steps */}
            <ol className="mt-3 space-y-1.5 list-decimal list-inside">
              {framework.steps.map((step, i) => (
                <li key={i} className="text-sm text-on-surface">
                  {step}
                </li>
              ))}
            </ol>

            {/* When to use */}
            <div className="bg-primary-fixed rounded-lg p-3 mt-3">
              <p className="text-xs italic text-on-surface-variant">
                {framework.when_to_use}
              </p>
            </div>

            {/* Domain badge */}
            <div className="mt-2">
              <span className="bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 text-xs">
                {framework.domain ? (DOMAIN_LABELS[framework.domain] ?? framework.domain) : 'General'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
