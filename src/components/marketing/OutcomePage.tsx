import Link from 'next/link'
import Image from 'next/image'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CtaBand } from '@/components/landing-v3/sections'
import { HatchImage } from '@/components/redesign/HatchImage'
import type { OutcomePageEntry } from '@/lib/seo/outcomes'

const FLOW = [
  ['Frame', 'Define the real career moment and the signal you need to show.'],
  ['List', 'Open the possible paths, examples, and drill types before choosing one.'],
  ['Optimize', 'Prioritize the practice that most improves the next high-stakes moment.'],
  ['Win', 'Turn the evidence into a clear story someone can act on.'],
] as const

const FLOW_SCORES = [82, 66, 74, 88]

const OUTCOME_DETAIL: Record<OutcomePageEntry['slug'], {
  hatchImage: string
  hatchAlt: string
  samplePrompt: string
  signupHook: string
  quickWins: string[]
  playbook: Array<[string, string]>
}> = {
  'interview-prep': {
    hatchImage: '/images/hacky_practice.png',
    hatchAlt: 'Hatch preparing an interview practice session',
    samplePrompt: 'Spotify listening time dropped 15%, but DAU is flat and premium conversion is unchanged. Diagnose what changed.',
    signupHook: 'Open the workspace to get live follow-ups, a clear rubric, and the weak move Hatch would address next.',
    quickWins: [
      'Find the missing clarifying question before the interviewer has to ask.',
      'Practice a product sense answer and a systems answer in the same session.',
      'Leave with a readiness map for Frame, List, Optimize, and Win.',
    ],
    playbook: [
      ['Diagnostic practice', 'Start with one ambiguous product or technical prompt and expose the weak move.'],
      ['Follow-up pressure', 'Hatch asks the second question that usually appears in live interviews.'],
      ['Rubric receipt', 'Save what worked, what broke, and what to drill before the next interview.'],
    ],
  },
  'role-transitions': {
    hatchImage: '/images/hacky_learning.png',
    hatchAlt: 'Hatch guiding a role transition learning path',
    samplePrompt: 'You are the engineer closest to a retention problem. Write the product diagnosis before proposing a technical fix.',
    signupHook: 'Open the path to translate engineering instincts into product framing, metric reasoning, and decision memos.',
    quickWins: [
      'Turn implementation knowledge into user and business language.',
      'Practice product sense without pretending your technical depth is irrelevant.',
      'Build role-transition artifacts you can reuse in manager and recruiter conversations.',
    ],
    playbook: [
      ['Translate the signal', 'Convert a technical issue into a product problem statement.'],
      ['Choose the leverage point', 'Compare user, data, systems, and stakeholder moves before acting.'],
      ['Write the proof', 'Save a concise decision memo that shows product-minded judgment.'],
    ],
  },
  uplevel: {
    hatchImage: '/images/hacky_thinking.png',
    hatchAlt: 'Hatch reviewing senior and staff-level judgment',
    samplePrompt: 'A senior system migration is late, leadership is worried, and the customer impact is unclear. What recommendation do you make?',
    signupHook: 'Open the staff-readiness path to practice recommendations, trade-off language, and executive-ready receipts.',
    quickWins: [
      'Practice turning ambiguity into a decision leaders can act on.',
      'Connect architecture choices to customer and business impact.',
      'Build a trail of staff-level recommendations, not just completed tasks.',
    ],
    playbook: [
      ['Scope the room', 'Name the decision, audience, risk, and operating level signal.'],
      ['Compare trade-offs', 'Use systems, product, and data evidence before picking a path.'],
      ['Land the recommendation', 'Write the next step with owner, timeline, and kill criteria.'],
    ],
  },
  'salary-negotiation': {
    hatchImage: '/images/hacky_celebrate.png',
    hatchAlt: 'Hatch celebrating proof of career progress',
    samplePrompt: 'You need to show staff-level scope in a compensation conversation. Which evidence proves judgment rather than activity?',
    signupHook: 'Open the proof path to turn practice history into clearer evidence of operating level.',
    quickWins: [
      'Identify the difference between effort, impact, and judgment evidence.',
      'Collect FLOW receipts that show how your recommendations improved.',
      'Prepare a stronger level story without making compensation guarantees.',
    ],
    playbook: [
      ['Inventory receipts', 'Pull strong practice sessions and weak-move improvements, and saved decision artifacts.'],
      ['Map level signal', 'Connect evidence to scope, ambiguity, influence, and decision quality.'],
      ['Draft the story', 'Build a concise proof narrative for the conversation.'],
    ],
  },
}

