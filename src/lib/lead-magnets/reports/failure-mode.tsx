// Report content for /go/failure-mode.
// Derives archetype + per-move scores from result.dimensions (frame/list/optimize/win 0-100)
// and maps the weakest move to its implicated competencies, targeted reps, and a day-by-day plan.

import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import type { ReportContent } from './index'

// ── Types ─────────────────────────────────────────────────────────────────────

type MoveKey = 'frame' | 'list' | 'optimize' | 'win'

// ── Archetype data (mirrors calibration/derive.ts ARCHETYPES, no dep needed) ──

const ARCHETYPE_COPY: Record<string, { name: string; what: string }> = {
  strategist: {
    name: 'The Strategist',
    what: 'Strong Frame and Win scores together produce this pattern. The problem definition lands early and the recommendation closes with a falsifiable outcome. Under interview pressure this pattern holds, because both bookends are present. The gap is usually in the middle: List and Optimize get compressed.',
  },
  systematic: {
    name: 'The Systematic Builder',
    what: 'Strong Frame and Optimize. The problem gets defined correctly and the solution gets stress-tested against a named criterion. Under pressure the Win move tends to collapse into an intention rather than a prediction, which costs points on defensibility.',
  },
  analyst: {
    name: 'The Analyst',
    what: 'Strong List and Optimize. The answer surfaces every stakeholder, names the tradeoff, and applies a criterion. What tends to drop under pressure is the Frame: the problem gets accepted at face value rather than interrogated. That gap compounds because a wrong frame invalidates the rest.',
  },
  communicator: {
    name: 'The Communicator',
    what: 'Strong Win, with weakness in List or Optimize. The answer sounds confident and lands well in the room. The structural gap is the middle: options stay thin and the criterion unnamed. A strong opening and closing with weak middle is harder to defend when an interviewer pushes.',
  },
  problem_framer: {
    name: 'The Problem Framer',
    what: 'Strong Frame, weak Win. The problem gets interrogated correctly, which is the hardest move for most candidates. The gap is closure: the answer does the diagnostic work and then softens the recommendation. Interviewers notice when the answer earns the right to a strong conclusion and does not take it.',
  },
  operator: {
    name: 'The Operator',
    what: 'Strong Optimize, weak Frame. The solution gets scoped and traded off correctly, which signals real product maturity. The gap is upstream: when the problem statement is thin, a well-scoped solution to the wrong problem is still a wrong answer.',
  },
  well_rounded: {
    name: 'The Well-Rounded',
    what: 'Solid across all four moves without a dominant strength or a sharp weakness. Under interview pressure, this pattern tends to plateau at competent rather than sharp: every move is present but none of them is crisp enough to be memorable. The work is converting each move from present to precise.',
  },
  emerging_thinker: {
    name: 'The Emerging Thinker',
    what: 'The instincts are there. The pattern is inconsistency: some moves land and others get skipped depending on the question. Consistent execution across all four moves is the gap, and it closes faster than most candidates expect once the structure is internalised.',
  },
}

// ── Per-move authored lines ────────────────────────────────────────────────────

const MOVE_SCORE_LINES: Record<MoveKey, { weak: string; mid: string; strong: string }> = {
  frame: {
    weak: 'Frame is the move that most candidates skip under pressure, and the data here confirms it. Committing to a solution before interrogating the problem statement is the root of most answer-quality failures.',
    mid: 'Frame lands at a partial level. The problem gets named but the upstream cause and the downstream cost are not both explicit, which leaves the interviewer doing interpretive work.',
    strong: 'Frame is a strength. The problem gets interrogated before the solution gets designed, and the person affected plus the consequence are both present.',
  },
  list: {
    weak: 'List is thin. Options are variations of one idea rather than structurally different responses, which collapses the decision space before it opens and makes the Optimize step impossible to do well.',
    mid: 'List is partial. Stakeholders and options are present but the second-order effects are not, so the trade-offs that appear in Optimize are not fully grounded.',
    strong: 'List is a strength. The answer surfaces structurally distinct options and maps the stakeholders affected by each, which is the substrate Optimize needs to work from.',
  },
  optimize: {
    weak: 'Optimize is missing. The answer names what would be picked without naming the criterion or the sacrifice. A recommendation without a named tradeoff is a preference, not a decision.',
    mid: 'Optimize is partial. A criterion appears but the sacrifice is implicit rather than stated, which means the tradeoff cannot be challenged or verified by the interviewer.',
    strong: 'Optimize is a strength. The criterion is named, the sacrifice is explicit, and the reason the trade is acceptable is stated. That is the complete tradeoff structure.',
  },
  win: {
    weak: 'Win is absent. The answer ends as an intention rather than a prediction. A metric exists somewhere in the answer, but without a threshold and a timeline it cannot be falsified.',
    mid: 'Win is partial. A metric gets named but the threshold or timeline is absent, so the outcome cannot be confirmed or denied at a specific future point.',
    strong: 'Win is a strength. The answer closes with a metric, a threshold, and a timeline. Adding a counter-signal (what failure looks like) is the remaining edge.',
  },
}

