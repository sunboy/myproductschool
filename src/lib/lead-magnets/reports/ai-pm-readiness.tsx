// Report content for /go/ai-pm-readiness.
// Uses result.band (exposed/close/round-ready) and result.dimensions (five 0-3 dims:
// framing, layer, evals, safety, data) to generate a per-dimension breakdown,
// a worked model-layer vs app-layer example, a safety-woven answer template,
// and a two-week plan keyed to the weakest dimension.

import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import type { ReportContent } from './index'

// ── Dimension metadata ────────────────────────────────────────────────────────

type DimKey = 'framing' | 'layer' | 'evals' | 'safety' | 'data'

interface DimMeta {
  label: string
  tests: string
  gap: string
  strength: string
}

const DIM_META: Record<DimKey, DimMeta> = {
  framing: {
    label: 'Problem framing',
    tests: 'Whether a candidate can identify when NOT to reach for a model. The question is not which AI approach to use but whether any AI approach is the right layer for this problem at all.',
    gap: 'The gap is treating "build an AI feature" as the constraint rather than the question. When a problem is highly structured, deterministic, or low-variance, a rules-based or traditional solution is often faster, cheaper, and more reliable than a model. Missing this is the most common first-round filter.',
    strength: 'The framing instinct is there. Problems get interrogated before solutions get proposed, and the model layer is reached for only after simpler alternatives have been ruled out.',
  },
  layer: {
    label: 'Model vs app layer',
    tests: 'Whether a candidate can correctly assign a problem to the model layer or the application layer. Most consistency, formatting, and style problems are app-layer problems. Fine-tuning is a model-layer intervention and a last resort, not a first response.',
    gap: 'The gap is defaulting to the model layer for problems that belong in the app layer. Formatting inconsistency, style drift, and output structure issues are almost always fixable with a system prompt, few-shot examples, or a post-processing step at a fraction of the cost and latency of fine-tuning.',
    strength: 'The model-vs-app-layer distinction is clean. App-layer solutions get tried before model-layer interventions, and the reason for choosing one layer over the other is articulable.',
  },
  evals: {
    label: 'Evals',
    tests: 'Whether a candidate understands the gap between offline evals and online metrics, and can identify what offline evals cannot measure. An eval suite that passes pre-launch tells you something about the past. Online metrics tell you whether the feature changes user behaviour in the present.',
    gap: 'The gap is treating offline eval coverage as a proxy for production success. ROUGE scores, human acceptance rates, and factual accuracy checks measure quality against a historical snapshot. They cannot measure whether agents find suggestions useful, whether resolution time changes, or whether the feature is adopted on the hard cases or only the easy ones.',
    strength: 'The eval distinction is solid. Offline evals and online metrics are treated as complementary, not redundant, and the online metrics that matter are named from user behaviour rather than from model output.',
  },
  safety: {
    label: 'Safety design',
    tests: 'Whether a candidate can describe safety as a design concern woven into every layer, not as a testing concern or a legal disclaimer. Safety belongs at the framing stage, the data layer, the output layer, and the metrics layer, not only in a pre-launch checklist.',
    gap: 'The gap is treating safety as a closing disclaimer rather than a design input. A disclaimer does not enforce a data boundary. It does not prevent the model from retrieving another user\'s data, speculating on credit decisions, or producing structured outputs that create regulatory liability. Safety must be present at the layer where the risk lives.',
    strength: 'Safety is woven into the design rather than appended at the end. Data boundaries, output constraints, escalation paths, and ongoing metrics all appear in the right places.',
  },
  data: {
    label: 'Data instinct',
    tests: 'Whether a candidate can read patterns in feature-level metrics and form a data-grounded hypothesis before jumping to a fix. High engagement with low creation is not a success signal, it is a filter-bubble signal, and the ability to name that distinction before running any code is what the round is testing.',
    gap: 'The gap is accepting a high proxy metric as confirmation the feature is working. Click-through rate is an engagement signal, not a value signal. The right question is what the feature is producing over time and what it is feeding on. A recommendation engine that raises CTR while narrowing topic diversity is making the product worse, not better.',
    strength: 'The data instinct is present. Metric patterns get interrogated rather than accepted, proxy metrics are distinguished from value metrics, and the first diagnostic question is about what the feature produces and what it feeds on.',
  },
}

// ── Band summaries ────────────────────────────────────────────────────────────

