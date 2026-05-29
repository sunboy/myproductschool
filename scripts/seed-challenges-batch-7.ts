export const CHALLENGES = [
  // ── Shopify Challenges ─────────────────────────────────────────

  {
    id: 'pm-shopify-001',
    title: 'Cross-Border Commerce: Where to Start for SMB Merchants',
    scenario_role: 'Product Manager, International Commerce',
    scenario_context:
      'Shopify is expanding international selling capabilities for SMB merchants. Internal data shows merchants who sell cross-border generate 2.4x higher GMV than domestic-only merchants, but adoption of existing internationalization tools is below 8%.',
    scenario_trigger:
      'A merchant cohort analysis flags that the top drop-off point in cross-border setup is the currency and duties configuration screen, before merchants ever reach translations or payment method setup.',
    scenario_question:
      'Among local currency and duties, translations, and new payment methods, which capability should the team ship first to unblock the most cross-border GMV?',
    engineer_standout:
      'A strong engineer would recognize that duties and currency are prerequisites for a legally compliant and financially trustworthy checkout, while translations and payment methods are optimization layers that only matter after the baseline works.',
    paradigm: 'traditional',
    industry: 'E-commerce',
    sub_vertical: 'SMB Platform',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['cognitive_empathy'],
    frameworks: ['Jobs To Be Done', 'MoSCoW Prioritization'],
    relevant_roles: ['pm', 'swe', 'tech_lead'],
    company_tags: ['Shopify', 'Stripe', 'BigCommerce'],
    tags: ['internationalization', 'commerce', 'prioritization', 'smb', 'cross-border'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What does a merchant need to make their first successful cross-border sale, rather than their 10th?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the cross-border adoption problem for SMBs?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Merchants cannot present prices in local currency, so buyers abandon at checkout because they distrust foreign charges',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'Local currency is both the legal compliance layer (duties) and the buyer trust layer. Without it, the purchase cannot complete for many international buyers. Cohort data confirms this is the drop-off point.',
              },
              {
                option_label: 'B',
                option_text: 'Merchants lack translated storefronts, so international buyers cannot understand the product catalog',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['cognitive_empathy'],
                explanation:
                  'Translation matters for discovery, but buyers who find the product still cannot complete a compliant purchase without currency and duties. Translation is upstream in the funnel but not the conversion blocker.',
              },
              {
                option_label: 'C',
                option_text: 'Merchants lack access to local payment methods like iDEAL, Boleto, or Alipay, so international buyers have no way to pay',
                quality: 'surface',
                points: 1,
                competencies: ['domain_expertise'],
                explanation:
                  'Payment method gaps matter in specific markets, but most international buyers can pay via card at checkout. Payment method expansion is an optimization, not the baseline unlock.',
              },
              {
                option_label: 'D',
                option_text: 'The cross-border setup flow is too complex, so merchants abandon configuration before reaching the storefront',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Setup complexity is a UX problem, not a capability problem. Simplifying the flow without building the capability does not unblock GMV.',
              },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'Which signals would tell you whether currency and duties is truly the blocker versus the other two options?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which analysis best validates that currency and duties should come before translations and payment methods?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Compare checkout conversion rates for merchants with multi-currency enabled versus those without, segmented by buyer country',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'Conversion rate by currency enablement is direct outcome evidence. If multi-currency merchants convert 2x better on international traffic, the case is made without relying on proxies.',
              },
              {
                option_label: 'B',
                option_text: 'Survey SMB merchants asking which capability they want most: currency, translations, or payment methods',
                quality: 'surface',
                points: 1,
                competencies: ['cognitive_empathy'],
                explanation:
                  'Merchant preference surveys reflect what merchants think they want, not what actually drives buyer conversion. Merchants may request translations because it feels more tangible.',
              },
              {
                option_label: 'C',
                option_text: 'Audit which international markets generate the highest GMV potential and match payment method coverage to those markets',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['domain_expertise'],
                explanation:
                  'Market-level payment coverage is useful for payment method prioritization but does not address the currency and duties drop-off that the cohort data already surfaces.',
              },
              {
                option_label: 'D',
                option_text: 'Run a usability test on the cross-border setup flow to find which step causes the most confusion',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Usability testing addresses setup friction, not capability gaps. The merchants who drop off at the currency screen may do so because the capability does not work correctly, not because the UI is confusing.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'What do you sacrifice by shipping currency and duties first, and how do you defend that tradeoff?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'You commit to shipping local currency and duties first. What is the strongest argument against this choice, and how do you address it?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Counter-argument: markets like Brazil and Germany require local payment methods for any meaningful conversion, so currency without payment methods is insufficient. Response: Prioritize Brazil and Germany as Phase 2 immediately after currency ships, with payment method work running in parallel.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'Acknowledges a real market-specific limitation rather than dismissing the tradeoff, and provides a sequenced response. Brazil (Boleto) and Germany (Klarna and SEPA) are the clearest examples where payment method coverage is a harder blocker.',
              },
              {
                option_label: 'B',
                option_text: 'Counter-argument: without translations, buyers cannot read product descriptions. Response: English is widely understood and most high-intent buyers will transact even without native-language copy.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['cognitive_empathy'],
                explanation:
                  'The rebuttal is partially valid but overstated. Translation quality affects conversion on discovery and trust signals, and dismissing it entirely ignores real regional variation.',
              },
              {
                option_label: 'C',
                option_text: 'Counter-argument: currency implementation is technically complex and will delay the entire roadmap. Response: Use Shopify Payments currency conversion as a bridge while full duties calculation ships.',
                quality: 'surface',
                points: 1,
                competencies: ['domain_expertise'],
                explanation:
                  'This is an implementation mitigation, not a strategic argument. It does not address the tradeoff between the three capabilities.',
              },
              {
                option_label: 'D',
                option_text: 'Counter-argument: there is no strong argument. Currency and duties are clearly the right first step. Response: Proceed with full confidence.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Ignoring real tradeoffs is not strategic thinking. Every prioritization choice has a cost, and articulating it builds more stakeholder confidence than claiming the decision is obvious.',
              },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you measure success for currency and duties, and what triggers the decision to move to the next capability?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What success metric and threshold would you use to declare currency and duties a win before moving to translations?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'International checkout conversion rate for multi-currency merchants reaches parity with domestic conversion rate within 60 days of launch',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'creative_execution'],
                explanation:
                  'Conversion rate parity is the correct outcome metric: it confirms the currency capability removed the blocker without relying on volume metrics that grow simply by having more merchants.',
              },
              {
                option_label: 'B',
                option_text: 'Number of merchants who complete the currency and duties setup flow reaches 1,000 within 30 days',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Activation count is a leading indicator but not a success metric. Merchants completing setup does not confirm that international buyers are converting successfully.',
              },
              {
                option_label: 'C',
                option_text: 'Zero critical bugs filed against the duties calculation engine within the first sprint',
                quality: 'surface',
                points: 1,
                competencies: [],
                explanation:
                  'Bug count is a quality metric, not a success metric. A bug-free implementation that does not improve GMV has not succeeded.',
              },
              {
                option_label: 'D',
                option_text: 'Net Promoter Score from SMB merchants increases by 10 points after currency launch',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'NPS is too slow, noisy, and diffuse to attribute to a single capability release. It cannot serve as a launch gate for the next phase.',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-shopify-002',
    title: 'Shop Pay Re-Acceleration: Increasing Repeat Purchases Without Slowing Checkout',
    scenario_role: 'Product Manager, Checkout',
    scenario_context:
      'Shop Pay has a 90%+ completion rate among buyers who have saved credentials, but the cohort of buyers returning to use Shop Pay on a second or third purchase has plateaued. The growth rate on repeat GMV through Shop Pay is down to 2% quarter-over-quarter, from a prior 18%.',
    scenario_trigger:
      'Engineering flags that any new engagement layer on the checkout surface risks adding latency. The current p95 checkout load time is 1.1 seconds, and the SLA for page speed scores is strict.',
    scenario_question:
      'Without harming checkout speed, what is the highest-leverage strategy to re-accelerate repeat purchase rates through Shop Pay over the next two quarters?',
    engineer_standout:
      'A strong engineer would distinguish between checkout-time interventions (risky for latency) and pre-checkout interventions (email, push, Shop app surface) and argue for demand-side re-engagement rather than checkout-side changes.',
    paradigm: 'traditional',
    industry: 'E-commerce',
    sub_vertical: 'Payments',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['strategic_thinking', 'creative_execution'],
    secondary_competencies: ['domain_expertise'],
    frameworks: ['Growth Loops', 'North Star Framework'],
    relevant_roles: ['pm', 'swe', 'em'],
    company_tags: ['Shopify', 'Apple Pay', 'PayPal'],
    tags: ['payments', 'checkout', 'retention', 'growth', 'shop-pay'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'Is the repeat purchase problem a checkout problem, a discovery problem, or a demand problem?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the Shop Pay repeat purchase plateau?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Buyers who saved Shop Pay credentials are not returning to buy again because the Shop app and email surfaces are not surfacing relevant merchants at the right moment',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'The plateau is a demand problem, not a checkout problem. Shop Pay works when buyers arrive. The issue is that buyers are not being brought back to merchants where they already have saved credentials.',
              },
              {
                option_label: 'B',
                option_text: 'The checkout flow has too many steps after credential entry, causing drop-off before completion',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Completion rate is already 90%+, which rules out checkout friction as the cause of the plateau. This is the wrong problem statement.',
              },
              {
                option_label: 'C',
                option_text: 'Competing wallets like Apple Pay and PayPal are winning repeat purchase sessions on the same merchants where Shop Pay credentials are saved',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['domain_expertise'],
                explanation:
                  'Wallet competition is real but explaining the plateau requires understanding the demand signal. If buyers are not visiting the merchant, no wallet wins.',
              },
              {
                option_label: 'D',
                option_text: 'Shop Pay credentials are expiring or failing at a higher rate, reducing the pool of eligible repeat buyers',
                quality: 'surface',
                points: 1,
                competencies: ['domain_expertise'],
                explanation:
                  'Credential health is a valid metric to check but would show up as a completion rate drop, not a flat repeat purchase rate. Data contradicts this framing.',
              },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What surfaces outside the checkout can drive repeat buyer intent without adding checkout latency?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of interventions best re-engages buyers with saved Shop Pay credentials without adding checkout latency?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Shop app personalized feed surfacing reorder suggestions from past merchants, plus transactional email with one-tap reorder links that pre-fill Shop Pay',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'creative_execution'],
                explanation:
                  'Both interventions act before the buyer reaches checkout, eliminating latency risk entirely. Personalized reorder surfaces existing purchase intent rather than creating new demand.',
              },
              {
                option_label: 'B',
                option_text: 'Add a post-purchase loyalty points balance that displays at next checkout to incentivize return visits',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['creative_execution'],
                explanation:
                  'Loyalty mechanics can drive repeat behavior but add UI to the checkout surface, creating latency risk. The constraint requires solutions that avoid checkout-time additions.',
              },
              {
                option_label: 'C',
                option_text: 'Speed up Shop Pay credential lookup to reduce checkout time from 1.1s to 0.8s, making the checkout faster than any competitor',
                quality: 'surface',
                points: 1,
                competencies: ['domain_expertise'],
                explanation:
                  'Checkout speed improvement does not address the demand problem. Buyers who are not returning to merchants will not benefit from a faster checkout they never initiate.',
              },
              {
                option_label: 'D',
                option_text: 'Partner with merchants to offer Shop Pay exclusive discounts at checkout to incentivize choosing Shop Pay over Apple Pay',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Checkout-level discounts conflict with merchant margin and are not within Shopify\'s control to deploy at scale. This also addresses wallet selection, not repeat visit frequency.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'How do you sequence the two-quarter plan to show progress without waiting for full feature builds?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'How should the two-quarter plan be sequenced to demonstrate measurable progress within Q1?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Q1: launch transactional email reorder links (low eng lift, immediate test of re-engagement thesis). Q2: ship Shop app personalized reorder feed using signal from Q1 email click data.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'creative_execution'],
                explanation:
                  'Email is low-lift and generates behavioral data that informs the higher-investment app feed. This sequence validates the hypothesis cheaply before full product investment.',
              },
              {
                option_label: 'B',
                option_text: 'Q1: build the full personalized Shop app feed. Q2: use feed engagement data to optimize email campaigns.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'App feed is higher leverage long-term but requires more engineering time and delays measurable results. Reversing the sequence misses the faster-feedback opportunity.',
              },
              {
                option_label: 'C',
                option_text: 'Build both in parallel across Q1 and Q2 to maximize output.',
                quality: 'surface',
                points: 1,
                competencies: [],
                explanation:
                  'Parallel builds strain team capacity and do not produce learnings that inform each other. Sequencing is the discipline here.',
              },
              {
                option_label: 'D',
                option_text: 'Spend Q1 on research and design validation before committing to any engineering work.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Two full quarters is the constraint. Spending half on research with no shipped product produces no measurable impact within the window.',
              },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'What is the one metric that tells you the strategy worked, and why is it more meaningful than alternatives?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'Which metric is the best north star for the two-quarter re-acceleration plan?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Repeat Shop Pay GMV growth rate returning to 10%+ QoQ by end of Q2',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'GMV growth rate directly measures the objective. It captures both buyer re-engagement and checkout completion, and is the metric that declined. Returning to a defined rate is testable and time-bound.',
              },
              {
                option_label: 'B',
                option_text: 'Email open rate for reorder campaigns above 35%',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['creative_execution'],
                explanation:
                  'Email open rate measures the channel, not the outcome. High open rates with low click-to-purchase conversion do not advance the GMV objective.',
              },
              {
                option_label: 'C',
                option_text: 'Shop Pay credential save rate increasing from current baseline by 20%',
                quality: 'surface',
                points: 1,
                competencies: [],
                explanation:
                  'New credential saves grow the top of the funnel but do not measure repeat purchase behavior, which is the specific problem.',
              },
              {
                option_label: 'D',
                option_text: 'Shop app monthly active buyer count growing 15% QoQ',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'App MAU growth does not confirm that buyers are completing repeat purchases through Shop Pay. A buyer could browse the app without transacting.',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-shopify-003',
    title: 'Build vs. Ecosystem: Should Shopify Own Reviews?',
    scenario_role: 'Product Manager, Merchant Trust',
    scenario_context:
      'Shopify\'s app ecosystem includes dozens of reviews apps, with Judge.me and Yotpo collectively serving over 400,000 merchants. Internal research shows that merchants cite "no native reviews" as a top-3 conversion friction point, but the partner apps generate significant app store revenue for Shopify.',
    scenario_trigger:
      'Amazon announces deep native review integrations with new seller tooling, and a cohort of Shopify Plus merchants starts migrating review management to a competing platform that bundles reviews natively.',
    scenario_question:
      'Should Shopify build a native Reviews product or invest in deeper APIs that make partner review apps more capable?',
    engineer_standout:
      'A strong engineer would analyze where native ownership creates a technical moat versus where it would replicate functionality partners already provide well, and would identify which platform primitives enable the most leverage.',
    paradigm: 'traditional',
    industry: 'E-commerce',
    sub_vertical: 'Platform Strategy',
    difficulty: 'advanced',
    estimated_minutes: 22,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['creative_execution'],
    frameworks: ['Platform Ecosystem Design', 'Build vs Buy vs Partner'],
    relevant_roles: ['pm', 'tech_lead', 'em'],
    company_tags: ['Shopify', 'Amazon', 'WooCommerce'],
    tags: ['platform', 'ecosystem', 'build-vs-buy', 'reviews', 'strategy'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What is the actual risk to Shopify: merchant conversion, merchant retention, or partner ecosystem health?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the correct strategic framing of the native reviews decision for Shopify?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'The risk is merchant churn to platforms that bundle reviews natively, which means Shopify must match feature parity to stay competitive',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Merchant churn is a real risk but matching feature parity through native build is one of several responses. The framing skips the question of whether the ecosystem can deliver the same outcome.',
              },
              {
                option_label: 'B',
                option_text: 'The risk is that Shopify\'s checkout conversion data, which already flows natively, is not connected to review signals, creating a structural gap that partner apps cannot bridge through APIs alone',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'The real gap is data integration: native review data connected to storefront, checkout, and search creates a flywheel that partner apps cannot replicate because they sit outside Shopify\'s core data graph.',
              },
              {
                option_label: 'C',
                option_text: 'Building native reviews would damage the Shopify app ecosystem by destroying the market for Judge.me and Yotpo',
                quality: 'surface',
                points: 1,
                competencies: ['domain_expertise'],
                explanation:
                  'Ecosystem impact is a real tradeoff to quantify, but it cannot be the primary frame for the decision. Many platforms have native and partner offerings in the same category.',
              },
              {
                option_label: 'D',
                option_text: 'Merchants are not actually churning, so the Amazon move is noise and no action is needed',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'The prompt specifies a cohort of Plus merchants already migrating. Dismissing early retention signals as noise is a pattern that historically precedes larger churn.',
              },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'Map out what Shopify owns natively that partner review apps cannot access even with better APIs.',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which Shopify-native data or capabilities give a first-party Reviews product a structural advantage over partner apps?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Verified purchase status from order data, checkout-embedded review prompts with zero redirect, and native storefront search indexing of review content',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'All three are real technical moats: verified purchase requires order data only Shopify holds; checkout embedding eliminates the redirect that kills partner app conversion rates; native search indexing is unavailable to app partners.',
              },
              {
                option_label: 'B',
                option_text: 'Shopify could offer review collection at no cost, undercutting Judge.me and Yotpo on price',
                quality: 'surface',
                points: 1,
                competencies: [],
                explanation:
                  'Price competition is a race to the bottom and is not a structural advantage. It also immediately damages the partner ecosystem without creating lasting differentiation.',
              },
              {
                option_label: 'C',
                option_text: 'Shopify brand credibility means merchants would trust a native review product more than a third-party app',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['cognitive_empathy'],
                explanation:
                  'Brand trust is a real adoption lever but is not a technical moat. It does not sustain competitive advantage once partners match on features.',
              },
              {
                option_label: 'D',
                option_text: 'Shopify can force review data portability through API requirements, making partner app data accessible to native tools',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Forcing data portability from partners would damage partner relationships without creating the native capability itself. It is a policy lever, not a product advantage.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'What do you build natively, and what do you leave to partners with better APIs? Name the criterion and the sacrifice.',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'What is the right scope for a Shopify native Reviews investment, given the ecosystem tradeoffs?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Build verified purchase review collection and storefront display natively; leave review marketing, syndication, and UGC management to partners with richer APIs that expose the native review data',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'This scoping captures the structural moat (verified data, native rendering) while preserving ecosystem value on the differentiated layer (marketing, syndication) where partners already excel. The sacrifice is control over the full review experience.',
              },
              {
                option_label: 'B',
                option_text: 'Build a full-featured native Reviews product covering collection, display, marketing, and syndication to close the feature gap with Amazon',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Full build closes the gap but likely destroys the partner market for review apps, which generates meaningful app store revenue and covers features Shopify would have to maintain indefinitely.',
              },
              {
                option_label: 'C',
                option_text: 'Invest only in API improvements to let partners build better-integrated review apps without building anything native',
                quality: 'surface',
                points: 1,
                competencies: ['domain_expertise'],
                explanation:
                  'API improvements cannot bridge the verified purchase gap or the checkout-embedded collection problem. This addresses partner capability but not the structural data advantage.',
              },
              {
                option_label: 'D',
                option_text: 'Acquire Judge.me or Yotpo to bring their review capabilities in-house quickly',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Acquisition would consolidate market position but creates a winner-takes-all dynamic that damages the remaining ecosystem. It is also the highest-cost and highest-integration-risk option.',
              },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you announce the native Reviews scope to the partner ecosystem without triggering partner churn?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'How do you communicate the native Reviews decision to the Shopify partner ecosystem?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Announce native Reviews as a foundational layer, simultaneously release the new Partner API that exposes native review data, and provide a migration guide for partners to build on top of the native data rather than competing with it',
                quality: 'best',
                points: 3,
                competencies: ['creative_execution', 'strategic_thinking'],
                explanation:
                  'Pairing the native announcement with new partner APIs reframes the narrative from "Shopify is eating the ecosystem" to "Shopify is creating a better foundation for partners." Migration guides reduce partner churn by showing a clear path forward.',
              },
              {
                option_label: 'B',
                option_text: 'Announce quietly through the developer changelog to avoid triggering partner concern',
                quality: 'surface',
                points: 1,
                competencies: [],
                explanation:
                  'Quiet announcements about competitive moves create more distrust when partners discover them independently, which they will.',
              },
              {
                option_label: 'C',
                option_text: 'Host a Partner Summit session to explain the decision and gather feedback before finalizing scope',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['cognitive_empathy'],
                explanation:
                  'Stakeholder engagement is good but if scope is not finalized, partners cannot make investment decisions about their own roadmaps. Feedback loops are more valuable before the decision, not after.',
              },
              {
                option_label: 'D',
                option_text: 'Delay the native Reviews announcement until the product ships to avoid speculation',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Delaying until ship leaves partners no time to adapt their positioning and creates a betrayal dynamic. Partners who find out at launch have already invested in the wrong direction.',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-shopify-004',
    title: 'Add-to-Cart Drop: 48-Hour Incident Response',
    scenario_role: 'Product Manager, Search and Discovery',
    scenario_context:
      'Shopify\'s Search and Discovery team shipped a ranking model update last Tuesday that changed how products surface in merchant storefront search results. The change was designed to improve relevance by weighting recency more heavily.',
    scenario_trigger:
      'Data Science flags that add-to-cart rate has dropped 11% in the 72 hours since the search ranking change shipped, across a sample of 2,000 storefronts that opted into the new ranking model.',
    scenario_question:
      'What do you do in the next 48 hours to diagnose the cause, determine whether to roll back, and protect merchant GMV?',
    engineer_standout:
      'A strong engineer would distinguish between a ranking correctness problem (the model is wrong) and a product quality problem (the right products are being buried), and would instrument for both before deciding on a rollback.',
    paradigm: 'traditional',
    industry: 'E-commerce',
    sub_vertical: 'Search and Discovery',
    difficulty: 'standard',
    estimated_minutes: 18,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['creative_execution'],
    frameworks: ['Root Cause Analysis', 'Incident Response'],
    relevant_roles: ['pm', 'swe', 'data_eng', 'tech_lead'],
    company_tags: ['Shopify', 'Algolia', 'Elastic'],
    tags: ['search', 'incident', 'metrics', 'ranking', 'add-to-cart'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What are the two most different explanations for why add-to-cart dropped after a search ranking change?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most important distinction to make before deciding whether to roll back the ranking change?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Whether the drop is uniform across all storefronts or concentrated in specific merchant categories or product types',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'Segmentation is the key diagnostic. A uniform drop suggests a model-wide problem; a concentrated drop in specific categories suggests the recency weighting is hurting seasonal or slow-moving products, which is a scoped fix rather than a full rollback.',
              },
              {
                option_label: 'B',
                option_text: 'Whether the 11% drop is statistically significant given the sample size of 2,000 storefronts',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Statistical significance matters for long-run decisions but not for 48-hour incident response. An 11% drop in 72 hours is large enough to act on regardless of exact significance.',
              },
              {
                option_label: 'C',
                option_text: 'Whether the ranking change was the only deployment in the last 72 hours or if another system change coincided',
                quality: 'surface',
                points: 1,
                competencies: ['domain_expertise'],
                explanation:
                  'Confirming the change is a valid first step, but the framing asks for the most important distinction, which is segmentation of the impact rather than confirmation of the cause.',
              },
              {
                option_label: 'D',
                option_text: 'Whether merchant NPS scores have dropped, confirming that merchants are aware of the conversion problem',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'NPS is too slow for a 48-hour window. Merchants may not have seen the drop yet; waiting for NPS data means losing another 72 hours of merchant GMV.',
              },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What data do you pull in the first 4 hours, and from which systems?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which diagnostic data pulls give you the fastest, most actionable picture of what caused the add-to-cart drop?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Search click-through rate by result position before and after the change; add-to-cart rate by product recency band (new vs. catalog items); and search query reformulation rate as a proxy for result quality',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'These three pulls directly test the hypothesis: if recency weighting is burying catalog products, you will see CTR drop on positions 3-10 and add-to-cart drops concentrated in non-recent products. Query reformulation confirms buyers are not finding what they want.',
              },
              {
                option_label: 'B',
                option_text: 'Merchant support ticket volume and categories from the last 72 hours',
                quality: 'surface',
                points: 1,
                competencies: ['cognitive_empathy'],
                explanation:
                  'Support tickets are a lagging signal. Most merchants will not file a ticket within 72 hours of an 11% add-to-cart drop, especially if they do not know the cause.',
              },
              {
                option_label: 'C',
                option_text: 'A/B test results comparing the new ranking model to the old one on a held-out storefront cohort',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'If a held-out cohort exists, this is valuable, but the incident already has 72 hours of production data. Waiting for a new A/B test is slower than analyzing existing data.',
              },
              {
                option_label: 'D',
                option_text: 'Run the new ranking model against a labeled relevance dataset to score ranking quality offline',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['domain_expertise'],
                explanation:
                  'Offline evals test ranking correctness on a static dataset, not buyer behavior on live traffic. The incident is a buyer behavior problem, so production signals are more diagnostic than offline benchmarks.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'The data shows add-to-cart dropped 23% for non-recent products but held flat for new products. What do you do?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'Data confirms: recency weighting is burying established catalog products for merchants with mostly older inventory. What is the right decision?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Full rollback to the previous ranking model while the team patches the recency weight to be conditional on catalog recency distribution per merchant',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'creative_execution'],
                explanation:
                  'Scoped rollback is the right call: the model works for new-product merchants but harms catalog merchants. Rolling back fully while shipping a conditional fix is faster and safer than a partial rollback with unclear scope.',
              },
              {
                option_label: 'B',
                option_text: 'Keep the ranking change live but notify affected merchants that their search results may be different and offer manual pinning controls',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Keeping a confirmed harmful change live and offloading the fix to merchants is not acceptable. Merchants cannot easily correct for a ranking model change through manual pinning.',
              },
              {
                option_label: 'C',
                option_text: 'Reduce the recency weight from its current value to 50% of the original, as a compromise between old and new behavior',
                quality: 'surface',
                points: 1,
                competencies: ['domain_expertise'],
                explanation:
                  'Halving the weight is an untested change made without data on what the correct weight should be. It may fix nothing or introduce a new bias.',
              },
              {
                option_label: 'D',
                option_text: 'Let the change run for one more week to collect more data before making a rollback decision',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'More data is always better in principle, but seven more days of confirmed merchant GMV loss is a high price for incremental certainty when the cause is already clear.',
              },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you communicate the incident and the fix to merchants and to the internal team within 48 hours?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the right communication plan for affected merchants and the internal engineering team?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'cognitive_empathy'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Proactive merchant email within 24 hours acknowledging the search change, confirming the rollback, and providing an ETA for the improved model. Internal post-mortem doc within 48 hours covering root cause, detection gap, and prevention plan.',
                quality: 'best',
                points: 3,
                competencies: ['creative_execution', 'cognitive_empathy'],
                explanation:
                  'Proactive communication before merchants escalate builds more trust than reactive disclosure. The internal post-mortem closes the loop and prevents a repeat without assigning blame.',
              },
              {
                option_label: 'B',
                option_text: 'Wait for merchants to contact support before communicating, to avoid alarming merchants who have not noticed the drop',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Reactive disclosure damages trust more than proactive communication. Merchants who noticed the drop and hear nothing assume Shopify is unaware or indifferent.',
              },
              {
                option_label: 'C',
                option_text: 'Post a status page update visible only to developers, and route merchant questions to the support team',
                quality: 'surface',
                points: 1,
                competencies: [],
                explanation:
                  'A developer-only status update does not reach merchant operators who are watching GMV, not technical dashboards.',
              },
              {
                option_label: 'D',
                option_text: 'Send a broad merchant email explaining the ranking change without mentioning the add-to-cart drop or the rollback',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['creative_execution'],
                explanation:
                  'Communication is the right instinct, but omitting the impact and the fix is incomplete. Merchants need to know what happened and what was done about it.',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-shopify-005',
    title: 'Checkout Extensibility: Restoring Performance Without Breaking Merchants',
    scenario_role: 'Product Manager, Checkout Platform',
    scenario_context:
      'Shopify\'s checkout extensibility program lets merchants install third-party UI extensions directly in the checkout flow: loyalty widgets, upsell cards, address validators. Merchant adoption is strong, with 18% of Plus merchants using at least one extension.',
    scenario_trigger:
      'Observability data shows that p95 checkout page load time has increased to 2.3 seconds, up from 1.7 seconds six months ago. Engineering traces the regression to checkout extensibility scripts, which contribute roughly 60ms of blocking script load at p95.',
    scenario_question:
      'How do you restore checkout performance to the 1.7-second p95 target without breaking the merchant customizations that drive loyalty and conversion?',
    engineer_standout:
      'A strong engineer would distinguish between synchronous and asynchronous extension loading, propose sandboxing or deferred rendering as a performance primitive, and avoid solutions that require merchants to audit and rewrite their extensions.',
    paradigm: 'traditional',
    industry: 'E-commerce',
    sub_vertical: 'Checkout Platform',
    difficulty: 'advanced',
    estimated_minutes: 22,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['creative_execution'],
    frameworks: ['Performance Budget', 'Platform Design'],
    relevant_roles: ['swe', 'tech_lead', 'pm', 'em'],
    company_tags: ['Shopify', 'Stripe', 'Bolt'],
    tags: ['performance', 'checkout', 'extensibility', 'platform', 'latency'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'Is this a platform architecture problem or a merchant behavior problem?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the correct root cause framing of the checkout performance regression?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Merchants are installing too many extensions without understanding the performance impact, so the solution is education and per-merchant extension limits',
                quality: 'surface',
                points: 1,
                competencies: ['cognitive_empathy'],
                explanation:
                  'Merchant behavior is a symptom. The platform allowed synchronous, blocking extension loading without guardrails. Blaming merchants for using a feature as designed is not an accurate root cause.',
              },
              {
                option_label: 'B',
                option_text: 'The checkout extensibility architecture loads third-party extension scripts synchronously in the critical render path, meaning each extension adds blocking latency regardless of its visual importance',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'This is the structural root cause. Synchronous script loading in the critical render path means cumulative latency compounds with each extension. The architecture, not merchant choices, created the regression.',
              },
              {
                option_label: 'C',
                option_text: 'Shopify\'s CDN is not caching extension scripts effectively, causing repeated round-trips for each checkout session',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['domain_expertise'],
                explanation:
                  'CDN caching is a valid optimization but the engineering trace attributes the regression to blocking script load, not to cache misses. CDN improvements would help at the margin, not fix the architectural cause.',
              },
              {
                option_label: 'D',
                option_text: 'Third-party extension vendors are shipping poorly optimized JavaScript that inflates bundle sizes',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['domain_expertise'],
                explanation:
                  'Bundle size optimization by vendors would help incrementally, but the problem is the loading model (synchronous, blocking), not the code quality of the scripts themselves.',
              },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What loading strategies exist that could isolate extension scripts from the critical render path?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which set of platform-level loading strategies best reduces extension latency without requiring merchants to change their extensions?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['domain_expertise', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Deferred loading for extensions below the fold, Web Worker sandboxing to prevent extension scripts from blocking the main thread, and a platform-enforced performance budget per extension slot',
                quality: 'best',
                points: 3,
                competencies: ['domain_expertise', 'strategic_thinking'],
                explanation:
                  'Deferred loading removes below-fold extensions from the critical path; Web Workers prevent main-thread blocking; a per-slot budget prevents accumulation. All three are platform-side changes requiring no merchant action.',
              },
              {
                option_label: 'B',
                option_text: 'Require all extension vendors to pass a Lighthouse performance audit before their extension is listed in the Shopify app store',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['domain_expertise'],
                explanation:
                  'App store gating improves new extension quality but does not fix the 18% of Plus merchants already running existing extensions. Retroactive enforcement would break merchant setups.',
              },
              {
                option_label: 'C',
                option_text: 'Set a global maximum of three extensions per checkout page to cap total extension latency',
                quality: 'surface',
                points: 1,
                competencies: [],
                explanation:
                  'A hard cap is a blunt instrument. Three lightweight extensions may add less latency than one heavy extension, and merchants near the limit would face forced removal of business-critical customizations.',
              },
              {
                option_label: 'D',
                option_text: 'Roll back checkout extensibility entirely and rebuild it with a performance-first architecture before re-releasing',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'A full rollback immediately breaks the 18% of Plus merchants using extensions today. It is the highest-disruption option and is not necessary to achieve the performance target.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'What do you ship first, and what do you accept as a necessary sacrifice to hit the 1.7-second target?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'To restore p95 checkout time to 1.7 seconds without breaking existing merchant extensions, what is the right phased approach?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Phase 1: deploy deferred loading for all below-fold extension slots (platform-side, no merchant action required). Phase 2: introduce Web Worker sandboxing as the new default for new extensions. Phase 3: migrate existing extensions to the Worker model with a 90-day notice period and automated migration tooling.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'creative_execution'],
                explanation:
                  'Phase 1 delivers immediate performance gains without breaking anything. Phase 2 sets the new standard. Phase 3 completes the migration with enough lead time for merchants and vendors to adapt. Each phase is independently shippable.',
              },
              {
                option_label: 'B',
                option_text: 'Implement a real-time extension performance monitor that automatically disables extensions when they exceed a 20ms budget during a live checkout session',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['domain_expertise'],
                explanation:
                  'Disabling extensions mid-checkout is a merchant trust catastrophe. A loyalty widget that disappears during a live purchase creates customer-facing errors and merchant churn.',
              },
              {
                option_label: 'C',
                option_text: 'Negotiate with the top 10 extension vendors to voluntarily optimize their scripts within 30 days, with Shopify providing engineering support',
                quality: 'surface',
                points: 1,
                competencies: ['cognitive_empathy'],
                explanation:
                  'Vendor negotiation addresses script quality, not the synchronous loading architecture. Optimized scripts still block the main thread if the loading model is unchanged.',
              },
              {
                option_label: 'D',
                option_text: 'Ship deferred loading for all extensions immediately, including above-fold critical elements like address validators',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Blanket deferred loading would break above-fold extensions that need to render before buyer interaction. Distinguishing above-fold from below-fold is the key design decision.',
              },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you establish a performance contract with extension vendors so this class of regression cannot recur?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What governance mechanism best prevents checkout extensibility performance regressions in the future?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['creative_execution', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Require all new extensions to pass automated performance benchmarks before app store approval; monitor p95 checkout load time by extension slot in production with automatic alerts when any slot exceeds its budget; publish real-time extension performance data to merchants',
                quality: 'best',
                points: 3,
                competencies: ['creative_execution', 'domain_expertise'],
                explanation:
                  'Three-layer governance: pre-approval gate, production monitoring with alerts, and merchant visibility. Each layer catches a different failure mode and together prevent the gradual accumulation that caused the current regression.',
              },
              {
                option_label: 'B',
                option_text: 'Publish a performance best practices guide for extension developers and require vendors to sign a performance SLA at app store onboarding',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['creative_execution'],
                explanation:
                  'Agreements and guides help but are not enforceable at deploy time. SLAs without automated enforcement rely on post-hoc detection, which the current incident shows is too slow.',
              },
              {
                option_label: 'C',
                option_text: 'Review the performance of the top 20 extensions quarterly and send remediation requests to non-compliant vendors',
                quality: 'surface',
                points: 1,
                competencies: [],
                explanation:
                  'Quarterly reviews are too infrequent for a checkout performance SLA. An extension that ships a regression ships it to millions of buyers before the next review cycle.',
              },
              {
                option_label: 'D',
                option_text: 'Cap the checkout extensibility program at 100 approved extensions to limit the total surface area of potential regressions',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'An arbitrary cap constrains the ecosystem without addressing the loading architecture. Ninety-nine compliant extensions can still accumulate to a regression if the loading model is synchronous.',
              },
            ],
          },
        ],
      },
    ],
  },

  // ── Stripe Challenges ──────────────────────────────────────────

  {
    id: 'pm-stripe-001',
    title: 'Facebook Messenger Payments: Designing the Winning MVP',
    scenario_role: 'Product Manager, Payments',
    scenario_context:
      'Meta has accumulated 1.3 billion monthly active Messenger users and a significant base of Facebook Marketplace transactions. Peer-to-peer payment features are already present in WhatsApp Pay in India and Brazil, demonstrating that Meta can execute on fintech at scale.',
    scenario_trigger:
      'A product review surfaces internal data showing that 22% of Marketplace transactions start as Messenger conversations but exit to PayPal or Venmo to complete payment. The revenue leakage is material.',
    scenario_question:
      'Should Facebook add peer-to-peer payments inside Messenger, and if so, what would a winning MVP look like?',
    engineer_standout:
      'A strong engineer would identify the trust and compliance infrastructure required before launch, distinguish between social payments and commerce payments as different product surfaces, and propose an incremental rollout that gates on fraud metrics.',
    paradigm: 'traditional',
    industry: 'FinTech',
    sub_vertical: 'Social Payments',
    difficulty: 'advanced',
    estimated_minutes: 22,
    primary_competencies: ['strategic_thinking', 'creative_execution'],
    secondary_competencies: ['domain_expertise'],
    frameworks: ['Jobs To Be Done', 'Platform Strategy'],
    relevant_roles: ['pm', 'swe', 'ml_eng'],
    company_tags: ['Meta', 'Stripe', 'PayPal', 'Venmo'],
    tags: ['payments', 'social', 'fintech', 'mvp', 'messenger'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'What is the core job a Messenger payment is doing that PayPal or Venmo is not doing right now?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most accurate framing of the Messenger payments opportunity?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'The opportunity is to capture Marketplace transaction value that currently leaks to PayPal and Venmo by keeping payment within the conversation where intent already exists',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'Payment within the conversation context where intent already exists is the job PayPal cannot do. The 22% leakage rate is the quantified opportunity. This framing correctly identifies where Meta has a structural advantage.',
              },
              {
                option_label: 'B',
                option_text: 'The opportunity is to compete with Venmo on social feed payments, where users split bills and send money with social context',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Social feed payments are a different product from commerce payments. The data point in the prompt is about Marketplace exit, not social bill-splitting, so the primary opportunity is different.',
              },
              {
                option_label: 'C',
                option_text: 'The opportunity is regulatory arbitrage: Meta can operate payments in markets where PayPal has weaker coverage',
                quality: 'surface',
                points: 1,
                competencies: ['domain_expertise'],
                explanation:
                  'Regulatory arbitrage is not a product opportunity for a consumer-facing payment MVP. It may be a distribution advantage for specific markets but is not the lead framing.',
              },
              {
                option_label: 'D',
                option_text: 'The opportunity is to reduce Marketplace fraud by replacing cash transactions with traceable digital payments',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Fraud reduction is a benefit of digital payments, not the primary user job that drives adoption. Users do not switch payment methods to reduce abstract fraud risk.',
              },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What are the distinct product bets you could make for the MVP, and how do they differ in risk and reach?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which MVP scope best balances adoption speed, trust infrastructure requirements, and regulatory risk?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Link to PayPal or Venmo within Messenger to complete payments externally, with Messenger tracking the payment status and closing the conversation loop',
                quality: 'surface',
                points: 1,
                competencies: ['creative_execution'],
                explanation:
                  'Linking out to PayPal does not capture the transaction or generate revenue. It reduces friction slightly but does not make the case for native payments.',
              },
              {
                option_label: 'B',
                option_text: 'Native Messenger Marketplace payments using debit card or bank account, limited to US Marketplace sellers with existing Facebook accounts, with transaction limits and fraud gates',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'creative_execution'],
                explanation:
                  'Scoping to Marketplace (where the data problem is), US only (manageable regulatory footprint), and existing accounts (identity verification already done) is the right MVP tradeoff. Transaction limits and fraud gates address the trust infrastructure requirement.',
              },
              {
                option_label: 'C',
                option_text: 'Full social P2P payments with a Messenger wallet, card on file, and bank transfer, available globally',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Global launch of a full payments wallet is the maximum-risk MVP scope. It requires MSB licensing in every market, significantly more compliance infrastructure, and a longer build. Not an MVP.',
              },
              {
                option_label: 'D',
                option_text: 'Facebook Pay integration with no new product surface: buyers see a pay button in Marketplace listings and are redirected to a Facebook Pay web flow',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['creative_execution'],
                explanation:
                  'Using existing Facebook Pay infrastructure reduces build time, but a redirect out of the conversation loses the contextual advantage that differentiates Messenger payments from alternatives.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'What technical and regulatory infrastructure do you need before any payment transaction can complete inside Messenger?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'Which pre-launch requirement is most likely to be underestimated and cause the MVP to miss its launch date?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['domain_expertise', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'KYC verification for sellers above transaction thresholds and FinCEN money transmitter licensing in each US state',
                quality: 'best',
                points: 3,
                competencies: ['domain_expertise', 'strategic_thinking'],
                explanation:
                  'State-by-state money transmitter licensing is the most commonly underestimated fintech launch blocker. It requires regulatory approval that cannot be accelerated by engineering, and missing it blocks launch in that state entirely.',
              },
              {
                option_label: 'B',
                option_text: 'UI design and payment confirmation flows within the Messenger interface',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'UI design is important but is rarely the blocker for fintech launches. Regulatory and trust infrastructure fail timelines far more often than design.',
              },
              {
                option_label: 'C',
                option_text: 'A/B testing framework to measure payment adoption within Messenger',
                quality: 'surface',
                points: 1,
                competencies: [],
                explanation:
                  'A/B testing infrastructure is needed post-launch, not pre-launch. Prioritizing it over compliance work reflects incorrect sequencing.',
              },
              {
                option_label: 'D',
                option_text: 'Integration with Messenger\'s end-to-end encryption to ensure payment data is not visible in transit',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['domain_expertise'],
                explanation:
                  'Encryption for payment data is necessary and often creates a genuine tension with E2E-encrypted messaging, but it is an engineering problem with known solutions rather than an external dependency with uncertain timelines.',
              },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'What does success look like at 90 days, and what metric tells you whether to expand or pause?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the correct north star metric for the Messenger Payments MVP, and what threshold triggers expansion to additional markets?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Marketplace conversation-to-payment completion rate: if 15%+ of conversations that reach the payment step complete via Messenger Pay (versus exiting to PayPal), expand to additional US states',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'creative_execution'],
                explanation:
                  'This metric directly measures whether Messenger Pay is solving the original problem (payment leakage from Marketplace conversations). 15% is a reasonable threshold that confirms PMF without requiring majority capture.',
              },
              {
                option_label: 'B',
                option_text: 'Total payment volume processed through Messenger Pay within 90 days',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Payment volume is a revenue metric but not a PMF signal. High volume from a narrow power user segment does not confirm broad adoption.',
              },
              {
                option_label: 'C',
                option_text: 'Number of users who add a payment method to Messenger in the first 90 days',
                quality: 'surface',
                points: 1,
                competencies: [],
                explanation:
                  'Activation (adding a card) is a leading indicator but does not confirm that payments are completing successfully or that users are returning.',
              },
              {
                option_label: 'D',
                option_text: 'Fraud rate staying below 0.1% in the first 90 days',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['domain_expertise'],
                explanation:
                  'Fraud rate is a health metric, not a north star. A product with 0% fraud and 1% adoption has not achieved PMF. Fraud rate should gate expansion as a safety check alongside the PMF metric, not replace it.',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-stripe-002',
    title: "Developer Activation Decline: Diagnosing Stripe's Funnel",
    scenario_role: 'Product Manager, Developer Platform',
    scenario_context:
      "Stripe's developer activation rate, defined as the percentage of new API key holders who successfully process a live payment within 14 days of signup, has declined from 34% to 26% over the past two quarters. The trend is consistent across regions and account types.",
    scenario_trigger:
      'A weekly metrics review surfaces the activation rate chart with a clear downward slope. The data does not yet indicate whether the drop is from new developer cohorts struggling with integration or from returning developers who previously activated but are now counted differently.',
    scenario_question:
      'What metrics do you look at first, and how do you design an experiment to identify the root cause of the activation rate decline?',
    engineer_standout:
      'A strong engineer would distinguish between the documentation quality problem, the testing environment friction problem, and the competitive switching problem, and would instrument the full developer funnel before committing to an experiment.',
    paradigm: 'traditional',
    industry: 'FinTech',
    sub_vertical: 'Developer Platform',
    difficulty: 'standard',
    estimated_minutes: 20,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['creative_execution'],
    frameworks: ['Funnel Analysis', 'Root Cause Analysis'],
    relevant_roles: ['pm', 'swe', 'data_eng', 'tech_lead'],
    company_tags: ['Stripe', 'Braintree', 'Square'],
    tags: ['developer-experience', 'activation', 'funnel', 'metrics', 'stripe'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'Where in the developer journey does the failure most likely occur, and why does that matter for diagnosis?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the most important clarification to make before deciding which funnel metrics to pull?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Whether the decline is concentrated in first-time developers (integration friction) or returning developers starting new projects (API surface changes or documentation regressions)',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'The fix is completely different depending on which cohort is failing. First-time developer failure points to onboarding and documentation; returning developer failure points to API changes, pricing changes, or competitive switching.',
              },
              {
                option_label: 'B',
                option_text: 'Whether the definition of "activated" has changed in the last two quarters, making the comparison invalid',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Metric definition check is a valid first step but is already partially addressed in the prompt (consistent trend across regions and account types). Cohort decomposition is the more impactful clarification.',
              },
              {
                option_label: 'C',
                option_text: 'Whether the decline correlates with a Stripe pricing change or a major API version release',
                quality: 'surface',
                points: 1,
                competencies: ['domain_expertise'],
                explanation:
                  'Correlation with external events is a useful hypothesis but requires the cohort breakdown first to know which developer segment to look at. Surface-level correlation without segmentation can mislead.',
              },
              {
                option_label: 'D',
                option_text: 'Whether competitors like Braintree or Square have improved their developer onboarding in the same period',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['domain_expertise'],
                explanation:
                  'Competitive analysis is relevant context but cannot explain the specific funnel drop without internal funnel data. It is a hypothesis, not a diagnostic.',
              },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'Map the Stripe developer funnel from API key creation to first live payment. Where are the measurable handoffs?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which funnel metrics best localize the activation failure to a specific stage in the developer journey?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'API key creation to first test-mode API call, time to first successful charge in test mode, test-to-live promotion rate, and time from live key creation to first live payment',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'These four handoffs cover the complete funnel from signup to activation. Each step\'s drop-off rate localizes the problem: if test-mode is fine but test-to-live is low, the friction is in the account verification or live-mode configuration, not integration.',
              },
              {
                option_label: 'B',
                option_text: 'Dashboard login rate after API key creation and support ticket volume per developer cohort',
                quality: 'surface',
                points: 1,
                competencies: [],
                explanation:
                  'Dashboard login is a weak proxy for integration progress, and support ticket volume is a lagging signal that does not localize the funnel stage.',
              },
              {
                option_label: 'C',
                option_text: 'Documentation page views for the quickstart guide and time spent on the API reference per developer session',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['domain_expertise'],
                explanation:
                  'Documentation engagement is a useful leading indicator but does not directly map to where in the technical funnel developers are dropping off. High doc views with low activation could mean docs are confusing, not that they are unread.',
              },
              {
                option_label: 'D',
                option_text: 'Net Promoter Score from developers who activated versus those who did not activate',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Surveying developers who did not activate is methodologically problematic: they have low response rates and high selection bias. NPS also cannot localize the funnel drop.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'Funnel data shows test-to-live promotion rate dropped from 60% to 44%. How do you design an experiment to find why?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'Test-to-live promotion is the primary drop-off stage. What experiment design best identifies the root cause?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Instrument the live-mode activation flow with step-level completion events; identify the single step with the highest abandonment rate; interview 10 developers who abandoned at that step within the last 30 days',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'creative_execution'],
                explanation:
                  'This sequence is correct: instrument first to localize the failure, then interview to understand the why. Qualitative research on a specific abandonment point produces actionable insight rather than general developer sentiment.',
              },
              {
                option_label: 'B',
                option_text: 'A/B test a simplified live-mode activation flow with fewer required fields against the current flow',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['creative_execution'],
                explanation:
                  'Running an experiment before diagnosing the specific friction risks optimizing the wrong step. A simplified flow that does not address the actual blocker will show no lift.',
              },
              {
                option_label: 'C',
                option_text: 'Survey all developers who created an API key in the last quarter and ask what stopped them from going live',
                quality: 'surface',
                points: 1,
                competencies: ['cognitive_empathy'],
                explanation:
                  'Broad surveys produce general feedback that is hard to act on. Developers who went live are mixed in with those who did not, and the responses average out to vague friction themes.',
              },
              {
                option_label: 'D',
                option_text: "Compare the live-mode checklist requirements to Braintree and Square and identify any steps Stripe has that competitors do not",
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['domain_expertise'],
                explanation:
                  "Competitive benchmarking is useful context but cannot tell you which specific step in Stripe's flow is causing the decline unless you first know where developers are abandoning.",
              },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'Interviews reveal that business verification documents required for live mode are confusing for solo developers and early-stage startups. What do you ship?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What product change best addresses the business verification friction for solo developers and early-stage startups going live?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Add a developer-type selector at signup (solo, startup, company) and show a simplified verification flow for solo and startup accounts with an inline explanation of why each field is required by regulation',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'creative_execution'],
                explanation:
                  'Segmenting the verification flow by developer type reduces friction for the most affected cohort while keeping compliance intact. Inline regulatory explanations address the confusion root cause, not just the UI friction.',
              },
              {
                option_label: 'B',
                option_text: 'Remove the business verification requirement for the first $10k in live transaction volume',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Removing identity verification requirements for live payments creates KYC and AML compliance risk. This is not a viable option for a regulated financial product regardless of the UX benefit.',
              },
              {
                option_label: 'C',
                option_text: 'Add a tooltip explaining each required field in the business verification flow',
                quality: 'surface',
                points: 1,
                competencies: ['creative_execution'],
                explanation:
                  'Tooltips reduce confusion slightly but do not reduce the number of steps or the burden of gathering business documents. The fix is too shallow for the friction identified.',
              },
              {
                option_label: 'D',
                option_text: 'Allow developers to go live immediately and complete business verification asynchronously within 30 days, with payment processing limited to $1,000 until verification is complete',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Deferred verification with limits is a real pattern used by some payment processors and meaningfully reduces activation friction. The risk is that developers who hit the $1k cap before completing verification have a poor experience.',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-stripe-003',
    title: "Stripe API Design: Balancing Simplicity and Enterprise Power",
    scenario_role: 'Product Manager, API Platform',
    scenario_context:
      "Stripe serves two audiences with the same API surface: solo developers building their first SaaS product and enterprise companies processing billions in annual volume. A developer survey shows solo developers cite 'too many configuration options' as the top friction point, while enterprise architects cite 'insufficient customization hooks' as their top complaint.",
    scenario_trigger:
      'An API design review flags that the Charges API and the Payment Intents API both exist for similar use cases, creating confusion about which to use. New developers frequently start with Charges and hit limitations; enterprise customers want Payment Intents to support 3DS2 and regional compliance requirements.',
    scenario_question:
      'How do you design an API strategy that is simple enough for solo developers to integrate in an afternoon while remaining powerful enough for enterprise payment orchestration?',
    engineer_standout:
      'A strong engineer would recognize that API simplicity and API power are not mutually exclusive if the surface is layered correctly, and would propose an opinionated default layer over a flexible primitive layer rather than a single-surface compromise.',
    paradigm: 'traditional',
    industry: 'FinTech',
    sub_vertical: 'Developer Platform',
    difficulty: 'advanced',
    estimated_minutes: 25,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['taste'],
    frameworks: ['Progressive Disclosure', 'Platform Design'],
    relevant_roles: ['swe', 'tech_lead', 'pm', 'em'],
    company_tags: ['Stripe', 'Twilio', 'Plaid'],
    tags: ['api-design', 'developer-experience', 'platform', 'enterprise', 'stripe'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: 'Are API simplicity and API power actually in conflict, or does the current design just expose the wrong primitives by default?',
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: 'What is the correct framing of the tension between developer simplicity and enterprise power in API design?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'The tension is real and unavoidable: any parameter added for enterprise customization adds cognitive load for solo developers',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'This is true for a flat API surface but misses the insight that layered design can separate the surfaces entirely. The tension is an architecture problem, not a product problem.',
              },
              {
                option_label: 'B',
                option_text: 'The tension is a design smell: Stripe currently exposes two competing APIs for overlapping jobs, when the correct design is an opinionated default layer over a flexible primitive layer',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'Layered API design is the canonical resolution to this tension in developer tools. Twilio, Stripe itself, and AWS all use this pattern. The Charges and Payment Intents confusion is evidence that the layer boundary is not clear enough.',
              },
              {
                option_label: 'C',
                option_text: 'The tension is a support cost problem: enterprise needs create documentation complexity that confuses solo developers who encounter enterprise concepts they do not need',
                quality: 'surface',
                points: 1,
                competencies: ['cognitive_empathy'],
                explanation:
                  'Documentation complexity is a symptom of the underlying API design problem. Better docs on a poorly layered API reduce confusion at the margin but do not resolve the root tension.',
              },
              {
                option_label: 'D',
                option_text: 'The tension does not exist: Payment Intents is the correct API for all developers, and the fix is deprecating Charges and migrating everyone to Payment Intents',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['domain_expertise'],
                explanation:
                  'Payment Intents exposes compliance and 3DS2 configuration that solo developers do not need or understand. Migrating all developers to a more complex API increases friction for the simpler use case.',
              },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: "What design patterns from other developer platforms handle simple-vs-powerful API surfaces well?",
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: "Which API design pattern best resolves the simplicity-power tension for Stripe's use case?",
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['domain_expertise', 'taste'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Progressive disclosure: a single PaymentIntent surface with smart defaults that handle 90% of cases automatically, and explicit override parameters that unlock compliance, routing, and orchestration capabilities for enterprise',
                quality: 'best',
                points: 3,
                competencies: ['domain_expertise', 'taste'],
                explanation:
                  'Progressive disclosure on a single surface resolves the two-API confusion. Smart defaults make the simple case require minimal configuration; explicit overrides give enterprise full control without polluting the default path.',
              },
              {
                option_label: 'B',
                option_text: 'Two separate SDKs: a simple SDK with higher-level abstractions for developers and a low-level SDK for enterprise engineers',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['domain_expertise'],
                explanation:
                  'Separate SDKs are one valid pattern but create maintenance overhead and a migration path problem when simple-SDK developers outgrow the abstraction. A single surface with progressive disclosure is more elegant.',
              },
              {
                option_label: 'C',
                option_text: 'A visual no-code payment builder for solo developers and raw API access for enterprise engineers',
                quality: 'surface',
                points: 1,
                competencies: ['creative_execution'],
                explanation:
                  'No-code builders serve a different audience (non-technical founders, not developers). Solo developers who write code still need the API, just with fewer required decisions.',
              },
              {
                option_label: 'D',
                option_text: 'Rate-limit access to advanced Payment Intents parameters until merchants reach a minimum payment volume threshold',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Volume-gating advanced parameters would prevent small enterprise users from accessing compliance features they need from day one. It conflates company size with technical sophistication.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'What specifically do you set as defaults, and what do you require explicit opt-in for? Name both.',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'In a progressively disclosed PaymentIntent API, what should be a smart default versus an explicit parameter?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Default: automatic payment method selection, best-available 3DS handling, and single currency. Explicit opt-in: multi-currency settlement, specific payment method routing, SCA exemption strategies, and network tokenization.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'This boundary is correct: the default path handles the compliant, single-merchant, single-currency use case with no required decisions. Enterprise parameters are all things that solo developers either do not need or would misconfigure if exposed by default.',
              },
              {
                option_label: 'B',
                option_text: 'Default: all parameters set to the most restrictive values. Explicit opt-in: enabling any feature requires a configuration key in the dashboard.',
                quality: 'surface',
                points: 1,
                competencies: [],
                explanation:
                  'Most restrictive defaults would block legitimate use cases that solo developers encounter immediately, like basic card payments without SCA configuration.',
              },
              {
                option_label: 'C',
                option_text: 'Default: nothing. Require all developers to explicitly configure every parameter so there are no hidden behaviors.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Zero defaults maximizes transparency but maximizes integration friction for solo developers, directly contradicting the design objective.',
              },
              {
                option_label: 'D',
                option_text: 'Default: all features enabled with the most permissive configuration. Enterprise customers configure stricter controls.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['domain_expertise'],
                explanation:
                  'Permissive defaults reduce solo developer friction but expose compliance features that enterprise customers need to control carefully. An enterprise architect who relies on defaults for 3DS or network tokenization may ship a non-compliant integration.',
              },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'How do you manage the existing Charges API migration without breaking the developers who depend on it today?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the right deprecation strategy for the Charges API, given that many live integrations depend on it?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Maintain Charges API indefinitely but stop new feature development on it; all new documentation defaults to PaymentIntents; automated migration tooling converts existing Charges integrations to Payment Intents with a one-command CLI tool.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'creative_execution'],
                explanation:
                  'No forced migration preserves existing integrations; documentation bias drives new developers to the correct path; automated tooling lowers the migration cost for developers who want to upgrade. This is the standard playbook for Stripe-level API migrations.',
              },
              {
                option_label: 'B',
                option_text: 'Deprecate Charges API with 6 months notice and require all developers to migrate to PaymentIntents by the deadline.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Forced migration with a hard deadline creates a large-scale engineering obligation for customers who may have thousands of Charges API calls. Stripe has historically avoided forced migrations for this reason.',
              },
              {
                option_label: 'C',
                option_text: 'Redirect all Charges API calls internally to Payment Intents without developer awareness.',
                quality: 'surface',
                points: 1,
                competencies: ['domain_expertise'],
                explanation:
                  'Silent redirects create unpredictable behavior differences and make debugging harder. Developers who rely on Charges API response shapes may encounter silent breaking changes.',
              },
              {
                option_label: 'D',
                option_text: 'Publish a migration guide and let the ecosystem migrate at its own pace with no tooling support.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['creative_execution'],
                explanation:
                  "Documentation-only migration reduces Stripe's support burden but makes migration high-effort for developers. Without tooling, migration rates will be slow and the two-API confusion persists longer.",
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'pm-stripe-004',
    title: "Stripe's Next Vertical: Expanding into Financial Services",
    scenario_role: 'Product Manager, Platform Strategy',
    scenario_context:
      "Stripe has expanded from payment processing to Stripe Billing, Stripe Treasury, Stripe Capital, and Stripe Issuing, each extending the platform deeper into financial services for businesses. The total addressable market for business financial services is orders of magnitude larger than payment processing alone.",
    scenario_trigger:
      'A strategy offsite asks the product org to identify the single highest-leverage financial services vertical Stripe should enter next, given the company\'s existing infrastructure, distribution, and competitive position.',
    scenario_question:
      'What would you build next for Stripe to expand into a new financial services vertical?',
    engineer_standout:
      "A strong engineer would evaluate the candidates by infrastructure reuse rate, not just market size, and would identify which new vertical reuses the most of Stripe's existing data graph, compliance stack, and distribution without requiring a new regulatory moat.",
    paradigm: 'traditional',
    industry: 'FinTech',
    sub_vertical: 'Financial Infrastructure',
    difficulty: 'advanced',
    estimated_minutes: 25,
    primary_competencies: ['strategic_thinking', 'domain_expertise'],
    secondary_competencies: ['creative_execution'],
    frameworks: ['Platform Strategy', 'Opportunity Sizing'],
    relevant_roles: ['pm', 'tech_lead', 'em'],
    company_tags: ['Stripe', 'Plaid', 'Brex', 'Mercury'],
    tags: ['strategy', 'expansion', 'fintech', 'platform', 'stripe'],
    is_published: true,
    is_calibration: false,
    is_premium: false,
    steps: [
      {
        step: 'frame',
        step_nudge: "What criteria separate a strong Stripe vertical expansion from one that is just a large adjacent market?",
        grading_weight: 0.25,
        step_order: 1,
        questions: [
          {
            question_text: "Which evaluation framework most accurately identifies Stripe's highest-leverage vertical expansion?",
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Market size: identify the largest financial services market adjacent to payments and expand there',
                quality: 'surface',
                points: 1,
                competencies: ['strategic_thinking'],
                explanation:
                  "Market size alone identifies where money is, not where Stripe has a structural advantage. Competing on market size without a moat produces a commoditized product.",
              },
              {
                option_label: 'B',
                option_text: "Infrastructure reuse and distribution leverage: which vertical reuses the most of Stripe's existing payment data, compliance stack, and merchant relationships without requiring a new regulatory regime",
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'Infrastructure reuse is the correct primary criterion for Stripe because it determines competitive speed and margin. A vertical that reuses payment data (for underwriting) and existing compliance (for B2B FX) arrives faster and cheaper than a greenfield build.',
              },
              {
                option_label: 'C',
                option_text: 'Competitive gap: identify where PayPal, Square, or Brex have weak products and build there',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Competitive gap analysis is valuable but secondary. A gap in a market where Stripe lacks distribution or infrastructure advantage is still a weak opportunity.',
              },
              {
                option_label: 'D',
                option_text: 'Developer demand: survey Stripe API users about which financial services they wished Stripe offered and build the most requested feature',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Developer demand surveys capture existing pain in the current product, not strategic white space. Developers who want Stripe to build a bank account are asking for Treasury, which already exists.',
              },
            ],
          },
        ],
      },
      {
        step: 'list',
        step_nudge: 'What are the four or five most plausible financial services verticals Stripe could enter, and what does each require from Stripe that it does not already have?',
        grading_weight: 0.25,
        step_order: 2,
        questions: [
          {
            question_text: 'Which candidate vertical has the highest infrastructure reuse rate and the lowest new regulatory requirement?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Business foreign exchange and multi-currency treasury management for Stripe merchants operating across multiple countries',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  "Business FX reuses Stripe's existing multi-currency payment processing, bank partnerships, and merchant relationships directly. The regulatory requirement is an FX dealing license, which is lighter than a full banking license, and Stripe already operates in the relevant jurisdictions for Treasury.",
              },
              {
                option_label: 'B',
                option_text: 'Consumer banking: checking accounts, debit cards, and savings products for individual Stripe users',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['domain_expertise'],
                explanation:
                  "Consumer banking requires a bank charter or a bank sponsor, consumer-grade UX investment, FDIC positioning, and marketing to individuals, none of which Stripe currently has. Infrastructure reuse is minimal.",
              },
              {
                option_label: 'C',
                option_text: 'Business insurance: commercial liability, cyber, and D&O coverage bundled with Stripe accounts',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  "Business insurance leverages Stripe's merchant risk data for underwriting and existing distribution, but requires an insurance carrier partner or license, which is a materially different regulatory category than payments.",
              },
              {
                option_label: 'D',
                option_text: 'Embedded accounting: a Stripe-native bookkeeping and tax filing product using transaction data',
                quality: 'surface',
                points: 1,
                competencies: ['creative_execution'],
                explanation:
                  "Accounting has high infrastructure reuse (transaction data) but competes with QuickBooks, Xero, and hundreds of other tools. Stripe's data advantage is real but does not create a defensible moat in software-first accounting.",
              },
            ],
          },
        ],
      },
      {
        step: 'optimize',
        step_nudge: 'What do you name as the moat for the chosen vertical, and what do you sacrifice by choosing it over alternatives?',
        grading_weight: 0.30,
        step_order: 3,
        questions: [
          {
            question_text: 'For business FX and multi-currency treasury, what is Stripe\'s structural moat and what is the main sacrifice?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'domain_expertise'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Moat: Stripe holds settlement funds for merchants across 135 currencies, making FX a near-zero marginal cost addition to existing flow. Sacrifice: competing with bank FX desks that have 20 years of relationship and pricing infrastructure with enterprise treasurers.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'domain_expertise'],
                explanation:
                  'The moat is real and specific: Stripe touches the money already and adding FX at settlement is structurally cheaper than any standalone FX provider. The sacrifice is accurately named: enterprise treasury relationships take years to displace.',
              },
              {
                option_label: 'B',
                option_text: "Moat: Stripe's brand trust with developers. Sacrifice: FX margins are thin, reducing overall gross margin.",
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Brand trust is real but vague. Margin compression is a valid concern but secondary to the infrastructure moat argument. This framing is directionally correct but not specific enough to drive a decision.',
              },
              {
                option_label: 'C',
                option_text: 'Moat: Stripe can offer better FX rates than banks because it has lower overhead. Sacrifice: banks will respond by cutting their rates.',
                quality: 'surface',
                points: 1,
                competencies: ['domain_expertise'],
                explanation:
                  'Competing on rates is not a structural moat. Banks can match rates immediately. The infrastructure advantage is about cost structure and integration, not pricing alone.',
              },
              {
                option_label: 'D',
                option_text: 'There is no moat. FX is a commodity product and Stripe should avoid it.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: [],
                explanation:
                  'Dismissing the opportunity without engaging with the infrastructure argument skips the analysis. FX embedded in payment settlement is a different product from standalone FX brokerage.',
              },
            ],
          },
        ],
      },
      {
        step: 'win',
        step_nudge: 'What is the minimum viable version of this product that Stripe should ship in the first six months?',
        grading_weight: 0.20,
        step_order: 4,
        questions: [
          {
            question_text: 'What is the right MVP scope for Stripe FX in the first six months?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 1.0,
            target_competencies: ['strategic_thinking', 'creative_execution'],
            response_type: 'mcq_plus_elaboration',
            options: [
              {
                option_label: 'A',
                option_text: 'Auto-convert settlement funds from 10 top currency pairs to USD or local bank currency at time of payout, with transparent real-time exchange rates displayed in the Dashboard. No manual FX trading, no treasury management UI in V1.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'creative_execution'],
                explanation:
                  'Auto-convert at payout is the single highest-value touchpoint (Stripe already holds the funds) and requires no new merchant workflow. Limiting V1 to 10 top pairs and no trading UI keeps the build scoped. Transparent rates are the differentiation.',
              },
              {
                option_label: 'B',
                option_text: 'A full FX dashboard with real-time rate quotes, manual conversion requests, and forward contracts for merchants who want to hedge currency exposure.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['creative_execution'],
                explanation:
                  'Forward contracts and manual trading require a full treasury UI and hedging infrastructure. This is a 12-18 month build, not an MVP.',
              },
              {
                option_label: 'C',
                option_text: 'Display multi-currency balances in the Stripe Dashboard without any conversion capability in V1.',
                quality: 'surface',
                points: 1,
                competencies: [],
                explanation:
                  'Balance display is already partially available in Stripe Dashboard. Adding display without conversion creates no revenue and solves no merchant problem.',
              },
              {
                option_label: 'D',
                option_text: 'Launch a full treasury product supporting all 135 currencies with enterprise SLAs and a dedicated FX support desk.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Full multi-currency treasury is the right long-term product but not an MVP. 135 currencies require exchange relationships, rate management, and compliance coverage that cannot be built in six months.',
              },
            ],
          },
        ],
      },
    ],
  },
] as const