export function OutcomePage({ outcome }: { outcome: OutcomePageEntry }) {
  const detail = OUTCOME_DETAIL[outcome.slug]

  return (
    <V3PageShell>
      <V3PageHero
        eyebrow={outcome.shortTitle}
        title={outcome.hero}
        subtitle={
          <>
            {outcome.summary}
            <br />
            <strong style={{ color: 'var(--forest-2)' }}>{outcome.proofPoint}</strong>
          </>
        }
        ctas={[
          { label: outcome.ctaLabel, href: outcome.ctaHref, variant: 'forest' },
          { label: outcome.secondaryLabel, href: outcome.secondaryHref, variant: 'primary' },
        ]}
      />

      {/* Sample practice preview card */}
      <V3Section eyebrow="Sample practice preview" title="See the practice before you sign up.">
        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line-1)',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden',
            maxWidth: '760px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 16px',
              borderBottom: '1px solid var(--line-1)',
              background: 'var(--surface)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--v3-font-display)',
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--ink-1)',
              }}
            >
              Sample practice preview
            </span>
            <Image src={detail.hatchImage} width={74} height={58} alt={detail.hatchAlt} style={{ height: 'auto', width: '74px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            <div
              style={{
                border: '1px solid var(--line-1)',
                borderRadius: 'var(--r-sm)',
                background: 'var(--bg)',
                padding: '12px',
              }}
            >
              <div
                style={{
                  marginBottom: '8px',
                  fontFamily: 'var(--v3-font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--forest-2)',
                }}
              >
                Prompt
              </div>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, lineHeight: 1.5, color: 'var(--ink-1)' }}>
                {detail.samplePrompt}
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
                gap: '8px',
              }}
            >
              {FLOW.map(([move], index) => (
                <div
                  key={move}
                  style={{
                    borderRadius: 'var(--r-sm)',
                    background: 'var(--surface-2)',
                    padding: '11px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--v3-font-mono)',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-3)',
                    }}
                  >
                    {move}
                  </span>
                  <div
                    style={{
                      marginTop: '8px',
                      fontFamily: 'var(--v3-font-display)',
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--forest)',
                    }}
                  >
                    {FLOW_SCORES[index]}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                borderRadius: 'var(--r-sm)',
                background: 'var(--forest-soft)',
                padding: '12px',
                color: 'var(--forest-deep)',
              }}
            >
              <HatchImage state="pointing" size={34} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, lineHeight: 1.45 }}>{detail.signupHook}</p>
            </div>
          </div>
        </div>
      </V3Section>

      {/* Quick wins */}
      <V3Section
        eyebrow="What you can do today"
        title="Useful before signup, stronger inside the workspace."
        subtitle="This page gives the path, examples, and proof model. The product unlocks the practice, follow-up pressure, clear feedback, and saved evidence."
      >
        <div
          style={{
            display: 'grid',
            gap: '12px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          }}
        >
          {detail.quickWins.map((win) => (
            <div
              key={win}
              style={{
                borderRadius: 'var(--r-md)',
                background: 'var(--surface)',
                border: '1px solid var(--line-1)',
                padding: '16px',
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: 1.5,
                color: 'var(--ink-1)',
              }}
            >
              {win}
            </div>
          ))}
        </div>
      </V3Section>

      {/* Playbook */}
      <V3Section
        eyebrow="Recommended path"
        title="A practical three-step playbook."
        subtitle="Each step maps to real product behavior: run the practice, get pushed, then save the receipt."
      >
        <div style={{ display: 'grid', gap: '12px', maxWidth: '760px' }}>
          {detail.playbook.map(([title, body], index) => (
            <div
              key={title}
              style={{
                display: 'grid',
                gap: '12px',
                gridTemplateColumns: '40px 1fr',
                alignItems: 'start',
                borderRadius: 'var(--r-md)',
                background: 'var(--paper)',
                border: '1px solid var(--line-1)',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  height: '40px',
                  width: '40px',
                  borderRadius: 'var(--r-sm)',
                  background: 'var(--forest)',
                  color: 'var(--bg)',
                  fontFamily: 'var(--v3-font-display)',
                  fontSize: '18px',
                  fontWeight: 700,
                }}
              >
                {index + 1}
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--v3-font-display)',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--ink-1)',
                  }}
                >
                  {title}
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: 500, lineHeight: 1.55, color: 'var(--ink-3)' }}>
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </V3Section>

      {/* Practice to open next */}
      <V3Section
        eyebrow="Practice to open next"
        title="Start with drills that create useful evidence."
      >
        <div style={{ display: 'grid', gap: '12px', maxWidth: '760px' }}>
          {outcome.reps.map((rep) => (
            <Link
              key={rep.href}
              href={rep.href}
              style={{
                display: 'grid',
                gap: '12px',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface)',
                border: '1px solid var(--line-1)',
                padding: '16px',
                textDecoration: 'none',
                transition: 'border-color var(--tr), transform var(--tr-fast)',
              }}
            >
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--v3-font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-3)',
                      border: '1px solid var(--line-2)',
                      borderRadius: 'var(--r-xs)',
                      padding: '3px 8px',
                    }}
                  >
                    {rep.discipline}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--v3-font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--forest-deep)',
                      background: 'var(--forest-soft)',
                      borderRadius: 'var(--r-xs)',
                      padding: '3px 8px',
                    }}
                  >
                    {rep.flowMove}
                  </span>
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--v3-font-display)',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--ink-1)',
                  }}
                >
                  {rep.title}
                </h3>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--forest-2)' }}>Preview →</span>
            </Link>
          ))}
        </div>
      </V3Section>

      <V3CtaBand
        title="Train for your next career move."
        subtitle="Pick the outcome, run the practice, let Hatch follow up, and keep the receipts that show how your judgment is improving."
        ctas={[{ label: outcome.ctaLabel, href: outcome.ctaHref }]}
      />
    </V3PageShell>
  )
}
