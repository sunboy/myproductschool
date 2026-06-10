// Authored question set for /go/ai-pm-questions.
//
// This page does NOT use MagnetQuiz. The data is consumed directly by the
// client component (ranked reveal list) and by the report builder.

export type FlowMove = 'frame' | 'list' | 'optimize' | 'win'

export interface AiPmQuestion {
  id: string
  rank: number
  question: string
  /** The hidden thing the interviewer is actually scoring. One sharp sentence. */
  signal: string
  /** Which FLOW move the question primarily exercises. */
  move: FlowMove
  /** Why candidates who are unready fail this question. */
  riskNote: string
}

// ─── The 10 visible questions ─────────────────────────────────────────────────
// Top 3 are questions that separate app-layer from model-layer thinking fast.

export const AI_PM_QUESTIONS: AiPmQuestion[] = [
  {
    id: 'q01',
    rank: 1,
    question:
      'A user says the assistant "keeps making things up." Walk through how you decide whether to fix the model, fix the retrieval layer, or change the product interaction.',
    signal:
      'Whether the candidate understands that hallucination has multiple upstream causes, and can route the diagnosis before proposing a fix.',
    move: 'frame',
    riskNote:
      'Most candidates jump to "fine-tune the model" or "add citations." That answer treats a diagnostic question as a solution question. Interviewers log it as app-layer thinking.',
  },
  {
    id: 'q02',
    rank: 2,
    question:
      'The team wants to add an AI feature to the onboarding flow. What is the first question you ask before writing a spec?',
    signal:
      'Whether the candidate asks about the cost of a wrong answer (what happens when the model fails), not just about what the feature should do.',
    move: 'frame',
    riskNote:
      'Candidates who are not AI-native ask about the use case or the data. Candidates who understand AI products ask about failure modes and fallback UX first.',
  },
  {
    id: 'q03',
    rank: 3,
    question:
      'Two engineers disagree on which model to use for a summarization feature. One argues for the smaller, cheaper model. The other argues for the larger model because accuracy is critical. How do you break the tie?',
    signal:
      'Whether the candidate reframes the disagreement as a measurement problem (define accuracy, run an eval) rather than a debate to moderate.',
    move: 'optimize',
    riskNote:
      'Unready candidates pick a side based on vibes or cost. The move is to ask what accuracy means for this task, define a success metric, and propose a head-to-head eval.',
  },
  {
    id: 'q04',
    rank: 4,
    question:
      'The model produces great output in testing but users are not engaging with it in production. What do you investigate first?',
    signal:
      'Whether the candidate separates output quality from product experience, and knows the distribution shift between test prompts and real user prompts.',
    move: 'frame',
    riskNote:
      'Candidates default to "the model needs tuning." The more likely cause is that test prompts do not reflect real user language or context.',
  },
  {
    id: 'q05',
    rank: 5,
    question:
      'Your AI feature has a 92% accuracy rate on the benchmark you built. A stakeholder says that is good enough to ship. What do you say?',
    signal:
      'Whether the candidate challenges the benchmark rather than just citing the number, and asks what the 8% failure looks like in terms of user harm.',
    move: 'optimize',
    riskNote:
      'Accepting a benchmark at face value is a red flag. The question tests whether the candidate can argue that benchmark quality and real-world quality are different things.',
  },
  {
    id: 'q06',
    rank: 6,
    question:
      'Leadership asks you to add an AI agent that takes actions on behalf of the user, not just generates text. What are the product risks you scope before writing a spec?',
    signal:
      'Whether the candidate names reversibility, authorization scope, and failure transparency as distinct risks, not just "accuracy."',
    move: 'list',
    riskNote:
      'Candidates who list "accuracy" and "latency" miss the agent-specific risks. Interviewers want to see that the candidate knows agents are a different category from text generation.',
  },
  {
    id: 'q07',
    rank: 7,
    question:
      'The team is debating whether to build a data flywheel for the AI feature. What condition has to be true for a data flywheel to actually improve the product?',
    signal:
      'Whether the candidate can name the causal chain: better data improves model performance only if the task is learnable from behavioral signals and the feedback loop is tight enough.',
    move: 'win',
    riskNote:
      'Most candidates say "more data makes the model better" without examining whether user behavior in this product produces the kind of signal that improves the model for this specific task.',
  },
  {
    id: 'q08',
    rank: 8,
    question:
      'A user reports that the AI gave them wrong medical information. The legal team says to add a disclaimer. What do you ship, and why is the disclaimer probably not sufficient?',
    signal:
      'Whether the candidate thinks about what the user will actually do with the disclaimer versus what behavior needs to change at the product or model level.',
    move: 'optimize',
    riskNote:
      'Disclaimers are a preference, not a tradeoff. The real tradeoff is between utility and risk containment, and it requires deciding what the product should and should not do.',
  },
  {
    id: 'q09',
    rank: 9,
    question:
      'How do you define the north-star metric for an AI writing assistant?',
    signal:
      'Whether the candidate names a metric that captures user value, not model quality, and explains why a model metric like BLEU score or perplexity is the wrong anchor.',
    move: 'win',
    riskNote:
      'Unready candidates propose model metrics or generic engagement metrics. Strong answers name something like "edits accepted per session" and explain why it proxies real writing value.',
  },
  {
    id: 'q10',
    rank: 10,
    question:
      'A stakeholder asks why the AI feature cannot just use GPT-4 for everything. How do you respond without getting into a model-selection debate?',
    signal:
      'Whether the candidate reframes the question around task requirements and cost structure rather than model brand loyalty.',
    move: 'frame',
    riskNote:
      'The trap is defending a specific model choice. The move is to explain that model selection follows from the task, latency, cost, and privacy requirements, not from defaults.',
  },
]

