import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import type { ReportContent } from './index'

/**
 * Report builder for the /go/switch lead magnet.
 *
 * Sections:
 *  (a) Story audited — band + lens read
 *  (b) The reframe — engineer telling vs PM telling, four lines, authored per storyType
 *  (c) What transfers from {background} — 3 transfers + 3 gaps
 *  (d) The five stories every PM screen expects
 *  (e) Your 30-day plan — week by week, concrete
 */
export function buildSwitchReport(
  result: MagnetResultPayload,
  name?: string | null,
): ReportContent {
  const greeting = name ? `${name}, here` : 'Here'

  // Pull typed values from the result payload.
  const band = result.band as string
  const answers = (result.answers ?? {}) as Record<string, string>
  const background = (answers.background as string) ?? 'backend'
  const storyType = (answers.storyType as string) ?? 'rescue'
  const dimensions = (result.dimensions ?? {}) as Record<string, number>
  const customer = dimensions.customer ?? 0
  const tradeoff = dimensions.tradeoff ?? 0
  const outcome = dimensions.outcome ?? 0

  const backgroundLabel: Record<string, string> = {
    backend: 'backend engineering',
    frontend: 'frontend engineering',
    data: 'data and analytics',
    'infra-platform': 'infra and platform work',
  }
  const bgLabel = backgroundLabel[background] ?? background

  const bandBlurb: Record<string, string> = {
    translates:
      'The engineering instincts are already there and the telling is mostly right. The gap is usually in how consistently all three lenses appear when the question changes.',
    'half-translated':
      'The story has the right raw material but the telling leans on one lens and skips the other two. Interviewers notice the missing ones before they credit the present one.',
    'engineer-coded':
      'The story is good work, but the telling is optimised for a technical audience. A PM interviewer hears execution and craft, but not the product reasoning underneath it.',
  }

  const lensReadLines: string[] = []
  if (customer >= 2) {
    lensReadLines.push('Customer lens is present. The opening establishes whose goal the project served.')
  } else {
    lensReadLines.push('Customer lens is thin. The story starts with technical context rather than with a person and a blocked goal.')
  }
  if (tradeoff >= 2) {
    lensReadLines.push('Tradeoff lens is present. The hardest decision names what the team gave up and why the sacrifice was acceptable.')
  } else {
    lensReadLines.push('Tradeoff lens is missing. The hardest decision is framed as a constraint or a resolution rather than a genuine choice between competing goods.')
  }
  if (outcome >= 2) {
    lensReadLines.push('Outcome lens is present. The close names a specific metric with a threshold.')
  } else {
    lensReadLines.push('Outcome lens is weak. The close describes delivery rather than what moved and by how much.')
  }

  return {
    title: 'Your story, audited',
    intro: `${greeting} is what the audit found and what to do about it.`,
    sections: [
      {
        id: 'audit',
        title: 'Your story, audited',
        body: (
          <div>
            <p style={{ fontWeight: 700, fontSize: 18, margin: '0 0 8px', color: 'var(--ink-1)' }}>
              {band === 'translates'
                ? 'Your story translates'
                : band === 'half-translated'
                ? 'Half-translated'
                : 'Engineer-coded'}
            </p>
            <p style={{ marginBottom: '1.1rem', lineHeight: 1.6 }}>
              {bandBlurb[band] ?? bandBlurb['engineer-coded']}
            </p>
            <ul className="lm-report-steps">
              {lensReadLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        ),
      },
      {
        id: 'reframe',
        title: 'The reframe',
        body: (
          <div>
            <p style={{ marginBottom: '1.1rem', lineHeight: 1.6 }}>
              The same project, told twice. The left column is the engineer version. The right column is the PM version. The facts are identical. The framing is not.
            </p>
            <div className="lm-report-moves">
              {getReframe(storyType).map((row) => (
                <div key={row.dimension} className="lm-report-move-card">
                  <div className="lm-report-move-header">
                    <span className="lm-report-move-key">{row.dimension}</span>
                    <span className="lm-report-move-name">{row.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--ink-3)',
                          margin: '0 0 5px',
                        }}
                      >
                        Engineer telling
                      </p>
                      <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-2)', margin: 0 }}>
                        {row.engineer}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--forest-2)',
                          margin: '0 0 5px',
                        }}
                      >
                        PM telling
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: 1.55,
                          color: 'var(--ink-1)',
                          margin: 0,
                          padding: '10px 12px',
                          background: 'var(--forest-soft)',
                          borderRadius: 'var(--r-sm)',
                          borderLeft: '3px solid var(--forest)',
                        }}
                      >
                        {row.pm}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: 'background',
        title: `What transfers from ${bgLabel}`,
        body: (
          <div>
            <p style={{ marginBottom: '1.1rem', lineHeight: 1.6 }}>
              Not everything needs to change. Some of what makes the work credible in an engineering context is exactly what makes a PM compelling in an interview.
            </p>
            <p style={{ fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 8px' }}>
              Three things that transfer
            </p>
            <ul className="lm-report-steps" style={{ marginBottom: '1.4rem' }}>
              {getTransfers(background).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
            <p style={{ fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 8px' }}>
              Three gaps interviewers notice first
            </p>
            <ul className="lm-report-steps">
              {getGaps(background).map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
        ),
      },
      {
        id: 'five-stories',
        title: 'The five stories every PM screen expects',
        body: (
          <div>
            <p style={{ marginBottom: '1.1rem', lineHeight: 1.6 }}>
              Most PM screens draw from a short list of story types. Having all five ready, with clear customer, tradeoff, and outcome beats, means the question changes but the structure does not.
            </p>
            <div className="lm-report-moves">
              {FIVE_STORIES.map((story) => (
                <div key={story.id} className="lm-report-move-card">
                  <div className="lm-report-move-header">
                    <span className="lm-report-move-name">{story.name}</span>
                  </div>
                  <p className="lm-report-move-def">{story.what}</p>
                  <div className="lm-report-move-template">
                    <span className="lm-report-template-label">Must prove</span>
                    <span className="lm-report-template-text">{story.mustProve}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: 'plan',
        title: 'Your 30-day plan',
        body: (
          <div>
            <p style={{ marginBottom: '1.1rem', lineHeight: 1.6 }}>
              Four weeks. Each week has one primary output. The goal is not to study PM concepts; it is to have five ready stories that hold up under questioning.
            </p>
            <div className="lm-report-templates">
              {THIRTY_DAY_PLAN.map((week) => (
                <div key={week.id} className="lm-report-template-card">
                  <div className="lm-report-template-header">
                    <span className="lm-report-template-tag">{week.label}</span>
                    <span className="lm-report-template-title">{week.title}</span>
                  </div>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 16, lineHeight: 1.65 }}>
                    {week.tasks.map((task, i) => (
                      <li key={i} style={{ color: 'var(--ink-2)', fontSize: 14, marginBottom: 4 }}>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  }
}

// ── Per-storyType reframe rows ───────────────────────────────────────────────

interface ReframeRow {
  dimension: string
  label: string
  engineer: string
  pm: string
}

function getReframe(storyType: string): ReframeRow[] {
  const rows: Record<string, ReframeRow[]> = {
    rescue: [
      {
        dimension: 'C',
        label: 'Customer',
        engineer: 'The service was failing under load. We had SLA violations and pages going out at 3 AM.',
        pm: 'Drivers could not see confirmed orders in real time. Every minute of delay increased cancellation rate by 4%.',
      },
      {
        dimension: 'T',
        label: 'Tradeoff',
        engineer: 'We chose a queue-based architecture over a direct sync. It added latency but eliminated the thundering herd.',
        pm: 'We accepted 200ms of additional perceived latency to eliminate the class of failure that was eroding driver trust. The tradeoff was worth it because latency is tunable and trust is not.',
      },
      {
        dimension: 'M',
        label: 'Metric',
        engineer: 'We went from five major incidents per week to zero over the next six weeks.',
        pm: 'Order confirmation latency dropped from 8 seconds to under 1 second. Cancellation rate fell 22% over 30 days.',
      },
      {
        dimension: 'J',
        label: 'Judgment',
        engineer: 'The rewrite was risky but the old architecture could not scale.',
        pm: 'We shipped the minimal version first and validated the latency improvement in a 5% traffic slice before full rollout. That narrowed the blast radius and gave us a clean counter-signal to watch.',
      },
    ],
    scale: [
      {
        dimension: 'C',
        label: 'Customer',
        engineer: 'The system was hitting throughput limits. Write amplification was causing queue backup at 10x our previous peak.',
        pm: 'The growth team had committed to a creator capacity of 50,000 by Q3. The infrastructure ceiling was going to block that goal four months early.',
      },
      {
        dimension: 'T',
        label: 'Tradeoff',
        engineer: 'We sharded by user ID instead of content type. It meant a migration with downtime risk.',
        pm: 'We chose to take a planned two-hour maintenance window rather than a rolling migration that would have taken three weeks. The business could absorb a scheduled window; it could not absorb three weeks of degraded write performance during the growth push.',
      },
      {
        dimension: 'M',
        label: 'Metric',
        engineer: 'We sustained 500k writes per minute in load testing with no latency regression.',
        pm: 'Creator onboarding throughput increased 4x by the time Q3 started. The growth team hit its target on schedule.',
      },
      {
        dimension: 'J',
        label: 'Judgment',
        engineer: 'The sharding key decision was the hardest call because it was irreversible.',
        pm: 'We ran the migration on a shadow table in parallel for two weeks before cutting over. That gave us a live correctness check without the blast radius of a hard cutover.',
      },
    ],
    'zero-to-one': [
      {
        dimension: 'C',
        label: 'Customer',
        engineer: 'We had no real-time feed capability. The product needed it to compete in the category.',
        pm: 'Creators were leaving the platform because followers had no reason to check back between posts. The gap was not features; it was the absence of a pull mechanic.',
      },
      {
        dimension: 'T',
        label: 'Tradeoff',
        engineer: 'We built a polling-based system instead of WebSockets because the team had limited WebSocket experience.',
        pm: 'We chose a ship-now-and-iterate approach over a full real-time architecture. We accepted 30-second staleness in exchange for shipping in six weeks instead of six months. If engagement data justified it, we would rebuild.',
      },
      {
        dimension: 'M',
        label: 'Metric',
        engineer: 'We shipped in six weeks and hit our reliability target from day one.',
        pm: 'Creator content views per session increased 38% in the 60 days after launch. Daily active return rate from followers rose from 12% to 19%.',
      },
      {
        dimension: 'J',
        label: 'Judgment',
        engineer: 'We could have over-engineered the real-time layer but chose to ship fast.',
        pm: 'We set a hard threshold: if the polling approach produced a user-visible lag complaint rate above 2%, we would accelerate the WebSocket rebuild. The rate stayed at 0.4%. We left polling in place and redirected engineering time to the next priority.',
      },
    ],
    migration: [
      {
        dimension: 'C',
        label: 'Customer',
        engineer: 'We were running on a deprecated stack. Security patches were blocked and deployment time was 45 minutes.',
        pm: 'Every deployment taking 45 minutes meant the team was shipping features at half the speed of our closest competitor. The backlog was growing faster than we could ship.',
      },
      {
        dimension: 'T',
        label: 'Tradeoff',
        engineer: 'We did a parallel-run migration instead of a hard cutover. It doubled the engineering cost.',
        pm: "We accepted three months of running both stacks simultaneously, which cost us roughly 40% of one engineer's time, because a failed cutover would have taken the product offline during our busiest period. The cost was worth the risk reduction.",
      },
      {
        dimension: 'M',
        label: 'Metric',
        engineer: 'We completed the migration with zero customer-facing downtime.',
        pm: 'Deployment cycle time dropped from 45 minutes to 4 minutes. Feature throughput increased from 1.2 to 2.8 shipped features per sprint within two months of completing the migration.',
      },
      {
        dimension: 'J',
        label: 'Judgment',
        engineer: 'The rollback plan was complex but we had one ready at each stage.',
        pm: 'We defined the abort criteria before the migration started: if error rate crossed 0.1% for more than five minutes, we would roll back immediately. Naming the failure threshold in advance meant the decision in the moment was already made.',
      },
    ],
  }

  return rows[storyType] ?? rows.rescue
}

// ── Per-background transfers and gaps ───────────────────────────────────────

function getTransfers(background: string): string[] {
  const map: Record<string, string[]> = {
    backend: [
      'Fluency with system constraints, which is what makes tradeoff reasoning credible rather than theoretical.',
      'A default instinct to ask what breaks and how, which maps directly to the PM move of naming failure modes.',
      'Ownership of complex projects end-to-end, which is the evidence interviewers look for when they ask about scope.',
    ],
    frontend: [
      'Proximity to real user behaviour, which means customer-lens reasoning comes naturally when the framing shifts.',
      'A habit of measuring change in terms of user actions, which is already close to the product outcome language interviewers want.',
      'Experience navigating stakeholder input on visible work, which transfers directly to the PM skill of holding a position under pressure.',
    ],
    data: [
      'Familiarity with causal reasoning under uncertainty, which is the core of falsifiable outcome framing.',
      'A default toward measurement, which means outcome-lens answers are usually already there and just need the business context added.',
      'Experience working across multiple teams as an internal supplier, which maps well to the PM skill of managing without authority.',
    ],
    'infra-platform': [
      'Deep experience with second-order effects, which is exactly what tradeoff reasoning requires.',
      'A track record of enabling others rather than building for end users, which translates to the PM move of optimising for the team rather than the artifact.',
      'Ownership of projects with no obvious user-visible outcome, which makes outcome framing harder and therefore more meaningful when demonstrated.',
    ],
  }
  return map[background] ?? map.backend
}

function getGaps(background: string): string[] {
  const map: Record<string, string[]> = {
    backend: [
      'Framing the project around system behaviour rather than who breaks when the system misbehaves.',
      'Describing latency or throughput targets without naming whose experience those numbers protect.',
      'Closing with reliability metrics without connecting them to a business outcome an interviewer can evaluate.',
    ],
    frontend: [
      'Treating performance wins as the story rather than the user action that became possible because of them.',
      'Describing design iteration without naming the signal that told the team which direction was right.',
      'Framing accessibility or polish work as craft without connecting it to retention or conversion data.',
    ],
    data: [
      'Describing the model or pipeline rather than the decision it was built to inform.',
      'Presenting accuracy metrics without naming who relied on those predictions and what they did with them.',
      'Framing an instrumentation project around coverage rather than the product questions it finally answered.',
    ],
    'infra-platform': [
      'Framing the story around the engineering team as the customer rather than the product teams whose velocity changed.',
      'Describing reliability improvements without connecting them to user-facing impact or business cost avoided.',
      'Presenting a migration as a technical achievement without naming the product bets it made possible.',
    ],
  }
  return map[background] ?? map.backend
}

// ── Static content ───────────────────────────────────────────────────────────

const FIVE_STORIES = [
  {
    id: 'user-insight',
    name: 'A user insight that changed direction',
    what: "A moment where direct observation of user behaviour contradicted the team's assumption and caused a meaningful change to what was being built.",
    mustProve: 'That the insight came from evidence, not intuition, and that the direction change was a decision, not a drift.',
  },
  {
    id: 'hard-tradeoff',
    name: 'A hard tradeoff with real stakes',
    what: 'A situation where two good things competed and the team picked one, sacrificing the other, with a clear articulation of why that sacrifice was acceptable.',
    mustProve: 'That the sacrifice was named explicitly and that the reasoning behind it would hold up under a follow-up question.',
  },
  {
    id: 'stakeholder-conflict',
    name: 'A stakeholder conflict that was resolved',
    what: 'A case where two groups with legitimate but competing interests needed a decision, and that decision was reached without avoiding the conflict.',
    mustProve: 'That both perspectives were understood before the decision was made, and that the resolution was principled rather than political.',
  },
  {
    id: 'bet-that-failed',
    name: 'A bet that failed and what changed because of it',
    what: 'A project or initiative that did not produce the expected result, where the team detected the failure early and changed course.',
    mustProve: 'That the failure was recognised from evidence rather than retrospectively, and that it led to a concrete update in how the team worked or what it built next.',
  },
  {
    id: 'metric-moved',
    name: 'A metric you moved, with the number',
    what: 'A project whose outcome can be stated as a specific metric reaching a specific threshold in a named window, with one counter-signal that would have indicated failure.',
    mustProve: 'That the metric was chosen before the work started, not selected afterward because it moved.',
  },
]

const THIRTY_DAY_PLAN = [
  {
    id: 'week1',
    label: 'Week 1',
    title: 'Audit the story you already have',
    tasks: [
      'Write out the story you would lead with in a screen. One page, unedited, the way you currently tell it.',
      'Score it yourself on the three lenses: customer (0-3), tradeoff (0-3), outcome (0-3). Note which score is lowest.',
      'Identify the one sentence that names the user and the blocked goal. If it does not exist, that is the first rewrite.',
      'Identify the one sentence where you name what the team gave up. If it does not exist, that is the second rewrite.',
    ],
  },
  {
    id: 'week2',
    label: 'Week 2',
    title: 'Rewrite with all three lenses active',
    tasks: [
      'Open with the user and the blocked goal, not with the technical context. One sentence is enough.',
      'Describe the hardest decision by naming the competing goods, not just the constraint that forced a choice.',
      'Close with a metric, a threshold, and a timeline. Add one counter-signal that would have indicated failure.',
      'Read the rewritten story aloud. It should take under three minutes. Cut anything that does not serve one of the three lenses.',
    ],
  },
  {
    id: 'week3',
    label: 'Week 3',
    title: 'Build the other four stories',
    tasks: [
      'Identify four more projects from your history that map to the other four story types: user insight, stakeholder conflict, bet that failed, metric moved.',
      'For each one, write two sentences: one naming the customer and the blocked goal, one naming the metric that moved.',
      'Do not write the full story yet. The two-sentence version is what you test in week four.',
      'Flag the story where the outcome lens is weakest. That one gets a full rewrite before the screen.',
    ],
  },
  {
    id: 'week4',
    label: 'Week 4',
    title: 'Practice under real questioning',
    tasks: [
      'Tell each story to one person who will ask follow-up questions. The goal is not a perfect delivery; it is finding where the lens coverage breaks under pressure.',
      'After each practice, note the question that exposed a gap. That gap is the rewrite target for that story.',
      'Do one timed run of the lead story: under three minutes, all three lenses, no filler.',
      'Enter the screen with the lead story fully ready and the two-sentence version of each of the other four prepared.',
    ],
  },
]
