import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import type { ReportContent } from './index'

// ── Rejection-reason taxonomy ────────────────────────────────────────────────

const TAXONOMY_FAMILIES = [
  {
    family: 'Skipped the problem',
    description: 'The answer moves straight to solutions without establishing whose goal is blocked or where the friction actually lives.',
    reasons: [
      {
        name: 'Solution-first',
        detection: 'The answer names a feature before naming a person, a job, or a blocker.',
      },
      {
        name: 'Wrong scope',
        detection: 'The candidate treats one symptom as the whole problem without asking what else could produce the same signal.',
      },
      {
        name: 'Borrowed evidence',
        detection: 'The candidate cites benchmarks or external examples without first confirming the local context matches.',
      },
    ],
  },
  {
    family: 'Unfalsifiable thinking',
    description: 'The answer defines success in a way that cannot be disproven, so the interviewer cannot tell whether the candidate understands risk.',
    reasons: [
      {
        name: 'No counter-signal',
        detection: 'The success condition has no paired failure condition. Any outcome can be declared a win.',
      },
      {
        name: 'Vanity metric',
        detection: 'The metric goes up when things go well and also when things go badly. It does not distinguish between them.',
      },
      {
        name: 'Horizon drift',
        detection: 'The timeline is long enough that the experiment can be quietly abandoned before it returns a result.',
      },
    ],
  },
  {
    family: 'Fake tradeoffs',
    description: 'The answer states a preference or a direction with supporting reasons, but never names what the team gives up.',
    reasons: [
      {
        name: 'Preference overlay',
        detection: 'The candidate gives reasons for a choice without naming what gets delayed, reduced, or abandoned by making it.',
      },
      {
        name: 'Framing the alternative badly',
        detection: 'The unchosen option is described only in its weaknesses, which makes the comparison look easier than it is.',
      },
    ],
  },
]

// ── Seven dissection cases ───────────────────────────────────────────────────

