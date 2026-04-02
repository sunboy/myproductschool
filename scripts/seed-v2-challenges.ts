/**
 * Seed script: 4 FLOW challenges covering 4 paradigms
 *
 * Run:
 *   npx tsx scripts/seed-v2-challenges.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { randomUUID } from 'crypto'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Challenge definitions ──────────────────────────────────────

const CHALLENGES = [
  {
    id: 'c1-notification-fatigue',
    title: 'Notification Fatigue: Fixing a B2B SaaS Drop-off',
    scenario_role: 'Product Lead',
    scenario_context: 'You lead product at a B2B project management tool. DAU/MAU has dropped from 72% to 58% over 6 weeks. The customer success team reports users saying "too many pings."',
    scenario_trigger: 'During a sprint review, an engineer points out that notification send volume has increased 3× since the new "activity digest" feature shipped.',
    scenario_question: 'How do you frame, diagnose, and fix the notification fatigue problem without breaking the engagement loop?',
    engineer_standout: 'A great engineer would notice that notification fatigue is a signal about information architecture, not just volume — and propose a relevance-scoring layer, not just a mute button.',
    paradigm: 'traditional',
    industry: 'B2B SaaS',
    sub_vertical: 'Project Management',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['strategic_thinking', 'cognitive_empathy'],
    secondary_competencies: ['motivation_theory'],
    frameworks: ['Jobs To Be Done', 'North Star Framework'],
    relevant_roles: ['swe', 'em', 'pm'],
    company_tags: ['Slack', 'Asana', 'Linear'],
    tags: ['notifications', 'engagement', 'b2b', 'retention'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What is the real problem here — is it volume, relevance, or something about user mental models?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the notification fatigue problem?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'cognitive_empathy'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Users are receiving too many notifications and need a global volume control', quality: 'surface', points: 1, competencies: ['strategic_thinking'], explanation: 'Volume control treats the symptom, not the cause — power users may want high volume if notifications are relevant.' },
              { option_label: 'B', option_text: 'Notifications lack relevance scoring — users are interrupted by low-signal events', quality: 'best', points: 3, competencies: ['strategic_thinking', 'cognitive_empathy'], explanation: 'Relevance is the root cause. Volume is a proxy metric; the underlying issue is signal-to-noise ratio.' },
              { option_label: 'C', option_text: 'The activity digest feature introduced a regression that duplicates notifications', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Possible but unconfirmed — the data shows volume increase, not duplication. Jumping to a bug conclusion skips problem framing.' },
              { option_label: 'D', option_text: 'B2B users prefer email over in-app notifications and the channel mix is wrong', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Channel preference is real but secondary — fixing the channel without fixing relevance still produces fatigue.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'Think about what signals you have access to, and what signals are missing.',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which diagnostic approach best identifies the root cause of the engagement drop?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Survey all users asking "are you receiving too many notifications?"', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'Self-reported surveys are noisy and leading. Users will say yes to any "too many" question.' },
              { option_label: 'B', option_text: 'Segment DAU/MAU by notification volume received; check if high-volume users churn faster', quality: 'best', points: 3, competencies: ['strategic_thinking'], explanation: 'Behavioral segmentation directly tests the hypothesis with observable data. It also surfaces whether volume is causal or correlational.' },
              { option_label: 'C', option_text: 'A/B test a 50% notification reduction to all users and measure DAU change', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Valid experiment design, but a blunt 50% cut doesn\'t tell you which notifications to remove — and may harm engaged users.' },
              { option_label: 'D', option_text: 'Audit the activity digest code to find duplicate event triggers', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Engineering audit answers the wrong question if the problem is relevance, not duplication.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'What are the hard trade-offs here between engagement and annoyance?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'You confirm that high-notification-volume users are churning 2× faster. What is the best solution?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 0.6,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Build a per-notification-type toggle UI so users can manually opt out of categories', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'User control is good but requires effort from users — most won\'t configure it, and it doesn\'t solve the underlying relevance problem.' },
              { option_label: 'B', option_text: 'Implement a relevance-scoring model that batches low-priority notifications into a daily digest', quality: 'best', points: 3, competencies: ['strategic_thinking', 'creative_execution'], explanation: 'Addresses root cause (relevance) while preserving engagement for high-signal events. Digest pattern is proven in Gmail, Slack.' },
              { option_label: 'C', option_text: 'Disable the activity digest feature and revert to pre-feature notification logic', quality: 'surface', points: 1, competencies: [], explanation: 'Reversion eliminates the problem but also eliminates the engagement value the digest was supposed to create.' },
              { option_label: 'D', option_text: 'Add a global "quiet hours" feature with a 9am–5pm work window default', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Quiet hours solves timing, not relevance. B2B users churn due to noise, not timing.' },
            ],
          },
          {
            question_text: 'What metric should you use as the primary success indicator for the fix?',
            question_nudge: null,
            sequence: 2,
            grading_weight_within_step: 0.4,
            target_competencies: ['strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Notification open rate', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Open rate is a proxy — it can increase while overall engagement decreases if you simply send fewer but more clickbait notifications.' },
              { option_label: 'B', option_text: 'DAU/MAU recovery to ≥70% within 60 days', quality: 'best', points: 3, competencies: ['strategic_thinking'], explanation: 'DAU/MAU is the north star metric that was declining. Recovery here confirms the fix addressed the root cause, not just a symptom.' },
              { option_label: 'C', option_text: 'Reduction in notification volume sent per user per day', quality: 'surface', points: 1, competencies: [], explanation: 'Volume sent is an output metric of your fix, not a success indicator — you could hit this by accident.' },
              { option_label: 'D', option_text: 'NPS score improvement across the user base', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'NPS is too slow and noisy to measure a specific feature fix. Takes months to shift and conflates many signals.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you communicate this to stakeholders and prevent regression?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'How do you communicate the fix and prevent the same problem recurring?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'motivation_theory'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Write a one-pager: problem recap, root cause, fix shipped, 30-day outcome projection, plus a regression alert on the same funnel', quality: 'best', points: 3, competencies: ['creative_execution', 'motivation_theory'], explanation: 'Closes the loop end-to-end — diagnosis, fix, safeguard — in a single shareable artifact.' },
              { option_label: 'B', option_text: 'Post a Slack update with what changed and why, then schedule a 30-day metric review', quality: 'good_but_incomplete', points: 2, competencies: ['creative_execution'], explanation: 'Good communication but no regression safeguard or durable artifact.' },
              { option_label: 'C', option_text: 'Present results at the next sprint review and close the ticket', quality: 'surface', points: 1, competencies: [], explanation: 'Passive — waits for the next ceremony and does nothing to prevent the problem recurring.' },
              { option_label: 'D', option_text: 'File a doc ticket so future engineers know what was changed', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Documentation without stakeholder communication or monitoring is insufficient.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'c2-ai-feature-trust',
    title: 'AI Feature Trust: When Users Don\'t Believe the Model',
    scenario_role: 'Senior PM, AI Products',
    scenario_context: 'You work on an AI-powered hiring tool. The model suggests candidate rankings. Adoption of the AI ranking is at 22% — far below the 60% target. User research shows recruiters say "I don\'t trust it."',
    scenario_trigger: 'An enterprise client escalates: their head of talent says the AI ranked a clearly unqualified candidate #1 for a senior role, which the recruiter had to manually override. The client is threatening to churn.',
    scenario_question: 'How do you frame the trust problem, diagnose its root cause, and design an intervention that improves adoption without compromising quality?',
    engineer_standout: 'A strong engineer-turned-PM would connect this to model explainability, confidence calibration, and the difference between algorithmic aversion and legitimate model failure.',
    paradigm: 'ai_assisted',
    industry: 'HRTech',
    sub_vertical: 'Recruiting',
    difficulty: 'advanced',
    estimated_minutes: 25,
    primary_competencies: ['cognitive_empathy', 'strategic_thinking'],
    secondary_competencies: ['taste', 'domain_expertise'],
    frameworks: ['Trust Calibration', 'Human-in-the-Loop Design'],
    relevant_roles: ['ml_eng', 'pm', 'swe'],
    company_tags: ['Workday', 'Greenhouse', 'Lever'],
    tags: ['ai-trust', 'adoption', 'ml', 'hrtech', 'explainability'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'Is this a model quality problem, a communication problem, or a human psychology problem?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the low AI adoption problem?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['cognitive_empathy', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Recruiters have algorithmic aversion — a known psychological bias against AI recommendations', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Algorithmic aversion is real but doesn\'t explain the escalation — the model may have a genuine quality gap in edge cases.' },
              { option_label: 'B', option_text: 'The model may be underperforming on specific segments (e.g. senior roles), and recruiters have correctly identified this', quality: 'best', points: 3, competencies: ['strategic_thinking', 'cognitive_empathy'], explanation: 'Treating recruiter distrust as potentially correct is the right starting posture. The escalation is a data point, not just a perception problem.' },
              { option_label: 'C', option_text: 'The AI ranking UI is poorly designed and lacks explanations, causing mistrust', quality: 'surface', points: 1, competencies: ['taste'], explanation: 'UI explainability is a likely contributing factor, but diagnosing it as the root cause before checking model performance is premature.' },
              { option_label: 'D', option_text: 'The sales team over-promised AI capabilities during the enterprise pitch', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Even if true, this doesn\'t help you fix the adoption problem — and scapegoating sales doesn\'t solve model calibration.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What data would tell you whether this is a model problem, a UX problem, or both?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which investigation approach best distinguishes model failure from perception failure?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Measure override rate by role level and compare model predictions to hire outcomes 6 months later', quality: 'best', points: 3, competencies: ['strategic_thinking'], explanation: 'Outcome-based evaluation is the gold standard for model quality. Override rate by segment identifies where the model underperforms.' },
              { option_label: 'B', option_text: 'Run a user survey asking recruiters to rate their trust in the AI on a 1–10 scale', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'Surveys measure perception, not model quality. You need both, but perception data alone won\'t tell you if the model is actually wrong.' },
              { option_label: 'C', option_text: 'Audit the training data for demographic bias that may explain ranking anomalies', quality: 'good_but_incomplete', points: 2, competencies: ['domain_expertise'], explanation: 'Bias audit is important and relevant but doesn\'t directly answer the adoption question. It\'s a necessary parallel track, not the primary diagnostic.' },
              { option_label: 'D', option_text: 'A/B test adding explanation text to AI rankings and measure adoption lift', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Running a fix experiment before diagnosing the problem conflates cause and effect. Adoption may not improve if the model is genuinely miscalibrated.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'How do you improve trust without creating a false sense of confidence in a flawed model?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'Data confirms: model performs well on mid-level roles (85% precision) but poorly on senior roles (54%). What is the right product intervention?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 0.7,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'modified_option',
            options: [
              { option_label: 'A', option_text: 'Disable AI ranking for senior roles until model performance improves', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Safe and honest, but disabling the feature doesn\'t improve the model and may be hard to reverse once turned off.' },
              { option_label: 'B', option_text: 'Show confidence scores alongside rankings — "High confidence" for mid-level, "Exploratory suggestion" for senior', quality: 'best', points: 3, competencies: ['strategic_thinking', 'creative_execution', 'taste'], explanation: 'Calibrated confidence communication maintains utility while accurately representing model limitations. This is the human-in-the-loop design pattern.' },
              { option_label: 'C', option_text: 'Retrain the model on senior role data before changing the product UI', quality: 'surface', points: 1, competencies: ['domain_expertise'], explanation: 'Retraining is the right long-term fix but has a 3–6 month horizon. You still need to manage recruiter trust and client risk in the meantime.' },
              { option_label: 'D', option_text: 'Add a "Why this candidate?" explainability panel to all rankings regardless of role level', quality: 'plausible_wrong', points: 0, competencies: ['taste'], explanation: 'Explainability helps with perception but may increase trust in an inaccurate senior-role prediction, worsening the outcome.' },
            ],
          },
          {
            question_text: 'How do you address the churning enterprise client specifically?',
            question_nudge: null,
            sequence: 2,
            grading_weight_within_step: 0.3,
            target_competencies: ['cognitive_empathy', 'motivation_theory'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Offer a discount and apologize for the AI\'s poor performance', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Discounts address commercial risk but don\'t fix the trust problem. The client needs a credible technical fix, not a price reduction.' },
              { option_label: 'B', option_text: 'Acknowledge the model limitation, share the diagnostic data, and commit to a 90-day improvement plan with senior-role confidence labels shipped in 2 weeks', quality: 'best', points: 3, competencies: ['cognitive_empathy', 'motivation_theory'], explanation: 'Transparency + specific timeline + near-term product fix demonstrates accountability without over-promising. This is enterprise trust repair.' },
              { option_label: 'C', option_text: 'Assign a dedicated CSM to manually review senior-role rankings before showing them to the client', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Human review buys time but doesn\'t scale and sets a precedent that\'s hard to walk back.' },
              { option_label: 'D', option_text: 'Suggest the client use the AI only for sourcing, not ranking, while you rebuild the senior model', quality: 'surface', points: 1, competencies: [], explanation: 'Scoping down the use case is a reasonable short-term move but needs to be paired with a clear upgrade path.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you turn this into a repeatable process so AI quality issues are caught before clients report them?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'Design a quality monitoring system that would have caught this issue before the client escalation.',
            question_nudge: 'Think about what signals are observable, what thresholds trigger review, and who owns the process.',
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Automated evals on a held-out set of senior roles weekly; alert PM if ranking disagreement rate exceeds 15%; CSM reviews flagged cases before they surface to clients', quality: 'best', points: 3, competencies: ['creative_execution', 'domain_expertise'], explanation: 'Combines automated signal, clear threshold, human review gate, and role ownership — a complete monitoring loop.' },
              { option_label: 'B', option_text: 'Add a "confidence score" to each ranking and flag low-confidence results for manual review', quality: 'good_but_incomplete', points: 2, competencies: ['domain_expertise'], explanation: 'Confidence signals help but lack the automated threshold logic and ownership to turn observations into action.' },
              { option_label: 'C', option_text: 'Review customer support tickets monthly for ranking complaints', quality: 'surface', points: 1, competencies: [], explanation: 'Reactive — waits for clients to escalate before catching quality issues. Monthly cadence is too slow.' },
              { option_label: 'D', option_text: 'Ask recruiters to rate every AI ranking so the model can retrain on feedback', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Feedback loops improve future quality but don\'t catch issues before they reach clients today.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'c3-agent-reliability',
    title: 'AI Agent Reliability: When Your Agent Breaks Production',
    scenario_role: 'Staff Engineer, AI Platform',
    scenario_context: 'You are Staff Eng at a company that ships an AI agent for customer support automation. The agent handles 40% of Tier-1 tickets autonomously. Last week, the agent started giving incorrect refund amounts due to a pricing change that wasn\'t reflected in its context.',
    scenario_trigger: 'Customer reports of wrong refunds spike. Finance flags $18k in over-refunded amounts in 72 hours. The support director wants to shut the agent down completely.',
    scenario_question: 'How do you frame the reliability problem, diagnose the failure mode, and design a more resilient system — without losing the 40% automation value?',
    engineer_standout: 'A great engineer would identify that this is a context freshness problem, not an agent reasoning problem, and propose eval-driven guardrails rather than human-in-the-loop for every action.',
    paradigm: 'agentic',
    industry: 'E-commerce',
    sub_vertical: 'Customer Support',
    difficulty: 'advanced',
    estimated_minutes: 25,
    primary_competencies: ['domain_expertise', 'strategic_thinking'],
    secondary_competencies: ['creative_execution', 'cognitive_empathy'],
    frameworks: ['Failure Mode Analysis', 'Eval-Driven Development'],
    relevant_roles: ['swe', 'ml_eng', 'tech_lead', 'founding_eng'],
    company_tags: ['Shopify', 'Intercom', 'Zendesk'],
    tags: ['ai-agents', 'reliability', 'evals', 'automation', 'production'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What type of failure is this — model reasoning, context staleness, or system design?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate failure mode classification for the wrong-refund incident?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['domain_expertise', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'The LLM hallucinated pricing data — a fundamental model reliability issue', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Hallucination would produce random amounts. The pattern of wrong amounts suggests a stale but internally consistent source, not fabrication.' },
              { option_label: 'B', option_text: 'The agent\'s context (pricing table or retrieval source) wasn\'t updated when pricing changed — a data freshness failure', quality: 'best', points: 3, competencies: ['domain_expertise', 'strategic_thinking'], explanation: 'Context staleness is the most parsimonious explanation. The agent reasoned correctly from stale facts — the failure is in the knowledge pipeline, not the model.' },
              { option_label: 'C', option_text: 'The agent lacked a human approval step for financial actions above a threshold', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'True, and an important design gap — but this is a mitigation framing, not a root cause framing. The root cause is the data pipeline failure.' },
              { option_label: 'D', option_text: 'The pricing change wasn\'t communicated to the support director, creating an organizational process gap', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'Process gap is a contributing factor but doesn\'t explain the technical failure or inform the system fix.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'Map out all the places in the agent system where pricing information could become stale.',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which of the following is the most comprehensive list of staleness risk points in a typical RAG-backed support agent?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'The vector database index and the system prompt', quality: 'good_but_incomplete', points: 2, competencies: ['domain_expertise'], explanation: 'Correct but incomplete — tool call responses and fine-tuned model weights are also staleness risks, especially for pricing.' },
              { option_label: 'B', option_text: 'Vector DB index, system prompt, any fine-tuned model weights, and cached tool call responses', quality: 'best', points: 3, competencies: ['domain_expertise'], explanation: 'All four are real staleness vectors in production agent systems. Missing any one of them creates a blind spot in freshness monitoring.' },
              { option_label: 'C', option_text: 'Only the system prompt, since that\'s where policy and pricing rules are defined', quality: 'surface', points: 1, competencies: [], explanation: 'Pricing in the system prompt is one source, but RAG retrieval and fine-tuning are equally important. Narrow framing.' },
              { option_label: 'D', option_text: 'The model itself, since it was trained on historical pricing data', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Base model training data rarely contains current pricing. This conflates base model knowledge with RAG retrieval — different systems.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'How do you prevent this class of failure without reverting to 100% human handling?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'What system design change best prevents future context-staleness failures for financial actions?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 0.6,
            target_competencies: ['creative_execution', 'domain_expertise'],
            response_type: 'modified_option',
            options: [
              { option_label: 'A', option_text: 'Require human approval for all agent-initiated refunds above $0', quality: 'surface', points: 1, competencies: [], explanation: 'Eliminates the risk but also eliminates the 40% automation value. This is a complete regression, not a fix.' },
              { option_label: 'B', option_text: 'Implement a pricing freshness check: agent must call a live pricing API before any refund calculation, and fail-safe to human queue if the API is unreachable', quality: 'best', points: 3, competencies: ['creative_execution', 'domain_expertise'], explanation: 'Live source-of-truth lookup eliminates the staleness class of failure. Fail-safe to human queue handles the fallback gracefully without over-automating.' },
              { option_label: 'C', option_text: 'Add an eval suite that checks refund amounts against current pricing before each deployment', quality: 'good_but_incomplete', points: 2, competencies: ['domain_expertise'], explanation: 'Evals catch regressions at deploy time, not during a mid-sprint pricing change. Important but not sufficient for dynamic data like pricing.' },
              { option_label: 'D', option_text: 'Re-index the vector database daily to pick up pricing changes', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Daily re-index has a 0–24h window where stale data is live. Pricing can change intraday. This doesn\'t provide the freshness guarantee needed for financial actions.' },
            ],
          },
          {
            question_text: 'How do you respond to the support director who wants to shut the agent down?',
            question_nudge: null,
            sequence: 2,
            grading_weight_within_step: 0.4,
            target_competencies: ['cognitive_empathy', 'motivation_theory'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Agree to shut it down and offer a 2-week timeline to rebuild with human-in-the-loop for all financial actions', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'Agrees too quickly and over-corrects. You\'re giving up 40% automation value to fix a scoped problem.' },
              { option_label: 'B', option_text: 'Propose an immediate partial rollback: disable only refund actions while preserving the 70% of non-financial ticket automation, with a 48-hour fix timeline for the pricing API integration', quality: 'best', points: 3, competencies: ['cognitive_empathy', 'motivation_theory'], explanation: 'Scoped rollback preserves most automation value, directly addresses the risk, and gives a credible timeline. Shows you understand the actual failure scope.' },
              { option_label: 'C', option_text: 'Ask for 24 hours to investigate before making any changes', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Investigation is prudent, but 24 hours of additional exposure with $6k/day loss rate is hard to justify. Action must accompany investigation.' },
              { option_label: 'D', option_text: 'Point out that $18k is small relative to the cost savings from 40% automation and advocate to keep the agent running', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Dismissing financial loss to protect automation sets the wrong organizational tone. The support director\'s concern is legitimate.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'What does a mature eval-driven deployment process look like for a system that takes financial actions?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'Design an eval framework that would catch context-staleness failures before they reach production.',
            question_nudge: 'Think about what inputs you\'d test, what the oracle is, and how often you\'d run evals.',
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Run evals on every deploy: seed the vector store with a known stale price, verify the agent catches it and fails-safe to human queue; plus a nightly smoke test against live pricing API', quality: 'best', points: 3, competencies: ['creative_execution', 'domain_expertise'], explanation: 'Tests both the detection path and the fallback path; runs at deploy cadence and nightly for mid-sprint price changes.' },
              { option_label: 'B', option_text: 'Maintain a golden dataset of 50 support scenarios and assert correct refund amounts on every deploy', quality: 'good_but_incomplete', points: 2, competencies: ['domain_expertise'], explanation: 'Good regression coverage but golden dataset goes stale as prices change — doesn\'t test freshness of the live data path.' },
              { option_label: 'C', option_text: 'Log all agent refund decisions and review a sample weekly for correctness', quality: 'surface', points: 1, competencies: [], explanation: 'Post-hoc review catches problems after they\'ve already affected customers. Not a pre-production gate.' },
              { option_label: 'D', option_text: 'Require product sign-off on agent outputs before each release', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Manual sign-off doesn\'t scale and can\'t realistically test dynamic data like pricing at deploy time.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'c4-ai-native-pricing',
    title: 'AI-Native Pricing: Monetizing a Conversational Product',
    scenario_role: 'Co-founder / Head of Product',
    scenario_context: 'You are building an AI-native legal assistant — users interact entirely through conversation, no forms or dashboards. The product generates a draft contract in 30 seconds that would take a lawyer 4 hours. You have 2,000 beta users and 18% conversion to paid.',
    scenario_trigger: 'Your seed investor asks: "How do you price this without teaching users to anchor to hourly lawyer rates, and without leaving money on the table on complex use cases?"',
    scenario_question: 'Design a pricing model that captures value from AI-native interaction patterns, accounts for variance in task complexity, and doesn\'t create a free-tier churn loop.',
    engineer_standout: 'A strong founding engineer would connect this to metered API cost structures, understand the difference between value-based and usage-based pricing, and anticipate how LLM token cost curves change pricing math over time.',
    paradigm: 'ai_native',
    industry: 'LegalTech',
    sub_vertical: 'Contract Automation',
    difficulty: 'staff_plus',
    estimated_minutes: 30,
    primary_competencies: ['strategic_thinking', 'motivation_theory'],
    secondary_competencies: ['taste', 'domain_expertise'],
    frameworks: ['Value-Based Pricing', 'Jobs To Be Done', 'Freemium Design'],
    relevant_roles: ['founding_eng', 'pm', 'em'],
    company_tags: ['Harvey', 'Clio', 'Ironclad'],
    tags: ['pricing', 'ai-native', 'legaltech', 'monetization', 'founding'],
    is_published: true,
    is_calibration: false,
    is_premium: true,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What is the unit of value in an AI-native product — time saved, decisions made, or outcomes achieved?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most defensible unit of value to price against for an AI legal assistant?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'motivation_theory'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Time saved — price as a fraction of equivalent lawyer hourly rate', quality: 'good_but_incomplete', points: 2, competencies: ['motivation_theory'], explanation: 'Time-saved pricing is intuitive but anchors you to a market that will deflate as lawyers adopt AI too. Structurally fragile.' },
              { option_label: 'B', option_text: 'Outcome value — price based on the contract value or deal size the document enables', quality: 'best', points: 3, competencies: ['strategic_thinking', 'motivation_theory'], explanation: 'Outcome-based pricing captures the value of the decision, not the cost of creation. Scales with user success and is defensible as AI cost curves drop.' },
              { option_label: 'C', option_text: 'Usage volume — price per document generated or per conversation turn', quality: 'surface', points: 1, competencies: ['strategic_thinking'], explanation: 'Usage-based pricing creates a free-tier churn loop for low-volume users and doesn\'t capture value for high-stakes, low-volume use cases.' },
              { option_label: 'D', option_text: 'Seat-based SaaS — monthly per-user subscription regardless of usage', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Seat pricing works for horizontal tools but penalizes occasional high-value users (startup closing a Series A) while subsidizing high-volume low-value users.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What are all the distinct user segments, and what does each care about most?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which segmentation approach best maps to different willingness-to-pay for a legal AI tool?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'cognitive_empathy'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Company size: freelancer vs. SMB vs. enterprise', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Company size is a reasonable proxy but doesn\'t capture the key axis: contract complexity and legal risk exposure.' },
              { option_label: 'B', option_text: 'Use case risk: low-stakes templates (NDAs, service agreements) vs. high-stakes bespoke contracts (M&A, fundraising)', quality: 'best', points: 3, competencies: ['strategic_thinking', 'cognitive_empathy'], explanation: 'Risk-based segmentation directly maps to willingness to pay — a startup closing a $5M round will pay far more than someone generating an NDA.' },
              { option_label: 'C', option_text: 'User role: founders vs. legal teams vs. operations', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'Role matters for product design but isn\'t the best WTP proxy — a founder with complex legal needs pays more than a legal team with routine contracts.' },
              { option_label: 'D', option_text: 'Geography: US market vs. international, given different legal systems', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Geography is a pricing constraint (jurisdiction, compliance) not a WTP segmentation. Don\'t confuse market access with value capture.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'Design the actual pricing structure — tiers, limits, and the free-to-paid conversion mechanism.',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'Which pricing structure best balances free-tier growth, conversion, and value capture?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 0.6,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'modified_option',
            options: [
              { option_label: 'A', option_text: 'Free: 3 documents/month. Pro $29/mo: unlimited documents', quality: 'surface', points: 1, competencies: ['motivation_theory'], explanation: 'Volume-gated free tier creates churn loops — power users who need 4 documents hit the wall exactly when engaged. Doesn\'t capture value on high-stakes docs.' },
              { option_label: 'B', option_text: 'Free: unlimited NDAs/service agreements. Pro $49/mo: complex contracts (equity, fundraising, IP). Enterprise: custom', quality: 'best', points: 3, competencies: ['strategic_thinking', 'creative_execution', 'motivation_theory'], explanation: 'Complexity-gated model: free tier builds habit and trust on commodity documents; paid captures when stakes (and WTP) are highest. Avoids free-tier churn.' },
              { option_label: 'C', option_text: 'Pay-per-document: $5 for standard, $50 for complex. No subscription.', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Transactional pricing captures value well but creates purchase friction and prevents recurring revenue. Hard to build a sustainable business on.' },
              { option_label: 'D', option_text: 'Percentage of deal value: 0.1% of contract value for transactions over $100k', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Sounds like outcome-based pricing but creates enormous friction — users must disclose deal size, and high-value deals may go to lawyers to avoid the fee.' },
            ],
          },
          {
            question_text: 'How does this pricing model need to evolve as LLM inference costs fall 10× over the next 3 years?',
            question_nudge: null,
            sequence: 2,
            grading_weight_within_step: 0.4,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Lower prices proportionally as costs fall to stay competitive', quality: 'surface', points: 1, competencies: ['strategic_thinking'], explanation: 'Competing on cost is a race to the bottom. As inference costs fall, value capture should increase, not decrease.' },
              { option_label: 'B', option_text: 'Hold pricing and reinvest margin into network effects (case precedent databases, clause libraries) that create defensibility independent of model cost', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Infrastructure moat strategy: use falling model costs to expand margin and invest in data assets that differentiate you as models commoditize.' },
              { option_label: 'C', option_text: 'Shift from subscription to usage-based as cost-per-query drops below $0.01', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Usage-based has merit as cost falls, but loses the predictable revenue that investors and team planning require. A hybrid model is more likely.' },
              { option_label: 'D', option_text: 'Expand the free tier to include complex contracts as inference costs fall', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Giving away complex contracts defeats the value-capture logic of the tiered model. Don\'t conflate cost reduction with willingness to pay reduction.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you pitch this pricing model to your seed investor and to early users simultaneously?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'Write the investor narrative for why this pricing model is defensible at Series A scale.',
            question_nudge: 'Address: unit economics, how moats compound over time, and why this model survives model commoditization.',
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['motivation_theory', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'The moat is data network effects: every contract we process improves clause extraction, which raises switching costs. As model inference commoditizes, we shift margin to the proprietary dataset and workflow integrations that competitors can\'t replicate.', quality: 'best', points: 3, competencies: ['motivation_theory', 'creative_execution'], explanation: 'Names the specific moat, explains how it compounds, and pre-empts the commoditization objection — all three investor concerns addressed.' },
              { option_label: 'B', option_text: 'Unit economics are strong: $200 CAC, $1,200 LTV at current churn. Gross margins expand as inference cost falls, and the usage-based tier captures upside from power users.', quality: 'good_but_incomplete', points: 2, competencies: ['motivation_theory'], explanation: 'Solid unit economics narrative but doesn\'t address defensibility or what prevents a well-funded competitor from copying the model.' },
              { option_label: 'C', option_text: 'The market is huge — $400B legal services — and we\'re taking share from expensive hourly billing with a 30-second alternative.', quality: 'surface', points: 1, competencies: [], explanation: 'TAM framing is expected but doesn\'t answer the defensibility question. Every Series A pitch includes a big market claim.' },
              { option_label: 'D', option_text: 'We\'ll expand the free tier as inference costs fall to drive word-of-mouth and convert at higher volumes.', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Giving away more as costs fall reduces NRR and signals to investors that the pricing model isn\'t durable.' },
            ],
          },
        ],
      },
    ],
  },
] as const

// ── Insertion logic ────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding v2 FLOW challenges...\n')

  for (const c of CHALLENGES) {
    console.log(`  → ${c.title}`)

    // Upsert challenge
    const { error: challengeErr } = await supabase
      .from('challenges')
      .upsert({
        id: c.id,
        title: c.title,
        scenario_role: c.scenario_role,
        scenario_context: c.scenario_context,
        scenario_trigger: c.scenario_trigger,
        scenario_question: c.scenario_question,
        engineer_standout: c.engineer_standout,
        paradigm: c.paradigm,
        industry: c.industry,
        sub_vertical: c.sub_vertical,
        difficulty: c.difficulty,
        estimated_minutes: c.estimated_minutes,
        primary_competencies: c.primary_competencies,
        secondary_competencies: c.secondary_competencies,
        frameworks: c.frameworks,
        relevant_roles: c.relevant_roles,
        company_tags: c.company_tags,
        tags: c.tags,
        is_published: c.is_published,
        is_calibration: c.is_calibration,
        is_premium: c.is_premium,
      }, { onConflict: 'id' })

    if (challengeErr) {
      console.error(`    ✗ challenge: ${challengeErr.message}`)
      continue
    }

    for (const s of c.steps) {
      // Upsert flow step
      const { data: stepRow, error: stepErr } = await supabase
        .from('flow_steps')
        .upsert({
          challenge_id: c.id,
          step: s.step,
          step_nudge: s.step_nudge,
          grading_weight: s.grading_weight,
          step_order: s.step_order,
        }, { onConflict: 'challenge_id,step' })
        .select('id')
        .single()

      if (stepErr || !stepRow) {
        console.error(`    ✗ step ${s.step}: ${stepErr?.message}`)
        continue
      }

      for (const q of s.questions) {
        // Upsert question
        const { data: qRow, error: qErr } = await supabase
          .from('step_questions')
          .upsert({
            flow_step_id: stepRow.id,
            question_text: q.question_text,
            question_nudge: q.question_nudge,
            sequence: q.sequence,
            grading_weight_within_step: q.grading_weight_within_step,
            target_competencies: q.target_competencies,
            response_type: q.response_type,
          }, { onConflict: 'flow_step_id,sequence' })
          .select('id')
          .single()

        if (qErr || !qRow) {
          console.error(`    ✗ question seq ${q.sequence}: ${qErr?.message}`)
          continue
        }

        // Only insert options for non-freeform questions
        if (q.options.length > 0) {
          // Delete existing options for this question then re-insert (idempotent)
          await supabase.from('flow_options').delete().eq('question_id', qRow.id)
          for (const opt of q.options) {
            const { error: optErr } = await supabase
              .from('flow_options')
              .insert({
                id: randomUUID(),
                question_id: qRow.id,
                option_label: opt.option_label,
                option_text: opt.option_text,
                quality: opt.quality,
                points: opt.points,
                competencies: opt.competencies,
                explanation: opt.explanation,
              })

            if (optErr) {
              console.error(`    ✗ option ${opt.option_label}: ${optErr.message}`)
            }
          }
        }
      }
    }

    console.log(`  ✓ ${c.id}`)
  }

  console.log('\n✅ Seed complete.')
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
