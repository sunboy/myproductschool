-- Migration 057: Uber Eats autopsy seed
-- Source: product-autopsy-ubereats.html
-- Story: ubereats-decoded — 9 AARRR stages following Priya from first order to embedded ecosystem user

-- PRODUCT ROW
INSERT INTO autopsy_products (slug, name, tagline, logo_emoji, cover_color, industry, paradigm, decision_count, is_published, sort_order)
VALUES (
  'ubereats',
  'Uber Eats',
  'Follow one user from a hungry Tuesday night to a twice-a-week habit — and see the product machine running behind every moment',
  '🍔',
  '#06C167',
  'Food Delivery',
  'Three-Sided Marketplace',
  0,
  true,
  19
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  logo_emoji = EXCLUDED.logo_emoji,
  cover_color = EXCLUDED.cover_color,
  industry = EXCLUDED.industry,
  paradigm = EXCLUDED.paradigm,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order;

-- STORY ROW
INSERT INTO autopsy_stories (product_id, slug, title, read_time, sections)
SELECT
  p.id,
  'ubereats-decoded',
  'Uber Eats, Decoded',
  20,
  '[
    {
      "id": "hero",
      "layout": "aarrr_hero",
      "content": {
        "product_name": "Uber Eats",
        "tagline": "Follow one user from a hungry Tuesday night to a twice-a-week habit — and see the product machine running behind every moment",
        "meta": "Product Autopsy · 9 Stages · ~20 min read",
        "accent_color": "#06C167"
      }
    },
    {
      "id": "acquisition",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 1,
        "stage_name": "Acquisition",
        "question": "Where do they come from — and at what cost?",
        "narrative_paragraphs": [
          "Priya did not wake up thinking about Uber Eats. She was scrolling TikTok during a break, half-watching someone unbox a sushi delivery. Fifteen seconds. A green logo. A caption: <strong>\"First order free delivery + $25 off.\"</strong>",
          "She almost scrolled past. But the ad was hyper-targeted — female, 25–34, urban, food-content affinity, no competitor app installed — and the creative hit at exactly the right moment: she was already hungry, already tired, already thinking about food. She tapped.",
          "That single tap cost Uber Eats about $32 in ad spend. And she had not ordered anything yet. Most people who get to the home screen never place an order. The acquisition funnel leaks at every step: roughly 3.5% of ad impressions become app installs, and only 35% of those installs convert to a first order.",
          "Uber Eats compounds acquisition from a uniquely powerful asset: 150 million monthly active Uber riders globally. Riders who open the Uber app for a car are one tap away from ordering food — same account, same saved payment, same address. This cross-sell funnel converts at 3–5x the rate of cold paid traffic because trust is already established. That ride network is a structural advantage DoorDash cannot replicate.",
          "The organic channel is equally critical. Priya had seen the green logo before — in coworkers'' Instagram stories, in office Slack channels, in a referral text from a friend. Multiple low-cost touches over weeks made the paid ad feel like a confirmation rather than an introduction. <strong>The paid dollar closes the deal; the organic impressions make it cheap.</strong>",
          "Organic CAC runs around $12. Paid CAC in dense markets like New York City exceeds $40. The blended number matters most, and the ratio between organic and paid determines whether the unit economics hold. When paid spend grows faster than organic, CAC inflation precedes every other warning sign by quarters."
        ],
        "metrics": [
          {"value": "$12", "label": "Organic CAC"},
          {"value": "$40+", "label": "Paid CAC (NYC)"},
          {"value": "~35%", "label": "Install to First Order"}
        ],
        "war_room": [
          {"role": "PM", "insight": "\"Should we show estimated total on the restaurant card — before they tap in?\" Testing showed fewer clicks but 40% higher checkout completion. Net revenue went up. Honest pricing loses browsers but converts buyers."},
          {"role": "ENG", "insight": "Attribution pipeline is the single most revenue-critical system. UTM params, deep links, AppsFlyer install attribution, promo code redemption tracking. If this breaks, marketing spends millions blind — and nobody notices for days."},
          {"role": "DATA", "insight": "Building the channel mix model: what is the marginal CAC per channel? When does the next dollar in TikTok ads stop returning value? The model must account for organic cannibalization — paid ads that take credit for users who would have come anyway."},
          {"role": "DESIGN", "insight": "The address entry screen kills 15–20% of signups. GPS is not precise enough for apartments. The team is iterating on a map-pin-drag feature with fuzzy address matching and saved-address prompts."}
        ],
        "go_deeper": {
          "metric_definitions": [
            {"metric": "CAC", "definition": "Total cost to acquire one paying customer across all channels", "how_to_calculate": "Total marketing spend ÷ New customers acquired", "healthy_range": "$15–50 for consumer apps; organic should subsidize paid"},
            {"metric": "Blended CAC", "definition": "Average CAC across all channels — the number that actually determines unit economics", "how_to_calculate": "All channel spend ÷ Total new customers acquired", "healthy_range": "Organic share above 50% keeps blended CAC defensible"},
            {"metric": "Organic / Direct Share", "definition": "Percentage of new users from non-paid channels — measures brand moat strength", "how_to_calculate": "Organic users ÷ Total new users × 100", "healthy_range": ">50% = brand moat; <30% = dangerous paid dependency"},
            {"metric": "Install-to-First-Order Rate", "definition": "Percentage of app installs that convert to at least one completed order", "how_to_calculate": "First-order completions ÷ App installs × 100", "healthy_range": "30–40% is strong for food delivery; below 25% means the onboarding is leaking"}
          ],
          "system_design": {
            "components": [
              {"component": "Surge Pricing Engine", "what_it_does": "Dynamically adjusts delivery fees based on real-time demand, courier supply, and weather conditions", "key_technologies": "High surge at the moment of a first-time user''s acquisition is a permanent churn risk before the relationship starts. The product decision is whether to suppress surge for first-session users entirely."},
              {"component": "Restaurant Catalog and Onboarding Pipeline", "what_it_does": "Ingests restaurant menus, hours, and photos; manages contract terms and commission tiers for new restaurant partners", "key_technologies": "Catalog depth in a new market determines whether Uber Eats can satisfy any craving a first-session user has. Thin catalogs are a first-impression failure that paid acquisition spend cannot fix."},
              {"component": "Uber Rides Cross-Sell Funnel", "what_it_does": "Surfaces Uber Eats to existing Uber ride users via in-app prompts, post-ride notifications, and the shared Uber One subscription offer", "key_technologies": "This funnel converts at 3–5x the rate of cold paid traffic because Uber already has the user''s identity, payment method, and home address. The product question is how aggressively to surface Eats without degrading the rides experience."}
            ],
            "links": [
              {"tag": "Strategy", "label": "Three-Sided Marketplace Sequencing: Supply Before Demand"},
              {"tag": "Metric", "label": "CAC Payback Period and LTV:CAC Ratio"},
              {"tag": "System Design", "label": "Attribution Pipeline: From Ad Click to First Order"}
            ]
          },
          "failures": [
            {"name": "UberFresh Grocery Abandonment (2015)", "what": "Uber launched UberFresh as a grocery and fresh food delivery pilot before pivoting to restaurant delivery as UberEATS. The grocery model had poor unit economics due to high picker labor costs, wide SKU variability, and long average delivery times. The pivot away from grocery left the space open for Instacart, which built a defensible moat. Years later, Uber re-entered grocery through expensive acquisitions.", "lesson": "Pivoting away from a vertical with poor immediate unit economics cedes long-term strategic territory to competitors who find the model. What looks like an unattractive market early in its development often requires infrastructure investment before profitability — exiting early forfeits the learning and network effects that eventually make the model work."},
            {"name": "Slow City Expansion via Driver Pool Cannibalization (2016)", "what": "UberEATS launched across new cities by recruiting drivers from the Uber ride-sharing pool to also take delivery shifts. In cities with tight driver supply, this created conflict between Uber ride and delivery demand, degrading both products simultaneously. Cities where driver supply was constrained saw 30–50 minute delivery times that generated significant negative press and early churn among acquired users.", "lesson": "Two-sided marketplace expansion into new cities requires separate driver acquisition for delivery, not driver pool cannibalization from rides. Treating the same supply pool as fungible for two different product types in constrained supply markets degrades both simultaneously."},
            {"name": "Restaurant Density Problem in Small Market Launches (2017)", "what": "UberEATS expanded aggressively into suburban and small markets where restaurant density was insufficient to support on-demand delivery economics. In markets with fewer than 200 active restaurant partners, selection was too narrow to drive return usage. Marketing spend to acquire users in these markets was wasted because the product experience was below the viability threshold.", "lesson": "Food delivery marketplace launch requires a minimum restaurant density threshold — typically 200 or more active partners in a delivery zone — before user acquisition investment is made. Acquiring users into a thin marketplace creates first-impression failures that prevent the return visits needed to recoup CAC."}
          ],
          "do_dont": {
            "dos": [
              "Suppress surge pricing for first-time users on their first order — the LTV of a converted user far exceeds one waived surge increment",
              "Launch new markets only after securing anchor restaurant brands users already recognize; a McDonald''s and a top local pizza chain signal catalog legitimacy immediately",
              "Use geographic density of existing Uber ride users as the primary signal for where to invest acquisition spend — ride users convert to Eats at 3–5x the rate of cold traffic",
              "Show estimated delivery time prominently before users add a single item to cart; ETA is the primary acquisition-stage conversion driver ahead of price",
              "Structure the Uber One introductory offer as a free trial triggered at the moment a new user sees a high delivery fee — convert the pain point into a subscription moment"
            ],
            "donts": [
              "Do not launch a market without a minimum density of couriers already onboarded — a beautiful catalog that delivers in 90 minutes destroys the brand permanently with that user",
              "Do not show restaurant ads or sponsored placements to first-time users before they have completed an order — monetization pressure at acquisition degrades trust",
              "Do not rely on discount codes alone as an acquisition lever; price-sensitive users acquired on discounts churn the moment the discount expires",
              "Do not onboard restaurants with incomplete menus or missing photos just to inflate catalog numbers — a bad restaurant experience in the first order is fatal to retention",
              "Do not apply the same surge pricing logic to acquisition channels as you do to organic returning users — context of the user''s relationship with the product must modulate the pricing signal"
            ]
          }
        },
        "practice_prompts": {
          "on_the_job": {
            "question": "You are the PM for Uber Eats market expansion in Phoenix, AZ. After 60 days post-launch, Week-1 retention (users who order again within 7 days of first order) is 18%, versus a 32% benchmark in mature markets. Your data shows average delivery time in Phoenix is 47 minutes versus 28 minutes in Chicago. What do you do?",
            "guidance": "Decompose the retention gap into supply-side versus demand-side causes. A 47-minute average suggests courier supply is the constraint, not catalog quality or pricing. Prioritize courier acquisition incentives before spending more on user acquisition — adding users to a broken supply side worsens the experience for everyone. Look at time-of-day delivery distribution: if 47 minutes is driven by lunch and dinner peaks, targeted courier bonuses during those windows may close the gap faster than broad incentives.",
            "hint": "Courier supply density is the root cause of both slow delivery times and poor retention in new markets. Acquisition spend on users before fixing supply creates a permanently damaged first impression. The three-sided marketplace means you must sequence investment: supply before demand."
          },
          "interview_prep": {
            "question": "Design the acquisition strategy for Uber Eats entering a new city where DoorDash has 60% market share and has been operating for three years. You have a $2M marketing budget and 6 months to achieve meaningful share.",
            "guidance": "Three-sided marketplace entry requires sequencing: first secure supply by signing the best 50 restaurants with better commission terms for the first 6 months; second, recruit couriers with aggressive sign-on bonuses and guaranteed hourly minimums; third, only after supply is strong enough to deliver fast, invest in consumer promotions. Budget allocation: 40% restaurant supply, 30% driver guarantees, 30% consumer.",
            "hint": "Tests whether you understand three-sided marketplace sequencing. Strong candidates recognize that consumer acquisition without adequate supply creates negative first impressions that are hard to reverse."
          }
        },
        "transition": {
          "text": "Priya has the app open. She is browsing Siam Kitchen''s menu. She adds pad thai and spring rolls to her cart. ↓"
        }
      }
    },
    {
      "id": "activation",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 2,
        "stage_name": "Activation",
        "question": "Did the product actually deliver for them?",
        "narrative_paragraphs": [
          "Priya hits Place Order at 7:24 PM. The app says 30–38 minutes. She puts on sweatpants, opens Netflix, and waits. At 7:52 PM — twenty-eight minutes — her phone buzzes. Marcus is arriving. She opens the door. The bag is warm. The pad thai is exactly right. She did not have to talk to anyone, wait in line, or drive in the rain.",
          "She rates it 5 stars without thinking. <em>That</em> is activation. Not the signup. Not the download. The moment Uber Eats actually delivered on its promise.",
          "But this delivery was not an accident. Behind the scenes, Uber Eats pulled three levers specifically because this was Priya''s first order. <strong>Priority dispatch:</strong> first orders are system-flagged. The algorithm did not assign the nearest available driver — it assigned Marcus, an experienced partner with a 4.95 rating and 2,340 deliveries. The system traded efficiency for reliability because a bad first experience kills lifetime value permanently.",
          "<strong>Padded ETA:</strong> the real estimate was 25 minutes. The app said 30–38. Priya expected to wait. When food arrived in 28, it felt early. That 2-minute surprise was engineered — a first-order coefficient in the ETA model that under-promises by 5–10 minutes for new users specifically.",
          "<strong>Proactive recovery standing by:</strong> if Marcus had been delayed, a pre-written notification was ready to fire — \"Your order is taking longer than expected — here is $5 off your next order.\" It did not need to send tonight. But it was loaded and waiting.",
          "Right after her 5-star rating, Priya saw a push notification prompt. Not at app open — not before she had experienced value — but at the exact moment she was happiest. 72% of users opt in when asked after a 5-star rating, versus 45% at app open. She tapped Allow. She also saved her address and payment. Users who complete all three within 48 hours retain at 3x the rate of those who do not."
        ],
        "metrics": [
          {"value": "72%", "label": "Push Opt-In After 5-Star Rating"},
          {"value": "3×", "label": "Retention Lift (48hr Setup)"},
          {"value": "~90%", "label": "First-Order On-Time Target"}
        ],
        "war_room": [
          {"role": "ENG", "insight": "The DeepETA model — gradient-boosted decision tree regression running on the Michelangelo ML platform. 26% improvement in delivery time prediction. The first-order coefficient pads estimates for new users. Getting this wrong by 2 minutes is a product failure with measurable retention consequences."},
          {"role": "PM", "insight": "\"First-delivery reliability is an SLA, not a metric.\" If on-time rate drops below 90% for first orders, 30-day retention drops proportionally. PM tracks this daily and escalates faster than any revenue metric on the dashboard."},
          {"role": "DATA", "insight": "Running the notification prompt timing experiment. Three variants: at app open (45% opt-in), after delivery (65%), after 5-star rating (72%). The winning variant triggers on a rating action, not a session state. Emotional context outperforms logical timing."},
          {"role": "OPS", "insight": "Driver quality matching for first orders. The dispatch algorithm now weights partner rating and experience, not just proximity, for flagged first-order deliveries. Trade-off: slightly longer ETAs in some cases, but dramatically better first impressions."}
        ],
        "go_deeper": {
          "metric_definitions": [
            {"metric": "Activation Rate", "definition": "Percentage of signed-up users who complete their first meaningful action — in this case, a delivered order", "how_to_calculate": "Activated users ÷ New signups × 100", "healthy_range": "20–40% for consumer marketplaces; varies by onboarding quality"},
            {"metric": "Time-to-Value (TTV)", "definition": "Time from signup to first meaningful outcome — the faster, the better", "how_to_calculate": "Median time from account creation to first completed order", "healthy_range": "Under 10 minutes in-session is exceptional; every extra step costs roughly 10% activation"},
            {"metric": "D1 Retention", "definition": "Percentage of new users who return the day after signup — a leading indicator of habit formation", "how_to_calculate": "Users active Day 1 ÷ Users who joined Day 0", "healthy_range": ">30% is strong; <15% suggests broken activation"},
            {"metric": "First-Order On-Time Rate", "definition": "Percentage of first orders delivered within the promised ETA window", "how_to_calculate": "First orders delivered on time ÷ Total first orders × 100", "healthy_range": ">90% is required to sustain 30-day retention; every point below 90% correlates with measurable churn uplift"}
          ],
          "system_design": {
            "components": [
              {"component": "ETA Prediction Model (DeepETA)", "what_it_does": "Uses ML to predict delivery time based on restaurant prep time, courier proximity, traffic, and order complexity — with a first-order coefficient that pads estimates for new users", "key_technologies": "ETA accuracy at the moment of order placement is the single strongest predictor of first-order satisfaction. Overestimating ETA reduces conversion; underestimating it destroys trust. The first-order coefficient is a deliberate product decision, not a model artifact."},
              {"component": "Real-Time Order Tracking", "what_it_does": "GPS-based live map showing courier location, restaurant confirmation status, and estimated arrival time", "key_technologies": "Reduces inbound support contacts for ''where is my order'' by 40–60%. Determines how much latency users will tolerate before contacting support or requesting refunds."},
              {"component": "Priority Dispatch for First Orders", "what_it_does": "Identifies first-order users and routes their order to high-rated experienced couriers rather than purely proximity-based assignment", "key_technologies": "Trades marginal efficiency loss for dramatically better first impressions. The retention math justifies the trade-off — a sub-4.0 first experience cuts second-order probability by over half."}
            ],
            "links": [
              {"tag": "System Design", "label": "ETA Prediction Systems at Marketplace Scale"},
              {"tag": "Metric", "label": "Activation Rate vs. Time-to-Value Tradeoffs"},
              {"tag": "Strategy", "label": "Priority Routing as a Retention Investment"}
            ]
          },
          "failures": [
            {"name": "Inaccurate Early ETAs (2016–2017)", "what": "UberEATS early delivery estimates were frequently inaccurate — showing 25-minute estimates that became 45–55 minutes upon placing an order. First-order delivery experiences with significant estimate overruns had measurably lower second-order rates. The inaccurate ETA model used static estimates rather than real-time driver and restaurant capacity.", "lesson": "Food delivery activation hinges on delivery time accuracy, not speed alone. A 45-minute delivery estimated at 45 minutes produces higher repeat intent than a 35-minute delivery estimated at 25 minutes. Accurate ETA communication is an activation feature that must be prioritized over optimistically short estimates."},
            {"name": "Flat Restaurant Discovery UX at Launch (2016)", "what": "The initial UberEATS app presented restaurants in a simple list without meaningful filtering, cuisine category tabs, or personalized recommendations. New users who did not immediately find a restaurant they recognized were likely to exit without ordering. The discovery UX was significantly worse than Seamless and Grubhub''s more mature category filtering.", "lesson": "Food delivery app activation requires a restaurant discovery experience that helps users find a relevant option within 30 seconds. Category browsing, cuisine filtering, and personalized sections are activation features, not feature enhancements."},
            {"name": "No Scheduled Orders at Launch (2016–2018)", "what": "UberEATS did not support scheduled orders — placing an order for delivery at a future time — until years after competitors offered the feature. This prevented activation among a significant segment: office lunch orders placed in the morning, family dinner orders placed in the afternoon. DoorDash and Grubhub used scheduled ordering as a differentiated activation feature.", "lesson": "Missing a basic feature that a well-defined use case requires does not just reduce feature completeness — it eliminates entire behavioral activation patterns. Scheduled ordering activates a distinct user segment (planners, not impulse orderers) that cannot be converted through any other feature."}
          ],
          "do_dont": {
            "dos": [
              "Show the real-time tracking map immediately after order confirmation without requiring any additional taps — reducing uncertainty is the primary job of the post-order experience",
              "Calibrate ETA models to the 80th percentile delivery time, not the median — users who receive orders faster than promised are delighted; users who receive orders later than promised file refund requests",
              "Use the first-order restaurant selection as a long-term preference signal and surface it prominently in future sessions — the activation moment should seed the retention model",
              "Send a push notification the moment the courier picks up the order, not just when they arrive — this is the highest-anxiety moment in the delivery flow and proactive communication reduces support volume",
              "Pre-populate the address field from the Uber rides account if one exists — reducing friction in address entry measurably increases first-session conversion"
            ],
            "donts": [
              "Do not show sponsored restaurant placements above organic results for new users'' first search — the activation goal is a successful first order, not short-term advertising revenue",
              "Do not truncate menu descriptions or hide information on first-order flows to reduce decision friction — users who feel deceived after receiving food they did not expect will not return",
              "Do not A/B test ETA accuracy by showing different ETAs to different users for the same restaurant at the same time — this creates incoherent expectations and operational chaos for couriers",
              "Do not rely solely on ''popular near you'' as the primary discovery mechanism for new users — popular restaurants in a new market may not match the new user''s cuisine preferences at all",
              "Do not require account creation before showing the menu or ETA — defer authentication as late as possible in the flow; every pre-order friction point is a conversion killer"
            ]
          }
        },
        "practice_prompts": {
          "on_the_job": {
            "question": "You are reviewing activation metrics and notice that users who place their first order through the Deals tab have a 40% lower 90-day retention rate than users who place their first order through organic restaurant search. The Deals tab drives 35% of all first orders. What do you do with this information?",
            "guidance": "This is a classic acquisition quality versus volume tradeoff. Users arriving via deals are likely price-sensitive and are not building a habit around Uber Eats specifically — they are optimizing for the discount. First, validate causality versus correlation: are Deals users systematically different in demographics or geography, or is the Deals tab itself conditioning the behavior? Then consider whether the Deals tab can be redesigned to still surface value while building restaurant affinity.",
            "hint": "The unit economics of discount-acquired users rarely pencil out unless the discount triggers genuine habit formation. The question is whether the Deals tab is a habit-formation tool or a coupon aggregator — those require fundamentally different product designs."
          },
          "interview_prep": {
            "question": "Uber Eats first order completion rate is 78% — meaning 22% of users who start an order never complete it. ETA accuracy is within 5 minutes for 65% of orders. How are these two metrics related, and what do you build to improve both?",
            "guidance": "The metrics are causally related: ETA inaccuracy at the point of order creation creates a trust gap that causes abandonment. Fix the ETA display first — show realistic time estimates before the user selects the restaurant, on the restaurant card, not just at checkout. Then measure whether order completion rate improves as ETA accuracy improves.",
            "hint": "Tests whether you can identify the causal relationship between two metrics. Strong candidates propose a single intervention that addresses both problems because they share a root cause."
          }
        },
        "transition": {
          "text": "Priya''s first order went perfectly. She saved her address, her card, and turned on notifications. It has been one week. ↓"
        }
      }
    },
    {
      "id": "engagement",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 3,
        "stage_name": "Engagement",
        "question": "Is the product earning repeated attention?",
        "narrative_paragraphs": [
          "Tuesday, 11:32 AM. Priya is in a standup meeting, half-listening to a sprint update. Her phone buzzes: <em>\"Craving pad thai? Siam Kitchen has a lunch deal today. Free delivery with Uber One.\"</em> She was not thinking about food. Now she is. She taps the notification, sees her last order with a Reorder button, taps it, confirms. Ninety seconds. Twenty-six dollars. Done.",
          "That notification was not random. It fired at 11:32 because Uber Eats'' data shows the lunch decision window is 11:15–11:45 — after that, people commit to other plans. It mentioned Siam Kitchen because that is what Priya ordered last. It said \"Free delivery with Uber One\" to plant a seed for the subscription pitch coming later.",
          "The following Friday, it rained. At 6:14 PM, a push fired: <em>\"Perfect night to stay in. Rain detected in your area. Free delivery tonight — on us.\"</em> This was not triggered by a marketing calendar. It was triggered by a weather API that detected rain in Austin at 6:02 PM. The system auto-fired a personalized push within 12 minutes. Order volume spikes 20–30% during rain events — not because people are hungrier, but because the cost of the alternative just went up.",
          "By week three, Priya has ordered four times. She is developing a pattern: Thai on Tuesdays, burritos on Fridays. She does not think about what to eat anymore — she thinks about which of her usual spots to reorder from. The reorder button reduced her decision from <em>\"what should I eat?\"</em> to <em>\"same as last time?\"</em> For habitual users, one-tap reorders account for 40% or more of all orders.",
          "The engagement machine runs on two rails. <strong>Contextual triggers</strong> — weather, time of day, day of week, order history — that surface the app at the exact moment a food decision is forming. And <strong>friction removal</strong> — the reorder button, saved favorites, pre-filled address and payment — that makes acting on that trigger nearly instantaneous. Remove either rail and engagement drops.",
          "The real risk is notification fatigue. CTR on mealtime pushes averages around 4%. Doubling notification frequency doubles opt-outs, and opt-outs are permanent. Every optimization for short-term engagement has to be weighted against the long-run cost of losing the push channel entirely."
        ],
        "metrics": [
          {"value": "~4%", "label": "Mealtime Push CTR"},
          {"value": "40%+", "label": "Orders via One-Tap Reorder"},
          {"value": "20–30%", "label": "Order Volume Spike in Rain"}
        ],
        "war_room": [
          {"role": "ENG", "insight": "Weather-triggered push pipeline. Real-time weather API integration, geo-fence matching, user eligibility filter, personalized message assembly, push delivery. End-to-end latency target: under 15 minutes from weather event to notification. This is event-driven architecture, not batch marketing."},
          {"role": "PM", "insight": "\"CTR on mealtime pushes is only 4%. How do we double it without spamming?\" Debate: send fewer, better-timed notifications using order-history prediction versus sending more with personalized restaurant mentions. The fear: notification fatigue leads to opt-outs, which is permanent revenue loss."},
          {"role": "DATA", "insight": "Building the next-order prediction model. Features: day of week, time of day, cuisine history, weather, recency of last order, reorder versus explore ratio. Goal: predict when a user is 15 minutes away from a food decision and hit them before they default to cooking."},
          {"role": "DESIGN", "insight": "The reorder flow is the highest-ROI screen in the app. A/B test showed home-screen placement of recent orders increased reorder rate by 18% but decreased new restaurant discovery by 12%. Current compromise: top section of home feed, scrollable."}
        ],
        "go_deeper": {
          "metric_definitions": [
            {"metric": "DAU/MAU Ratio", "definition": "Daily active users as a fraction of monthly active users — measures how sticky the product is", "how_to_calculate": "Average DAU ÷ MAU", "healthy_range": ">25% strong; >50% exceptional (social-app level)"},
            {"metric": "Push Notification CTR", "definition": "Click-through rate on push notifications — measures relevance and timing quality", "how_to_calculate": "Notification clicks ÷ Notifications sent × 100", "healthy_range": "4–8% for personalized food delivery pushes; below 2% signals spam territory"},
            {"metric": "Reorder Rate", "definition": "Percentage of orders placed via one-tap reorder rather than fresh search — measures habit formation", "how_to_calculate": "Reorder taps ÷ Total orders placed × 100", "healthy_range": ">40% indicates strong habit formation among active users"},
            {"metric": "Non-Transactional Sessions", "definition": "Sessions where users browse but do not order — measures aspirational engagement and future purchase intent", "how_to_calculate": "Sessions without order completion ÷ Total sessions × 100", "healthy_range": "High is acceptable if it predicts future orders; low means the app is purely utilitarian"}
          ],
          "system_design": {
            "components": [
              {"component": "Weather-Triggered Push Pipeline", "what_it_does": "Detects real-time weather events by geo-fence, matches affected users, assembles personalized messages, and delivers push notifications within 15 minutes of the weather event", "key_technologies": "This is event-driven architecture, not scheduled marketing. The product decision is the threshold — how heavy does rain need to be, and in how large a radius, before a push is warranted? Over-triggering trains users to ignore the channel."},
              {"component": "Next-Order Prediction Model", "what_it_does": "Predicts when a specific user is within 15 minutes of a food decision and triggers personalized push or in-app prompts to intercept before they default to another option", "key_technologies": "Features: order cadence by day and hour, weather overlay, time since last order, reorder versus explore ratio. The model must balance precision (only fire when intent is high) against recall (do not miss real buying windows)."},
              {"component": "Eats Pass / Uber One Subscription Engine", "what_it_does": "Manages subscription state, billing, free trial eligibility, and benefit delivery (fee waivers, discounts) across the user lifecycle", "key_technologies": "Subscribers order 2–3x more frequently than non-subscribers because the marginal cost of ordering feels psychologically zero once the monthly fee is paid. The subscription is the single most powerful engagement lever in the entire product."}
            ],
            "links": [
              {"tag": "System Design", "label": "Event-Driven Notification Systems at Scale"},
              {"tag": "Metric", "label": "Measuring Engagement Without Purchase (Habit Formation)"},
              {"tag": "Strategy", "label": "Subscription as Engagement Anchor: Eats Pass Economics"}
            ]
          },
          "failures": [
            {"name": "Eats Pass Slow Adoption Under DashPass Pressure (2019–2021)", "what": "UberEATS launched Uber One (formerly Eats Pass) at $9.99/month to reduce delivery fees. DoorDash''s DashPass had launched earlier, was more aggressively marketed, and achieved 10M+ subscribers by 2021 compared to Uber One''s ~3M. Subscription retention drove significantly more order frequency, and Uber One''s slower adoption left a retention gap that DashPass subscribers filled.", "lesson": "Subscription retention programs in delivery platforms create order frequency flywheel effects that compound over time. A late subscription launch cedes the habitual ordering behavior of subscription cohorts to the first mover — those subscribers are expensive to recapture once loyalty mechanics are established."},
            {"name": "Driver Reliability Degradation at Peak Hours (2019)", "what": "During peak ordering hours on Friday and Saturday evenings, UberEATS frequently had insufficient active drivers to handle order volume, resulting in 60–90 minute delivery times or cancellations. Repeat order rates among users who experienced a peak-hour failure were 35% lower in the following month. The supply-side management problem directly manifested as demand-side retention loss.", "lesson": "Food delivery engagement requires delivery reliability at peak hours, which demands over-provisioned driver supply relative to average demand. Dynamic driver incentive systems that surge prices to attract sufficient supply during peak windows are a retention investment, not merely an operational cost."},
            {"name": "Grocery Partnership Category Confusion (2020–2021)", "what": "UberEATS rapidly added grocery, convenience, and alcohol delivery through partnerships with Costco, 7-Eleven, and Total Wine. The addition of these categories — with different delivery times, minimum orders, and fee structures — confused existing restaurant-delivery users. App session abandonment increased in markets where grocery recommendations appeared in users'' restaurant feed without sufficient category separation.", "lesson": "Marketplace category expansion requires clear UI separation and discovery segmentation between product categories with materially different delivery economics and user expectations. Mixing grocery (30–60 min) and restaurant (25–35 min) in the same undifferentiated feed degrades both use cases."}
          ],
          "do_dont": {
            "dos": [
              "Surface the reorder button as the primary CTA on the home screen for returning users — reducing the decision load of ''what should I eat tonight'' is more powerful than any recommendation algorithm for users with established preferences",
              "Send a weekly push notification to subscribers on their historically high-order days to reinforce the habit loop without requiring any new product decision from the user",
              "Implement a proactive refund or credit for orders where delivery time exceeded the promised ETA by more than 15 minutes, without requiring the user to contact support",
              "Weight restaurant search ranking heavily on order accuracy relative to star rating — consumers care more about getting exactly what they ordered than marginal rating differences",
              "Design the subscription cancellation flow to surface the concrete dollar value the user has saved — ''you saved $47 in delivery fees this month'' is a more compelling retention message than any generic offer"
            ],
            "donts": [
              "Do not penalize courier ratings for factors outside their control — a spilled soup from restaurant packaging failure should not lower a courier''s score and affect their earnings",
              "Do not optimize push notification frequency for short-term order volume — users who disable notifications because of over-messaging are permanently lost as a push channel",
              "Do not hide subscription pricing changes in email; surface them in-app before the billing cycle where the change takes effect — surprise billing changes are the top reason users cite for subscription cancellation",
              "Do not treat all churned users as equivalent in win-back campaigns; a user who stopped ordering because delivery reliability declined needs a different message than a user who switched to DoorDash for its restaurant catalog",
              "Do not allow restaurant quality to degrade without intervention just because a restaurant drives high GMV — consistently bad experiences from high-volume restaurants destroy platform-level NPS"
            ]
          }
        },
        "practice_prompts": {
          "on_the_job": {
            "question": "Uber Eats Eats Pass subscriber 6-month retention is 55%. You are tasked with getting it to 65% within two quarters. You have budget to invest in either (a) improving delivery reliability for subscribers specifically, (b) expanding the subscriber discount catalog to more restaurants, or (c) building a personalized weekly meal planning feature. How do you decide which to invest in?",
            "guidance": "Start with cancellation reason data: what are subscribers actually saying when they cancel? If ''delivery was unreliable'' is the top reason, (a) is the answer. If ''I don''t use it enough'' or ''the discount restaurants aren''t ones I want,'' that points to (b). If users are churning because the habit is not sticky, (c) could help but is highest effort and most speculative. The general principle: fix broken before building new.",
            "hint": "Subscription retention is almost always a product-market fit problem before it is a feature gap problem. Understand why users are leaving before deciding what to build."
          },
          "interview_prep": {
            "question": "Eats Pass subscribers order 3.2x more frequently than non-subscribers. However, 40% of Eats Pass subscribers report ordering from the same 3–5 restaurants exclusively. How does this affect your retention strategy for Eats Pass?",
            "guidance": "High frequency plus narrow restaurant selection means the retention risk is restaurant-specific: if one of a subscriber''s favorite restaurants leaves the platform, closes, or degrades quality, the subscriber has less reason to stay. Retention strategy: broaden the active restaurant set for power users; monitor whether favorite restaurants are at risk of leaving; track per-subscriber restaurant dependency as a churn risk signal.",
            "hint": "Tests whether you understand that marketplace retention is about the supply relationships, not just user habits. Strong candidates identify restaurant dependency as a hidden retention risk."
          }
        },
        "transition": {
          "text": "Priya orders twice a week now. But every time she checks out, she winces at the total. ↓"
        }
      }
    },
    {
      "id": "monetization",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 4,
        "stage_name": "Monetization",
        "question": "Is the business model real and sustainable?",
        "narrative_paragraphs": [
          "Priya adds pad thai ($16) and spring rolls ($9) to her cart. Subtotal: $25. She taps checkout. Then she sees the real number: $41.24. Delivery fee $4.99. Service fee $3.75. Taxes. A tip prompt. The math just happened quietly while she was browsing.",
          "This is the sunk cost ramp. By the time Priya sees the real total, she has already browsed, chosen, and customized. The psychological cost of backing out exceeds the price premium. <strong>The checkout was designed so that investment precedes revelation.</strong> And that green banner at the bottom — \"Save $4.99 on delivery with Uber One\" — is planting a seed for Stage 5.",
          "Here is where Priya''s $25 in food actually goes. The restaurant pays a 25% commission, keeping about $18.75. Uber Eats takes the $6.25 commission plus the $3.75 service fee. The delivery fee is split between the driver and the platform. After paying the driver''s share, refunds, and ops, contribution margin is often single-digit dollars per order — or negative in competitive markets.",
          "The delivery business alone does not work. What makes Uber Eats viable is everything around the delivery. <strong>Sponsored restaurant placements</strong> are Google Ads for food — pure margin, restaurants bid for visibility. <strong>Checkout upsells</strong> add $3–5 to average order value with zero extra delivery cost. <strong>CPG advertising</strong> — Coca-Cola pays for the ''Add a Coke for $1'' placement. <strong>Dynamic pricing</strong> charges more during peak hours and less during off-peak to smooth demand and protect margins.",
          "The advertising platform is the most underappreciated revenue stream. A self-serve auction where restaurants bid for sponsored placement in search results costs Uber Eats nothing to fulfill — no driver, no delivery, no logistical complexity. At DoorDash, this stream has scaled toward $1B annually. It is the highest-margin revenue the food delivery model generates, and Uber Eats was late to build it.",
          "The structural tension in food delivery monetization is that all three revenue streams — restaurant commission, consumer fees, and advertising — create perverse incentives if taken too far. Commission pressure pushes restaurants to raise menu prices. Service fee pressure pushes consumers toward competitors. Advertising pressure degrades search quality and consumer trust. <em>Every take-rate decision is a tradeoff between short-term margin and long-term platform health.</em>"
        ],
        "metrics": [
          {"value": "~25–30%", "label": "Gross Take Rate"},
          {"value": "$4.50", "label": "Est. Revenue Per Order"},
          {"value": "$74.6B", "label": "Gross Bookings (2024)"}
        ],
        "war_room": [
          {"role": "PM", "insight": "\"Should we show the estimated total earlier — on the restaurant card?\" Experiment result: fewer users tapped into restaurants, but those who did checked out at 40% higher rates. Net revenue increased. The debate now: roll out globally or keep testing by market?"},
          {"role": "ENG", "insight": "Batched delivery routing algorithm. One driver, two pickups, one route. User waits 5–10 extra minutes but the system pays one driver instead of two. The routing optimization directly determines contribution margin. Every minute shaved off a batch route is money."},
          {"role": "PM", "insight": "Building the retail media and ad platform. Sponsored placements, promoted search results, checkout add-ons. This is the Amazon playbook: turn the marketplace into a media platform. Highest-margin revenue stream because there is zero delivery cost."},
          {"role": "DATA", "insight": "Dynamic pricing model: surge multiplier based on real-time demand, driver supply, weather, and time of day. Goal: maximize revenue during peak while using $0 delivery as a demand lever during off-peak. Getting the elasticity curves wrong means either leaving money on the table or killing conversion."}
        ],
        "go_deeper": {
          "metric_definitions": [
            {"metric": "Take Rate", "definition": "Percentage of gross transaction value that the platform keeps as revenue", "how_to_calculate": "Net revenue ÷ Gross transaction value × 100", "healthy_range": "20–30% for food delivery; higher is better but too high pushes restaurants to raise menu prices"},
            {"metric": "Average Order Value (AOV)", "definition": "Average revenue per transaction — increasing AOV improves margin without increasing delivery costs", "how_to_calculate": "Total GMV ÷ Number of orders", "healthy_range": "Food delivery AOV typically $25–35; grocery orders trend higher; track per segment"},
            {"metric": "Contribution Margin Per Order", "definition": "Revenue per order minus direct variable costs (driver pay, payment processing, refunds) — the number that determines whether the delivery business works", "how_to_calculate": "(Order revenue — Variable costs) per delivered order", "healthy_range": "Positive is the floor; $2–4 per order is where the model begins to pencil; advertising revenue on top makes the full model work"},
            {"metric": "Advertising Revenue Share", "definition": "Percentage of total revenue from restaurant and CPG advertising placements — the highest-margin revenue stream", "how_to_calculate": "Ad revenue ÷ Total revenue × 100", "healthy_range": "15–25% at scale signals a healthy media-platform overlay; DoorDash is approaching this range"}
          ],
          "system_design": {
            "components": [
              {"component": "Three-Sided Fee Structure", "what_it_does": "Collects restaurant commission (15–30% of order value), consumer delivery fee, and consumer service fee on each transaction; structures vary by market and restaurant tier", "key_technologies": "Commission rates directly determine whether restaurants raise menu prices on Uber Eats versus in-store, which affects consumer price perception and platform competitiveness. This is the central tension in food delivery unit economics."},
              {"component": "Restaurant Advertising Platform", "what_it_does": "Self-serve auction system where restaurants bid for sponsored placement in search results, category pages, and homepage carousels", "key_technologies": "Advertising revenue can reach 15–25% of total platform revenue at scale, but advertising pressure that degrades organic search quality reduces long-term platform health. The tension between short-term ad revenue and long-term consumer trust is the core product tradeoff."},
              {"component": "Dynamic Delivery Fee Engine", "what_it_does": "Adjusts consumer delivery fees in real-time based on courier supply, demand volume, weather, and time of day", "key_technologies": "Surge pricing is the mechanism that clears supply-demand imbalances, but consumer tolerance varies widely by order size, cuisine type, and perceived urgency. Calibrating between clearing the market and preserving conversion is the core pricing PM problem."}
            ],
            "links": [
              {"tag": "Strategy", "label": "Three-Sided Marketplace Pricing: Commission vs. Consumer Fee vs. Advertising"},
              {"tag": "Metric", "label": "Contribution Margin Per Order: The Only Number That Matters"},
              {"tag": "System Design", "label": "Building a Restaurant Advertising Auction Platform"}
            ]
          },
          "failures": [
            {"name": "Commission Rate Increases During COVID Backlash (2020)", "what": "UberEATS (and other delivery platforms) raised restaurant commission rates to 30% during COVID-19 while restaurants were entirely dependent on delivery revenue. Several major US cities passed emergency legislation capping commission rates at 15%. The backlash cost UberEATS restaurant relationships and generated negative press that damaged brand perception among potential restaurant partners for years.", "lesson": "Commission rate increases on supply-side partners during periods of forced dependency create regulatory backlash and lasting partner resentment. Revenue extraction from captive supply-side participants is a short-term revenue strategy with long-term structural consequences in the form of legislation, partner churn, and reputational damage."},
            {"name": "Advertising Revenue Under-Development (2017–2020)", "what": "UberEATS was slow to build a restaurant advertising and sponsored placement product, leaving significant high-margin revenue on the table as DoorDash and Grubhub developed self-serve ad platforms. Promoted restaurant listings and sponsored search results — which are high-margin, near-zero-marginal-cost revenue — were not available on UberEATS until late in its development, costing years of advertising revenue.", "lesson": "Marketplace advertising — where supply-side partners pay for visibility — is the highest-margin revenue stream in a food delivery platform and should be developed in the first 2–3 years of operation. Delayed advertising platform development hands the highest-margin revenue stream to competitors who invest earlier."},
            {"name": "Postmates Acquisition Integration Costs ($2.65B, 2020)", "what": "Uber acquired Postmates for $2.65B to consolidate the US delivery market. The integration was slow and costly — maintaining two separate apps, two driver pools, and two restaurant networks for over two years created significant operational overhead. Synergies were slower to materialize than projected, and the acquisition increased losses during a period when profitability was a key investor expectation.", "lesson": "Marketplace consolidation acquisitions must have a clear integration timeline with a single-platform migration plan executed within 12–18 months. Operating two parallel platforms post-acquisition doubles the operational cost while failing to capture the unit economics benefits that justified the acquisition price."}
          ],
          "do_dont": {
            "dos": [
              "Offer tiered commission structures where restaurants that maintain high quality scores and short prep times qualify for lower commission rates — this aligns restaurant incentives with platform health",
              "Make the advertising auction transparent to restaurant partners — show them their quality score, their bid rank, and the estimated incremental orders generated so they can make informed ROI decisions",
              "Model restaurant menu price inflation as a platform health metric and alert restaurant success teams when a restaurant''s Uber Eats prices exceed their in-store prices by more than 10%",
              "Use surge pricing data as an input to courier recruitment targeting — the times and zones with highest surge frequency are where incremental courier supply would generate the most GMV",
              "Show estimated total price earlier in the funnel — it reduces sticker shock at checkout even if it reduces browse-to-tap conversion, because it filters for committed buyers"
            ],
            "donts": [
              "Do not structure restaurant commissions uniformly across all restaurant tiers — a multinational fast-food chain has radically different margin structures than an independent restaurant; a single rate is a blunt instrument that hurts small restaurants most",
              "Do not treat advertising revenue as decoupled from consumer experience quality — every sponsored placement that surfaces a lower-quality restaurant degrades the consumer trust that underpins all platform revenue",
              "Do not implement surge pricing without a clear consumer communication strategy — ''busy fee'' framing consistently outperforms ''surge pricing'' in consumer perception studies without changing the economics",
              "Do not allow the advertising platform to bid on brand terms of non-advertising restaurants — allowing Restaurant A to buy placement against Restaurant B''s name search query destroys trust with the restaurant partner ecosystem",
              "Do not optimize commission rate negotiations solely on restaurant revenue volume — a cluster of highly-rated independent restaurants in a dense neighborhood may drive more consumer satisfaction and LTV than one high-volume chain"
            ]
          }
        },
        "practice_prompts": {
          "on_the_job": {
            "question": "You are presenting to the CFO on Uber Eats revenue strategy for next fiscal year. Three options are on the table: (1) raise consumer service fees by $0.50 on all orders, (2) expand the restaurant advertising platform to include homepage takeovers, (3) launch a premium Priority Delivery tier at $2.99 extra for top-of-queue courier assignment. Each is projected to generate $200M ARR. How do you compare them and which do you recommend?",
            "guidance": "Evaluate each lever on three dimensions: consumer trust impact, three-sided marketplace health, and reversibility. Service fee increases are highly visible, easy for competitors to exploit, and hard to reverse. Homepage takeovers risk turning the home screen into an ad surface that reduces organic discovery. Priority delivery creates a premium tier that willing consumers pay for, improves earnings for couriers, and does not degrade the standard tier.",
            "hint": "The best revenue expansions in three-sided marketplaces create new value rather than redistributing existing value. Priority delivery creates a new tier; fee increases and ad takeovers are zero-sum redistributions that harm platform health long-term."
          },
          "interview_prep": {
            "question": "Uber Eats charges restaurants 15–30% commission. Many restaurants have responded by raising menu prices by 15–20% on Uber Eats compared to their in-restaurant prices. What is the product and business problem this creates, and how do you address it?",
            "guidance": "Dual pricing creates a trust problem: consumers who discover the markup feel deceived, which damages brand trust and reduces conversion. Address it at the commission structure level, not just at the consumer transparency level: create a lower-commission tier with price parity as the requirement, and surface those restaurants more prominently in search. Requiring price parity by contract is the other lever, with mixed enforcement results.",
            "hint": "Tests whether you can trace a consumer-facing problem to its economic root cause. Strong candidates propose solutions at the commission structure level, not just the consumer transparency level."
          }
        },
        "transition": {
          "text": "Priya has been ordering for three months. She has done the math on those delivery fees. ↓"
        }
      }
    },
    {
      "id": "retention",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 5,
        "stage_name": "Retention",
        "question": "Do users genuinely need this — or just like it?",
        "narrative_paragraphs": [
          "Three months in. Thai Mondays, burrito Fridays. Priya opens Uber Eats and sees, for the hundredth time, that green banner: <em>\"Save $4.99 on delivery with Uber One.\"</em> She finally does the math. She orders roughly 10 times a month. Delivery fee averages $5. That is $50 a month in delivery fees. Uber One costs $9.99. She would save $40. She subscribes.",
          "Something shifts after she subscribes. Her order frequency goes from 1.5x/week to 2.5x/week. Not because she is hungrier — because the delivery fee, the thing that made her hesitate every time, is gone. And there is a new psychology at work: <em>\"I am paying $9.99 a month for this. I should use it.\"</em>",
          "This is the Uber One flywheel. The subscription removes the friction that slowed ordering. Ordering more makes the subscription feel like a better deal. Feeling like a better deal makes cancellation feel like a loss. The loop reinforces itself with every order. Subscribers reach 30M+ globally and growing 60% year-over-year.",
          "Four months later, a delivery arrives 25 minutes late. Cold food. Priya contacts support, waits 10 minutes, gets a $5 credit. She does not order for two weeks. Uber Eats notices. The churn escalation ladder begins: Day 7, a warm push mentioning Siam Kitchen with no discount. Day 14, an email with $10 off and her restaurant''s name in the subject line. Day 21, a push and email combo with $15 off and free delivery expiring in 48 hours. Day 30, a final $20 off with no minimum.",
          "Priya gets the Day 14 email. The mention of Siam Kitchen — her restaurant, not a generic promo — brings her back. But the real anti-churn strategy is not the escalation ladder. <strong>40% of churned users never return regardless of incentive amount.</strong> The real retention investment is preventing the bad delivery that caused the churn in the first place.",
          "Users consistently matched with 4.8+ rated drivers had 15% higher 30-day retention. That single insight drove the partner-quality-weighted dispatch algorithm. Retention is an upstream engineering and operations problem disguised as a downstream marketing problem."
        ],
        "metrics": [
          {"value": "30M+", "label": "Uber One Members"},
          {"value": "60%", "label": "YoY Subscriber Growth"},
          {"value": "$1B+", "label": "Subscription Revenue/yr"}
        ],
        "war_room": [
          {"role": "PM", "insight": "\"Uber One free trial converts at 80% to paid — but 20% cancel before month 1.\" The debate: what value moments need to happen in the first 14 days? Should we front-load savings (lots of orders) or front-load delight (prioritize delivery quality)?"},
          {"role": "ENG", "insight": "Churn prediction model. If a weekly user has not ordered by Day 5, probability of churn spikes. The system needs to detect this early enough to intervene with a push on Day 7 — not Day 14. Feature set: order cadence, last delivery rating, support tickets, session drops."},
          {"role": "DATA", "insight": "Win-back email A/B testing. Best subject line: ''We saved your favorites'' (3.2% open) versus ''Come back to Uber Eats'' (1.8%). Personalized restaurant names in the body had 2x the CTR of generic messages. The escalation ladder cost is tracked per user — if Day 30 does not work, user enters a quarterly cycle."},
          {"role": "OPS", "insight": "Delivery quality correlation with retention. Users consistently matched with 4.8+ rated drivers had 15% higher 30-day retention. This insight drove the partner-quality-weighted dispatch algorithm — not just proximity-based, but retention-aware."}
        ],
        "go_deeper": {
          "metric_definitions": [
            {"metric": "D30/D90/D365 Retention", "definition": "Percentage of users still active at 30, 90, and 365 days after first order — the most important cohort health metrics", "how_to_calculate": "Users active Day N ÷ Users who first ordered Day 0", "healthy_range": "D365 above 30% for food delivery; above 50% for subscription cohorts is strong"},
            {"metric": "Subscriber Order Frequency", "definition": "Average orders per month for subscription members versus non-members — the core value metric for subscription programs", "how_to_calculate": "Total orders by subscribers ÷ Subscriber count ÷ Months in period", "healthy_range": "2–3x non-subscriber frequency is the benchmark; below 1.5x suggests subscription is not changing behavior"},
            {"metric": "Churn Rate (Subscription)", "definition": "Percentage of subscribers who cancel in a given period", "how_to_calculate": "Subscribers who canceled ÷ Total subscribers at start of period × 100", "healthy_range": "<5% monthly is strong for subscription products; 20% within first month signals activation failure"},
            {"metric": "Switching Cost Score", "definition": "Composite measure of platform investment per user — saved payment, order history, personalized recommendations", "how_to_calculate": "Weighted sum of: saved payment method, order history depth, notification opt-in, subscription status", "healthy_range": "Each additional invested asset raises 12-month retention 20–35%"}
          ],
          "system_design": {
            "components": [
              {"component": "Churn Prediction Model", "what_it_does": "Predicts 7-day churn risk based on behavioral signals — order cadence drop, session frequency decline, last delivery rating, support contacts", "key_technologies": "Gradient-boosted classifier. A weekly user who has not ordered by Day 5 is flagged. The system routes at-risk users to personalized win-back nudges before the behavior crystallizes into a churn decision."},
              {"component": "Churn Escalation Ladder", "what_it_does": "Automated sequence of personalized re-engagement touchpoints timed to the user''s dormancy window (Day 7, 14, 21, 30) with escalating incentives", "key_technologies": "The key engineering challenge is personalization at each step — mentioning the user''s specific restaurants, not generic category language. Generic messages achieve 1.8% open rates; personalized ones achieve 3.2%."},
              {"component": "Subscription Lapse Recovery Flow", "what_it_does": "Detects when Uber One lapses due to payment failure or deliberate cancellation; triggers time-sensitive re-subscribe offers within the narrow window before habit breaks", "key_technologies": "Involuntary churn (payment failure) is the most recoverable form. A frictionless payment update prompt within 24 hours of lapse recovers 60–70% of involuntary churners without any discount incentive."}
            ],
            "links": [
              {"tag": "Strategy", "label": "Subscription as Retention Engine: Uber One Flywheel"},
              {"tag": "Metric", "label": "Churn Prediction: Behavioral Leading Indicators"},
              {"tag": "System Design", "label": "Designing a Churn Escalation Ladder"}
            ]
          },
          "failures": [
            {"name": "Promo Code Fraud — $100M+ in Fraudulent Credits (2017)", "what": "UberEATS'' aggressive promo code distribution was exploited at massive scale. Fraudsters created thousands of fake accounts using temporary email addresses and virtual phone numbers to redeem first-order promo codes without genuine new-user intent. Uber estimated promo fraud costs in the hundreds of millions across its ride and delivery products.", "lesson": "Promo code programs without robust identity verification and device fingerprinting are direct revenue destruction mechanisms. First-order discounts must be gated by phone number verification, payment method validation, and delivery address deduplication to prevent systemic fraud."},
            {"name": "Driver Referral Program High Fraud Rate (2016–2018)", "what": "UberEATS offered delivery drivers $50–$200 referral bonuses for recruiting new drivers. The program was abused by drivers creating fake referral accounts that passed initial verification but never completed the required deliveries to sustain the payout. Uber spent significant engineering resources building fraud detection retroactively.", "lesson": "Driver referral programs must require the referred driver to complete a sustained performance threshold — for example, 50 deliveries in 60 days — before payout to the referrer, with real-time identity verification cross-referenced against existing driver records."},
            {"name": "No B2B Referral Program (2018–2020)", "what": "UberEATS had no referral program for corporate catering or office food delivery accounts — a high-LTV B2B segment. Office managers and executive assistants who ordered for their teams had no incentive to refer other office managers at partner companies. The B2B referral surface was entirely un-instrumented despite B2B order values being 5–10x higher than consumer orders.", "lesson": "B2B marketplace referral programs must be treated as separate, high-priority initiatives from consumer referral programs. The LTV of a corporate catering account that places $5,000+ monthly orders justifies a $500–$1,000 referral bonus designed specifically for the office manager, not the individual consumer."}
          ],
          "do_dont": {
            "dos": [
              "Surface the Uber One value proposition at the moment of highest pain — the checkout screen showing a $4.99 delivery fee — and make the subscription feel like an obvious financial win",
              "Personalize win-back messages with the user''s specific restaurant history — ''Siam Kitchen is waiting'' outperforms ''order tonight'' by 2x in CTR",
              "Track churn prediction on behavioral signals like session frequency drops, not just order gaps — users stop browsing before they stop ordering",
              "Design the subscription cancellation flow to surface the concrete savings the user has accumulated — loss aversion is a more effective retention message than any new offer",
              "For involuntary churn (payment failure), deploy a frictionless payment update prompt within 24 hours — this cohort recovers at 60–70% without requiring any discount incentive"
            ],
            "donts": [
              "Do not send win-back campaigns to users who have explicitly unsubscribed from marketing communications — this is a legal risk and permanently destroys remaining brand goodwill",
              "Do not treat all dormant cohorts as equally valuable for resurrection investment; a user who was a weekly subscriber for 18 months deserves materially more win-back investment than a user who made a single promotional order",
              "Do not rely solely on discounts for win-back campaigns — a user who churned because of consistent delivery reliability problems will churn again after the discount expires if the underlying experience has not improved",
              "Do not optimize subscription free trial length purely for conversion rate — a 14-day trial that converts at 80% but cancels at 40% by month 1 is worse than a 30-day trial that converts at 70% and retains at 75%",
              "Do not ignore the competitive intelligence signal in dormant user data — users who churned to DoorDash in a specific market are revealing something about relative catalog quality or pricing that your internal metrics will not surface"
            ]
          }
        },
        "practice_prompts": {
          "on_the_job": {
            "question": "Uber Eats wants to grow corporate meal program GMV from 5% to 15% of total GMV within 18 months. You are the PM. What are the three biggest product investments you would make, and what is the go-to-market motion you would prioritize?",
            "guidance": "Corporate meal programs require product investment in three layers: (1) the admin experience — HR teams managing budgets, setting per-employee caps, pulling expense reports; (2) the employee experience — frictionless ordering within a budget without a personal payment method; (3) the operations layer — ensuring lunch-hour courier supply in office districts matches demand. Go-to-market is sales-led for initial contracts, product-led for expansion within a company.",
            "hint": "B2B products embedded in enterprise workflows have structural retention advantages over consumer products. The challenge is that the buyer (HR/finance) and the user (employee) are different people with different success metrics, and you must satisfy both simultaneously."
          },
          "interview_prep": {
            "question": "Uber Eats'' group order feature (multiple people add items to one cart) has a 70% abandonment rate before checkout. The feature is used mostly by office teams ordering lunch. What do you investigate and what do you fix?",
            "guidance": "Group order abandonment in office settings has specific failure modes: the time limit expires before everyone has added their items; the organizer does not know who has not added their order yet; payment splitting is unclear before checkout. Instrument where in the flow group orders die, then address the specific failure mode — not the general flow.",
            "hint": "Tests whether you diagnose before prescribing. Strong candidates instrument the abandonment funnel to find the specific failure point before recommending a fix."
          }
        },
        "transition": {
          "text": "Priya is retained. She orders 2.5 times a week and has Uber One. Now she starts spreading the word. ↓"
        }
      }
    },
    {
      "id": "referral",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 6,
        "stage_name": "Referral",
        "question": "Does the product spread without paid marketing?",
        "narrative_paragraphs": [
          "Wednesday lunch. Priya is eating pad thai at her desk. Her coworker Anika walks by: <em>\"Where is that from? That smells amazing.\"</em> Priya pulls up her app, copies her referral code, and texts it to Anika. Give $20, get $20. Anika downloads the app, uses the code, and orders dinner that night.",
          "Uber Eats just acquired a new user for $20 in credits instead of $40 in ad spend. And Anika will retain 2–3x better than a cold paid user — because trust was pre-established by Priya. Referred users do not need to discover value; someone they trust already told them it works. That pre-sold trust compresses the time to first order and eliminates the trust deficit that new-user acquisition normally has to overcome.",
          "The referral prompt appeared after one of Priya''s 5-star deliveries — not during onboarding, not at a random session moment. Referral conversion is 3x higher when prompted at the emotional peak of a great experience. The timing is not a UX nicety; it is the reason the program converts.",
          "80% of referral codes are shared via text message, which means the deep link has to work perfectly — with or without the app installed, on iOS and Android, attributing correctly across devices and deferred install scenarios. The engineering behind a referral link is not simple: universal links on iOS, App Links on Android, deferred deep linking for app-not-installed states, attribution window logic.",
          "Referral fraud is the program''s silent tax. People create multiple accounts to redeem their own codes. Detection signals: same device fingerprint, same IP address, same delivery address, order placed within minutes of signup. Reward fulfillment is delayed until legitimate behavior — a real delivery to a new address — is confirmed. Without this layer, the referral program becomes a discount harvesting mechanism for sophisticated users.",
          "The data team''s finding: referred users have 16% higher LTV and 2–3x better 90-day retention versus paid-acquired users. But the causal question matters — is that because referrals are inherently better users, or because the type of person who gets referred is different from the type who clicks an ad? Measuring this correctly changes the economics of how much referral credit is worth offering."
        ],
        "metrics": [
          {"value": "$20", "label": "Referral Credit Per Side"},
          {"value": "16%", "label": "Higher LTV vs. Paid Acquired"},
          {"value": "3×", "label": "Referral Conversion Lift (Post-5-Star)"}
        ],
        "war_room": [
          {"role": "ENG", "insight": "Referral fraud detection. Signals: same device fingerprint, same IP, same delivery address, order placed within minutes of signup. Reward fulfillment is delayed until legitimate behavior (real delivery to a new address) is confirmed. This engineering layer is what separates a referral program from a discount exploit."},
          {"role": "PM", "insight": "\"When do we show the referral prompt?\" After 5-star rating: 3x conversion versus random session moment. Testing a new variant: showing referral stats on the home screen for power users. Hypothesis: making referrals visible turns it into a game and increases share frequency."},
          {"role": "DATA", "insight": "Measuring referral LTV versus paid. Referred users have 16% higher LTV and 2–3x better 90-day retention. But is that because referrals are inherently better, or because the type of user who gets referred is different? The team is running an experiment with randomized referral incentive levels to isolate the causal effect."}
        ],
        "go_deeper": {
          "metric_definitions": [
            {"metric": "Viral Coefficient (K-factor)", "definition": "New users generated per existing user per referral cycle", "how_to_calculate": "Invites sent × Invite conversion rate", "healthy_range": ">1.0 = exponential growth; 0.3–0.5 meaningfully reduces blended CAC"},
            {"metric": "Referral Conversion Rate", "definition": "Percentage of people who received a referral and signed up and completed a qualifying order", "how_to_calculate": "Signups from referral ÷ Referrals sent × 100", "healthy_range": "10–30% for a strong offer; below 5% signals weak incentive or weak sender trust"},
            {"metric": "Referred User LTV vs. Organic", "definition": "Lifetime value of referred users compared to organic or paid-acquired users", "how_to_calculate": "LTV(referred) ÷ LTV(organic) × 100", "healthy_range": "Referred users typically retain 20–40% better than paid-acquired users"},
            {"metric": "CAC via Referral", "definition": "Cost per acquisition through the referral program", "how_to_calculate": "Total referral incentive cost ÷ New users from referral", "healthy_range": "Should be 2–5x cheaper than paid channels; if not, referral fraud is likely eroding the economics"}
          ],
          "system_design": {
            "components": [
              {"component": "Deep Link Attribution System", "what_it_does": "Ensures referral codes attribute correctly across iOS and Android, with and without the app installed, across deferred install scenarios", "key_technologies": "Universal links (iOS) plus App Links (Android) plus deferred deep linking for app-not-installed state. Attribution window logic determines how long a referral code can trigger a reward after being sent. Getting this wrong means either over-paying for fraud or under-paying for legitimate referrals."},
              {"component": "Referral Fraud Detection Layer", "what_it_does": "Detects self-referral fraud using device fingerprinting, IP deduplication, delivery address matching, and behavioral signals", "key_technologies": "Reward fulfillment is gated on confirmed legitimate behavior (real delivery to a previously unseen address, payment method not previously seen). Without this layer, sophisticated users exploit the program and economics invert."},
              {"component": "Referral Prompt Timing Engine", "what_it_does": "Determines the optimal moment to surface the referral share prompt based on user emotional state signals — specifically, post-5-star rating delivery", "key_technologies": "The timing engine is a simple trigger: rating action of 5 stars plus first-order status. The 3x conversion lift versus session-based prompting is entirely attributable to emotional context, not product design."}
            ],
            "links": [
              {"tag": "System Design", "label": "Deep Link Attribution: Universal Links, App Links, Deferred Install"},
              {"tag": "Strategy", "label": "Referral Program Economics: LTV vs. Credit Cost"},
              {"tag": "Metric", "label": "Viral Coefficient Measurement and Fraud Adjustment"}
            ]
          },
          "failures": [
            {"name": "UberEATS India Exit (2020)", "what": "UberEATS entered India in 2017 and competed against Swiggy and Zomato, two well-capitalized domestic competitors with strong local brand recognition and restaurant relationships. After years of losses and inability to reach profitability, UberEATS sold its India business to Zomato for a 9.99% equity stake. India was UberEATS'' largest international market by city count at the point of exit.", "lesson": "Food delivery expansion into markets with well-capitalized domestic incumbents who have structural advantages — language, restaurant relationships, local payment methods — requires a sustainable path to unit economics within a defined timeline. When that timeline passes without viability, acquisition by a local player preserves some value rather than continued cash burn."},
            {"name": "Saudi Arabia Cultural Product Gaps (2019)", "what": "UberEATS launched in Saudi Arabia without adequately adapting to local dietary and cultural requirements. Users needed prominent halal certification filtering, family-section delivery options, and Arabic-language menus with full item descriptions. The initial launch without these features created poor conversion among Saudi users who saw the product as culturally un-adapted.", "lesson": "Food delivery expansion into markets with strong dietary and cultural requirements demands category-specific product adaptation before launch. Halal filtering and regional dietary standards are not feature enhancements in those markets — they are baseline product requirements for the local restaurant discovery experience."},
            {"name": "Africa Expansion Premature Scale (2018–2019)", "what": "UberEATS launched in several African cities but faced payment infrastructure challenges — cash on delivery was the dominant payment method, and UberEATS'' digital-only payment model at launch prevented many users from completing orders. The product was effectively inaccessible to the majority of the target market, and expansion was paused in several cities within 18 months.", "lesson": "Cashless-only payment models in markets where cash-on-delivery represents 60–80% of e-commerce transactions exclude the majority of potential users from the product. Cash collection infrastructure is a market entry prerequisite in cash-dominant economies, not a feature to add after launch."}
          ],
          "do_dont": {
            "dos": [
              "Trigger the referral share prompt immediately after a 5-star delivery rating — emotional peak timing produces 3x higher share rates than session-based or onboarding prompts",
              "Gate referral reward fulfillment on confirmed legitimate behavior (delivery to a new address with a new payment method) rather than on account creation",
              "Track referred user retention separately from organic user retention — referred users are better users and justify a higher credit cost than the blended CAC math suggests",
              "Use generosity framing in referral copy (''Give $20, get $20'') rather than purely self-interest framing — what your friend receives creates social warmth that self-interest copy does not",
              "Build engineering resources for deep link attribution before launching the referral program — misattribution is as expensive as fraud in large-scale programs"
            ],
            "donts": [
              "Do not launch referral programs without fraud detection infrastructure — fake accounts will exploit credits immediately and the economics will invert before anyone notices",
              "Do not allow referral credits to expire in less than 30 days — new users who receive a credit but are not ready to order immediately will churn before they activate if the credit feels artificially urgent",
              "Do not structure restaurant partner referrals with the same incentive structure as consumer referrals — restaurant acquisition has a fundamentally different CAC, sales cycle, and LTV profile",
              "Do not optimize the referral program purely on new account creation volume — this metric is trivially gamed and obscures whether the program is driving real platform growth",
              "Do not ignore the network structure of referrals — a user who refers 10 people in a dense urban market creates a social proof cluster that compounds; identifying these connectors is more valuable than treating all referrers identically"
            ]
          }
        },
        "practice_prompts": {
          "on_the_job": {
            "question": "Your referral program gives $20 to the referred user and $20 to the referrer. Fraud detection flags that 18% of all referral credits are being claimed by users who create multiple accounts to refer themselves. The fraud prevention team proposes adding phone number verification, which your growth team estimates will reduce legitimate referral conversions by 12%. How do you think about this tradeoff?",
            "guidance": "Distinguish between fraud investigation and program design. Immediate: freeze suspicious credits pending review. Medium-term: add device fingerprinting, email domain restrictions, and booking-before-credit rules. Do not kill the program — fix the detection layer. A 12% reduction in legitimate conversions is almost certainly worth paying to eliminate 18% fraud.",
            "hint": "The temptation is to shut down the program. The right answer is to fix the fraud detection, not the program economics."
          },
          "interview_prep": {
            "question": "Uber Eats'' referral program generates 500,000 new first orders per quarter. What metrics would you use to evaluate whether these are high-quality referrals versus discount-driven one-time users, and at what point would you reduce referral credit amounts even if it reduced new user volume?",
            "guidance": "Evaluate at 90-day cohort level: second-order rate, subscription conversion rate, and LTV relative to organic users. If referred users are converting to Uber One at the same rate as organic users, the program is generating real customers. If they churn after the first order at higher rates than organic, the credit is buying usage, not loyalty. Reduce credits when the marginal referred user''s LTV falls below 3x the credit cost.",
            "hint": "Tests whether you can design the analysis that distinguishes genuine acquisition from discount harvesting. The 90-day cohort is the right measurement window for food delivery."
          }
        },
        "transition": {
          "text": "Priya started with dinner. But Uber Eats has bigger plans for her wallet. ↓"
        }
      }
    },
    {
      "id": "expansion",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 7,
        "stage_name": "Revenue Expansion",
        "question": "Can the business grow without just adding users?",
        "narrative_paragraphs": [
          "Month five. Priya opens Uber Eats at 7:30 AM and sees a new section: <em>\"Breakfast near you.\"</em> She had never thought of using Uber Eats for breakfast. She orders a coffee and a breakfast burrito. Three days later, she orders lunch at work. Then a grocery run on Sunday. Then Advil at 11 PM through convenience store delivery.",
          "Priya''s monthly spend: $80 to $220. Same user. No new acquisition cost. Uber Eats just expanded her wallet by 2.75x by expanding the occasions where the product is relevant — not by acquiring a new customer.",
          "Each new meal occasion (breakfast, lunch, late-night) represents a 30–40% frequency uplift from the same user. Each new category (grocery, alcohol, pharmacy) increases share-of-wallet and deepens the habit. The strategic logic is clear: Uber Eats is not trying to be the dinner delivery app. It is trying to be \"get me anything\" — the universal fulfillment layer for urban convenience.",
          "<strong>Cross-category data shows these expansions are additive, not substitutive.</strong> Grocery users order restaurants 15% more often, not less. Adding a new category to a user''s behavior increases their total platform engagement rather than fragmenting it. This is the key insight that justifies the expansion investment beyond the obvious TAM arithmetic.",
          "The technical complexity of expansion is underappreciated. A stale restaurant menu is a canceled order. Grocery adds SKU-level inventory that updates hourly. Alcohol delivery requires age verification and jurisdiction-specific regulatory compliance. Each category has fundamentally different logistical, legal, and UX requirements than restaurant delivery — but all share the same courier network, the same checkout flow, and the same saved payment method.",
          "Expansion done poorly creates category confusion. When grocery recommendations appeared in users'' restaurant feed without sufficient UI separation, session abandonment increased. The categories need the same app shell but different product modes — different discovery patterns, different delivery time expectations, different packaging norms. Getting the UX architecture right for expansion is as hard as the logistics."
        ],
        "metrics": [
          {"value": "$26", "label": "Average Order Value"},
          {"value": "3.1B", "label": "Total Trips (2024)"},
          {"value": "$74.6B", "label": "Gross Bookings"}
        ],
        "war_room": [
          {"role": "PM", "insight": "\"Should grocery be a tab in the existing app or a separate experience?\" Tab won: reduced friction, higher discovery. But the grocery UX — add to cart, substitutions, produce quality — is fundamentally different from restaurant ordering. Building a grocery mode within the same app shell without degrading the restaurant experience is the product challenge."},
          {"role": "ENG", "insight": "Menu data pipeline at scale. Thousands of restaurants with constantly changing menus, prices, and availability. Grocery adds SKU-level inventory that updates hourly. A stale menu is a canceled order is a support ticket is a churn risk. The pipeline ingests, normalizes, and serves this data with sub-second latency."},
          {"role": "DATA", "insight": "Cross-category uplift measurement. Does adding grocery increase total platform spend, or does it cannibalize restaurant orders? Early data: grocery users order restaurants 15% more often, not less. The categories are additive, not substitutive. This is the key insight that justifies the expansion investment."}
        ],
        "go_deeper": {
          "metric_definitions": [
            {"metric": "ARPU Expansion Rate", "definition": "Growth in revenue per existing user from upsell and new product categories — measures whether expansion is real or just dilutive", "how_to_calculate": "(ARPU now — ARPU before) ÷ ARPU before × 100", "healthy_range": ">10% annual from existing users is a healthy expansion signal"},
            {"metric": "Cross-Sell Rate", "definition": "Percentage of users who adopt a second product category within 90 days of adopting the first", "how_to_calculate": "Users with 2+ categories ÷ Total users × 100", "healthy_range": ">20% is a strong cross-product motion; below 10% means categories are siloed"},
            {"metric": "Net Revenue Retention (NRR)", "definition": "Revenue from an existing user cohort in period N+1 compared to period N, including expansion and churn", "how_to_calculate": "(Starting cohort revenue + expansion — churn) ÷ Starting cohort revenue × 100", "healthy_range": ">100% means expansion outpaces churn; >120% is exceptional for a consumer marketplace"},
            {"metric": "Category Adoption Sequence", "definition": "The order in which users adopt additional categories — tells you which expansion moves are natural and which require forcing", "how_to_calculate": "Track first category adopted, second category adopted, and time between, for a cohort of users", "healthy_range": "Natural sequences (restaurant to grocery) have short adoption gaps; forced sequences need marketing spend to bridge"}
          ],
          "system_design": {
            "components": [
              {"component": "Dormant User Reactivation Pipeline", "what_it_does": "Identifies users who have not placed an order in 30/60/90 days; triggers personalized win-back campaigns via push, email, and in-app surface when user re-opens app", "key_technologies": "Reactivation campaign economics depend entirely on correctly diagnosing why the user stopped ordering. A ''here is a discount'' message to a user who churned due to a bad delivery experience signals that Uber Eats did not notice or care about the problem."},
              {"component": "Post-Churn Diagnostic System", "what_it_does": "Analyzes last-order experience signals — late delivery, missing items, support contacts, low rating given — to infer churn cause and segment dormant users by root cause", "key_technologies": "Churn cause segmentation enables targeted resurrection messaging. A user whose last order was late gets an ''improved delivery reliability'' message. A user who likely switched to DoorDash gets a ''new restaurants near you'' message."},
              {"component": "Category Discovery Engine", "what_it_does": "Surfaces new categories (grocery, convenience, alcohol) to existing restaurant users at contextually appropriate moments — late-night browsing, Sunday morning, post-delivery browsing", "key_technologies": "The discovery timing matters as much as the product. Surfacing grocery to a user at midnight on a restaurant search is noise. Surfacing it on Sunday morning when the user opens the app without a specific craving is a conversion moment."}
            ],
            "links": [
              {"tag": "Strategy", "label": "ARPU Expansion: Category Sequencing and Wallet Share"},
              {"tag": "Metric", "label": "Net Revenue Retention as a Consumer Marketplace Metric"},
              {"tag": "System Design", "label": "Multi-Category Inventory Pipelines and Freshness SLAs"}
            ]
          },
          "failures": [
            {"name": "Churned Restaurants Post Commission-Cap Legislation (2020–2021)", "what": "When cities capped delivery platform commissions at 15% during COVID-19, UberEATS responded by adding consumer service fees to compensate, effectively passing the cap''s impact to consumers rather than absorbing it. Several restaurants that had left the platform due to high commissions found the commission structure still complex and non-transparent after the cap, reducing restaurant reactivation rates.", "lesson": "Restaurant reactivation after commission disputes requires a transparent, simplified fee structure. Restaurants that churned due to commission opacity will not reactivate if the new structure involves multiple fees that obscure the total take rate. Transparent total cost modeling must be the centerpiece of restaurant win-back offers."},
            {"name": "Post-Pandemic Frequency Decline with No Win-Back Strategy (2022)", "what": "As pandemic-era delivery frequency declined in 2022, with many consumers returning to in-restaurant dining, UberEATS had no structured win-back strategy for users whose order frequency had dropped below one per month. The platform sent generic promotional emails rather than personalized win-backs based on each user''s previously ordered restaurants. Churned cohort reactivation rates were below 3%.", "lesson": "Post-pandemic delivery frequency decline required a cohort-specific win-back approach: ''Your favorite restaurants are still on Uber Eats — order tonight and save $5'' combined with a specific past restaurant reminder dramatically outperforms generic discount emails for users who have drifted to in-person dining."},
            {"name": "Merchant App Abandonment — New Restaurant Onboarding Failure (2020)", "what": "UberEATS'' merchant-facing tablet app had a high abandonment rate among new restaurant partners who found the order management interface difficult to use during peak hours. Restaurants that experienced order management failures in their first week were significantly more likely to reduce their UberEATS priority or delist. There was no proactive merchant success outreach in the first 7 days.", "lesson": "Restaurant partner resurrection must begin within the first 7 days of activation, before a negative first-week experience crystallizes into a decision to deprioritize the platform. A Day 5 proactive check-in from a merchant success team that reviews first-week order data is a high-ROI retention investment."}
          ],
          "do_dont": {
            "dos": [
              "Segment dormant users by last-experience quality before designing win-back messages — a user whose last order had a missing item needs an apology and a remedy offer, not a generic discount code",
              "Time win-back push notifications to the day of week and time of day when the user historically ordered — triggering a message during the user''s habitual ordering window dramatically increases reactivation rates",
              "For subscription lapse due to payment failure, implement a grace period with a frictionless payment update flow before canceling benefits — involuntary churn is the most recoverable form of churn",
              "Measure resurrection success at 90 days post-reactivation, not 7 days — a user who reactivates to claim a discount and then goes dormant again was not resurrected",
              "Use restaurant catalog updates (''5 new restaurants opened near you since your last order'') as win-back messaging for users who churned due to catalog dissatisfaction — this is credible, relevant, and does not require discounting"
            ],
            "donts": [
              "Do not send win-back campaigns to users who have explicitly unsubscribed from marketing communications — violating communication preferences is a legal risk and permanently destroys any remaining brand goodwill",
              "Do not treat all dormant cohorts as equally valuable for resurrection investment; a user who was a weekly subscriber for 18 months deserves materially more win-back investment than a user who made a single promotional order",
              "Do not rely solely on discounts for resurrection — a user who churned because of consistent delivery reliability problems will churn again after the discount expires if the underlying experience has not improved",
              "Do not send resurrection emails during the dinner hour if courier supply in the user''s area is low at that time — re-engaging a dormant user into a bad experience is worse than not re-engaging them at all",
              "Do not ignore the competitive intelligence signal in dormant user data — users who churned to DoorDash in a specific market are revealing something about relative catalog quality or pricing that internal metrics may not surface"
            ]
          }
        },
        "practice_prompts": {
          "on_the_job": {
            "question": "You are analyzing Uber Eats user cohorts and discover that users who churned from Eats Pass subscriptions in Q3 had a 38% reactivation rate when shown a ''what has changed since you left'' narrative message, versus 21% for a discount offer. However, the discount group had a higher average first-order value post-reactivation ($42 versus $31). How do you interpret this data and what does it tell you about the two groups'' underlying motivations?",
            "guidance": "The ''what has changed'' group reactivated at higher rates because they are not primarily price-sensitive — they left due to a product concern they believed might have been addressed. They respond to credibility and improvement signals. The discount group had higher first-order values, suggesting they are more considered purchasers. Long-term retention investment should prioritize the narrative-responsive cohort.",
            "hint": "Message resonance is a proxy for underlying motivation. Users who respond to ''we have improved'' messaging are telling you their churn was experience-driven and recoverable. Users who only respond to discounts are telling you their relationship with the platform is transactional."
          },
          "interview_prep": {
            "question": "Post-COVID, Uber Eats delivery frequency dropped 25% as restaurants reopened. How do you build a win-back strategy for users who returned to dining in-person?",
            "guidance": "Post-COVID churn is not a negative experience failure — users left because dine-in opened, not because Uber Eats disappointed them. Win-back strategy: target re-engagement at contextual moments when delivery makes sense (working late, bad weather, large group); surface ''your favorites are ready to reorder'' notifications during those moments; reframe delivery as complementary to dining out, not a substitute. Avoid discounting as the primary lever — these users did not leave because of price.",
            "hint": "Tests whether you distinguish between different churn causes and design win-back strategies accordingly. Post-COVID churn is context-driven, not dissatisfaction-driven, and the win-back strategy must match."
          }
        },
        "transition": {
          "text": "Priya is deeply embedded. But the market around her is shifting. ↓"
        }
      }
    },
    {
      "id": "sustainability",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 8,
        "stage_name": "Sustainability",
        "question": "Will this product still matter in 3 years?",
        "narrative_paragraphs": [
          "Priya does not know it, but she is being fought over. DoorDash sends her $15-off emails every week. A new Austin-based app called LocalBite launches with lower fees and a ''support local'' angle. The Austin city council is debating capping delivery commissions at 15%. Her employer starts subsidizing office lunch catering three days a week. Every one of these threats is a real vector that could pull her away.",
          "DoorDash dominates the US with 67% market share. Uber Eats holds 23%. But Uber Eats leads globally — roughly 50% in Japan, 40% in Australia, strong in France and Spain. The real battlefield is not the US. It is the international TAM where Uber''s ride platform gives it a cross-sell advantage DoorDash cannot match.",
          "The existential threats are stacking: <strong>regulatory risk</strong> — commission caps at 15–20%, gig worker reclassification adding 20–30% to labor costs per delivery. <strong>Restaurant direct ordering</strong> — Toast, Square, and Shopify helping restaurants bypass the 25% commission with their own digital ordering. <strong>Autonomous delivery</strong> — if drones or autonomous vehicles cut delivery cost by 60%, whoever has the best routing technology wins regardless of current market share.",
          "The real moat is not the app. It is the three-sided marketplace: users attract restaurants, restaurants attract users, demand attracts drivers, drivers enable faster delivery, faster delivery retains users. Breaking into this loop from scratch is nearly impossible. This is why Uber Eats survives despite DoorDash''s US dominance — and why DoorDash has never gained meaningful international traction.",
          "Regulatory strategy has evolved from adversarial to pragmatic. Early Uber fought regulations. Modern Uber Eats proactively collects and remits applicable taxes, shares data with local governments on demand, and engages restaurant industry associations before legislation is proposed. Converting regulators from adversaries to revenue partners is a product and policy strategy, not just a legal one.",
          "The gig worker classification risk is the most structurally threatening issue. A shift to employee classification in the US and EU would increase per-delivery costs by an estimated 20–30%, requiring a fundamental repricing of the platform. Every product decision about how couriers are assigned, how earnings are calculated, and how work is structured has legal classification implications that product teams must understand."
        ],
        "metrics": [
          {"value": "23%", "label": "US Market Share"},
          {"value": "45+", "label": "Countries with Active Listings"},
          {"value": "67%", "label": "DoorDash US Share (Context)"}
        ],
        "war_room": [
          {"role": "PM", "insight": "\"If commission caps hit 15%, we need a new P&L for every affected market within 90 days.\" Options: raise service fees, accelerate ad platform revenue, restructure restaurant tiers (lower commission for high-volume partners), or exit unprofitable markets entirely."},
          {"role": "ENG", "insight": "Autonomous delivery integration. Sidewalk robots and drone delivery pilots are running in select markets. The technical challenge: routing algorithms that handle mixed fleets (human drivers plus robots plus drones), handoff protocols, and reliability SLAs for autonomous delivery."},
          {"role": "PM", "insight": "\"How do we prevent restaurant defection to direct ordering?\" Strategy: make Uber Eats so good at demand generation that leaving means losing 30%+ of orders. The restaurant cannot replicate Uber Eats'' user base, discovery algorithm, or delivery network — even with a Toast website."}
        ],
        "go_deeper": {
          "metric_definitions": [
            {"metric": "Gross Margin", "definition": "Percentage of revenue retained after direct delivery costs — the headline metric for platform economics", "how_to_calculate": "(Revenue — COGS) ÷ Revenue × 100", "healthy_range": ">50% marketplace; <30% signals structural problems in delivery economics"},
            {"metric": "Operational Leverage", "definition": "Revenue growth versus OPEX growth — measures whether the platform is becoming more or less efficient as it scales", "how_to_calculate": "Revenue growth % ÷ OPEX growth %", "healthy_range": ">1.5 means getting more efficient as you scale; <1.0 means overhead is outgrowing revenue"},
            {"metric": "Regulatory Compliance Cost as Percentage of Revenue", "definition": "Legal, trust, and safety costs as a share of revenue — measures the regulatory drag on growth", "how_to_calculate": "Compliance costs ÷ Total revenue × 100", "healthy_range": "<5% is lean; >15% signals regulatory drag that is structurally constraining the business"},
            {"metric": "Market Share by Geography", "definition": "Percentage of food delivery GMV captured in each major market — not a single global number", "how_to_calculate": "Uber Eats GMV in market ÷ Total market GMV × 100", "healthy_range": ">40% in a market creates compounding flywheel advantages; <20% may be below minimum viable density for unit economics"}
          ],
          "system_design": {
            "components": [
              {"component": "Courier Supply Management and Incentive Engine", "what_it_does": "Manages dynamic earnings guarantees, bonus tiers, and targeted incentives to recruit and retain couriers in specific geographic zones and time windows", "key_technologies": "Courier supply is the rate-limiting factor in delivery reliability. The incentive engine must balance the cost of guaranteed minimums against the revenue generated by the orders those couriers fulfill. Mispricing incentives creates either supply shortage or unsustainable unit economics."},
              {"component": "Restaurant Partner Economics Dashboard", "what_it_does": "Provides restaurants with real-time data on order volume, ratings, delivery performance, and estimated incremental revenue from Uber Eats versus dine-in baseline", "key_technologies": "Restaurants that understand their Uber Eats ROI are more likely to invest in platform-specific optimizations. Restaurants that feel exploited by commission rates raise menu prices or delist, which degrades the consumer catalog and starts a trust spiral."},
              {"component": "Regulatory Rules Engine", "what_it_does": "Configurable per-jurisdiction compliance logic: commission caps, driver classification rules, night delivery restrictions, alcohol delivery age verification requirements", "key_technologies": "One codebase managing hundreds of rule sets across 45+ countries. Non-compliant operations in a jurisdiction trigger listing suppression and courier dispatch blocks. Compliance is a product feature, not an operations afterthought."}
            ],
            "links": [
              {"tag": "Strategy", "label": "Three-Sided Marketplace Moats: Why the Flywheel Compounds"},
              {"tag": "Metric", "label": "Market Share Below Minimum Density Threshold: When to Exit"},
              {"tag": "System Design", "label": "Multi-Jurisdiction Regulatory Rules Engines"}
            ]
          },
          "failures": [
            {"name": "POS Integration Quality Problems (2018–2020)", "what": "UberEATS'' integration with restaurant POS systems (Square, Toast, Olo) was unreliable — order sync failures caused double-orders, missed items, and cancellation spikes. Restaurants using POS integrations had materially higher error rates than those using the UberEATS tablet. The POS integration ecosystem was under-resourced and poorly tested, with no automatic failover when sync failed.", "lesson": "Restaurant tech ecosystem integrations that fail silently cause customer-facing order errors that are attributed to the restaurant, not the platform. POS integration reliability requires dedicated quality assurance, automatic failover mechanisms, and real-time error monitoring before the integration is promoted as a restaurant onboarding recommendation."},
            {"name": "Uber Eats for Business Corporate Dashboard Gaps (2019–2021)", "what": "UberEATS for Business launched targeting corporate meal programs, but the corporate dashboard had significant gaps: no multi-location management, limited employee spending controls, and no budget period management. Corporate administrators at companies with multiple offices could not manage the product without manual workarounds. DoorDash for Work and Grubhub Corporate captured enterprise contracts that UberEATS lost due to feature gaps.", "lesson": "B2B product ecosystem components require enterprise-grade administrative features from day one: multi-location management, spend controls, approval workflows, and budget period management. A consumer-grade admin experience for a corporate product drives immediate disqualification in enterprise evaluations."},
            {"name": "Grocery Partner Inventory Sync Quality (2021–2022)", "what": "When UberEATS integrated with grocery partners in 2021, inventory sync reliability was poor — out-of-stock items frequently appeared as available, leading to substitution or cancellation disappointment at delivery. Grocery users had order accuracy complaints 3x higher than restaurant users.", "lesson": "Grocery delivery ecosystem integration requires real-time inventory sync with partner warehouse management systems, not batch-updated catalog feeds. The fundamental operational difference between grocery (high out-of-stock probability) and restaurant delivery (freshly prepared, in-stock) requires different integration standards and accuracy SLAs."}
          ],
          "do_dont": {
            "dos": [
              "Model the three-sided marketplace as an ecosystem with interdependencies — a commission increase that extracts more from restaurants today will raise menu prices, reduce consumer conversion, reduce order volume, reduce courier earnings, and reduce courier supply in a compounding negative cycle",
              "Build restaurant partner dashboards that show the counterfactual — ''your Uber Eats orders represent X% incremental revenue beyond your in-store baseline'' — this reframes the commission as a percentage of incremental revenue rather than a tax on total revenue",
              "Use geographic courier density as a leading indicator for market health, not lagging indicators like delivery time or customer complaints — courier supply drops precede delivery time increases by 2–3 weeks",
              "Engage regulators proactively with data sharing before legislation is proposed — converting governments from adversaries to revenue partners is cheaper and more durable than fighting regulation after it passes",
              "Monitor the ratio of Uber Eats menu prices to in-store prices for restaurants in each market as a platform health metric; intervene with commission renegotiation before the gap reaches a consumer-perceptible threshold"
            ],
            "donts": [
              "Do not treat courier supply as a purely financial lever — couriers are the human face of the Uber Eats brand at the moment of truth; platform reputation is built or destroyed in that final delivery interaction",
              "Do not ignore the compounding effect of market density problems — when delivery times increase, fewer consumers order, which reduces courier earnings, which reduces courier supply, which further increases delivery times; this spiral is very hard to reverse once established",
              "Do not set commission rates as a global policy without market-specific analysis — restaurant margins vary dramatically by cuisine type and format; a single commission rate is a blunt instrument that hurts small restaurants most",
              "Do not measure platform health solely through GMV growth — a platform can grow GMV while simultaneously degrading the experience for all three sides through price increases and quality decline",
              "Do not resolve consumer complaints about high menu prices by offering consumer discounts funded by Uber Eats — this is a short-term patch that increases platform subsidy costs without addressing the underlying commission-driven price inflation"
            ]
          }
        },
        "practice_prompts": {
          "on_the_job": {
            "question": "Uber Eats is facing regulatory pressure in three major European cities to cap delivery platform commissions at 20% from the current 27%. Your economics team estimates this would reduce contribution margin by 35% in those markets. How do you respond from a product strategy perspective, and what levers do you have beyond commission rates to maintain platform profitability?",
            "guidance": "A commission cap is an external constraint that resets the business model assumptions. Three product strategy tracks: (1) accelerate advertising revenue (restaurant sponsored placements, homepage promotions) which is not covered by commission caps; (2) increase consumer-side fees (service fee, Uber One subscription) to compensate for reduced restaurant-side revenue; (3) invest in operational efficiency (better courier routing, reduced support contacts) to reduce cost per order.",
            "hint": "Commission cap regulation is a forcing function for revenue model diversification. Platforms over-indexed on a single revenue stream (restaurant commission) are most vulnerable. The product response is to accelerate the shift to multi-stream monetization — advertising, subscriptions, and consumer fees — that was already strategically desirable before the regulation."
          },
          "interview_prep": {
            "question": "Uber Eats courier earnings vary widely by market — $18/hour in San Francisco, $10/hour in Phoenix. This affects courier supply, which affects delivery speed, which affects consumer satisfaction. How do you think about this as a product problem?",
            "guidance": "Courier earnings are a product input, not just an operations cost. Low courier earnings create: supply shortage (fewer active couriers means longer pickup times); quality degradation (fewer experienced couriers means more errors); consumer satisfaction damage (slow delivery turns into negative reviews and churn). The product response: create a market health dashboard that tracks courier earnings, supply hours, and delivery time together. When market health degrades, trigger a market intervention before it shows up in consumer NPS.",
            "hint": "Tests whether you understand that marketplace health is a product responsibility, not just an operations one. Strong candidates propose a feedback loop system that connects supply health metrics to product interventions."
          }
        },
        "transition": {
          "text": "Priya uses Uber for rides, Eats for food, and just started ordering groceries. She is not using an app anymore — she is inside an ecosystem. ↓"
        }
      }
    },
    {
      "id": "ecosystem",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 9,
        "stage_name": "Ecosystem",
        "question": "Has the product become bigger than itself?",
        "narrative_paragraphs": [
          "It has been a year. Priya takes an Uber to a restaurant for date night and earns Uber Cash. She orders Uber Eats for a team lunch and her company''s expense system auto-categorizes it. She uses her Marriott Bonvoy points to pay for delivery on vacation. She orders groceries on Sunday morning and gets 10% off because she has Uber One. She is not choosing Uber Eats over DoorDash anymore. She is not making a decision at all.",
          "Users who interact with 3 or more Uber products — Rides plus Eats plus Grocery — churn at one-quarter the rate of single-product users. The data team is building a ''platform depth'' score that predicts churn risk based on ecosystem engagement, and routing at-risk users to cross-product promotions before they drift. Each additional product layer roughly halves the churn rate of the previous one.",
          "Uber One is the glue. The cross-product subscription is the mechanism that converts separate app relationships into a unified platform relationship. A user who receives delivery fee waivers on Eats AND Uber Cash on rides has switching costs that span two separate purchase behaviors. To leave, they would need to find a replacement for both simultaneously — a much higher bar than switching delivery apps.",
          "The restaurant technology layer adds a B2B moat behind the consumer product. When a restaurant depends on Uber Eats'' POS integration, demand analytics, and delivery logistics to run their delivery business, the switching cost is not just lost demand — it is lost tooling. Restaurant partners using Uber Eats'' infrastructure for order management have near-zero churn because the cost of migration is operational, not just economic.",
          "The ecosystem model changes how you think about competitive threats. A competitor can outbid Uber Eats on commission rates for a restaurant. They cannot simultaneously offer that restaurant a replacement POS integration, demand analytics dashboard, and corporate meal program. The more layers of the ecosystem a partner uses, the harder it is to displace the platform with a single competing offer.",
          "A product is vulnerable. An ecosystem is defensible. Uber Eats stopped competing on delivery speed a long time ago. Now it competes on how deeply embedded it is in users'' wallets, companies'' expense systems, loyalty programs, and restaurant operations. <strong>Switching would mean unwinding a dozen connections, not just downloading a different app.</strong>"
        ],
        "metrics": [
          {"value": "1/4", "label": "Churn Rate (3+ Products vs. 1)"},
          {"value": "~35%", "label": "Eats Subscribers Using Rides"},
          {"value": "55%", "label": "Target Cross-Product Usage"}
        ],
        "war_room": [
          {"role": "ENG", "insight": "Ecosystem engineering is API-first. Restaurant POS integrations, corporate expense APIs, loyalty point interchange protocols, unified identity across Uber products. The challenge: make Uber Eats interoperable with everything. This is platform engineering, not feature engineering."},
          {"role": "PM", "insight": "\"Uber One needs to span Rides plus Eats plus Grocery as a single value prop.\" Cross-product usage rate is the KPI: what percentage of Eats subscribers also use Rides? Current: ~35%. Target: 55% within 12 months. Every cross-product user is dramatically harder to churn."},
          {"role": "PM", "insight": "Restaurant technology platform: POS integration, menu management, demand analytics, delivery logistics. When a restaurant depends on Uber Eats'' infrastructure to run their delivery business, the switching cost is not just demand — it is tooling. This is the B2B moat behind the consumer product."},
          {"role": "DATA", "insight": "Cross-ecosystem stickiness measurement. Users who interact with 3+ Uber products churn at 1/4 the rate of single-product users. The data team is building a platform depth score that predicts churn risk based on ecosystem engagement and routes at-risk users to cross-product promotions."}
        ],
        "go_deeper": {
          "metric_definitions": [
            {"metric": "Platform Depth Score", "definition": "Composite measure of how many Uber products and features a user actively uses — the leading indicator for both LTV and churn", "how_to_calculate": "Weighted sum of: active Uber products used (Rides, Eats, Grocery), Uber One subscription status, third-party integrations (loyalty, corporate), notification opt-in", "healthy_range": "Each additional product layer roughly halves the churn rate; a 3-product user is 4x less likely to churn than a 1-product user"},
            {"metric": "API / Platform Revenue Share", "definition": "Percentage of total revenue from third-party ecosystem integrations — measures platform extensibility", "how_to_calculate": "Partner-driven revenue ÷ Total revenue × 100", "healthy_range": ">20% is a healthy two-sided platform; below 5% means the platform is not generating ecosystem leverage"},
            {"metric": "Cross-Product Usage Rate", "definition": "Percentage of Uber Eats subscribers who actively use at least one other Uber product", "how_to_calculate": "Eats subscribers with active Rides/Grocery usage ÷ Total Eats subscribers × 100", "healthy_range": ">50% signals genuine super-app behavior; below 30% means Uber One is functioning as a single-product subscription, which is competitively fragile"},
            {"metric": "Restaurant Partner NPS", "definition": "Net Promoter Score from restaurant partners — the supply-side health metric that predicts catalog quality", "how_to_calculate": "% Promoter restaurants — % Detractor restaurants from partner survey", "healthy_range": ">40 is good; a declining restaurant NPS is an early warning signal 2–3 quarters before catalog quality degrades visibly to consumers"}
          ],
          "system_design": {
            "components": [
              {"component": "Three-Sided Marketplace Compounding Engine", "what_it_does": "The core platform mechanic: more couriers produce faster delivery, which drives more consumer orders, which drives more restaurant revenue, which attracts more restaurant partners, which attracts more consumers, which attracts more couriers", "key_technologies": "Every product decision in a three-sided marketplace must be evaluated on its impact to all three sides simultaneously. A decision that optimizes for one side while degrading another breaks the compounding flywheel and is ultimately self-defeating."},
              {"component": "Unified Identity and Cross-Product Benefit Layer", "what_it_does": "Maintains a single user identity across Uber Rides, Uber Eats, and Grocery; delivers cross-product benefits (Uber Cash, Uber One discounts) seamlessly across all surfaces", "key_technologies": "This is the technical foundation of the super-app strategy. Without unified identity, cross-product benefits require manual linking, which most users never do. The product decision: how much friction is acceptable in the linking flow versus how much auto-linking risks privacy concerns."},
              {"component": "Restaurant Technology Platform (POS, Analytics, Order Management)", "what_it_does": "Provides restaurants with POS integration, real-time demand analytics, menu management tools, and delivery logistics infrastructure — embedding Uber Eats into restaurant operations beyond just delivery", "key_technologies": "When a restaurant''s daily operations depend on Uber Eats'' tooling, the platform switching cost becomes operational rather than economic. This is the B2B moat that consumer marketplaces rarely build."}
            ],
            "links": [
              {"tag": "Strategy", "label": "Platform vs. Product: When Does an App Become an Ecosystem?"},
              {"tag": "Metric", "label": "Platform Depth Score as a Churn Leading Indicator"},
              {"tag": "System Design", "label": "Super-App Architecture: Unified Identity Across Products"}
            ]
          },
          "failures": [
            {"name": "Cloud Kitchen Investment Underperformance (2019–2021)", "what": "UberEATS invested in virtual restaurant and ghost kitchen concepts, including partnerships with cloud kitchen operators and first-party virtual brand development. The investments consistently underperformed — virtual restaurant brands built exclusively for UberEATS had high CAC (customers had no brand pre-awareness), and ghost kitchen economics required high order volumes per kitchen that were difficult to achieve in most markets. Most virtual brands were discontinued by 2021.", "lesson": "Ghost kitchen and virtual brand strategies require a customer acquisition model that does not depend on discovery in a delivery app where established brands have massive awareness advantages. Virtual brands need either viral social media presence or aggressive paid acquisition to overcome the discovery gap — neither of which is sustainable at ghost kitchen margins."},
            {"name": "Shared Driver Pool Strategy Creating Supply Conflicts (2016–2020)", "what": "Uber''s strategy of using the same driver supply pool for both rides and food delivery created chronic supply-demand imbalances. During high-demand ride periods (concerts, New Year''s Eve), delivery drivers switched to rides, causing delivery supply shortages. The shared pool strategy prevented both products from optimizing their respective supply requirements.", "lesson": "Multi-product platforms that share supply-side resources between products with different quality requirements and demand curves must segment supply pools by product specialization as each product reaches scale. Dedicated delivery drivers outperform cross-platform drivers on all food delivery quality metrics."},
            {"name": "Late Move to First-Party Grocery Dark Stores (2021)", "what": "DoorDash built DashMart (its own dark stores for 15–30 minute convenience delivery) in 2020, establishing a first-party grocery capability before UberEATS. UberEATS relied entirely on third-party grocery partnerships, which had lower margin and inventory accuracy. By the time UberEATS considered building its own dark stores, DashMart had 25+ locations and was generating customer loyalty from ultrafast delivery that UberEATS could not match through partner-only grocery.", "lesson": "Convenience delivery at 15–30 minutes requires owned dark store infrastructure — third-party grocery partnerships cannot achieve the speed or inventory control required for this value proposition. Strategic decisions to remain asset-light in a category where owned assets create a differentiated speed advantage should be revisited when the speed gap becomes a competitive moat for the first mover."}
          ],
          "do_dont": {
            "dos": [
              "Evaluate every major product decision through a three-sided lens: ask how this changes the experience and economics for couriers, restaurants, and consumers simultaneously before approving any roadmap initiative",
              "Invest in platform transparency tools that show all three sides of the marketplace how the platform is performing — partners who trust the platform invest in it",
              "Treat dark kitchen infrastructure as a market-filling tool rather than a margin-expansion tool — use ghost kitchens to address cuisine category gaps in specific markets, not to compete directly with existing restaurant partners",
              "Build regulatory strategy into product design from the beginning in new market entries — designing courier workflows with the assumption of future employee classification requirements is far cheaper than retrofitting after regulation passes",
              "Measure platform health through net promoter score across all three sides (consumer NPS, restaurant partner NPS, courier satisfaction score) and treat a decline in any one side as a platform-level emergency, not a segment-level issue"
            ],
            "donts": [
              "Do not allow short-term revenue extraction from any one side of the marketplace to compound without monitoring the second-order effects on the other two sides — the three-sided flywheel can spin in reverse",
              "Do not treat the courier workforce as a commodity input in the unit economics model — courier experience quality directly determines supply reliability, which determines delivery speed, which determines consumer satisfaction",
              "Do not expand the platform into adjacent categories faster than the core courier supply infrastructure can support without degrading the restaurant delivery experience that anchors the platform",
              "Do not cede regulatory strategy entirely to the legal and policy team — product decisions about how couriers are assigned, how earnings are calculated, and how work is structured have direct legal classification implications that product PMs must understand",
              "Do not underestimate the compounding advantage of a local density moat — in markets where Uber Eats has achieved 60%+ market share, the flywheel is self-sustaining; the strategic priority is different from markets at 20% share, and the same product playbook will not work in both"
            ]
          }
        },
        "practice_prompts": {
          "on_the_job": {
            "question": "It is 2027. A well-funded competitor has entered 10 of your top US markets with 12% restaurant commission (versus your 27%), a $3.99 flat delivery fee, and all couriers classified as employees (funded by a $500M VC raise). In 6 months, they have captured 15% market share in those markets. How does Uber Eats respond?",
            "guidance": "This is a direct attack on the restaurant partner side of the three-sided marketplace. Do not engage in a commission rate war that destroys your own economics. Short term: compete on the consumer experience advantages your scale provides — faster delivery from denser courier network, broader catalog, Uber One subscription. Medium term: accelerate multi-stream revenue (advertising, subscriptions) that reduces dependence on commission rates. Long term: model whether the competitor''s employee classification unit economics are sustainable past the VC runway.",
            "hint": "The appropriate response to a subsidized competitor is rarely to match their pricing — that plays into their strategy of forcing you to degrade your own economics. Compete on the dimensions your scale advantages make defensible: delivery speed, catalog depth, and cross-product subscription value. Wait for the subsidy to expire."
          },
          "interview_prep": {
            "question": "DoorDash has 60%+ US market share, Uber Eats has 25%. Both are historically unprofitable. What is Uber Eats'' platform strategy to achieve sustainable unit economics without ceding further share?",
            "guidance": "The path to unit economics requires reducing the per-order subsidy: increasing order value (larger baskets, premium restaurant mix), increasing delivery efficiency (route density), or finding revenue beyond the delivery fee (advertising, data). Uber Eats'' unique asset is Uber''s existing driver supply network and Uber One cross-sell. Platform strategy: optimize for high-density urban markets where delivery efficiency is achievable; cede low-density suburban markets where per-order economics will never work; build the restaurant advertising business aggressively (restaurant ads have 80%+ margin versus negative delivery margin); use Uber One to create a subscriber base that subsidizes volume growth.",
            "hint": "Tests whether you can apply platform economics to a marketplace with historically negative unit economics. Strong candidates identify geographic segmentation and high-margin revenue diversification (ads) as the path to sustainability."
          }
        },
        "transition": {
          "text": "Priya started as a tired data engineer with an empty fridge. Nine stages later, she orders 2.5 times a week, refers friends, buys groceries, and earns loyalty points across an ecosystem she would need real effort to leave. ↓"
        }
      }
    },
    {
      "id": "closing",
      "layout": "aarrr_closing",
      "content": {
        "headline": "The Full Picture",
        "summary": "Priya started as a tired woman with an empty fridge. Nine stages later, she is a subscriber who orders 2.5 times a week, refers friends, buys groceries, and earns loyalty points across an ecosystem she would need real effort to leave. That transformation was not luck. It was a product machine — designed, built, and iterated by PMs debating checkout psychology, engineers optimizing ETA models, data scientists measuring churn cadences, and ops teams matching drivers to moments that matter. The unit economics of food delivery are genuinely hard — contribution margins are thin, competitive pressure is relentless, and regulatory risk is structural. What makes Uber Eats viable is not the delivery itself but everything built around it: the subscription that changes ordering behavior, the advertising platform that generates margin without logistics, the cross-product ecosystem that raises switching costs across an entire lifestyle. Understanding these nine stages is not academic. It is how you think about any product that turns a moment of need into a recurring business.",
        "cta_text": "Back to all autopsies",
        "cta_path": "/explore/showcase"
      }
    }
  ]'::jsonb
FROM autopsy_products p
WHERE p.slug = 'ubereats'
ON CONFLICT (product_id, slug) DO UPDATE SET
  sections = EXCLUDED.sections,
  read_time = EXCLUDED.read_time,
  title = EXCLUDED.title;
