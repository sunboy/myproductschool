export const CHALLENGES = [
  {
    id: 'hp-shopify-cross-border-prioritization',
    title: 'Cross-Border Commerce: What Ships First?',
    scenario_role: 'staff engineer',
    scenario_context: 'Shopify is expanding cross-border commerce for SMB merchants. The internationalization team has capacity to ship one major capability per quarter. Engineering leads are debating whether to start with local currency and duties, translations, or new payment methods.',
    scenario_trigger: 'The Q3 roadmap vote is tomorrow. Each workstream lead has 5 minutes to make the case. You have to go first.',
    scenario_question: 'Which capability do you prioritize first for cross-border SMB commerce, and what is your core argument?',
    engineer_standout: 'Recognize that currency and duties unblock the transaction itself — without them, the other investments have no surface area to land on.',
    paradigm: 'traditional',
    industry: 'e_commerce',
    sub_vertical: 'merchant_tools',
    difficulty: 'standard',
    estimated_minutes: 12,
    primary_competencies: ['prioritization', 'product_strategy'],
    secondary_competencies: ['market_analysis', 'technical_tradeoffs'],
    frameworks: ['job_to_be_done', 'opportunity_sizing'],
    relevant_roles: ['tech_lead', 'staff_engineer', 'founding_engineer'],
    company_tags: ['shopify'],
    tags: ['internationalization', 'cross-border', 'smb', 'payments', 'prioritization'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'What is the actual blocker stopping an SMB merchant from making a cross-border sale today?',
        grading_weight: 20,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the core constraint that prevents an SMB merchant from completing a cross-border sale?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['problem_framing', 'root_cause_analysis'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Merchants cannot present prices in local currency or collect duties at checkout, so buyers abandon when they see surprise import fees at delivery.',
                quality: 'best',
                points: 3,
                competencies: ['root_cause_analysis', 'customer_empathy'],
                explanation: 'Currency mismatch and duty surprises are the two highest-abandonment triggers in cross-border checkout research. Every other capability sits downstream of a completed transaction.'
              },
              {
                option_label: 'B',
                option_text: 'Merchants lack translated storefronts, so international buyers cannot understand the product listings.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['customer_empathy'],
                explanation: 'Translation reduces friction but many cross-border buyers already use English-language stores successfully. The purchase still fails at checkout even with a translated storefront if currency and duties are wrong.'
              },
              {
                option_label: 'C',
                option_text: 'Merchants do not support regional payment methods like iDEAL or Alipay, which some buyers prefer.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['market_analysis'],
                explanation: 'Payment method gaps block some segments, but only after the buyer has already decided to purchase. Currency and duties cause abandonment earlier in the funnel.'
              },
              {
                option_label: 'D',
                option_text: 'Merchant onboarding for international shipping carriers is too manual, creating operational friction.',
                quality: 'surface',
                points: 1,
                competencies: ['operational_thinking'],
                explanation: 'Carrier onboarding is a real pain but it sits on the fulfillment side, not the purchase decision. Fixing it does not move the conversion needle for a buyer who abandoned at checkout.'
              }
            ]
          }
        ]
      },
      {
        step: 'list' as const,
        step_nudge: 'Map out the distinct jobs-to-be-done a merchant is trying to accomplish with cross-border commerce.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of merchant jobs-to-be-done most completely covers the cross-border commerce problem space?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['problem_decomposition', 'user_research'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Complete the transaction (currency, duties), build buyer trust (translation, returns policy), and get paid reliably (local payment methods, payout currency).',
                quality: 'best',
                points: 3,
                competencies: ['problem_decomposition', 'systems_thinking'],
                explanation: 'These three jobs map to the full purchase lifecycle: discovery, decision, and settlement. A prioritization framework built on this decomposition will surface currency and duties as the sequencing winner.'
              },
              {
                option_label: 'B',
                option_text: 'Attract international traffic, convert visitors, and fulfill orders internationally.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['funnel_thinking'],
                explanation: 'Correct framing but too funnel-centric. It misses the settlement layer where merchants care deeply about payout currency and fraud risk, which drives product decisions around Shopify Payments expansion.'
              },
              {
                option_label: 'C',
                option_text: 'Translate product listings, support international shipping rates, and display local pricing.',
                quality: 'surface',
                points: 1,
                competencies: ['feature_thinking'],
                explanation: 'These are features, not jobs. Listing features rather than underlying jobs prevents the team from discovering that merchants actually care about landed cost predictability, not just price display.'
              },
              {
                option_label: 'D',
                option_text: 'Compete with Etsy and Amazon on international reach by matching their seller tools.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['competitive_analysis'],
                explanation: "Competitor-feature parity is not a job-to-be-done framework. Shopify's merchant base has different economics than Etsy or Amazon sellers, and matching their surface area ignores the SMB-specific constraints."
              }
            ]
          }
        ]
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Name the criterion that decides the winner and what you sacrifice by choosing it.',
        grading_weight: 35,
        step_order: 3,
        questions: [
          {
            question_text: 'What is your prioritization argument for local currency and duties, and what does that choice explicitly trade away?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['prioritization', 'tradeoff_reasoning'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Currency and duties unblock revenue — a buyer who hits a surprise import fee at delivery churns permanently. The sacrifice is that merchants targeting non-English markets will see lower conversion gains until translation ships in a later quarter.',
                quality: 'best',
                points: 3,
                competencies: ['prioritization', 'tradeoff_reasoning'],
                explanation: "This names both the criterion (revenue unblocking) and the explicit sacrifice (delayed translation benefit). Shopify's Markets product launched in 2021 with exactly this sequencing, validating the logic."
              },
              {
                option_label: 'B',
                option_text: 'All three capabilities are important and the decision should depend on which market Shopify is targeting first.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['prioritization'],
                explanation: 'This punts the decision to market selection without providing a framework. At a roadmap vote, this answer produces no actionable outcome and signals inability to commit to a position under uncertainty.'
              },
              {
                option_label: 'C',
                option_text: 'Local payment methods should go first because they vary most by country and represent the highest engineering complexity.',
                quality: 'surface',
                points: 1,
                competencies: ['technical_thinking'],
                explanation: 'Engineering complexity is not a prioritization criterion for a roadmap vote. Payment methods matter but do not block the transaction as directly as currency display and duty collection.'
              },
              {
                option_label: 'D',
                option_text: 'Currency and duties give the most immediate GMV lift, though you sacrifice translation coverage in the short term.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['prioritization'],
                explanation: 'Correct direction but "GMV lift" is vague. The best answer explains why the lift is causal — duty surprises at delivery cause permanent churn — not just correlated.'
              }
            ]
          }
        ]
      },
      {
        step: 'win' as const,
        step_nudge: 'Make the call. One sequencing decision with a testable success signal.',
        grading_weight: 20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is your recommendation and what metric tells you in 90 days that you were right?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['decision_making', 'metrics_definition'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Ship local currency and duties in Q3. Success signal: cross-border checkout conversion rate for merchants on Markets improves by 8-12 points within 90 days, with repeat purchase rate as a secondary signal.',
                quality: 'best',
                points: 3,
                competencies: ['decision_making', 'metrics_definition'],
                explanation: 'Crisp commit plus a testable, bounded metric tied directly to the problem framing. Naming a secondary metric shows awareness that conversion is a leading indicator, not the full picture.'
              },
              {
                option_label: 'B',
                option_text: 'Prioritize local currency and duties, but run a user study first to validate that duty surprises are the primary abandonment driver before committing engineering resources.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['research_bias'],
                explanation: "The duty-surprise problem is well-documented in Shopify's own checkout data. Calling for a user study before committing delays the roadmap vote outcome and signals low confidence in existing signal."
              },
              {
                option_label: 'C',
                option_text: 'Ship currency and duties in Q3, and track international GMV growth as the success metric.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_definition'],
                explanation: 'International GMV is too broad — it includes factors outside this workstream like marketing spend and merchant acquisition. Conversion rate is more causally tied to the checkout changes.'
              },
              {
                option_label: 'D',
                option_text: 'A phased approach: currency in Q3, duties in Q4, translations in Q5, payments in Q6, with quarterly reviews to adjust.',
                quality: 'surface',
                points: 1,
                competencies: ['planning'],
                explanation: 'Sequencing duties separately from currency misses that they are inseparable at checkout — merchants need both to show a true landed cost. Splitting them extends the time-to-value for merchants.'
              }
            ]
          }
        ]
      }
    ]
  },

  {
    id: 'hp-shopify-shop-pay-reacceleration',
    title: 'Shop Pay Is Flattening: 2-Quarter Sprint',
    scenario_role: 'tech lead',
    scenario_context: 'Shop Pay adoption among repeat buyers has plateaued. The last two quarters showed single-digit growth in repeat purchase rate, down from 20%+ the prior year. Leadership wants a 2-quarter plan to re-accelerate without touching checkout latency.',
    scenario_trigger: 'The VP of Product asks for a proposal by end of week. The constraint is explicit: no checkout speed regression, no re-architecture.',
    scenario_question: 'What is your strategy to re-accelerate Shop Pay repeat purchases in 2 quarters without degrading checkout performance?',
    engineer_standout: 'Distinguish between acquisition of new Shop Pay users and re-engagement of existing ones — the flat trend could reflect either, and the strategy differs completely.',
    paradigm: 'ai_assisted',
    industry: 'e_commerce',
    sub_vertical: 'payments',
    difficulty: 'standard',
    estimated_minutes: 14,
    primary_competencies: ['product_strategy', 'growth_thinking'],
    secondary_competencies: ['metrics_definition', 'technical_tradeoffs'],
    frameworks: ['growth_loops', 'constraint_based_design'],
    relevant_roles: ['tech_lead', 'staff_engineer', 'founding_engineer', 'em'],
    company_tags: ['shopify'],
    tags: ['shop-pay', 'repeat-purchase', 'checkout', 'growth', 'payments'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'What does "flattening adoption" actually mean — and which problem are you solving?',
        grading_weight: 20,
        step_order: 1,
        questions: [
          {
            question_text: 'Before proposing solutions, what diagnostic question cuts most directly to the root of the Shop Pay plateau?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['diagnostic_thinking', 'metrics_definition'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Is the plateau driven by fewer new users activating Shop Pay, or by existing users not returning to merchants that accept it?',
                quality: 'best',
                points: 3,
                competencies: ['diagnostic_thinking', 'segmentation'],
                explanation: 'This question cleanly separates two different problems with different levers. Activation problems require merchant coverage or awareness fixes; retention problems require re-engagement or catalog expansion. Conflating them produces unfocused strategy.'
              },
              {
                option_label: 'B',
                option_text: 'Which merchants have the lowest Shop Pay attachment rate, so we can focus our enablement effort there?',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['segmentation'],
                explanation: 'Merchant segmentation is useful but secondary. If existing Shop Pay users are simply not revisiting merchants, fixing merchant attachment rate does not address the retention gap.'
              },
              {
                option_label: 'C',
                option_text: 'What features do competitors like Apple Pay and PayPal offer that Shop Pay lacks?',
                quality: 'surface',
                points: 1,
                competencies: ['competitive_analysis'],
                explanation: 'Competitor benchmarking answers a different question. If Shop Pay users are not returning, the cause is unlikely to be a missing feature — it is more likely a frequency or awareness problem.'
              },
              {
                option_label: 'D',
                option_text: 'How has the checkout latency changed in the past two quarters, and could that be causing abandonment?',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['technical_thinking'],
                explanation: 'The problem statement rules out a latency cause — the constraint is specifically to not harm speed, implying latency is healthy. Investigating it wastes the diagnostic window.'
              }
            ]
          }
        ]
      },
      {
        step: 'list' as const,
        step_nudge: 'Generate distinct levers that could increase Shop Pay repeat purchases within the constraint.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of levers for re-accelerating Shop Pay repeat purchases is most structurally distinct and constraint-compliant?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['problem_decomposition', 'growth_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Cross-merchant re-engagement (Shop app surface), merchant-side incentives (loyalty points for Shop Pay usage), and discovery (personalized recommendations inside Shop app).',
                quality: 'best',
                points: 3,
                competencies: ['growth_thinking', 'problem_decomposition'],
                explanation: 'These three levers address different points in the repeat-purchase loop: pulling users back to the network, incentivizing the checkout action, and creating new purchase intent. None touch checkout latency.'
              },
              {
                option_label: 'B',
                option_text: 'Faster checkout, biometric authentication, and installment pay options.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['feature_thinking'],
                explanation: 'Faster checkout is explicitly off the table. Biometrics and installments are table-stakes features, not repeat-purchase drivers — they solve for first conversion, not return frequency.'
              },
              {
                option_label: 'C',
                option_text: 'Push notification campaigns, email re-engagement, and abandoned cart retargeting.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['growth_thinking'],
                explanation: 'Re-engagement tactics are relevant but they are channels, not levers. They do not address why users stopped returning — without a reason to come back, more notifications produce diminishing returns.'
              },
              {
                option_label: 'D',
                option_text: 'Expand Shop Pay to more merchant categories and geographies to increase the addressable network.',
                quality: 'surface',
                points: 1,
                competencies: ['market_expansion'],
                explanation: 'Network expansion grows the ceiling but does not re-engage existing users who have already activated Shop Pay. The plateau is a utilization problem, not a coverage problem — at least until the diagnostic confirms otherwise.'
              }
            ]
          }
        ]
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Pick the highest-leverage move for Q1 and name what you defer.',
        grading_weight: 35,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the Q1 priority move and what does that choice explicitly defer?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['prioritization', 'tradeoff_reasoning'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Prioritize cross-merchant re-engagement via Shop app surfaces in Q1 — it activates the existing user base without touching checkout code. Defer merchant loyalty incentives to Q2 because they require merchant-side buy-in and longer rollout cycles.',
                quality: 'best',
                points: 3,
                competencies: ['prioritization', 'tradeoff_reasoning'],
                explanation: "Shop app re-engagement is self-contained on Shopify's own surface, requires no merchant coordination, and can show results within a quarter. Deferring loyalty incentives acknowledges the real coordination cost, and merchant programs take 6-8 weeks to negotiate and deploy."
              },
              {
                option_label: 'B',
                option_text: 'Launch a consumer-facing Shop Pay rewards program in Q1 to drive habit formation across the network.',
                quality: 'surface',
                points: 1,
                competencies: ['growth_thinking'],
                explanation: 'A new rewards program is a multi-quarter infrastructure investment. It cannot move the needle in a single quarter and involves significant legal, finance, and merchant coordination that conflicts with the 2-quarter constraint.'
              },
              {
                option_label: 'C',
                option_text: 'Invest in both Shop app re-engagement and merchant incentives simultaneously in Q1, then measure and double down in Q2.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['growth_thinking'],
                explanation: 'Running both in parallel sounds thorough but diffuses engineering bandwidth. The answer does not acknowledge the merchant coordination cost, which would make "simultaneously in Q1" unrealistic.'
              },
              {
                option_label: 'D',
                option_text: 'Focus on reducing checkout steps from three to two in Q1, which would remove friction without adding new code paths.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['technical_thinking'],
                explanation: 'Checkout re-architecture violates the constraint even if it reduces steps. And checkout friction is not the diagnosed root cause of a repeat-purchase plateau — it is a first-conversion problem.'
              }
            ]
          }
        ]
      },
      {
        step: 'win' as const,
        step_nudge: 'What does success look like at the end of Q2?',
        grading_weight: 20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the Q2 outcome target and which metric serves as the leading indicator?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_definition', 'decision_making'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Target: 15-20% lift in 90-day repeat purchase rate for Shop Pay users by end of Q2. Leading indicator: Shop app weekly active users who complete a cross-merchant purchase within 30 days of re-engagement campaign.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_definition', 'decision_making'],
                explanation: 'The target is bounded and anchored to the original problem statement. The leading indicator measures behavior change within the re-engagement window, giving the team a 30-day signal rather than waiting for 90-day repeat purchase data.'
              },
              {
                option_label: 'B',
                option_text: 'Target: increase Shop Pay GMV by 20% by end of Q2, tracked weekly.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_definition'],
                explanation: 'GMV growth is a lagging output metric influenced by merchant catalog size, seasonality, and marketing spend. It does not isolate whether the repeat-purchase strategy specifically worked.'
              },
              {
                option_label: 'C',
                option_text: 'Success is when repeat purchase rate returns to prior-year levels of 20%+ growth quarter-over-quarter.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_definition'],
                explanation: 'Restoring prior growth rates is an outcome goal, not a measurement framework. It does not identify a leading indicator and sets a benchmark that may not account for market saturation at scale.'
              },
              {
                option_label: 'D',
                option_text: 'Monitor checkout conversion rate weekly — if it stays flat or improves, the strategy is working.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics_definition'],
                explanation: 'Checkout conversion measures first-visit performance, not repeat purchase behavior. A flat conversion rate during a re-engagement campaign does not indicate whether existing users are coming back more frequently.'
              }
            ]
          }
        ]
      }
    ]
  },

  {
    id: 'hp-shopify-reviews-build-vs-ecosystem',
    title: 'Shopify Reviews: Build Native or Deepen the Ecosystem?',
    scenario_role: 'founding engineer',
    scenario_context: "Shopify's app store has dozens of reviews products, from Yotpo to Loox to Judge.me. Merchants frequently request a native reviews feature. The platform team is weighing whether to build it into Shopify core or invest in deeper APIs that make third-party apps better.",
    scenario_trigger: 'The quarterly platform strategy review is this week. The reviews question is on the agenda because two enterprise merchants have threatened to churn if Shopify does not solve review portability between apps.',
    scenario_question: 'Should Shopify build a native Reviews product or double down on the ecosystem with deeper APIs?',
    engineer_standout: "Recognize that Shopify's platform identity is at stake: building natively risks breaking trust with app partners who built businesses on reviews, while not building natively may cede the category to Yotpo.",
    paradigm: 'traditional',
    industry: 'e_commerce',
    sub_vertical: 'merchant_tools',
    difficulty: 'advanced',
    estimated_minutes: 16,
    primary_competencies: ['platform_strategy', 'build_vs_buy'],
    secondary_competencies: ['ecosystem_thinking', 'stakeholder_management'],
    frameworks: ['platform_theory', 'make_vs_buy'],
    relevant_roles: ['staff_engineer', 'founding_engineer', 'tech_lead'],
    company_tags: ['shopify'],
    tags: ['platform-strategy', 'reviews', 'ecosystem', 'build-vs-buy', 'apis'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'What is the actual merchant job behind the reviews request — and is "build native" the right response to it?',
        grading_weight: 20,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the real problem the enterprise merchant churn threat reveals?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['problem_framing', 'root_cause_analysis'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Review data is siloed inside individual apps with no portability standard, so merchants who switch apps lose their social proof — the real problem is data lock-in, not feature absence.',
                quality: 'best',
                points: 3,
                competencies: ['root_cause_analysis', 'platform_thinking'],
                explanation: 'Portability is the stated reason for the churn threat. Building a native product solves portability only if merchants migrate to it; a standard API solves portability while preserving ecosystem choice. The frame changes the build decision completely.'
              },
              {
                option_label: 'B',
                option_text: 'Third-party review apps are too expensive, and merchants want a lower-cost native option bundled with their Shopify subscription.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['customer_empathy'],
                explanation: 'Price is not the stated concern — review portability is. Framing this as a cost problem leads to a freemium native product strategy that still does not address the data lock-in issue.'
              },
              {
                option_label: 'C',
                option_text: 'Shopify lacks reviews as a core feature, putting it behind platforms like WooCommerce and BigCommerce that have built-in review systems.',
                quality: 'surface',
                points: 1,
                competencies: ['competitive_analysis'],
                explanation: "Competitor parity is a surface-level frame. WooCommerce's native reviews do not port between plugins either, suggesting the real problem is not 'native vs. third-party' but 'portable vs. siloed.'"
              },
              {
                option_label: 'D',
                option_text: 'Review apps have poor UX consistency, making it hard for merchants to manage reviews across their store without switching between multiple dashboards.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['user_experience'],
                explanation: 'UX fragmentation is a real pain but secondary to data portability. Solving UX without portability still leaves merchants unable to switch apps — which is the churn-driver in the specific case.'
              }
            ]
          }
        ]
      },
      {
        step: 'list' as const,
        step_nudge: 'What are the genuinely distinct strategic options Shopify has — not just "build" vs "don\'t build"?',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: "Which option set most accurately maps Shopify's strategic choices on reviews?",
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['strategic_options', 'platform_strategy'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Build a thin native reviews layer that owns the data schema and portability standard, let ecosystem apps render and differentiate on top. Alternatively, build a full first-party product and compete directly. Alternatively, publish an open review data standard via APIs and let the ecosystem self-coordinate.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_options', 'platform_strategy'],
                explanation: 'This decomposition separates data ownership from feature ownership — a distinction Shopify made with Online Store 2.0 themes. The thin layer option is how successful platforms resolve ecosystem tension without becoming a competitor.'
              },
              {
                option_label: 'B',
                option_text: 'Build native or do not build native. If native, launch a full reviews product. If not, invest in the API.',
                quality: 'surface',
                points: 1,
                competencies: ['strategic_options'],
                explanation: 'Binary framing misses the hybrid middle path, which is the most common resolution of build-vs-ecosystem tension on mature platforms. It forces a false choice between full competition with partners and full abstention.'
              },
              {
                option_label: 'C',
                option_text: 'Acquire the leading reviews app (Yotpo or Loox) to bring the capability in-house quickly.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['strategic_options'],
                explanation: 'Acquisition is a real option but acqui-hiring a review app would immediately alienate all other review app partners. It also misses that data portability — the stated problem — is not solved by owning one app in a multi-app ecosystem.'
              },
              {
                option_label: 'D',
                option_text: 'Launch a reviews API standard, mandate that all app-store review apps comply within 12 months, and provide a migration tool for merchants.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['platform_strategy'],
                explanation: 'Mandating a standard is the right direction but the 12-month timeline and compliance mandate are political and legal non-starters without an adoption incentive. The answer is directionally correct but execution-naive.'
              }
            ]
          }
        ]
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Name the criterion that decides the recommendation and the cost of that choice.',
        grading_weight: 35,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the deciding criterion for choosing between native build and ecosystem deepening, and what does each path sacrifice?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['tradeoff_reasoning', 'platform_strategy'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'The deciding criterion is partner trust. Building a full native product would replicate Shopify\'s historical pattern with Shopify Shipping — where competing with apps damaged the ecosystem. A thin data-ownership layer preserves partner economics while solving portability. The sacrifice is differentiated feature innovation, which stays with ecosystem apps.',
                quality: 'best',
                points: 3,
                competencies: ['tradeoff_reasoning', 'platform_strategy'],
                explanation: 'Naming "partner trust" as the criterion and referencing the Shopify Shipping precedent shows platform-specific reasoning. The sacrifice is concrete: differentiation stays in the ecosystem, which means Shopify\'s native layer will always be less feature-rich than Yotpo.'
              },
              {
                option_label: 'B',
                option_text: 'Build natively because reviews are a core merchant need and Shopify should own core needs, sacrificing third-party differentiation.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['platform_strategy'],
                explanation: 'Correct about the ownership claim but vague on what "own" means. It does not distinguish between owning the data schema and owning the full feature set — a critical distinction for a platform company.'
              },
              {
                option_label: 'C',
                option_text: 'The deciding criterion is engineering cost. Reviews are complex (fraud, spam, syndication) so ecosystem apps are better positioned to build them, and Shopify should invest in APIs instead.',
                quality: 'surface',
                points: 1,
                competencies: ['technical_thinking'],
                explanation: 'Engineering cost is a real input but not the deciding criterion for a platform strategy question. Shopify has the resources to build reviews; the constraint is strategic, not technical.'
              },
              {
                option_label: 'D',
                option_text: 'Shopify should survey merchants and let the data decide whether to build natively or invest in APIs.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['research_bias'],
                explanation: 'Merchants will universally say "build it natively" when asked — they always prefer free bundled features. Survey data cannot resolve the platform strategy tension between merchant demand and partner trust.'
              }
            ]
          }
        ]
      },
      {
        step: 'win' as const,
        step_nudge: 'Make the call. One recommendation that survives the partner trust constraint.',
        grading_weight: 20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is your recommendation to the platform strategy review?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['decision_making', 'communication'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Build a Reviews Data Layer: Shopify owns the review schema and portability standard, but ships no consumer-facing UI. Ecosystem apps build on top. Metric: review portability adoption by top 50 app-store partners within 6 months.',
                quality: 'best',
                points: 3,
                competencies: ['decision_making', 'platform_strategy'],
                explanation: 'This is the "thin native layer" option — it resolves the churn threat without competing with app partners. The metric tests whether the standard achieves adoption, which is the actual risk in this approach.'
              },
              {
                option_label: 'B',
                option_text: 'Do not build natively. Publish a reviews API and wait for the ecosystem to self-coordinate on portability.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['platform_strategy'],
                explanation: 'Waiting for ecosystem self-coordination on a standard never works without a mandate or incentive structure. The churn threat requires a Shopify-owned resolution within a defined timeline.'
              },
              {
                option_label: 'C',
                option_text: 'Build a full native Reviews product with a 12-month roadmap, and offer migration support for merchants currently using third-party apps.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['decision_making'],
                explanation: 'Full native product is a defensible call but does not adequately address partner trust fallout. Shopify\'s Shipping and Payments precedents show that full competition with app partners produces sustained ecosystem tension.'
              },
              {
                option_label: 'D',
                option_text: 'Defer the decision until next quarter pending a deeper merchant study and partner consultation.',
                quality: 'surface',
                points: 1,
                competencies: ['decision_making'],
                explanation: 'Deferral when enterprise merchants are threatening churn is not a recommendation — it is avoidance. The strategy review requires a decision, not a process.'
              }
            ]
          }
        ]
      }
    ]
  },

  {
    id: 'hp-shopify-search-add-to-cart-drop',
    title: '48 Hours: Add-to-Cart Drop After Search Changes',
    scenario_role: 'tech lead',
    scenario_context: 'Data Science flagged a 12% drop in add-to-cart rate across storefront search starting 48 hours after a recent ranking algorithm update shipped. The update was designed to surface trending products over high-inventory items. Rollback is possible but would revert 3 weeks of ranking improvements.',
    scenario_trigger: 'The on-call PM escalates at 9am. You have 48 hours to assess, decide, and act before the weekend traffic peak.',
    scenario_question: 'What do you do in the next 48 hours to investigate the add-to-cart drop and decide on a response?',
    engineer_standout: 'Distinguish between correlation and causation — the search change is the obvious suspect but ruling out confounders (traffic mix, seasonal shift, downstream A/B tests) before rollback is the difference between a good on-call response and a reactive one.',
    paradigm: 'traditional',
    industry: 'e_commerce',
    sub_vertical: 'search_and_discovery',
    difficulty: 'advanced',
    estimated_minutes: 14,
    primary_competencies: ['incident_response', 'diagnostic_thinking'],
    secondary_competencies: ['metrics_definition', 'technical_tradeoffs'],
    frameworks: ['scientific_method', 'five_whys'],
    relevant_roles: ['tech_lead', 'staff_engineer', 'em'],
    company_tags: ['shopify'],
    tags: ['incident', 'search', 'add-to-cart', 'metrics', 'root-cause'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'Before acting, what do you need to know to determine whether the search change actually caused the drop?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most important diagnostic question to answer before deciding whether to rollback the search change?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['diagnostic_thinking', 'incident_response'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Is the add-to-cart drop concentrated in queries where the ranking change affected result order, or is it uniform across all search queries including those unchanged by the algorithm?',
                quality: 'best',
                points: 3,
                competencies: ['diagnostic_thinking', 'segmentation'],
                explanation: 'If the drop is uniform across all search — including queries the algorithm did not change — then the ranking update is not the cause and rollback would be wrong. If it is concentrated in affected queries, causation is likely. This segmentation is the single most valuable data cut.'
              },
              {
                option_label: 'B',
                option_text: 'Has any other team shipped changes to the storefront, cart, or checkout in the same 48-hour window?',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['diagnostic_thinking'],
                explanation: 'Checking for confounding deploys is good practice, but it is a background check — not the primary diagnostic. Even if another team shipped, segmenting the drop by affected queries tells you more directly whether the search change is implicated.'
              },
              {
                option_label: 'C',
                option_text: 'What is the p-value on the add-to-cart drop — is it statistically significant given normal day-to-day variance?',
                quality: 'surface',
                points: 1,
                competencies: ['statistical_thinking'],
                explanation: 'Statistical significance matters but 12% at scale is almost certainly significant. With Shopify\'s traffic volume, a 12% drop in 48 hours is a real signal, not noise. Waiting for statistical validation before starting investigation costs time.'
              },
              {
                option_label: 'D',
                option_text: 'Should we immediately rollback the search change to stop the bleeding and investigate afterward?',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['incident_response'],
                explanation: 'Rollback-first is the wrong default when the causal link is unconfirmed. If the search change is not the cause, rollback costs 3 weeks of ranking improvements and does not fix the actual problem. Diagnosis before action is the right protocol for non-critical SEV.'
              }
            ]
          }
        ]
      },
      {
        step: 'list' as const,
        step_nudge: 'Map the investigation steps across the 48-hour window.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which 48-hour investigation plan is most likely to produce a confident, action-ready diagnosis?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['investigation_planning', 'incident_response'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Hour 0-4: segment the drop by affected vs. unaffected queries. Hour 4-12: check for confounding deploys and traffic mix changes. Hour 12-24: analyze which product categories and query types show the largest drops. Hour 24-48: make rollback or hotfix decision with a clear causal hypothesis.',
                quality: 'best',
                points: 3,
                competencies: ['investigation_planning', 'incident_response'],
                explanation: 'This plan starts with the highest-value diagnostic cut, then layers confounders, then deepens into category analysis before deciding. The decision is at the end of the window — not at the start — ensuring it is evidence-based.'
              },
              {
                option_label: 'B',
                option_text: 'Rollback at hour 4 to protect the weekend traffic peak, then run a proper controlled experiment next week to validate the ranking change.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['incident_response'],
                explanation: 'Preemptive rollback without confirming causation wastes the ranking investment and sets a bad precedent: future teams will hesitate to ship ranking changes knowing any correlated metric movement triggers a rollback.'
              },
              {
                option_label: 'C',
                option_text: 'Run a full attribution analysis across search, cart, and checkout metrics to build a comprehensive picture before making any decision.',
                quality: 'surface',
                points: 1,
                competencies: ['investigation_planning'],
                explanation: 'A comprehensive attribution analysis takes longer than 48 hours for a system as complex as Shopify\'s storefront. This plan does not produce an actionable answer before the weekend peak.'
              },
              {
                option_label: 'D',
                option_text: 'Check if the add-to-cart drop also appears in non-search surfaces (direct product pages, collections) to isolate whether search is truly the vector.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['diagnostic_thinking'],
                explanation: 'Checking non-search surfaces is a valid confounder test, but it is one step, not a 48-hour plan. On its own it does not identify the specific mechanism within search that is causing the drop.'
              }
            ]
          }
        ]
      },
      {
        step: 'optimize' as const,
        step_nudge: 'At hour 24, the data shows the drop is concentrated in trending-product queries. What is the call?',
        grading_weight: 30,
        step_order: 3,
        questions: [
          {
            question_text: 'Hour 24 finding: add-to-cart is down 18% specifically on queries returning trending products. What is the highest-leverage response for the remaining 24 hours?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['tradeoff_reasoning', 'technical_decision_making'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Reduce the trending signal weight in the ranking formula rather than full rollback — this preserves the ranking improvements for non-trending queries while fixing the specific mechanism causing the drop. Metric to watch: add-to-cart rate on trending-product queries recovering toward baseline within 6 hours of the config change.',
                quality: 'best',
                points: 3,
                competencies: ['technical_decision_making', 'tradeoff_reasoning'],
                explanation: 'Targeted config change beats full rollback because it preserves 3 weeks of ranking work for the majority of queries. This is the response a strong on-call engineer gives when they have done the diagnostic work to understand the specific mechanism.'
              },
              {
                option_label: 'B',
                option_text: 'Full rollback now. Trending queries drive weekend traffic and the 18% drop is too large to accept heading into the peak.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['incident_response'],
                explanation: 'Rollback is defensible given the scale and timing, but full rollback sacrifices all ranking improvements when a targeted config change is available. The best answer finds a scalpel when the situation does not require a sledgehammer.'
              },
              {
                option_label: 'C',
                option_text: 'Let it ride through the weekend to collect more data, then address in the post-mortem next week.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['incident_response'],
                explanation: 'Accepting an 18% add-to-cart drop through a weekend peak is not a defensible call. The data is sufficient at hour 24 to act — waiting produces unnecessary GMV loss and escalation risk.'
              },
              {
                option_label: 'D',
                option_text: 'Re-rank trending queries to show only trending products with stock levels above 100 units to reduce the OOS-driven abandonment that trending ranking may be causing.',
                quality: 'surface',
                points: 1,
                competencies: ['technical_thinking'],
                explanation: 'This is a hypothesis, not a diagnosis. The investigation has identified trending queries as the vector but has not confirmed out-of-stock as the mechanism. Acting on an unconfirmed hypothesis adds noise to the signal.'
              }
            ]
          }
        ]
      },
      {
        step: 'win' as const,
        step_nudge: 'Close out the incident. What goes in the post-mortem?',
        grading_weight: 20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the most important process change to document in the post-mortem to prevent this class of incident?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['learning_culture', 'systems_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Add a pre-ship gate for search ranking changes: any update affecting more than 20% of query traffic requires a 24-hour canary on 5% of merchants with add-to-cart as an explicit guardrail metric before full rollout.',
                quality: 'best',
                points: 3,
                competencies: ['systems_thinking', 'process_design'],
                explanation: 'This process change directly addresses the failure mode: a ranking change shipped to 100% of traffic without a conversion guardrail. The canary gate with an explicit metric would have caught the 18% drop within hours, not days.'
              },
              {
                option_label: 'B',
                option_text: 'Document the diagnostic playbook for search-related add-to-cart drops so the next on-call engineer can move faster.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['knowledge_management'],
                explanation: 'A diagnostic playbook is valuable but reactive — it helps the next engineer investigate faster without preventing the incident class. The system change (canary gate) is more impactful.'
              },
              {
                option_label: 'C',
                option_text: 'Invest in a real-time anomaly detection system that automatically triggers a PagerDuty alert when any metric drops more than 10% in a 2-hour window.',
                quality: 'surface',
                points: 1,
                competencies: ['observability'],
                explanation: 'Better alerting would have caught this faster, but it addresses detection speed, not prevention. The root cause was shipping an undertested ranking change, not slow alerting.'
              },
              {
                option_label: 'D',
                option_text: 'Require all ranking algorithm changes to go through a 30-day holdout experiment before production, with statistical significance on key funnel metrics.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['process_design'],
                explanation: 'A 30-day holdout for all ranking changes would halt Shopify\'s ability to iterate on search. It overcorrects and conflates "careful" with "slow." A canary gate achieves safety without paralysis.'
              }
            ]
          }
        ]
      }
    ]
  },

  {
    id: 'hp-shopify-checkout-extensibility-perf',
    title: 'Checkout Extensibility: 60ms Latency vs. Merchant Customizations',
    scenario_role: 'staff engineer',
    scenario_context: 'Shopify\'s Checkout Extensibility platform lets merchants inject custom UI blocks via extensions. Performance monitoring shows p95 page load has grown by ~60ms since extension adoption crossed 40% of Plus merchants. Each extension adds 8-15ms independently, but they stack.',
    scenario_trigger: 'The VP of Engineering asks for a performance recovery plan that does not require merchants to remove or simplify their extensions. The constraint is explicit: merchant customizations are protected.',
    scenario_question: 'What is your execution plan to restore checkout performance without breaking merchant extensions?',
    engineer_standout: 'Recognize that this is a platform architecture problem, not a merchant-by-merchant tuning problem — the solution must be systematic, not advisory.',
    paradigm: 'traditional',
    industry: 'e_commerce',
    sub_vertical: 'checkout',
    difficulty: 'staff_plus',
    estimated_minutes: 18,
    primary_competencies: ['technical_strategy', 'platform_architecture'],
    secondary_competencies: ['performance_engineering', 'tradeoff_reasoning'],
    frameworks: ['systems_design', 'constraint_based_design'],
    relevant_roles: ['staff_engineer', 'founding_engineer', 'em'],
    company_tags: ['shopify'],
    tags: ['checkout', 'performance', 'extensibility', 'platform', 'latency'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'Where is the 60ms going, and which part of that is the platform\'s problem versus the extension author\'s problem?',
        grading_weight: 20,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the root cause of the p95 checkout latency regression?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['root_cause_analysis', 'systems_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Extensions execute independently with no coordination, so their load phases overlap in the worst possible way — the platform loads them sequentially or without shared resource budgets, causing latency to stack additively rather than being absorbed in parallel.',
                quality: 'best',
                points: 3,
                competencies: ['root_cause_analysis', 'platform_architecture'],
                explanation: 'If extensions ran in parallel with shared resource budgets, 5 extensions at 12ms each would not produce 60ms — they would approach the max of any single extension. Sequential or uncoordinated loading is the architectural cause; individual extension performance is a secondary lever.'
              },
              {
                option_label: 'B',
                option_text: 'Extension authors are not following performance guidelines, so each extension is individually too slow.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['root_cause_analysis'],
                explanation: 'Even if every extension ran at exactly 12ms — which is within Shopify\'s documented extension budget — five of them stacking would still produce 60ms. The problem is architectural, not per-extension compliance.'
              },
              {
                option_label: 'C',
                option_text: 'The checkout page has accumulated too much JavaScript bundle weight, and extensions are contributing to a growing main-thread blocking problem.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['performance_engineering'],
                explanation: 'Bundle weight and main-thread blocking are plausible contributors but the scenario describes a clear correlation with extension count (8-15ms per extension). The stacking mechanism is more specific than generic bundle bloat.'
              },
              {
                option_label: 'D',
                option_text: 'Plus merchants have more complex stores overall, so the p95 latency regression reflects their store complexity, not the extensions specifically.',
                quality: 'surface',
                points: 1,
                competencies: ['analytical_thinking'],
                explanation: 'The scenario specifies that extension adoption is the correlated variable. Attributing this to general Plus merchant complexity without evidence is a retreat from the available data.'
              }
            ]
          }
        ]
      },
      {
        step: 'list' as const,
        step_nudge: 'What are the platform-level mechanisms that could reduce the 60ms without touching merchant extension code?',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of platform-level performance recovery mechanisms is most architecturally sound?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['technical_architecture', 'performance_engineering'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Parallel extension loading with a shared render budget, server-side pre-rendering of extension output with hydration on the client, and a priority queue so above-the-fold extensions load before below-the-fold ones.',
                quality: 'best',
                points: 3,
                competencies: ['platform_architecture', 'performance_engineering'],
                explanation: 'These three mechanisms address the stacking problem at the platform layer. Parallel loading reduces wall time; SSR pre-rendering moves work off the critical path; priority queuing ensures visible content loads first. Together they can recover most of the 60ms without touching extension code.'
              },
              {
                option_label: 'B',
                option_text: 'Introduce a performance score for each extension and surface it in the merchant dashboard so merchants can make informed decisions about which to keep.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['transparency'],
                explanation: 'Performance scoring is a good transparency measure but it is advisory. The VP constraint is explicit: merchant customizations are protected. This approach still relies on merchants removing extensions, which violates the constraint.'
              },
              {
                option_label: 'C',
                option_text: 'Enforce a hard cap of 3 extensions per checkout page, with Shopify selecting the 3 highest-priority extensions based on merchant configuration.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['platform_governance'],
                explanation: 'Capping extensions at 3 breaks merchant customizations, which is explicitly off the table. This directly violates the constraint stated in the problem.'
              },
              {
                option_label: 'D',
                option_text: 'Optimize the Checkout Extensibility runtime itself — reduce the framework overhead each extension pays on initialization.',
                quality: 'surface',
                points: 1,
                competencies: ['performance_engineering'],
                explanation: 'Runtime optimization is useful but it reduces per-extension cost, not the stacking problem. Even a 50% reduction in per-extension cost still leaves 30ms of additive latency from 5 extensions. The architectural problem requires an architectural fix.'
              }
            ]
          }
        ]
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Pick the first platform change to ship and name the engineering tradeoff.',
        grading_weight: 35,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the highest-leverage first platform change and what does it cost to ship it?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['prioritization', 'technical_tradeoffs'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Ship parallel extension loading first. It requires no changes to extension APIs or merchant configurations, addresses the stacking mechanism directly, and is self-contained within the platform runtime. The cost: concurrent extension initialization increases peak memory usage at load time, requiring a memory budget per checkout session.',
                quality: 'best',
                points: 3,
                competencies: ['prioritization', 'technical_tradeoffs'],
                explanation: 'Parallel loading is the highest-ROI change because it is platform-contained, backward-compatible with existing extensions, and addresses the root stacking mechanism. Naming the memory cost shows engineering depth — concurrency trades serial memory efficiency for parallel time efficiency.'
              },
              {
                option_label: 'B',
                option_text: 'Ship server-side pre-rendering first because it moves the most work off the client critical path and directly attacks p95 latency.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['technical_thinking'],
                explanation: 'SSR is high impact but higher complexity — it requires extension authors to ensure their extensions support server rendering, which is a breaking change for extensions that depend on client-only browser APIs. Parallel loading has no such dependency.'
              },
              {
                option_label: 'C',
                option_text: 'Ship all three mechanisms simultaneously in a single platform release to maximize the recovery in one shot.',
                quality: 'surface',
                points: 1,
                competencies: ['planning'],
                explanation: 'Shipping three architectural changes simultaneously makes debugging regressions nearly impossible. If latency gets worse or extension breakage appears, the team cannot isolate the cause. Staged rollout with measurable targets per stage is the right protocol.'
              },
              {
                option_label: 'D',
                option_text: 'Build a performance testing sandbox first so extension authors can test their extensions against the new platform before rollout.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['process_thinking'],
                explanation: 'A sandbox is useful for SSR migration (where extension authors need to verify compatibility) but irrelevant for parallel loading, which requires no extension changes. This delays the highest-ROI fix to solve a problem that does not yet exist.'
              }
            ]
          }
        ]
      },
      {
        step: 'win' as const,
        step_nudge: 'How do you know when you are done?',
        grading_weight: 20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the success definition for the performance recovery plan?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics_definition', 'decision_making'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'p95 checkout page load returns to within 10ms of pre-extensibility baseline for merchants with 3+ active extensions, with zero reported extension functionality regressions in the 2 weeks post-rollout.',
                quality: 'best',
                points: 3,
                competencies: ['metrics_definition', 'decision_making'],
                explanation: 'This success definition is bounded (10ms tolerance acknowledges that some overhead is acceptable), scoped to the affected segment (3+ extensions), and includes a stability guard (no functionality regressions). It is actionable and falsifiable.'
              },
              {
                option_label: 'B',
                option_text: 'p95 checkout load time drops below 2 seconds for all Plus merchants globally.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_definition'],
                explanation: 'An absolute threshold ignores that the starting latency varies by merchant. The goal is to recover the regression caused by extensions, not to hit a universal absolute target that was not the starting state.'
              },
              {
                option_label: 'C',
                option_text: 'The 60ms regression is fully eliminated with no latency increase from extensions regardless of how many are active.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics_definition'],
                explanation: 'Zero latency from extensions is physically impossible — parallel loading reduces stacking but does not eliminate execution time. Setting an impossible target produces a failure outcome by definition.'
              },
              {
                option_label: 'D',
                option_text: 'Checkout latency stabilizes without further growth as extension adoption continues to increase.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_definition'],
                explanation: 'Stability is a reasonable long-term goal but does not define recovery of the existing 60ms regression. The VP asked for performance restoration, not just prevention of further degradation.'
              }
            ]
          }
        ]
      }
    ]
  },

  {
    id: 'hp-facebook-p2p-payments-messenger',
    title: 'Peer-to-Peer Payments Inside Messenger: Build It?',
    scenario_role: 'tech lead',
    scenario_context: 'Messenger has 1B+ monthly active users and a payment infrastructure layer through Meta Pay. Venmo and Cash App have normalized P2P payments in mobile apps. The growth team is exploring whether a native P2P payments feature inside Messenger could drive engagement and expand Meta Pay adoption.',
    scenario_trigger: 'The payments team lead presents the opportunity at a product strategy offsite. The question lands on the table: should this ship, and if so, what does the MVP look like?',
    scenario_question: 'Should Facebook add peer-to-peer payments inside Messenger, and what would a winning MVP look like?',
    engineer_standout: 'Recognize that the value of P2P payments in Messenger is not the payment itself but the social proof and request loops it creates — payments are a reason to message, not a feature bolted onto messaging.',
    paradigm: 'traditional',
    industry: 'fintech',
    sub_vertical: 'social_payments',
    difficulty: 'standard',
    estimated_minutes: 14,
    primary_competencies: ['product_strategy', 'feature_design'],
    secondary_competencies: ['growth_thinking', 'fintech_fluency'],
    frameworks: ['jobs_to_be_done', 'mvp_scoping'],
    relevant_roles: ['tech_lead', 'founding_engineer', 'staff_engineer'],
    company_tags: ['stripe', 'facebook'],
    tags: ['payments', 'p2p', 'messenger', 'fintech', 'mvp', 'social'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'What job does a Messenger user have that P2P payments could serve — and is payments actually the job, or is something else?',
        grading_weight: 20,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the core user job that P2P payments in Messenger would serve?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['problem_framing', 'customer_empathy'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Settling shared costs without leaving the conversation — the job is "close the loop on a social obligation without context-switching to Venmo." The payment is a punctuation mark on a social interaction, not a standalone financial transaction.',
                quality: 'best',
                points: 3,
                competencies: ['problem_framing', 'customer_empathy'],
                explanation: 'This frames the job correctly: Messenger is where the coordination already happens, and friction comes from leaving it to settle. The Venmo feed as a social layer reinforces that payments-as-social-signal is the actual product, not the money movement.'
              },
              {
                option_label: 'B',
                option_text: 'Access a fast and free money transfer service, since many users pay fees on competing apps.',
                quality: 'surface',
                points: 1,
                competencies: ['market_analysis'],
                explanation: 'Fee reduction is a weak differentiator — Cash App and Zelle are already free. Framing the job as cost avoidance positions Messenger as an inferior Venmo rather than a contextually superior product.'
              },
              {
                option_label: 'C',
                option_text: 'Replace their primary banking app with a social-first financial tool, building toward a super-app model.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_strategy'],
                explanation: 'Super-app ambition is a strategy framing, not a user job. Most users will not replace their banking relationship with Messenger payments — the job is narrow and social, not broad and financial.'
              },
              {
                option_label: 'D',
                option_text: 'Send money to family and friends internationally, where Messenger already has strong cross-border communication usage.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['market_analysis'],
                explanation: 'Remittance is a real and high-value use case — especially in markets where Messenger dominates communication. But it is a specific segment, not the core job for a US-first MVP.'
              }
            ]
          }
        ]
      },
      {
        step: 'list' as const,
        step_nudge: 'What are the distinct MVP scope options, and what does each one optimize for?',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which MVP scope for Messenger P2P payments is best positioned to test the core hypothesis?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['mvp_design', 'hypothesis_testing'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Inline payment requests inside a conversation thread — "Request $20" as a message type — with one-tap send via Meta Pay. No feed, no social sharing, no receipts. The hypothesis: payment requests inside conversations complete at higher rates than switching to Venmo.',
                quality: 'best',
                points: 3,
                competencies: ['mvp_design', 'hypothesis_testing'],
                explanation: 'This MVP scopes to the unique Messenger value proposition — contextual payment in an active conversation — and states a falsifiable hypothesis. It is minimal: no social feed, no new financial surface, just the one-tap settlement inside an existing message thread.'
              },
              {
                option_label: 'B',
                option_text: 'Full P2P with a Venmo-style social feed where users can see friends\' transactions, emoji reactions, and a running balance.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_design'],
                explanation: 'The social feed is Venmo\'s core engagement loop and is worth building eventually, but as an MVP it adds regulatory complexity (financial data in a social feed has CFPB implications) and delays testing the core payment hypothesis.'
              },
              {
                option_label: 'C',
                option_text: 'Launch P2P payments in 5 international markets where Messenger is the dominant communication app and remittance use cases are strong.',
                quality: 'surface',
                points: 1,
                competencies: ['go_to_market'],
                explanation: 'International-first adds currency, compliance, and banking partner complexity that is not required to test whether P2P in conversation drives settlement. The MVP should test the core mechanic in the simplest possible market first.'
              },
              {
                option_label: 'D',
                option_text: 'Build a P2P payments bot within Messenger that users can invoke with natural language: "@pay Sarah $15 for dinner."',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_design'],
                explanation: 'A bot-based flow adds NLU failure modes and requires users to learn a new interaction pattern. The job-to-be-done is low-friction settlement, not conversational AI for payments — the bot adds complexity without serving the core job better.'
              }
            ]
          }
        ]
      },
      {
        step: 'optimize' as const,
        step_nudge: 'What is the single biggest risk in the MVP and how do you mitigate it without descoping?',
        grading_weight: 35,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the highest-risk element of the Messenger P2P MVP and what is the specific mitigation?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['risk_analysis', 'tradeoff_reasoning'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Fraud and social engineering risk — Messenger\'s billion-user social graph means bad actors can request payments at scale from weak-tie contacts. Mitigation: limit MVP to payments between mutual friends (strong-tie graph only) and introduce a 24-hour hold for first-time sender-receiver pairs.',
                quality: 'best',
                points: 3,
                competencies: ['risk_analysis', 'fintech_fluency'],
                explanation: 'Fraud in social payment networks is not theoretical — Zelle lost $440M to social engineering in 2022. Restricting MVP to the strong-tie graph (mutual friends) reduces attack surface without descoping the core use case, since the job-to-be-done is splitting costs with close contacts, not strangers.'
              },
              {
                option_label: 'B',
                option_text: 'Regulatory risk — money transmission licenses vary by state and country and could block launch. Mitigation: use a licensed third-party processor to absorb regulatory compliance.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['regulatory_thinking'],
                explanation: 'Regulatory compliance is a real constraint but Meta already has money transmission licenses through Meta Pay. The third-party processor suggestion solves a problem that likely already exists in Meta\'s infrastructure.'
              },
              {
                option_label: 'C',
                option_text: 'User trust risk — users may not trust Facebook with financial data after Cambridge Analytica. Mitigation: run a PR campaign emphasizing security and data separation.',
                quality: 'surface',
                points: 1,
                competencies: ['brand_risk'],
                explanation: 'Trust is a headwind but not the highest-risk element for an MVP. Meta Pay already processes transactions — the trust question is not new to this feature. A PR campaign is not a risk mitigation strategy; it is a communications tactic.'
              },
              {
                option_label: 'D',
                option_text: 'Adoption risk — users may prefer to stay on Venmo because of established habit. Mitigation: offer a fee-free incentive for the first 6 months to drive trial.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['growth_thinking'],
                explanation: 'Incentive-based trial tests price sensitivity, not product-market fit. If the contextual settlement value proposition is right, users will adopt without a discount. If they do not adopt without a discount, free trials mask the actual PMF signal.'
              }
            ]
          }
        ]
      },
      {
        step: 'win' as const,
        step_nudge: 'Should this ship? Give a clean yes or no with the metric that proves you right.',
        grading_weight: 20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the recommendation and the 90-day metric that validates or invalidates it?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['decision_making', 'metrics_definition'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Ship it. Success metric: payment request completion rate (requests sent that result in a completed payment) above 60% within the strong-tie graph, measured at day 30. Secondary: week-2 retention of Messenger among users who complete a payment vs. control.',
                quality: 'best',
                points: 3,
                competencies: ['decision_making', 'metrics_definition'],
                explanation: 'Completion rate tests the core hypothesis — that contextual payment in conversation reduces the friction that causes Venmo drop-off. The retention secondary tests whether payments drive engagement, which is the strategic reason to build it.'
              },
              {
                option_label: 'B',
                option_text: 'Ship it and track total payment volume processed through Meta Pay as the north star.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics_definition'],
                explanation: 'Total payment volume is a lagging output metric driven by user count, not product quality. It cannot tell you whether the contextual settlement hypothesis is correct — large volume could come from low-value, high-frequency novelty usage.'
              },
              {
                option_label: 'C',
                option_text: 'Do not ship until the fraud mitigation infrastructure is fully built and tested in a 6-month pilot.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['decision_making'],
                explanation: 'Six months of pre-launch fraud infrastructure before any user signal is a waterfall approach to a product hypothesis test. The strong-tie graph restriction and 24-hour hold are sufficient fraud controls for an MVP at controlled scale.'
              },
              {
                option_label: 'D',
                option_text: 'Ship it and measure DAU impact on Messenger — if payments drive 5% DAU increase, the feature is validated.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics_definition'],
                explanation: 'DAU is too coarse a signal — payments would need to reach significant penetration before a DAU effect is measurable. Completion rate isolates the product hypothesis before the scale needed to move aggregate DAU.'
              }
            ]
          }
        ]
      }
    ]
  },

  {
    id: 'hp-stripe-developer-activation-decline',
    title: 'Stripe Developer Activation Is Slipping: Find the Root Cause',
    scenario_role: 'founding engineer',
    scenario_context: 'Stripe defines activation as a developer making their first successful live payment within 14 days of creating an account. Activation rate has declined 8 points over two quarters. The developer experience team suspects documentation gaps; the growth team suspects friction in API key setup.',
    scenario_trigger: 'The Head of Developer Experience escalates to the product review. The request: identify the most likely root cause and design an experiment to confirm it before the next planning cycle.',
    scenario_question: 'What metrics do you look at first, and how do you design an experiment to identify the root cause of the developer activation decline?',
    engineer_standout: 'Recognize that "activation" is a funnel with distinct stages, and the 8-point drop could be concentrated at any one stage — measuring at the wrong stage produces the wrong intervention.',
    paradigm: 'traditional',
    industry: 'fintech',
    sub_vertical: 'developer_tools',
    difficulty: 'advanced',
    estimated_minutes: 15,
    primary_competencies: ['metrics_definition', 'diagnostic_thinking'],
    secondary_competencies: ['experiment_design', 'developer_empathy'],
    frameworks: ['funnel_analysis', 'hypothesis_testing'],
    relevant_roles: ['staff_engineer', 'founding_engineer', 'tech_lead'],
    company_tags: ['stripe'],
    tags: ['developer-experience', 'activation', 'metrics', 'experiment-design', 'stripe'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'Where in the 14-day activation funnel is the 8-point drop concentrated?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the highest-value metric to examine first when investigating the developer activation decline?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['diagnostic_thinking', 'funnel_analysis'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Stage-by-stage conversion within the 14-day activation funnel: account creation to API key retrieval, API key retrieval to first test payment, first test payment to first live payment. The goal is to isolate which transition drives the decline before investigating why.',
                quality: 'best',
                points: 3,
                competencies: ['funnel_analysis', 'diagnostic_thinking'],
                explanation: 'An 8-point aggregate drop could be entirely concentrated at one funnel stage. If 90% of the decline is between API key retrieval and first test payment, the documentation-gap hypothesis is more likely; if it is between test and live, the live key setup friction hypothesis is more likely.'
              },
              {
                option_label: 'B',
                option_text: 'Time-to-first-API-call — how long from account creation to the first authenticated request in the test environment.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['diagnostic_thinking'],
                explanation: 'Time-to-first-API-call is a useful proxy for setup friction, but it only covers the early funnel. If developers are making test calls quickly but failing to go live, this metric will not detect the actual drop point.'
              },
              {
                option_label: 'C',
                option_text: 'Developer NPS and qualitative session replay data to understand where developers feel confused.',
                quality: 'surface',
                points: 1,
                competencies: ['user_research'],
                explanation: 'Qualitative data is valuable as a follow-on, but NPS is too lagging and unfocused to identify a specific funnel drop. Session replay is expensive to analyze at scale and is better applied once the problem stage is quantitatively confirmed.'
              },
              {
                option_label: 'D',
                option_text: 'Cohort analysis by developer segment: solo developers vs. startup teams vs. enterprise developers, to see which segment is driving the decline.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['segmentation'],
                explanation: 'Cohort segmentation is a valid second cut but it is not the first question. Without knowing which funnel stage is dropping, segmenting by developer type does not tell you what to fix.'
              }
            ]
          }
        ]
      },
      {
        step: 'list' as const,
        step_nudge: 'Generate the plausible hypotheses that could explain an 8-point activation decline at Stripe.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of hypotheses most completely covers the plausible root causes of a developer activation decline at Stripe?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['hypothesis_generation', 'developer_empathy'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Documentation-to-code gap (developers cannot translate docs to working integration), live key setup friction (compliance steps for live mode deter first payment), cohort mix shift (more inexperienced developers signing up who need more hand-holding), and competing library changes (SDK upgrade broke existing integration patterns).',
                quality: 'best',
                points: 3,
                competencies: ['hypothesis_generation', 'developer_empathy'],
                explanation: 'This set covers both supply-side causes (Stripe changed something) and demand-side causes (the incoming developer population changed). A cohort mix shift is a common invisible cause of activation rate changes that teams overlook because it requires no product failure.'
              },
              {
                option_label: 'B',
                option_text: 'Poor documentation, confusing dashboard UX, and too many required fields in the account setup flow.',
                quality: 'surface',
                points: 1,
                competencies: ['ux_thinking'],
                explanation: 'These are three variations of the same documentation/UX hypothesis, not three distinct hypotheses. The list does not include supply-side changes (SDK, API versioning) or demand-side shifts (cohort mix) as alternative explanations.'
              },
              {
                option_label: 'C',
                option_text: 'Developer satisfaction has dropped because Stripe pricing increased, pushing cost-sensitive developers to alternatives like LemonSqueezy.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['market_analysis'],
                explanation: 'Activation rate measures whether developers complete their first live payment, not whether they stay with Stripe long-term. If developers are leaving for competitors before activating, that would show in signup volume, not activation rate.'
              },
              {
                option_label: 'D',
                option_text: 'Documentation-to-code gap, live key compliance friction, and a recent Stripe SDK version change that broke common integration patterns.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['hypothesis_generation'],
                explanation: 'Three strong hypotheses covering different causal mechanisms. Missing the cohort mix shift, which is an important non-product explanation that would change the response: if the developer population changed, product fixes may not recover activation.'
              }
            ]
          }
        ]
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Design one experiment that can confirm or reject the highest-priority hypothesis.',
        grading_weight: 30,
        step_order: 3,
        questions: [
          {
            question_text: 'Assuming funnel analysis shows the biggest drop is between test payment and first live payment, what is the highest-signal experiment?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['experiment_design', 'hypothesis_testing'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'A/B test: treatment group gets a concierge activation email at day 3 with a personalized checklist of remaining live-mode setup steps and a direct link to the specific compliance requirement they have not completed. Control: existing flow. Primary metric: live payment completion rate by day 14.',
                quality: 'best',
                points: 3,
                competencies: ['experiment_design', 'hypothesis_testing'],
                explanation: 'This experiment tests whether friction-reduction in the live-mode setup process drives activation. The personalized checklist removes the discovery cost for the specific missing steps without changing the underlying requirements. It is low-engineering-cost and produces a clean signal within 14 days.'
              },
              {
                option_label: 'B',
                option_text: 'Remove all compliance requirements for the first live payment to measure how many developers would activate without friction.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['experiment_design'],
                explanation: 'Removing compliance requirements for live payments is not a testable intervention — it is a regulatory violation. KYC/AML requirements for live payment processing are legal obligations, not product choices.'
              },
              {
                option_label: 'C',
                option_text: 'Conduct 10 user interviews with developers who reached test payment but did not activate to understand their blockers qualitatively.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['user_research'],
                explanation: 'User interviews are a good pre-experiment diagnostic, but the question asks for an experiment to identify the root cause — interviews generate hypotheses, they do not confirm them. This is step 0, not the experiment itself.'
              },
              {
                option_label: 'D',
                option_text: 'Redesign the Stripe dashboard live-mode activation flow based on developer feedback collected through in-product surveys, then measure activation rate pre and post launch.',
                quality: 'surface',
                points: 1,
                competencies: ['experiment_design'],
                explanation: 'Pre/post measurement without a control group cannot isolate whether any activation rate change is caused by the redesign or by seasonal variation, cohort mix shifts, or other concurrent changes.'
              }
            ]
          }
        ]
      },
      {
        step: 'win' as const,
        step_nudge: 'What is the recommendation to the Head of Developer Experience before the planning cycle closes?',
        grading_weight: 20,
        step_order: 4,
        questions: [
          {
            question_text: 'What do you recommend and what is the earliest point at which you will know if you were right?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['decision_making', 'communication'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Run the concierge activation experiment for 3 weeks, reading interim results at day 7 for early signal. If the treatment shows 15%+ lift in live payment completion, prioritize live-mode friction reduction in the next planning cycle. If flat, pivot to investigating the cohort mix shift hypothesis.',
                quality: 'best',
                points: 3,
                competencies: ['decision_making', 'communication'],
                explanation: 'This recommendation names a decision criteria, an interim checkpoint, and a fallback pivot — all within the planning cycle window. The 15% threshold is directional without being falsely precise, and naming the cohort hypothesis as the fallback shows depth of diagnostic thinking.'
              },
              {
                option_label: 'B',
                option_text: 'Recommend a 6-week experiment program covering all four hypotheses before making a planning cycle commitment.',
                quality: 'surface',
                points: 1,
                competencies: ['planning'],
                explanation: 'Six weeks exceeds the planning cycle and does not produce a timely recommendation. Running four experiments in parallel has high engineering cost; the diagnostic funnel analysis should have already narrowed the hypothesis set.'
              },
              {
                option_label: 'C',
                option_text: 'Invest in documentation improvements as the first move, since documentation gaps are the most common cause of developer activation problems across the industry.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['decision_making'],
                explanation: 'Acting on the industry-average hypothesis before confirming it is the Stripe-specific cause wastes engineering capacity if the funnel analysis shows documentation is not the drop point. The funnel data should guide the investment, not a prior.'
              },
              {
                option_label: 'D',
                option_text: 'Present the funnel analysis findings and recommend a dedicated developer activation sprint in the next planning cycle with a target of recovering 5 of the 8 lost points.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['communication'],
                explanation: 'Presenting findings is good but stopping at "run a sprint" without a hypothesis-driven experiment plan does not fulfill the request for root cause identification. The sprint needs to be scoped to the confirmed hypothesis.'
              }
            ]
          }
        ]
      }
    ]
  },

  {
    id: 'hp-stripe-api-simple-vs-powerful',
    title: 'Stripe API: Simple Enough for Solo Devs, Powerful Enough for Enterprise',
    scenario_role: 'staff engineer',
    scenario_context: 'Stripe serves developers ranging from solo founders integrating their first payment to engineering teams at Fortune 500 companies processing billions in volume. The API surface has grown significantly — Stripe now has 700+ documented API objects. New developers report the surface as overwhelming; enterprise teams report missing knobs for advanced routing and compliance requirements.',
    scenario_trigger: 'The developer platform leadership is reviewing whether the API design philosophy needs to change. The question on the table: how do you balance simplicity and power without forking the product?',
    scenario_question: 'How do you balance making Stripe\'s APIs simple enough for solo developers while powerful enough for enterprise companies?',
    engineer_standout: 'Recognize that simplicity and power are not a slider — they require separate surfaces with shared foundations: a high-floor default path and a low-ceiling escape hatch architecture.',
    paradigm: 'traditional',
    industry: 'fintech',
    sub_vertical: 'developer_tools',
    difficulty: 'staff_plus',
    estimated_minutes: 18,
    primary_competencies: ['platform_design', 'developer_experience'],
    secondary_competencies: ['api_design', 'product_strategy'],
    frameworks: ['progressive_disclosure', 'platform_theory'],
    relevant_roles: ['staff_engineer', 'founding_engineer', 'tech_lead'],
    company_tags: ['stripe'],
    tags: ['api-design', 'developer-experience', 'stripe', 'platform', 'enterprise'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'Is this a single product-design problem or two separate problems that happen to share infrastructure?',
        grading_weight: 20,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the simplicity-vs-power tension in Stripe\'s API?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['problem_framing', 'api_design'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'The tension is not a design failure — it is an architecture problem. Solo developers and enterprise teams are accessing the same API surface, but they need different default configurations and different depths of access. The solution is progressive disclosure: a simple default path that gets out of the way, with escape hatches to full power when needed.',
                quality: 'best',
                points: 3,
                competencies: ['problem_framing', 'api_design'],
                explanation: 'Progressive disclosure is the canonical resolution of this tension in developer platform design. Stripe\'s own SDKs already reflect this — PaymentIntent\'s `automatic_payment_methods: true` default abstracts significant complexity behind one parameter. The frame identifies the design pattern rather than declaring an irreconcilable tradeoff.'
              },
              {
                option_label: 'B',
                option_text: 'Stripe should build two separate API products: a simple consumer-facing API for small developers and a full-featured enterprise API for large customers.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_strategy'],
                explanation: 'Two separate APIs require double the maintenance overhead and create an awkward migration path when a solo developer\'s startup scales to enterprise. Stripe\'s compounding value is that code written in year one still works at billion-dollar scale — forking the API destroys that.'
              },
              {
                option_label: 'C',
                option_text: 'This is primarily a documentation problem. The API is powerful enough for enterprise and could be simple enough for solo developers if the documentation better highlighted the recommended path.',
                quality: 'surface',
                points: 1,
                competencies: ['developer_experience'],
                explanation: 'Documentation improvements are necessary but not sufficient when the API surface has 700+ objects. A developer starting a new integration encounters the full surface before documentation can guide them through it — the API design itself must carry the simplicity.'
              },
              {
                option_label: 'D',
                option_text: 'Stripe needs to prune deprecated and low-usage API endpoints to reduce surface area and simplify the developer experience.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['api_design'],
                explanation: 'Pruning dead surface is good hygiene but it does not resolve the core tension. Enterprise features that solo developers find overwhelming are not deprecated — they are actively used. Removing them trades power for simplicity rather than achieving both.'
              }
            ]
          }
        ]
      },
      {
        step: 'list' as const,
        step_nudge: 'What are the concrete design mechanisms that enable progressive disclosure in a payments API?',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of API design mechanisms best implements progressive disclosure for Stripe\'s use case?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['api_design', 'platform_architecture'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Opinionated defaults that are correct for 90% of cases, explicit opt-in flags for advanced behavior, and versioned complexity tiers (e.g., `payment_intent_simple` vs. `payment_intent` for full control). Each tier is fully documented but the simple tier is the entry path.',
                quality: 'best',
                points: 3,
                competencies: ['api_design', 'progressive_disclosure'],
                explanation: 'Opinionated defaults mirror how Stripe already designs its best APIs — `automatic_payment_methods: {enabled: true}` vs. manual payment method specification is this pattern in practice. Explicit opt-in flags avoid surprising advanced users while keeping the default path uncluttered.'
              },
              {
                option_label: 'B',
                option_text: 'Offer both REST and GraphQL interfaces: REST for simplicity, GraphQL for enterprise teams who need precise field selection and batching.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['api_design'],
                explanation: 'REST vs. GraphQL does not resolve the simplicity-power tension — it adds a protocol maintenance burden. Enterprise teams at Stripe do not need GraphQL; they need routing control, idempotency guarantees, and compliance hooks, all of which are orthogonal to query language.'
              },
              {
                option_label: 'C',
                option_text: 'A developer-tier system in the dashboard: "Standard" mode shows simplified API docs and SDKs, "Advanced" mode unlocks the full reference.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['developer_experience'],
                explanation: 'Dashboard tiering is a UX mechanism that helps with documentation discoverability, but it does not change the API surface itself. A developer copying a code snippet from "Standard" docs into a codebase will encounter the full API when they need to extend it.'
              },
              {
                option_label: 'D',
                option_text: 'Pre-built integrations (Stripe Checkout, Payment Links) for the simple use case, raw API access for enterprise — two separate surfaces that serve different audiences.',
                quality: 'surface',
                points: 1,
                competencies: ['product_design'],
                explanation: 'Checkout and Payment Links are real products that Stripe already ships, but this answer describes existing product lines rather than an API design philosophy. It also creates a migration cliff: developers outgrow Checkout but lose continuity when they move to raw API.'
              }
            ]
          }
        ]
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Name the hard constraint that limits how far progressive disclosure can go without fragmenting the platform.',
        grading_weight: 35,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the hardest constraint in implementing progressive disclosure for a payments API at Stripe\'s scale?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['tradeoff_reasoning', 'platform_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Backward compatibility: every default you set today is a contract. If `automatic_payment_methods: true` becomes the simple default, enterprise customers who needed the old explicit behavior must not be broken when they upgrade SDK versions. The constraint is that progressive disclosure requires stable defaults that cannot change without a major version bump.',
                quality: 'best',
                points: 3,
                competencies: ['tradeoff_reasoning', 'api_design'],
                explanation: 'Stripe\'s most famous engineering principle is API backward compatibility — the original 2011 Charge object still works. Defaults are the hardest part of this: a default that changes behavior for existing integrations when a developer upgrades their SDK version is a breaking change in practice even if it is not technically a breaking API change.'
              },
              {
                option_label: 'B',
                option_text: 'Engineering cost: maintaining two documentation sets and two onboarding paths doubles the developer relations workload.',
                quality: 'surface',
                points: 1,
                competencies: ['operational_thinking'],
                explanation: 'Documentation cost is a real operational constraint but not the hardest technical constraint. Stripe already maintains multiple documentation tiers (Quickstart vs. API Reference). The backward compatibility problem is architecturally harder.'
              },
              {
                option_label: 'C',
                option_text: 'Enterprise customers will resist "simple" defaults that may hide behavior they depend on, making adoption of progressive disclosure politically difficult.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['stakeholder_thinking'],
                explanation: 'Enterprise resistance is real and worth addressing, but it is a go-to-market constraint, not a platform architecture constraint. Opt-in flags resolve the resistance: enterprise teams stay on explicit configuration; defaults only apply to new integrations that did not previously specify the parameter.'
              },
              {
                option_label: 'D',
                option_text: 'Regulatory requirements force explicit parameter specification for many payment types, making it impossible to hide complexity behind defaults in regulated markets.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['regulatory_thinking'],
                explanation: 'Regulatory requirements do constrain which defaults are permissible, but Stripe\'s existing defaults already handle regulatory requirements correctly — `automatic_payment_methods` selects compliant payment methods for the customer\'s region. Regulation is an input to default design, not a prohibition on defaults.'
              }
            ]
          }
        ]
      },
      {
        step: 'win' as const,
        step_nudge: 'What is the concrete recommendation to the developer platform leadership?',
        grading_weight: 20,
        step_order: 4,
        questions: [
          {
            question_text: 'What do you recommend, and what is the one metric that tells you the design philosophy is working?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['decision_making', 'metrics_definition'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Adopt progressive disclosure as the platform design principle: audit every new API object for a "simple default" path, require explicit opt-in for advanced behavior, and freeze default changes in SemVer. Success metric: median lines-of-code to first working PaymentIntent integration drops 40% over 12 months without regression in enterprise NPS.',
                quality: 'best',
                points: 3,
                competencies: ['decision_making', 'metrics_definition'],
                explanation: 'Lines-of-code to first working integration is the most direct proxy for API simplicity — it is what "simple" actually means to a developer starting from scratch. The enterprise NPS guard ensures simplicity improvements do not come at the cost of power. SemVer freezing addresses the backward compatibility constraint.'
              },
              {
                option_label: 'B',
                option_text: 'Launch a "Stripe Essentials" tier with a simplified API surface aimed at solo developers, measured by Essentials-tier adoption rate among new signups.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['decision_making'],
                explanation: 'A named tier is a legitimate go-to-market approach but it risks recreating the migration cliff problem — developers who start on Essentials still need to understand the full API when they scale. Adoption rate does not measure whether the design is actually simpler.'
              },
              {
                option_label: 'C',
                option_text: 'Commission a 6-month developer experience study comparing Stripe, Braintree, and Adyen to establish baseline metrics before making design changes.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['decision_making'],
                explanation: 'Competitive benchmarking over 6 months delays addressing a known problem. Stripe\'s own developer activation data has already identified the issue — more study produces more data, not a better design principle.'
              },
              {
                option_label: 'D',
                option_text: 'Do nothing structurally. Invest in better documentation, quickstarts, and sample code to guide developers through the existing API surface.',
                quality: 'surface',
                points: 1,
                competencies: ['decision_making'],
                explanation: 'Documentation investment is necessary but has already been Stripe\'s primary response. An 8-point activation decline while documentation is strong signals that the API surface itself — not its explanation — requires a design response.'
              }
            ]
          }
        ]
      }
    ]
  },

  {
    id: 'hp-stripe-new-financial-vertical',
    title: 'Stripe\'s Next Vertical: Where Does It Expand?',
    scenario_role: 'staff engineer',
    scenario_context: 'Stripe has built dominant positions in payment processing, billing, fraud detection (Radar), corporate cards (Issuing), and banking infrastructure (Treasury). The company is exploring which financial services vertical to enter next. The core constraint is that any new vertical must leverage Stripe\'s existing network of 1M+ businesses and its infrastructure advantage.',
    scenario_trigger: 'The product strategy team is building the 3-year roadmap. Three expansion directions are on the table: business lending, payroll infrastructure, or tax compliance automation. The ask is a structured analysis before the leadership review.',
    scenario_question: 'What would you build next for Stripe to expand into a new financial services vertical?',
    engineer_standout: 'Recognize that Stripe\'s durable advantage is data access across both sides of transactions — a lending or tax product built on that data is structurally differentiated, while a generic payroll product is a crowded market without a moat.',
    paradigm: 'ai_assisted',
    industry: 'fintech',
    sub_vertical: 'financial_infrastructure',
    difficulty: 'staff_plus',
    estimated_minutes: 18,
    primary_competencies: ['product_strategy', 'market_analysis'],
    secondary_competencies: ['platform_thinking', 'build_vs_buy'],
    frameworks: ['porter_five_forces', 'opportunity_sizing'],
    relevant_roles: ['staff_engineer', 'founding_engineer', 'tech_lead', 'em'],
    company_tags: ['stripe'],
    tags: ['stripe', 'expansion', 'fintech', 'strategy', 'lending', 'vertical'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'What is the core question to answer before picking a vertical: which expansion would give Stripe a moat that no incumbent can match?',
        grading_weight: 20,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most useful framing criterion for evaluating Stripe\'s expansion into a new financial services vertical?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['strategic_thinking', 'competitive_analysis'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Which vertical benefits most from Stripe\'s transaction-level data on 1M+ businesses — where that data creates underwriting, pricing, or compliance accuracy that incumbents cannot replicate without Stripe\'s network position?',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'competitive_analysis'],
                explanation: 'Stripe\'s moat is observability: it sees revenue, customer counts, refund rates, churn signals, and seasonality across its entire business network before any bank or lender does. Any vertical where that data advantage compounds — lending risk models, tax accuracy, fraud detection — is defensible. A vertical where data is irrelevant (generic payroll) has no structural Stripe advantage.'
              },
              {
                option_label: 'B',
                option_text: 'Which vertical has the largest total addressable market globally, giving Stripe the most revenue upside?',
                quality: 'surface',
                points: 1,
                competencies: ['market_analysis'],
                explanation: 'TAM is a necessary input but not the deciding criterion for a platform company choosing vertical expansion. A large TAM with no structural differentiation means Stripe would compete on price and features against entrenched players with lower CAC. The moat question must come before the market size question.'
              },
              {
                option_label: 'C',
                option_text: 'Which vertical has the least competition from established financial institutions, giving Stripe the clearest path to market leadership?',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['competitive_analysis'],
                explanation: 'Competition intensity matters but competition is not uniformly a blocker — Stripe entered payment processing against PayPal and Braintree. The relevant question is not "least competition" but "where is Stripe\'s structural advantage largest," which determines whether the competitive fight is winnable.'
              },
              {
                option_label: 'D',
                option_text: 'Which vertical is requested most often by Stripe\'s top 100 enterprise customers, since enterprise expansion drives the highest incremental revenue.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['market_analysis'],
                explanation: 'Enterprise customer requests reflect their current pain points, not Stripe\'s structural opportunity. Enterprise companies will request any capability that would reduce their vendor count — that signal does not identify where Stripe can build a defensible position.'
              }
            ]
          }
        ]
      },
      {
        step: 'list' as const,
        step_nudge: 'Evaluate the three candidate verticals against the moat criterion.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which analysis of the three candidate verticals most accurately maps Stripe\'s structural advantage to the expansion opportunity?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['opportunity_analysis', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Business lending has the highest data moat — Stripe can underwrite based on real-time revenue and cash flow, which is more predictive than bank lending\'s lagging credit bureau data. Tax compliance benefits from transaction-level accuracy. Payroll has the weakest data moat since Stripe lacks payroll input data (headcount, compensation structures) and incumbents like Gusto have entrenched integrations.',
                quality: 'best',
                points: 3,
                competencies: ['opportunity_analysis', 'strategic_thinking'],
                explanation: 'This analysis correctly identifies that lending and tax use Stripe\'s existing transaction data as a direct input to product quality, while payroll requires entirely new data types Stripe does not have. Stripe Capital, Stripe\'s existing SMB lending product, validates the lending data advantage empirically.'
              },
              {
                option_label: 'B',
                option_text: 'Payroll is the highest-value expansion because it is the largest spend category for SMBs and would create switching costs through payroll data lock-in.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['market_analysis'],
                explanation: 'Payroll spend volume is large but Stripe does not have a structural data advantage in payroll underwriting. Switching costs from payroll data do not compound Stripe\'s existing transaction network — they create an independent lock-in mechanism that would require a new market position to establish.'
              },
              {
                option_label: 'C',
                option_text: 'All three are viable. The decision should depend on which one has the fastest path to $1B in revenue given Stripe\'s current enterprise sales motion.',
                quality: 'surface',
                points: 1,
                competencies: ['strategic_thinking'],
                explanation: 'Revenue speed is a financial metric, not a strategic one. A fast path to $1B through generic payroll does not build a defensible position; a slower path to $500M in lending with a data moat compounds through the network in a way that payroll revenue does not.'
              },
              {
                option_label: 'D',
                option_text: 'Tax compliance automation has the highest regulatory moat — tax rules change constantly, requiring ongoing compliance investment that only a scaled platform can sustain.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['regulatory_thinking'],
                explanation: 'Regulatory complexity is a moat, but it is also a burden. Tax automation is a real opportunity (Stripe Tax already exists in early form) but the question is expansion into a new vertical, not deepening an existing one. The analysis also does not compare the data advantage across all three candidates.'
              }
            ]
          }
        ]
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Pick the vertical and name the product-level bet within it.',
        grading_weight: 35,
        step_order: 3,
        questions: [
          {
            question_text: 'Which vertical should Stripe enter and what is the specific product bet that leverages the data advantage?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['product_strategy', 'prioritization'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Expand business lending beyond Stripe Capital\'s current merchant cash advance model into a working capital line with real-time credit limits that adjust based on Stripe revenue signals — no application, no credit check, limit scales with business growth. This makes the data advantage visible to merchants and creates a flywheel: more Stripe volume enables higher credit limits, incentivizing merchants to route more through Stripe.',
                quality: 'best',
                points: 3,
                competencies: ['product_strategy', 'flywheel_thinking'],
                explanation: 'This product bet directly uses the transaction data moat — dynamic credit limits based on real-time revenue are not possible for any bank lender, only for a payment processor with full visibility. The flywheel (more volume = higher limits = incentive to route more) is the same compounding mechanism that makes Stripe\'s payment volume defensible.'
              },
              {
                option_label: 'B',
                option_text: 'Enter business lending by acquiring a licensed bank to get deposit insurance and a lending charter, then integrate Stripe data for underwriting.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation: 'Acquiring a bank is a viable path to the vertical but it is a means, not the product bet itself. The answer does not specify which lending product Stripe would build or how the data advantage would manifest in the product experience.'
              },
              {
                option_label: 'C',
                option_text: 'Enter payroll because Stripe\'s global infrastructure already handles currency, compliance, and transfers — extending this to payroll is an infrastructure reuse story.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_strategy'],
                explanation: 'Infrastructure reuse is an engineering argument, not a product strategy argument. The fact that the payments rails could support payroll transfers does not create a differentiated payroll product — Gusto, ADP, and Rippling also run on the same ACH and wire rails.'
              },
              {
                option_label: 'D',
                option_text: 'Launch Stripe Tax as a full global tax compliance platform, competing directly with Vertex and Avalara for enterprise tax determination and remittance.',
                quality: 'surface',
                points: 1,
                competencies: ['product_strategy'],
                explanation: 'Stripe Tax already exists and this answer describes deepening an existing product, not entering a new vertical. Competing with Vertex and Avalara at enterprise scale is also a long-term infrastructure fight that diverges from Stripe\'s developer-first motion.'
              }
            ]
          }
        ]
      },
      {
        step: 'win' as const,
        step_nudge: 'What does the 3-year roadmap recommendation look like and what is the bet you are making?',
        grading_weight: 20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the 3-year expansion recommendation for leadership and what is the falsifiable bet embedded in it?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['decision_making', 'communication'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text: 'Recommendation: expand Stripe Capital into a real-time working capital product over 3 years. Year 1: dynamic credit limits for top-decile Stripe merchants. Year 2: expand eligibility to median merchant based on 12-month payment history. Year 3: extend credit to marketplace sellers using platform data. The falsifiable bet: Stripe\'s payment data produces lower default rates than traditional bank lending at equivalent credit tiers.',
                quality: 'best',
                points: 3,
                competencies: ['decision_making', 'communication'],
                explanation: 'This recommendation is phased (start with the highest-signal data segment, expand as models improve), compounding (each year builds the data flywheel), and ends in a testable prediction that the data advantage actually materializes in underwriting accuracy. If default rates are not lower than bank benchmarks, the data moat hypothesis is wrong — and leadership should know that going in.'
              },
              {
                option_label: 'B',
                option_text: 'Build all three verticals over 3 years: lending in year 1, tax in year 2, payroll in year 3. This maximizes coverage of the SMB financial stack.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['decision_making'],
                explanation: 'Building three regulated financial products in three years is a resource allocation decision that ignores the moat analysis. Spreading across three verticals prevents deep investment in the one where Stripe\'s advantage is largest, and payroll\'s inclusion contradicts the analysis that showed no data moat there.'
              },
              {
                option_label: 'C',
                option_text: 'Expand Stripe Capital to all markets where Stripe Payments is live, using the existing credit model. No new product bet required.',
                quality: 'surface',
                points: 1,
                competencies: ['decision_making'],
                explanation: 'Geographic expansion of an existing product is not a new vertical expansion — it is growth within the current vertical. Leadership asked for a new financial services vertical, not a distribution play for an existing one.'
              },
              {
                option_label: 'D',
                option_text: 'Recommend business lending, but only after a 2-year feasibility study that validates Stripe\'s data advantage with a small beta cohort before committing to the 3-year roadmap.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['decision_making'],
                explanation: 'Stripe Capital already exists and has underwriting data to validate the moat hypothesis now. A 2-year feasibility study before roadmap commitment delays investment when the evidence base is already available. The beta cohort idea is directionally right but the timeline is wrong.'
              }
            ]
          }
        ]
      }
    ]
  }
]
