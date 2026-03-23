'use client'

import { useState } from 'react'

const TABS = ['The Challenge', 'Your Response', "Luma's Feedback"] as const

function ChallengeTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-label">
        <span className="material-symbols-outlined text-base">category</span>
        Product Sense &middot; Spotify &middot; 10 min
      </div>
      <h3 className="font-headline text-xl font-semibold text-on-surface">
        Spotify&apos;s podcast listening has plateaued after 18 months of growth.
        Diagnose the problem and recommend a path forward.
      </h3>
      <div className="bg-surface-container-low rounded-xl p-4 space-y-2 text-sm text-on-surface-variant">
        <p className="font-label font-semibold text-on-surface">Context</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Podcast MAU grew 40% YoY for 18 months, now flat for 2 quarters</li>
          <li>New podcast launches are up 25%, but average listens per show are down</li>
          <li>Completion rates dropped from 62% to 48%</li>
          <li>Music engagement remains strong; churn is stable</li>
        </ul>
      </div>
    </div>
  )
}

function ResponseTab() {
  return (
    <div className="space-y-5 text-sm text-on-surface">
      <div className="space-y-2">
        <p className="font-label font-semibold text-primary">1. Diagnosis</p>
        <p className="text-on-surface-variant leading-relaxed">
          The plateau is likely a discovery and quality problem, not a demand
          problem. Supply grew 25% but average listens per show dropped,
          suggesting content dilution. Users have more options but worse
          signal-to-noise, leading to lower completion rates and eventual
          engagement fatigue.
        </p>
      </div>
      <div className="space-y-2">
        <p className="font-label font-semibold text-primary">2. Key Metric</p>
        <p className="text-on-surface-variant leading-relaxed">
          North star: <span className="font-semibold text-on-surface">completion rate per listener-initiated session</span>.
          This captures whether users find content worth finishing, filtering
          out autoplay noise. Leading indicator: episodes saved or shared
          within 24h of first listen.
        </p>
      </div>
      <div className="space-y-2">
        <p className="font-label font-semibold text-primary">3. Recommendation</p>
        <p className="text-on-surface-variant leading-relaxed">
          Invest in personalized podcast onboarding: a 3-question flow that
          maps user interest to curated starter playlists. Deprioritize
          promoting new launches in favor of surfacing high-completion shows
          to matched segments.
        </p>
      </div>
    </div>
  )
}

function FeedbackTab() {
  const dimensions = [
    { name: 'Diagnostic', score: 7.5 },
    { name: 'Metrics', score: 6.0 },
    { name: 'Framing', score: 8.0 },
    { name: 'Recommendation', score: 7.0 },
  ]

  return (
    <div className="space-y-5">
      {/* Dimension scores */}
      <div className="grid grid-cols-2 gap-3">
        {dimensions.map((d) => (
          <div
            key={d.name}
            className="bg-surface-container-low rounded-xl p-3 text-center"
          >
            <p className="text-2xl font-headline font-bold text-primary">
              {d.score.toFixed(1)}
            </p>
            <p className="text-xs font-label text-on-surface-variant mt-1">
              {d.name}
            </p>
          </div>
        ))}
      </div>

      {/* What Worked */}
      <div className="space-y-2">
        <p className="font-label font-semibold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">
            check_circle
          </span>
          What Worked
        </p>
        <ul className="text-sm text-on-surface-variant space-y-1 ml-6 list-disc">
          <li>Correctly identified content dilution as the root mechanism</li>
          <li>Strong north star metric with a clear &ldquo;why&rdquo;</li>
          <li>Recommendation directly addresses the diagnosed problem</li>
        </ul>
      </div>

      {/* What to Fix */}
      <div className="space-y-2">
        <p className="font-label font-semibold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-tertiary text-base">
            build
          </span>
          What to Fix
        </p>
        <ul className="text-sm text-on-surface-variant space-y-1 ml-6 list-disc">
          <li>Missing user segmentation — power listeners vs. casual browsers behave differently</li>
          <li>No mention of what to deprioritize or trade off against the recommendation</li>
        </ul>
      </div>

      {/* Failure pattern chip */}
      <div className="flex items-center gap-2">
        <span className="bg-tertiary-container text-on-secondary-container rounded-full text-xs px-3 py-1 font-label font-medium">
          FP-03: Homogeneous User Assumption detected
        </span>
      </div>
    </div>
  )
}

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section className="py-20">
      <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface text-center mb-4">
        See it in action
      </h2>
      <p className="text-on-surface-variant text-center mb-10 max-w-xl mx-auto">
        A real challenge, a real response, and real feedback from Luma.
      </p>

      <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant">
        {/* Tab bar */}
        <div className="flex gap-1 bg-surface-container-high rounded-full p-1 mb-6">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-label font-medium transition-colors ${
                activeTab === i
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[280px]">
          {activeTab === 0 && <ChallengeTab />}
          {activeTab === 1 && <ResponseTab />}
          {activeTab === 2 && <FeedbackTab />}
        </div>
      </div>

      <p className="text-center text-on-surface-variant italic mt-6 text-sm">
        This is what every session looks like. No black box. No vague feedback.
      </p>
    </section>
  )
}
