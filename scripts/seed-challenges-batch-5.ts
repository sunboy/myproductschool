/**
 * Seed script: 8 FLOW challenges — Microsoft & Apple PM interview questions (batch 5)
 *
 * Run:
 *   npx tsx scripts/seed-challenges-batch-5.ts
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
  {
    id: 'pm-microsoft-001',
    title: 'Redesigning OneDrive Mobile Sharing',
    scenario_role: 'Senior Product Engineer',
    scenario_context: 'OneDrive mobile sharing is underperforming against Google Drive on retention after first share. Qualitative research shows users struggle to find the right share mode for their context: some need read-only links, others need collaborative edit access, others want expiry-controlled shares.',
    scenario_trigger: 'A B2B customer reports that their field team accidentally shared confidential pricing sheets with edit access instead of view-only, because the share flow defaults to the last-used permission setting.',
    scenario_question: 'How would you redesign the OneDrive mobile sharing flow to reduce permission errors while not adding friction for the most common sharing patterns?',
    engineer_standout: 'A strong engineer would recognize this as a default state and permission model problem, not a UI complexity problem, and propose context-aware permission inference based on recipient type and file metadata.',
    paradigm: 'traditional',
    industry: 'Productivity Software',
    sub_vertical: 'Cloud Storage',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['cognitive_empathy', 'taste'],
    secondary_competencies: ['strategic_thinking', 'creative_execution'],
    frameworks: ['Jobs To Be Done', 'Progressive Disclosure'],
    relevant_roles: ['swe', 'pm', 'tech_lead'],
    company_tags: ['Microsoft', 'OneDrive', 'Google Drive', 'Dropbox'],
    tags: ['mobile', 'sharing', 'permissions', 'ux', 'cloud-storage'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'Is this a UI complexity problem, or something upstream in how the app models sharing intent?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the OneDrive mobile sharing problem?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['cognitive_empathy', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'The sharing UI has too many options, causing decision paralysis', quality: 'surface', points: 1, competencies: ['taste'], explanation: 'Reducing options is a common instinct but may remove needed functionality. The problem is wrong defaults, not option count.' },
              { option_label: 'B', option_text: 'The app does not infer sharing intent from context, so it falls back to a sticky default that is wrong for most scenarios', quality: 'best', points: 3, competencies: ['cognitive_empathy', 'strategic_thinking'], explanation: 'Sticky defaults are the root cause. A context-aware model (file type, recipient domain, recency) would eliminate most permission errors without reducing capability.' },
              { option_label: 'C', option_text: 'Users do not understand the difference between view and edit permissions', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'User comprehension is a real concern, but fixing comprehension without fixing defaults still leaves users choosing the wrong option under time pressure.' },
              { option_label: 'D', option_text: 'Mobile is the wrong surface for sharing configuration; this should be enforced at the admin policy layer', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Admin policy is a governance tool, not a product design solution. It does not address the friction for the majority of non-admin sharing tasks.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What are the structurally distinct design directions for fixing permission defaults in a sharing flow?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of sharing redesign approaches is most structurally distinct?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'taste'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Context-aware defaults; explicit intent picker before entering the share sheet; admin-enforced org-wide defaults', quality: 'best', points: 3, competencies: ['creative_execution', 'strategic_thinking'], explanation: 'Three structurally different intervention points: inferred defaults, user-declared intent, and policy enforcement. Each solves a different failure mode without overlapping.' },
              { option_label: 'B', option_text: 'Redesign the share sheet icons; add a permission confirmation screen; send an email summary of what was shared', quality: 'surface', points: 1, competencies: ['taste'], explanation: 'All three are UI surface changes that do not address the default state problem. Confirmation screens add friction without reducing error rate for users who click through.' },
              { option_label: 'C', option_text: 'Context-aware defaults; add a permission confirmation screen; redesign the share sheet icons', quality: 'good_but_incomplete', points: 2, competencies: ['creative_execution'], explanation: 'Context-aware defaults is the strongest idea here, but the other two options are surface-level and near-duplicate in effect.' },
              { option_label: 'D', option_text: 'Set view-only as the global default; require explicit upgrade to edit; add a confirmation step for edit grants', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Global view-only default plus a confirmation step is effectively one approach described three ways. Not structurally distinct.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'If you pick context-aware defaults, what signals drive the inference and what do you sacrifice?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'What signals should OneDrive use to infer the right sharing permission at the moment of share?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['cognitive_empathy', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'File type (spreadsheet vs. document vs. PDF), recipient email domain (internal vs. external), and sensitivity label if set', quality: 'best', points: 3, competencies: ['cognitive_empathy', 'creative_execution'], explanation: 'These three signals are already available at share time, cover the most common error scenarios, and require no user input. Internal recipients default to edit; external or sensitivity-labeled files default to view-only.' },
              { option_label: 'B', option_text: 'User role in the org (manager vs. IC) and the file creation date', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'User role does not predict sharing intent, and file age has no consistent relationship to edit vs. view permissions.' },
              { option_label: 'C', option_text: 'Most recent sharing choice made by the user', quality: 'surface', points: 1, competencies: [], explanation: 'This is the current sticky default approach that causes the problem. Repeating last-used permission assumes context is constant across shares, which it is not.' },
              { option_label: 'D', option_text: 'File type and recipient domain only, without sensitivity labels', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Good signal pair, but omitting sensitivity labels means confidential files can still be shared incorrectly when the recipient is internal.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you ship this incrementally and measure whether permission errors actually dropped?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the right launch strategy and success metric for this redesign?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'A/B test context-aware defaults on 10% of mobile users; primary metric is permission change rate after first share (users who immediately switch the default the system chose)', quality: 'best', points: 3, competencies: ['strategic_thinking', 'creative_execution'], explanation: 'Permission change rate is a direct behavioral signal that the inferred default was wrong. It avoids waiting for downstream harm like accidental over-shares.' },
              { option_label: 'B', option_text: 'Ship to all users, then track support tickets about unintended share permissions', quality: 'surface', points: 1, competencies: [], explanation: 'Support tickets are a lagging, noisy indicator. Most permission errors never generate a ticket. Full rollout before validation is too risky for a default change.' },
              { option_label: 'C', option_text: 'Track share completion rate to ensure the new flow does not add friction', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Completion rate matters, but does not tell you whether permission errors decreased. You need both metrics together.' },
              { option_label: 'D', option_text: 'Run a user interview study asking 20 people whether they prefer the new flow', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Qualitative preference data does not measure error rate reduction. People can prefer a design that still produces errors at the same rate.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-microsoft-002',
    title: 'Defining Success for Teams Focus Mode',
    scenario_role: 'Product Manager, Microsoft Teams',
    scenario_context: 'Teams is launching a Focus Mode feature that silences non-urgent notifications and surfaces only direct mentions and meeting reminders. Internal research shows knowledge workers lose an average of 23 minutes per interruption to regain deep work context.',
    scenario_trigger: 'The VP asks the team to define a success framework before the feature ships, because the last feature launch measured only activation rate and missed that users who activated it were less engaged a month later.',
    scenario_question: 'How do you define success for Focus Mode such that the metric captures real productivity improvement, not just feature adoption?',
    engineer_standout: 'A strong engineer would distinguish between output metrics (messages sent, meetings joined) and outcome metrics (task completion, deep work session length) and propose instrumentation that measures the latter.',
    paradigm: 'traditional',
    industry: 'Productivity Software',
    sub_vertical: 'Communication Platforms',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['cognitive_empathy'],
    frameworks: ['North Star Framework', 'Counter Metrics'],
    relevant_roles: ['pm', 'em', 'tech_lead', 'swe'],
    company_tags: ['Microsoft', 'Teams', 'Slack', 'Notion'],
    tags: ['metrics', 'focus', 'productivity', 'b2b', 'engagement'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What is the actual user outcome Focus Mode is supposed to produce, and how is that different from the feature behavior?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of what Focus Mode success looks like for users?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'cognitive_empathy'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Users activate Focus Mode frequently and stay in it for long sessions', quality: 'surface', points: 1, competencies: [], explanation: 'Activation frequency and session length are feature engagement metrics, not outcome metrics. Users who run Focus Mode for hours but do no productive work still count here.' },
              { option_label: 'B', option_text: 'Users who use Focus Mode complete more meaningful tasks per day than matched users who do not', quality: 'best', points: 3, competencies: ['strategic_thinking', 'cognitive_empathy'], explanation: 'Task completion is the outcome the feature exists to improve. Comparing Focus Mode users against matched non-users controls for self-selection and captures real productivity lift.' },
              { option_label: 'C', option_text: 'Teams overall notification open rate decreases, indicating less distraction', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Lower notification open rate is a plausible signal but it measures Teams behavior, not user productivity. Open rate can drop because notifications are irrelevant, not because users are focused.' },
              { option_label: 'D', option_text: 'User satisfaction scores improve among Focus Mode users', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Satisfaction scores are a lagging and self-reported proxy. Users may feel more focused without actually completing more work.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What components should a complete success framework for Focus Mode cover?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of metrics forms the most complete success framework for Focus Mode?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Primary: deep work session length. Counter: teammate response time to blocked messages. Guardrail: 30-day retention among Focus Mode users vs. non-users', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Three distinct categories: the outcome metric, the negative externality check, and a retention guardrail that catches the exact failure mode the VP described.' },
              { option_label: 'B', option_text: 'Feature activation rate, daily active usage of Focus Mode, session length', quality: 'surface', points: 1, competencies: [], explanation: 'All three are feature engagement metrics. None of them measure whether users are more productive, and none catch the retention cliff the VP flagged.' },
              { option_label: 'C', option_text: 'Deep work session length and 30-day retention', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Good combination but missing the counter metric for teammate impact. Focus Mode that improves individual productivity at the cost of team coordination is a product failure.' },
              { option_label: 'D', option_text: 'NPS among Focus Mode users compared to baseline', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'NPS is too slow, too broad, and conflates Focus Mode with overall Teams satisfaction. It would not catch a 30-day retention cliff in time to act.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'What tradeoffs do you make when choosing how to instrument deep work session length in Teams?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'How should Teams instrument "deep work session length" given that Teams does not own the user\'s full work context?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['domain_expertise', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Measure time between any Teams interaction (message sent, tab switched, meeting joined) while Focus Mode is active', quality: 'good_but_incomplete', points: 2, competencies: ['domain_expertise'], explanation: 'Reasonable proxy but measures absence of Teams activity, not presence of productive work. A user who is browsing Twitter still looks like a focused user by this metric.' },
              { option_label: 'B', option_text: 'Integrate with Microsoft 365 activity signals: time spent in Word, Excel, or Loop documents while Focus Mode is active, with no Teams interruption', quality: 'best', points: 3, competencies: ['domain_expertise', 'strategic_thinking'], explanation: 'M365 integration lets Teams measure active document work, not just Teams silence. This is the only way to confirm that Focus Mode produces actual productive output, not just inactivity.' },
              { option_label: 'C', option_text: 'Ask users to self-report their productivity on a 1-5 scale at the end of each Focus Mode session', quality: 'surface', points: 1, competencies: [], explanation: 'Self-report is subject to social desirability bias and recall error. It also adds friction at the end of every session, which may reduce feature adoption.' },
              { option_label: 'D', option_text: 'Track keyboard and mouse activity during Focus Mode as a proxy for active work', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Raw input activity is not a valid productivity proxy. A user can be highly active on social media or in another app while Teams Focus Mode is on.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you present this framework to the VP in a way that prevents the same mistake from the last launch?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What does the ideal one-page success brief for Focus Mode include?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Primary outcome metric (M365 active work time), counter metric (teammate response time), guardrail (30-day retention), and explicit exclusion of activation rate as a reportable metric', quality: 'best', points: 3, competencies: ['creative_execution', 'strategic_thinking'], explanation: 'The explicit exclusion of activation rate directly addresses the VP stated concern and signals that the team has learned from the prior failure. The full framework covers outcomes, externalities, and retention.' },
              { option_label: 'B', option_text: 'A list of all metrics the team plans to track with explanations of each', quality: 'surface', points: 1, competencies: [], explanation: 'Comprehensiveness without prioritization leaves stakeholders uncertain about what constitutes success. A list without a primary metric invites the same activation-rate mistake.' },
              { option_label: 'C', option_text: 'Primary metric and 30-day retention target with numerical thresholds', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Solid but incomplete without the counter metric for teammate impact, which is the most likely negative externality of a muting feature.' },
              { option_label: 'D', option_text: 'User research quotes plus activation and retention projections', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Research quotes support the problem framing, not the success definition. Projections without outcome metrics repeat the prior mistake.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-microsoft-003',
    title: 'Remote Teams Time Zone Coordination Feature',
    scenario_role: 'Senior Engineer, Microsoft Teams',
    scenario_context: 'Research from distributed companies shows that 62% of cross-timezone collaboration failures stem not from scheduling conflicts but from handoff ambiguity: teams do not know when someone is available for an async reply versus when they are in deep work or off hours.',
    scenario_trigger: 'The Teams product team gets a contract signal: three enterprise customers in the same quarter asked for a feature that helps global teams coordinate without forcing everyone to be available at the same hours.',
    scenario_question: 'How would you design a feature for remote teams to coordinate across time zones, and which problem should you solve first?',
    engineer_standout: 'A strong engineer would identify that the core problem is async handoff clarity, not scheduling, and would propose presence state broadcasting with explicit expected-response-time windows rather than just showing clocks.',
    paradigm: 'traditional',
    industry: 'Productivity Software',
    sub_vertical: 'Communication Platforms',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['cognitive_empathy', 'creative_execution'],
    secondary_competencies: ['strategic_thinking'],
    frameworks: ['Jobs To Be Done', 'Problem Sizing'],
    relevant_roles: ['swe', 'em', 'pm', 'tech_lead'],
    company_tags: ['Microsoft', 'Teams', 'Slack', 'Loom'],
    tags: ['remote-work', 'async', 'collaboration', 'teams', 'product-design'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'Is the core problem about knowing what time it is for someone, or about knowing when it is safe to interrupt them?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the actual problem enterprise customers are trying to solve with time zone coordination?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['cognitive_empathy', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Users cannot tell what time zone a colleague is in, so they do not know when to schedule meetings', quality: 'surface', points: 1, competencies: [], explanation: 'Time zone display is already available in most calendaring tools. If this were the real problem, it would be solved by existing features. The enterprise escalation signals a deeper need.' },
              { option_label: 'B', option_text: 'Teams cannot communicate expected response windows, so async handoffs stall when the next person is not obviously reachable', quality: 'best', points: 3, competencies: ['cognitive_empathy', 'strategic_thinking'], explanation: 'Handoff clarity is the actual failure mode the research confirms. Showing a clock does not help if you do not know whether someone is available for async, in focus time, or genuinely offline.' },
              { option_label: 'C', option_text: 'Scheduling tools do not show free/busy across time zones, making cross-region meeting setup slow', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Scheduling pain is real but it is a calendar problem, not a Teams coordination problem. Solving scheduling does not fix async handoffs.' },
              { option_label: 'D', option_text: 'Employees in different regions feel less included because most meetings are scheduled for headquarters time zones', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Inclusion is a management and policy problem, not a product design problem at this scope. It would not drive three enterprise customers to the same feature request.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What are the structurally different design approaches to solving async handoff ambiguity?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of design directions addresses async handoff ambiguity most distinctly?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'cognitive_empathy'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Explicit response-window declarations by each user; AI-inferred availability from calendar patterns; message routing delay that holds messages until the recipient next work window', quality: 'best', points: 3, competencies: ['creative_execution', 'strategic_thinking'], explanation: 'Three distinct paradigms: user-declared state, system-inferred state, and message behavior change. Each solves the handoff problem from a different angle with different tradeoffs.' },
              { option_label: 'B', option_text: 'Time zone clocks on profiles; a world map view of the team; scheduled sends', quality: 'surface', points: 1, competencies: [], explanation: 'These are existing features in Teams or close variants of them. None address the handoff ambiguity problem; they only surface time zone information that users already have access to.' },
              { option_label: 'C', option_text: 'Response-window declarations and AI-inferred availability from calendar patterns', quality: 'good_but_incomplete', points: 2, competencies: ['creative_execution'], explanation: 'Two valid directions, but this list is incomplete. Missing message-routing behavior, which is a structurally distinct approach that changes how Teams handles sends, not just how it displays availability.' },
              { option_label: 'D', option_text: 'A coordination hub page, a team overlap calculator, and scheduled sends', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'A coordination hub and overlap calculator are both information display features solving the same sub-problem. They are not structurally distinct from each other.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'If you build response-window declarations, what is the explicit tradeoff you are making?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the primary tradeoff in choosing user-declared response windows over AI-inferred availability?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'cognitive_empathy'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'User declarations require adoption effort but give users agency and are always accurate to intent; AI inference is zero-effort but reflects patterns, not current intent', quality: 'best', points: 3, competencies: ['strategic_thinking', 'cognitive_empathy'], explanation: 'Names both the criterion (accuracy to intent vs. adoption friction) and the sacrifice explicitly. This is the correct tradeoff framing: declarations win on accuracy, inference wins on adoption.' },
              { option_label: 'B', option_text: 'AI inference is more technically complex to build', quality: 'surface', points: 1, competencies: [], explanation: 'Implementation complexity is an engineering tradeoff, not a product tradeoff. It should not drive the feature decision without connecting back to user value.' },
              { option_label: 'C', option_text: 'User declarations can become stale if people forget to update them', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Staleness is a real risk of declarations, but this is half the tradeoff. The full answer names what you gain with declarations (accuracy to current intent) and what you sacrifice (maintenance overhead).' },
              { option_label: 'D', option_text: 'AI inference raises privacy concerns because it reads calendar data', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Privacy is a constraint, not a product tradeoff. Microsoft already reads calendar data for free/busy in Teams. Framing this as the primary tradeoff conflates legal compliance with product design.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'What is your crisp recommendation for what to ship first, given limited engineering capacity?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'Given limited capacity, what should ship in v1 of the time zone coordination feature?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'User-declared response windows surfaced inline on messages and profiles, with a one-click "I am back" reset. Ship AI inference as v2 after validating that declared windows are used and reduce handoff stalls.', quality: 'best', points: 3, competencies: ['strategic_thinking', 'creative_execution'], explanation: 'Declarations are faster to build, validate the core job (handoff clarity), and produce the behavioral data needed to train AI inference in v2. Sequencing is explicit and testable.' },
              { option_label: 'B', option_text: 'AI-inferred availability, because it requires no user effort and will have higher adoption', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Inference is the harder build, requires training data you do not yet have, and reflects patterns rather than current intent. Starting here inverts the right sequencing.' },
              { option_label: 'C', option_text: 'A world clock view of all team members with their local time surfaced in the chat header', quality: 'surface', points: 1, competencies: [], explanation: 'World clocks display time zone information that is already available elsewhere. This does not address the handoff ambiguity problem the enterprise customers described.' },
              { option_label: 'D', option_text: 'Run customer discovery interviews with all three enterprise customers before committing to any design direction', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Discovery is valuable but at this stage you have research data and enterprise contract signals. Delaying to re-interview while competitors ship is the wrong call when the problem is sufficiently clear.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-microsoft-004',
    title: 'Should Microsoft Acquire Another Gaming Studio?',
    scenario_role: 'Strategy Lead, Microsoft Gaming',
    scenario_context: 'Following the $68.7B Activision Blizzard acquisition, Microsoft Gaming controls some of the highest-grossing franchises in the industry. The FTC review consumed 18 months and reshaped Microsoft content exclusivity commitments globally. Game Pass subscriber growth has stabilized at 34 million subscribers.',
    scenario_trigger: 'The gaming leadership team is evaluating whether to pursue another major studio acquisition or shift capital toward first-party development and live service infrastructure.',
    scenario_question: 'Should Microsoft acquire another large gaming studio in the next 12 months, and what is the strongest argument against doing so even if an attractive target exists?',
    engineer_standout: 'A strong engineer-PM would recognize that the constraint is not capital but regulatory capacity and integration bandwidth, and would model the opportunity cost of another long-cycle M&A process against faster alternatives like licensing or partnership.',
    paradigm: 'traditional',
    industry: 'Gaming',
    sub_vertical: 'Console and Subscription Gaming',
    difficulty: 'advanced',
    estimated_minutes: 25,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['motivation_theory'],
    frameworks: ['Opportunity Cost Analysis', 'Build vs. Buy vs. Partner'],
    relevant_roles: ['pm', 'em', 'tech_lead'],
    company_tags: ['Microsoft', 'Xbox', 'Activision Blizzard', 'Sony'],
    tags: ['strategy', 'acquisition', 'gaming', 'mna', 'regulation'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What is Microsoft actually trying to solve with studio acquisitions, and is that still the right problem to be solving now?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the acquisition question in Microsoft current strategic position?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Microsoft needs more exclusive content to grow Game Pass beyond 34 million subscribers', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Content need is real, but it conflates the goal (Game Pass growth) with the mechanism (acquisition). The question is whether acquisition is the best path to that content.' },
              { option_label: 'B', option_text: 'Microsoft has regulatory and integration bandwidth constraints that make another large acquisition the highest-risk path to content even if the target is attractive', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Framing the constraint correctly changes the decision. After the 18-month Activision review, another acquisition of similar scale faces the same regulatory scrutiny while integration of Activision is still in progress.' },
              { option_label: 'C', option_text: 'Microsoft should wait until Game Pass reaches 50 million subscribers before considering further acquisitions', quality: 'surface', points: 1, competencies: [], explanation: 'A subscriber milestone is an arbitrary threshold with no strategic logic. It does not address the regulatory or integration bandwidth constraint.' },
              { option_label: 'D', option_text: 'Sony content exclusivity strategy is the main competitive threat and Microsoft should match it acquisition for acquisition', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Responding to Sony playbook ignores the fundamental difference: Sony does not have the same regulatory exposure as Microsoft in gaming after the Activision consent orders.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What are the structurally distinct alternatives to a large studio acquisition for solving the content problem?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of alternatives to a large acquisition is most structurally distinct?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'First-party studio investment (greenfield teams); strategic publishing deals with independent studios; small tuck-in acquisitions below regulatory thresholds', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Three structurally distinct paths: build internally, partner externally with no ownership, and acquire at a scale that avoids regulatory review. Each has a different risk profile, timeline, and content ownership outcome.' },
              { option_label: 'B', option_text: 'Acquire a mid-tier studio; acquire an indie studio; acquire a mobile gaming company', quality: 'surface', points: 1, competencies: [], explanation: 'All three are acquisitions of different sizes. They are not structurally distinct alternatives to acquisition strategy; they are all the same mechanism.' },
              { option_label: 'C', option_text: 'First-party development and publishing deals with independent studios', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Two good directions, but missing the small tuck-in path, which is meaningfully different in regulatory exposure and speed.' },
              { option_label: 'D', option_text: 'Do nothing for 12 months and complete Activision integration before deciding', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Waiting is a valid strategic option but it is not an alternative to the content problem. Game Pass growth does not pause during integration.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'Name the specific criterion that drives your recommendation and the sacrifice you are explicitly making.',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the strongest argument against a large acquisition even if a high-quality target exists at a fair price?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Leadership bandwidth is the binding constraint: the same executives who negotiated and are integrating Activision would own another acquisition, and splitting their attention during a complex integration is the fastest way to fail both', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Bandwidth is a harder constraint than capital or regulatory risk because it cannot be purchased. This argument is specific, names the sacrifice (Activision integration quality), and is verifiable.' },
              { option_label: 'B', option_text: 'The regulatory environment is too hostile for another large gaming acquisition to succeed', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Regulatory risk is real but it is probabilistic, not certain. The bandwidth argument is categorical: even if approved, the integration would be mismanaged.' },
              { option_label: 'C', option_text: 'Another acquisition would be too expensive given current interest rate conditions', quality: 'surface', points: 1, competencies: [], explanation: 'Microsoft has $80B+ in cash reserves. Capital cost is not the binding constraint for a company that just completed a $68.7B deal.' },
              { option_label: 'D', option_text: 'The gaming market is contracting so the timing is wrong', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Counter-cyclical acquisitions are often the best time to buy. Market timing is a weak strategic argument compared to internal capability constraints.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'What is your crisp recommendation to leadership, and how do you address the case for acting now?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the right recommendation to Microsoft Gaming leadership on the acquisition question?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'No large acquisition for 18-24 months. Redirect capital to first-party studio investment and publishing deals. Revisit after Activision integration milestones are confirmed. Set a clear trigger condition: if Game Pass growth stalls below 5% year-over-year, reopen the acquisition discussion.', quality: 'best', points: 3, competencies: ['strategic_thinking', 'creative_execution'], explanation: 'Crisp, testable, names the explicit trigger for revisiting, and gives leadership a path forward rather than just a no. The trigger condition converts an ambiguous future decision into a data-driven one.' },
              { option_label: 'B', option_text: 'It depends on the target. Evaluate case by case.', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Refusing to take a position when asked for a strategic recommendation is not useful to leadership. The question is whether to pursue acquisition as a strategy, not whether a specific target is good.' },
              { option_label: 'C', option_text: 'Proceed with a smaller studio acquisition below $5B to stay below regulatory thresholds while maintaining content momentum.', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Smart on regulatory risk but does not address the leadership bandwidth constraint. A small acquisition still consumes deal team and integration capacity during the Activision integration.' },
              { option_label: 'D', option_text: 'Conduct an 18-month strategic review before making any decision on acquisitions.', quality: 'surface', points: 1, competencies: [], explanation: 'An 18-month review is not a recommendation; it is a delay mechanism. Leadership needs a direction, not a process.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-microsoft-005',
    title: 'Entering a New Market with an Existing Azure Service',
    scenario_role: 'Product Lead, Azure',
    scenario_context: 'Azure Cognitive Services is an established portfolio. Microsoft is evaluating geographic expansion into Southeast Asia, where the hyperscaler market is growing at 31% annually but is currently dominated by Alibaba Cloud and AWS. Enterprise procurement cycles in the region run 9-18 months and compliance requirements vary by country.',
    scenario_trigger: 'The Azure GM for Asia-Pacific asks for a market entry recommendation for one additional country in the next fiscal year.',
    scenario_question: 'How would you evaluate whether to enter a new market with an existing Azure cloud service, and what is the single most important question to answer first?',
    engineer_standout: 'A strong engineer would recognize that data residency and sovereignty compliance is the load-bearing constraint, not demand signals, and that answering it first eliminates or validates the entire opportunity without spending on go-to-market.',
    paradigm: 'traditional',
    industry: 'Cloud Infrastructure',
    sub_vertical: 'Enterprise Cloud Services',
    difficulty: 'advanced',
    estimated_minutes: 25,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['cognitive_empathy'],
    frameworks: ['Market Entry Framework', 'Jobs To Be Done'],
    relevant_roles: ['pm', 'em', 'tech_lead', 'founding_eng'],
    company_tags: ['Microsoft', 'Azure', 'AWS', 'Alibaba Cloud'],
    tags: ['strategy', 'market-entry', 'cloud', 'azure', 'enterprise'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What is the right first question: is there demand, can we comply, or can we win?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most important question to answer before evaluating Southeast Asian market entry for Azure?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'What is the total addressable market and projected growth rate in each candidate country?', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Market sizing is a necessary input but it is not load-bearing. A large TAM is irrelevant if compliance requirements block entry.' },
              { option_label: 'B', option_text: 'Does the country data residency and sovereignty law allow the existing Azure service architecture to operate without a local-region buildout?', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Compliance is the binary constraint: if local data residency is required and Azure has no in-country region, the entire opportunity is blocked regardless of demand or competitive dynamics.' },
              { option_label: 'C', option_text: 'Which competitors are strongest in each market and what are their pricing models?', quality: 'surface', points: 1, competencies: ['strategic_thinking'], explanation: 'Competitive analysis is useful for positioning but premature if compliance requirements have not been confirmed. You cannot compete in a market you cannot legally enter.' },
              { option_label: 'D', option_text: 'What enterprise customers in the region are already using Azure globally and could be converted to a local deployment?', quality: 'plausible_wrong', points: 0, competencies: ['cognitive_empathy'], explanation: 'Existing customer analysis is useful for forecasting but answering it before compliance is backwards. Existing global customers may themselves be blocked by local data laws from using in-country services.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'Beyond compliance, what are the distinct dimensions of a market entry evaluation framework?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which market entry evaluation framework covers the most structurally distinct dimensions?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Compliance feasibility; demand and TAM; competitive intensity; Microsoft right to win (existing relationships, partner ecosystem, product-market fit for the service)', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Four structurally distinct dimensions covering the legal gate, the market opportunity, the competitive context, and Microsoft specific advantage. Together they form a complete go/no-go framework.' },
              { option_label: 'B', option_text: 'Market size, growth rate, and competitive landscape', quality: 'surface', points: 1, competencies: ['strategic_thinking'], explanation: 'Market attractiveness criteria, but all three are demand-side. Missing compliance and right to win, which are equally important gates.' },
              { option_label: 'C', option_text: 'Compliance, TAM, and competitive intensity', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Three strong dimensions, but missing the right-to-win assessment. Microsoft can enter a large market with light competition and still fail without an existing ecosystem advantage.' },
              { option_label: 'D', option_text: 'Revenue opportunity, cost to enter, and payback period', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Financial projection criteria are useful for prioritizing between approved options, not for evaluating whether to enter. Financial models are meaningless without first clearing the compliance gate.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'Given the 9-18 month enterprise procurement cycle, what does the right sequencing of the entry analysis look like?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'How should the market entry evaluation be sequenced to minimize wasted effort given the constraints?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Compliance screen first (eliminates non-viable markets); right-to-win assessment second (eliminates markets where Azure cannot compete); TAM and financial modeling last (prioritizes among viable candidates)', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Sequencing by elimination cost minimizes analysis waste. Each gate eliminates markets before the next, more expensive gate runs. Financial modeling is the most resource-intensive step and should be reserved for the final shortlist.' },
              { option_label: 'B', option_text: 'Commission a full TAM analysis for all candidate countries simultaneously, then filter by compliance', quality: 'surface', points: 1, competencies: [], explanation: 'Running full TAM analysis before the compliance screen wastes resources on markets that may be ineligible. Compliance should filter the list before expensive market research begins.' },
              { option_label: 'C', option_text: 'Compliance screen and TAM analysis in parallel to save time, then right-to-win assessment', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Parallel compliance and TAM saves time but wastes TAM effort on non-compliant markets. Compliance is faster and cheaper; run it first even if it means TAM starts one sprint later.' },
              { option_label: 'D', option_text: 'Start with right-to-win assessment since Microsoft brand and existing customer base are the biggest differentiators', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Brand advantage is irrelevant in a market where Microsoft cannot legally operate. Starting with right-to-win before compliance inverts the priority of the binding constraint.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you present a country recommendation to the APAC GM in a way that is defensible under scrutiny?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What does a credible one-page market entry recommendation to the APAC GM include?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Recommended country; compliance status; right-to-win rationale; 3-year revenue projection at two adoption scenarios; key risks and mitigations; decision needed by the GM', quality: 'best', points: 3, competencies: ['creative_execution', 'strategic_thinking'], explanation: 'Covers the decision, the evidence base, the financial case, the risk register, and a clear ask. The two-scenario projection is more honest than a point estimate and signals analytical rigor to a senior stakeholder.' },
              { option_label: 'B', option_text: 'A market analysis report covering all five candidate countries with ranked recommendations', quality: 'surface', points: 1, competencies: [], explanation: 'The GM asked for a single country recommendation. Presenting five with rankings defers the decision back to them and dilutes the recommendation credibility.' },
              { option_label: 'C', option_text: 'Recommended country, compliance status, and projected revenue', quality: 'good_but_incomplete', points: 2, competencies: ['creative_execution'], explanation: 'Core elements are there, but no risk section and no right-to-win rationale. A GM who pushes back on the recommendation has no material to engage with.' },
              { option_label: 'D', option_text: 'A process proposal for how to evaluate the decision over the next six months', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'The GM asked for a recommendation, not a process. Proposing more process is a signal that the team has not reached a defensible conclusion.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-microsoft-006',
    title: 'AI Feature Launch Risk Analysis for Enterprise Software',
    scenario_role: 'Senior PM, Microsoft 365 Copilot',
    scenario_context: 'Microsoft 365 Copilot is live for enterprise customers. Usage data shows that Copilot adoption in large organizations (10,000+ seats) plateaus at 35-45% of licensed users after 90 days. IT admins report that the primary blocker is concern about sensitive data appearing in AI-generated summaries sent outside the originating document context.',
    scenario_trigger: 'The Copilot leadership team is deciding whether to ship a new feature that automatically summarizes meeting recordings and distributes the summary to all meeting invitees, including external guests.',
    scenario_question: 'What are the most important risks and benefits to weigh before launching an automatic meeting summary feature in a Fortune 500 enterprise context?',
    engineer_standout: 'A strong engineer would identify data boundary violations as the category-one risk, distinguish between accidental disclosure (architectural) and policy violation (governance), and propose a permission model that defaults to explicit consent before external distribution.',
    paradigm: 'ai_assisted',
    industry: 'Productivity Software',
    sub_vertical: 'Enterprise AI',
    difficulty: 'advanced',
    estimated_minutes: 25,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['cognitive_empathy', 'creative_execution'],
    frameworks: ['Risk-Benefit Analysis', 'Trust by Design'],
    relevant_roles: ['pm', 'em', 'ml_eng', 'tech_lead'],
    company_tags: ['Microsoft', 'Copilot', 'Teams', 'OpenAI'],
    tags: ['ai', 'enterprise', 'risk', 'copilot', 'governance', 'data-privacy'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What category of risk is the most dangerous here, and what makes it different from a product bug?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the highest-severity risk category for an AI automatic meeting summary feature in enterprise?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Accuracy risk: the AI produces a summary that misrepresents what was decided in the meeting', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Accuracy is a real risk but it is recoverable: a wrong summary can be corrected. Data boundary violations are not recoverable once external disclosure occurs.' },
              { option_label: 'B', option_text: 'Data boundary risk: confidential information from the meeting reaches external guests who were not supposed to see it', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Data boundary violations are the category-one risk because they are irreversible, legally material under GDPR and enterprise data agreements, and directly compound the IT admin concern already blocking Copilot adoption.' },
              { option_label: 'C', option_text: 'Adoption risk: enterprise IT admins disable the feature before employees can use it', quality: 'surface', points: 1, competencies: [], explanation: 'Adoption risk is a business outcome, not a product risk category. It is downstream of the data boundary risk: admins block features precisely because they fear data exposure.' },
              { option_label: 'D', option_text: 'Liability risk: Microsoft gets sued by an enterprise customer whose data was exposed', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Legal liability is the consequence of data boundary violations, not a separate risk category. Naming the consequence instead of the cause confuses the risk analysis.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What are the distinct vectors through which a meeting summary feature could cause data boundary violations?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which list most completely maps the data boundary violation vectors for an automatic meeting summary?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['domain_expertise', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'External guest distribution; summary forwarding by an internal recipient; AI including sensitive content from shared documents cited during the meeting; cross-tenant calendar invites where the organizer company data goes to the guest tenant', quality: 'best', points: 3, competencies: ['domain_expertise', 'strategic_thinking'], explanation: 'Four structurally distinct vectors: direct external send, secondary internal forwarding, document context leakage, and cross-tenant propagation. A complete boundary model requires addressing all four.' },
              { option_label: 'B', option_text: 'External guest distribution and AI hallucinating confidential content that was never said', quality: 'surface', points: 1, competencies: ['domain_expertise'], explanation: 'Only covers one real vector and one implausible one. AI hallucination of confidential content is possible but far less likely than the architectural distribution vectors.' },
              { option_label: 'C', option_text: 'External guest distribution and summary forwarding by internal recipients', quality: 'good_but_incomplete', points: 2, competencies: ['domain_expertise'], explanation: 'Two of the four real vectors. Missing document context leakage and cross-tenant propagation, both of which are architectural, not behavioral, risks.' },
              { option_label: 'D', option_text: 'The summary includes personally identifiable information that violates GDPR', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'GDPR compliance is a constraint on the feature design, not a violation vector. Framing it as a vector conflates regulatory requirement with architectural risk.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'What permission model minimizes data boundary risk without making the feature so cumbersome that adoption stays at zero?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the right default and permission structure for automatic meeting summary distribution?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Default: internal attendees only. External distribution requires explicit organizer opt-in per meeting. IT admin can restrict to internal-only at the tenant level.', quality: 'best', points: 3, competencies: ['strategic_thinking', 'creative_execution'], explanation: 'Restricts the highest-risk vector by default, gives organizers contextual control, and gives IT admins a policy override. Three tiers of control at the right granularity. Directly addresses the IT admin concern blocking Copilot adoption.' },
              { option_label: 'B', option_text: 'Default: all invitees including external guests. Users can remove external recipients before the summary sends.', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Opt-out defaults for external distribution are the exact pattern IT admins have flagged as unsafe. The burden of action should not be on the user to prevent accidental external disclosure.' },
              { option_label: 'C', option_text: 'Default: off for all users. IT admin must enable for each department.', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Safe from a data perspective but will result in near-zero adoption because IT admin enablement cycles take months. It does not create a path to self-serve enterprise usage.' },
              { option_label: 'D', option_text: 'Default: internal attendees only. No external distribution option regardless of organizer preference.', quality: 'surface', points: 1, competencies: ['domain_expertise'], explanation: 'Safe but over-restrictive. Removes legitimate use cases (customers sharing meeting summaries with partners) and may push users toward less secure alternatives.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you frame the launch recommendation to Copilot leadership in a way that addresses the adoption plateau?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the right launch recommendation for the automatic meeting summary feature?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Launch with internal-only defaults, explicit per-meeting external opt-in, and IT admin tenant policy. Position the permission model as the launch story for enterprise IT buyers, since it directly addresses the concern blocking Copilot adoption.', quality: 'best', points: 3, competencies: ['strategic_thinking', 'creative_execution'], explanation: 'Turns the safety constraint into a product narrative. Enterprise IT buyers respond to trust signals; leading with the permission model converts a limitation into a competitive advantage against tools with weaker controls.' },
              { option_label: 'B', option_text: 'Delay launch until the data boundary risks are fully mitigated through additional engineering work', quality: 'surface', points: 1, competencies: [], explanation: 'Indefinite delay is not a recommendation. The permission model proposed already mitigates the primary data boundary risks; further delay has an adoption cost without a clear safety benefit.' },
              { option_label: 'C', option_text: 'Launch as a premium Copilot add-on to signal enterprise quality and justify additional pricing', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Premium tier pricing does not reduce data boundary risk. IT admins are blocking on safety, not budget. Adding a paywall to a safety feature creates perverse incentives.' },
              { option_label: 'D', option_text: 'Launch in preview to 10 enterprise customers with shared governance commitments before general availability', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Limited preview is a reasonable validation step but does not constitute a launch recommendation. Leadership needs a path to GA, not just a pilot plan.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-apple-001',
    title: 'Improving Core App Performance in a New Market',
    scenario_role: 'Senior Engineer, Apple Platform',
    scenario_context: 'Apple Maps expanded into Southeast Asia in 2023, adding local transit, walking, and cycling data for major cities. Engagement data from the first 12 months shows route completion rate (users who follow a navigation route to its endpoint) is 41% lower in Jakarta than in comparable Western European cities.',
    scenario_trigger: 'The regional team flags that Jakarta users frequently abandon Maps mid-navigation and switch to Grab or Google Maps. Exit surveys are not available, but the support team has escalated complaints about missing transit connections and incorrect traffic data.',
    scenario_question: 'How would you assess and improve Apple Maps performance in Jakarta without access to direct user exit data?',
    engineer_standout: 'A strong engineer would recognize that route completion rate is a downstream metric and propose instrumenting the failure points in the navigation graph: first leg completion, turn compliance rate, and rerouting frequency, to triangulate where users abandon and why.',
    paradigm: 'traditional',
    industry: 'Consumer Technology',
    sub_vertical: 'Mapping and Navigation',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['domain_expertise', 'strategic_thinking'],
    secondary_competencies: ['cognitive_empathy'],
    frameworks: ['Funnel Analysis', 'Root Cause Diagnosis'],
    relevant_roles: ['swe', 'tech_lead', 'pm', 'data_eng'],
    company_tags: ['Apple', 'Google Maps', 'Grab'],
    tags: ['product-improvement', 'mobile', 'navigation', 'localization', 'data'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'Route completion rate is the symptom. What are the plausible root causes upstream of it?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate root cause framing for the Jakarta route completion gap?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Jakarta users prefer Grab because of habit and brand loyalty, making this a competitive perception problem rather than a product quality problem', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Habit and preference are real factors but do not explain the 41-point gap versus European cities. If it were purely competitive, the gap would exist everywhere, not specifically in Jakarta.' },
              { option_label: 'B', option_text: 'Apple Maps data quality for Jakarta transit is materially lower than for Western European cities, causing routes to fail or be unreliable mid-navigation', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Data quality gap is the most parsimonious explanation for a city-specific completion rate gap. Western European cities have had Apple Maps coverage since 2012; Jakarta is a 2023 expansion with less time to accumulate ground truth corrections.' },
              { option_label: 'C', option_text: 'Jakarta has more complex traffic patterns that Apple Maps cannot model accurately', quality: 'good_but_incomplete', points: 2, competencies: ['domain_expertise'], explanation: 'Traffic complexity is a plausible contributing factor, but it does not distinguish between a data quality problem and a routing algorithm problem. Both would need different fixes.' },
              { option_label: 'D', option_text: 'The Apple Maps UI is not localized for Indonesian language and navigation conventions', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'Localization is a real concern but it would affect all Southeast Asian markets similarly. If the gap is specific to Jakarta, localization is unlikely to be the primary driver.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'Without exit survey data, what instrumentation would tell you where in a navigation session users abandon?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of diagnostic signals best triangulates where and why Jakarta users abandon navigation?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['domain_expertise', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'First-leg completion rate; rerouting frequency per session; turn compliance rate (GPS track vs. instructed turns); transit connection gap detection (time between end of one leg and start of next)', quality: 'best', points: 3, competencies: ['domain_expertise', 'strategic_thinking'], explanation: 'Four granular signals that each narrow a different failure mode: first-leg completion surfaces early abandonment, rerouting frequency signals route quality, turn compliance distinguishes instruction errors from user discretion, and transit gap detection directly tests the support team complaint.' },
              { option_label: 'B', option_text: 'Session length distribution and average distance navigated before abandonment', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'Distance navigated helps locate where in a route users drop off, but does not diagnose why. These metrics describe the pattern without explaining the cause.' },
              { option_label: 'C', option_text: 'User app store reviews in Indonesia and in-app feedback submissions', quality: 'surface', points: 1, competencies: ['cognitive_empathy'], explanation: 'Qualitative feedback is biased toward extreme opinions and covers only the minority of users who actively submit feedback. It cannot provide the sample size to diagnose a systematic data quality issue.' },
              { option_label: 'D', option_text: 'DAU/MAU for Apple Maps in Jakarta versus Google Maps market share estimates', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Market share comparison tells you Apple Maps is underperforming, which you already know. It does not tell you what to fix.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'If data shows transit connection gaps are the primary failure mode, what is the fastest fix path and what do you give up?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'Transit connection gap data confirms that 38% of multi-modal routes fail at the connection between ride-share and bus. What is the right fix?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Partner with Grab to import real-time ride-share wait time data into Apple Maps routing, so connection windows are calculated from live estimates rather than static timetables', quality: 'best', points: 3, competencies: ['strategic_thinking', 'creative_execution'], explanation: 'Root cause fix: connection gaps occur because static timetables cannot account for variable ride-share wait times. Live data from Grab closes the accuracy gap without requiring Apple to rebuild the local transit database.' },
              { option_label: 'B', option_text: 'Add 15-minute buffer windows to all ride-share to transit connections in Jakarta routing', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Buffers reduce failure rate but make all routes longer, reducing Maps competitiveness on speed. It is a mitigation, not a root cause fix.' },
              { option_label: 'C', option_text: 'Remove multi-modal routes that include ride-share segments until the data quality issue is resolved', quality: 'surface', points: 1, competencies: [], explanation: 'Removing the failing routes eliminates the data quality problem but also eliminates the primary use case for navigation in a city where ride-share and transit are deeply integrated.' },
              { option_label: 'D', option_text: 'Launch a crowdsourced reporting feature so Jakarta users can flag incorrect connection times', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Crowdsourcing is a long-cycle feedback loop that will take months to improve data quality. With a 38% failure rate, you need a structural fix, not a feedback mechanism.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'What does the improvement roadmap look like, and how do you measure success at 90 days?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the right 90-day success metric for the Jakarta Maps improvement effort?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Multi-modal route completion rate in Jakarta narrows the gap to within 15 percentage points of the Western European baseline, with transit connection failure rate below 10%', quality: 'best', points: 3, competencies: ['strategic_thinking', 'domain_expertise'], explanation: 'Two metrics: the headline completion rate tracks user outcomes, and the transit connection failure rate tracks the specific fix. Both are measurable at 90 days and directly test whether the intervention worked.' },
              { option_label: 'B', option_text: 'Jakarta DAU for Apple Maps increases 20% versus the pre-fix baseline', quality: 'good_but_incomplete', points: 2, competencies: ['strategic_thinking'], explanation: 'DAU increase is a relevant outcome but is influenced by many variables beyond route quality. It would not clearly confirm that the transit fix was the driver.' },
              { option_label: 'C', option_text: 'App store rating in Indonesia improves from 3.2 to 4.0 stars', quality: 'surface', points: 1, competencies: [], explanation: 'App store ratings are slow, noisy, and influenced by factors unrelated to transit navigation. Not a reliable 90-day metric for a specific feature fix.' },
              { option_label: 'D', option_text: 'Grab partnership signed and data integration shipped on schedule', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Shipping the integration is a milestone, not a success metric. You could ship the integration and still see no improvement in completion rate if the data is wrong.' },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-apple-002',
    title: 'Redesigning iPad Notes for Collaboration',
    scenario_role: 'Product Engineer, Apple Productivity',
    scenario_context: 'iPad Notes has powerful individual features: handwriting with Apple Pencil, inline attachments, smart folders, and Quick Note. Collaboration usage (shared notes, collaborative sessions) is 8% of active users versus 34% in comparable iOS productivity apps like GoodNotes and Notability after they added real-time collab features.',
    scenario_trigger: 'An internal review shows that 71% of iCloud shared note links are opened but the recipient never writes anything. The collaboration feature exists but the workflow breaks at the transition from viewer to contributor.',
    scenario_question: 'How would you redesign the iPad Notes collaboration experience to close the viewer-to-contributor gap?',
    engineer_standout: 'A strong engineer would identify this as a permission-and-entry-point problem rather than a feature parity problem, and propose a contextual contribution mode that reduces friction at the exact moment a viewer wants to write rather than adding more collab features.',
    paradigm: 'traditional',
    industry: 'Consumer Technology',
    sub_vertical: 'Productivity Apps',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['taste', 'cognitive_empathy'],
    secondary_competencies: ['creative_execution', 'strategic_thinking'],
    frameworks: ['Jobs To Be Done', 'Friction Mapping'],
    relevant_roles: ['swe', 'pm', 'tech_lead'],
    company_tags: ['Apple', 'GoodNotes', 'Notion', 'Notability'],
    tags: ['product-design', 'collaboration', 'ipad', 'notes', 'ux'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'The data says 71% of shared note recipients never write anything. What does that tell you about where the real problem is?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate diagnosis of the viewer-to-contributor problem in iPad Notes?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['cognitive_empathy', 'taste'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Notes lacks the real-time presence indicators and commenting features that competitors have, so recipients do not feel there is a live collaboration experience to join', quality: 'good_but_incomplete', points: 2, competencies: ['taste'], explanation: 'Feature parity is a plausible factor, but the data shows the problem is specifically at the viewer-to-contributor transition, not at discovery. People are opening the link; they just never write.' },
              { option_label: 'B', option_text: 'The entry point from viewer mode to edit mode is unclear or requires too many steps, creating friction at the exact moment a recipient wants to contribute', quality: 'best', points: 3, competencies: ['cognitive_empathy', 'taste'], explanation: 'The 71% statistic is a direct signal about the transition moment. Recipients open the note, intend to contribute, and abandon. This is a friction-mapping problem, not a feature-parity problem.' },
              { option_label: 'C', option_text: 'Recipients do not understand that they have edit permission, so they read passively and assume it is view-only', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Permission ambiguity is real and overlaps with the entry point problem, but it is a subset of the friction diagnosis. Adding an edit permission indicator is one fix, but not a complete one.' },
              { option_label: 'D', option_text: 'iPad Notes is perceived as a personal tool, so people do not think of it as a place for collaborative work', quality: 'surface', points: 1, competencies: [], explanation: 'Brand perception is a long-cycle problem that does not explain why 29% of recipients do contribute. If perception were the blocker, the number would be closer to zero.' },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What are the distinct design interventions that could reduce friction at the viewer-to-contributor transition?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of design directions addresses the viewer-to-contributor transition most distinctly?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'taste'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Contextual edit affordance (tap anywhere to contribute, with a visual invitation); designated contribution zones (sections the owner marks as open for additions); inline comment threading without requiring full edit permission', quality: 'best', points: 3, competencies: ['creative_execution', 'taste'], explanation: 'Three structurally distinct intervention points at the entry friction moment: reducing the tap-to-edit barrier, giving structure to where contributions belong, and offering a lower-commitment contribution mode (commenting) that does not require full edit.' },
              { option_label: 'B', option_text: 'Real-time presence indicators, live cursor tracking, and voice annotation', quality: 'surface', points: 1, competencies: ['taste'], explanation: 'These are feature-parity additions that address collaboration richness once users are already contributing. None reduce the friction at the initial viewer-to-contributor transition.' },
              { option_label: 'C', option_text: 'Contextual edit affordance and inline comment threading', quality: 'good_but_incomplete', points: 2, competencies: ['creative_execution'], explanation: 'Two strong directions, but missing the contribution zone design, which gives the owner a way to structure the collaboration and signal where input is expected.' },
              { option_label: 'D', option_text: 'A redesigned share sheet that defaults to edit permissions instead of view-only', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Defaulting to edit permissions changes the share initiation side, not the recipient experience. The data shows recipients who already have edit access still do not contribute.' },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'If you build contextual contribution zones, what is the tradeoff with the owner experience?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the primary tradeoff in adding contribution zones versus a tap-anywhere-to-edit model?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['taste', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'Contribution zones give owners structural control and reduce chaos in collaborative notes, but require the owner to set up the structure before sharing, adding friction on the send side', quality: 'best', points: 3, competencies: ['taste', 'strategic_thinking'], explanation: 'Names both the gain (owner control, structured collaboration) and the sacrifice (setup friction). This is the core tradeoff: contribution zones only work if owners use them, which requires behavioral change on the send side.' },
              { option_label: 'B', option_text: 'Contribution zones are harder to implement than tap-anywhere editing', quality: 'surface', points: 1, competencies: [], explanation: 'Engineering complexity is not a product tradeoff. It informs timeline and cost, but the product decision should be driven by user experience tradeoffs.' },
              { option_label: 'C', option_text: 'Tap-anywhere editing is more familiar to users who have used Google Docs', quality: 'good_but_incomplete', points: 2, competencies: ['cognitive_empathy'], explanation: 'Familiarity is a real adoption argument for tap-anywhere editing, but this only names one side of the tradeoff without identifying what is lost with tap-anywhere (no structural guidance for contributors).' },
              { option_label: 'D', option_text: 'Contribution zones create more privacy risk because they signal which parts of the note are sensitive', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'Privacy risk is not a meaningful tradeoff here. Notes are already shared with recipients; contribution zones do not expose any information the recipient does not already have access to.' },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'What would you ship in v1, and how would you know in 60 days whether it worked?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the right v1 scope and 60-day success metric for the collaboration redesign?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              { option_label: 'A', option_text: 'v1: contextual tap-to-edit affordance with an explicit "Add your notes here" prompt for recipients. Success metric: viewer-to-contributor conversion rate above 35% within 60 days (versus 29% baseline).', quality: 'best', points: 3, competencies: ['creative_execution', 'strategic_thinking'], explanation: 'Scopes v1 to the single highest-friction moment, sets a specific numerical threshold that is ambitious but achievable, and runs against the exact baseline from the internal review data. No contribution zones in v1 avoids owner-side setup friction while validating the core entry point hypothesis.' },
              { option_label: 'B', option_text: 'v1: full suite of contribution zones, inline comments, and tap-to-edit. Success metric: DAU growth in iPad Notes collaboration feature.', quality: 'surface', points: 1, competencies: [], explanation: 'Full suite in v1 is too broad to isolate which change drives the improvement. DAU growth is a lagging metric that conflates many signals.' },
              { option_label: 'C', option_text: 'v1: inline comment threading without full edit permission. Success metric: percentage of shared notes that receive at least one comment.', quality: 'good_but_incomplete', points: 2, competencies: ['creative_execution'], explanation: 'Comments are a valid lower-commitment contribution mode, but the metric measures volume without a baseline comparison. Missing the 29% starting point makes it impossible to evaluate improvement.' },
              { option_label: 'D', option_text: 'Run a 30-day user study with 50 iPad users to validate the friction hypothesis before shipping anything.', quality: 'plausible_wrong', points: 0, competencies: [], explanation: 'The 71% open-but-no-contribution statistic from iCloud data is a sufficient behavioral signal. A 50-person study adds delay without meaningfully increasing confidence in a hypothesis that is already supported by product data.' },
            ],
          },
        ],
      },
    ],
  },
] as const

// ── Insertion logic ────────────────────────────────────────────

async function seed() {
  console.log('Seeding batch 5 FLOW challenges (Microsoft + Apple)...\n')

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
