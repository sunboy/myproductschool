export const CHALLENGES = [
  {
    id: 'hp-google-youtube-first-creators',
    title: 'YouTube for First-Time Creators',
    scenario_role: 'Staff Product Engineer, YouTube Creator Studio',
    scenario_context:
      'YouTube has 800M+ videos but ~70% of new creator accounts go dark within 90 days. Creator Studio telemetry shows the median new creator publishes 1.4 videos, then stops. The tools have improved; the abandonment rate has not.',
    scenario_trigger:
      'A quarterly review flagged that creator D7 retention dropped 8 points YoY despite the new upload flow shipping in Q3.',
    scenario_question: 'How would you improve YouTube for first-time creators?',
    engineer_standout:
      'Ground improvements in the specific failure mode: new creators abandon because early feedback loops are invisible, not because publishing is hard.',
    paradigm: 'traditional',
    industry: 'Media & Entertainment',
    sub_vertical: 'Creator Platforms',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['user_empathy', 'product_sense'],
    secondary_competencies: ['metrics_reasoning', 'prioritization'],
    frameworks: ['Jobs To Be Done', 'Opportunity Solution Tree'],
    relevant_roles: ['tech_lead', 'staff_engineer', 'swe'],
    company_tags: ['Google', 'YouTube'],
    tags: ['creator_tools', 'retention', 'onboarding', 'feedback_loops'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'Before listing features, what does the data tell you about why first-time creators actually stop?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most likely root cause of the 8-point drop in creator D7 retention?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['user_empathy', 'metrics_reasoning'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'First-time creators have no signal that their video reached anyone. Zero views in the first 48 hours looks identical to a publish failure, so they assume the system is broken and stop.',
                quality: 'best',
                points: 3,
                competencies: ['user_empathy', 'metrics_reasoning'],
                explanation:
                  'The D7 drop aligns with the "no feedback" hypothesis: a creator who sees nothing after publishing has no reason to return. Distinguishing zero-reach from zero-effort is the specific insight that unlocks the right interventions.',
              },
              {
                option_label: 'B',
                option_text:
                  'The new upload flow introduced friction that discourages repeat publishing. The Q3 rollout timing matches the retention drop.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_sense'],
                explanation:
                  'Correlation with the Q3 upload flow is tempting, but the 1.4-video median and 90-day abandonment predate this build. The upload path is downstream of the core problem.',
              },
              {
                option_label: 'C',
                option_text:
                  'YouTube\'s recommendation algorithm under-surfaces new creator content, so their videos get few views and they disengage.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_sense'],
                explanation:
                  'Distribution is a real barrier, but it is a structural constraint, not the specific cause of the D7 drop. A creator who knew their video had 20 views might still return; the problem is invisibility, not volume.',
              },
              {
                option_label: 'D',
                option_text:
                  'Creator Studio lacks enough educational content to help first-timers improve their craft, so they give up.',
                quality: 'surface',
                points: 1,
                competencies: ['user_empathy'],
                explanation:
                  'Craft improvement matters later in the journey. At day 7, creators have not had time to identify a skill gap; they are still looking for confirmation that publishing was worth attempting.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'Consider structural shifts, not feature checklists. What fundamentally changes the first-creator feedback loop?',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of improvements most directly addresses the broken feedback loop for first-time creators?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['product_sense', 'user_empathy'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'A "First 48" dashboard surfaced in Creator Studio immediately after publish: real-time view count, estimated unique viewers, top traffic source, and a milestone prompt at 10 views. Small but concrete.',
                quality: 'best',
                points: 3,
                competencies: ['product_sense', 'user_empathy'],
                explanation:
                  'This directly collapses the silence window. A creator who sees "8 people found your video through search" understands the system is working and has a reason to publish again. The 10-view milestone creates a concrete achievable goal rather than a comparison to established channels.',
              },
              {
                option_label: 'B',
                option_text:
                  'A guided "30-day creator challenge" with prompts, templates, and badges that reward consistent uploads.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_sense'],
                explanation:
                  'Gamification can extend engagement for creators who have already returned, but it does not address the silence after the first video. A creator who abandoned on day 3 never sees day 4\'s prompt.',
              },
              {
                option_label: 'C',
                option_text:
                  'Improved mobile upload experience with auto-chapter detection, thumbnail suggestions, and shorter publish time.',
                quality: 'surface',
                points: 1,
                competencies: ['product_sense'],
                explanation:
                  'Upload friction is a real problem, but the 1.4-video median suggests creators are not struggling to upload. They are struggling to find a reason to upload a second time.',
              },
              {
                option_label: 'D',
                option_text:
                  'A "creator match" program that pairs new creators with mentors who have 10K-50K subscribers.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['user_empathy'],
                explanation:
                  'Mentor programs have high coordination cost and do not scale to the millions of new accounts that go dark each quarter. The feedback gap is a product problem, not a community support problem.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'A good improvement makes an explicit trade. What does "First 48" dashboard sacrifice, and why is that the right call?',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the key trade-off in prioritizing the "First 48" dashboard over other creator improvements?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['prioritization', 'product_sense'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'It optimizes for the D1-D7 window at the cost of mid-funnel creator growth features (channel analytics, A/B title testing) that help established creators. That is the right sacrifice because D7 retention is the gating metric for the entire creator funnel.',
                quality: 'best',
                points: 3,
                competencies: ['prioritization', 'metrics_reasoning'],
                explanation:
                  'Naming both the sacrifice (mid-funnel tooling) and the reason (gating metric) is what distinguishes a prioritization decision from a wish list. Established creator features improve an already-retained cohort; first 48 hours improvements expand the base that makes it to week 2.',
              },
              {
                option_label: 'B',
                option_text:
                  'It may increase low-quality content uploads by making the first publish feel rewarding even for bad videos.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_sense'],
                explanation:
                  'This conflates creator retention with content quality. The recommendation algorithm surfaces quality; creator retention tooling is a separate system. Penalizing creators for low initial views via silence is not a content quality lever.',
              },
              {
                option_label: 'C',
                option_text:
                  'The dashboard requires significant engineering work for real-time data pipelines, which could delay other monetization features.',
                quality: 'surface',
                points: 1,
                competencies: ['prioritization'],
                explanation:
                  'Implementation cost is a real consideration, but it is not the trade-off. This answer identifies a constraint without evaluating whether the constraint changes the decision.',
              },
              {
                option_label: 'D',
                option_text:
                  'Showing raw view counts to new creators might discourage them if numbers are low compared to popular videos.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['user_empathy'],
                explanation:
                  'Framing matters, and this risk is real. But it is a design detail (milestone framing vs. absolute counts) rather than a strategic trade-off. The trade-off is about which cohort you invest in, not how you frame a number.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'What is the single metric that tells you within 90 days whether this shipped successfully?',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text: 'How would you define success for the "First 48" dashboard after a 90-day rollout?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning', 'product_sense'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Creator D7 retention for accounts that published their first video during the rollout period increases by 15% relative to the pre-rollout cohort, with no regression in D30 video publish rate.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning'],
                explanation:
                  'This is testable, cohort-scoped, and directly maps to the problem statement. The D30 guardrail catches interventions that inflate early retention without building a genuine habit.',
              },
              {
                option_label: 'B',
                option_text:
                  'Dashboard views per new creator account reach an average of 3 sessions in the first week post-publish.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Engagement with the dashboard is a leading indicator, not the outcome. Creators can look at the dashboard and still abandon. The success metric should be the behavior (publishing again), not the feature usage.',
              },
              {
                option_label: 'C',
                option_text:
                  'Overall monthly active creator count increases by 5% within the quarter.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'MAC is too lagged and too broad to attribute to one feature. It conflates new creator activation, existing creator retention, and reactivation. Ninety days is also a short window for MAC movement.',
              },
              {
                option_label: 'D',
                option_text:
                  'Creator satisfaction NPS for the Studio experience improves by 5 points in the next quarterly survey.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics_reasoning'],
                explanation:
                  'NPS surveys reach retained users who are still logging in. Abandoned creators do not respond to quarterly surveys, so this metric has survivorship bias that obscures the exact cohort the feature targets.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hp-google-wau-notification-conflict',
    title: 'WAU Up, Notification Open Rate Down',
    scenario_role: 'Tech Lead, Google Search Notifications',
    scenario_context:
      'A Google product review showed weekly active users climbing 5% this quarter while notification open rate fell 2% over the same period. Both signals are from the same user cohort on Android.',
    scenario_trigger:
      'The growth team flagged the divergence in yesterday\'s metrics digest and is asking for a diagnosis before the next sprint planning.',
    scenario_question:
      'Weekly active users are up 5% but notification open rates are down 2%. What would you investigate?',
    engineer_standout:
      'Recognize that these two metrics can move in opposite directions for structural reasons, not just user dissatisfaction.',
    paradigm: 'traditional',
    industry: 'Technology',
    sub_vertical: 'Search & Ads',
    difficulty: 'standard',
    estimated_minutes: 18,
    primary_competencies: ['metrics_reasoning', 'analytical_thinking'],
    secondary_competencies: ['product_sense', 'user_empathy'],
    frameworks: ['5 Whys', 'Metric Decomposition'],
    relevant_roles: ['tech_lead', 'staff_engineer', 'swe'],
    company_tags: ['Google'],
    tags: ['metrics', 'notifications', 'engagement', 'diagnosis'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'What relationship between WAU and notification open rate would make this divergence expected rather than alarming?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most structurally sound framing of the WAU-up, notification-open-down divergence?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning', 'analytical_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Higher WAU means more users are opening the app directly, reducing the marginal value of a notification tap. Users who are already active have less reason to click a notification, so open rate naturally compresses as the active base grows.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning', 'analytical_thinking'],
                explanation:
                  'This is a supply-demand framing: as direct engagement rises, the notification becomes redundant for active users. The divergence is the expected outcome of growing DAU/WAU, not a signal that notifications are broken.',
              },
              {
                option_label: 'B',
                option_text:
                  'Notification content has degraded in quality or relevance, causing users to ignore alerts while still using the product through other entry points.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_sense'],
                explanation:
                  'Content quality is a real hypothesis, but it does not explain the structural relationship. This answer treats the divergence as a problem rather than examining whether it is the expected outcome of WAU growth.',
              },
              {
                option_label: 'C',
                option_text:
                  'Android notification permission changes in a recent OS update may have restricted delivery to a subset of users.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['analytical_thinking'],
                explanation:
                  'Platform changes are worth checking, but an OS restriction would reduce both delivery and opens proportionally. It would not explain WAU rising at the same time unless there were a confounding variable.',
              },
              {
                option_label: 'D',
                option_text:
                  'The 5% WAU increase and 2% open rate decrease are within normal variance and may not require investigation.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Dismissing a signal without decomposing it is not analysis. The right move is to determine whether the divergence is structural or symptomatic, not to assume it is noise.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'List the specific slices you would cut first to distinguish a structural explanation from a notification quality problem.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of diagnostic cuts would most efficiently distinguish a structural cause from a notification quality issue?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['analytical_thinking', 'metrics_reasoning'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Segment notification open rate by user activity tier (daily, weekly, monthly active). If the drop is concentrated in daily actives while lapsing users hold steady, the structural explanation holds. If the drop is uniform, content quality is suspect.',
                quality: 'best',
                points: 3,
                competencies: ['analytical_thinking', 'metrics_reasoning'],
                explanation:
                  'This cut directly tests the structural hypothesis. Daily actives have the least reason to tap a notification, so their open rate should fall first if WAU growth is the cause. Uniform drops across cohorts point to delivery or content problems instead.',
              },
              {
                option_label: 'B',
                option_text:
                  'Run an A/B test with improved notification copy and personalized content to see if open rates recover.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_sense'],
                explanation:
                  'Running an experiment before diagnosing the root cause risks shipping the wrong solution. If the drop is structural, better copy will not change the outcome and the team wastes a sprint.',
              },
              {
                option_label: 'C',
                option_text:
                  'Check notification delivery rates, opt-out rates, and OS-level permission grant rates over the same period.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['analytical_thinking'],
                explanation:
                  'Infrastructure checks are part of a thorough diagnosis, but they do not test the structural hypothesis. They should be done in parallel, not as the primary cut.',
              },
              {
                option_label: 'D',
                option_text:
                  'Survey users who stopped opening notifications to understand what types of alerts they find irrelevant.',
                quality: 'surface',
                points: 1,
                competencies: ['user_empathy'],
                explanation:
                  'Surveys provide qualitative signal but are slow and suffer from recall bias. They are useful after the quantitative cuts have narrowed the hypothesis space.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'If the structural explanation holds, what would you change about notifications, and what would you not change?',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text: 'If activity-tier segmentation confirms the structural explanation, what is the right optimization?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['product_sense', 'prioritization'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Suppress notifications to daily actives who opened the app in the last 4 hours, and reallocate that send budget toward lapsing weekly actives where notification-driven reactivation has higher marginal value.',
                quality: 'best',
                points: 3,
                competencies: ['product_sense', 'prioritization'],
                explanation:
                  'This converts the diagnosis directly into a product decision. Notifications as a re-engagement tool have higher ROI on lapsing users; sending to already-active users inflates send volume, trains users to ignore alerts, and may accelerate opt-outs.',
              },
              {
                option_label: 'B',
                option_text:
                  'Increase notification frequency to daily actives with more personalized content to improve open rates back to baseline.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_sense'],
                explanation:
                  'More notifications to already-active users will likely increase opt-outs, not open rates. The baseline open rate was set when the active user mix was different; trying to restore it is chasing the wrong number.',
              },
              {
                option_label: 'C',
                option_text:
                  'Accept the lower open rate as a healthy byproduct of WAU growth and deprioritize notification optimization entirely.',
                quality: 'surface',
                points: 1,
                competencies: ['prioritization'],
                explanation:
                  'The structural insight is correct but the conclusion is premature. There is still value in optimizing notification targeting for lapsing cohorts; structural acceptance does not mean nothing can be improved.',
              },
              {
                option_label: 'D',
                option_text:
                  'Switch from push notifications to in-app banners for daily actives, since they are already in the app.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_sense'],
                explanation:
                  'In-app surfaces make sense for active users, but this is a channel decision without a targeting strategy. The stronger move combines suppression with reallocation rather than just swapping channels.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'What single metric would you use to confirm the optimization worked, and what is your success threshold?',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text: 'How would you define a successful outcome for the notification suppression and reallocation strategy?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Notification-driven reactivation rate for lapsing weekly actives increases by 10% with no change in overall opt-out rate, measured over a 30-day holdout.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning'],
                explanation:
                  'This metric targets the cohort where reallocation has the highest marginal value and includes a guardrail against user backlash. The holdout window is long enough to capture reactivation cycles.',
              },
              {
                option_label: 'B',
                option_text:
                  'Overall notification open rate recovers to pre-WAU-growth baseline within 60 days.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Restoring the old open rate is the wrong goal if the decline was structural. A higher open rate achieved by suppressing sends to active users is a vanity metric, not a health signal.',
              },
              {
                option_label: 'C',
                option_text:
                  'WAU continues to grow while notification opt-out rate remains flat.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Flat opt-out is a guardrail, not a success metric. This answer confirms we did not cause harm but does not confirm the reallocation created value.',
              },
              {
                option_label: 'D',
                option_text:
                  'Notification send volume decreases by 20% (suppression working) while overall engagement metrics hold steady.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Send reduction is an output metric, not an outcome metric. Sending fewer notifications and having engagement hold steady confirms the suppressed sends had no incremental value, but it does not confirm the reallocation improved outcomes for lapsing users.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hp-google-search-ads-revenue-vs-engagement',
    title: 'Search Ad Revenue Up, Total Searches Down',
    scenario_role: 'Staff Engineer, Google Search Monetization',
    scenario_context:
      'After Google increased ad density in search results from 3 top slots to 4, quarterly ad revenue grew 8%. Over the same period, total search query volume fell 3% and average session length dropped 6%. Leadership is debating whether to hold the new density or roll back.',
    scenario_trigger:
      'An internal memo from the Search Integrity team flagged the query volume decline as a potential signal of user trust erosion, triggering an escalation to the next VP review.',
    scenario_question:
      'Revenue is up after increasing search ads, but total searches are down. Is this good or bad?',
    engineer_standout:
      'Frame this as a long-run vs. short-run monetization question, not a binary good/bad judgment.',
    paradigm: 'traditional',
    industry: 'Technology',
    sub_vertical: 'Search & Ads',
    difficulty: 'advanced',
    estimated_minutes: 22,
    primary_competencies: ['metrics_reasoning', 'strategic_thinking'],
    secondary_competencies: ['analytical_thinking', 'prioritization'],
    frameworks: ['Metric Decomposition', 'Long-term vs Short-term Tradeoff'],
    relevant_roles: ['staff_engineer', 'tech_lead', 'em'],
    company_tags: ['Google'],
    tags: ['metrics', 'monetization', 'search', 'ads', 'tradeoffs'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'Revenue and query volume are measuring different things. What does each signal actually represent for the long-term health of the business?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the revenue-up, searches-down divergence?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Revenue per query went up (more ads per SERP), while query frequency went down (users avoiding Google or finding answers faster). The divergence is classic supply-side monetization outpacing demand-side health, which is sustainable only until a substitute search surface captures the deflected queries.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning', 'strategic_thinking'],
                explanation:
                  'This decomposes revenue into rate vs. volume, which is the critical distinction. Higher revenue from more ads per page is reversible; a structural shift in query behavior toward ChatGPT, Perplexity, or Apple Intelligence is not. The risk frame is competitive substitution.',
              },
              {
                option_label: 'B',
                option_text:
                  'The result is good: Google has successfully increased the value extracted per user session, which is the core goal of monetization.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics_reasoning'],
                explanation:
                  'This is a static framing that ignores the volume signal. Maximizing revenue per session at the cost of session frequency is a common trap in two-sided markets where the demand side has alternatives.',
              },
              {
                option_label: 'C',
                option_text:
                  'The decline in search volume is bad and offsets the revenue gain, so the net effect is neutral.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Netting two different metrics obscures what matters. The more important question is whether the query decline is behavioral (users reforming habits) or mechanical (query compression from better zero-click answers).',
              },
              {
                option_label: 'D',
                option_text:
                  'The query volume drop is too small (3%) to be statistically meaningful against the 8% revenue gain, so this is a net positive.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['analytical_thinking'],
                explanation:
                  'Statistical significance is a valid concern but this answer stops at the number. A 3% query decline across billions of daily searches is a large absolute shift; the key question is the trend direction, not just the magnitude.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'What data cuts would help you separate a behavioral shift (users avoiding Google) from a structural one (better zero-click answers)?',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which diagnostic approach would best determine whether the query volume drop is a behavioral or structural change?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['analytical_thinking', 'metrics_reasoning'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Segment the query decline by query type (navigational, informational, transactional) and by user tenure. If the drop is concentrated in informational queries from long-tenured users, it suggests trust erosion or migration to AI-native search. If it is uniform, ad density is likely deflating session depth.',
                quality: 'best',
                points: 3,
                competencies: ['analytical_thinking', 'metrics_reasoning'],
                explanation:
                  'Navigational and transactional queries have high intent and high switching cost, so a drop there is a strong trust signal. Informational queries are where AI alternatives compete most directly. Tenure segmentation surfaces whether the most valuable users are the ones leaving.',
              },
              {
                option_label: 'B',
                option_text:
                  'Run a geo holdback: revert to 3 ads in one country market and measure whether query volume recovers.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['analytical_thinking'],
                explanation:
                  'A holdback is a strong causal test but takes weeks to run and requires a market-level decision. It should be the validation step after the behavioral hypothesis is confirmed, not the first diagnostic move.',
              },
              {
                option_label: 'C',
                option_text:
                  'Check whether competitor search engines (Bing, DuckDuckGo) saw query volume increases over the same period.',
                quality: 'surface',
                points: 1,
                competencies: ['strategic_thinking'],
                explanation:
                  'Competitor data would confirm migration but is not actionable in the short term. It also excludes AI-native alternatives that do not look like traditional search engines.',
              },
              {
                option_label: 'D',
                option_text:
                  'Analyze ad click-through rate trends. If CTR is falling despite more ad slots, users are ignoring the additional ads, which would explain the shorter sessions.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics_reasoning'],
                explanation:
                  'CTR measures ad effectiveness, not search behavior. Lower CTR on a fourth ad slot is expected (diminishing returns) and does not diagnose why total query volume fell.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'If informational queries from long-tenured users are leading the decline, what is the right optimization and what does it sacrifice?',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text: 'What optimization best balances short-term revenue with long-term query volume health?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['strategic_thinking', 'prioritization'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Cap the fourth ad slot to high-commercial-intent queries (product, local, travel) where ads add utility rather than noise. Sacrifice 2-3% of short-term revenue to defend query frequency among informational searchers, who are the session depth reservoir for the entire ads business.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'prioritization'],
                explanation:
                  'This separates queries where ad density has high user value from queries where it generates distrust. The sacrifice is explicit and sized, and the reasoning (session depth reservoir) connects the tactical decision to the long-term business model.',
              },
              {
                option_label: 'B',
                option_text:
                  'Roll back to 3 ad slots immediately to restore query volume before the erosion compounds.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['prioritization'],
                explanation:
                  'A full rollback foregoes 8% revenue without verifying the causal link between the fourth slot and query decline. A targeted cap is a more precise intervention.',
              },
              {
                option_label: 'C',
                option_text:
                  'Invest in AI Overviews quality to reduce zero-click rate, which will increase revenue per user without adding ad slots.',
                quality: 'surface',
                points: 1,
                competencies: ['strategic_thinking'],
                explanation:
                  'AI Overviews may actually accelerate zero-click behavior (users get answers without ads), making this a risky revenue bet. It also does not address the current ad density question.',
              },
              {
                option_label: 'D',
                option_text:
                  'Hold the current density and monitor for 2 more quarters before acting, since the trends are still small.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['prioritization'],
                explanation:
                  'Waiting on a behavioral trend that compounds is costly. If long-tenured users are forming new search habits, two more quarters of data means two more quarters of habit reinforcement for alternatives.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'What does the ideal outcome look like at 6 months, and how would you measure whether you got there?',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text: 'How would you define success for the targeted fourth-slot cap after 6 months?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Informational query volume stabilizes or recovers to within 1% of pre-change levels, high-intent query revenue holds at least 95% of the fourth-slot uplift, and session length decline reverses for long-tenured users.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Three metrics covering three different concerns: demand health, revenue retention, and engagement quality. The 95% revenue threshold acknowledges that some loss is acceptable; the session length reversal tests whether the behavioral damage is healing.',
              },
              {
                option_label: 'B',
                option_text:
                  'Total search query volume returns to pre-increase levels.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Total query volume is a reasonable outcome metric, but it does not distinguish recovery from the ad change versus macro search growth. A segment-level target is more attributable.',
              },
              {
                option_label: 'C',
                option_text:
                  'Net revenue is flat or growing despite the fourth-slot cap.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Revenue neutrality is necessary but not sufficient. If query volume keeps declining even with the cap, the damage is structural and revenue neutrality is temporary.',
              },
              {
                option_label: 'D',
                option_text:
                  'User satisfaction scores for search results quality improve by 5 points.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Satisfaction surveys are hard to attribute to a single change in a product that sees hundreds of experiments simultaneously. Behavioral metrics (query frequency, session depth) are more reliable than stated satisfaction for search quality decisions.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hp-google-youtube-creator-crowdout',
    title: 'Are Superstars Crowding Out Amateur Creators?',
    scenario_role: 'Staff Engineer, YouTube Ecosystem Health',
    scenario_context:
      'YouTube\'s creator distribution data shows that 85% of watch time flows to the top 0.1% of channels. New creator account growth is flat at 2% YoY, while superstar channel watch time share grew 12 points over 3 years.',
    scenario_trigger:
      'A platform health report flagged that channels with under 10K subscribers saw a 15% drop in average monthly watch time per channel over the past year.',
    scenario_question:
      'What data would you use to evaluate whether amateur creators are being crowded out by superstars?',
    engineer_standout:
      'Distinguish between structural engagement gravity (superstars have always been dominant) and algorithmic amplification (the recommendation system is widening the gap).',
    paradigm: 'traditional',
    industry: 'Media & Entertainment',
    sub_vertical: 'Creator Platforms',
    difficulty: 'advanced',
    estimated_minutes: 22,
    primary_competencies: ['metrics_reasoning', 'analytical_thinking'],
    secondary_competencies: ['product_sense', 'strategic_thinking'],
    frameworks: ['Metric Decomposition', 'Ecosystem Health Framework'],
    relevant_roles: ['staff_engineer', 'tech_lead', 'em'],
    company_tags: ['Google', 'YouTube'],
    tags: ['metrics', 'creator_economy', 'recommendation', 'ecosystem_health'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'What does "crowded out" actually mean for creators? Define it precisely before designing metrics.',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most precise definition of "crowding out" that is also measurable with YouTube\'s data?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning', 'analytical_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Crowding out means the recommendation algorithm is disproportionately routing watch time to superstars beyond what subscriber intent would predict. The measurable signal is the gap between "recommended impression share for <10K channels" and "direct/search session share for the same channels" — if algorithmic distribution is lower than intent-driven distribution, the algorithm is concentrating reach.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning', 'analytical_thinking'],
                explanation:
                  'This distinguishes preference (users choosing superstars) from amplification (the algorithm over-indexing superstars relative to expressed preference). That distinction is the entire question. Measuring it requires algorithmic impression share vs. direct traffic share by channel tier.',
              },
              {
                option_label: 'B',
                option_text:
                  'Crowding out means smaller creators are getting fewer views over time, which is shown by the 15% drop in monthly watch time for sub-10K channels.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'The watch time drop is a symptom, not a definition. Creators can get fewer views because superstars are better, because the algorithm over-amplifies superstars, or because viewer time is contracting. These require different responses.',
              },
              {
                option_label: 'C',
                option_text:
                  'Crowding out means the creator economy has become less economically viable for new entrants, evidenced by declining monetization rates for small channels.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Economic viability is a valid outcome, but it is a downstream consequence of reach dynamics. A reach-based definition is more directly attributable to YouTube\'s algorithmic choices.',
              },
              {
                option_label: 'D',
                option_text:
                  'Crowding out is inherent to platforms with network effects and is not specifically measurable — all platforms converge to power-law distributions.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['analytical_thinking'],
                explanation:
                  'Power-law distributions are common, but the rate of concentration change is measurable and relevant. If the top 0.1% share is growing 12 points over 3 years, that is a specific acceleration, not a static power-law fact.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'List the three most distinct metrics you would instrument to test the algorithmic amplification hypothesis.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of metrics most directly tests whether algorithmic amplification is widening the creator reach gap?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning', 'analytical_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Three metrics: (1) Recommendation impression share by channel subscriber tier, normalized by upload frequency. (2) Click-through rate on small-channel recommendations vs. superstar recommendations, to test whether users prefer superstars or just see more of them. (3) Subscriber growth rate for channels that appear in recommendations vs. those that do not.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning', 'analytical_thinking'],
                explanation:
                  'These three metrics test supply (how much the algorithm surfaces small channels), demand (whether users prefer superstars given equal surface), and outcome (whether algorithmic exposure converts to growth). Together they distinguish amplification from preference.',
              },
              {
                option_label: 'B',
                option_text:
                  'Track total watch time for channels under 10K subscribers, 10K-100K, 100K-1M, and over 1M, and compare growth rates across tiers.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Tiered watch time trends show the outcome but not the mechanism. Declining small-channel watch time is consistent with both amplification and genuine preference; the metrics need to separate these.',
              },
              {
                option_label: 'C',
                option_text:
                  'Survey creators about whether they feel the algorithm is fair, and compare responses across subscriber tiers.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['user_empathy'],
                explanation:
                  'Creator perception surveys are valuable for qualitative signal, but they cannot distinguish preference from amplification. Smaller creators will always perceive less algorithmic fairness, regardless of actual algorithm behavior.',
              },
              {
                option_label: 'D',
                option_text:
                  'Measure the Gini coefficient of watch time distribution on YouTube and track it over time.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'The Gini coefficient captures concentration but not causation. It does not distinguish whether concentration increased because of algorithmic choices, creator quality differences, or changing viewer habits.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'If the data confirms algorithmic amplification, what lever would you pull and what would you explicitly not do?',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text: 'If recommendation impression share confirms algorithmic amplification, what is the most defensible intervention?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['product_sense', 'prioritization'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Introduce a diversity floor in recommendations: require that X% of recommendations in any session come from channels with under 100K subscribers, tuned so session watch time does not drop more than 3%. This explicitly trades some efficiency for ecosystem health and is measurable.',
                quality: 'best',
                points: 3,
                competencies: ['product_sense', 'prioritization'],
                explanation:
                  'A diversity floor is a direct, tunable response to algorithmic concentration. The 3% watch time guardrail makes the trade-off explicit and prevents over-rotating. It is a structural intervention rather than a creator support program.',
              },
              {
                option_label: 'B',
                option_text:
                  'Launch a "Rising Creators" promotion program that manually curates and surfaces small channels to YouTube\'s homepage.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_sense'],
                explanation:
                  'Manual curation does not scale and introduces editorial bias. A systematic algorithm change is more durable than a promotion program that competes for editorial bandwidth.',
              },
              {
                option_label: 'C',
                option_text:
                  'Lower the monetization threshold from 1,000 subscribers to 500 to give small creators more economic incentive to stay on the platform.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['strategic_thinking'],
                explanation:
                  'Monetization threshold changes address economic viability, not reach. A creator with 500 subscribers who gets no recommendations is still not growing. This is a downstream intervention that does not address the causal mechanism.',
              },
              {
                option_label: 'D',
                option_text:
                  'Do nothing algorithmically, since users reveal preferences through watch behavior and overriding that with a diversity floor degrades experience.',
                quality: 'surface',
                points: 1,
                competencies: ['prioritization'],
                explanation:
                  'User preference is a valid concern, but the revealed preference argument only holds if users had a meaningful chance to discover small channels. If the algorithm never surfaces them, the preference data is incomplete.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'What does a healthy creator ecosystem look like 1 year after the diversity floor ships?',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text: 'How would you define and measure a healthy creator ecosystem 12 months after the diversity floor ships?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Creator D90 retention for new channels grows by at least 10%, the share of channels graduating from under-1K to 1K-10K subscribers in their first year increases, and overall session watch time declines by no more than 3%.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning', 'strategic_thinking'],
                explanation:
                  'Three distinct signals: early creator retention (commitment), graduation rate (algorithmic lift is converting to growth), and session watch time (guardrail against viewer experience degradation). Together they define a healthy ecosystem, not just a redistributed one.',
              },
              {
                option_label: 'B',
                option_text:
                  'The Gini coefficient of watch time distribution decreases from 0.95 to 0.90.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'A specific Gini target is measurable but does not connect to the underlying goal (creator supply health). Two platforms can have the same Gini with very different creator retention dynamics.',
              },
              {
                option_label: 'C',
                option_text:
                  'New channel creation grows by 20% YoY following the diversity floor announcement.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics_reasoning'],
                explanation:
                  'New account creation is easy to inflate with marketing and does not measure whether the platform works for creators. Account creation without retention is the exact problem being solved.',
              },
              {
                option_label: 'D',
                option_text:
                  'Average revenue per small creator (sub-10K channels) increases by 15%.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Revenue per creator is a valid outcome metric, but it can rise from monetization threshold changes rather than reach changes. It is a downstream signal that does not directly confirm the recommendation intervention worked.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hp-google-youtube-recommendation-algo',
    title: 'Improve YouTube\'s Recommendation Algorithm',
    scenario_role: 'Tech Lead, YouTube Recommendations',
    scenario_context:
      'YouTube\'s recommendation engine drives over 70% of watch time. Internal research shows that the current two-tower model optimizes primarily for immediate CTR and watch time completion, but a 2025 internal study found a 15% correlation between heavy recommendation sessions and users self-reporting "regret watching" in post-session surveys.',
    scenario_trigger:
      'A leadership review of the regret-watching study has prompted a mandate to propose a recommendation algorithm improvement that addresses user wellbeing without sacrificing engagement.',
    scenario_question: 'Improve YouTube\'s recommendation algorithm.',
    engineer_standout:
      'The real tension is between optimizing for completion rate (what the model measures) vs. satisfaction rate (what users actually value). Name the specific technical lever.',
    paradigm: 'ai_assisted',
    industry: 'Media & Entertainment',
    sub_vertical: 'Creator Platforms',
    difficulty: 'advanced',
    estimated_minutes: 25,
    primary_competencies: ['product_sense', 'analytical_thinking'],
    secondary_competencies: ['metrics_reasoning', 'strategic_thinking'],
    frameworks: ['Opportunity Solution Tree', 'North Star Metric'],
    relevant_roles: ['staff_engineer', 'tech_lead', 'em'],
    company_tags: ['Google', 'YouTube'],
    tags: ['recommendation', 'ml', 'engagement', 'wellbeing', 'algorithm'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'What is the model currently rewarding, and what is the gap between that signal and what users actually want?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the root cause of the regret-watching problem in the current recommendation model?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['analytical_thinking', 'product_sense'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'The two-tower model is trained on completion rate and CTR, which are correlated with compulsive viewing but not with retrospective satisfaction. A video that auto-plays at 11pm and is watched to completion scores identically to a video the user actively sought out and enjoyed.',
                quality: 'best',
                points: 3,
                competencies: ['analytical_thinking', 'product_sense'],
                explanation:
                  'This identifies the specific training signal mismatch. Completion rate is a proxy for engagement, but it does not distinguish intentional viewing from passive continuation. The model has no feedback on whether the user felt good about the session afterward.',
              },
              {
                option_label: 'B',
                option_text:
                  'YouTube recommends too much similar content, trapping users in filter bubbles that feel repetitive and unsatisfying over time.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_sense'],
                explanation:
                  'Topical concentration is a symptom of the optimization function, not the root cause. The model recommends similar content because similarity predicts CTR, not because diversity is intrinsically bad for users.',
              },
              {
                option_label: 'C',
                option_text:
                  'Autoplay removes user agency, causing passive consumption that users later regret.',
                quality: 'surface',
                points: 1,
                competencies: ['product_sense'],
                explanation:
                  'Autoplay is a UI feature that amplifies the recommendation problem but is not its root cause. Turning off autoplay would reduce total watch time without fixing the model\'s inability to distinguish regret-inducing content.',
              },
              {
                option_label: 'D',
                option_text:
                  'The recommendation system does not account for time of day, so it surfaces the same high-engagement content regardless of whether a user is in a lean-back or task-focused context.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['analytical_thinking'],
                explanation:
                  'Context signals like time of day are real features worth exploring, but they do not address the core objective mismatch. A better-contextualized completion-rate model would still fail to distinguish satisfaction from compulsion.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'What alternative training signals or model architectures would capture satisfaction rather than just completion?',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which approach to capturing user satisfaction as a training signal is most technically grounded and scalable?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['analytical_thinking', 'product_sense'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Introduce a post-session implicit satisfaction signal: if a user returns to search or browsing within 60 seconds of a video ending, treat that as a satisfaction signal (they are looking for more). If they close the app, treat that as neutral or negative. This creates a scalable proxy that does not require explicit feedback.',
                quality: 'best',
                points: 3,
                competencies: ['analytical_thinking', 'product_sense'],
                explanation:
                  'This is a behavioral signal that does not require self-reporting. Immediate continuation vs. session termination captures intent without explicit prompts, which suffer from low response rates and social desirability bias.',
              },
              {
                option_label: 'B',
                option_text:
                  'Ask users to rate videos after watching with a 5-star system, and add explicit ratings as a training feature in the two-tower model.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_sense'],
                explanation:
                  'YouTube removed the star rating system precisely because explicit ratings did not predict satisfaction well and introduced creator manipulation incentives. Returning to an explicit rating system is unlikely to solve the underlying signal problem.',
              },
              {
                option_label: 'C',
                option_text:
                  'Add a "not interested" signal weight and retrain the model to penalize content categories with high not-interested rates.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['analytical_thinking'],
                explanation:
                  '"Not interested" is a reactive signal that fires only when users actively interact with the UI. The regret-watching problem is specifically about content that users watch to completion but later regret, so passive implicit signals are more relevant.',
              },
              {
                option_label: 'D',
                option_text:
                  'Reduce the weight on watch time completion in the ranking model and increase weight on like and comment rates as proxies for active engagement.',
                quality: 'surface',
                points: 1,
                competencies: ['analytical_thinking'],
                explanation:
                  'Likes and comments are noisier than completion because they require active effort. Only a small fraction of satisfied viewers leave explicit signals. This reweighting does not add new satisfaction signal; it just changes which existing proxy is used.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'The post-session implicit signal has a cost. What does it sacrifice, and is that sacrifice worth it?',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the key trade-off in introducing the post-session implicit satisfaction signal?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['product_sense', 'metrics_reasoning'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'The signal is sparse (it fires only at session end) and introduces attribution noise (the last video in a session gets the signal, not the session as a whole). The sacrifice is model precision per session. The payoff is that it trains the model on a fundamentally different objective: session-level satisfaction rather than per-video completion.',
                quality: 'best',
                points: 3,
                competencies: ['product_sense', 'metrics_reasoning'],
                explanation:
                  'This names both the cost (attribution noise and sparsity) and the structural gain (objective function shift). The attribution problem is real and solvable via credit assignment, but the questioner needs to show they understand the engineering cost of the signal design.',
              },
              {
                option_label: 'B',
                option_text:
                  'The signal will initially cause watch time to drop as the model deprioritizes high-completion content.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_reasoning'],
                explanation:
                  'A watch time drop during retraining is likely and worth flagging. But naming only the short-term cost without discussing whether it stabilizes misses the more important point about what the model is now optimizing toward.',
              },
              {
                option_label: 'C',
                option_text:
                  'Users who close the app immediately may do so for reasons unrelated to video quality (phone battery, interruption), introducing false negatives.',
                quality: 'surface',
                points: 1,
                competencies: ['analytical_thinking'],
                explanation:
                  'False negatives are a real signal noise concern, but they are balanced by false positives in other proxies. At scale, random noise from non-quality app closes is likely to average out; the question is whether the signal adds net information, not whether it is perfect.',
              },
              {
                option_label: 'D',
                option_text:
                  'The implicit signal is not transparent to users, which raises algorithmic accountability concerns.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_sense'],
                explanation:
                  'Behavioral signals like navigation patterns are standard in recommendation systems. Accountability concerns are better addressed through recommendation diversity transparency features, not by avoiding implicit signals that improve outcomes.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'What metric would you set as the North Star for the improved model, and how is it different from the current optimization target?',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text: 'What should be the primary success metric for the improved recommendation algorithm?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Voluntary return rate at 24 hours post-session: the fraction of users who return to YouTube the next day after a session without being driven by a notification. This measures whether users felt good enough about the last session to come back on their own terms.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning', 'strategic_thinking'],
                explanation:
                  'Voluntary return rate captures satisfaction at the session level without requiring explicit feedback. It is distinct from completion rate (per-video) and DAU (which includes notification-driven returns). A model that makes people feel good about watching will have higher voluntary return rates than one that optimizes for compulsive watching.',
              },
              {
                option_label: 'B',
                option_text:
                  'Average session watch time per user per day.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Watch time is the current optimization target. Using it as the success metric for an improvement designed to reduce regret-watching is circular and preserves the original problem.',
              },
              {
                option_label: 'C',
                option_text:
                  'Regret-watching self-report rate in post-session surveys drops by 20%.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Survey-based regret metrics directly target the problem statement, which is attractive. But surveys suffer from low response rates and demand characteristics. Behavioral proxy metrics like voluntary return are more reliable at scale.',
              },
              {
                option_label: 'D',
                option_text:
                  'Weekly active user count grows while notification opt-out rate holds flat.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'WAU and notification opt-out are health guardrails, not success metrics. They measure the absence of harm rather than the presence of improvement in the specific dimension being optimized.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hp-google-time-machine-design',
    title: 'Design a Time Machine',
    scenario_role: 'Founding Engineer',
    scenario_context:
      'A venture-backed hardware and AI company is exploring whether a "personal time machine" — a device that lets users experience, replay, or navigate past moments in their lives — is a viable product. The founding team is doing first-principles market sizing and product scoping before a seed deck.',
    scenario_trigger:
      'The CEO has asked the founding engineer to structure the problem space before the team goes into whiteboard mode, to avoid the usual trap of jumping straight to features.',
    scenario_question: 'Design a time machine.',
    engineer_standout:
      'Abstract questions reward frameworks, not imagination. The strongest answer structures the problem space first, then picks one anchor use case and reasons from there.',
    paradigm: 'ai_native',
    industry: 'Consumer Technology',
    sub_vertical: 'Personal Devices',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['product_sense', 'user_empathy'],
    secondary_competencies: ['analytical_thinking', 'strategic_thinking'],
    frameworks: ['Jobs To Be Done', 'First Principles'],
    relevant_roles: ['swe', 'founding_engineer', 'tech_lead'],
    company_tags: ['Google'],
    tags: ['product_design', 'abstract', 'first_principles', 'hardware'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'Before designing anything, clarify what "time machine" means for a real user. What is the underlying human need?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text: 'How should the team frame the product opportunity before exploring features?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['product_sense', 'user_empathy'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Map the problem space across three axes: direction (past vs. future), granularity (moment vs. era), and fidelity (replay vs. re-experience). Pick one cell as the anchor use case where technology is currently feasible and the unmet need is strongest.',
                quality: 'best',
                points: 3,
                competencies: ['product_sense', 'analytical_thinking'],
                explanation:
                  'This creates a structured design space rather than open-ended brainstorming. The three axes expose the conceptual choices that drive wildly different products: a grief therapy tool (past, moment, high fidelity) is a completely different product from a financial planning tool (future, era, low fidelity).',
              },
              {
                option_label: 'B',
                option_text:
                  'Focus on the most emotionally resonant use case: people who have lost loved ones and want to experience moments with them again.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['user_empathy'],
                explanation:
                  'Grief and memory is a powerful use case, but jumping to it without structuring the space risks building for a market that is technically and ethically complex. The framing step should map the space first, then select the anchor.',
              },
              {
                option_label: 'C',
                option_text:
                  'Identify the core technology requirements: time travel is physically impossible, so reframe this as a memory and simulation product built on AR/VR and personal data.',
                quality: 'surface',
                points: 1,
                competencies: ['analytical_thinking'],
                explanation:
                  'Technology constraints are important but premature at the framing step. Naming the technical bounds before mapping the user need space narrows the solution prematurely.',
              },
              {
                option_label: 'D',
                option_text:
                  'Research the competitive landscape: Google Photos, Apple Memories, Meta\'s AR glasses, and future AI reconstruction tools.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['strategic_thinking'],
                explanation:
                  'Competitive research is a validation step, not a framing step. Starting from competitor analysis defines the product as a feature competition rather than a first-principles solution to a human need.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'Within the anchor use case (replay of personal past moments), list structurally different product paradigms.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'For a personal memory replay device, which set of product paradigms is most structurally distinct?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['product_sense', 'analytical_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Three paradigms: (1) Passive recorder — always-on lifelogging that captures everything (like a Humane Pin for memory). (2) Intent-based recall — capture triggered by user (like a smarter Google Photos search). (3) AI reconstruction — synthesize a past moment from sparse signals (photos, location data, calendar) when no explicit recording exists.',
                quality: 'best',
                points: 3,
                competencies: ['product_sense', 'analytical_thinking'],
                explanation:
                  'These three paradigms differ fundamentally in data collection model, privacy posture, and technical architecture. A passive recorder and an AI reconstructor require completely different go-to-market and regulatory approaches, making this the most useful distinction for the founding team.',
              },
              {
                option_label: 'B',
                option_text:
                  'Target different user segments: older adults wanting to preserve memories, grieving families, corporate history capture, and immersive gaming.',
                quality: 'surface',
                points: 1,
                competencies: ['user_empathy'],
                explanation:
                  'Segment lists describe who would buy it, not what the product is. The founding team needs product paradigms to scope the build, not just personas.',
              },
              {
                option_label: 'C',
                option_text:
                  'Explore different hardware form factors: wearable glasses, implanted chip, dedicated home device, or smartphone-only app.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_sense'],
                explanation:
                  'Hardware form factors are important but derivative of the data model and use case. Once the paradigm is selected, form factor follows from the data collection requirements.',
              },
              {
                option_label: 'D',
                option_text:
                  'Position this as a direct-to-consumer vs. enterprise vs. healthcare product depending on the use case.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['strategic_thinking'],
                explanation:
                  'Distribution model should follow from product definition, not precede it. Selecting a channel before a product paradigm anchors the team to the wrong constraint.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'The AI reconstruction paradigm is the most technically tractable today. What is the key design trade-off?',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the central design trade-off in building an AI reconstruction memory product?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['product_sense', 'user_empathy'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Fidelity vs. accuracy: higher-fidelity reconstructions feel more real but increase the risk that the AI hallucination of a past moment overwrites or distorts the user\'s actual memory. The product must choose between a high-fidelity experience that feels true and a lower-fidelity one that signals its own uncertainty.',
                quality: 'best',
                points: 3,
                competencies: ['product_sense', 'user_empathy'],
                explanation:
                  'This is the core psychological and ethical tension in AI memory products. Research on memory reconsolidation shows that vivid false memories can replace real ones. A product that optimizes for fidelity may be actively harmful to the users it intends to serve.',
              },
              {
                option_label: 'B',
                option_text:
                  'Data acquisition vs. user privacy: passive lifelogging collects more data for reconstruction but increases privacy exposure.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_sense'],
                explanation:
                  'Privacy is a real trade-off in the passive recorder paradigm, but within AI reconstruction, the data already exists (photos, location, calendar). The central tension shifts to what the AI does with that data, not how much it collects.',
              },
              {
                option_label: 'C',
                option_text:
                  'Subscription pricing vs. one-time purchase: a subscription model funds ongoing AI improvement but may feel exploitative for emotional use cases.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['strategic_thinking'],
                explanation:
                  'Monetization model is an important product decision but is downstream of the core design trade-off. Pricing strategy does not change the fundamental product tension between fidelity and accuracy.',
              },
              {
                option_label: 'D',
                option_text:
                  'Mobile-first vs. headset-first: a smartphone app reaches more users but a VR headset provides more immersive recall.',
                quality: 'surface',
                points: 1,
                competencies: ['product_sense'],
                explanation:
                  'Platform choice is a distribution and experience decision, not the central design trade-off. A headset does not resolve the fidelity-vs.-accuracy tension; it amplifies it.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'How would you validate the AI reconstruction paradigm with a real user before building the full product?',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the most efficient validation approach for the AI reconstruction paradigm before investing in hardware?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['product_sense', 'analytical_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Wizard of Oz test: recruit 20 users, ask them to share a meaningful past event, manually reconstruct it using their photos and location data with today\'s off-the-shelf tools (Google Photos timeline, street view, GPT-4 narrative), and measure whether the experience feels resonant vs. uncanny. This tests the fidelity-accuracy trade-off before writing a line of custom code.',
                quality: 'best',
                points: 3,
                competencies: ['product_sense', 'analytical_thinking'],
                explanation:
                  'A Wizard of Oz test simulates the AI reconstruction experience with human effort, generating real emotional response data without building a product. It directly tests the core trade-off (does the reconstruction feel right or wrong?) at near-zero cost.',
              },
              {
                option_label: 'B',
                option_text:
                  'Launch a landing page to measure sign-up intent from different user segments before building.',
                quality: 'surface',
                points: 1,
                competencies: ['product_sense'],
                explanation:
                  'A landing page measures general interest but not the specific fidelity-accuracy trade-off. Sign-up intent does not predict whether the emotional experience will feel beneficial or harmful.',
              },
              {
                option_label: 'C',
                option_text:
                  'Build an MVP mobile app that reconstructs a user\'s last birthday from their photos and calendar, and measure user satisfaction.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_sense'],
                explanation:
                  'An MVP is more valid than a landing page but builds too much too early. The Wizard of Oz approach tests the same emotional response with 10x less investment.',
              },
              {
                option_label: 'D',
                option_text:
                  'Run a focus group to discuss how users feel about AI-reconstructed memories in the abstract.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['user_empathy'],
                explanation:
                  'Abstract discussions about AI memory do not predict emotional responses to actual reconstructions. Users dramatically underestimate the uncanny valley effect until they experience it. Behavioral tests are required for this validation.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hp-google-youtube-watch-time-drop',
    title: 'YouTube Watch Time Down 10%',
    scenario_role: 'Tech Lead, YouTube Growth',
    scenario_context:
      'YouTube\'s weekly dashboard shows a 10% YoY drop in total watch time across all platforms. The decline appeared suddenly in the last 4-week rolling window and affects both mobile and desktop. No major product changes shipped in the preceding 6 weeks.',
    scenario_trigger:
      'An automated alert fired when the watch time trend crossed the 8% deviation threshold, triggering an incident review within 24 hours.',
    scenario_question: 'YouTube watch time is down 10%. How would you investigate?',
    engineer_standout:
      'A strong diagnosis separates "did something change internally?" from "did something change externally?" before running any queries.',
    paradigm: 'traditional',
    industry: 'Media & Entertainment',
    sub_vertical: 'Video Platforms',
    difficulty: 'warmup',
    estimated_minutes: 15,
    primary_competencies: ['metrics_reasoning', 'analytical_thinking'],
    secondary_competencies: ['product_sense'],
    frameworks: ['Metric Decomposition', '5 Whys'],
    relevant_roles: ['swe', 'tech_lead', 'staff_engineer'],
    company_tags: ['Google', 'YouTube'],
    tags: ['metrics', 'diagnosis', 'watch_time', 'incident'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'Before pulling data, structure your hypothesis space. What are the mutually exclusive categories of cause?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most efficient initial framing for investigating a sudden 10% watch time drop?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning', 'analytical_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Structure hypotheses across three buckets: (1) data/instrumentation issue (the drop is not real), (2) internal product change (something broke or regressed), (3) external shift (seasonality, platform event, competitive change). Check them in that order — data artifact takes 5 minutes to rule out; the other two require more effort.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning', 'analytical_thinking'],
                explanation:
                  'Prioritizing the data artifact check first is correct because a logging bug or timezone shift can cause a 10% apparent drop in minutes and would invalidate all subsequent analysis. After ruling that out, internal vs. external is the next fork.',
              },
              {
                option_label: 'B',
                option_text:
                  'Segment watch time by content category, region, and device type to identify where the drop is concentrated.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['analytical_thinking'],
                explanation:
                  'Segmentation is the right second step, but jumping to it before checking for a data artifact can produce misleading results. A tracking bug often manifests as a concentrated drop in a specific device or region.',
              },
              {
                option_label: 'C',
                option_text:
                  'Check whether any features shipped in the last 2 weeks could have caused a regression in video loading speed or recommendation quality.',
                quality: 'surface',
                points: 1,
                competencies: ['product_sense'],
                explanation:
                  'Internal regression is a valid hypothesis, but the question states no major changes shipped in 6 weeks. Starting with a product change hypothesis when that signal is already absent wastes investigation time.',
              },
              {
                option_label: 'D',
                option_text:
                  'Immediately escalate to the recommendations and streaming teams to check their systems for anomalies.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['analytical_thinking'],
                explanation:
                  'Escalating broadly before framing the hypotheses generates noise and defensive responses. A structured hypothesis leads to targeted questions that specific teams can actually answer quickly.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'After ruling out a data artifact, which three segmentation cuts give the most diagnostic signal fastest?',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of segmentation cuts provides the most diagnostic signal for the watch time drop?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['analytical_thinking', 'metrics_reasoning'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Three cuts: (1) geography — is the drop global or concentrated in one country/region? (2) traffic source — did recommendation-driven watch time drop differently from search-driven or direct-driven? (3) content age — is the drop in new content, catalog, or both?',
                quality: 'best',
                points: 3,
                competencies: ['analytical_thinking', 'metrics_reasoning'],
                explanation:
                  'Geography isolates external events (regulatory action, internet outage, competitive launch) from internal product issues. Traffic source isolates recommendation system health. Content age isolates creator supply change from viewer demand change. These three cuts cover the major hypotheses with minimal overlap.',
              },
              {
                option_label: 'B',
                option_text:
                  'Segment by user age group and subscription tier (free vs. Premium) to identify whether the drop is concentrated in high-value users.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'User tier segmentation is useful for business impact assessment, but it does not illuminate the cause. A Premium vs. free drop does not point to a specific system to investigate.',
              },
              {
                option_label: 'C',
                option_text:
                  'Device type (Android, iOS, web, TV), video length (short-form vs. long-form), and session entry point (notification vs. direct).',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['analytical_thinking'],
                explanation:
                  'These cuts have diagnostic value (device type could indicate a platform OS change; short-form vs. long-form separates Shorts from main feed). But they are less immediately actionable than geography + traffic source + content age.',
              },
              {
                option_label: 'D',
                option_text:
                  'Check whether the drop aligns with school holiday timing, seasonal patterns, or major sporting events consuming screen time.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Seasonality is a valid hypothesis but it should be checked against historical data, not assumed from external events. Running the temporal analysis first would have surfaced this if it were the cause.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Suppose the drop is concentrated in recommendation-driven watch time globally. What does that imply, and what would you check next?',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text: 'If recommendation-driven watch time is down globally but search and direct traffic are flat, what is the most likely root cause?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['analytical_thinking', 'product_sense'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'A recommendation model change, ranking bug, or corpus freshness issue. Check the recommendation system\'s internal health metrics: impression diversity score, candidate retrieval count, and serving latency. A 10% watch time drop from a healthy recommendation system requires a model-level explanation.',
                quality: 'best',
                points: 3,
                competencies: ['analytical_thinking', 'product_sense'],
                explanation:
                  'Isolating the drop to recommendation-driven traffic is strong signal that the recommendation system is the proximate cause. Model-level metrics (diversity, retrieval volume, latency) directly test the hypothesis without requiring a full code audit.',
              },
              {
                option_label: 'B',
                option_text:
                  'Creator upload volume may have declined, reducing the freshness of recommended content.',
                quality: 'surface',
                points: 1,
                competencies: ['product_sense'],
                explanation:
                  'Creator supply is worth checking, but a 10% drop in recommendation-driven watch time over 4 weeks from a corpus freshness issue would require a large creator supply change. This is unlikely without a corresponding signal in the creator dashboard.',
              },
              {
                option_label: 'C',
                option_text:
                  'The YouTube autoplay feature may have been disabled or changed by a browser policy update.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['analytical_thinking'],
                explanation:
                  'Autoplay changes would show up primarily in session depth metrics, not recommendation-driven watch time. A browser policy change would also affect search and direct traffic, not isolate to recommendations.',
              },
              {
                option_label: 'D',
                option_text:
                  'Competition from TikTok or Instagram Reels may be capturing recommendation-driven viewing sessions.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Competitive migration is a valid long-term hypothesis, but it would manifest as a gradual trend, not a sudden 4-week drop. Competitive shift is more likely to be background context than the proximate cause.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'What is the decision you need to make at the end of this investigation, and what would trigger each path?',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the decision framework for closing the watch time incident?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning', 'product_sense'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Three paths: if a model bug is confirmed, rollback immediately. If a feature interaction is confirmed (unintended regression), escalate for a targeted hotfix with a 24-hour SLA. If the cause is external (seasonality, competitive), document it, set a recovery timeline, and close the incident — no code action needed.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning', 'product_sense'],
                explanation:
                  'Each path has a different action and urgency. Conflating a model bug (roll back) with an external shift (document and wait) leads to unnecessary rollbacks or missed recoveries. A crisp decision tree prevents both over-reaction and under-reaction.',
              },
              {
                option_label: 'B',
                option_text:
                  'Launch an A/B experiment to test a modified recommendation ranking to see if watch time recovers.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_sense'],
                explanation:
                  'Running experiments during an active incident diagnosis delays the resolution timeline. The investigation should find the cause before proposing solutions; experiments are for optimization, not incident response.',
              },
              {
                option_label: 'C',
                option_text:
                  'Set a 48-hour monitoring window and close the incident if watch time shows any recovery trend.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Passive waiting without a causal conclusion leaves the team without an explanation for the next occurrence. "It recovered" is not an acceptable post-mortem if the root cause was never identified.',
              },
              {
                option_label: 'D',
                option_text:
                  'Escalate to senior leadership with a full segmentation report and wait for a prioritization decision.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Leadership escalation is appropriate after the investigation has a hypothesis, not before. A report without a recommendation forces leadership to do the diagnostic work that the investigating team should own.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'hp-openai-gpt5-launch-metrics',
    title: 'Measuring a GPT-5 Launch',
    scenario_role: 'Staff Engineer, OpenAI Product',
    scenario_context:
      'OpenAI is 6 weeks from launching GPT-5. The model outperforms GPT-4o on benchmarks across reasoning, coding, and instruction following. The product team needs to define success metrics for the launch before instrumentation is finalized.',
    scenario_trigger:
      'The head of product asked for a metrics framework in the next planning session, noting that GPT-4o\'s launch used "daily active users" as the North Star but generated debate afterward about whether DAU captured actual model value.',
    scenario_question: 'How would you measure launching GPT-5?',
    engineer_standout:
      'The hard part is not listing metrics — it\'s separating adoption metrics (did people try it?) from value metrics (did it change what they accomplished?).',
    paradigm: 'ai_native',
    industry: 'Technology',
    sub_vertical: 'AI / ML Platforms',
    difficulty: 'staff_plus',
    estimated_minutes: 25,
    primary_competencies: ['metrics_reasoning', 'strategic_thinking'],
    secondary_competencies: ['analytical_thinking', 'product_sense'],
    frameworks: ['North Star Metric', 'Input-Output Metric Framework'],
    relevant_roles: ['staff_engineer', 'em', 'tech_lead'],
    company_tags: ['OpenAI'],
    tags: ['metrics', 'ai_products', 'model_launch', 'north_star'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'What does "success" mean for a model launch, and how is it different from success for a consumer app launch?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of what a GPT-5 launch success metric needs to capture?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'A model launch succeeds when users change what tasks they attempt, not just which model they use. GPT-5 success means users take on harder problems, produce higher-quality outputs, and return to those problem types more frequently — not just that they switched from GPT-4o.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning', 'strategic_thinking'],
                explanation:
                  'This reframes the question from "did users adopt GPT-5?" to "did GPT-5 expand what users accomplish?" The GPT-4o DAU controversy arose precisely because DAU measured switching behavior, not capability expansion. A model that is better but used for the same tasks in the same way has not delivered incremental value.',
              },
              {
                option_label: 'B',
                option_text:
                  'Success is whether GPT-5 achieves parity or outperformance on user-perceived quality in head-to-head side-by-side evaluations.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Side-by-side evals measure relative quality at the moment of comparison, not behavioral change over time. A model can win evals and still fail to change how users work if the quality gap does not cross a threshold that enables new use cases.',
              },
              {
                option_label: 'C',
                option_text:
                  'Success is whether GPT-5 reaches 50M users in the first 30 days, consistent with ChatGPT\'s record-setting growth benchmark.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['strategic_thinking'],
                explanation:
                  'GPT-5 is a model upgrade into an existing user base, not a new product launch. 50M users in 30 days measures platform growth, not model-specific value. Most of those users would have been ChatGPT users already.',
              },
              {
                option_label: 'D',
                option_text:
                  'Success is whether API revenue from GPT-5 calls exceeds GPT-4o at comparable pricing within 90 days.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'API revenue is a downstream outcome that depends on pricing decisions, not just model quality. Revenue migration from GPT-4o to GPT-5 could happen for pricing reasons, not capability reasons, making it a weak signal for model value.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'Separate the metric candidates into adoption, value, and retention categories. Which category matters most at launch?',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of metrics best separates adoption, value, and retention for a GPT-5 launch?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning', 'analytical_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Adoption: % of active ChatGPT users who generate at least one GPT-5 output in week 1. Value: "task expansion rate" — % of users who attempt a task category they had not used in the prior 90 days on GPT-4o. Retention: week-4 GPT-5 share of user sessions for users who adopted in week 1.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning', 'analytical_thinking'],
                explanation:
                  'These three metrics are structurally distinct. Adoption measures reach. Task expansion directly operationalizes the "changed what they accomplish" definition. Retention tests whether the capability expansion persists after novelty wears off. The three together span the launch arc without overlap.',
              },
              {
                option_label: 'B',
                option_text:
                  'DAU, MAU, and DAU/MAU ratio for ChatGPT during the GPT-5 launch window.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics_reasoning'],
                explanation:
                  'DAU and MAU measure platform health, not model-specific adoption or value. This is exactly the DAU controversy from the GPT-4o launch that the question is asking to improve on.',
              },
              {
                option_label: 'C',
                option_text:
                  'Net Promoter Score, side-by-side win rate, and API request volume.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'NPS is a trailing indicator. Win rate is a quality measure, not a value measure. API request volume does not distinguish task expansion from identical tasks run more frequently. None of these captures changed behavior.',
              },
              {
                option_label: 'D',
                option_text:
                  'Conversation length (tokens per session), regeneration rate (how often users ask for a revised response), and copy-paste rate (how often they use the output).',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_reasoning'],
                explanation:
                  'These are behavioral proxies for quality and utility that do not require explicit ratings. Regeneration rate is a good quality signal. But they measure within-session quality, not whether GPT-5 enabled new use cases — which is the core value thesis.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: '"Task expansion rate" is the strongest value metric. What is its limitation, and how would you address it?',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the key limitation of "task expansion rate" as a GPT-5 value metric, and how should it be addressed?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning', 'analytical_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Task expansion can be driven by curiosity (users experimenting once with new task types) rather than genuine capability gain. The fix: require task expansion to be accompanied by session depth above the median for that task type, and check whether the user returns to that task category within 14 days.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning', 'analytical_thinking'],
                explanation:
                  'A single attempt at a new task type looks the same as a casual experiment. Combining expansion with depth and return-visit requirement filters for genuine capability unlock vs. novelty clicks. This makes the metric more conservative but more attributable to real value.',
              },
              {
                option_label: 'B',
                option_text:
                  'Task expansion rate is hard to instrument because task categorization requires NLP classification of conversations, which introduces labeling error.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['analytical_thinking'],
                explanation:
                  'Classification error is a real implementation concern, but it is a measurement quality issue, not a conceptual limitation. The metric can still be valuable even with imperfect classification if the signal-to-noise ratio is high enough.',
              },
              {
                option_label: 'C',
                option_text:
                  'Task expansion rate does not capture whether GPT-5 is better than GPT-4o for existing tasks, only whether users are doing new tasks.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'This is true but the framing step established that capability expansion (new tasks) is the target outcome. Existing task quality is covered by quality metrics (regeneration rate, win rate); task expansion should not also measure this.',
              },
              {
                option_label: 'D',
                option_text:
                  'Task expansion rate varies by user cohort (power users expand faster) and will overstate success if the adopting cohort is biased toward early heavy users.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Cohort bias is a standard measurement concern that applies to any metric, not a specific limitation of task expansion rate. The solution is cohort-controlled analysis, not replacing the metric.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'Commit to a North Star metric for the GPT-5 launch. One number. Why that one?',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the single North Star metric for the GPT-5 launch, and why is it better than DAU?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_reasoning', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Qualified task expansion rate at week 4: the percentage of GPT-4o users who, in the 4 weeks after GPT-5 access, attempted a new task category with above-median session depth AND returned to it at least once. This measures whether GPT-5 permanently expanded what users can accomplish, not just whether they tried it.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_reasoning', 'strategic_thinking'],
                explanation:
                  'This metric operationalizes the launch thesis directly: GPT-5 expands capability, not just engagement. It is better than DAU because DAU counts all sessions regardless of what users accomplished. It is better than raw task expansion because it filters out novelty. The 4-week window is long enough to observe habit formation but short enough to attribute to the launch.',
              },
              {
                option_label: 'B',
                option_text:
                  'GPT-5 model share of all ChatGPT API calls at week 8, as a proxy for developer confidence in the model.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Developer API share is a useful signal for platform health, but developers are a specific cohort. A North Star for a model launch should include the consumer user base that drives broader capability expansion and word-of-mouth growth.',
              },
              {
                option_label: 'C',
                option_text:
                  'Week-4 DAU for GPT-5 sessions, separated from GPT-4o sessions in the same ChatGPT interface.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics_reasoning'],
                explanation:
                  'This is model-specific DAU, which is still DAU. It improves the attribution problem but not the conceptual problem: it measures presence, not value. The head of product explicitly flagged DAU as the thing to move away from.',
              },
              {
                option_label: 'D',
                option_text:
                  'Average score on a monthly internal eval set (MMLU, HumanEval, etc.) maintained at or above GPT-5 launch benchmark.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_reasoning'],
                explanation:
                  'Benchmark performance measures model capability in controlled conditions, not user behavior. A North Star should reflect what users do with the model, not how it performs on synthetic tasks. Benchmark maintenance is a model team health metric, not a launch North Star.',
              },
            ],
          },
        ],
      },
    ],
  },
]