// ─── The 14 gated questions (ranks 11–24) ─────────────────────────────────────

export const FULL_SET: AiPmQuestion[] = [
  {
    id: 'q11',
    rank: 11,
    question:
      'How do you decide whether an AI feature should be synchronous (real-time response) or asynchronous (background processing)?',
    signal:
      'Whether the candidate frames the decision around user expectation management and perceived latency, not just server capacity.',
    move: 'optimize',
    riskNote:
      'Candidates default to "it depends on the model speed." The actual tradeoff is between user experience expectations and what the product can guarantee at a given cost.',
  },
  {
    id: 'q12',
    rank: 12,
    question:
      'An eval shows that 15% of AI-generated summaries are missing a key fact from the source document. What is your next step?',
    signal:
      'Whether the candidate treats this as an input data problem, a prompt design problem, or a model capability problem before deciding on a fix.',
    move: 'frame',
    riskNote:
      'Jumping to "improve the prompt" or "switch models" skips the diagnostic step. The eval result is a symptom, not a root cause.',
  },
  {
    id: 'q13',
    rank: 13,
    question:
      'The AI feature ships and engagement is high, but support tickets about incorrect information spike. How do you balance these two signals?',
    signal:
      'Whether the candidate can hold two conflicting metrics and reason about which one is the leading indicator of long-term product health.',
    move: 'optimize',
    riskNote:
      'High engagement with high error complaints is a product time-bomb. Candidates who celebrate the engagement number without interrogating the trust cost fail this question.',
  },
  {
    id: 'q14',
    rank: 14,
    question:
      'How do you write a user story for an AI feature when the output is non-deterministic?',
    signal:
      'Whether the candidate can specify acceptance criteria in terms of outcome ranges and failure conditions rather than exact outputs.',
    move: 'win',
    riskNote:
      'Standard "given/when/then" breaks when the output varies. Candidates who cannot adapt the format to probabilistic systems struggle in AI product roles.',
  },
  {
    id: 'q15',
    rank: 15,
    question:
      'A power user says the AI is "too safe" and refuses to help with legitimate tasks. A different user reports the AI "says harmful things." How do you triage these two complaints?',
    signal:
      'Whether the candidate recognizes these as opposing failure modes on a safety-utility spectrum and understands that the solution is calibration, not a single policy fix.',
    move: 'list',
    riskNote:
      'Candidates who treat these as independent bugs miss the structural tension. Any move toward one end of the spectrum moves away from the other.',
  },
  {
    id: 'q16',
    rank: 16,
    question:
      'The team wants to add a "confidence score" next to every AI response. What are the product risks of showing that number to users?',
    signal:
      'Whether the candidate knows that model confidence scores are poorly calibrated and that users will misread them as reliability guarantees.',
    move: 'list',
    riskNote:
      'Showing confidence scores sounds transparent, but miscalibrated scores create false certainty. Most candidates miss that model confidence is not the same as answer accuracy.',
  },
  {
    id: 'q17',
    rank: 17,
    question:
      'How do you prioritize AI safety work against new feature development when both are urgent?',
    signal:
      'Whether the candidate frames safety as a risk surface with measurable exposure, not as a qualitative concern that competes with velocity.',
    move: 'optimize',
    riskNote:
      'Treating safety as "important but vague" loses to feature work every sprint. The move is to quantify the safety risk in the same units as the opportunity cost.',
  },
  {
    id: 'q18',
    rank: 18,
    question:
      'The business wants to reduce AI inference costs by 60%. How do you approach this without degrading the user experience?',
    signal:
      'Whether the candidate maps cost to specific product surfaces and asks which calls are quality-sensitive versus which are tolerant of a cheaper model.',
    move: 'list',
    riskNote:
      'A blanket cost-reduction strategy degrades the most visible features first. The move is to segment by quality sensitivity and match the model tier to the task.',
  },
  {
    id: 'q19',
    rank: 19,
    question:
      'A competitor ships an AI feature that uses a newer model. Leadership wants to switch immediately. How do you respond?',
    signal:
      'Whether the candidate asks what the competitor feature actually does for users rather than anchoring on the model version as a proxy for product quality.',
    move: 'frame',
    riskNote:
      'Model chasing is a common failure mode. The question tests whether the candidate separates model capability from product value.',
  },
  {
    id: 'q20',
    rank: 20,
    question:
      'The AI feature works well for English speakers but underperforms for users writing in Spanish and Portuguese. What do you do?',
    signal:
      'Whether the candidate treats multilingual performance as an equity issue with its own eval, not just a model limitation to accept.',
    move: 'list',
    riskNote:
      'Accepting lower quality for non-English users is a product choice, not a technical inevitability. Strong candidates name this explicitly and propose a path.',
  },
  {
    id: 'q21',
    rank: 21,
    question:
      'How do you measure whether an AI feature is actually helping users accomplish their goal, versus just generating output they accept?',
    signal:
      'Whether the candidate distinguishes between output acceptance (a model metric) and goal completion (a product metric).',
    move: 'win',
    riskNote:
      'Users accept AI output even when it does not help. Tracking acceptance rates as success metrics flatters the product while hiding whether it works.',
  },
  {
    id: 'q22',
    rank: 22,
    question:
      'What information do you include in a system prompt, and what should never go there?',
    signal:
      'Whether the candidate knows that system prompts are not secure storage and understands the risks of putting sensitive policy or credential material in them.',
    move: 'list',
    riskNote:
      'Many candidates treat the system prompt as a configuration file. It is a trust boundary. Prompt injection and extraction attacks target exactly this surface.',
  },
  {
    id: 'q23',
    rank: 23,
    question:
      'You are three weeks from launch and the eval shows the model is still failing 12% of edge cases. What is your launch decision framework?',
    signal:
      'Whether the candidate has a structured way to assess whether the 12% failure is acceptable given the severity of those failures and the cost of delay.',
    move: 'optimize',
    riskNote:
      'Candidates who either always ship or always wait are not thinking about this correctly. The framework is: failure severity times failure rate versus cost of delay.',
  },
  {
    id: 'q24',
    rank: 24,
    question:
      'A user wants to know why the AI gave them a particular answer. How do you decide whether to build an explanation feature?',
    signal:
      'Whether the candidate asks what decision the user is trying to make with the explanation, rather than defaulting to "transparency is good."',
    move: 'frame',
    riskNote:
      'Explanations that do not match the user\'s mental model create confusion, not trust. The question tests whether the candidate understands that explainability is a UX problem, not just a model problem.',
  },
]