const DISSECTION_CASES = [
  {
    id: 'case-1',
    excerpt:
      'The team noticed that engagement on the premium tier dropped 12 percent after the last release. To fix it, I would ship a re-engagement campaign with push notifications and an in-app banner reminding users of the features they are not using.',
    flaw: 'The answer never asks what changed in the last release or who stopped engaging. A campaign treats a symptom the candidate has not yet diagnosed.',
    taxonomyEntry: 'Solution-first (Skipped the problem)',
    strongMove:
      'Open by naming the question behind the signal: which user segment dropped, and what the release changed for them. A retention campaign is only worth running once the drop can be attributed to a specific friction.',
  },
  {
    id: 'case-2',
    excerpt:
      'To measure whether the new onboarding flow is working, I would track completion rate. If it reaches 70 percent within 30 days, the feature is successful and we ship to all users.',
    flaw: 'The answer has a metric and a target but no counter-signal. If completion rate hits 70 percent but downstream activation is flat, the candidate has no framework for calling that a failure.',
    taxonomyEntry: 'No counter-signal (Unfalsifiable thinking)',
    strongMove:
      'Pair the primary metric with a guardrail: "We know it worked if completion reaches 70 percent and 30-day activation does not drop below its current baseline. We know it failed if either condition is not met."',
  },
  {
    id: 'case-3',
    excerpt:
      'Between investing in mobile performance and adding collaborative editing, I would prioritize mobile performance. Most of our growth is coming from mobile, and performance improvements have compounding benefits on retention and word-of-mouth.',
    flaw: 'The candidate lists reasons for the choice but never names what the team gives up. Collaborative editing is described only by its absence, not its opportunity cost.',
    taxonomyEntry: 'Preference overlay (Fake tradeoffs)',
    strongMove:
      'Name the sacrifice explicitly: "We get compounding retention gains at the cost of the enterprise pipeline this quarter. That trade works because mobile retention funds the headcount to build collaborative editing in Q3."',
  },
  {
    id: 'case-4',
    excerpt:
      'To reduce churn in the first 30 days, I would improve the empty state. Most users who churn early never saw value, so showing them what the product can do before they give up will help.',
    flaw: 'The answer assumes the friction is the empty state without asking what the churning users did see. Users sometimes churn after reaching a non-empty state that disappointed them.',
    taxonomyEntry: 'Wrong scope (Skipped the problem)',
    strongMove:
      'Before proposing a fix, name the evidence gap: "The 30-day churn signal tells us something blocked value realization, but it does not tell us which step in the flow is the actual break. The first move is to look at session depth for churned users versus retained ones."',
  },
  {
    id: 'case-5',
    excerpt:
      'I would measure the success of the new search feature by tracking search-to-click rate. Industry benchmarks suggest 40 percent is a healthy rate for this type of product, so that is the target.',
    flaw: 'The candidate imports a benchmark without establishing that the product context matches the benchmark source. The metric is also a vanity metric if search volume changes independently of click quality.',
    taxonomyEntry: 'Borrowed evidence + Vanity metric (Skipped the problem / Unfalsifiable thinking)',
    strongMove:
      'Replace the benchmark with a baseline: "We will use our current search-to-click rate as the baseline and target a 15 percent relative improvement, paired with a guardrail on time-to-result so we know users are finding things faster, not just clicking more."',
  },
  {
    id: 'case-6',
    excerpt:
      'The team is debating whether to ship a dark mode or improve the dashboard load time. I would go with load time because performance is a hygiene factor and dark mode is a nice-to-have. The data shows most users are on light mode anyway.',
    flaw: 'The candidate frames dark mode only as a nice-to-have, which makes the comparison look obvious. The answer never names what the team gives up on the dark-mode side, so it is a preference with a framing advantage, not a tradeoff.',
    taxonomyEntry: 'Framing the alternative badly (Fake tradeoffs)',
    strongMove:
      'Name the real cost of not shipping dark mode: "We trade a potential accessibility gap and a missed signal for power users against a confirmed performance penalty for all users. That trade is worth making if we can ship dark mode in the following cycle."',
  },
  {
    id: 'case-7',
    excerpt:
      'To validate whether the new pricing page is improving conversion, I would run the test for 90 days to make sure we have enough data. If conversion goes up, we roll out the new page.',
    flaw: 'Ninety days is long enough for the test to be abandoned quietly before it returns a result. The answer also has no failure condition: if conversion goes up by 0.1 percent, does that count?',
    taxonomyEntry: 'Horizon drift + No counter-signal (Unfalsifiable thinking)',
    strongMove:
      'Set a minimum detectable effect before the test starts: "We need a 5 percent lift to justify the engineering cost of maintaining two page variants. We run for the number of days required to reach statistical significance at that effect size, not a fixed calendar window. We call it failed if conversion is flat or down."',
  },
]

// ── Self-check questions ─────────────────────────────────────────────────────

const SELF_CHECK = [
  'Does my answer name a person with a specific goal before naming any solution or feature?',
  'Does my success metric have a paired failure condition, and is the failure condition something that could plausibly happen?',
  'Does my preferred option explicitly name what the team gives up by not doing the alternative?',
  'Is the timeline for my experiment short enough that I cannot walk away before it returns a result?',
]

// ── Builder ──────────────────────────────────────────────────────────────────