// ── Competency mapping ────────────────────────────────────────────────────────

const MOVE_TO_COMPETENCIES: Record<MoveKey, { name: string; what: string }[]> = {
  frame: [
    {
      name: 'Motivation theory',
      what: 'Identifying the friction that is blocking a user before proposing the fix. Most answers skip this because they treat the symptom as the problem. The Frame move builds the habit of asking what failure looks like before asking what the solution should do.',
    },
    {
      name: 'Cognitive empathy',
      what: 'Simulating whose goal is being served by solving this problem and whose is not. Frame is where you establish the person, the blocker, and the consequence. Without cognitive empathy, the person and the goal stay abstract.',
    },
  ],
  list: [
    {
      name: 'Cognitive empathy',
      what: 'Mapping every stakeholder affected and understanding their individual success metrics. The List move fails when options are generated from a single perspective. Cognitive empathy is what drives structural variety rather than surface variation.',
    },
    {
      name: 'Creative execution',
      what: 'Generating options that are structurally different, not variations of the same idea. This is the difference between listing three prioritisation frameworks and listing a build, a partnership, and a deprecation as three different strategic responses to the same problem.',
    },
  ],
  optimize: [
    {
      name: 'Taste',
      what: 'Feeling the difference between a tradeoff and a preference. Taste is what makes the sacrifice in "we get X and give up Y" feel real rather than diplomatic. It requires knowing which quality signals actually predict user behaviour, not just which sound defensible.',
    },
    {
      name: 'Strategic thinking',
      what: 'Naming the criterion: what specifically are we optimising for and why does that criterion win over the alternatives. Strategic thinking is what allows the Optimize move to close with a reason rather than just a pick.',
    },
  ],
  win: [
    {
      name: 'Strategic thinking',
      what: 'Treating the recommendation as a hypothesis with a because-clause. Win is where strategy lives: the outcome is a testable prediction, not an aspiration. Strategic thinking is what makes the metric falsifiable rather than directional.',
    },
    {
      name: 'Domain expertise',
      what: 'Naming a real metric with a real threshold. Vague outcomes signal that the candidate does not know what the metric is called or what a meaningful change looks like in practice. Domain expertise is what converts "retention should improve" into a named metric at a specific threshold.',
    },
  ],
}

// ── Reps keyed to weakest move ────────────────────────────────────────────────

