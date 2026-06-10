// Quiz config for /go/ai-pm-readiness
// "Would you pass a 2026 AI product-sense round today?"
//
// Five scenarios, one per dimension the round actually tests.
// Scoring: each dimension is 0-3. Total 0-15 mapped to three bands.
// deriveResult never exposes a naked score — band + bars only.

import type { MagnetQuizConfig, QuizAnswers, QuizOutcome } from '@/lib/lead-magnets/quiz-types'

export const aiPmReadinessConfig: MagnetQuizConfig = {
  magnet: 'ai-pm-readiness',
  version: 1,

  steps: [
    // ── Step 1: Problem framing in AI products (when NOT to use a model) ──────
    {
      kind: 'mcq',
      id: 'framing',
      context:
        'A user-research team at a B2B SaaS company asks you to build an AI feature that summarises customer-call transcripts. The product manager has already written the spec. Engineering is ready to start. The calls average 40 minutes and follow a highly structured format: sales discovery calls, all with the same eight questions asked in the same order.',
      prompt:
        'What is the first thing you push back on before the feature goes into sprint?',
      options: [
        {
          id: 'a',
          text: 'The summary length is not specified. Users probably want different lengths for different audiences, so the spec needs a length setting before you start.',
          scores: { framing: 1 },
        },
        {
          id: 'b',
          text: 'The calls are highly structured with eight fixed questions, so a rules-based extraction probably gives the same result with zero model latency, no hallucination risk, and a fraction of the cost. You should validate that before committing to a model.',
          scores: { framing: 3 },
        },
        {
          id: 'c',
          text: 'You need to define the eval set first. Without a gold-standard set of human-written summaries, you cannot measure whether the model is doing a good job.',
          scores: { framing: 2 },
        },
        {
          id: 'd',
          text: 'The spec should name the model. Using the wrong foundation model for summarisation will degrade quality significantly, so that decision should be locked before sprint starts.',
          scores: { framing: 0 },
        },
      ],
    },

    // ── Step 2: Model layer vs app layer judgment ──────────────────────────────
    {
      kind: 'mcq',
      id: 'layer',
      context:
        'A team is building a coding assistant that helps engineers write SQL queries. In testing, the model often returns correct SQL but formats it inconsistently: sometimes it uses aliases, sometimes full column names, sometimes it adds unnecessary subqueries. The team is debating how to fix this.',
      prompt:
        'A team member says the inconsistency is a model problem and suggests fine-tuning on a curated SQL corpus. What is your verdict?',
      options: [
        {
          id: 'a',
          text: 'Fine-tuning is correct. Formatting consistency is a learned behaviour and the base model cannot reliably internalise company-specific style without it.',
          scores: { layer: 0 },
        },
        {
          id: 'b',
          text: 'Fine-tuning is worth exploring, but it is expensive and you should first confirm the base model cannot be guided with a detailed system prompt and a few-shot examples of the desired format.',
          scores: { layer: 2 },
        },
        {
          id: 'c',
          text: 'This is an app-layer problem, not a model problem. A post-processing step that normalises SQL formatting, or a system prompt with explicit output rules and shot examples, will fix it without touching the model.',
          scores: { layer: 3 },
        },
        {
          id: 'd',
          text: 'The inconsistency suggests the model is too small. Upgrading to a larger foundation model is the fastest path to consistent formatting.',
          scores: { layer: 1 },
        },
      ],
    },

    // ── Step 3: Evals (offline evals vs online metrics) ───────────────────────
    {
      kind: 'mcq',
      id: 'evals',
      context:
        'Your team just shipped an AI feature that drafts reply suggestions for customer-support agents. The model passed all pre-launch offline evals: ROUGE scores against historical replies, a 90% acceptance rate from a human-rating panel, and a factual-accuracy check against the knowledge base. Two weeks after launch, support managers report that agents are editing the suggestions heavily before sending and ticket resolution time has not improved.',
      prompt:
        'What does this tell you about the eval suite, and what would you add?',
      options: [
        {
          id: 'a',
          text: 'The offline evals were too easy. You should add harder test cases and re-run the same eval types before concluding anything from production data.',
          scores: { evals: 1 },
        },
        {
          id: 'b',
          text: 'ROUGE score measures text similarity to historical replies, not whether a suggestion is actually useful to an agent in a live context. The eval suite measured quality as defined by the past, not as experienced in the present. The missing evals are online metrics: edit rate per suggestion, time-to-send per ticket, and whether agents are accepting suggestions on the hardest ticket types or only on easy ones.',
          scores: { evals: 3 },
        },
        {
          id: 'c',
          text: 'The human-rating panel was too small. A 90% acceptance rate from a small panel does not generalise to production. You need a larger labelling effort before reading anything into the production result.',
          scores: { evals: 0 },
        },
        {
          id: 'd',
          text: 'The issue is distribution shift. Production tickets are probably harder than the eval set. You should re-build the eval set from recent production tickets and re-run the existing eval types.',
          scores: { evals: 2 },
        },
      ],
    },

    // ── Step 4: Safety woven into the design ──────────────────────────────────
    {
      kind: 'mcq',
      id: 'safety',
      context:
        'A fintech product team wants to add an AI assistant that answers user questions about their account, including transaction history, spending patterns, and available credit. The team has drafted a spec. The only safety section reads: "The assistant will include a disclaimer that it cannot provide financial advice."',
      prompt:
        'What is missing from the safety design, and where in the product lifecycle does it need to be addressed?',
      options: [
        {
          id: 'a',
          text: 'The disclaimer is sufficient for regulatory purposes. The real gap is the eval suite, which should include adversarial prompts before launch. Safety is a testing concern, not a design concern.',
          scores: { safety: 0 },
        },
        {
          id: 'b',
          text: 'The spec needs a data-access boundary: the assistant should only be able to retrieve data that the current authenticated user is allowed to see, and this boundary should be enforced at the retrieval layer, not by prompting the model to refuse. Beyond that, the disclaimer is fine.',
          scores: { safety: 2 },
        },
        {
          id: 'c',
          text: 'Safety needs to be woven into every stage, not just the disclaimer. At framing: what is the scope of what the assistant can and cannot answer, and who decides when it escalates to a human. At the data layer: strict row-level access so the model cannot retrieve another user\'s data regardless of how it is prompted. At the output layer: a structured response format that prevents the model from speculating on credit decisions. At metrics: a hallucination rate on account facts as an ongoing guardrail, not just a launch gate.',
          scores: { safety: 3 },
        },
        {
          id: 'd',
          text: 'The biggest safety risk is prompt injection from transaction descriptions, where a malicious merchant name could manipulate the assistant\'s behaviour. The spec should add an input sanitisation step for all user-controlled strings before they reach the model.',
          scores: { safety: 1 },
        },
      ],
    },

    // ── Step 5: Data instinct ──────────────────────────────────────────────────
    {
      kind: 'mcq',
      id: 'data',
      context:
        'A team ships an AI feature that recommends articles to read based on what a user has previously bookmarked. Six weeks after launch, the recommendation click-through rate is high but users are not bookmarking new articles. The team suspects the feature is working well and attributes the drop in new bookmarks to seasonal factors.',
      prompt:
        'What is the most likely data-level explanation for this pattern, and what would you look at first?',
      options: [
        {
          id: 'a',
          text: 'The high click-through rate confirms the feature is working. Seasonal factors are a plausible explanation for lower bookmarks and you should wait another four weeks before drawing conclusions.',
          scores: { data: 0 },
        },
        {
          id: 'b',
          text: 'The feature is probably showing users content similar to what they already bookmarked. High click-through combined with low new bookmarks is a classic filter-bubble signal: users are engaging with familiar territory rather than discovering something new enough to save. The first thing to check is similarity between recommended items and the seed bookmarks, and whether the diversity of topics in a user\'s bookmark set is growing or shrinking since the feature launched.',
          scores: { data: 3 },
        },
        {
          id: 'c',
          text: 'The recommendation model is overfitting to the bookmark signal. The fix is to add a diversity penalty to the ranking function so users see articles outside their existing interest clusters.',
          scores: { data: 2 },
        },
        {
          id: 'd',
          text: 'You need to run a holdout experiment. Without a control group, you cannot attribute the bookmarking pattern to the feature rather than seasonal variation or other product changes.',
          scores: { data: 1 },
        },
      ],
    },
  ],

  deriveResult(answers: QuizAnswers): QuizOutcome {
    const DIMS = [
      { key: 'framing', label: 'Problem framing' },
      { key: 'layer',   label: 'Model vs app layer' },
      { key: 'evals',   label: 'Evals' },
      { key: 'safety',  label: 'Safety design' },
      { key: 'data',    label: 'Data instinct' },
    ]

    // For each step the answer is an option id string. Look up the score from
    // the step's options.
    const STEP_IDS = ['framing', 'layer', 'evals', 'safety', 'data']
    const STEP_OPTIONS: Record<string, Record<string, number>> = {
      framing: { a: 1, b: 3, c: 2, d: 0 },
      layer:   { a: 0, b: 2, c: 3, d: 1 },
      evals:   { a: 1, b: 3, c: 0, d: 2 },
      safety:  { a: 0, b: 2, c: 3, d: 1 },
      data:    { a: 0, b: 3, c: 2, d: 1 },
    }

    const dimValues: Record<string, number> = {}
    for (const stepId of STEP_IDS) {
      const picked = answers[stepId]
      const score = typeof picked === 'string' ? (STEP_OPTIONS[stepId]?.[picked] ?? 0) : 0
      dimValues[stepId] = score
    }

    const total = STEP_IDS.reduce((sum, k) => sum + dimValues[k], 0)

    const dimensions = DIMS.map(d => ({
      key: d.key,
      label: d.label,
      value: dimValues[d.key] ?? 0,
      max: 3,
    }))

    // Gap lines: shown for dimensions scoring <= 1
    const GAP_LINES: Record<string, string> = {
      framing: 'Not every problem needs a model. The decision to reach for AI should come after ruling out simpler, more reliable alternatives.',
      layer:   'Prompt engineering and post-processing fix most consistency problems. Fine-tuning is a last resort, not a first response.',
      evals:   'Offline evals measure quality against a snapshot of the past. Online metrics tell you whether the feature changes user behaviour in the present.',
      safety:  'A disclaimer is not a safety design. Safety belongs at the data layer, the output layer, and the metrics layer from the start.',
      data:    'High engagement with low creation is a filter-bubble signal, not a success metric. Know what the feature produces and what it feeds on.',
    }

    const gaps: Record<string, string> = {}
    for (const d of dimensions) {
      if (d.value <= 1) {
        gaps[d.key] = GAP_LINES[d.key] ?? ''
      }
    }

    let band: QuizOutcome['band']
    if (total < 6) {
      band = {
        key: 'exposed',
        label: 'Exposed',
        blurb:
          'The 2026 AI product-sense round tests reasoning that did not exist in 2023 prep materials. The gaps here are the ones interviewers at AI-native companies use to filter candidates in the first 15 minutes.',
      }
    } else if (total <= 10) {
      band = {
        key: 'close',
        label: 'Close, with gaps',
        blurb:
          'Some of the reasoning is there. The gaps are specific and closeable with the right practice. One or two weak dimensions is usually all that separates a pass from a re-screen.',
      }
    } else {
      band = {
        key: 'round-ready',
        label: 'Round-ready',
        blurb:
          'The core reasoning is solid across most dimensions. At this level, the work is sharpening the one or two dimensions below full marks and building the fluency to reason live under pressure.',
      }
    }

    return {
      band,
      // score intentionally omitted per spec — band + bars only
      dimensions,
      detail: { gaps },
      recommendedNext: {
        label: 'Train the weakest dimension',
        href: '/challenges',
      },
    }
  },
}