export function buildSpotTheFlawReport(
  result: MagnetResultPayload,
  name?: string | null,
): ReportContent {
  const greeting = name ? `${name}, here` : 'Here'
  const band = result.band as string

  const bandIntro: Record<string, string> = {
    'sharp-eye':
      'All three flaws spotted. The taxonomy below names eight more rejection reasons, grouped into the three families that cover the full range of answers that lose the room.',
    'trained-but-gappy':
      'Two of three. One rejection reason slipped past. The taxonomy below maps where it lives and seven others like it.',
    'flying-blind':
      'The rejection reasons interviewers use are not the ones most candidates expect. The taxonomy below gives them names so they become catchable.',
  }

  const intro = `${greeting} is the full flaw-spotting set: the rejection-reason taxonomy, seven more answers to dissect, and a four-question self-check to run on your own answers. ${bandIntro[band] ?? ''}`

  return {
    title: 'Your full flaw-spotting set',
    intro,
    sections: [
      {
        id: 'taxonomy',
        title: 'The rejection-reason taxonomy',
        body: (
          <div>
            <p style={{ marginBottom: '1.2rem', lineHeight: 1.6 }}>
              Every answer that loses the room does so for one of eight reasons, grouped into three families. Once you can name the family, you can catch the flaw before it leaves your mouth.
            </p>
            {TAXONOMY_FAMILIES.map((family) => (
              <div key={family.family} style={{ marginBottom: '1.6rem' }}>
                <p
                  style={{
                    fontWeight: 800,
                    color: 'var(--ink-1)',
                    fontSize: 16,
                    marginBottom: 4,
                  }}
                >
                  {family.family}
                </p>
                <p
                  style={{
                    color: 'var(--ink-2)',
                    fontSize: 14,
                    lineHeight: 1.55,
                    marginBottom: 12,
                  }}
                >
                  {family.description}
                </p>
                <div style={{ display: 'grid', gap: 8 }}>
                  {family.reasons.map((reason) => (
                    <div
                      key={reason.name}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--forest-soft)',
                        borderLeft: '3px solid var(--forest)',
                        borderRadius: 'var(--r-md)',
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 700,
                          color: 'var(--ink-1)',
                          fontSize: 14,
                          marginBottom: 4,
                        }}
                      >
                        {reason.name}
                      </p>
                      <p
                        style={{
                          color: 'var(--ink-2)',
                          fontSize: 13,
                          lineHeight: 1.5,
                          margin: 0,
                        }}
                      >
                        Detection: {reason.detection}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: 'dissection',
        title: 'Seven more answers to dissect',
        body: (
          <div>
            <p style={{ marginBottom: '1.2rem', lineHeight: 1.6 }}>
              Each excerpt below is a credible-sounding answer with a real flaw. The flaw, its taxonomy entry, and the strong-answer move follow each one.
            </p>
            <div style={{ display: 'grid', gap: 20 }}>
              {DISSECTION_CASES.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    padding: '18px 20px',
                    background: 'var(--paper)',
                    border: '1px solid var(--line-1)',
                    borderRadius: 'var(--r-lg)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-3)',
                      marginBottom: 8,
                    }}
                  >
                    Case {idx + 1}
                  </p>
                  <p
                    style={{
                      color: 'var(--ink-2)',
                      fontSize: 14,
                      lineHeight: 1.6,
                      padding: '10px 14px',
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--r-md)',
                      marginBottom: 14,
                      fontStyle: 'italic',
                    }}
                  >
                    {item.excerpt}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--amber-2)',
                      marginBottom: 4,
                    }}
                  >
                    The flaw
                  </p>
                  <p
                    style={{
                      color: 'var(--ink-1)',
                      fontSize: 14,
                      lineHeight: 1.55,
                      marginBottom: 10,
                    }}
                  >
                    {item.flaw}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-3)',
                      marginBottom: 4,
                    }}
                  >
                    Taxonomy
                  </p>
                  <p
                    style={{
                      color: 'var(--ink-2)',
                      fontSize: 13,
                      marginBottom: 12,
                    }}
                  >
                    {item.taxonomyEntry}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--forest)',
                      marginBottom: 4,
                    }}
                  >
                    The strong-answer move
                  </p>
                  <p
                    style={{
                      color: 'var(--ink-1)',
                      fontSize: 14,
                      lineHeight: 1.55,
                      padding: '10px 14px',
                      background: 'var(--forest-soft)',
                      borderLeft: '3px solid var(--forest)',
                      borderRadius: 'var(--r-md)',
                      margin: 0,
                    }}
                  >
                    {item.strongMove}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: 'self-check',
        title: 'Run this on your own answers',
        body: (
          <div>
            <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
              Before giving any answer in a product screen, run through these four questions. Each one targets one of the three rejection families. If any answer is no, stop and fix it before continuing.
            </p>
            <ol style={{ paddingLeft: 20, display: 'grid', gap: 12 }}>
              {SELF_CHECK.map((q, i) => (
                <li
                  key={i}
                  style={{
                    color: 'var(--ink-1)',
                    fontSize: 15,
                    lineHeight: 1.55,
                  }}
                >
                  {q}
                </li>
              ))}
            </ol>
            <p
              style={{
                marginTop: 16,
                color: 'var(--ink-2)',
                fontSize: 14,
                lineHeight: 1.55,
              }}
            >
              The goal is not to run these out loud in the interview. The goal is to internalize them until they run automatically, and the flaw is caught before it is spoken.
            </p>
          </div>
        ),
      },
    ],
  }
}