const REPS_BY_MOVE: Record<MoveKey, { title: string; rep: string }[]> = {
  frame: [
    {
      title: 'The restatement drill',
      rep: 'Take any product question and write two framings of the same problem, one that accepts the stated symptom and one that names the upstream cause. Compare them. The second framing changes which solution space you are in. Do this for five questions.',
    },
    {
      title: 'The Frame-only rep',
      rep: 'Pick a challenge in Frame mode and stop after writing the Frame. Read it back and check: is the person named, is the blocker named, is the downstream consequence named. If all three are present, the Frame is complete. If one is missing, rewrite.',
    },
    {
      title: 'The deliberate pause',
      rep: 'Before answering any product question in a live setting, state the problem definition out loud before offering any solution. The pause is the rep. It builds the habit of framing first under real-time pressure.',
    },
  ],
  list: [
    {
      title: 'The structural spread check',
      rep: 'Write three options for any product decision and label each with its structural type: is it a build, a partnership, a deprecation, a policy change, a pricing adjustment. If two options share a label, replace one with something structurally different.',
    },
    {
      title: 'The stakeholder sweep',
      rep: 'Take any decision and list every person who is affected by each option, including people who are not your primary user. For each stakeholder, write one sentence on what success looks like for them. This builds the substrate for a real Optimize move.',
    },
    {
      title: 'The second-order effects rep',
      rep: 'For your three options, write one second-order effect for each: what does the option produce that is not the intended outcome. Second-order effects are what separate a List that enables good Optimize from a List that produces a false tradeoff.',
    },
  ],
  optimize: [
    {
      title: 'The sacrifice statement',
      rep: 'After picking an option, complete this sentence before anything else: "We get [X]. We give up [Y]. That trade is acceptable because [Z]." If you cannot complete Y, you have not found the tradeoff yet. Run this on five decisions.',
    },
    {
      title: 'The criterion naming drill',
      rep: 'Before picking an option, name the criterion you are optimising for. Not a description, a label: time-to-value, trust, unit economics, adoption velocity. Once the criterion is named, check whether your pick actually maximises it or whether a different option does.',
    },
    {
      title: 'The Optimize-only rep',
      rep: 'Do a challenge that puts you in the Optimize step and stop when you have completed the tradeoff statement. Score yourself on whether the criterion is named, the sacrifice is explicit, and the reason the trade is acceptable is stated. Three conditions, all three must be present.',
    },
  ],
  win: [
    {
      title: 'The falsifiability test',
      rep: 'Take any recommendation you have given recently and ask: what metric, at what threshold, by what date, would confirm this worked? Then ask: what would confirm it failed? If you cannot answer both questions, the recommendation does not have a Win move. Retrofit one.',
    },
    {
      title: 'The metric specificity drill',
      rep: 'Write five outcome statements and replace directional language (improve, increase, reduce) with named metrics and thresholds. "Retention should improve" becomes "day-30 retention among the affected cohort reaches X% within 60 days." Do this for every outcome statement you write for one week.',
    },
    {
      title: 'The counter-signal clause',
      rep: 'After writing a Win statement, add a counter-signal: "We will know it failed if [specific counter-metric crosses specific threshold]." The counter-signal is what separates a confident recommendation from a directional one, and it is the clause most candidates omit.',
    },
  ],
}

// ── 7-day plan keyed to weakest move ─────────────────────────────────────────