const BAND_SUMMARIES: Record<string, string> = {
  exposed:
    'The 2026 AI product-sense round tests reasoning that was not covered in standard 2023 prep. The gaps here are the specific dimensions that AI-native companies use to filter in the first fifteen minutes. None of them are gaps in general product thinking, they are gaps in AI-specific product reasoning, and they close faster than general reasoning gaps because they are grounded in concrete patterns.',
  close:
    'Some of the reasoning is solid. One or two dimensions are at partial credit or below, and those are the dimensions that separate a pass from a re-screen in the current round format. The gaps are specific and closeable with targeted practice rather than broad prep.',
  'round-ready':
    'The core reasoning is present across most dimensions. At this level, the work is sharpening the one or two dimensions below full marks and building the fluency to reason live under pressure without reaching for a framework as a crutch.',
}

// ── Two-week plans keyed to weakest dimension ─────────────────────────────────

const TWO_WEEK_PLANS: Record<DimKey, string[]> = {
  framing: [
    'Week 1, days 1-3: For every AI feature request you encounter in a challenge or a case study, write one sentence on what a non-AI solution would do and why it is or is not sufficient. The goal is building the habit of evaluating the AI question before answering it.',
    'Week 1, days 4-5: Take three framing-focused challenges and for each one write the explicit question: is the problem highly structured, low-variance, and deterministic enough that a rules-based approach gives the same result at lower cost and risk. Write the answer before reading any answer options.',
    'Week 1, days 6-7: Review two real AI product launches (look for case studies with post-mortems). For each one, identify whether a rules-based alternative was evaluated and, if not, what the cost of skipping that question was.',
    'Week 2, days 1-4: Take one AI-adjacent product challenge per day. Write your problem framing in two versions: one that assumes AI is the answer, one that interrogates whether it should be. Compare the solution spaces they open.',
    'Week 2, days 5-7: Do timed reps. Ten minutes per challenge. The framing question must appear in the first two minutes, before any solution generation begins.',
  ],
  layer: [
    'Week 1, days 1-3: For every AI output-quality problem you encounter, classify it before proposing a fix: is this a model problem (the model cannot do this at all) or an app-layer problem (the model can do this but is not being told to). Write the classification before writing the solution.',
    'Week 1, days 4-5: Take three layer-judgment challenges. Before selecting any option, write what a system prompt and a few-shot example would produce, and what fine-tuning would produce. Write the cost and latency difference between the two approaches.',
    'Week 1, days 6-7: Find two real examples of teams that fine-tuned when a system prompt would have worked. Identify the signal they missed that would have pointed to the app layer.',
    'Week 2, days 1-4: One challenge per day where you must state, before answering, the layer where the problem lives and one sentence on how you know. The sentence must name a specific cost or risk of moving the problem to the wrong layer.',
    'Week 2, days 5-7: Timed reps. Layer classification in the first ninety seconds. The classification must include the cost of the alternative layer, not just the identification of the correct one.',
  ],
  evals: [
    'Week 1, days 1-3: For any AI feature result you see, list the offline evals it likely passed and the online metrics it would need to confirm success. Write them as two separate lists and identify the gap between them.',
    'Week 1, days 4-5: Take three eval-focused challenges. For each one, write the user behaviour metric that the offline eval cannot measure and explain why. The explanation must be in terms of what the offline eval was measuring and what it was blind to.',
    'Week 1, days 6-7: Review two AI feature failures where offline evals passed but production metrics were poor. Identify which online metrics would have caught the failure earlier and at what point in the product lifecycle they should have appeared.',
    'Week 2, days 1-4: One challenge per day where you must name at least two online metrics before selecting your answer option. The metrics must be grounded in user behaviour, not model output.',
    'Week 2, days 5-7: Timed reps. Online metric identification in the first ninety seconds. Each metric must have a named unit of measurement, not a directional description.',
  ],
  safety: [
    'Week 1, days 1-3: For any AI product spec you encounter, identify where safety belongs in each of four layers: problem framing, data access, output format, and ongoing metrics. Write one safety requirement per layer before reading any answer options.',
    'Week 1, days 4-5: Take three safety-focused challenges. For each one, write the data boundary that must be enforced at the retrieval layer rather than by model instruction. Explain why enforcing it in the prompt is insufficient.',
    'Week 1, days 6-7: Find two examples of AI products where the safety disclaimer was the only safety mechanism. Identify what category of failure each disclaimer could not prevent and what the correct layer for prevention would have been.',
    'Week 2, days 1-4: One challenge per day where you must state a safety requirement for each layer before answering. No layer can be omitted. The data layer and output layer requirements must be structural, not instructional.',
    'Week 2, days 5-7: Timed reps. Safety layer identification in the first two minutes. Each layer must have a concrete mechanism, not a principle. "Row-level access enforced at the retrieval layer" not "restrict data access."',
  ],
  data: [
    'Week 1, days 1-3: For any feature metric pattern you encounter, write your hypothesis about what the feature is producing and what it is feeding on before reading any analysis. The hypothesis must name a specific data signal to check first.',
    'Week 1, days 4-5: Take three data-instinct challenges. For each one, write the difference between the proxy metric that is high and the value metric that matters. Write the data check that would confirm whether the proxy and the value metric are diverging.',
    'Week 1, days 6-7: Find two examples of features where high engagement metrics coexisted with low or negative value creation. Identify the data signal that would have distinguished the two and when in the product lifecycle it would have appeared.',
    'Week 2, days 1-4: One challenge per day where you must state your data hypothesis and name the first signal to check before selecting any answer option. The hypothesis must name what the feature is producing and what it is feeding on.',
    'Week 2, days 5-7: Timed reps. Data hypothesis in the first ninety seconds. The hypothesis must be falsifiable: it must name a specific data check that would confirm or deny it.',
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function weakestDim(dims: Record<string, number>): DimKey {
  const keys: DimKey[] = ['framing', 'layer', 'evals', 'safety', 'data']
  return keys.reduce((min, k) => ((dims[k] ?? 0) < (dims[min] ?? 0) ? k : min), keys[0])
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildAiPmReadinessReport(
  result: MagnetResultPayload,
  name?: string | null,
): ReportContent {
  const greeting = name ? name : null

  const dims = (result.dimensions ?? {}) as Record<string, number>
  const bandKey = result.band
  const bandSummary = BAND_SUMMARIES[bandKey] ?? BAND_SUMMARIES.exposed

  const dimKeys: DimKey[] = ['framing', 'layer', 'evals', 'safety', 'data']
  const weakest = weakestDim(dims)
  const weakestMeta = DIM_META[weakest]
  const twoWeekPlan = TWO_WEEK_PLANS[weakest]

  return {
    title: greeting ? `${greeting}'s AI product-sense readiness report` : 'Your AI product-sense readiness report',
    intro:
      'Five dimensions, one readiness band, and the worked examples that close the gap before your next round.',
    sections: [
      // ── (a) Where you stand ──────────────────────────────────────────────────
      {
        id: 'where-you-stand',
        title: 'Where you stand',
        body: (
          <div>
            <div className="lm-report-move-card" style={{ marginBottom: '1.25rem' }}>
              <div className="lm-report-move-header">
                <span
                  className="lm-report-move-name"
                  style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}
                >
                  {bandKey === 'round-ready'
                    ? 'Round-ready'
                    : bandKey === 'close'
                      ? 'Close, with gaps'
                      : 'Exposed'}
                </span>
              </div>
              <p className="lm-report-move-def" style={{ marginTop: '0.5rem' }}>
                {bandSummary}
              </p>
            </div>
            <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', fontSize: 14 }}>
              The five dimensions below show exactly where the score sits and what the gap
              looks like for each one. Dimensions at 1 or below are the ones interviewers at
              AI-native companies use to filter in the first fifteen minutes.
            </p>
          </div>
        ),
      },

      // ── (b) Five dimensions ──────────────────────────────────────────────────
      {
        id: 'dimensions',
        title: 'Your five dimensions',
        body: (
          <div>
            <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', marginBottom: '1.25rem', fontSize: 14 }}>
              Each dimension scores 0 to 3. A score of 3 means the reasoning move behind that
              dimension was present and correctly applied. A score of 0 or 1 means the move
              was absent or pointed at the wrong layer.
            </p>
            <div className="lm-report-moves">
              {dimKeys.map((key) => {
                const val = dims[key] ?? 0
                const meta = DIM_META[key]
                const isGap = val <= 1
                const isStrong = val >= 3
                return (
                  <div key={key} className="lm-report-move-card">
                    <div className="lm-report-move-header">
                      <span className="lm-report-move-name">{meta.label}</span>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontWeight: 700,
                          fontSize: 13,
                          color: isStrong
                            ? 'var(--forest)'
                            : isGap
                              ? 'var(--ink-3)'
                              : 'var(--amber-2)',
                        }}
                      >
                        {val} / 3
                      </span>
                    </div>
                    <div className="lm-score-bar" style={{ margin: '8px 0' }}>
                      <div
                        className="lm-score-fill"
                        style={{ width: `${Math.round((val / 3) * 100)}%` }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-3)',
                        margin: '0 0 4px',
                      }}
                    >
                      What this tests
                    </p>
                    <p className="lm-report-move-def" style={{ marginBottom: '0.75rem' }}>
                      {meta.tests}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: isGap ? 'var(--amber-2)' : 'var(--forest)',
                        margin: '0 0 4px',
                      }}
                    >
                      {isGap ? 'Gap' : 'Strength'}
                    </p>
                    <p className="lm-report-move-def">
                      {isGap ? meta.gap : meta.strength}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        ),
      },

      // ── (c) Model layer vs app layer, worked ─────────────────────────────────
      {
        id: 'model-vs-app-layer',
        title: 'Model layer vs app layer, worked',
        body: (
          <div>
            <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', marginBottom: '1.1rem', fontSize: 14 }}>
              This is the distinction that comes up most often in AI product-sense rounds, and
              the one most candidates get wrong by defaulting to the model layer. Here is a
              complete worked example.
            </p>

            <div className="lm-report-move-card" style={{ marginBottom: '1rem' }}>
              <div className="lm-report-move-header">
                <span className="lm-report-move-key">Q</span>
                <span className="lm-report-move-name">The feature request</span>
              </div>
              <p className="lm-report-move-def" style={{ marginTop: '0.5rem' }}>
                The support team wants a feature that summarises long customer support threads
                so agents can read context quickly without scrolling through 40 messages.
              </p>
            </div>

            <div className="lm-report-templates">
              <div className="lm-report-template-card">
                <div className="lm-report-template-header">
                  <span className="lm-report-template-tag">App layer</span>
                  <span className="lm-report-template-title">What belongs here</span>
                </div>
                <p className="lm-report-template-note">
                  The summary format is an app-layer decision: the template that structures
                  what gets surfaced (customer intent, previous resolution attempts, current
                  blocking issue) belongs in a system prompt with few-shot examples of the
                  desired output shape. Retrieval strategy is app-layer: which messages to
                  include, how many, and how to handle threads with attachments or agent
                  transfers. UX guardrails are app-layer: where the summary appears, how it
                  is labelled so agents know it is AI-generated, and what the fallback is
                  when the summary quality is low. Evals are app-layer: measuring whether
                  agents read the summary, whether they edit it heavily, and whether
                  time-to-first-reply changes. None of these require touching the model.
                </p>
              </div>

              <div className="lm-report-template-card">
                <div className="lm-report-template-header">
                  <span className="lm-report-template-tag">Model layer</span>
                  <span className="lm-report-template-title">When it is justified</span>
                </div>
                <p className="lm-report-template-note">
                  The model layer is justified when the base model cannot perform the task at
                  an acceptable quality level even with a detailed system prompt and shot
                  examples. For summarisation, this would mean the model consistently misses
                  domain-specific resolution patterns that only appear in company data (for
                  example, reading that a billing dispute in a specific product line is almost
                  always resolved by escalating to a particular team). Fine-tuning on resolved
                  tickets could teach that pattern at the cost of ongoing data maintenance and
                  re-training cycles. The question to ask first is whether the system prompt
                  with five or six examples of that pattern produces the same result. In most
                  cases it does.
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: '1.25rem',
                padding: '14px 16px',
                background: 'var(--forest-soft)',
                borderLeft: '3px solid var(--forest)',
                borderRadius: 'var(--r-md)',
              }}
            >
              <p style={{ fontWeight: 700, color: 'var(--forest)', fontSize: 14, margin: '0 0 6px' }}>
                The line that separates a pass from a reject
              </p>
              <p style={{ color: 'var(--ink-1)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                A passing answer names the layer where the problem lives and states one
                concrete reason why moving it to the other layer would cost more than it
                gains. A rejecting answer reaches for the model layer first and treats
                app-layer alternatives as a fallback rather than a default. The question
                interviewers are asking is: does this candidate know where to apply force
                before spending engineering capital?
              </p>
            </div>
          </div>
        ),
      },

      // ── (d) Safety-woven answer template ─────────────────────────────────────
      {
        id: 'safety-template',
        title: 'The safety-woven answer template',
        body: (
          <div>
            <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', marginBottom: '1.1rem', fontSize: 14 }}>
              Most candidates treat safety as a closing disclaimer: &quot;and we would add a
              disclaimer that this is not financial advice.&quot; That is not safety design. Safety
              that lives only in the output layer cannot enforce a data boundary, prevent
              speculation, or create an audit trail. Here is a skeleton where safety appears
              at the right layers from the start.
            </p>

            <div className="lm-report-moves">
              {[
                {
                  layer: 'At framing',
                  tag: 'F',
                  content:
                    'Define the scope boundary before writing any spec: what questions can the assistant answer, what questions must escalate to a human, and who decides when the boundary changes. This is not a UX decision, it is a safety decision that must be made at the design stage before data access or output format is discussed.',
                },
                {
                  layer: 'At the data layer',
                  tag: 'D',
                  content:
                    'Enforce access boundaries structurally, not instructionally. The model should not be able to retrieve data the current user is not authorised to see, regardless of how it is prompted. Row-level access controls enforced at the retrieval layer are the correct mechanism. A system prompt instruction to "only show this user their own data" is not.',
                },
                {
                  layer: 'At the output layer',
                  tag: 'O',
                  content:
                    'Use a structured output format that constrains what the model can produce. For a fintech assistant, this means a schema that prevents free-form speculation on credit decisions or investment recommendations. The format is the guardrail: the model fills slots, it does not compose freely in domains with regulatory liability.',
                },
                {
                  layer: 'At metrics',
                  tag: 'M',
                  content:
                    'Safety is an ongoing metric, not a launch gate. The hallucination rate on account facts, the rate of out-of-scope responses, and the rate of escalations that should have happened but did not are all safety metrics that need a baseline, a threshold, and an alerting policy before launch. Not after an incident.',
                },
              ].map((item) => (
                <div key={item.layer} className="lm-report-move-card">
                  <div className="lm-report-move-header">
                    <span className="lm-report-move-key">{item.tag}</span>
                    <span className="lm-report-move-name">{item.layer}</span>
                  </div>
                  <p className="lm-report-move-def" style={{ marginTop: '0.5rem' }}>
                    {item.content}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '1.25rem',
                padding: '14px 16px',
                background: 'var(--surface-2)',
                borderLeft: '3px solid var(--line-2)',
                borderRadius: 'var(--r-md)',
              }}
            >
              <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                Use this skeleton in any AI product-sense answer where a live product is
                involved. Safety at framing first, data layer second, output layer third,
                metrics last. If the interviewer asks &quot;how did you think about safety?&quot; and
                the only answer is a disclaimer, that is a gap signal. If the answer names a
                mechanism at each layer, that is a pass signal.
              </p>
            </div>
          </div>
        ),
      },

      // ── (e) The next two weeks ───────────────────────────────────────────────
      {
        id: 'next-two-weeks',
        title: `The next two weeks, starting from ${weakestMeta.label.toLowerCase()}`,
        body: (
          <div>
            <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', marginBottom: '1.1rem', fontSize: 14 }}>
              Your weakest dimension is <strong>{weakestMeta.label}</strong>. The plan below
              starts there. The first week builds the reasoning pattern in isolation. The
              second week transfers it under time pressure with mixed-mode reps.
            </p>
            <ol className="lm-report-steps">
              {twoWeekPlan.map((line, i) => (
                <li key={i}>
                  <p style={{ margin: 0, lineHeight: 1.65, color: 'var(--ink-2)', fontSize: 14 }}>
                    {line}
                  </p>
                </li>
              ))}
            </ol>
            <p style={{ lineHeight: 1.65, color: 'var(--ink-2)', marginTop: '1rem', fontSize: 14 }}>
              After two weeks on the weakest dimension, run a full five-question readiness
              check again. The pattern to look for is whether the weakest dimension has moved
              and whether the other dimensions have held. If a second dimension has dropped,
              rotate the plan to that one for the next two weeks.
            </p>
          </div>
        ),
      },
    ],
  }
}
