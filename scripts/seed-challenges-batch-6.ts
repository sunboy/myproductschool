/**
 * Seed script: 8 FLOW challenges — Apple & LinkedIn PM interview questions (batch 6)
 *
 * Run:
 *   npx tsx scripts/seed-challenges-batch-6.ts
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

export const CHALLENGES = [
  // ── Apple ──────────────────────────────────────────────────────
  {
    id: 'pm-apple-003',
    title: 'AirPods Pro: Designing for Accessibility',
    scenario_role: 'Product engineer, Sensing & Audio Hardware',
    scenario_context: 'The AirPods Pro hardware team is planning the next feature release cycle. Accessibility features have historically been afterthoughts shipped as software patches, not hardware design inputs. The disability community represents a meaningful but poorly-served segment of AirPods users.',
    scenario_trigger: 'A product review session surfaces that Conversation Awareness was praised in reviews but rated poorly by users with hearing aids and auditory processing differences — the exact segment that benefits most from directional audio.',
    scenario_question: 'What accessibility feature would most expand AirPods Pro value for underserved users, and how do you validate it without building the wrong thing?',
    engineer_standout: 'A strong engineer would recognize that most impactful accessibility wins come from exposing existing H2 chip capabilities (spatial audio, Adaptive Transparency processing, motion detection) to new use cases rather than adding new hardware.',
    paradigm: 'traditional',
    industry: 'Consumer Electronics',
    sub_vertical: 'Wearables',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['cognitive_empathy', 'creative_execution'],
    secondary_competencies: ['domain_expertise'],
    frameworks: ['Jobs To Be Done', 'Inclusive Design'],
    relevant_roles: ['swe', 'pm', 'tech_lead'],
    company_tags: ['Apple'],
    tags: ['accessibility', 'hardware', 'audio', 'wearables', 'apple'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'Who is underserved within the AirPods user base, and what specifically fails them today?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the accessibility gap in AirPods Pro?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['cognitive_empathy', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'AirPods need larger physical controls so users with motor impairments can operate them', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'Motor impairment is a real segment but force-touch controls are a downstream symptom. The deeper gap is that audio processing modes were not designed with hearing differences in mind.' },
              { option_label: 'B', option_text: 'Adaptive Transparency and Conversation Awareness were tuned for typical hearing — users with hearing aids, auditory processing disorders, or cochlear implants experience degraded or conflicting audio behavior', quality: 'best', points: 3, competencies: ['cognitive_empathy', 'domain_expertise'], explanation: 'The H2 chip processes audio in ways that assume normotypical hearing. Users with hearing aids get double-processing artifacts; users with auditory processing disorders get overwhelmed by Conversation Awareness. This is the root gap.' },
              { option_label: 'C', option_text: 'There are no accessibility features in AirPods and Apple needs to start from scratch', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Factually wrong. Live Listen, Conversation Awareness, and Adaptive Transparency are all accessibility-adjacent. The problem is that they conflict with each other for specific disability profiles, not that they are absent.' },
              { option_label: 'D', option_text: 'AirPods lack a companion app that lets accessibility users customize sound profiles', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Custom sound profiles via the Health app already exist. The gap is that the real-time audio processing pipeline ignores disability-specific interaction patterns, not missing UI.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What distinct accessibility use cases exist, and which ones does existing hardware actually support?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which proposed accessibility feature has the highest impact-to-implementation ratio given AirPods Pro existing H2 chip capabilities?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['domain_expertise', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Add bone conduction support via a new hardware element in a future AirPods version', quality: 'surface', points: 1, competencies: ['domain_expertise'], explanation: 'Bone conduction requires new hardware and a 2-3 year product cycle. High impact but extremely low implementation ratio given existing hardware.' },
              { option_label: 'B', option_text: 'Build a hearing-aid compatibility mode that disables H2 processing when an MFi hearing aid is paired, preventing double-processing artifacts', quality: 'best', points: 3, competencies: ['domain_expertise', 'creative_execution'], explanation: 'MFi hearing aid pairing is already detectable via Bluetooth. Selectively disabling H2 audio processing for that paired state is a firmware change, not hardware. High impact for a real segment with near-zero hardware cost.' },
              { option_label: 'C', option_text: 'Create haptic alerts for doorbells and smoke alarms for users with hearing loss', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Haptic alerts use the existing motion sensor and are achievable, but require sound classification improvements and do not address the core Adaptive Transparency conflict for hearing aid users.' },
              { option_label: 'D', option_text: 'Add sign language detection using the accelerometer so AirPods auto-pause when the user is signing', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Sign language detection via wrist accelerometer is not feasible with current sensors. The motion patterns are too complex and the sensor is in-ear, not on wrist.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'How do you validate the feature with actual users without shipping bad hardware?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'How do you validate the hearing-aid compatibility mode before it ships in a firmware update?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['cognitive_empathy', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Launch a public beta and measure rating changes in App Store reviews from users who mention hearing aids', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'App Store reviews are noisy and the signal from a small accessibility segment would be buried in general sentiment.' },
              { option_label: 'B', option_text: 'Partner with audiologists and MFi hearing aid manufacturers to run structured listening tests with 50-100 users across hearing profiles, using MUSHRA audio quality assessment', quality: 'best', points: 3, competencies: ['cognitive_empathy', 'creative_execution'], explanation: 'MUSHRA (Multiple Stimuli with Hidden Reference and Anchor) is the standard for audio quality research. Audiologist partners give access to the exact user segment and clinical measurement rigor that consumer research cannot match.' },
              { option_label: 'C', option_text: 'Use Apple TestFlight beta with 1,000 users and measure session length as a proxy for satisfaction', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'TestFlight scales coverage but session length is a poor proxy for audio quality. You need qualitative feedback from users with the specific hearing profile the feature targets.' },
              { option_label: 'D', option_text: 'Run an A/B test: enable the mode for half of iOS users with paired hearing aids and measure support tickets', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Shipping an untested audio processing change A/B-style risks causing harm to users with hearing aids. Support tickets are too lagging to catch real-time audio quality regressions.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you define success for an accessibility feature that serves a small but meaningful user segment?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the right primary success metric for the hearing-aid compatibility mode?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Number of users who enable the mode within 30 days of the firmware update', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Adoption rate matters but conflates discovery with satisfaction. A user can enable the mode and still have a poor experience.' },
              { option_label: 'B', option_text: 'Mode retention rate at 90 days: users who enabled it and kept it on rather than reverting to default, paired with an audiologist-led NPS cohort', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Retention tells you the mode actually improved the experience. Reverting to default is a strong signal of failure. Audiologist NPS adds clinical validity that aggregate metrics miss for a small segment.' },
              { option_label: 'C', option_text: 'Number of accessibility-related support tickets that decline after the firmware update', quality: 'surface', points: 1, competencies: [], explanation: 'Ticket reduction is lagging and indirect. Many accessibility issues go unreported because users blame themselves, not the product.' },
              { option_label: 'D', option_text: 'Press coverage of the feature in disability advocacy publications and WWDC reception', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'PR coverage is a vanity metric for an accessibility feature. Good press does not mean the feature works.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-apple-004',
    title: 'App Store: Improving the Parental Experience',
    scenario_role: 'Product engineer, App Store Platform',
    scenario_context: 'The App Store serves over 650 million visitors per week across all ages. Parents managing app purchases and screen time for their children face a fragmented experience split across Screen Time settings, Family Sharing, and the App Store itself. The current flow requires navigating three separate apps to approve a single request.',
    scenario_trigger: 'Customer feedback analysis surfaces that 34% of App Store one-star reviews from identified parent accounts mention confusion around purchase approvals, age ratings, and how to block specific apps their child already owns.',
    scenario_question: 'How would you improve the App Store experience specifically for parents managing their family devices?',
    engineer_standout: 'A strong engineer would recognize that the fragmentation is architectural — parental controls live in three separate system surfaces — and frame the improvement as an API consolidation problem, not a UI reskin.',
    paradigm: 'traditional',
    industry: 'Consumer Software',
    sub_vertical: 'App Platforms',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['cognitive_empathy', 'strategic_thinking'],
    secondary_competencies: ['creative_execution'],
    frameworks: ['Jobs To Be Done', 'Service Design'],
    relevant_roles: ['swe', 'pm', 'tech_lead'],
    company_tags: ['Apple'],
    tags: ['app-store', 'parental-controls', 'family', 'apple', 'ux'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What is the parent actual job-to-be-done in the App Store, and where does the current experience fail it?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the App Store failure for parents?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['cognitive_empathy', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Parents need better parental control features that are easier to find in Settings', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'More controls is a solution assumption, not a framing. Parents stated problem is navigation and confusion, not feature absence.' },
              { option_label: 'B', option_text: 'The App Store treats parents as individual consumers when their primary job is managing a family unit — the product is architected around the wrong user model', quality: 'best', points: 3, competencies: ['cognitive_empathy', 'strategic_thinking'], explanation: 'The root problem is that App Store, Screen Time, and Family Sharing are three separate systems with no unified family context. Any surface-level fix fails unless the underlying user model is corrected.' },
              { option_label: 'C', option_text: 'Age ratings in the App Store are not prominently displayed, so parents cannot assess app suitability quickly', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Age rating visibility is a real problem but it is one symptom of the larger fragmentation. Fixing ratings display does not help parents approve a purchase request or block an installed app.' },
              { option_label: 'D', option_text: 'Apple needs a separate Family App Store so parents are not using the same interface as their kids', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'A separate store doubles Apple content curation surface and fragments developer submission workflows. Reviews identify confusion in the existing flow, not demand for a separate product.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'Map the parent full journey from a child app request to approved or denied — where are the handoff failures?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which improvement to the App Store experience has the highest impact for parents managing purchase requests?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'cognitive_empathy'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Add a Family tab in the App Store showing family members recent purchases and pending requests', quality: 'best', points: 3, competencies: ['creative_execution', 'cognitive_empathy'], explanation: 'A single App Store surface for family context eliminates the three-app navigation failure. Pending requests, purchase history, and age appropriateness coexist in one place — matching how parents actually think about the job.' },
              { option_label: 'B', option_text: 'Show a parent-facing age rating explainer when a child taps Get on an app they cannot purchase without approval', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Better context at the moment of request is valuable, but the parent still receives the request in a notification with no store context. The approval journey is still fragmented.' },
              { option_label: 'C', option_text: 'Build a weekly email digest for parents summarizing their family app downloads and screen time', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'Async email digests do not address the real-time approval confusion — parents cannot approve a request from an email.' },
              { option_label: 'D', option_text: 'Let parents set a monthly spending cap per child instead of approving each purchase individually', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Spending caps solve the approval volume problem but remove parental oversight entirely — the opposite of what concerned parents want.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'If you are adding a Family tab, what tradeoffs do you make in content, permissions, and scope?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the most important design constraint for the Family tab to avoid creating new problems?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'The tab should only be visible to the Family Sharing organizer account to prevent children from accessing parental controls', quality: 'best', points: 3, competencies: ['strategic_thinking', 'creative_execution'], explanation: 'Account-gated visibility is critical — a child browsing the App Store must not see their own pending approval requests or their siblings history. The tab must inherit the Family Sharing organizer role, which Apple already has as an identity primitive.' },
              { option_label: 'B', option_text: 'The tab should show all app categories so parents can discover age-appropriate apps proactively', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'Proactive discovery is a secondary use case. The primary problem is reactive management of requests and purchases. Adding a full browse surface expands scope without solving the core job.' },
              { option_label: 'C', option_text: 'The tab should require Face ID on every open to prevent children from approving their own requests', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Auth friction is prudent but Face ID on every open is too aggressive — it makes the legitimate parent experience painful. Per-action auth on approval is the right level.' },
              { option_label: 'D', option_text: 'The tab should be accessible to all family members so kids can see their own purchase history', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Letting children see pending approvals defeats the purpose. Kids can already check purchase history in their own account settings.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you measure success for a feature targeting a segment (parents) that is hard to identify in aggregate App Store data?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What metric best measures whether the Family tab actually reduced parent confusion?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Time from child purchase request to parent approval decision, targeting 50% reduction', quality: 'best', points: 3, competencies: ['strategic_thinking'], explanation: 'Resolution time is directly observable and maps to the stated pain: parents taking too long or failing to respond because they cannot find the approval flow. A 50% reduction is concrete and testable.' },
              { option_label: 'B', option_text: 'App Store rating among accounts in Family Sharing with child members', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Segment-filtered ratings are the right idea but App Store ratings are too infrequent and noisy to track a specific feature improvement.' },
              { option_label: 'C', option_text: 'Number of parental control support tickets in the 30 days post-launch', quality: 'surface', points: 1, competencies: [], explanation: 'Support ticket volume is a lagging indicator and does not distinguish between ticket reduction from actual improvement vs. reduced discoverability of support.' },
              { option_label: 'D', option_text: 'Daily active users of the Family tab as a percentage of Family Sharing organizer accounts', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'DAU on a reactive management feature is the wrong metric — good parental controls should be used when needed, not daily. High DAU might mean more requests, not better experience.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-apple-005',
    title: 'Apple Intelligence: On-Device vs. Cloud Tradeoffs',
    scenario_role: 'Staff engineer, Machine Learning Platform',
    scenario_context: 'Apple Intelligence ships AI features across the OS. The platform team evaluates each capability on a spectrum: fully on-device (Private Compute Core), hybrid (Private Cloud Compute), or server-side (third-party model calls). The privacy, latency, and capability tradeoffs shift with each use case.',
    scenario_trigger: 'A proposal lands to add a real-time meeting summary feature to FaceTime. The feature needs to process 60 minutes of audio-and-video context, generate structured notes, and surface action items. The ML team estimates running this fully on-device would require the A18 Pro chip with 8GB RAM — unavailable on most devices in the installed base.',
    scenario_question: 'How do you evaluate and decide the on-device versus cloud tradeoff for this specific AI feature?',
    engineer_standout: 'A strong engineer would frame this as a model-size vs. latency vs. privacy tradeoff with a well-defined decision rubric, not a binary choice, and flag that the privacy guarantee Apple markets requires on-device or Private Cloud Compute, ruling out third-party model calls.',
    paradigm: 'ai_native',
    industry: 'Consumer Software',
    sub_vertical: 'AI Features',
    difficulty: 'advanced',
    estimated_minutes: 25,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['cognitive_empathy'],
    frameworks: ['Privacy by Design', 'Capability-Constraint Mapping'],
    relevant_roles: ['ml_eng', 'swe', 'tech_lead', 'pm'],
    company_tags: ['Apple'],
    tags: ['apple-intelligence', 'on-device', 'privacy', 'ml', 'ai-strategy'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What are the non-negotiable constraints that bound the solution space before you evaluate options?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the correct framing of the tradeoff space for the FaceTime meeting summary feature?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'It is a privacy versus capability tradeoff — Apple must choose between protecting user data and delivering a useful feature', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'This framing is directionally correct but misses Private Cloud Compute as a third path. Apple architecture was specifically designed to avoid this binary.' },
              { option_label: 'B', option_text: 'It is a model-size versus installed-base coverage tradeoff — on-device capability exists on A18 Pro but the feature must be available to the broader installed base without degrading the privacy guarantee', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Private Cloud Compute preserves Apple privacy guarantee while expanding to devices that cannot run the model locally. The real constraint is installed base coverage, not a privacy-capability binary.' },
              { option_label: 'C', option_text: 'It is primarily a latency problem — cloud calls introduce too much delay for a real-time meeting feature', quality: 'surface', points: 1, competencies: ['domain_expertise'], explanation: 'Latency is a real engineering concern but meeting summaries are not real-time — they run post-meeting or in background threads. Framing latency as the primary constraint misidentifies the problem.' },
              { option_label: 'D', option_text: 'Apple should use OpenAI API for this feature since GPT-4o handles long audio context better than on-device models', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Third-party model calls violate Apple privacy guarantee for sensitive call content. The existing Apple-OpenAI integration is for user-initiated Siri queries, not continuous call recording.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'Map the decision criteria: what dimensions matter for this specific feature and which ones dominate?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which evaluation framework best structures the on-device vs. cloud decision for an AI feature at Apple?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['domain_expertise', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Benchmark on-device accuracy vs. cloud accuracy on a held-out dataset; pick whichever meets the quality bar first', quality: 'surface', points: 1, competencies: ['domain_expertise'], explanation: 'Accuracy comparison is one dimension but ignores privacy, installed base, and cost. A quality-only framework produces the wrong recommendation.' },
              { option_label: 'B', option_text: 'Evaluate across four dimensions: data sensitivity (forces Private Cloud Compute or on-device), model size vs. installed base coverage, latency tolerance, and per-inference cost at scale', quality: 'best', points: 3, competencies: ['domain_expertise', 'strategic_thinking'], explanation: 'Data sensitivity is a gate: FaceTime audio is category-1 sensitive, ruling out third-party APIs. The remaining dimensions (size, coverage, latency, cost) determine on-device vs. Private Cloud Compute.' },
              { option_label: 'C', option_text: 'Survey users about their privacy preferences and use majority preference to decide compute location', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'User surveys on privacy yield uniformly strong preferences for privacy — this does not distinguish between on-device and Private Cloud Compute, which Apple has already certified as privacy-preserving.' },
              { option_label: 'D', option_text: 'Calculate total inference cost on-device vs. cloud and choose the cheaper option', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Cost is a real dimension but it is downstream of the data sensitivity and capability gates. Optimizing cost before resolving those constraints leads to the wrong architecture.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'Given the constraints, what is the concrete technical recommendation, and what do you sacrifice?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the right compute architecture for the FaceTime meeting summary feature?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['domain_expertise', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'On-device only, gated to A18 Pro devices, with a clear message to other users that the feature is unavailable', quality: 'good_but_incomplete', points: 2, competencies: ['domain_expertise'], explanation: 'Privacy guarantee is preserved but the installed base is too small to ship a meaningful feature. Fragmentation creates support and perception problems.' },
              { option_label: 'B', option_text: 'Hybrid: on-device audio transcription (available to A16 and later) with Private Cloud Compute for the summarization and action item extraction step that requires a large context window', quality: 'best', points: 3, competencies: ['domain_expertise', 'creative_execution'], explanation: 'Splitting the pipeline by model size requirement: small transcription model runs on-device, large summarization model uses PCC. Privacy guarantee holds for both paths. Covers A16 and later — the majority of the active installed base.' },
              { option_label: 'C', option_text: 'Run the entire pipeline on Private Cloud Compute so all devices get the feature equally', quality: 'surface', points: 1, competencies: ['domain_expertise'], explanation: 'PCC is privacy-preserving but sending raw FaceTime audio to any compute node — even Apple-controlled — is a higher-sensitivity action than transcription. Hybrid keeps the most sensitive processing local where possible.' },
              { option_label: 'D', option_text: 'Use on-device processing for everything but limit meeting summary to 15-minute maximum to fit in available model context', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Capping meeting length is a user-hostile constraint that defeats the feature value for the majority of business meetings. Context window is a hardware limit, not a product design choice.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you communicate this architecture decision to product, legal, and users in a way that is accurate without undermining trust?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'How should Apple communicate the hybrid compute architecture to users without triggering privacy concerns?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['cognitive_empathy', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Do not disclose where computation happens — users trust Apple and the detail creates unnecessary anxiety', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Non-disclosure for a feature that processes call audio is a legal and trust risk. Apple privacy positioning requires transparency, not silence.' },
              { option_label: 'B', option_text: 'Show a disclosure in FaceTime settings: "Meeting summaries use on-device audio processing and Apple Private Cloud Compute for summarization. Your audio is never stored or used to train models."', quality: 'best', points: 3, competencies: ['cognitive_empathy', 'creative_execution'], explanation: 'Specific disclosure about the compute split, paired with the no-storage and no-training guarantee, matches what Apple has published about PCC. It is accurate and builds rather than undermines trust.' },
              { option_label: 'C', option_text: 'Add a privacy nutrition label in the App Store listing stating "Data not collected"', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: '"Data not collected" is inaccurate — audio is processed in PCC even if not stored. App Store nutrition labels are for data collection, not compute location.' },
              { option_label: 'D', option_text: 'Let users opt in to cloud processing with a toggle, defaulting to on-device-only for maximum privacy', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'User control is good but defaulting to on-device-only excludes most devices from the feature. The default should be the hybrid architecture, with an option to disable cloud processing entirely.' },
            ],
          },
        ],
      },
    ],
  },

  // ── LinkedIn ────────────────────────────────────────────────────
  {
    id: 'pm-linkedin-001',
    title: 'LinkedIn Jobs: Improving a Two-Sided Marketplace',
    scenario_role: 'Product engineer, Jobs Platform',
    scenario_context: 'LinkedIn Jobs is a two-sided marketplace where job seekers and recruiters have fundamentally different and sometimes opposing incentives. Job seeker satisfaction correlates with response rates and interview conversion; recruiter satisfaction correlates with qualified applicant volume and time-to-hire. A change that helps one side often degrades the other.',
    scenario_trigger: 'A product review shows that Easy Apply increased total application volume by 40% but recruiter satisfaction dropped 12 points — recruiters report being overwhelmed by low-quality applications, and job seekers report hearing back from fewer than 8% of applications.',
    scenario_question: 'How would you improve the LinkedIn Jobs experience for both job seekers and recruiters in a way that resolves the Easy Apply quality-volume tension?',
    engineer_standout: 'A strong engineer would recognize that Easy Apply removed friction from the wrong layer — the friction that filters unqualified applicants. The fix is not removing Easy Apply but adding a signal layer between application and recruiter inbox.',
    paradigm: 'ai_assisted',
    industry: 'Professional Networks',
    sub_vertical: 'Job Marketplace',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['strategic_thinking', 'cognitive_empathy'],
    secondary_competencies: ['domain_expertise'],
    frameworks: ['Two-Sided Marketplace Design', 'Jobs To Be Done'],
    relevant_roles: ['pm', 'swe', 'data_eng'],
    company_tags: ['LinkedIn'],
    tags: ['linkedin', 'jobs', 'marketplace', 'two-sided', 'recruiting'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What is the root cause of the Easy Apply quality problem, and who actually owns it?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the Easy Apply problem?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'cognitive_empathy'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Easy Apply is a bad feature that should be removed — it optimizes for volume over quality', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Removal discards real value: Easy Apply meaningfully increases reach for qualified candidates who would not complete a full ATS form. The problem is in the signal layer, not the apply mechanism.' },
              { option_label: 'B', option_text: 'Easy Apply removed friction for job seekers but also removed the qualification signal that recruiters relied on — the feature optimized for one side without compensating the other', quality: 'best', points: 3, competencies: ['strategic_thinking', 'cognitive_empathy'], explanation: 'The root cause is that friction in job applications served a qualification-signaling function. Reducing friction without adding an alternative signal layer degraded recruiter signal quality.' },
              { option_label: 'C', option_text: 'Job seekers are applying to too many roles indiscriminately and need to be limited to 10 applications per day', quality: 'surface', points: 1, competencies: ['strategic_thinking'], explanation: 'Volume limits treat the symptom without fixing the signal problem. A well-matched applicant applying to 20 jobs is not the issue; unmatched applicants applying to any job with one click is.' },
              { option_label: 'D', option_text: 'Recruiters need better filtering tools in LinkedIn Recruiter to manage the high volume', quality: 'good_but_incomplete', points: 2, competencies: ['domain_expertise'], explanation: 'Better recruiter filters are a valid short-term mitigation but push complexity to the recruiter side. The root cause is platform-level signal design, not recruiter tooling.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What signals exist on the platform that could distinguish high-fit from low-fit applicants without adding application friction?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which intervention best adds qualification signal without restoring the friction Easy Apply removed?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['domain_expertise', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Require job seekers to answer two custom screening questions before Easy Apply submits', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Screening questions add signal but also restore friction for qualified candidates. It is a step backward on the job seeker side without a smarter approach.' },
              { option_label: 'B', option_text: 'Surface a profile-to-job match score on every application in the recruiter inbox, derived from LinkedIn existing skills, experience, and endorsement graph', quality: 'best', points: 3, competencies: ['domain_expertise', 'creative_execution'], explanation: 'LinkedIn already has a rich graph of skills, endorsements, job history, and connections to hiring managers. A match score derived from this graph adds recruiter-side signal without job seeker friction — using data the platform already has.' },
              { option_label: 'C', option_text: 'Limit Easy Apply to jobs where the applicant profile is above a 70% match score', quality: 'surface', points: 1, competencies: ['strategic_thinking'], explanation: 'Hard blocking based on match score penalizes non-traditional candidates, career changers, and anyone with an incomplete LinkedIn profile — the people Easy Apply was supposed to help.' },
              { option_label: 'D', option_text: 'Launch a Top Applicant badge that recruiters can award to candidates who were responsive and qualified', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Recruiter badges require post-process feedback and do not help with the current inbox signal problem. They also incentivize recruiters to rate applicants, which many will not do.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'What tradeoffs do you accept when adding a match score to the recruiter inbox?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the most important risk to manage when deploying a match score in recruiter review flows?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'The match score may encode historical hiring bias — penalizing non-traditional career paths and underrepresented candidates who are qualified but have non-linear profiles', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'If the match model is trained on historical hire decisions, it encodes whatever bias those decisions contained. This is the dominant risk: a score that disadvantages the candidates Easy Apply was designed to help.' },
              { option_label: 'B', option_text: 'Recruiters may over-rely on the score and stop reading applications carefully', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Over-reliance is a real UX risk but secondary to bias. The score is a signal to aid judgment, not replace it — framing and UI can address this.' },
              { option_label: 'C', option_text: 'The match score might reduce total application-to-interview conversion rate by scaring off some job seekers', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'If the score is shown only to recruiters, job seekers do not see it and cannot be scared off. This risk only exists if scores are surfaced on the job seeker side too.' },
              { option_label: 'D', option_text: 'LinkedIn does not have enough skills data to build a reliable match model', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'LinkedIn has over 900M member profiles, skills endorsements, and job history data. Signal scarcity is not the issue; signal quality and bias are.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you measure success for a change that must improve outcomes on both sides of the marketplace?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What success metrics would confirm the match score improved outcomes for both sides without creating unintended harm?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Recruiter satisfaction score (measured post-hire cycle) and total application volume per job posting', quality: 'surface', points: 1, competencies: ['strategic_thinking'], explanation: 'Recruiter satisfaction is one side; application volume is the wrong job seeker metric — you want quality outcomes, not more applications.' },
              { option_label: 'B', option_text: 'Application-to-interview rate (recruiter side) and job seeker response rate — both measured by job and candidate segment to surface demographic gaps', quality: 'best', points: 3, competencies: ['strategic_thinking'], explanation: 'Application-to-interview rate measures recruiter value. Response rate measures job seeker value. Segmenting by candidate demographics catches bias before it compounds.' },
              { option_label: 'C', option_text: 'Time-to-hire across all LinkedIn Jobs posts', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Time-to-hire is a good recruiter-side outcome metric but says nothing about job seeker experience. You need both sides.' },
              { option_label: 'D', option_text: 'LinkedIn Jobs market share relative to Indeed and Glassdoor', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Competitive share is too lagging and confounded by factors outside this feature. It cannot distinguish the effect of a match score from macroeconomic hiring trends.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-linkedin-002',
    title: 'Sales Navigator: Designing for Enterprise Sales Workflow',
    scenario_role: 'Product engineer, Sales Solutions',
    scenario_context: 'Sales Navigator is LinkedIn B2B product for enterprise sales teams. It gives reps access to LinkedIn professional graph for account research, lead discovery, and relationship mapping. The core workflow follows a sequence: account identification, stakeholder mapping, outreach, and deal progression. Navigator data lives entirely outside of CRM systems where reps actually close deals.',
    scenario_trigger: 'During quarterly business reviews, enterprise customers consistently flag that reps use Sales Navigator for research but then manually copy contact information into Salesforce. The data transfer takes an average of 14 minutes per prospect and happens for every single contact a rep wants to outreach.',
    scenario_question: 'Design a new feature for Sales Navigator that solves a real problem in the enterprise sales workflow. What problem does it solve, and who benefits?',
    engineer_standout: 'A strong engineer would identify that the data-transfer problem is an API integration gap, not a UX gap, and propose a bi-directional CRM sync that pushes LinkedIn graph data (job changes, connection paths, account growth signals) to Salesforce as enrichment fields rather than static contact exports.',
    paradigm: 'ai_assisted',
    industry: 'B2B SaaS',
    sub_vertical: 'Sales Intelligence',
    difficulty: 'advanced',
    estimated_minutes: 25,
    primary_competencies: ['domain_expertise', 'creative_execution'],
    secondary_competencies: ['strategic_thinking'],
    frameworks: ['Jobs To Be Done', 'Workflow Integration Design'],
    relevant_roles: ['pm', 'swe', 'tech_lead'],
    company_tags: ['LinkedIn', 'Salesforce'],
    tags: ['sales-navigator', 'b2b', 'crm', 'enterprise', 'linkedin'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What is the actual job-to-be-done for an enterprise sales rep, and where does Sales Navigator fall short of it?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the 14-minute manual transfer problem?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['domain_expertise', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Sales Navigator UX is too complex and reps need a simpler export flow', quality: 'surface', points: 1, competencies: ['domain_expertise'], explanation: 'The problem is not complexity — reps are successfully using Navigator for research. The problem is that Navigator and CRM are two separate data stores with no live connection.' },
              { option_label: 'B', option_text: 'Sales Navigator is a read-only research tool while the CRM is where work happens — the gap is that LinkedIn graph data does not flow into the CRM as live enrichment', quality: 'best', points: 3, competencies: ['domain_expertise', 'strategic_thinking'], explanation: 'The 14-minute transfer is a symptom of two separate data stores. The root cause is that LinkedIn graph data — job changes, connections, account signals — is not enriching CRM records continuously.' },
              { option_label: 'C', option_text: 'Reps are using the wrong tool — they should be outreaching from CRM, not Navigator, which requires building outreach into Salesforce', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'This shifts the problem to Salesforce engineering and abandons LinkedIn product advantage: the professional graph. LinkedIn should solve the integration, not cede the workflow.' },
              { option_label: 'D', option_text: 'The problem is a training gap — reps do not know that Sales Navigator has a CSV export function', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'CSV export is a manual step that produces a static snapshot. This misses the underlying value LinkedIn has: real-time graph data like job changes and mutual connections.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What distinct feature designs could close the gap between LinkedIn graph data and CRM workflow?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which feature design best closes the Sales Navigator-to-CRM data gap for enterprise reps?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'A one-click Save to CRM button in Sales Navigator that exports a contact record as a static snapshot', quality: 'good_but_incomplete', points: 2, competencies: ['creative_execution'], explanation: 'One-click export reduces the 14-minute workflow to seconds but still produces a static record. Job changes, new connections, and account growth signals never reach the CRM without another export.' },
              { option_label: 'B', option_text: 'A bi-directional CRM sync that continuously pushes LinkedIn graph signals — job changes, mutual connections, account headcount growth — as enrichment fields on existing CRM contact records', quality: 'best', points: 3, competencies: ['creative_execution', 'domain_expertise'], explanation: 'Bi-directional sync converts LinkedIn from a research tool into a live data enrichment layer. Job changes are high-intent signals (new decision maker) that are worth more than any static contact field.' },
              { option_label: 'C', option_text: 'Build a native outreach tool inside Sales Navigator so reps never need to use CRM for outreach', quality: 'surface', points: 1, competencies: ['creative_execution'], explanation: 'Building CRM functionality inside LinkedIn abandons the existing CRM investment enterprise customers have and creates a support and integration burden for LinkedIn.' },
              { option_label: 'D', option_text: 'Use AI to auto-draft personalized InMail messages from the Sales Navigator profile view', quality: 'surface', points: 1, competencies: ['creative_execution'], explanation: 'AI-drafted InMails solve a different problem — outreach quality, not data workflow. The stated problem is the 14-minute CRM transfer, not message quality.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'What tradeoffs do you accept in building a live CRM sync, and what is the most important one to get right first?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'Which is the most critical design decision in the CRM sync feature?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Which CRM platforms to support first — Salesforce only, or Salesforce and HubSpot in parallel', quality: 'surface', points: 1, competencies: ['strategic_thinking'], explanation: 'Platform prioritization is an important scoping decision but it is downstream of the architecture decision. A Salesforce-only integration built wrong is harder to extend than one built right from the start.' },
              { option_label: 'B', option_text: 'Consent and data governance: LinkedIn members whose data flows into a third-party CRM must be made aware — the sync design must respect privacy settings and avoid pushing data for members who have opted out of profile data sharing', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'LinkedIn entire business rests on member trust. Pushing member data to enterprise CRM systems without respecting opt-out signals is a trust and regulatory violation. This is the non-negotiable gate before any other design decision.' },
              { option_label: 'C', option_text: 'Whether to charge an additional API fee for CRM sync on top of Sales Navigator seat licensing', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Monetization model matters but is a business decision, not a product design gate. The feature needs to work correctly before pricing it.' },
              { option_label: 'D', option_text: 'Real-time versus batch sync — whether to push updates as they happen or on a nightly schedule', quality: 'good_but_incomplete', points: 2, competencies: ['domain_expertise'], explanation: 'Sync latency is an important engineering decision but it is not the most critical one. Job change alerts lose value over days, so real-time wins — but privacy gates this entire decision.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you define and measure the success of a B2B integration feature where the end outcome (closed deals) is outside your direct measurement?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the primary success metric for the CRM sync feature?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Number of Sales Navigator seats that activate the CRM sync integration within 90 days of launch', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Activation rate shows adoption but not value. A rep who activates sync but never uses the enriched signals in their outreach has not improved.' },
              { option_label: 'B', option_text: 'Reduction in manual contact transfer time, measured by the average time between saving a prospect in Navigator and the first CRM outreach activity for that contact', quality: 'best', points: 3, competencies: ['strategic_thinking'], explanation: 'This metric directly measures the 14-minute transfer problem. If sync works, the gap between prospect identification and first outreach collapses. Both sides of the workflow are measured in a single observable event sequence.' },
              { option_label: 'C', option_text: 'Enterprise customer NPS for Sales Navigator in the quarter post-launch', quality: 'surface', points: 1, competencies: [], explanation: 'NPS is too lagging and too broad — it conflates sync value with every other aspect of the Sales Navigator experience.' },
              { option_label: 'D', option_text: 'Number of LinkedIn graph signals (job changes, connections) surfaced to CRM records per month', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Signal volume is an output metric of the sync, not an outcome metric. You want reps to act on signals, not just receive them.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-linkedin-003',
    title: 'Skills & Endorsements: Measuring Feature Success',
    scenario_role: 'Product engineer, Professional Identity',
    scenario_context: 'LinkedIn Skills and Endorsements lets members list up to 50 skills on their profile and receive endorsements from connections who confirm those skills. The feature was launched to make LinkedIn profiles more verifiable and improve job matching quality. Endorsements currently have no validation mechanism — any connection can endorse any skill.',
    scenario_trigger: 'A product review surfaces that Skills data is used in job matching algorithms and Sales Navigator search filters, but a data quality audit found that 38% of endorsements come from connections with no professional overlap with the endorsed skill.',
    scenario_question: 'How would you measure the success of the Skills and Endorsements feature given this data quality finding?',
    engineer_standout: 'A strong engineer would recognize that the feature has two distinct success definitions: member-side value (profile completeness, job matching quality) and platform-side value (signal quality for search and ranking algorithms). A single success metric conflates both and misses the quality issue entirely.',
    paradigm: 'traditional',
    industry: 'Professional Networks',
    sub_vertical: 'Professional Identity',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['creative_execution'],
    frameworks: ['North Star Framework', 'Signal Quality Analysis'],
    relevant_roles: ['pm', 'data_eng', 'ml_eng'],
    company_tags: ['LinkedIn'],
    tags: ['linkedin', 'metrics', 'skills', 'data-quality', 'endorsements'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What are the distinct purposes of Skills and Endorsements, and does a single metric serve all of them?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of what success means for Skills and Endorsements?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Success is total endorsement volume — more endorsements means the feature is being used', quality: 'surface', points: 1, competencies: [], explanation: 'Volume is an engagement metric, not a value metric. The data quality audit shows 38% of endorsements are noise — higher volume is worse success if it degrades signal quality.' },
              { option_label: 'B', option_text: 'The feature has two distinct success dimensions: member-side (profile credibility, job match quality) and platform-side (skill signal quality for search and ranking) — and the current endorsement quality problem is a failure on the platform dimension', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Skills serves members (credibility, matching) and the platform (search ranking, Sales Navigator filters). A single engagement metric collapses both. The audit finding is specifically a platform-signal quality failure.' },
              { option_label: 'C', option_text: 'Success is whether members who complete Skills sections get more profile views and job interview invitations', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Member-side outcomes are one dimension, and profile-to-interview conversion is a good metric for it. But this ignores platform-side signal quality entirely.' },
              { option_label: 'D', option_text: 'Success is whether the feature is differentiated from competitor resume platforms like Indeed and Glassdoor', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Competitive differentiation is a strategy question, not a feature success metric. Defining success by comparison to competitors does not tell you if the feature is actually working.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'Map the metrics for each distinct success dimension — what would you track, and at what cadence?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of metrics best covers both success dimensions without conflating them?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Member-side: profile completeness rate. Platform-side: total skills listed per active user', quality: 'surface', points: 1, competencies: [], explanation: 'Both metrics measure presence, not quality or impact. Profile completeness does not distinguish between accurate and fabricated skills; total skills listed does not capture endorsement signal quality.' },
              { option_label: 'B', option_text: 'Member-side: job match acceptance rate for members with 10+ endorsed skills vs. those without. Platform-side: endorsement signal precision — the fraction of endorsements from connections with professional overlap in the endorsed skill domain', quality: 'best', points: 3, competencies: ['strategic_thinking', 'creative_execution'], explanation: 'Job match acceptance rate connects Skills directly to the feature core value promise for members. Endorsement signal precision directly quantifies the data quality problem surfaced in the audit.' },
              { option_label: 'C', option_text: 'Recruiter search click-through rate on candidate profiles with more skills versus fewer skills', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Recruiter CTR is a useful platform-side signal but it measures quantity of skills, not quality of endorsements. A profile with 50 unverified skills might get more clicks than one with 10 credible ones.' },
              { option_label: 'D', option_text: 'Weekly endorsement send rate and month-over-month growth in total endorsements given', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Endorsement send rate optimizes for engagement, not quality. Growing noisy endorsement volume faster is the opposite of the improvement needed.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'How do you improve endorsement signal quality without breaking the social behavior that drives members to endorse at all?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'What product change would most improve endorsement signal quality without reducing legitimate endorsement volume?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Weight endorsements in job matching and search ranking by the professional overlap between endorser and endorsee — a senior engineer endorsing Python skills from a codebase colleague counts more than a college friend endorsing it', quality: 'best', points: 3, competencies: ['creative_execution', 'domain_expertise'], explanation: 'Weighted endorsements improve platform-side signal quality without changing the member-visible UI or removing any social behavior. Low-overlap endorsements still appear on the profile — they just carry less algorithmic weight.' },
              { option_label: 'B', option_text: 'Require endorsers to select a context ("worked together at", "collaborated on project") before an endorsement is counted', quality: 'good_but_incomplete', points: 2, competencies: ['creative_execution'], explanation: 'Context framing adds signal but reduces endorsement conversion by adding friction. The platform benefits more from weighting existing data than from adding a required step.' },
              { option_label: 'C', option_text: 'Remove endorsements from the profile entirely and replace with LinkedIn Skills Assessments (quizzes) as the only verification mechanism', quality: 'surface', points: 1, competencies: ['creative_execution'], explanation: 'Skills Assessments are more credible but require active effort from members. Removing endorsements removes a social signal that drives profile engagement without compensating for the lost quantity.' },
              { option_label: 'D', option_text: 'Cap each member at 10 endorsements per skill to prevent endorsement farming', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'A cap does not fix quality — it reduces quantity. A member with 10 noise endorsements still has a poor signal-to-quality ratio.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you communicate the data quality finding and the proposed fix to stakeholders across product, legal, and member trust?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'How do you present the endorsement weighting change to the team owning the job matching algorithm?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Share the 38% noise finding, explain the weighting model, provide an offline eval showing improved job match acceptance rate with the new signal, and propose a 30-day shadow mode before live deployment', quality: 'best', points: 3, competencies: ['strategic_thinking', 'creative_execution'], explanation: 'The matching team will not accept a change to a core ranking signal without an offline eval. Shadow mode (run new weights without serving them) reduces risk. This is the standard ML product change protocol.' },
              { option_label: 'B', option_text: 'Write a product requirements document describing the weighting model and submit it to the matching team for scoping', quality: 'good_but_incomplete', points: 2, competencies: ['creative_execution'], explanation: 'A PRD is the right format but stops short of providing the eval evidence the matching team will require. Without offline performance data, the change will stall in design review.' },
              { option_label: 'C', option_text: 'Present the finding at an all-hands and ask for engineering volunteers to prototype the weighting model', quality: 'surface', points: 1, competencies: [], explanation: 'All-hands announcements are not the right venue for a technical change to a ranking algorithm. The audience for this decision is two or three engineers on the matching team, not the company.' },
              { option_label: 'D', option_text: 'Launch an A/B test of the weighted model against the current model with 10% of job seekers', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'A live A/B test as the first step skips the offline eval that establishes the model is directionally correct. Running a live experiment with an untested weighting model risks real damage to job match quality for the treatment group.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-linkedin-004',
    title: 'LinkedIn Premium: Diagnosing a Retention Problem',
    scenario_role: 'Product engineer, Premium Products',
    scenario_context: 'LinkedIn Premium is a subscription product with four tiers: Career, Business, Sales Navigator, and Recruiter Lite. The Career and Business tiers — priced at $39 and $59/month — have the highest churn. LinkedIn Premium Career was originally built for active job seekers, but roughly 40% of subscribers are not actively job seeking at the time of purchase.',
    scenario_trigger: 'Subscription analytics show that 62% of Premium Career churn happens between months 2 and 4, and the majority of churning subscribers used fewer than 3 of the tier 8 premium features during their entire subscription.',
    scenario_question: 'How would you improve retention for LinkedIn Premium Career, given that most churning users never discovered the features they were paying for?',
    engineer_standout: 'A strong engineer would recognize that the retention problem is a feature discovery and activation problem, not a feature depth problem. The fix is onboarding and personalized surfacing of the right features for each subscriber actual use case, not adding new features.',
    paradigm: 'ai_assisted',
    industry: 'Professional Networks',
    sub_vertical: 'Subscriptions',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['strategic_thinking', 'motivation_theory'],
    secondary_competencies: ['cognitive_empathy'],
    frameworks: ['Jobs To Be Done', 'Activation Funnel Analysis'],
    relevant_roles: ['pm', 'data_eng', 'swe'],
    company_tags: ['LinkedIn'],
    tags: ['linkedin', 'premium', 'retention', 'subscription', 'activation'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What is the actual retention problem — is it value delivery, feature discovery, or the wrong segment paying for the product?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the LinkedIn Premium Career retention problem?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'cognitive_empathy'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'The product does not have enough value to justify $39/month — more features are needed', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'The data shows users using fewer than 3 of 8 features, not that the 8 features are insufficient. Adding more features for users who cannot discover the ones they have is the wrong response.' },
              { option_label: 'B', option_text: 'The activation problem upstream of retention: subscribers are not connecting the right features to their actual use case, so they never experience value before churn', quality: 'best', points: 3, competencies: ['strategic_thinking', 'cognitive_empathy'], explanation: 'Under-3-feature usage in a subscription with 8 features is a classic activation failure. The product does not route subscribers to the features most relevant to their specific situation (job seeker, networker, business developer).' },
              { option_label: 'C', option_text: 'LinkedIn Premium is priced too high relative to competitors — a price reduction would reduce churn', quality: 'surface', points: 1, competencies: ['motivation_theory'], explanation: 'Price sensitivity may play a role but the data points to activation, not price: users are churning after 2-4 months of non-use, not at initial purchase.' },
              { option_label: 'D', option_text: 'The problem is that 40% of subscribers are not job seekers — Premium Career should only be sold to active job seekers to reduce mismatch', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Restricting to active job seekers reduces total addressable subscribers and does not fix the feature discovery gap for the 60% who are job seeking. Segment mismatch is a contributing factor, not the root cause.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What activation interventions would connect subscribers to value within the first 30 days?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which onboarding or activation approach would best close the feature discovery gap for Premium Career subscribers?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'motivation_theory'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Add a Premium feature checklist in the UI so subscribers can track which features they have tried', quality: 'surface', points: 1, competencies: ['motivation_theory'], explanation: 'Checklists drive feature tourism — trying features for completion credit, not because they match the subscriber need. Feature usage without value is still churn.' },
              { option_label: 'B', option_text: 'At subscription start, ask two questions ("What is your current goal on LinkedIn?" and "How soon?") and use the answers to configure a personalized 30-day Premium plan that surfaces only the 2-3 features most relevant to that goal', quality: 'best', points: 3, competencies: ['creative_execution', 'motivation_theory'], explanation: 'Goal-based onboarding routes subscribers to the subset of features that match their actual use case. Job seeker features for active seekers; visibility and InMail credits for networkers. Fewer features with higher relevance beats a full-feature tour.' },
              { option_label: 'C', option_text: 'Send a weekly email digest highlighting an unused Premium feature with an explanation of its value', quality: 'good_but_incomplete', points: 2, competencies: ['motivation_theory'], explanation: 'Email feature education is a reasonable activation tactic but relies on the subscriber self-identifying which features matter to them. It does not solve the routing problem.' },
              { option_label: 'D', option_text: 'Introduce a Premium dashboard on the LinkedIn homepage that aggregates all premium features in one place', quality: 'good_but_incomplete', points: 2, competencies: ['creative_execution'], explanation: 'A unified dashboard reduces navigation friction but still requires subscribers to understand which features apply to their situation. It is a navigation fix, not an activation fix.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'What is the most important risk in a goal-based onboarding flow, and how do you manage it?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the key design risk in a two-question onboarding flow for Premium activation?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'cognitive_empathy'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Subscribers goals change over the subscription period — a job seeker who finds a job in month 2 now needs different features', quality: 'best', points: 3, competencies: ['strategic_thinking', 'cognitive_empathy'], explanation: 'Goal drift is the most important risk. A subscriber who answered "active job seeker" at signup may be employed by month 2. If the personalization does not update, the Premium plan becomes irrelevant at exactly the moment churn historically peaks (months 2-4).' },
              { option_label: 'B', option_text: 'Two questions are too few — subscribers need a 10-question onboarding survey to get truly personalized recommendations', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'More questions reduce onboarding completion rates dramatically. Two questions with high predictive value beat a comprehensive survey with 40% dropout.' },
              { option_label: 'C', option_text: 'Subscribers may not answer the questions honestly if they think it affects what features they get access to', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'Honest responses are more likely when the questions are framed as personalization, not gating. This risk is real but manageable with framing — unlike goal drift which requires product adaptation.' },
              { option_label: 'D', option_text: 'The personalized plan may not include all 8 Premium features, making subscribers feel they are not getting full value', quality: 'good_but_incomplete', points: 2, competencies: ['motivation_theory'], explanation: 'Perceived value gap is a valid concern, managed by framing the plan as "best for your goal" rather than "all you get." Less relevant features can remain discoverable.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you measure whether improved activation is actually reducing churn, not just improving feature usage?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the primary success metric for the Premium Career activation improvement?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Month-3 retention rate for subscribers who completed the onboarding questions vs. those who skipped it', quality: 'best', points: 3, competencies: ['strategic_thinking'], explanation: 'Month-3 retention directly measures the churn window (months 2-4). Comparing completers vs. skippers controls for selection effects and isolates the activation intervention impact.' },
              { option_label: 'B', option_text: 'Average features used per subscriber in the first 30 days', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Feature usage in month 1 is a leading indicator of retention, but the goal is relevant feature usage, not total feature usage. This metric does not distinguish goal-matched usage from feature tourism.' },
              { option_label: 'C', option_text: 'Subscriber NPS at the end of month 1', quality: 'surface', points: 1, competencies: [], explanation: 'Month-1 NPS is too early and too broad — subscribers have not yet experienced the churn risk period, and NPS conflates many aspects of the LinkedIn experience beyond Premium.' },
              { option_label: 'D', option_text: 'Total Premium revenue per subscriber cohort', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Revenue per cohort is the right long-term outcome but too aggregated to diagnose whether the activation intervention is working. A cohort can have higher revenue from upsells even if retention is flat.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-linkedin-005',
    title: 'LinkedIn Stories: A Post-Mortem Analysis',
    scenario_role: 'Staff product engineer, LinkedIn Core Experiences',
    scenario_context: 'LinkedIn launched Stories in September 2020, following the playbook of Instagram and Snapchat Stories. By September 2021, LinkedIn had shut down the feature entirely — citing that it was "not the right product" for the platform. The format saw active use in the months immediately after launch, but engagement did not sustain and the content quality drifted toward casual personal content that conflicted with LinkedIn professional identity.',
    scenario_trigger: 'A new product director has asked for a retrospective analysis: what went wrong with Stories, and what would a version of the feature have looked like that actually worked on LinkedIn?',
    scenario_question: 'If you had been the PM for LinkedIn Stories, what would you have done differently to give it a real chance of success?',
    engineer_standout: 'A strong engineer would identify that LinkedIn Stories failed on identity fit: the format was designed for casual self-expression, but LinkedIn users interact with the platform in a professional mode. The right intervention was either a format redesign or a narrow target segment — not borrowing the exact Instagram playbook.',
    paradigm: 'traditional',
    industry: 'Professional Networks',
    sub_vertical: 'Content & Feed',
    difficulty: 'advanced',
    estimated_minutes: 25,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['creative_execution'],
    frameworks: ['Product-Market Fit', 'Format-Identity Fit'],
    relevant_roles: ['pm', 'tech_lead', 'swe'],
    company_tags: ['LinkedIn'],
    tags: ['linkedin', 'stories', 'post-mortem', 'product-strategy', 'social-features'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'Why did Stories succeed on Instagram and fail on LinkedIn — what was different about the user, the context, or the content norms?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate diagnosis of why LinkedIn Stories failed?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'LinkedIn Stories launched during the pandemic when user behavior was abnormal — it would have performed better in a normal market', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'The pandemic actually increased time-on-platform for most social products. Timing was more favorable than usual, not less.' },
              { option_label: 'B', option_text: 'The Stories format assumes casual, present-tense self-expression — but LinkedIn users are in professional mode, creating content they want associated with their permanent professional identity, not ephemeral 24-hour posts', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Format-identity fit is the root cause. Stories are ephemeral and casual by design. LinkedIn professional identity is permanent and curated. Grafting a format designed for personal expression onto a professional context creates a cognitive mismatch for both creators and viewers.' },
              { option_label: 'C', option_text: 'LinkedIn did not invest enough in creator tools — better filters and editing would have improved content quality', quality: 'surface', points: 1, competencies: ['creative_execution'], explanation: 'Creator tools are a downstream concern. The problem was not content production friction — it was that professionals did not know what to put in a 24-hour Story that would not hurt their professional image.' },
              { option_label: 'D', option_text: 'LinkedIn Stories was placed in the wrong location in the app — if it had been in the feed instead of the top Stories bar, it would have had better visibility', quality: 'good_but_incomplete', points: 2, competencies: ['creative_execution'], explanation: 'Placement affected discoverability, but the content identity conflict was the deeper problem. Better placement of a format that does not fit the context accelerates the contradiction, it does not resolve it.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What alternative approaches to an ephemeral content format would have fit LinkedIn professional context?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which alternative design would have given an ephemeral content format a better chance of succeeding on LinkedIn?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Launch Stories exclusively for company pages so brands could share ephemeral behind-the-scenes content about their products and culture', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Company page Stories solves the individual professional identity risk, but company page content on LinkedIn already has low organic reach. Starting with a low-reach audience limits virality.' },
              { option_label: 'B', option_text: 'Redesign Stories as "Live Moments" — 48-hour posts attached to professional events (speaking at a conference, shipping a product, starting a new role) that expire after the moment passes', quality: 'best', points: 3, competencies: ['creative_execution', 'strategic_thinking'], explanation: 'Event-anchored ephemeral content is contextually appropriate for LinkedIn. "I just shipped our API redesign" is professional, shareable, and time-bounded. The format matches professional behavior rather than importing a consumer social behavior that does not fit.' },
              { option_label: 'C', option_text: 'Keep Stories but add a "Save to Profile" option so posts are not truly ephemeral', quality: 'surface', points: 1, competencies: ['creative_execution'], explanation: 'Adding permanence removes the defining property of the format. This is a retreat from Stories, not a redesign of it.' },
              { option_label: 'D', option_text: 'Partner with media companies to seed professional Stories content so the format has high-quality examples to follow', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Media partner seeding is a growth tactic, not a product fix. The format-identity conflict still exists for individual professional users after media seeding.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'If you launch Live Moments instead of Stories, what is the key design decision that determines whether it works?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the most critical design decision for a professional ephemeral content format on LinkedIn?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'The duration of the ephemeral window — 24 hours is too short for professionals who check LinkedIn infrequently, 7 days is better', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Duration affects reach but is not the most critical decision. The right duration depends on use case — event-anchored content should expire when the event ends, not on a fixed timer.' },
              { option_label: 'B', option_text: 'Whether the format is tied to a declared professional event (starting role, conference talk, product launch) or is freeform — the tie-in determines whether the content norm is professional or casual', quality: 'best', points: 3, competencies: ['strategic_thinking', 'creative_execution'], explanation: 'The content norm problem from the original Stories launch was that the format was freeform. Event-anchoring forces professional context. Without that constraint, the format drifts casual again over time.' },
              { option_label: 'C', option_text: 'Whether the content is shown in the main feed or in a separate Stories bar — feed placement would give it more visibility', quality: 'surface', points: 1, competencies: ['creative_execution'], explanation: 'Placement is important for discovery but it is downstream of the format design. Getting placement right for the wrong format still fails.' },
              { option_label: 'D', option_text: 'Whether the feature is enabled for all LinkedIn users by default or requires an explicit opt-in', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Rollout strategy affects adoption speed but not product-market fit. Opt-in can also signal the feature is optional, which reduces creation rates.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you set up the launch of Live Moments to know within 60 days whether it has product-market fit?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What leading metric would tell you within 60 days whether Live Moments has product-market fit?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Total Live Moments created in the first 30 days', quality: 'surface', points: 1, competencies: [], explanation: 'Creation volume measures reach, not fit. A curiosity-driven spike at launch followed by drop-off is indistinguishable from genuine fit on a 30-day creation metric.' },
              { option_label: 'B', option_text: 'Repeat creation rate: the percentage of users who post a Live Moment, then create a second one within 60 days', quality: 'best', points: 3, competencies: ['strategic_thinking'], explanation: 'Repeat creation separates novelty from habit. A user who creates a second Live Moment has found a recurring professional use case, not just experimented once. This is the canonical product-market fit signal for a content format.' },
              { option_label: 'C', option_text: 'LinkedIn feed engagement rate change in the 60 days post-launch', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Feed engagement is too broad — it captures changes driven by any feed factor, not just Live Moments. It does not isolate the format own product-market fit.' },
              { option_label: 'D', option_text: 'Press coverage and creator community reaction in the first week after launch', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Press coverage is a vanity metric for a product-market fit question. LinkedIn Stories also got positive press at launch.' },
            ],
          },
        ],
      },
    ],
  },
] as const

// ── Insertion logic ────────────────────────────────────────────

async function seed() {
  console.log('Seeding batch-6 FLOW challenges (Apple + LinkedIn)...\n')

  for (const c of CHALLENGES) {
    console.log(`  -> ${c.title}`)

    const { error: challengeErr } = await supabase
      .from('challenges')
      .upsert({
        id: c.id,
        slug: c.id,
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
      console.error(`    x challenge: ${challengeErr.message}`)
      continue
    }

    for (const s of c.steps) {
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
        console.error(`    x step ${s.step}: ${stepErr?.message}`)
        continue
      }

      for (const q of s.questions) {
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
          console.error(`    x question seq ${q.sequence}: ${qErr?.message}`)
          continue
        }

        if (q.options.length > 0) {
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
              console.error(`    x option ${opt.option_label}: ${optErr.message}`)
            }
          }
        }
      }
    }

    console.log(`  ok ${c.id}`)
  }

  console.log('\nSeed complete.')
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