const SEVEN_DAY_PLAN: Record<MoveKey, string[]> = {
  frame: [
    'Day 1: Take one challenge in Frame mode. Stop after writing the Frame and verify all three parts are present: person, blocker, downstream consequence.',
    'Day 2: Take a second Frame challenge. Before starting, write a one-sentence restatement of the problem in your own words. Check whether the challenge confirms or challenges your restatement.',
    'Day 3: Take a List or Optimize challenge, but before answering the first question write a Frame for the scenario as if it were your own. Then compare your Frame to how the scenario opens.',
    'Day 4: Take a Win challenge. Before starting, frame the outcome: what would the person affected need to be true six months from now for this decision to be considered successful.',
    'Day 5: Take a mixed challenge without pausing between moves. The goal is Frame landing correctly under normal time pressure, not in isolation.',
    'Day 6: Set a ten-minute timer. Take one challenge. Write every move in sequence without stopping. The Frame must land in the first ninety seconds.',
    'Day 7: Take a full FLOW challenge from memory, no notes. Narrate each move out loud before writing it. Review your Frame move last and edit it to tighten the problem statement.',
  ],
  list: [
    'Day 1: Take one challenge in List mode. After generating options, label each with its structural type. Replace any option that shares a label with one that is structurally different.',
    'Day 2: Take a second List challenge. Before generating options, write the stakeholders who are affected. Then generate one option that serves each stakeholder differently.',
    'Day 3: Take a Frame challenge and write the List before answering the questions. Check: are the options structurally distinct, or are they variations of the same idea.',
    'Day 4: Take an Optimize challenge and write the List it would have needed. This reverses the sequence and reveals what your lists are missing when the stakes are real.',
    'Day 5: Take a mixed challenge. Pay particular attention to whether the options you generate in List support a real tradeoff in Optimize, or whether they collapse the decision space before it opens.',
    'Day 6: Set a ten-minute timer. Take one challenge. Force yourself to generate a minimum of three structurally distinct options in the List move before advancing.',
    'Day 7: Take a full FLOW challenge. After completing it, go back to the List move and add one option you did not initially consider. Ask what it would change about the Optimize move.',
  ],
  optimize: [
    'Day 1: Take one challenge in Optimize mode. After picking an option, write the full sacrifice statement before checking your result: "We get X. We give up Y. That trade is acceptable because Z."',
    'Day 2: Take a second Optimize challenge. Before picking anything, name the criterion you are optimising for. Then check whether your pick actually maximises that criterion.',
    'Day 3: Take a Frame challenge and write an Optimize move for it. This builds the connection between upstream problem definition and the criterion that should follow from it.',
    'Day 4: Take a Win challenge and write an Optimize move that precedes it. The criterion in Optimize should predict the metric in Win. Check whether yours does.',
    'Day 5: Take a mixed challenge. After completing it, review whether the criterion in Optimize was explicit or implied. If implied, rewrite it as a named criterion with a stated sacrifice.',
    'Day 6: Set a ten-minute timer. One challenge, sacrifice statement written before any other output for the Optimize move.',
    'Day 7: Take a full FLOW challenge and narrate each move out loud. When you get to Optimize, say the criterion name before you say what you would pick. This builds the habit under pressure.',
  ],
  win: [
    'Day 1: Take one challenge in Win mode. After writing your outcome, apply the falsifiability test: metric, threshold, timeline. If any of the three is missing, rewrite before submitting.',
    'Day 2: Take a second Win challenge. After writing your metric, add the counter-signal: what would confirm failure. The counter-signal clause is the distinction between a prediction and a direction.',
    'Day 3: Take a Frame challenge and write the Win move for it. Starting with the outcome and reasoning backward to the Frame is a good diagnostic for whether the Frame and Win are logically connected.',
    'Day 4: Take an Optimize challenge and write the Win it would produce. Check whether the metric follows from the criterion named in Optimize, or whether they are independent.',
    'Day 5: Take a mixed challenge. Do not advance past Win until the metric has a threshold and a timeline. If the threshold is hard to name, that is domain expertise signalling where to study.',
    'Day 6: Set a ten-minute timer. One challenge, counter-signal clause written for every outcome statement.',
    'Day 7: Take a full FLOW challenge. Before writing Win, say the complete falsifiability test out loud: name the metric, state the threshold, state the timeline, state what failure looks like. Then write it.',
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreBand(v: number): 'weak' | 'mid' | 'strong' {
  if (v >= 70) return 'strong'
  if (v >= 50) return 'mid'
  return 'weak'
}

function weakestMove(dims: Record<string, number>): MoveKey {
  const moves: MoveKey[] = ['frame', 'list', 'optimize', 'win']
  return moves.reduce((min, k) => ((dims[k] ?? 0) < (dims[min] ?? 0) ? k : min), moves[0])
}

const MOVE_LABELS: Record<MoveKey, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildFailureModeReport(
  result: MagnetResultPayload,
  name?: string | null,
): ReportContent {
  const greeting = name ? name : null

  // Dimensions come in as Record<string, number> (0-100 per move).
  const dims = (result.dimensions ?? {}) as Record<string, number>

  const bandKey = result.band
  const archetype = ARCHETYPE_COPY[bandKey] ?? ARCHETYPE_COPY.emerging_thinker

  const weakest = weakestMove(dims)
  const weakestLabel = MOVE_LABELS[weakest]
  const competencies = MOVE_TO_COMPETENCIES[weakest]
  const reps = REPS_BY_MOVE[weakest]
  const plan = SEVEN_DAY_PLAN[weakest]

  const moves: MoveKey[] = ['frame', 'list', 'optimize', 'win']

  return {
    title: greeting
      ? `${greeting}'s failure-mode profile`
      : 'Your failure-mode profile',
    intro:
      'Four scenarios. One archetype. The move you skip, the competencies it implicates, and the reps that fix it.',
    sections: [
      // ── (a) Archetype ────────────────────────────────────────────────────────
      {
        id: 'archetype',
        title: 'Your archetype',
        body: (
          <div>
            <div
              className="lm-report-move-card"
              style={{ marginBottom: '1.25rem' }}
            >
              <div className="lm-report-move-header">
                <span className="lm-report-move-name" style={{ fontSize: '1.1rem' }}>
                  {archetype.name}
                </span>
              </div>
              <p className="lm-report-move-def" style={{ marginTop: '0.5rem' }}>
                {archetype.what}
              </p>
            </div>
            <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', fontSize: 14 }}>
              Archetypes are not fixed. They reflect the pattern produced by four answers
              under time pressure. The pattern changes when the weakest move improves.
            </p>
          </div>
        ),
      },

      // ── (b) Four moves ───────────────────────────────────────────────────────
      {
        id: 'four-moves',
        title: 'Your four moves',
        body: (
          <div>
            <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', marginBottom: '1.25rem', fontSize: 14 }}>
              Each move scored on a 0-100 scale from your answers.
              A score below 50 means the move was skipped or landed on the wrong layer.
              A score of 70 or above means the move was structurally present and well-executed.
            </p>
            <div className="lm-report-moves">
              {moves.map((move) => {
                const val = dims[move] ?? 0
                const band = scoreBand(val)
                const line = MOVE_SCORE_LINES[move][band]
                return (
                  <div key={move} className="lm-report-move-card">
                    <div className="lm-report-move-header">
                      <span className="lm-report-move-key">{MOVE_LABELS[move][0]}</span>
                      <span className="lm-report-move-name">{MOVE_LABELS[move]}</span>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontWeight: 700,
                          fontSize: 13,
                          color:
                            band === 'strong'
                              ? 'var(--forest)'
                              : band === 'mid'
                                ? 'var(--amber-2)'
                                : 'var(--ink-3)',
                        }}
                      >
                        {val}
                      </span>
                    </div>
                    <div className="lm-score-bar" style={{ margin: '8px 0' }}>
                      <div
                        className="lm-score-fill"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                    <p className="lm-report-move-def">{line}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ),
      },

      // ── (c) Six competencies ─────────────────────────────────────────────────
      {
        id: 'competencies',
        title: 'The competencies behind your score',
        body: (
          <div>
            <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', marginBottom: '1.25rem', fontSize: 14 }}>
              Each FLOW move draws on two competencies. Your weakest move,{' '}
              <strong>{weakestLabel}</strong>, implicates the two described below.
              These are the competencies where targeted reps produce the largest score improvement.
            </p>
            <div className="lm-report-templates">
              {competencies.map((c) => (
                <div key={c.name} className="lm-report-template-card">
                  <div className="lm-report-template-header">
                    <span className="lm-report-template-tag">{weakestLabel}</span>
                    <span className="lm-report-template-title">{c.name}</span>
                  </div>
                  <p className="lm-report-template-note">{c.what}</p>
                </div>
              ))}
            </div>
            <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', marginTop: '1rem', fontSize: 14 }}>
              The full competency model has six dimensions. The other four are reached by
              strengthening the remaining moves. The sequence that works: fix the weakest
              move first, because the competencies it implicates are prerequisites for the
              adjacent moves.
            </p>
          </div>
        ),
      },

      // ── (d) Three reps ───────────────────────────────────────────────────────
      {
        id: 'reps',
        title: `Three reps that fix ${weakestLabel}, in order`,
        body: (
          <div>
            <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', marginBottom: '1.25rem', fontSize: 14 }}>
              These are ordered by the skill they build. Start with the first and do not
              advance to the second until the first feels automatic. The third rep is the
              one that transfers to live interview conditions.
            </p>
            <ol className="lm-report-steps">
              {reps.map((r, i) => (
                <li key={r.title}>
                  <strong>{i + 1}. {r.title}</strong>
                  <p style={{ marginTop: '0.4rem', lineHeight: 1.65, color: 'var(--ink-2)', fontSize: 14 }}>
                    {r.rep}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        ),
      },

      // ── (e) 7-day plan ───────────────────────────────────────────────────────
      {
        id: 'seven-day-plan',
        title: 'Your 7-day plan',
        body: (
          <div>
            <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', marginBottom: '1.25rem', fontSize: 14 }}>
              Four days on the weakest move in isolation, then mixed-mode reps to transfer
              under pressure. One day 6 set under a timer. Day 7 is a full mock: all four
              moves, no notes, narrated out loud.
            </p>
            <ol className="lm-report-steps">
              {plan.map((line, i) => (
                <li key={i}>
                  <p style={{ margin: 0, lineHeight: 1.65, color: 'var(--ink-2)', fontSize: 14 }}>
                    {line}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        ),
      },
    ],
  }
}
