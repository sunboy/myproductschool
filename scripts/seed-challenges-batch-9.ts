export const CHALLENGES = [
  {
    id: 'hp-coinbase-crypto-10x-growth',
    title: 'Growing a Crypto Product 10x: Coinbase',
    scenario_role: 'staff engineer',
    scenario_context:
      'Coinbase Wallet has grown steadily but plateaued at roughly 8 million monthly active users. DeFi activity on the platform accounts for less than 12% of transactions, and retention past the first swap drops sharply. The growth team is debating whether the next 10x comes from acquiring new users or deepening value for existing ones.',
    scenario_trigger:
      'The VP of Product asks you to walk through your growth thesis for Coinbase Wallet before the Q3 planning meeting.',
    scenario_question:
      'Which lever would you bet on to grow Coinbase Wallet 10x over the next two years?',
    engineer_standout:
      'Name the compounding mechanism — whether it is network effects, switching costs, or data loops — that makes the lever durable beyond the first acquisition spike.',
    paradigm: 'traditional',
    industry: 'fintech',
    sub_vertical: 'crypto',
    difficulty: 'advanced',
    estimated_minutes: 20,
    primary_competencies: ['strategic_thinking', 'growth_loops'],
    secondary_competencies: ['user_empathy', 'prioritization'],
    frameworks: ['AARRR', 'Jobs to be Done'],
    relevant_roles: ['tech_lead', 'staff_engineer', 'founding_engineer'],
    company_tags: ['Coinbase'],
    tags: ['crypto', 'growth', 'wallets', 'DeFi'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'What is the real constraint on 10x growth here — supply, demand, or trust?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text:
              'Coinbase Wallet is stuck at ~8M MAU. What is the upstream blocker on 10x growth?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['strategic_thinking', 'root_cause_analysis'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'The majority of potential crypto users lack a mental model for self-custody, making Wallet feel risky rather than empowering. Until that trust gap closes, acquisition spend and feature breadth both hit the same ceiling.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'user_empathy'],
                explanation:
                  'Trust deficit is the upstream root cause. Every downstream metric, activation, DeFi usage, retention, reflects it. Fixing UX or adding features leaves the ceiling intact if the user never crosses the custody threshold.',
              },
              {
                option_label: 'B',
                option_text:
                  'Coinbase Wallet lacks integrations with major DeFi protocols, so power users move to MetaMask instead.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_knowledge'],
                explanation:
                  'Protocol coverage is a real gap, but it is a mid-funnel retention issue for already-converted users, not the upstream barrier preventing the next 90M people from ever opening a self-custody wallet.',
              },
              {
                option_label: 'C',
                option_text:
                  'The wallet UI is not polished enough compared to centralized exchange apps, causing drop-off at first launch.',
                quality: 'surface',
                points: 1,
                competencies: ['user_empathy'],
                explanation:
                  'UI friction is real but symptomatic. The deeper problem is that users who do not understand self-custody will abandon regardless of how slick the onboarding looks.',
              },
              {
                option_label: 'D',
                option_text:
                  'Coinbase has not invested enough in paid acquisition channels to reach the next cohort of crypto newcomers.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['growth_loops'],
                explanation:
                  'Acquisition spend can widen the top of the funnel, but without addressing trust, the cohorts churn at the same rate. Growth needs a conversion mechanism, not just more top-of-funnel volume.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'What are the structurally distinct paths to 10x? Think in paradigms, not tactics.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text:
              'Three growth paradigms are on the table. Which one creates durable compounding rather than a one-time spike?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['strategic_thinking', 'growth_loops'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Social portfolio sharing: let users publish on-chain proof of yield without revealing holdings. Every share is a trust signal and an acquisition event, building a data loop where visibility drives adoption and adoption drives more on-chain activity to share.',
                quality: 'best',
                points: 3,
                competencies: ['growth_loops', 'strategic_thinking'],
                explanation:
                  'This lever is compounding because each new user generates content that acquires the next user. The data loop tightens over time, unlike performance marketing or one-off integrations.',
              },
              {
                option_label: 'B',
                option_text:
                  'Add fiat on-ramps for fifteen new countries to expand the addressable market in under-served regions.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['market_sizing'],
                explanation:
                  'Geographic expansion grows the pool, but it does not create compounding. Each new country requires fresh CAC without a mechanism that makes growth self-reinforcing.',
              },
              {
                option_label: 'C',
                option_text:
                  'Launch a referral program that pays existing users USDC for every friend who completes their first swap.',
                quality: 'surface',
                points: 1,
                competencies: ['growth_loops'],
                explanation:
                  'Referral programs generate a spike and then decay once the most social users have exhausted their networks. The incentive is cash, not a product value loop, so retention after the referral bonus expires is weak.',
              },
              {
                option_label: 'D',
                option_text:
                  'Partner with Coinbase exchange to auto-migrate users from custodial accounts to Wallet when they hit a threshold balance.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['strategic_thinking'],
                explanation:
                  'Forced migration at a balance threshold pushes users before they have built the mental model for self-custody, likely increasing churn and support costs rather than creating durable retention.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Every growth bet has a cost. What are you explicitly trading away?',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text:
              'If you prioritize social portfolio sharing as the primary growth lever, what are you optimizing for and what are you giving up?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['prioritization', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Optimizing for top-of-funnel virality and organic trust signals. The explicit trade-off is power-user depth: engineering cycles that could go toward advanced DeFi tooling or hardware wallet support go to the sharing surface and privacy tech instead.',
                quality: 'best',
                points: 3,
                competencies: ['prioritization', 'strategic_thinking'],
                explanation:
                  'This names both the criterion (virality via trust signals) and the concrete sacrifice (DeFi depth). That specificity lets the team stress-test the bet rather than treat it as obviously correct.',
              },
              {
                option_label: 'B',
                option_text:
                  'Optimizing for user growth while keeping all existing roadmap items on track through parallel workstreams.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['prioritization'],
                explanation:
                  'Parallel workstreams rarely hold under resource constraint. Refusing to name a sacrifice signals that the bet has not been pressure-tested, which makes the trade-off invisible until it hits in execution.',
              },
              {
                option_label: 'C',
                option_text:
                  'Optimizing for growth metrics in the short term, accepting some risk to longer-term retention quality.',
                quality: 'surface',
                points: 1,
                competencies: ['prioritization'],
                explanation:
                  'Too vague to be actionable. Every growth bet involves a retention risk. This framing does not identify what specifically is being traded away or how the team would know if the trade-off was worth it.',
              },
              {
                option_label: 'D',
                option_text:
                  'Optimizing for new user acquisition. The trade-off is that the feature requires significant privacy engineering, which delays the roadmap by about a quarter.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['prioritization'],
                explanation:
                  'Correct that privacy engineering is a real cost, but framing the trade-off purely as a timeline delay undersells the opportunity cost. What specific product bets are delayed, and for whom?',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'Make the call. One lever, one success condition.',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text:
              'How would you know in 90 days whether the social portfolio sharing bet is working?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics', 'decision_making'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Share-to-signup conversion rate for new users who arrive via a portfolio share link exceeds 15%, and 30-day retention for that cohort matches or beats organic signup retention. Both thresholds must hold together.',
                quality: 'best',
                points: 3,
                competencies: ['metrics', 'decision_making'],
                explanation:
                  'Two linked conditions prevent false positives: high conversion without retention means the share is clickbait; high retention without conversion means the growth loop is not closing. Requiring both makes the signal crisp.',
              },
              {
                option_label: 'B',
                option_text:
                  'Total share events per week increases by 3x over the first month after launch.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics'],
                explanation:
                  'Share events measure usage of the feature, not whether the growth loop closes. A 3x spike in shares with no downstream signups proves engagement, not growth.',
              },
              {
                option_label: 'C',
                option_text:
                  'New wallet activations increase month-over-month and app store reviews improve in sentiment.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics'],
                explanation:
                  'Both signals are too noisy to attribute to the social sharing feature specifically. Overall activations and sentiment are influenced by dozens of other variables across the same 90-day window.',
              },
              {
                option_label: 'D',
                option_text:
                  'At least 20% of new signups in the period can be attributed to a shared link, confirmed via UTM tracking.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics'],
                explanation:
                  'Attribution is a necessary condition but not sufficient. 20% of new signups via shared links still counts as success even if every one of those users churns in week two. Retention must be part of the gate.',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'hp-robinhood-fintech-trends',
    title: 'Acting on Fintech Trends: Robinhood',
    scenario_role: 'tech lead',
    scenario_context:
      'Robinhood has expanded from commission-free equities into crypto, options, and retirement accounts. Three structural shifts are reshaping fintech: AI-driven personalization at the portfolio level, embedded finance inside non-financial apps, and the rise of fractional ownership beyond stocks. The product strategy team is deciding which trend to lean into for the next 18-month roadmap.',
    scenario_trigger:
      'A VP asks you to present a trend and a concrete product move before the strategy offsite.',
    scenario_question:
      'Which fintech trend should Robinhood act on first, and what is the first product move?',
    engineer_standout:
      'Identify which of Robinhood\'s existing assets (distribution, data, brand) the chosen trend makes more valuable rather than obsolete.',
    paradigm: 'ai_assisted',
    industry: 'fintech',
    sub_vertical: 'retail_investing',
    difficulty: 'advanced',
    estimated_minutes: 20,
    primary_competencies: ['strategic_thinking', 'market_awareness'],
    secondary_competencies: ['product_vision', 'prioritization'],
    frameworks: ['Porter\'s Five Forces', 'Jobs to be Done'],
    relevant_roles: ['tech_lead', 'staff_engineer', 'founding_engineer'],
    company_tags: ['Robinhood'],
    tags: ['fintech', 'trends', 'strategy', 'AI', 'embedded_finance'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'Which trend reshapes the core job Robinhood is hired for, rather than adding a side feature?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text:
              'Why is acting on a fintech trend hard for an incumbent like Robinhood specifically?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['strategic_thinking', 'market_awareness'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Robinhood\'s growth was built on frictionless access, not advisory depth. Trends like AI personalization require trust and data that incumbents like Schwab or Fidelity have been accumulating for decades, so the gap is asset-level, not feature-level.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'market_awareness'],
                explanation:
                  'Framing the problem as an asset gap rather than a feature gap is the correct level of analysis. It explains why copying a feature from a competitor would not close the distance and shapes what kind of first move is defensible.',
              },
              {
                option_label: 'B',
                option_text:
                  'Robinhood has had regulatory trouble in the past, which slows down new product launches compared to pure fintech startups.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['market_awareness'],
                explanation:
                  'Regulatory friction is a real constraint, but it does not explain why a specific trend is harder for Robinhood than for other incumbents who also face heavy regulation. It is an execution headwind, not the strategic framing.',
              },
              {
                option_label: 'C',
                option_text:
                  'The app is associated with meme stocks and high-risk trading, which may turn off the wealth-building users that trends like retirement personalization target.',
                quality: 'surface',
                points: 1,
                competencies: ['brand_strategy'],
                explanation:
                  'Brand perception is a real constraint but downstream of a deeper asset problem. The question is whether Robinhood has the data and trust architecture to deliver on the trend, not just whether the brand fits.',
              },
              {
                option_label: 'D',
                option_text:
                  'Robinhood lacks the engineering resources to build AI models in-house and would have to rely on third-party vendors.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['technical_strategy'],
                explanation:
                  'Build vs. buy is a solvable implementation question, not the upstream strategic constraint. Most fintech incumbents use third-party AI. The real problem is whether the underlying data and user trust exist to make the AI useful.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'Map the three trends to Robinhood\'s actual assets. Which one builds on what they have?',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text:
              'Which trend is the strongest fit with Robinhood\'s current distribution and behavioral data?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['strategic_thinking', 'product_vision'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'AI-driven personalization. Robinhood has granular behavioral data on trade timing, instrument choice, and risk tolerance across 20M+ accounts. That data is the raw material for personalized nudges and portfolio coaching that Schwab cannot replicate at the same granularity.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'product_vision'],
                explanation:
                  'AI personalization is the trend most amplified by assets Robinhood already holds. The behavioral data moat is real and not easily replicated by incumbents whose users interact through advisors rather than apps.',
              },
              {
                option_label: 'B',
                option_text:
                  'Embedded finance. Robinhood could white-label its brokerage rails into third-party apps, expanding distribution without needing to win new direct users.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['market_awareness'],
                explanation:
                  'Embedded finance is a real trend, but Robinhood\'s advantage is its direct consumer relationship, not its B2B infrastructure. Moving to white-label competes against Apex, DriveWealth, and others who have deeper B2B experience.',
              },
              {
                option_label: 'C',
                option_text:
                  'Fractional ownership of alternative assets like real estate or private equity, which opens up a segment Robinhood does not currently serve.',
                quality: 'surface',
                points: 1,
                competencies: ['market_sizing'],
                explanation:
                  'Alternatives are an interesting adjacent market, but they require different regulatory infrastructure, asset custody, and user education. Starting here means building new assets rather than leveraging existing ones.',
              },
              {
                option_label: 'D',
                option_text:
                  'Social investing, where users follow and copy portfolios of high-performing peers, generating network effects inside the app.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['growth_loops'],
                explanation:
                  'Social investing was tried (Public, eToro) and showed that copying without understanding generates regret and churn. Robinhood\'s data advantage is behavioral, not social graph, making this trend a poor fit.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Betting on AI personalization has a specific trade-off. Name the criterion and the sacrifice.',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text:
              'If Robinhood commits to AI-driven personalization as the primary trend bet, what is the right first product move and what does it sacrifice?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['prioritization', 'product_vision'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Build a behavioral nudge engine that surfaces personalized risk alerts and rebalancing prompts in the home feed. Optimizing for engagement depth over breadth means deferring crypto expansion and international markets for at least two quarters.',
                quality: 'best',
                points: 3,
                competencies: ['prioritization', 'product_vision'],
                explanation:
                  'The nudge engine is the narrowest viable first move that closes the loop between behavioral data and user action. Naming the deferred bets (crypto expansion, international) makes the trade-off concrete enough to pressure-test.',
              },
              {
                option_label: 'B',
                option_text:
                  'Launch a personalized financial health score that synthesizes spending, portfolio, and savings data, giving users a single number to optimize.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_vision'],
                explanation:
                  'A financial health score is a compelling consumer product, but it requires spending data Robinhood does not have without a banking layer. This move implicitly assumes a larger build than the question acknowledges.',
              },
              {
                option_label: 'C',
                option_text:
                  'Partner with an AI company to co-develop a robo-advisor product, keeping Robinhood\'s engineering focused on core trading infrastructure.',
                quality: 'surface',
                points: 1,
                competencies: ['prioritization'],
                explanation:
                  'Partnership avoids the hard decision about where to invest. A robo-advisor built on a partner\'s model does not deepen Robinhood\'s data moat; it creates a dependency that the partner could replicate or walk away from.',
              },
              {
                option_label: 'D',
                option_text:
                  'Roll out AI features incrementally across every product surface simultaneously to avoid under-investing in any one area.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['prioritization'],
                explanation:
                  'Spreading AI investment uniformly across surfaces produces shallow features on every surface and a breakthrough on none. It is the opposite of making a trend bet and will not create a defensible advantage.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'Make a crisp call on the single most important success metric for this trend bet.',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text:
              'What is the one metric that would confirm the AI personalization bet is generating durable value rather than engagement theater?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics', 'decision_making'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Assets under management per active user grows at least 15% year-over-year in cohorts that receive personalized nudges, compared to a control group that does not.',
                quality: 'best',
                points: 3,
                competencies: ['metrics', 'decision_making'],
                explanation:
                  'AUM per user is the behavioral outcome that proves personalization is changing financial decisions, not just session time. The control group comparison isolates the effect of the nudge engine from macro market moves.',
              },
              {
                option_label: 'B',
                option_text:
                  'Daily active users increase by 20% within 6 months of launching personalized features.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics'],
                explanation:
                  'DAU growth measures engagement, not financial health improvement. A notification that pulls users into the app daily could increase DAU while making their portfolio decisions worse.',
              },
              {
                option_label: 'C',
                option_text:
                  'Net Promoter Score improves by 10 points in the segment that uses personalized features most heavily.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics'],
                explanation:
                  'NPS measures sentiment, not behavior change. Users who like the feature may still not change their portfolio behavior. NPS is a leading indicator at best and does not confirm the trend bet is working.',
              },
              {
                option_label: 'D',
                option_text:
                  'Personalized nudge click-through rate exceeds 30% within the first quarter of launch.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics'],
                explanation:
                  'Click-through confirms the nudge is relevant enough to tap, but not that the tap leads to a better financial decision. A high CTR on alerts that users then dismiss without acting is not the success state the trend bet aims for.',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'hp-robinhood-cpo-three-teams',
    title: 'Three Teams as CPO: Robinhood',
    scenario_role: 'founding engineer',
    scenario_context:
      'Robinhood is profitable but facing a strategic crossroads. Commission-free trading is now table stakes. The next phase of the business depends on building durable recurring revenue and a product moat that goes beyond price. As a thought exercise in product leadership, the question is which three teams you would invest in if you had CPO authority and a fixed headcount budget.',
    scenario_trigger:
      'A board member asks you to walk through your three-team org design for Robinhood\'s next chapter.',
    scenario_question:
      'If you were CPO of Robinhood, which three product teams would you build and why?',
    engineer_standout:
      'Explain how the three teams interact and what would break if one were cut. Org design only counts when it reveals dependencies.',
    paradigm: 'traditional',
    industry: 'fintech',
    sub_vertical: 'retail_investing',
    difficulty: 'staff_plus',
    estimated_minutes: 25,
    primary_competencies: ['strategic_thinking', 'org_design'],
    secondary_competencies: ['prioritization', 'product_vision'],
    frameworks: ['Value Chain Analysis', 'Jobs to be Done'],
    relevant_roles: ['tech_lead', 'staff_engineer', 'em'],
    company_tags: ['Robinhood'],
    tags: ['fintech', 'org_design', 'strategy', 'product_leadership'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'What is the core strategic tension that the three-team structure must resolve?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text:
              'What is the upstream problem that should constrain which three teams Robinhood builds next?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['strategic_thinking', 'org_design'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Robinhood\'s revenue is heavily transaction-dependent, which ties the business to market volatility. The structural problem is building recurring revenue streams that hold in flat or bear markets without alienating the price-sensitive user base that made the brand.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'market_awareness'],
                explanation:
                  'Revenue concentration in transaction fees is the upstream constraint. Every org design choice that does not address this leaves Robinhood exposed to the same macro cycle risk. Teams should exist to diversify that dependency.',
              },
              {
                option_label: 'B',
                option_text:
                  'Robinhood needs to serve older, wealthier investors who have more assets to invest, not just the millennial retail segment.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['market_sizing'],
                explanation:
                  'Upmarket expansion is a real strategic option, but framing the problem as audience age misses why it matters. The goal is higher AUM and recurring revenue, not demographic diversity for its own sake.',
              },
              {
                option_label: 'C',
                option_text:
                  'The app has too many features and user research shows younger users are overwhelmed. Simplification should come before expansion.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['user_empathy'],
                explanation:
                  'Feature complexity is a UX problem, not a strategic problem. Simplification alone does not address the transaction-revenue concentration that puts the business at risk in bear markets.',
              },
              {
                option_label: 'D',
                option_text:
                  'Competitors like Schwab and Fidelity are adding commission-free trading, so differentiation is eroding and Robinhood needs to find new vectors.',
                quality: 'surface',
                points: 1,
                competencies: ['market_awareness'],
                explanation:
                  'Correct observation but one level too shallow. Naming that differentiation is eroding does not identify what kind of new vector would build a moat, which is what the org design question demands.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'Name three structurally distinct teams with different jobs, not variations of the same theme.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text:
              'Which set of three teams addresses the revenue concentration problem while building compounding value?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['org_design', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Wealth Layer (recurring subscription for portfolio coaching and tax tools), Ecosystem (API for third-party developers to build on Robinhood accounts), and Trust (regulatory, KYC, and privacy infrastructure that enables both). Each team unlocks the next one.',
                quality: 'best',
                points: 3,
                competencies: ['org_design', 'strategic_thinking'],
                explanation:
                  'The three teams are structurally distinct and sequentially dependent. Wealth Layer needs subscription revenue infrastructure. Ecosystem needs the Wealth Layer data to make the API valuable. Trust enables both without Robinhood taking on unlimited liability.',
              },
              {
                option_label: 'B',
                option_text:
                  'Growth, Retention, and Monetization teams, each owning a distinct funnel stage and reporting to a unified growth function.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['org_design'],
                explanation:
                  'Funnel-stage teams are an org pattern for scaling a known product, not for building new revenue streams. None of these teams are tasked with creating the recurring revenue structures that would reduce transaction dependency.',
              },
              {
                option_label: 'C',
                option_text:
                  'Crypto, Options, and Retirement teams, each focused on a distinct asset class where Robinhood can capture a larger share of the market.',
                quality: 'surface',
                points: 1,
                competencies: ['market_sizing'],
                explanation:
                  'Asset-class teams diversify product surface but not revenue model. Transaction fees on crypto and options still correlate with market volatility. The core strategic problem remains unsolved.',
              },
              {
                option_label: 'D',
                option_text:
                  'Banking (checking, savings, debit), Investing (core brokerage evolution), and Analytics (data products for power users). These three cover the full financial life of a user.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_vision'],
                explanation:
                  'Full financial lifecycle coverage is a real vision, but the three teams do not have clear dependencies or a sequenced logic for why this combination builds a moat rather than spreading investment thin.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Which of the three teams is the constraint? What breaks if it is underfunded?',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text:
              'In the Wealth Layer / Ecosystem / Trust structure, which team is the bottleneck and why?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['org_design', 'prioritization'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Trust is the bottleneck. Without compliant KYC, data governance, and consent infrastructure, Wealth Layer cannot share portfolio data with users for coaching, and Ecosystem cannot expose account data to third parties. Underfunding Trust freezes the other two teams at the boundary of what existing infrastructure already supports.',
                quality: 'best',
                points: 3,
                competencies: ['org_design', 'prioritization'],
                explanation:
                  'Trust is the shared dependency. Identifying it as the bottleneck demonstrates systems thinking about org design: the constraint is not the most visible team but the infrastructure team that unlocks the others.',
              },
              {
                option_label: 'B',
                option_text:
                  'Ecosystem is the bottleneck because third-party developers drive the network effects that make the platform defensible.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['org_design'],
                explanation:
                  'Ecosystem is the growth engine, but it depends on Trust being in place first. Calling Ecosystem the bottleneck conflates the team that generates the most value with the team that is the prerequisite for value generation.',
              },
              {
                option_label: 'C',
                option_text:
                  'Wealth Layer is the bottleneck because it is the most visible to users and drives the subscription revenue the other teams depend on.',
                quality: 'surface',
                points: 1,
                competencies: ['org_design'],
                explanation:
                  'Wealth Layer is the revenue engine, but revenue is a lagging indicator. If Trust is underfunded, Wealth Layer cannot legally build the data features that make the subscription valuable.',
              },
              {
                option_label: 'D',
                option_text:
                  'None of the three teams is a bottleneck if each has an independent roadmap with clear ownership boundaries.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['org_design'],
                explanation:
                  'Independent roadmaps eliminate the dependencies that make the three-team structure valuable. If the teams do not share a constraint, they are three separate products, not a coherent strategy.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'Make the call. Which team do you staff first and with what success condition?',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text:
              'If you can only fully staff one team in Q1, which is it and what does success look like at the end of the quarter?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['decision_making', 'metrics'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Staff Trust first. Q1 success is a published data governance policy, a completed audit of what account data can be shared and under what consent conditions, and a green light from legal for the Wealth Layer data sharing architecture.',
                quality: 'best',
                points: 3,
                competencies: ['decision_making', 'metrics'],
                explanation:
                  'Trust unblocks the other two teams. Q1 outputs are concrete and testable: the governance policy exists, the data audit is complete, legal has approved the architecture. These are not vague milestones.',
              },
              {
                option_label: 'B',
                option_text:
                  'Staff Wealth Layer first because users and investors can see subscription revenue growth immediately, which creates organizational momentum for the longer-term Trust and Ecosystem builds.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['decision_making'],
                explanation:
                  'Organizational momentum is a real consideration, but building Wealth Layer without Trust in place means the team will hit legal and compliance walls that delay the subscription product anyway.',
              },
              {
                option_label: 'C',
                option_text:
                  'Staff all three at 60% capacity to maintain progress on each front and avoid letting any one area fall too far behind.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['prioritization'],
                explanation:
                  'Three teams at 60% produce three teams moving slowly. In Q1, Trust at 60% means the governance work that unblocks Wealth Layer and Ecosystem is incomplete, delaying both. Spreading is the opposite of sequencing.',
              },
              {
                option_label: 'D',
                option_text:
                  'Staff Ecosystem first because developer adoption compounds over time and early API partners create a moat before competitors build their own.',
                quality: 'surface',
                points: 1,
                competencies: ['decision_making'],
                explanation:
                  'Ecosystem cannot expose account data to third parties without Trust\'s governance infrastructure. Staffing Ecosystem first means the team will spend Q1 waiting for data access decisions rather than shipping.',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'hp-reddit-search-improvement',
    title: 'Improving Reddit Search',
    scenario_role: 'staff engineer',
    scenario_context:
      'Reddit has over 100,000 active communities and 16 billion posts indexed, yet users consistently rate search as the worst part of the product. Third-party sites like Google still outperform Reddit\'s own search for finding relevant posts and communities. Most users who fail to find what they need via search leave the session rather than browse alternatives, representing both a discovery failure and a retention risk.',
    scenario_trigger:
      'The search infrastructure team is asking for a product-level framing before committing engineering resources to a redesign.',
    scenario_question:
      'How would you improve Reddit Search to help users find relevant communities and posts more effectively?',
    engineer_standout:
      'Distinguish between the search infrastructure problem and the search product problem. They require different solutions and different success metrics.',
    paradigm: 'ai_assisted',
    industry: 'social_media',
    sub_vertical: 'community_platforms',
    difficulty: 'standard',
    estimated_minutes: 18,
    primary_competencies: ['product_improvement', 'user_empathy'],
    secondary_competencies: ['technical_strategy', 'metrics'],
    frameworks: ['Jobs to be Done', 'North Star Metric'],
    relevant_roles: ['tech_lead', 'staff_engineer', 'swe'],
    company_tags: ['Reddit'],
    tags: ['search', 'discovery', 'communities', 'UX'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'What job is a Reddit user trying to do when they search? It is not always "find a post."',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text:
              'What is the primary reason Reddit Search fails users, beyond returning low-quality results?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['user_empathy', 'root_cause_analysis'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Reddit Search treats every query as a document retrieval problem, but most users searching on Reddit are trying to find a community or a conversation to join, not a single answer. The intent mismatch means the ranking model optimizes for the wrong outcome.',
                quality: 'best',
                points: 3,
                competencies: ['user_empathy', 'product_thinking'],
                explanation:
                  'Intent mismatch is the upstream failure. Reddit\'s unit of value is community membership and ongoing conversation, not individual posts. A search that returns top posts when the user wants a subreddit to follow has failed even if the documents are high quality.',
              },
              {
                option_label: 'B',
                option_text:
                  'Reddit\'s Elasticsearch index is not updated frequently enough, so new posts and comments often do not appear in results for hours after publishing.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['technical_strategy'],
                explanation:
                  'Index freshness is a real engineering problem, but it affects recency-sensitive queries rather than the majority of searches. Most failed searches on Reddit are not freshness failures; they are intent failures.',
              },
              {
                option_label: 'C',
                option_text:
                  'Reddit Search lacks advanced filters like date range, community, and media type, so power users cannot narrow results effectively.',
                quality: 'surface',
                points: 1,
                competencies: ['product_improvement'],
                explanation:
                  'Advanced filters help power users but do not address why most users fail at search. Casual users do not use filter UIs; they need the default result set to understand their intent without explicit refinement.',
              },
              {
                option_label: 'D',
                option_text:
                  'Google has indexed Reddit more deeply than Reddit\'s own search engine, so the external product will always outperform the internal one.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['technical_strategy'],
                explanation:
                  'Google\'s superior indexing is a symptom, not a cause. It reflects years of infrastructure underinvestment, but it does not explain the product-level intent problem that would persist even with perfect indexing.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'Identify the top three distinct user jobs that Reddit Search should address.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text:
              'Which set of three distinct search intents covers the majority of Reddit Search jobs to be done?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['user_empathy', 'product_improvement'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Find my community (which subreddit should I join for X), find the conversation (has anyone discussed this specific situation), and find the answer (what did Reddit say about this product or decision). Each needs a different result surface and ranking signal.',
                quality: 'best',
                points: 3,
                competencies: ['user_empathy', 'product_improvement'],
                explanation:
                  'These three intents are structurally distinct: community discovery needs subreddit cards with subscriber count and activity, conversation finding needs thread surfaces with vote context, and answer finding needs top-comment extraction. One ranking model cannot serve all three well.',
              },
              {
                option_label: 'B',
                option_text:
                  'Browse (casual discovery), research (deep reading on a topic), and verify (checking whether a claim has been made on Reddit before).',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['user_empathy'],
                explanation:
                  'A reasonable segmentation but framed around user mode rather than the outcome the user needs from the search result page. Modes are harder to detect and design for than outcome-based intents.',
              },
              {
                option_label: 'C',
                option_text:
                  'Text search, image search, and video search, each requiring a separate index and ranking model.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['technical_strategy'],
                explanation:
                  'Media type is an infrastructure dimension, not a user intent. A user searching for "best mechanical keyboards" may want text posts, images, and videos, but the intent is the same: finding community knowledge on a topic.',
              },
              {
                option_label: 'D',
                option_text:
                  'New users (onboarding to Reddit communities), returning users (catching up on known communities), and power users (researching topics across subreddits).',
                quality: 'surface',
                points: 1,
                competencies: ['user_empathy'],
                explanation:
                  'User maturity is a useful segmentation for onboarding design but not for search. A new user and a power user can have identical search intents on the same day depending on the query.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Pick the one intent to fix first. Name what you optimize for and what you explicitly defer.',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text:
              'If you can only fix one search intent this quarter, which do you pick and what do you give up?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['prioritization', 'product_improvement'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Fix community discovery first. Optimizing for new users finding and joining the right subreddit has the highest compounding return because each successful join increases DAU and content generation across the platform. Deferring conversation-finding and answer-finding means power users still rely on Google.',
                quality: 'best',
                points: 3,
                competencies: ['prioritization', 'product_improvement'],
                explanation:
                  'Community discovery is the highest-leverage fix because subreddit membership is the core retention mechanism on Reddit. Every user who finds their community stays; every one who does not becomes a one-time visitor.',
              },
              {
                option_label: 'B',
                option_text:
                  'Fix answer-finding first because it is the most common search job and the one where Google\'s advantage is most visible to users, so improving it has the highest brand impact.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['prioritization'],
                explanation:
                  'Answer-finding frequency is real, but the downstream impact of a successful answer-finding search is a read-and-leave session. Community discovery leads to membership, which leads to sessions that generate new content and comments.',
              },
              {
                option_label: 'C',
                option_text:
                  'Fix all three intents simultaneously with a unified semantic search model that reranks results based on inferred intent classification.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['technical_strategy'],
                explanation:
                  'Unified semantic search that handles three intents simultaneously is a multi-quarter infrastructure project. It is not a quarterly choice between intents; it is a reframing that avoids making the choice at all.',
              },
              {
                option_label: 'D',
                option_text:
                  'Fix conversation-finding because Reddit\'s unique value is in threaded discussions, and making threads discoverable differentiates from Google\'s flat document results.',
                quality: 'surface',
                points: 1,
                competencies: ['product_thinking'],
                explanation:
                  'Conversation-finding is a real job, but it serves users who already know Reddit has the content they want. Community discovery serves users who do not yet know which subreddit is relevant, which is the earlier and more impactful problem.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'Define the success state for fixing community discovery search.',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text:
              'How would you measure whether the community discovery search fix is working after one month?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics', 'decision_making'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Subreddit subscription rate for sessions that include a search query increases by at least 10% versus the pre-launch baseline. Secondary check: sessions that search and subscribe have 30-day retention above the platform average.',
                quality: 'best',
                points: 3,
                competencies: ['metrics', 'decision_making'],
                explanation:
                  'Subscription rate from search sessions directly measures whether community discovery improved. The retention check ensures the subscriptions are genuine community fits rather than accidental clicks on newly prominent results.',
              },
              {
                option_label: 'B',
                option_text:
                  'Search session bounce rate decreases by 15% in the month after launch.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics'],
                explanation:
                  'Bounce rate reduction confirms users are engaging with results rather than leaving, but it does not confirm they are joining communities. A user who clicks three posts and leaves has lower bounce rate without becoming a retained member.',
              },
              {
                option_label: 'C',
                option_text:
                  'Overall Reddit DAU increases by 5% in the month following the search improvement launch.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics'],
                explanation:
                  'DAU is too noisy to attribute to a single search improvement within one month. Dozens of other factors affect DAU over a 30-day window, making this metric unable to confirm causation.',
              },
              {
                option_label: 'D',
                option_text:
                  'The number of search queries that return at least one subreddit result in the top three positions increases by 25%.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics'],
                explanation:
                  'This measures a ranking change, not a user outcome. Showing subreddits more prominently does not mean users are subscribing to them. It measures what the algorithm did, not whether users got what they needed.',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'hp-reddit-video-ranking',
    title: 'Making Videos Rank Higher on Reddit',
    scenario_role: 'tech lead',
    scenario_context:
      'Reddit launched its native video player in 2017, but video posts consistently underperform image and text posts in both organic ranking and discovery. Short-form video platforms like TikTok and Instagram Reels have trained users to expect video-first feeds, yet Reddit\'s algorithm still surfaces video content at rates well below its engagement-per-minute relative to static posts. The content team wants to change this.',
    scenario_trigger:
      'The feed ranking team asks you to scope a video ranking initiative before the next sprint planning.',
    scenario_question:
      'How would you make videos rank higher on Reddit?',
    engineer_standout:
      'Identify the difference between boosting video impressions (an algorithmic dial) and making video natively valuable for the communities where it belongs (a product bet). The second is harder and more durable.',
    paradigm: 'ai_assisted',
    industry: 'social_media',
    sub_vertical: 'community_platforms',
    difficulty: 'standard',
    estimated_minutes: 18,
    primary_competencies: ['product_improvement', 'technical_strategy'],
    secondary_competencies: ['metrics', 'user_empathy'],
    frameworks: ['Jobs to be Done', 'North Star Metric'],
    relevant_roles: ['tech_lead', 'swe', 'staff_engineer'],
    company_tags: ['Reddit'],
    tags: ['video', 'ranking', 'feed_algorithm', 'content_strategy'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'Is the problem that video is ranked too low, or that video is not yet worth ranking higher?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text:
              'Why does Reddit\'s current ranking system undervalue video content relative to text and images?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['technical_strategy', 'product_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Reddit\'s ranking algorithm was built around upvotes and comment velocity, both of which are generated faster on text posts. Video engagement signals, watch time and completion rate, are not in the ranking model at all, so video never gets credit for the attention it holds.',
                quality: 'best',
                points: 3,
                competencies: ['technical_strategy', 'product_thinking'],
                explanation:
                  'The ranking model only sees signals it was designed to collect. Since watch time was never instrumented as a first-class ranking signal, video is perpetually undervalued relative to its actual engagement value. This is a data model gap, not a content quality problem.',
              },
              {
                option_label: 'B',
                option_text:
                  'Reddit users prefer text-based discussions and upvote text posts more frequently, reflecting a genuine community preference rather than an algorithmic bias.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['user_empathy'],
                explanation:
                  'This explanation conflates correlation with causation. Text posts get more upvotes partly because they have been ranked higher for longer, which drives more impressions and therefore more upvotes. The preference may be algorithmic artifact, not authentic preference.',
              },
              {
                option_label: 'C',
                option_text:
                  'Reddit\'s mobile app video player is worse than native iOS and Android video, causing users to abandon video posts faster and depress engagement metrics.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['technical_strategy'],
                explanation:
                  'Player quality is a real contribution to underperformance, but it is a downstream factor. Even a perfect player would not help if watch time is not a ranking signal and video posts still receive fewer upvotes per impression than text.',
              },
              {
                option_label: 'D',
                option_text:
                  'Video creation on Reddit requires more effort than posting text or images, so the volume of video content is simply too low to rank competitively.',
                quality: 'surface',
                points: 1,
                competencies: ['product_thinking'],
                explanation:
                  'Volume is a consequence of ranking, not an independent cause. Creators make less video content partly because video posts perform worse, which is itself a product of the ranking model not crediting video engagement signals.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'List the three interventions and distinguish between algorithmic dials and product bets.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text:
              'Which three interventions would you prioritize to sustainably improve video ranking on Reddit?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['technical_strategy', 'product_improvement'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Add watch-time and completion-rate as first-class ranking signals, build creator analytics that show video-specific metrics so creators can improve, and identify the 20 subreddits where video naturally outperforms so the algorithm learns community context rather than treating all video the same.',
                quality: 'best',
                points: 3,
                competencies: ['technical_strategy', 'product_improvement'],
                explanation:
                  'These three interventions are structurally distinct: the first fixes the ranking model, the second improves supply quality over time, and the third teaches the algorithm community context. Together they create a compounding feedback loop.',
              },
              {
                option_label: 'B',
                option_text:
                  'Add a dedicated video tab in the nav, push-notify users when a subreddit they follow posts a viral video, and display video completion percentages on the post card.',
                quality: 'surface',
                points: 1,
                competencies: ['product_improvement'],
                explanation:
                  'These are surface-level UX changes. A video tab moves where videos live but does not make them rank higher in the main feed. Notifications are a blunt instrument that can increase opens while hurting long-term engagement.',
              },
              {
                option_label: 'C',
                option_text:
                  'Apply a global 20% boost multiplier to all video posts in the ranking algorithm to immediately increase video impressions across the platform.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['technical_strategy'],
                explanation:
                  'A global boost overrides community context. Communities that have organically low video engagement will be flooded with video posts their members did not upvote, damaging feed quality and user trust in the algorithm.',
              },
              {
                option_label: 'D',
                option_text:
                  'Improve the native video player to match Instagram quality, add auto-captions, and enable looping, making video more competitive on the consumption side.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_improvement'],
                explanation:
                  'Player quality improvements help retention per video session, but without watch time as a ranking signal, better watch completion does not flow back into improved ranking. The consumption experience improves but the supply flywheel does not close.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Adding watch-time to the ranking model has a cost. What are you optimizing for and what breaks?',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text:
              'If watch-time becomes a first-class ranking signal, what does that optimize for and what does it risk?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['technical_strategy', 'prioritization'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Optimizing for total attention captured per session. The explicit risk is that long videos with low upvotes but high completion rise above short, highly-upvoted posts, shifting Reddit\'s identity from community-curation to algorithmic recommendation, which may alienate the core power-user base that generates comments.',
                quality: 'best',
                points: 3,
                competencies: ['technical_strategy', 'prioritization'],
                explanation:
                  'Naming the identity risk is critical. Reddit\'s core product promise is community curation via upvotes, not algorithmic recommendation. Watch time as a dominant signal moves Reddit closer to TikTok\'s model, which may erode the community behaviors that make Reddit unique.',
              },
              {
                option_label: 'B',
                option_text:
                  'Optimizing for video creator satisfaction. The risk is that shorter text posts will be deprioritized, reducing the comment-heavy discussions that drive most of Reddit\'s content generation.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['product_thinking'],
                explanation:
                  'Creator satisfaction is a reasonable framing, but it is a secondary effect. The primary optimization target is session engagement, and the primary risk is the shift in Reddit\'s curation identity, not just changes in content mix.',
              },
              {
                option_label: 'C',
                option_text:
                  'Optimizing for ad revenue by increasing video impressions, since video ads command higher CPMs than display ads.',
                quality: 'surface',
                points: 1,
                competencies: ['business_model'],
                explanation:
                  'Ad revenue is a real business motivation, but it is not the product optimization target. Ranking decisions should be grounded in user value first; ad revenue follows from engagement quality, not the reverse.',
              },
              {
                option_label: 'D',
                option_text:
                  'There is no meaningful risk. Watch time is a better signal than upvotes because it represents genuine engagement rather than a one-tap vote.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['technical_strategy'],
                explanation:
                  'Dismissing the trade-off misses the core tension. Watch time measures individual attention but not community endorsement. Reddit\'s comment culture depends on posts that generate discussion, which correlates more with upvotes than with video completion rates.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'Make a crisp call on which signal to add first and how you would know it is working.',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text:
              'Which signal do you add to the ranking model first, and what is the success condition after 30 days?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['decision_making', 'metrics'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Add video completion rate as the first signal, weighted at 10% of the ranking score. Success at 30 days: video post click-through rate increases by at least 8% in the treated feed, and upvote rate on video posts in the top 10 positions does not decrease, confirming the community is not rejecting algorithmically promoted video.',
                quality: 'best',
                points: 3,
                competencies: ['decision_making', 'metrics'],
                explanation:
                  'Starting at 10% weight is conservative enough to test the signal without overriding community curation. The dual success condition, CTR up and upvote rate stable, prevents a false positive where video ranks higher but the community rejects the promoted content.',
              },
              {
                option_label: 'B',
                option_text:
                  'Add watch time as the primary signal at 30% weight to create a meaningful shift in the ranking distribution and generate a detectable result within the test window.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['decision_making'],
                explanation:
                  'A 30% weight change is too aggressive for a first test. It risks collateral damage to community-curated feeds before there is evidence that watch time is a positive quality signal rather than a neutral attention signal.',
              },
              {
                option_label: 'C',
                option_text:
                  'Add completion rate and watch time simultaneously at 5% each to maintain balance between the two signals.',
                quality: 'surface',
                points: 1,
                competencies: ['decision_making'],
                explanation:
                  'Running both signals simultaneously makes it impossible to isolate which signal is driving the observed effect. A clean first test requires one variable change.',
              },
              {
                option_label: 'D',
                option_text:
                  'Run a 60-day experiment before committing to any ranking change, to ensure enough data is collected for statistical significance.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics'],
                explanation:
                  'Statistical rigor is important, but 60 days for a 10% weight test is longer than necessary. Reddit has enough daily traffic volume to reach significance on feed-level ranking experiments within 2-3 weeks.',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'hp-tiktok-dau-growth-experiments',
    title: 'TikTok DAU Growth: Which Lever to Pull',
    scenario_role: 'staff engineer',
    scenario_context:
      'TikTok\'s growth team is evaluating three investment areas for the next half: recommendation algorithm improvements, user acquisition campaigns targeting new demographics, and creator tool upgrades for production quality. All three have shown positive signals in small pilots, but the team needs to decide where to go deep. The constraint is that going deep on one area means explicitly deferring the others.',
    scenario_trigger:
      'The data science lead asks you to design the experiment portfolio that would answer the prioritization question before the half-year planning lock.',
    scenario_question:
      'Which data and experiments would you run to decide whether recommendations, user acquisition, or creator tools will boost TikTok\'s DAU most effectively?',
    engineer_standout:
      'Name the causal mechanism each lever uses to grow DAU, not just the correlation it creates, so the experiments test causation rather than confirmation.',
    paradigm: 'ai_native',
    industry: 'social_media',
    sub_vertical: 'short_form_video',
    difficulty: 'advanced',
    estimated_minutes: 22,
    primary_competencies: ['metrics', 'experimental_design'],
    secondary_competencies: ['strategic_thinking', 'prioritization'],
    frameworks: ['AARRR', 'A/B Testing', 'North Star Metric'],
    relevant_roles: ['staff_engineer', 'tech_lead', 'em'],
    company_tags: ['TikTok'],
    tags: ['DAU', 'growth', 'experimentation', 'recommendations', 'creators'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'What is the right framing before designing any experiment? Correlation is not the answer.',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text:
              'What is the upstream problem with running three parallel pilots and choosing the winner based on DAU lift?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['experimental_design', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'DAU lift in a pilot does not reveal the causal mechanism. Recommendations improve retention for existing users, acquisition brings new users, and creator tools grow content supply. These affect DAU through different pathways, and a pilot showing equal lift from each does not tell you which pathway is more scalable or durable at 10x investment.',
                quality: 'best',
                points: 3,
                competencies: ['experimental_design', 'strategic_thinking'],
                explanation:
                  'The core problem is measuring the outcome (DAU) without measuring the mechanism. If recommendations improve DAU by 2% by increasing session frequency, that compounds differently than acquisition improving DAU by 2% through new registrations. The experiments must test the mechanism, not just the output.',
              },
              {
                option_label: 'B',
                option_text:
                  'Running three pilots simultaneously risks interference effects, where users in one pilot are also exposed to changes from another, corrupting the results of all three.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['experimental_design'],
                explanation:
                  'Interference is a real experimental design problem, but it is a methodological concern, not the upstream framing problem. The deeper issue is that measuring DAU lift alone, even with clean experiment isolation, does not tell you which lever to scale.',
              },
              {
                option_label: 'C',
                option_text:
                  'Pilots are too short to measure DAU impact because new users need several weeks to develop the habit that drives daily return.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics'],
                explanation:
                  'Duration is a design parameter that can be adjusted. The framing problem is not how long the pilots run but what they measure. Even a long pilot measuring only DAU lift would not answer which mechanism to invest in at scale.',
              },
              {
                option_label: 'D',
                option_text:
                  'The three levers are not mutually exclusive, so running them as competing experiments creates a false trade-off. All three should be invested in simultaneously.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['prioritization'],
                explanation:
                  'The constraint was stated: going deep on one means explicitly deferring others. Arguing that all three should be funded simultaneously avoids the prioritization question rather than answering it.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'Design one experiment per lever. Each experiment should test the causal mechanism, not the outcome.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text:
              'Which experiment design correctly tests the causal mechanism for the recommendations lever?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['experimental_design', 'metrics'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Hold user acquisition constant. Randomly assign existing 30-60 day users to improved vs. baseline recommendations. Measure 14-day retention delta and session frequency change, not DAU. If improved recommendations increase session frequency without increasing acquisition, the mechanism is engagement depth, which scales differently than top-of-funnel growth.',
                quality: 'best',
                points: 3,
                competencies: ['experimental_design', 'metrics'],
                explanation:
                  'Holding acquisition constant and measuring session frequency tests whether recommendations improve the depth of existing-user engagement. This isolates the mechanism rather than mixing it with new-user effects that would appear in raw DAU.',
              },
              {
                option_label: 'B',
                option_text:
                  'Run an A/B test where 50% of users get improved recommendations and measure which group has higher DAU after 4 weeks.',
                quality: 'surface',
                points: 1,
                competencies: ['experimental_design'],
                explanation:
                  'This measures the output (DAU) without illuminating the mechanism. An equal DAU lift could come from more sessions per existing user, from reduced churn, or from better reactivation of dormant users, all of which have different implications for scaling the investment.',
              },
              {
                option_label: 'C',
                option_text:
                  'Test improved recommendations specifically on new users in their first 7 days, since recommendation quality most affects early habit formation.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['experimental_design'],
                explanation:
                  'Targeting new users is a reasonable hypothesis about where recommendations matter most, but it introduces confounding from the new user experience. Testing on 30-60 day users isolates the recommendation effect from onboarding effects.',
              },
              {
                option_label: 'D',
                option_text:
                  'Measure which content categories users in the improved recommendations group watch most, and use that to infer whether recommendation quality has improved.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics'],
                explanation:
                  'Content category distribution is a behavioral descriptor, not a causal test. Knowing that users in the improved recommendations group watch more cooking videos does not confirm that recommendation quality improved or that it causes DAU growth.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Now compare the three experiments. Which lever\'s mechanism compounds most at scale?',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text:
              'After running clean mechanism tests for all three levers, which result would most justify going deep with 10x investment?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['prioritization', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Recommendations showing a 15% session-frequency increase in 30-60 day users with no acquisition boost. This mechanism is compounding: better recommendations increase sessions, sessions increase the behavioral data that trains the model, and the model improves recommendations further, creating a self-reinforcing loop that acquisition spend cannot replicate.',
                quality: 'best',
                points: 3,
                competencies: ['prioritization', 'strategic_thinking'],
                explanation:
                  'The recommendations mechanism creates a data flywheel. Each additional session generates signal that improves the next recommendation, which generates more sessions. Acquisition and creator tools do not have this self-reinforcing property at the model level.',
              },
              {
                option_label: 'B',
                option_text:
                  'Creator tools showing a 30% increase in weekly video uploads from existing creators in the treated group. More content means more recommendation surface area, which indirectly improves both DAU and acquisition.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['prioritization'],
                explanation:
                  'Creator tool impact on supply is real, but it is an indirect DAU lever. More content does not help DAU if the recommendation model cannot surface the right content to the right user. The mechanism depends on recommendations being effective first.',
              },
              {
                option_label: 'C',
                option_text:
                  'User acquisition showing a 25% lower CAC in new demographic segments with equal 30-day retention to existing cohorts.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics'],
                explanation:
                  'Lower CAC is a good result, but acquisition is a linear lever. Each new user costs money to acquire and the mechanism does not improve with scale. Recommendations and creator tools both have flywheel properties that acquisition does not.',
              },
              {
                option_label: 'D',
                option_text:
                  'Any lever that shows statistically significant DAU lift at p < 0.05 in a 30-day window should be prioritized regardless of mechanism.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['experimental_design'],
                explanation:
                  'Statistical significance confirms the signal is real, not that the mechanism scales. A statistically significant 1% DAU lift from acquisition might cost 10x more to sustain than a 1% lift from recommendations, which improves for free as the model learns.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'Make the call. Which lever, what is the success threshold, and when do you stop the experiment?',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text:
              'Based on the experiment results, what is the decision rule for committing to the recommendations lever at full investment?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['decision_making', 'metrics'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Commit if: 14-day session frequency in the treatment group is at least 10% above baseline, the effect is consistent across the 25th-75th percentile of users (not just power users), and the model\'s training data quality metric improves by at least 5%, confirming the flywheel is closing.',
                quality: 'best',
                points: 3,
                competencies: ['decision_making', 'metrics'],
                explanation:
                  'Three conditions prevent false positives: the frequency threshold confirms engagement depth, the percentile consistency check ensures it is not driven by power users who would engage regardless, and the model quality metric confirms the flywheel is actually closing, not just producing more of the same recommendations.',
              },
              {
                option_label: 'B',
                option_text:
                  'Commit if the recommendations experiment shows a statistically significant DAU lift above 5% in the treatment group at the end of the 30-day window.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics'],
                explanation:
                  'A single DAU threshold commits the team based on an output metric without confirming the mechanism is working. A 5% DAU lift that came from power users and did not improve model quality would not sustain at 10x investment.',
              },
              {
                option_label: 'C',
                option_text:
                  'Commit if the recommendations experiment beats both the creator tools and acquisition experiments on DAU lift in the same 30-day window.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['decision_making'],
                explanation:
                  'Comparing DAU lift across three different mechanisms is the mistake the framing step identified. A smaller DAU lift from a compounding mechanism is more valuable than a larger lift from a linear one. Winning the comparison does not confirm the investment is correct.',
              },
              {
                option_label: 'D',
                option_text:
                  'Commit if the product and data science teams both agree the experiment results are promising and the mechanism is theoretically sound.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['decision_making'],
                explanation:
                  'Team agreement is a governance step, not a decision rule. Without a quantitative threshold, "promising" is ambiguous enough to justify committing to any experiment with positive directional results, which is not a crisp call.',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'hp-tiktok-shop-creator-ads',
    title: 'TikTok Shop Creator Ad Cross-Sell',
    scenario_role: 'tech lead',
    scenario_context:
      'TikTok Shop has grown rapidly through creator-led product videos, but most creators earning through affiliate commissions have never used TikTok\'s paid advertising tools. The ads team sees an opportunity to convert Shop creators into ad buyers by showing them how paid promotion amplifies their affiliate revenue. The challenge is that creators think of themselves as content people, not advertisers, and the ad platform feels foreign to their mental model.',
    scenario_trigger:
      'The Shop monetization team asks you to design the cross-sell motion before the Q2 creator summit.',
    scenario_question:
      'How would you cross-sell ads on TikTok Shop for creators?',
    engineer_standout:
      'Identify the moment in the creator workflow where the ROI case for ads is most obvious and the friction to purchase is lowest. That is where the cross-sell belongs, not in a separate ad portal.',
    paradigm: 'ai_native',
    industry: 'social_media',
    sub_vertical: 'creator_economy',
    difficulty: 'standard',
    estimated_minutes: 18,
    primary_competencies: ['go_to_market', 'product_design'],
    secondary_competencies: ['user_empathy', 'business_model'],
    frameworks: ['Jobs to be Done', 'Customer Journey Mapping'],
    relevant_roles: ['tech_lead', 'founding_engineer', 'staff_engineer'],
    company_tags: ['TikTok'],
    tags: ['ads', 'creators', 'TikTok_Shop', 'monetization', 'cross_sell'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'Why do creators with strong affiliate earnings not already use paid ads?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text:
              'What is the real reason high-earning TikTok Shop creators do not use paid ads despite the obvious ROI potential?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['user_empathy', 'go_to_market'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'The ad platform requires creators to think in CPM, targeting parameters, and budget optimization, which maps to an advertiser mental model rather than a creator mental model. Creators think in views and commission, so the translation cost is too high to start even when the ROI is clear in retrospect.',
                quality: 'best',
                points: 3,
                competencies: ['user_empathy', 'go_to_market'],
                explanation:
                  'Mental model mismatch is the upstream barrier. The ad platform speaks a different language than the creator workflow, and the cross-sell will fail if it drops creators into the same interface that confused them before. The fix is meeting them in their language.',
              },
              {
                option_label: 'B',
                option_text:
                  'Creators are risk-averse about spending money on ads because they have seen peers waste budgets on campaigns that did not convert.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['user_empathy'],
                explanation:
                  'Risk aversion is real, but it is downstream of the mental model problem. Creators who understood how ad spend maps to affiliate commission would take on calculated risk. The uncertainty about ROI is itself caused by the language barrier between ad and creator platforms.',
              },
              {
                option_label: 'C',
                option_text:
                  'The minimum ad spend threshold on TikTok is too high for smaller creators who are just starting to earn affiliate commissions.',
                quality: 'surface',
                points: 1,
                competencies: ['business_model'],
                explanation:
                  'Minimum spend is a feature parameter that can be adjusted, not the upstream blocker. Even at zero minimum, creators who do not understand what they are buying will not spend. The problem is comprehension, not threshold.',
              },
              {
                option_label: 'D',
                option_text:
                  'TikTok has not invested in creator education programs that explain how ads work, so most creators simply do not know the option exists.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['go_to_market'],
                explanation:
                  'Awareness is not the gap for creators earning meaningful affiliate income. They know ads exist. The problem is that the ad platform does not connect to how they think about their business, making the purchase decision feel opaque rather than obvious.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'Map the creator journey and find the three moments where ad ROI is visible and friction is lowest.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text:
              'Where in the creator workflow does the ROI case for ads become undeniable?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['go_to_market', 'product_design'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'The post-viral moment: when a video crosses 500K views organically and the Shop analytics tab shows a spike in affiliate click-through. The creator can see which video is converting. Showing "boost this video to 2M views for an estimated $X commission increase" in that specific context makes the ROI immediate and legible without requiring the creator to learn ad terminology.',
                quality: 'best',
                points: 3,
                competencies: ['go_to_market', 'product_design'],
                explanation:
                  'The post-viral moment is the highest-intent state in the creator workflow. The creator already knows the video converts. The ad decision reduces to a single question: spend X to see if the commission scales proportionally. That is a creator-language ROI case.',
              },
              {
                option_label: 'B',
                option_text:
                  'During account setup, when creators add their first affiliate link, surface a prompt explaining that paid promotion can accelerate earnings.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['go_to_market'],
                explanation:
                  'New creators with no commission history have no evidence that their content converts, so the ad ROI case is entirely hypothetical. Cross-selling at setup is premature and will be ignored or create skepticism.',
              },
              {
                option_label: 'C',
                option_text:
                  'In the weekly earnings summary email, when creators see their top-earning products, surface a "promote your best sellers" link to the ad platform.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['go_to_market'],
                explanation:
                  'Earnings summary is a moment of financial awareness, which is better than cold outreach. The gap is that an email link to the ad platform still drops the creator into advertiser language rather than creator language, maintaining the mental model friction.',
              },
              {
                option_label: 'D',
                option_text:
                  'On a dedicated "Grow Your Shop" page in the creator portal that explains ad products in simple terms alongside case studies from similar creators.',
                quality: 'surface',
                points: 1,
                competencies: ['go_to_market'],
                explanation:
                  'Educational content is useful but passive. A creator who is not in a high-intent state will not navigate to a "Grow Your Shop" page. The cross-sell needs to be embedded in the workflow where the intent already exists.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'The post-viral boost prompt requires a product decision. What are you optimizing for and what breaks?',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text:
              'If the cross-sell is a contextual boost prompt at the post-viral moment, what is the critical design decision and what does it trade off?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['product_design', 'user_empathy'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'The critical decision is whether to show the estimated commission increase rather than standard ad metrics like CPM or reach. Optimizing for creator comprehension means hiding ad terminology entirely. The trade-off is that creators will not learn the ad platform, making re-purchase dependent on TikTok always abstracting the mechanics.',
                quality: 'best',
                points: 3,
                competencies: ['product_design', 'user_empathy'],
                explanation:
                  'The commission-first abstraction is the right call for first purchase, but it creates a dependency: creators who never see CPM or reach cannot make independent ad decisions later. The trade-off is first-purchase conversion versus long-term creator sophistication.',
              },
              {
                option_label: 'B',
                option_text:
                  'The critical decision is setting the minimum boost budget. Too high and creators will not try it; too low and the conversion impact is too small to prove the ROI.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['business_model'],
                explanation:
                  'Budget threshold is a real parameter, but it is secondary to the design question of what the creator sees and understands when they make the first purchase. Getting the comprehension layer right matters more than finding the right minimum.',
              },
              {
                option_label: 'C',
                option_text:
                  'The critical decision is which creators qualify for the boost prompt, so it only appears for creators with proven conversion history rather than all creators.',
                quality: 'surface',
                points: 1,
                competencies: ['go_to_market'],
                explanation:
                  'Eligibility filtering is a segmentation decision, not the core design decision. Showing the right creators the prompt matters less than what the prompt says and how it frames the ROI case.',
              },
              {
                option_label: 'D',
                option_text:
                  'There is no real trade-off. Showing estimated commission increases is strictly better than showing CPM, and TikTok can always educate creators on ad metrics after they have started spending.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_design'],
                explanation:
                  'The trade-off is real. Abstracting ad mechanics produces compliant first purchases but not informed repeat buyers. Creators who cannot interpret ad performance will blame TikTok when campaigns underperform, increasing churn and support costs.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'Make the final call on the cross-sell design and define what success looks like at 90 days.',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text:
              'What is the 90-day success condition for the cross-sell program, and what would trigger a redesign?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['metrics', 'decision_making'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Success: at least 20% of eligible creators (those shown the boost prompt) make a first purchase, and at least 40% of first purchasers run a second campaign within 60 days without a prompt. Redesign trigger: first purchase rate is above 20% but repeat rate is below 20%, which indicates the first purchase delivered a poor experience rather than a genuine ROI win.',
                quality: 'best',
                points: 3,
                competencies: ['metrics', 'decision_making'],
                explanation:
                  'Two conditions prevent gaming: the first purchase rate measures whether the cross-sell is compelling, and the unprompted repeat rate measures whether it delivered real value. A high first rate with low repeat rate is a red flag that the prompt was persuasive but the experience was not.',
              },
              {
                option_label: 'B',
                option_text:
                  'Success: total Shop ad revenue increases by 30% within 90 days of launching the cross-sell program.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['metrics'],
                explanation:
                  'Total ad revenue is influenced by too many variables over 90 days to attribute to the cross-sell specifically. Seasonal sales cycles, algorithm changes, and other campaigns all affect the metric. Attribution is impossible at this level of aggregation.',
              },
              {
                option_label: 'C',
                option_text:
                  'Success: prompt click-through rate exceeds 15% and average first-campaign spend is above $50.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics'],
                explanation:
                  'Click-through and spend measure top-of-funnel engagement, not whether the cross-sell created durable advertiser behavior. A creator who clicks and spends $50 once has contributed revenue but has not been converted into an ongoing ad buyer.',
              },
              {
                option_label: 'D',
                option_text:
                  'Success: creator NPS among first-time ad buyers is above 50 at the 30-day mark after their first campaign.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['metrics'],
                explanation:
                  'NPS measures sentiment, which correlates with repeat purchase but does not guarantee it. A creator who rates the experience highly but does not run a second campaign has not been converted. Behavioral repeat purchase is a harder and more meaningful bar.',
              },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'hp-netflix-podcast-product',
    title: 'Building a Podcast Product for Netflix',
    scenario_role: 'founding engineer',
    scenario_context:
      'Netflix is exploring adjacent audio content after observing that 40% of podcast listeners also subscribe to streaming video services and that several top-tier podcasters have adapted their content into documentary series. The business case for podcasts as a content format is unproven inside Netflix, but the opportunity to extend existing IP, deepen creator relationships, and capture listening hours that currently go to Spotify and Apple Podcasts is real.',
    scenario_trigger:
      'The emerging formats team asks you to scope a podcast product before a board presentation on adjacent content strategy.',
    scenario_question:
      'Build a podcast product for Netflix.',
    engineer_standout:
      'Identify which Netflix asset, whether IP, creator relationships, recommendation engine, or subscriber base, is the actual unfair advantage in the podcast market and design around that rather than building a generic audio app.',
    paradigm: 'traditional',
    industry: 'media',
    sub_vertical: 'streaming_entertainment',
    difficulty: 'advanced',
    estimated_minutes: 22,
    primary_competencies: ['product_design', 'strategic_thinking'],
    secondary_competencies: ['user_empathy', 'go_to_market'],
    frameworks: ['Jobs to be Done', 'Value Chain Analysis'],
    relevant_roles: ['founding_engineer', 'tech_lead', 'staff_engineer'],
    company_tags: ['Netflix'],
    tags: ['podcasts', 'audio', 'product_design', 'adjacent_markets', 'streaming'],
    is_published: true as const,
    is_calibration: false as const,
    is_premium: false as const,
    steps: [
      {
        step: 'frame' as const,
        step_nudge: 'Why would someone listen to a Netflix podcast instead of Spotify or Apple Podcasts?',
        grading_weight: 25,
        step_order: 1,
        questions: [
          {
            question_text:
              'What is the real question Netflix must answer before building any podcast product?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['strategic_thinking', 'product_design'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'What job does a Netflix podcast do that Spotify and Apple Podcasts cannot, given that both platforms are free, have broader catalogs, and have years of audience behavior data? Without a defensible answer, Netflix is building a worse version of an existing product.',
                quality: 'best',
                points: 3,
                competencies: ['strategic_thinking', 'product_design'],
                explanation:
                  'Competitive positioning is the upstream question. Netflix enters a mature market with entrenched free alternatives. The only defensible positions are differentiated content (Netflix IP), differentiated discovery (recommendation engine), or a differentiated business model (bundled with subscription).',
              },
              {
                option_label: 'B',
                option_text:
                  'Whether Netflix has the technical infrastructure to transcode and serve audio files at scale without degrading video streaming performance.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['technical_strategy'],
                explanation:
                  'Infrastructure is a solvable engineering problem, not the strategic constraint. Netflix already serves 250M+ subscribers globally; adding audio files is not the bottleneck. The strategic question is why users would come to Netflix for audio at all.',
              },
              {
                option_label: 'C',
                option_text:
                  'How many podcasts Netflix would need to license in year one to create a catalog that attracts listeners away from Spotify.',
                quality: 'surface',
                points: 1,
                competencies: ['go_to_market'],
                explanation:
                  'Catalog size is a downstream decision that follows from the strategic positioning. If Netflix\'s advantage is IP-based rather than catalog breadth, a small catalog of Netflix-exclusive podcasts may be the right call rather than competing on scale.',
              },
              {
                option_label: 'D',
                option_text:
                  'Whether podcast listeners overlap sufficiently with Netflix subscribers to justify the investment without needing to acquire new users.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['market_sizing'],
                explanation:
                  'Overlap analysis is useful for validating the opportunity size but does not answer what the product should do or why it is better than alternatives. The strategic question precedes the market sizing.',
              },
            ],
          },
        ],
      },
      {
        step: 'list' as const,
        step_nudge: 'Name three structurally distinct approaches. Each should use a different Netflix asset as the foundation.',
        grading_weight: 25,
        step_order: 2,
        questions: [
          {
            question_text:
              'Which three distinct podcast product strategies map to Netflix\'s actual assets?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['product_design', 'strategic_thinking'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'IP Extension (podcast episodes set in the worlds of existing Netflix shows, using original voice actors), Creator Bridge (podcast-to-series pipeline where successful podcasters get Netflix development deals), and Recommendation-Led Discovery (a podcast tab that surfaces audio using Netflix\'s watch-history model to recommend content users will actually finish).',
                quality: 'best',
                points: 3,
                competencies: ['product_design', 'strategic_thinking'],
                explanation:
                  'Each strategy uses a distinct Netflix asset: existing IP, creator relationships, and the recommendation engine. None of these strategies is available to Spotify or Apple Podcasts, which makes them genuinely differentiated rather than catalog competition.',
              },
              {
                option_label: 'B',
                option_text:
                  'Launch a free ad-supported podcast tier, a premium podcast tier bundled with the existing subscription, and an original podcast studio that produces exclusive content.',
                quality: 'surface',
                points: 1,
                competencies: ['business_model'],
                explanation:
                  'This is a monetization and content strategy, not a product strategy grounded in Netflix\'s specific assets. Spotify already offers all three of these structures. The differentiation question remains unanswered.',
              },
              {
                option_label: 'C',
                option_text:
                  'Acquire a mid-tier podcast platform to get existing catalog and audience, build Netflix Original podcasts with A-list talent, and add a social layer where subscribers can comment and react to episodes.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['strategic_thinking'],
                explanation:
                  'Acquisition provides catalog speed, original content is a real Netflix strength, but the social layer is unproven on Netflix and does not connect to any existing Netflix asset. The strategy is partially grounded but partially generic.',
              },
              {
                option_label: 'D',
                option_text:
                  'Build a general-purpose podcast app with a curated editorial team, competitive licensing deals, and offline listening features to compete directly with Spotify on product quality.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_design'],
                explanation:
                  'Head-to-head competition with Spotify on general catalog and product features requires years of catch-up investment and offers no advantage rooted in what Netflix already has. This strategy has a high probability of producing an underused feature rather than a differentiated product.',
              },
            ],
          },
        ],
      },
      {
        step: 'optimize' as const,
        step_nudge: 'Pick the strongest strategy and name what it optimizes for and what it gives up explicitly.',
        grading_weight: 25,
        step_order: 3,
        questions: [
          {
            question_text:
              'If Netflix bets on IP Extension as the primary strategy, what does it optimize for and what does it explicitly give up?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['product_design', 'prioritization'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Optimizing for subscriber retention and IP lifetime value: existing fans get more world-building from shows they already love, which deepens engagement with the Netflix catalog. The explicit sacrifice is new user acquisition through podcasts, since IP Extension only attracts people who already know the shows. Non-subscribers will not download the app for podcast content they have not seen the source material for.',
                quality: 'best',
                points: 3,
                competencies: ['product_design', 'prioritization'],
                explanation:
                  'IP Extension is a depth strategy, not a breadth strategy. Naming the acquisition sacrifice makes the bet crisp: it works for subscriber retention but does not bring new audiences to Netflix. Teams planning around it need to know it is not a growth lever.',
              },
              {
                option_label: 'B',
                option_text:
                  'Optimizing for content quality and premium positioning, since IP extensions using original voice actors will be more polished than typical podcasts. The sacrifice is speed, since licensing voice actor contracts for podcast use will take longer than launching a general platform.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['prioritization'],
                explanation:
                  'Quality and speed are real considerations, but the more fundamental trade-off is the strategic one: this strategy does not expand the subscriber base and locks the product\'s success to the health of Netflix\'s existing IP portfolio.',
              },
              {
                option_label: 'C',
                option_text:
                  'Optimizing for content catalog volume so that listeners have enough variety to make it worth opening the Netflix audio app instead of Spotify.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['product_design'],
                explanation:
                  'IP Extension is the opposite of a catalog volume strategy. It is a focused, high-quality bet on existing worlds, not a catalog breadth play. Confusing the two misidentifies what the strategy is.',
              },
              {
                option_label: 'D',
                option_text:
                  'Optimizing for podcast listening hours as a new engagement metric, with no meaningful sacrifice since audio does not compete with video for the same device time.',
                quality: 'surface',
                points: 1,
                competencies: ['metrics'],
                explanation:
                  'Claiming there is no meaningful sacrifice is the same as not making a choice. Every strategy has opportunity costs. If IP Extension is the primary bet, resources going there are not going to Creator Bridge or Recommendation-Led Discovery, both of which have different strategic returns.',
              },
            ],
          },
        ],
      },
      {
        step: 'win' as const,
        step_nudge: 'Make a crisp launch decision: what ships first and how do you know the bet is working?',
        grading_weight: 25,
        step_order: 4,
        questions: [
          {
            question_text:
              'What is the first IP Extension product that ships and what is the 90-day success condition?',
            question_nudge: null,
            sequence: 1,
            grading_weight_within_step: 100,
            target_competencies: ['decision_making', 'metrics'],
            response_type: 'mcq_plus_elaboration' as const,
            options: [
              {
                option_label: 'A',
                option_text:
                  'Ship a 6-episode companion podcast for one returning Netflix series using original cast. Success at 90 days: at least 15% of users who watched the source series listen to at least two episodes, and 30-day retention for that listener cohort exceeds the platform average for the same show\'s viewership. If retention holds, the IP loop is working.',
                quality: 'best',
                points: 3,
                competencies: ['decision_making', 'metrics'],
                explanation:
                  'Starting with one series limits scope and creates a clean test. The 15% penetration rate measures whether existing fans find the companion content compelling, and the retention comparison confirms whether audio deepens engagement rather than just adding a one-time listen.',
              },
              {
                option_label: 'B',
                option_text:
                  'Launch companion podcasts for the top 10 Netflix originals simultaneously to maximize initial catalog and give the product team enough data to identify which IP categories work best.',
                quality: 'plausible_wrong',
                points: 0,
                competencies: ['decision_making'],
                explanation:
                  'Ten simultaneous launches multiplies production complexity and makes it impossible to isolate what works. A clean first test requires one controlled launch that generates interpretable signal before scaling.',
              },
              {
                option_label: 'C',
                option_text:
                  'Launch a podcast discovery tab in the Netflix app first, without IP content, to measure baseline audio engagement before investing in original companion podcasts.',
                quality: 'surface',
                points: 1,
                competencies: ['decision_making'],
                explanation:
                  'A discovery tab with no differentiated content does not test the IP Extension strategy; it tests whether users will use a generic podcast tab. Measuring engagement on a tab filled with third-party podcasts does not predict whether IP companion content would work.',
              },
              {
                option_label: 'D',
                option_text:
                  'Ship the podcast feature in beta for 60 days and collect qualitative feedback before setting quantitative success thresholds.',
                quality: 'good_but_incomplete',
                points: 2,
                competencies: ['decision_making'],
                explanation:
                  'Qualitative feedback is valuable, but entering a 60-day beta without success thresholds makes the decision to continue or stop ambiguous. The team needs a quantitative gate, not just sentiment, to make a credible case at the 90-day board review.',
              },
            ],
          },
        ],
      },
    ],
  },
]
