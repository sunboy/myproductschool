import type { Challenge } from '@/lib/types'

interface ModelAnswerProps {
  challenge: Challenge
  isPro: boolean
}

const MOCK_MODEL_ANSWER = {
  key_points: [
    'Lead with user segmentation — power listeners vs casual dabblers have different discovery needs',
    'Root cause: browse intent vs commit intent — following requires confidence in quality/consistency',
    'Proposals: (1) Social proof indicators on podcast cards (subscriber count, completion rate), (2) "Try an episode" inline player before following, (3) Personalized "Start here" picks based on music taste signals',
    'Primary metric: Podcast follow rate (% of users who open Podcasts tab that follow ≥1 podcast within session)',
    'Guardrail metrics: Don\'t decrease music streaming time; don\'t increase podcast churn (people who follow and immediately unfollow)',
    'Trade-off in social proof: algorithmic vs editorial curation — editorial feels trustworthy but doesn\'t scale',
  ],
  answer_text: `## Diagnosing the Problem

First, I'd want to segment the 8% — is it uniformly low, or are some segments converting well?

**Data I'd look at:**
- Time-on-page in the Podcasts tab (are users browsing or bouncing?)
- Click-through rates per podcast card (is the issue awareness or conversion?)
- Follow rate by user cohort: music-heavy users vs already-following-one-podcast users
- Search vs browse: users who search for a specific podcast convert much higher

**Hypotheses:** Most users are in passive discovery mode — they're browsing, not shopping. Following feels like a commitment that requires confidence. They don't know if the podcast is consistent, if they'll like the host, or if it's worth the notification noise.

## Solution Proposals

**1. "Try an episode" inline player** (highest impact, medium effort)
Before following, let users play 2-min clips within the tab without navigating away. Removes the "commit to explore" barrier. Primary trade-off: engineering complexity; risk of users consuming without following.

**2. Social proof signals on cards** (quick win, low effort)
Show subscriber counts, recent episode release frequency, and "X of your followed artists listen to this." Reduces uncertainty. Trade-off: surfaces algorithmic popularity, which may homogenize discovery.

**3. Personalized "For you this week"** (high impact, high effort)
Use music taste graph to surface 3 podcast recommendations with high editorial confidence. Curated, not algorithmic. Trade-off: requires editorial team investment; slower to iterate.

## Metrics

- **Primary:** Podcast follow rate (% of Podcast tab openers who follow ≥1 podcast in-session)
- **Guardrail 1:** Music streaming time — don't cannibalize core behavior
- **Guardrail 2:** Follow-then-unfollow rate (within 7 days) — quality signal, not just volume

I'd start with proposal 2 (highest ROI for effort), run A/B test for 2 weeks, then layer in the inline player.`,
}

const ANSWER_STRUCTURE = [
  { icon: 'search', label: 'Diagnosis' },
  { icon: 'assignment', label: 'Investigation Plan' },
  { icon: 'analytics', label: 'Metrics' },
  { icon: 'lightbulb', label: 'Recommendation' },
  { icon: 'balance', label: 'Trade-offs' },
]

function getFirstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/)
  return match ? match[0] : text
}

export function ModelAnswer({ challenge, isPro }: ModelAnswerProps) {
  if (!isPro) {
    return (
      <div className="space-y-6">
        {/* Key Points — headers visible with first sentence only */}
        <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant space-y-3">
          <h3 className="font-headline font-bold text-on-surface">Key Points</h3>
          {MOCK_MODEL_ANSWER.key_points.map((point, i) => (
            <div key={i} className="flex gap-2">
              <span className="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5">check_circle</span>
              <p className="text-sm text-on-surface">{getFirstSentence(point)}</p>
            </div>
          ))}
        </div>

        {/* Answer Structure outline */}
        <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant">
          <h3 className="font-headline font-bold text-on-surface mb-4">How a top PM would structure this</h3>
          <div className="flex flex-col gap-2">
            {ANSWER_STRUCTURE.map((section, i) => (
              <div key={section.label} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-container text-primary text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <span className="material-symbols-outlined text-primary text-lg">{section.icon}</span>
                <span className="text-sm font-medium text-on-surface">{section.label}</span>
                {i < ANSWER_STRUCTURE.length - 1 && (
                  <span className="material-symbols-outlined text-outline-variant text-sm ml-auto">arrow_downward</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Blurred full text with gradient overlay + upgrade CTA */}
        <div className="relative">
          <div className="select-none pointer-events-none blur-sm opacity-50 max-h-48 overflow-hidden">
            <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant">
              <h3 className="font-headline font-bold text-on-surface mb-4">Model Answer</h3>
              <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-on-surface">{MOCK_MODEL_ANSWER.answer_text}</pre>
            </div>
          </div>
          {/* Gradient fade overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent rounded-2xl" />
          {/* Upgrade CTA */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-6">
            <span className="material-symbols-outlined text-3xl text-primary mb-2">workspace_premium</span>
            <p className="text-sm text-on-surface-variant mb-3 text-center max-w-xs">
              See the complete walkthrough with trade-off analysis
            </p>
            <a
              href="/pricing"
              className="px-6 py-2.5 bg-primary text-on-primary font-semibold font-label rounded-full hover:opacity-90 transition-opacity text-center"
            >
              Upgrade to Pro
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key points */}
      <div className="p-5 bg-primary-container rounded-2xl space-y-3">
        <h3 className="font-headline font-bold text-on-primary-container">Key Points</h3>
        {MOCK_MODEL_ANSWER.key_points.map((point, i) => (
          <div key={i} className="flex gap-2">
            <span className="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5">check_circle</span>
            <p className="text-sm text-on-primary-container">{point}</p>
          </div>
        ))}
      </div>

      {/* Full answer */}
      <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant">
        <h3 className="font-headline font-bold text-on-surface mb-4">Model Answer</h3>
        <div className="prose prose-sm max-w-none text-on-surface">
          <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-on-surface">{MOCK_MODEL_ANSWER.answer_text}</pre>
        </div>
      </div>
    </div>
  )
}