// ─── Answer skeletons for the 6 highest-risk questions ───────────────────────
// These are the reasoning moves of a strong answer, not a model answer.

export const ANSWER_SKELETONS: Record<string, string[]> = {
  q01: [
    'Start by separating the failure into three buckets: the model produces wrong facts (knowledge gap), the retrieval layer surfaces the wrong context (retrieval gap), or the product lets users form the wrong expectation (design gap).',
    'Ask for a concrete example from the user. The example tells you which bucket applies: if the fact exists in the knowledge base but was not retrieved, it is a retrieval problem. If the fact was never in the knowledge base, it is a model or sourcing problem.',
    'Frame the fix around the bucket, not the symptom. Retrieval gaps call for better chunking or reranking. Design gaps call for scoping the feature to what it can reliably do. Model gaps require a decision about whether fine-tuning or a different model is justified by the use case.',
    'Name the metric you would use to know the fix worked: hallucination rate on a held-out eval set, not user complaints (which are a lagging signal).',
  ],
  q02: [
    'The first question is: what happens when the model is wrong? Not "how often is it wrong" but "what does the user do next when it is wrong?"',
    'If the user cannot detect the error, the cost is high and the feature needs tight scoping or a human fallback. If the user can easily detect and correct it, the cost is low and you can ship with a lighter guardrail.',
    'The second question is: what is the user\'s alternative if the AI feature does not exist? If the alternative is nothing, the feature can be useful even at moderate accuracy. If the alternative is a human expert, the bar is higher.',
    'Only after those two questions do you ask about the use case and the data. Most candidates skip to the use case and miss the failure-mode framing that interviewers are waiting for.',
  ],
  q03: [
    'Reframe the disagreement: this is not a debate to adjudicate, it is a measurement gap to close. The question is not which model is better in the abstract but which model is better at this specific summarization task for this specific distribution of inputs.',
    'Define accuracy for this task. What does a correct summary look like? What are the failure modes: factual errors, omission of key points, tone mismatch? Write this down before running any eval.',
    'Propose a head-to-head eval on a representative sample of real production inputs. Score both models against the defined criteria. The data breaks the tie.',
    'Add cost to the decision only after quality is understood. If the smaller model scores within an acceptable range, the cost argument wins. If it does not, cost is the wrong variable to optimize.',
  ],
  q05: [
    'Challenge the benchmark before citing the number. Ask: who built the benchmark, what inputs does it cover, and are those inputs representative of what real users will send?',
    'Ask what the 8% failure looks like in terms of user harm. An 8% error rate on a recipe suggestion is very different from an 8% error rate on a medical or financial recommendation.',
    'Name the gap between benchmark performance and production performance: real user inputs are more varied, more adversarial, and often out-of-distribution relative to any benchmark you built.',
    'Propose a staged rollout with a real-world eval: ship to a small cohort, measure the error rate on production inputs, and compare it to the benchmark. The production number is the one that matters for the ship decision.',
  ],
  q06: [
    'Name the three categories of agent-specific risk before anything else: authorization (what is the agent allowed to do, and who approved that scope), reversibility (can the action be undone, and does the user know before it fires), and failure transparency (does the user know when the agent failed to act or acted incorrectly).',
    'Separate these from the general AI risks (accuracy, latency) that also apply. Interviewers are checking whether you know that agents are a different product category, not just a faster chatbot.',
    'Ask about the blast radius of a wrong action. An agent that drafts an email has a small blast radius. An agent that sends it has a large one. The spec should reflect that difference explicitly.',
    'Propose that the MVP is agentic in appearance but human-in-the-loop in practice: the agent stages the action and the user confirms. Earn trust through auditability before removing the human from the loop.',
  ],
  q08: [
    'Acknowledge that a disclaimer is necessary but not sufficient. The disclaimer is a legal floor, not a product decision.',
    'Ask what behavior the product is enabling. If the product is answering medical questions that require professional judgment, the disclaimer does not change the fact that users will act on the answers. The product decision is whether to answer those questions at all, and with what framing.',
    'Name the tradeoff explicitly: utility versus risk containment. More capability in this domain means more exposure when the model is wrong. Name what you are giving up if you restrict the feature.',
    'Propose a concrete product change alongside the disclaimer: scope the feature to information that is low-stakes if wrong, add a "talk to a professional" redirect for anything that requires professional judgment, and measure how often users get to that redirect.',
  ],
}
