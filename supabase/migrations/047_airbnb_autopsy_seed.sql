-- Migration 047: Airbnb Product Autopsy seed
-- Seeds autopsy_products + autopsy_stories for Airbnb AARRR deep-dive

INSERT INTO autopsy_products (
  slug, name, tagline, logo_emoji, cover_color, industry, paradigm,
  decision_count, is_published, sort_order
) VALUES (
  'airbnb',
  'Airbnb',
  'From one air mattress to the world''s largest hospitality platform',
  '✈️',
  '#FF5A5F',
  'Travel & Hospitality',
  'Two-sided marketplace',
  0,
  true,
  10
) ON CONFLICT (slug) DO UPDATE SET
  tagline        = EXCLUDED.tagline,
  logo_emoji     = EXCLUDED.logo_emoji,
  cover_color    = EXCLUDED.cover_color,
  industry       = EXCLUDED.industry,
  paradigm       = EXCLUDED.paradigm,
  is_published   = EXCLUDED.is_published;

INSERT INTO autopsy_stories (product_id, slug, title, read_time, sections, related_challenge_ids, sort_order)
SELECT
  p.id,
  'airbnb-decoded',
  'Airbnb Decoded',
  '20 min read',
  '[
    {
      "id": "hero",
      "layout": "aarrr_hero",
      "content": {
        "product_name": "Airbnb",
        "tagline": "Follow one user from her first weekend trip booking to becoming a regular traveler who also lists her own spare room",
        "meta": "Product Autopsy · 9 Stages · ~20 min read",
        "accent_color": "#FF5A5F"
      }
    },
    {
      "id": "acquisition",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 1,
        "stage_name": "Acquisition",
        "question": "Where do they come from — and at what cost?",
        "narrative": "Anika, a 29-year-old product designer in Portland, searches for \"cabin near Cannon Beach Oregon\" on Google and finds Airbnb through organic search. This is how Airbnb gets ~60% of its traffic — through 10M+ SEO landing pages, one for every city, neighborhood, and property combination. Social proof from friends and influencers drives the rest. Airbnb''s design philosophy is simple: let them fall in love first, ask for commitment second. The signup wall appears only at the highest-intent moment — the booking button.",
        "metrics": [
          { "value": "~60%", "label": "Organic/Direct Traffic" },
          { "value": "$15–20", "label": "Blended CAC" },
          { "value": "10M+", "label": "SEO Landing Pages" }
        ],
        "war_room": [
          { "role": "ENG", "insight": "City-specific landing pages auto-generated at scale with unique title tags, meta descriptions, and structured data" },
          { "role": "PM", "insight": "Gating browsing behind sign-up was tested and killed — it caused a 40% reduction in listing views" },
          { "role": "DATA", "insight": "Multi-touch attribution across a 30-day window to understand actual channel impact vs. last-click" },
          { "role": "DESIGN", "insight": "Professional photos are critical; Airbnb built a free photography program and AI photo quality scoring" }
        ],
        "what_didnt_work": [
          "Cereal box stunt overreliance (2008) — media buzz but no sustainable channel beyond the PR moment",
          "Craigslist spam integration backlash — unsanctioned bot led to reputational damage and burned a key distribution channel",
          "Google Adwords overbidding (2012) — broad keyword spend with low conversion rates; wasted significant early budget"
        ]
      }
    },
    {
      "id": "activation",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 2,
        "stage_name": "Activation",
        "question": "Did the product actually deliver for them?",
        "narrative": "Anika books the A-frame cabin. Before payment, she sees trust signals: 247 reviews averaging 4.96 stars, a \"Guest Favorite\" badge, host Sarah with Superhost status, 98% response rate, 3 years hosting. The checkout is engineered: \"You won''t be charged yet\" reassurance, transparent fee breakdown, flexible cancellation visible upfront. Between booking and arrival: check-in instructions, personalized recommendation guide, automated trip details with weather and dining. Upon arrival, everything works. She thinks: \"This is better than a hotel.\" That''s true activation — not the booking, but that moment.",
        "metrics": [
          { "value": "68%", "label": "Rebook Rate (4.5+ 1st Stay)" },
          { "value": "22%", "label": "Rebook Rate (<4.0 1st Stay)" },
          { "value": "~20 min", "label": "Avg Host Response Time" }
        ],
        "war_room": [
          { "role": "PM", "insight": "\"You won''t be charged yet\" line under Reserve button increased checkout completion by 8%" },
          { "role": "ENG", "insight": "NLP-based listing accuracy detection flags \"not as pictured\" complaints and surfaces them in host quality scoring" },
          { "role": "DATA", "insight": "First-Stay NPS is the leading indicator of lifetime value — a 4.5+ first stay predicts 68% rebook rate vs. 22% for sub-4.0" },
          { "role": "DESIGN", "insight": "Transparent fee breakdown increases trust even with price shock; hiding fees increases abandonment" }
        ],
        "what_didnt_work": [
          "Poor early photography (2009) — sub-2% conversion until founders personally hired a photographer for listings",
          "Overly complex booking request flow (2011) — 3-step async process with 24-hour host approval window caused 60%+ abandonment",
          "Mandatory ID verification friction spike (2013) — dropped new-guest activations by 15% before UX was smoothed"
        ]
      }
    },
    {
      "id": "engagement",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 3,
        "stage_name": "Engagement",
        "question": "Is the product earning repeated attention?",
        "narrative": "Anika opens Airbnb not to book, but to browse. She scrolls treehouses, yurts, houseboats, and saves listings to wishlists — \"Someday,\" \"Dream Trips,\" \"Pacific NW Cabins.\" This is Airbnb''s engagement secret: aspirational browsing. Users engage like Pinterest even with no trip planned. Average session: 6 minutes. She discovers the \"I''m Flexible\" search — destination-agnostic, just dates and interests. Then a notification: \"Fire Lookout in Montana is $30/night cheaper in April. Dates you saved are available.\" She books immediately. Wishlists aren''t just bookmarks — they''re investment without purchase, micro-commitments that build switching costs before a booking ever happens.",
        "metrics": [
          { "value": "45%", "label": "Users with Wishlists" },
          { "value": "6 min", "label": "Avg Session Time" },
          { "value": "18%", "label": "Wishlist-to-Book Rate (6 months)" }
        ],
        "war_room": [
          { "role": "PM", "insight": "Only 12% of wishlist users receive price-drop notifications — a major untapped engagement lever" },
          { "role": "ENG", "insight": "Category icons are algorithmically curated per user based on location, season, and browsing history" },
          { "role": "DATA", "insight": "Wishlist users convert at 18% over 6 months — a stronger leading revenue indicator than search volume" },
          { "role": "DESIGN", "insight": "Category-first home screen (vs. search-first) increased browsing sessions by 25% and non-searching engagement by 40%" }
        ],
        "what_didnt_work": [
          "2011 San Francisco ransacking incident — slow CEO response led to host trust collapse and temporary supply drop",
          "Lack of post-stay re-engagement (2013–2014) — generic \"plan your next trip\" emails had near-zero effectiveness",
          "Superhost program devaluation (2016) — lowered qualification thresholds by 40%, diluting the badge''s meaning for guests"
        ]
      }
    },
    {
      "id": "monetization",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 4,
        "stage_name": "Monetization",
        "question": "Is the business model real and sustainable?",
        "narrative": "Anika books the fire lookout: $165/night × 3 nights = $495. At checkout the total is $704.70 — a 42% markup. Breakdown: $495 nightly, $75 cleaning fee, $85.50 service fee (14% of subtotal), $49.20 taxes. The host receives $480.15 after a 3% host fee, plus the cleaning fee — $555.15 total. Airbnb keeps $100.35 (guest fee + host fee). The split-fee model means neither side bears the full cost alone, and both feel they got a reasonable deal. But the gap between the advertised nightly rate and the actual total remains Airbnb''s biggest UX controversy. The business underneath: asset-light, 75%+ gross margins, ~$4.8B free cash flow on $11.1B revenue in 2024.",
        "metrics": [
          { "value": "~15–17%", "label": "Total Take Rate" },
          { "value": "$73.7B", "label": "Gross Booking Value (2024)" },
          { "value": "75%+", "label": "Gross Margin" }
        ],
        "war_room": [
          { "role": "PM", "insight": "Total price transparency vs. nightly display is an ongoing A/B — showing total price in search results is now being rolled out" },
          { "role": "ENG", "insight": "Smart Pricing retrains weekly, incorporating 70+ features including local events, seasonality, and competitor pricing" },
          { "role": "DATA", "insight": "Price elasticity varies dramatically: budget travelers ~-1.5, luxury travelers ~-0.3 — different pricing strategies needed per segment" },
          { "role": "OPS", "insight": "Cleaning fees are the #1 user complaint — hosts raising fees to $200+ on $100/night listings visibly damaged conversion rates" }
        ],
        "what_didnt_work": [
          "Airbnb for Business slow monetization (2015–2017) — lacked enterprise billing and expensing integration for 2 years after launch",
          "Cleaning fee backlash (2021–2022) — hosts raising fees to $200+ on cheap listings damaged both conversion and brand perception",
          "Experiences underperformance (2016–2019) — <1% of revenue despite significant marketing spend; quality control issues"
        ]
      }
    },
    {
      "id": "retention",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 5,
        "stage_name": "Retention",
        "question": "Do users genuinely need this — or just like it?",
        "narrative": "A year in, Anika has 5 completed stays, detailed bilateral reviews, 26 saved listings across 4 wishlists, verified ID, saved payment, and a guest profile with host reviews. She could switch to Vrbo or Booking.com. She won''t. The switching cost isn''t financial — it''s informational. Her reviews exist only on Airbnb. Her wishlists exist only on Airbnb. Her host relationships and verified status exist only on Airbnb. Switching means starting from zero trust. Every review she writes, every wishlist she creates, increases the cost of leaving. When she has a bad experience — a \"cozy loft\" that turned out to be a converted garage — support delivers a full refund in 24 hours and a $100 coupon. She rebooks the next month. Users who get resolution within 24 hours rebook at 2× the rate of those who wait 72+ hours.",
        "metrics": [
          { "value": "70%+", "label": "Repeat Booker Rate" },
          { "value": "$1,200", "label": "Avg Annual Spend" },
          { "value": "~60%", "label": "Bookings from Repeat Users" }
        ],
        "war_room": [
          { "role": "PM", "insight": "5+ reviews written = +35% 12-month retention; 3+ wishlists = +28%; verified ID + saved payment = +22%" },
          { "role": "ENG", "insight": "Churn prediction model: wishlist activity decline is a stronger signal than booking gaps — users who stop browsing are already churning" },
          { "role": "DATA", "insight": "Superhost stay on first trip increases second-booking rate by 40% — first-stay quality is the highest-leverage retention lever" },
          { "role": "OPS", "insight": "AirCover ($3M host liability, $1M damage protection) makes guests 30% more likely to book higher-priced listings and try new destinations" }
        ],
        "what_didnt_work": [
          "Referral credit abuse (2014–2015) — fraudulent credits exploited with fake accounts; required device fingerprinting overhaul",
          "Host referral underinvestment (2013) — focused on guest referrals while host supply acquisition remained expensive",
          "Referral notification fatigue (2016) — repeated cross-channel asks led to a 12% opt-out rate increase"
        ]
      }
    },
    {
      "id": "referral",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 6,
        "stage_name": "Referral",
        "question": "Does the product spread without paid marketing?",
        "narrative": "Travel is inherently social. At a dinner party, Anika shows the fire lookout listing: \"You have to stay here.\" She shares it via text. The listing itself is the referral. When was the last time someone excitedly shared their Hilton room? Never. But people constantly share Airbnb listings because they''re interesting — a treehouse, a cliffside villa, a converted train car. Stories worth telling. When Anika''s coworker Jen gets her referral link and books, Anika gets $20 travel credit. Airbnb''s cost: $60 — still cheaper than Google Ads. But the most underrated channel is organic social: when Anika shares a listing on iMessage, the preview card shows the property photo, star rating, and price. Designed to look like a travel recommendation, not an ad.",
        "metrics": [
          { "value": "~15–20%", "label": "Organic Social Acquisition" },
          { "value": "$60", "label": "Referral Credit CAC" },
          { "value": "25%", "label": "Better 12-mo Retention (referred users)" }
        ],
        "war_room": [
          { "role": "PM", "insight": "Listing preview cards must render perfectly on iMessage, WhatsApp, Instagram DMs, and Twitter — each has different OG tag requirements" },
          { "role": "ENG", "insight": "Deep linking to specific listings with platform-specific preview specs; universal links (iOS) + App Links (Android) + deferred deep linking" },
          { "role": "DATA", "insight": "Referred users have 25% better 12-month retention; fraud detection tracks device fingerprints and suspicious booking clusters" },
          { "role": "DESIGN", "insight": "Referral copy framing matters: \"Give $40, get $20\" outperforms \"Share and earn\" by 22% — generosity framing beats self-interest framing" }
        ],
        "what_didnt_work": [
          "China expansion (Aibiying 2015–2022) — never exceeded 1% market share; regulatory barriers, data localization, and domestic competition",
          "Latin America premature scaling (2014) — aggressive paid marketing before reliable payment infrastructure was in place",
          "Airbnb for Refugees execution gap (2017) — announced 100K refugees over 5 years; actual placements far below targets"
        ]
      }
    },
    {
      "id": "expansion",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 7,
        "stage_name": "Revenue Expansion",
        "question": "Can the business grow without just adding users?",
        "narrative": "Anika discovers Experiences: cooking class in Oaxaca, street art tour in Buenos Aires, pottery in Kyoto. She books a local wine tasting for her birthday — $55/person × 5 = $275. Airbnb takes 20%. Experiences are genius: a reason to open the app even when not traveling. Then she sees a banner: \"Your space could earn $1,100/month on Airbnb.\" Specific to her zip code and room type. She taps it. Onboarding in under 2 hours. First guest books within a week. She''s now earning $1,200/month hosting while spending $150/month as a guest. Eight percent of active guests become hosts within 2 years. Each new host adds 150+ available nights per year. Post-2020, remote work created a new use case: long stays now represent 20%+ of bookings, the fastest-growing segment.",
        "metrics": [
          { "value": "4M+", "label": "Active Hosts" },
          { "value": "8%", "label": "Guest-to-Host Conversion (2yr)" },
          { "value": "20%+", "label": "Bookings from Long Stays (28+ nights)" }
        ],
        "war_room": [
          { "role": "PM", "insight": "Guest-to-host conversion is the highest-leverage growth loop — it adds supply and demand simultaneously from one user" },
          { "role": "ENG", "insight": "Long stays (28+ nights) require a parallel booking system with different rules — check-in flows, payment schedules, and cancellation policies all differ" },
          { "role": "DATA", "insight": "Experiences revenue per user is 40% incremental — it doesn''t reduce stay bookings, it adds on top" },
          { "role": "OPS", "insight": "Airbnb for Business targets $300B+ corporate travel market; the challenge is competing with established travel management companies (TMCs)" }
        ],
        "what_didnt_work": [
          "COVID-19 response (March 2020) — initially enforced cancellation policies, denied refunds; reversed under pressure; hosts bore $1B+ in losses",
          "Win-back email campaigns (2018) — generic messaging achieved <8% open rate and <1% reactivation",
          "Lapsed host re-activation (2019) — offered modest incentives (<$100 credits) that didn''t address the real barriers: regulatory and legal concerns"
        ]
      }
    },
    {
      "id": "sustainability",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 8,
        "stage_name": "Sustainability",
        "question": "Will this product still matter in 3 years?",
        "narrative": "Anika doesn''t see the battles, but they''re existential. Portland requires hosts to register and pay hotel taxes. Barcelona is banning short-term rentals entirely by 2028. New York City mandates host presence. Tokyo caps rentals at 180 nights per year. Amsterdam at 30 nights per year. The pattern everywhere: residents complain about housing costs, politicians blame short-term rentals, regulations follow. The hotel industry spends tens of millions lobbying. Anika receives a Portland letter: register as a short-term rental operator, pay a licensing fee, collect and remit lodging taxes. The overhead doubled — but Airbnb auto-collects and remits taxes in her city, which makes it manageable. Trust and safety costs Airbnb an estimated $500M+ per year. One bad host — a poorly lit \"design studio\" that was really a storage room with an air mattress — undermines trust for the entire neighborhood.",
        "metrics": [
          { "value": "$5B+", "label": "Hotel Taxes Collected Globally" },
          { "value": "$500M+", "label": "Trust & Safety Spend/yr" },
          { "value": "100K+", "label": "Cities with Active Listings" }
        ],
        "war_room": [
          { "role": "PM", "insight": "Proactive regulation strategy: collect and remit hotel taxes ($5B+ globally) — converts Airbnb from regulatory enemy to revenue partner for cities" },
          { "role": "ENG", "insight": "Regulatory Rules Engine: configurable per jurisdiction (Paris 120-night cap, NYC registration checks, Amsterdam 30-night limit)" },
          { "role": "DATA", "insight": "ML regulatory heat map predicts which markets face new regulations before they happen: housing price growth + Airbnb density + political sentiment signals" },
          { "role": "OPS", "insight": "Party prevention: IoT noise monitor integration + booking pattern classifier for under-25 guests without reviews" }
        ],
        "what_didnt_work": [
          "Reactive regulatory strategy (2015–2018) — fought battles after hostile legislation was proposed; $50M+ in legal/lobbying spend that proactive data-sharing could have avoided",
          "Airbnb Experiences quality control (2017–2018) — scaling caused consistency problems; NPS lagged core product by 20 points",
          "Open Homes platform fragmentation (2012–2017) — separate workflow, manual matching, and low adoption before being embedded into the main product"
        ]
      }
    },
    {
      "id": "ecosystem",
      "layout": "aarrr_stage",
      "content": {
        "stage_number": 9,
        "stage_name": "Ecosystem",
        "question": "Has the product become bigger than itself?",
        "narrative": "Two years later, something fundamental shifted. Anika''s relationship with Airbnb is no longer an app on her phone. She earns $1,200/month hosting her spare room. She uses PriceLabs for dynamic pricing via the Airbnb API. She uses a cleaning service she found on host forums for turnovers. She reviews her hosting stats every morning on a dashboard. She''s booked Experiences in 3 cities. She used Airbnb for Business for her team offsite. She co-manages a wishlist with her partner for their anniversary trip. She''s in two host community forums and attended a virtual Superhost meetup. She''s not using an app. She''s embedded in an ecosystem. Each additional layer of engagement cuts churn roughly in half — from 45% annual churn for a one-trip guest to just 5% for a host with integrated tools. Multi-layer users generate 3–5× more revenue than single-layer users.",
        "metrics": [
          { "value": "45% → 5%", "label": "Churn (1 layer → 4 layers)" },
          { "value": "3–5×", "label": "Revenue Multiplier (multi-layer)" },
          { "value": "100K+", "label": "Pro Hosts Using Integrated Tools" }
        ],
        "war_room": [
          { "role": "PM", "insight": "Platform Depth Score (layers of engagement) is the leading indicator for both churn and LTV — more valuable than any single usage metric" },
          { "role": "ENG", "insight": "Host Tools API: RESTful + webhooks for real-time events, OAuth2, tiered rate limiting — supports availability sync, pricing, automated messaging, multi-platform management" },
          { "role": "DATA", "insight": "Churn model: wishlist activity decline predicts churn 60 days earlier than booking gap signals — it''s a heartbeat metric" },
          { "role": "DESIGN", "insight": "Guest-to-host conversion prompts that show zip-code-specific earning estimates outperform generic CTAs by 3× — specificity drives action" }
        ],
        "what_didnt_work": [
          "IPO timing (2020) — early filing abandoned due to COVID; forced $2B raise at 10% senior notes distress rates before a December IPO",
          "Affordable segment neglect (2019–2022) — rising average daily rates and proliferating cleaning fees drove budget travelers to competitors; \"Rooms\" launched too late",
          "Third-party API instability (2015) — rate limits, sync issues, and double-bookings caused property managers to flee to Booking.com and Vrbo"
        ]
      }
    },
    {
      "id": "closing",
      "layout": "aarrr_closing",
      "content": {
        "headline": "The Full Picture",
        "summary": "Anika started as a product designer Googling weekend cabins. Nine stages later, she''s a host earning $14,000 a year, a repeat guest with five trips booked, a wishlist curator, an Experiences buyer, and an ecosystem participant who would need months to unwind her platform relationship. A product is replaceable. An ecosystem is defensible. Airbnb stopped competing on listings a long time ago. Now it competes on how deeply hosts depend on it for income, how deeply guests depend on it for trust, and how deeply both are connected to a network no competitor can replicate.",
        "cta_text": "Back to all autopsies",
        "cta_path": "/explore/showcase"
      }
    }
  ]'::jsonb,
  ARRAY[]::TEXT[],
  1
FROM autopsy_products p
WHERE p.slug = 'airbnb'
ON CONFLICT (product_id, slug) DO UPDATE SET
  sections  = EXCLUDED.sections,
  read_time = EXCLUDED.read_time,
  title     = EXCLUDED.title;
