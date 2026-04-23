import { AutopsyProduct, AutopsyChallenge, AutopsyProductDetail, AutopsyStory } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_PRODUCTS: AutopsyProduct[] = [
  {
    id: 'prod-notion-001',
    slug: 'notion',
    name: 'Notion',
    tagline: 'The all-in-one workspace that bet on blocks',
    logo_emoji: '\u{1F4DD}',
    logo_url: null,
    cover_color: '#191919',
    industry: 'Productivity',
    paradigm: 'Bottom-up SaaS',
    decision_count: 3,
    story_count: 1,
    is_published: true,
    sort_order: 1,
  },
  {
    id: 'prod-linear-001',
    slug: 'linear',
    name: 'Linear',
    tagline: 'The issue tracker that made speed a feature',
    logo_emoji: '\u26A1',
    logo_url: null,
    cover_color: '#5E6AD2',
    industry: 'Developer Tools',
    paradigm: 'Opinionated SaaS',
    decision_count: 3,
    story_count: 0,
    is_published: true,
    sort_order: 2,
  },
  {
    id: 'prod-airbnb-001',
    slug: 'airbnb',
    name: 'Airbnb',
    tagline: 'From one air mattress to the world\'s largest hospitality platform',
    logo_emoji: '✈️',
    logo_url: null,
    cover_color: '#FF5A5F',
    industry: 'Travel & Hospitality',
    paradigm: 'Two-sided marketplace',
    decision_count: 0,
    story_count: 1,
    is_published: true,
    sort_order: 10,
  },
]

const MOCK_NOTION_DETAIL: AutopsyProductDetail = {
  id: 'prod-notion-001',
  slug: 'notion',
  name: 'Notion',
  tagline: 'The all-in-one workspace that bet on blocks',
  logo_emoji: '\u{1F4DD}',
  logo_url: null,
  cover_color: '#191919',
  industry: 'Productivity',
  paradigm: 'Bottom-up SaaS',
  decision_count: 3,
  is_published: true,
  sort_order: 1,
  story_count: 1,
  decisions: [
    {
      id: 'dec-notion-001',
      product_id: 'prod-notion-001',
      sort_order: 1,
      title: 'Block-based editor over rich text',
      area: 'Core UX',
      difficulty: 'standard',
      icon: 'grid_view',
      screenshot_url: null,
      what_they_did:
        'Notion replaced the traditional document editor paradigm with a block-based system where every paragraph, image, table, and embed is a discrete, draggable block.',
      real_reasoning:
        'Blocks make content structurally composable. Pages can embed other pages, databases can filter blocks, and the same content atom can appear in multiple contexts. This unlocked the "second brain" use case at almost zero marginal cost.',
      principle: 'Structure enables composability',
      challenge_question:
        'A team is building a note-taking app. What should determine whether they adopt a block-based or rich-text editor approach?',
      challenge: {
        id: 'chal-notion-001',
        decision_id: 'dec-notion-001',
        challenge_id: null,
        context:
          'You are the PM for a new note-taking product targeting knowledge workers. Your eng lead says blocks are 3x harder to build than a standard rich-text editor. Your designer says users expect familiar word-processor UX. You need to choose an editing paradigm before the team starts building.',
        options: [
          {
            id: 'a',
            text: 'Build blocks -- composability is a long-term moat even if harder upfront',
            quality: 'best',
            explanation:
              'Correct tradeoff. The short-term cost is real but blocks unlock embedding, linking, and database views that rich-text cannot replicate structurally. This is exactly the bet Notion made.',
          },
          {
            id: 'b',
            text: 'Build rich-text first, migrate to blocks later once you have users',
            quality: 'plausible_wrong',
            explanation:
              'Migration from rich-text to blocks is extremely costly -- it requires re-parsing all existing content and retraining user muscle memory. This "build it later" approach rarely works for foundational architectural choices.',
          },
          {
            id: 'c',
            text: 'Use rich-text and differentiate on collaboration features instead',
            quality: 'surface',
            explanation:
              'Collaboration is table stakes in 2024. Choosing rich-text to save eng time while planning to win on collaboration is a weak competitive position -- you trade a structural moat for a feature race.',
          },
          {
            id: 'd',
            text: 'Survey users and let their preference decide the architecture',
            quality: 'plausible_wrong',
            explanation:
              'Users cannot reliably predict what they will want from an unfamiliar paradigm. Architecture decisions require product vision, not just user preference polls.',
          },
        ],
        insight:
          "Block-based architecture is an infrastructure decision that shapes what product futures are even possible. Notion's bet paid off because blocks enabled databases, linked mentions, and AI-block operations -- none of which rich-text could support natively.",
        principle: 'Structure enables composability',
      },
    },
    {
      id: 'dec-notion-002',
      product_id: 'prod-notion-001',
      sort_order: 2,
      title: 'Free personal tier with no time limit',
      area: 'Monetization',
      difficulty: 'warmup',
      icon: 'volunteer_activism',
      screenshot_url: null,
      what_they_did:
        'Notion offered a fully functional free tier for individual users with no expiration, betting that personal users would pull the product into organizations.',
      real_reasoning:
        'Individual knowledge workers are the primary evaluators of productivity tools even inside companies. By delighting individuals first, Notion created internal champions who pushed for team adoption and eventually paid seats.',
      principle: 'Land in individuals, expand to teams',
      challenge_question:
        'When should a B2B SaaS company offer a free individual tier versus going straight to team or company pricing?',
      challenge: {
        id: 'chal-notion-002',
        decision_id: 'dec-notion-002',
        challenge_id: null,
        context:
          'You are the growth PM at a project management SaaS targeting software teams. The CEO wants to go "enterprise-first" with no free tier to avoid support costs. Your data shows 70% of paid conversions come from users who discovered the product personally before pitching it to their manager.',
        options: [
          {
            id: 'a',
            text: 'Offer a free individual tier -- personal champions drive team adoption',
            quality: 'best',
            explanation:
              'Your own data validates this. When individuals discover value before organizational purchasing, a free personal tier is a growth mechanism, not just a cost center. This is the classic PLG (product-led growth) motion.',
          },
          {
            id: 'b',
            text: 'Go enterprise-first -- free tiers attract non-buyers and inflate support costs',
            quality: 'surface',
            explanation:
              'This ignores the 70% conversion signal in your own data. Enterprise-first works when buyers are centralized procurement teams, but for tools developers choose, the bottom-up motion is more efficient.',
          },
          {
            id: 'c',
            text: 'Offer a time-limited free trial instead -- captures urgency and limits freeloaders',
            quality: 'good_but_incomplete',
            explanation:
              'Time limits create urgency but also create friction for slow-evaluating users and destroy the "always available" positioning that makes champions reliable advocates. Works for high-ACV products, less so for bottom-up PLG.',
          },
          {
            id: 'd',
            text: 'Remove the free tier and reinvest budget in outbound sales',
            quality: 'plausible_wrong',
            explanation:
              'Outbound sales for a tool chosen by individual engineers is a mismatch between motion and buyer. You would be paying for sales cycles that currently happen organically via your free tier.',
          },
        ],
        insight:
          "Notion's free personal tier was a deliberate demand-generation mechanism -- every power user was a potential internal champion. The metric that justified the free tier was not revenue per free user, it was team conversion rate from personal accounts.",
        principle: 'Land in individuals, expand to teams',
      },
    },
    {
      id: 'dec-notion-003',
      product_id: 'prod-notion-001',
      sort_order: 3,
      title: 'Databases as a first-class citizen',
      area: 'Product Strategy',
      difficulty: 'advanced',
      icon: 'table_chart',
      screenshot_url: null,
      what_they_did:
        'Notion introduced inline databases -- tables, kanban boards, calendars, and galleries -- built on the same block system as documents, making structured and unstructured content interoperable.',
      real_reasoning:
        'Knowledge workers switch between Airtable, Trello, and Docs constantly because different tasks require different views of the same data. Notion collapsed these tools into one surface, dramatically reducing context-switching and tool sprawl.',
      principle: 'Different views, same data',
      challenge_question:
        'Notion extended its document editor to include databases. At what point should a product expand its core metaphor versus keeping it focused?',
      challenge: {
        id: 'chal-notion-003',
        decision_id: 'dec-notion-003',
        challenge_id: null,
        context:
          'Your note-taking app has strong retention among individual writers. Users frequently request spreadsheet-like features. Your team is split: half want to stay focused on writing, half want to expand into structured data to compete with Airtable. You have 6 months of runway for a major feature investment.',
        options: [
          {
            id: 'a',
            text: 'Add databases only if they can share the same block system -- interoperability is the differentiator',
            quality: 'best',
            explanation:
              'This is exactly the Notion insight. The value is not "we also have a database" -- it is "your document and your database live in the same block, so you can embed a filtered view inside a meeting note." Interoperability is the moat; a bolted-on database is just feature parity.',
          },
          {
            id: 'b',
            text: 'Stay focused on writing -- expanding to databases dilutes the brand',
            quality: 'good_but_incomplete',
            explanation:
              'Focus is valuable, but if users are already context-switching to Airtable from your product, you are not actually retaining their workflow -- just part of it. The "stay focused" instinct is right if the expansion is bolt-on; wrong if it deepens the core use case.',
          },
          {
            id: 'c',
            text: 'Build a separate database product and integrate via API',
            quality: 'surface',
            explanation:
              'Separate products mean separate adoption curves and separate context-switching -- exactly the problem you are trying to solve. API integration rarely achieves the seamlessness that makes the combined workflow valuable.',
          },
          {
            id: 'd',
            text: 'Partner with Airtable instead of building databases yourself',
            quality: 'plausible_wrong',
            explanation:
              "Partnerships for core workflow needs create dependency on a competitor's roadmap and pricing. If structured data is a retention need for your users, ceding that to a partner is a strategic risk, not a shortcut.",
          },
        ],
        insight:
          "Notion's database decision worked because databases were not a separate product -- they were a view type on the block system. The same data could appear as a table, kanban, calendar, or gallery without duplication. This is the architectural payoff of the block bet made in decision #1.",
        principle: 'Different views, same data',
      },
    },
  ],
  stories: [
    {
      id: 'story-notion-blocks-001',
      product_id: 'prod-notion-001',
      slug: 'notion-block-architecture',
      title: 'The block bet',
      read_time: '8 min read',
      sort_order: 1,
      created_at: '2024-01-15T00:00:00Z',
      related_challenge_ids: ['chal-notion-001'],
      sections: [
        {
          id: 's1',
          layout: 'fullbleed_cover',
          content: {
            label: 'Notion · Architecture Decision',
            headline: 'The block bet that changed productivity software',
            subline: 'In 2016, Notion chose to rebuild from scratch around a single, radical idea. Every piece of content — text, image, table, embed — is a block.',
            meta: '8 min read · Core Architecture',
          },
        },
        {
          id: 's2',
          layout: 'split_panel',
          content: {
            label: 'The problem',
            title: 'Rich text was everyone\'s answer. It was also a dead end.',
            paragraphs: [
              'Word processors had dominated document creation since the 1980s. By 2015, every serious note-taking app — Evernote, Google Docs, Bear — used the same underlying model: rich text. A stream of formatted characters with inline images.',
              'The model worked. Users understood it. Engineers knew how to build it. And it had one fatal flaw: you couldn\'t do anything with the content. Text was text. You couldn\'t turn a paragraph into a database row, or filter your meeting notes by project, or embed a live view of a table inside a document.',
            ],
            textSide: 'left',
          },
          illustration: { type: 'comparison_bars', data: { before: 'Rich text', after: 'Block system' }, animationTrigger: 'onVisible' },
        },
        {
          id: 's3',
          layout: 'fullbleed_stat',
          content: {
            stat: '3×',
            context: 'Engineering cost of building a block editor vs. a standard rich-text system — the number Notion\'s eng lead quoted internally before the rewrite.',
            source: 'Internal planning estimate, 2016',
          },
        },
        {
          id: 's4',
          layout: 'split_panel',
          content: {
            label: 'The decision',
            title: 'Blocks are content atoms. Atoms can compose.',
            paragraphs: [
              'The founders made a counterintuitive call: instead of adding database features on top of a document editor, they rebuilt the entire editor so that documents and databases shared the same primitive — the block.',
              'A paragraph is a block. A heading is a block. A table row is a block. An embedded page is a block. This means a Notion page isn\'t a document with some data bolted on — it\'s a canvas of composable units, each one capable of being moved, linked, referenced, or transformed.',
            ],
            textSide: 'right',
          },
          illustration: { type: 'block_anatomy', data: {}, animationTrigger: 'onVisible' },
        },
        {
          id: 's5',
          layout: 'quote',
          content: {
            quote: 'The database is not a feature we added to Notion. It\'s the same thing as a document, just viewed differently.',
            attribution: 'Ivan Zhao, Notion CEO',
            context: 'On the architectural decision to unify docs and databases',
          },
        },
        {
          id: 's6',
          layout: 'before_after',
          content: {
            title: 'What the block bet unlocked',
            before: {
              label: 'Rich-text world',
              items: [
                'Documents live in folders',
                'Data lives in spreadsheets',
                'You context-switch between tools',
                'Content is a flat stream of characters',
                'Embedding = pasting a screenshot',
              ],
              summary: 'Fragmented. Context-switching is the tax.',
            },
            after: {
              label: 'Block world',
              items: [
                'Pages embed other pages',
                'Databases are just views on blocks',
                'One workspace, every context',
                'Content is structured and queryable',
                'Embedding = a live, filterable view',
              ],
              summary: 'Composable. The same data, infinite surfaces.',
            },
          },
        },
        {
          id: 's7',
          layout: 'fullbleed_principle',
          content: {
            principle: 'Structure enables composability',
            attribution: 'The core insight behind Notion\'s block architecture — and the reason databases and documents feel like one product, not two.',
          },
        },
        {
          id: 's8',
          layout: 'timeline',
          content: {
            title: 'How the block bet paid off over time',
            events: [
              { date: '2016', label: 'The rewrite', description: 'Notion scraps its first version and rebuilds entirely around blocks. Team ships nothing for 18 months.', type: 'decision' },
              { date: '2018', label: 'Databases ship', description: 'Inline databases launch — tables, kanbans, galleries, calendars. Built in weeks because blocks already composed.', type: 'milestone' },
              { date: '2019', label: 'Linked databases', description: 'Same database, multiple views, across different pages. Only possible because of the block model.', type: 'milestone' },
              { date: '2020', label: '$2B valuation', description: 'Notion raises at $2B. The block architecture is now described as the core competitive moat in investor materials.', type: 'outcome' },
              { date: '2021', label: 'AI blocks ship', description: 'Notion AI operates natively on blocks — summarize a block, generate into a block, translate a block. The architecture made AI integration trivial.', type: 'outcome' },
            ],
          },
        },
        {
          id: 's9',
          layout: 'fullbleed_cta',
          content: {
            headline: 'Now make the call yourself',
            subline: 'You\'re the PM. Rich text or blocks — and why? This is the exact decision Notion faced.',
            buttonText: 'Take the challenge',
            targetPath: '/explore/showcase/notion',
          },
        },
      ],
    },
  ],
}

const MOCK_AIRBNB_DETAIL: AutopsyProductDetail = {
  id: 'prod-airbnb-001',
  slug: 'airbnb',
  name: 'Airbnb',
  tagline: 'From one air mattress to the world\'s largest hospitality platform',
  logo_emoji: '✈️',
  logo_url: null,
  cover_color: '#FF5A5F',
  industry: 'Travel & Hospitality',
  paradigm: 'Two-sided marketplace',
  decision_count: 0,
  is_published: true,
  sort_order: 10,
  story_count: 1,
  decisions: [],
  stories: [
    {
      id: 'story-airbnb-decoded-001',
      product_id: 'prod-airbnb-001',
      slug: 'airbnb-decoded',
      title: 'Airbnb Decoded',
      read_time: '20 min read',
      sort_order: 1,
      created_at: '2024-01-01T00:00:00Z',
      related_challenge_ids: [],
      sections: [
        {
          id: 'hero',
          layout: 'aarrr_hero',
          content: {
            product_name: 'Airbnb',
            tagline: 'Follow one user from her first weekend trip booking to becoming a regular traveler who also lists her own spare room',
            meta: 'Product Autopsy · 9 Stages · ~20 min read',
            accent_color: '#FF5A5F',
          },
        },
        {
          id: 'acquisition',
          layout: 'aarrr_stage',
          content: {
            stage_number: 1,
            stage_name: 'Acquisition',
            question: 'Where do they come from — and at what cost?',
            narrative_paragraphs: [
              'Anika types "cabin near Cannon Beach Oregon" into Google. The first organic result isn\'t a hotel chain — it\'s Airbnb. A city-specific landing page, SEO-optimized for exactly this search: "Cannon Beach Cabins and Vacation Rentals." 40+ listings, photos front and center, prices visible without signing up.',
              'This wasn\'t an ad. Airbnb has built over 10 million SEO landing pages — one for every city, neighborhood, and property type combination. "Treehouses in Asheville." "Beach houses in Tulum." "Lofts in Tokyo." Each page is a net that catches long-tail travel intent from Google search. The result: Airbnb gets roughly 60% of its traffic from organic and direct channels, not paid ads.',
              'But organic wasn\'t the only signal. Last week, Anika\'s friend Maya posted an Instagram story from a stunning A-frame cabin with the caption "Best weekend ever" and an Airbnb link. Two weeks before that, a travel influencer Anika follows shared a reel of a cliffside Airbnb in Big Sur. These moments stacked. When Anika searched, Airbnb wasn\'t a stranger — it was already pre-sold by social proof.',
              'She taps the first result. Photos load instantly. She hasn\'t signed up yet. She doesn\'t need to. Airbnb lets you browse, save to wishlists, and explore listings without an account. The signup wall comes later — at the moment of highest intent: the booking button.',
              'This is the opposite of what most marketplaces do. Most require an account before showing inventory. Airbnb\'s philosophy: <strong>let them fall in love first, ask for commitment second.</strong> The emotional investment of browsing beautiful homes makes the signup feel like a natural next step, not a gate.',
              'Only about 5% of first-time visitors convert to a booking. But Airbnb\'s organic traffic is so massive — over 100 million monthly visits — that even 5% is millions of new bookings per quarter. And the cost? Effectively zero for organic. Airbnb\'s blended CAC is roughly $15–20, compared to $50+ for hotel chains relying on OTA commissions.',
            ],
            phone_mockup: { type: 'phone_mockup', label: 'search_results' },
            metrics: [
              { value: '~60%', label: 'Organic/Direct Traffic' },
              { value: '$15–20', label: 'Blended CAC' },
              { value: '10M+', label: 'SEO Landing Pages' },
            ],
            data_tables: [
              {
                label: 'Acquisition Channel Mix',
                columns: ['Channel', 'Share of Traffic', 'Est. CAC'],
                rows: [
                  ['Organic Search (SEO)', '~35%', '~$5 (content cost)'],
                  ['Direct / Brand', '~25%', '$0 (earned)'],
                  ['Social / Referral', '~15%', '~$10–15'],
                  ['Paid Search (SEM)', '~12%', '~$35–50'],
                  ['Display / Social Ads', '~8%', '~$45–60'],
                  ['Email / CRM', '~5%', '~$3 (existing users)'],
                ],
              },
            ],
            war_room: [
              { role: 'ENG', insight: 'City-specific landing pages are auto-generated at scale. A pipeline ingests listing data, location metadata, and seasonal pricing to build and update millions of SEO pages. Stale or thin pages get pruned — Google penalizes low-quality content.' },
              { role: 'PM', insight: '"Should we gate browsing behind sign-up?" — Tested and killed. Requiring sign-up before browsing reduced listing views by 40%. The current approach: let them fall in love with a listing first, then ask for the account at the booking step.' },
              { role: 'DATA', insight: 'Attribution is complex because the consideration window is weeks, not hours. A user sees an Instagram post, Googles two weeks later, bookmarks, comes back via direct URL. The data team models multi-touch attribution across a 30-day window.' },
              { role: 'DESIGN', insight: '"Photos are the product." Listings with professional photos get 2–3× more bookings. Airbnb built a free professional photography program and is investing in AI-powered photo quality scoring that nudges hosts to replace low-quality images.' },
            ],
            go_deeper: {
              metric_definitions: [
                { metric: 'Blended CAC', definition: 'Average cost to acquire one new paying customer across all channels (paid + organic)', how_to_calculate: 'Total marketing spend ÷ New customers acquired', healthy_range: '$15–30 for marketplaces; Airbnb ~$15–20' },
                { metric: 'Organic Traffic Share', definition: '% of visits from non-paid channels (SEO + direct)', how_to_calculate: 'Organic sessions ÷ Total sessions × 100', healthy_range: '>50% = strong brand moat' },
                { metric: 'Visit-to-Booking Rate', definition: '% of first-time visitors who complete a booking', how_to_calculate: 'First bookings ÷ Unique new visitors × 100', healthy_range: '3–5% for travel marketplaces' },
                { metric: 'Multi-Touch Attribution Window', definition: 'Timeframe over which touchpoints are credited for a conversion', how_to_calculate: 'Days between first touch and conversion', healthy_range: '14–30 days for travel' },
              ],
              system_design: {
                components: [
                  { component: 'SEO Page Generation Pipeline', what_it_does: 'Auto-generates millions of city/property-type landing pages from listing data, each targeting a specific long-tail search query', key_technologies: 'Build vs. rent traffic: invest engineering time in defensible organic infrastructure, or keep spending $50+ CAC on paid channels indefinitely' },
                  { component: 'Multi-Touch Attribution Model', what_it_does: 'Credits conversion across a 30-day consideration window of touchpoints (social → search → direct → booking)', key_technologies: 'Last-click attribution would cut social spend and double paid search — you optimize the symptom, not the cause. This model is why Airbnb kept investing in Instagram influencers.' },
                  { component: 'ML-Powered Search Ranking', what_it_does: 'Ranks listings by predicted conversion probability, personalized per user. New users see quality-biased results; returning users see personalized ones', key_technologies: 'Ranking IS the product for first-time users. Every ranking weight is a product tradeoff between guest experience, host economics, and platform trust.' },
                ],
                links: [
                  { tag: 'Strategy', label: 'Building an Organic Traffic Moat' },
                  { tag: 'Data', label: 'Multi-Touch Attribution & Channel Mix' },
                  { tag: 'Metric', label: 'CAC Payback Period & LTV:CAC Ratio' },
                ],
              },
              failures: [
                { name: 'Cereal Box Stunt Overreliance (2008)', what: 'Airbnb founders sold novelty cereal boxes to fund the company, generating buzz but almost no sustainable host or guest acquisition. When press attention faded, they had no repeatable channel and growth stalled at under 100 bookings per week.', lesson: 'PR stunts can validate scrappiness but cannot substitute for a repeatable acquisition engine. Build one owned channel — SEO, referral, or paid — before relying on earned media spikes.' },
                { name: 'Craigslist Spam Integration Backlash', what: 'Airbnb used an unsanctioned bot to cross-post listings to Craigslist, effectively piggybacking on their audience. Craigslist shut down the integration, and Airbnb faced reputational damage. The short-term acquisition gains evaporated once the channel was cut off.', lesson: 'Growth hacks that violate platform terms of service create fragile, single-point-of-failure channels. Build acquisition strategies on channels you control or that have explicit partnership agreements.' },
                { name: 'Google Adwords Overbidding (2012)', what: 'Airbnb aggressively bid on broad vacation-rental keywords, spending heavily against Vrbo and HomeAway on terms with low purchase intent. CAC ballooned while conversion rates on broad keywords underperformed. The experiment burned through budget before the team refined targeting to high-intent city-specific queries.', lesson: 'Broad keyword spend without conversion-rate validation wastes acquisition budget. Start with high-intent, long-tail keywords and expand only after proving unit economics at the narrow end of the funnel.' },
              ],
              do_dont: {
                dos: [
                  'Build programmatic SEO pages for every long-tail keyword combination (city + property type + use case)',
                  'Let users browse inventory without requiring sign-up — emotional investment before commitment',
                  'Track multi-touch attribution with a 30-day window; last-click attribution lies in travel',
                  'Invest in professional-quality imagery — photos are the single biggest conversion lever',
                  'Measure blended CAC, not channel CAC — organic subsidizes paid and that\'s the strategy',
                ],
                donts: [
                  'Gate browsing behind sign-up walls — Airbnb tested this; listing views dropped 40%',
                  'Rely on paid acquisition as your primary channel — it\'s a tax, not a moat',
                  'Create thin SEO pages with no unique content — Google penalizes them and they hurt domain authority',
                  'Use last-click attribution for travel — the consideration window is weeks, not hours',
                  'Ignore social proof in acquisition — Instagram stories and friend recommendations pre-sell before search',
                ],
              },
              competitor_table: {
                columns: ['Dimension', 'Airbnb', 'Vrbo', 'Booking.com'],
                rows: [
                  { dimension: 'Primary acquisition channel', values: [{ text: 'SEO & brand', outcome: 'win' }, { text: 'Expedia Group paid', outcome: 'loss' }, { text: 'Meta-search & SEO', outcome: 'win' }] },
                  { dimension: 'Host-side acquisition cost', values: [{ text: 'Low — word of mouth', outcome: 'win' }, { text: 'Moderate', outcome: 'tie' }, { text: 'High — commission dependent', outcome: 'loss' }] },
                  { dimension: 'Paid vs organic traffic mix', values: [{ text: '~60% organic', outcome: 'win' }, { text: '~40% organic', outcome: 'loss' }, { text: '~50% organic', outcome: 'tie' }] },
                ],
              },
            },
            practice_prompts: {
              on_the_job: {
                question: 'Your PM says "we\'re not showing up on Google for key travel searches." Before you accept the ticket to build more landing pages, what are the three product questions you ask?',
                guidance: 'Think about: what metric is actually dropping — impressions, ranking position, or CTR? Which searches matter most and who\'s doing them? Is the problem content quality, technical indexing, or backlink authority?',
                hint: 'The instinct is to start building. The product-minded engineer asks first: are we solving the right problem?',
              },
              interview_prep: {
                question: 'Airbnb gets 60% organic traffic. A competitor launches aggressive Google Ads targeting the same keywords and organic CTR drops 15%. What\'s your strategy?',
                guidance: 'Consider SEO moats, brand search defense, landing page quality signals, and whether to counter-bid or differentiate. What\'s the metric you track to know if your response is working?',
                hint: 'Separate "protect what you have" from "build what they can\'t copy." Which organic advantages are genuinely defensible?',
              },
            },
            transition: { text: 'Anika found the A-frame cabin. She spent 12 minutes looking at photos, reading reviews, imagining herself by the fireplace. She\'s about to hit "Reserve" — and cross the trust threshold. ↓' },
          },
        },
        {
          id: 'activation',
          layout: 'aarrr_stage',
          content: {
            stage_number: 2,
            stage_name: 'Activation',
            question: 'Did the product actually deliver for them?',
            narrative_paragraphs: [
              'Anika taps "Reserve" on the A-frame cabin. The app asks her to create an account — but it\'s one tap with Google sign-in. Then comes the trust moment. She\'s about to pay $432 to stay in a stranger\'s house. This is the highest-friction moment in Airbnb\'s entire funnel.',
              'But Airbnb has spent years engineering this exact moment. She sees: <strong>247 reviews averaging 4.96 stars</strong>. A "Guest Favorite" badge — awarded only to listings in the top 5% of quality. The host, Sarah, has a Superhost badge, 3 years of hosting, and a 98% response rate. There\'s a verified photo of Sarah and a note: <em>"I\'ll leave the porch light on for you."</em>',
              'Airbnb\'s checkout screen is designed for the moment of hesitation: "You won\'t be charged yet" reassurance. The review summary visible at all times. The flexible cancellation policy highlighted in green. And the total broken down line by line — because transparency at this point actually <em>increases</em> trust, even if it increases price shock.',
              'She taps "Confirm and pay." Sarah messages within 20 minutes: <em>"So excited to have you! Check-in is at 3 PM — I\'ve attached the door code and a guide to my favorite spots."</em> Between booking and arrival, Airbnb sends check-in instructions, a personalized recommendation guide from Sarah, and an automated trip details screen with weather and dining suggestions.',
              'Two days later, Anika arrives. The porch light is on. The cabin smells like cedar. There\'s a handwritten welcome note with her name. The Wi-Fi password is on a card by the coffee maker. Everything works. She puts her bags down, takes a photo, and posts it to her Instagram story.',
              '<em>That</em> is activation. Not the booking. Not the payment. The moment she walks in and thinks: <em>"This is better than a hotel."</em>',
              'But here\'s what Anika doesn\'t know: her first stay was not random. Airbnb\'s search algorithm quietly prioritizes high-quality listings for first-time bookers. A mediocre first stay kills lifetime value permanently. A magical first stay creates a customer for years.',
            ],
            phone_mockup: { type: 'phone_mockup', label: 'listing_detail' },
            callout: {
              label: 'The Trust Architecture',
              text: 'Airbnb\'s review system is bilateral — guests review hosts AND hosts review guests. The Superhost badge requires a 4.8+ rating, 90%+ response rate, and zero cancellations. It costs hosts real effort to earn. "Guest Favorite" is algorithmically computed, not self-declared. These trust signals convert skeptics into bookers at 2× the rate of unbadged listings.',
            },
            metrics: [
              { value: '68%', label: 'Rebook Rate (4.5+ 1st Stay)' },
              { value: '22%', label: 'Rebook Rate (<4.0 1st Stay)' },
              { value: '~20 min', label: 'Avg Host Response Time' },
            ],
            war_room: [
              { role: 'PM', insight: '"First-booking experience is make-or-break." Users whose first stay is rated 4.5+ have a 68% chance of booking again within 6 months. Users with a sub-4.0 first stay? Only 22%. The PM is exploring whether to steer first-time users toward top-rated listings, even if it means fewer bookings for newer hosts.' },
              { role: 'ENG', insight: 'The "Guest Favorite" badge is ML-driven. It combines review scores, listing accuracy, host response time, cancellation history, and amenity completeness. The model retrains weekly — a listing can lose the badge overnight if quality slips.' },
              { role: 'DATA', insight: 'NLP on reviews detects phrases like "not as pictured" or "smaller than expected." Listings with accuracy complaints get flagged, and repeat offenders lose search ranking. The accuracy score is invisible to guests but directly impacts distribution.' },
              { role: 'DESIGN', insight: '"You won\'t be charged yet" — that single line under the Reserve button increased booking completion by 8%. It resolves commitment anxiety at the highest-friction moment.' },
            ],
            go_deeper: {
              metric_definitions: [
                { metric: 'Activation Rate', definition: '% of signed-up users who complete their first meaningful action (booking)', how_to_calculate: 'Users who complete first booking ÷ New sign-ups × 100', healthy_range: '20–40% for marketplaces' },
                { metric: 'First-Stay NPS', definition: 'Net Promoter Score from first-time guests after their initial stay', how_to_calculate: '% Promoters − % Detractors from post-stay survey', healthy_range: '>50 is excellent; >70 is world-class' },
                { metric: 'Rebook Rate (by 1st Stay Quality)', definition: '% of first-time guests who book again, segmented by first-stay rating', how_to_calculate: 'Second bookings ÷ First-time guests, grouped by star rating', healthy_range: '4.5+ stay: ~68%; <4.0 stay: ~22%' },
                { metric: 'Booking Completion Rate', definition: '% of users who start checkout and complete payment', how_to_calculate: 'Completed bookings ÷ Checkout initiated × 100', healthy_range: '60–75% (travel); every friction point costs 5–10%' },
              ],
              system_design: {
                components: [
                  { component: 'Trust Scoring Engine', what_it_does: 'Computes trust signals for listings (reviews, accuracy, host quality) and surfaces them at checkout', key_technologies: 'Composite score from: review avg, response time, cancellation rate, listing accuracy NLP score. Recomputed daily. Powers "Guest Favorite" and "Superhost" badges.' },
                  { component: 'First-Booker Ranking Boost', what_it_does: 'Search algorithm biases results toward high-quality listings for first-time users', key_technologies: 'User-segment feature in ranking model. First-time bookers see higher weight on quality signals vs. price competitiveness.' },
                  { component: 'Pre-Arrival Drip System', what_it_does: 'Automated messaging sequence between booking and check-in (instructions, local tips, weather)', key_technologies: 'Event-driven messaging pipeline. Triggers on booking confirmation, T-3 days, T-1 day, day-of. Personalized with host content + system-generated recommendations.' },
                ],
                links: [
                  { tag: 'System Design', label: 'Design a Review & Trust Scoring System' },
                  { tag: 'Data', label: 'NLP for Sentiment & Accuracy Detection in User Reviews' },
                  { tag: 'Metric', label: 'Activation Rate vs. Time-to-Value Tradeoffs' },
                ],
              },
              failures: [
                { name: 'Poor Early Photography (2009)', what: 'Listings had low-quality, dark smartphone photos that failed to convey the appeal of spaces. Conversion from listing view to booking was under 2%. When founders personally visited New York hosts with a rented camera and replaced photos, bookings in that market doubled within weeks.', lesson: 'Activation failure is often a trust and presentation problem, not a product problem. Invest in supply-side content quality early because guests cannot activate without confidence in what they\'re booking.' },
                { name: 'Overly Complex Booking Request Flow (2011)', what: 'Early booking flow required guests to send a request, wait up to 24 hours for host approval, and then complete payment — a three-step async process. Abandonment rates at the payment step exceeded 60%. Many users who received no response from hosts churned permanently.', lesson: 'Activation flows with uncontrolled wait times owned by third parties destroy first-session conversion. Introduce Instant Book or guaranteed response SLAs to give guests a deterministic path to confirmed accommodation.' },
                { name: 'Identity Verification Friction Spike (2013)', what: 'When mandatory government ID verification was introduced, weekly new-guest activations dropped by roughly 15% in the first month as users abandoned the step. The friction was disproportionately high on mobile. Airbnb had not A/B tested a progressive verification approach before making it mandatory.', lesson: 'Trust and safety requirements must be introduced progressively and tested for conversion impact before mandatory rollout. Verification should feel like a value exchange — "you get safer stays" — not a bureaucratic gate.' },
              ],
              do_dont: {
                dos: [
                  'Steer first-time users toward your highest-quality inventory — a bad first experience kills LTV permanently',
                  'Show trust signals at the moment of highest friction (checkout) — reviews, badges, cancellation policy',
                  'Add "You won\'t be charged yet" reassurance copy — Airbnb proved this lifts completion by 8%',
                  'Build a pre-arrival drip sequence — anticipation reduces anxiety and builds emotional investment',
                  'Measure activation by the real "aha moment" (walk-in experience), not the transactional event (payment)',
                ],
                donts: [
                  'Optimize for sign-up volume over activation quality — users who sign up but never activate are dead weight',
                  'Show an opaque single-number total — line-by-line breakdown increases trust, even if it increases price shock',
                  'Let new users land on mediocre listings — even one bad first stay drops rebook probability from 68% to 22%',
                  'Rely only on star ratings for quality — NLP-based accuracy detection catches issues stars miss',
                  'Ignore host response time — slow responses kill booking completion and signal low trust',
                ],
              },
              competitor_table: {
                columns: ['Dimension', 'Airbnb', 'Vrbo', 'Hotels.com'],
                rows: [
                  { dimension: 'Time to first booking (median)', values: [{ text: '<10 min with Instant Book', outcome: 'win' }, { text: '24–48 hr request flow', outcome: 'loss' }, { text: '<5 min (hotel inventory)', outcome: 'win' }] },
                  { dimension: 'First-session conversion rate (est.)', values: [{ text: '~3.5%', outcome: 'win' }, { text: '~2.1%', outcome: 'loss' }, { text: '~3.0%', outcome: 'tie' }] },
                  { dimension: 'Host activation support', values: [{ text: 'Dedicated onboarding team', outcome: 'win' }, { text: 'Self-serve guides', outcome: 'tie' }, { text: 'N/A — hotel model', outcome: 'loss' }] },
                ],
              },
            },
            practice_prompts: {
              on_the_job: {
                question: 'Your team discovers that guests who message hosts within 24 hours of booking have 30% lower cancellation rates. You want to increase this behavior. What do you build?',
                guidance: 'Before building, ask why some guests don\'t message: is it friction (no obvious CTA), lack of perceived need, or social anxiety? Each requires a different intervention. Lowest-effort test: add a prompted message template after booking confirmation.',
                hint: 'Correlation between messaging and low cancellation could be reverse causality: committed guests BOTH message AND don\'t cancel. Test whether the behavior itself is causal before building features around it.',
              },
              interview_prep: {
                question: 'Design the activation metric for an Airbnb host who just listed their first property. What event tells you they are "activated" — and why is "first booking received" not the right answer?',
                guidance: 'First booking received depends on demand, not host behavior. A host is activated when they\'ve taken all the actions within their control: professional photos uploaded, calendar fully open for 60+ days, Instant Book enabled, response rate above 90% in the first week.',
                hint: 'Tests whether you distinguish between leading indicators (host actions) and lagging indicators (booking outcomes). Strong candidates identify the specific host behaviors that correlate with first booking within 30 days.',
              },
            },
            transition: { text: 'Anika is back in Portland. She posted the cabin to her Instagram story (47 views, 6 DMs asking "where is that?"). She left Sarah a 5-star review and saved two more listings she browsed before bed. She\'s hooked. ↓' },
          },
        },
        {
          id: 'engagement',
          layout: 'aarrr_stage',
          content: {
            stage_number: 3,
            stage_name: 'Engagement',
            question: 'Is the product earning repeated attention?',
            narrative_paragraphs: [
              'Monday evening. Anika is on the couch, no trip planned, and she opens Airbnb. She\'s not booking anything — she\'s browsing. Scrolling through treehouses, yurts, houseboats. She saves a converted fire lookout in Montana to a wishlist called "Someday." She adds a coastal cottage in Portugal to "Dream Trips."',
              'This is Airbnb\'s engagement secret: <strong>aspirational browsing</strong>. Unlike hotel apps (which you open only when you need a room), Airbnb is built to be browsed for pleasure. The category icons — Treehouses, Tiny Homes, OMG!, Arctic — are designed to trigger curiosity, not solve a logistics problem. Users spend an average of 6 minutes per session browsing, even when they have no trip planned.',
              'The psychological mechanics here are powerful. Each listing is a tiny daydream. Wishlists turn those daydreams into saved intentions. And saved intentions convert to bookings at 18% over 6 months. Airbnb built a product people use like Pinterest — as entertainment — that also happens to generate $73B in bookings.',
              'She discovers Airbnb\'s "I\'m Flexible" feature — search without a destination. She enters dates, selects "Beach" and "Treehouses," and sees options she\'d never considered: a beachfront cabin in Olympic Peninsula, a treehouse in Costa Rica, a yurt in Joshua Tree. Each one sparks a conversation with her partner: <em>"What about this one for your birthday?"</em>',
              'Two weeks later, Anika gets a notification: <em>"A listing in your \'Someday\' wishlist just dropped in price for April."</em> She clicks. The fire lookout is $30/night cheaper during the dates she happens to have off work. She books it immediately.',
              'That notification wasn\'t random. Airbnb\'s engagement engine monitors wishlisted properties for price drops, new availability, and seasonal patterns. The "what if" of browsing becomes the "let\'s go" of booking.',
              'This creates something powerful: <strong>investment without purchase</strong>. Every listing Anika saves, every wishlist she names — these are micro-commitments to the platform. When the time comes to actually book, she doesn\'t search from scratch. She opens her wishlist and picks from things she\'s already fallen in love with.',
            ],
            phone_mockup: { type: 'phone_mockup', label: 'wishlists' },
            metrics: [
              { value: '45%', label: 'Users with Wishlists' },
              { value: '6 min', label: 'Avg Session Time' },
              { value: '18%', label: 'Wishlist-to-Book Rate (6 months)' },
            ],
            war_room: [
              { role: 'PM', insight: '"Wishlists are our most underutilized engagement lever." 45% of users have at least one wishlist, but only 12% receive wishlist-based notifications. The PM wants to increase notification triggers — price drops, new reviews, host promotions — without crossing into spam territory.' },
              { role: 'ENG', insight: 'Category icons are algorithmically curated, not static. The "Treehouses" category shows different listings based on your location, season, and browsing history. The ranking algorithm within each category uses quality score, availability, host responsiveness, and price competitiveness.' },
              { role: 'DATA', insight: 'Users who browse without booking still generate value — they build wishlists that convert 3–6 months later at 18% rates. The data team tracks "wishlist-to-booking" pipelines as a leading indicator for future revenue.' },
              { role: 'DESIGN', insight: 'The shift from a search-first home screen to a category-first home screen (launched 2022) increased browsing sessions by 25% and non-searching engagement by 40%. Users explore even when they have no destination in mind.' },
            ],
            go_deeper: {
              metric_definitions: [
                { metric: 'Wishlist-to-Booking Rate', definition: '% of wishlisted items that convert to actual bookings', how_to_calculate: 'Bookings from wishlisted listings ÷ Total wishlisted listings × 100', healthy_range: '15–20% over 6 months is strong' },
                { metric: 'Non-Booking Sessions', definition: '% of sessions where users browse but don\'t book — measures "dream browsing" engagement', how_to_calculate: 'Sessions without booking ÷ Total sessions × 100', healthy_range: 'High is good if it predicts future bookings' },
                { metric: 'Notification CTR', definition: 'Click-through rate on push notifications (price drops, availability alerts)', how_to_calculate: 'Notification clicks ÷ Notifications sent × 100', healthy_range: '5–12% for personalized; <2% = spam territory' },
                { metric: 'DAU/MAU Ratio', definition: 'Daily active users as a fraction of monthly active users — measures stickiness', how_to_calculate: 'Average DAU in a month ÷ MAU', healthy_range: '>25% = strong daily habit; travel apps typically 10–15%' },
              ],
              system_design: {
                components: [
                  { component: 'Recommendation Engine', what_it_does: 'Suggests listings based on browsing history, wishlists, and collaborative filtering', key_technologies: 'Hybrid model: content-based (listing features) + collaborative filtering (users who saved X also saved Y). Embedding-based similarity in vector DB. Real-time personalization layer.' },
                  { component: 'Wishlist Price Monitoring', what_it_does: 'Watches wishlisted properties for price drops, new availability, and seasonal changes', key_technologies: 'Event-driven: pricing change events → fan-out to wishlisted users → notification service. Cross-references user calendar data + travel patterns.' },
                  { component: '"I\'m Flexible" Search', what_it_does: 'Destination-agnostic search that shows options based on dates, interests, and categories', key_technologies: 'Inverted search: instead of (destination → dates → results), it\'s (dates + preferences → destinations + results). Requires pre-computed availability indexes across all markets.' },
                ],
                links: [
                  { tag: 'System Design', label: 'Design a Recommendation Engine (Collaborative + Content-Based)' },
                  { tag: 'System Design', label: 'Design a Notification / Alerting System at Scale' },
                  { tag: 'Metric', label: 'Measuring Engagement Without Booking (Dream Browsing)' },
                ],
              },
              failures: [
                { name: '2011 San Francisco Ransacking Incident', what: 'A guest ransacked a San Francisco host\'s apartment. Airbnb\'s initial response was slow and dismissive — CEO Brian Chesky did not publicly address the incident for days. Host trust collapsed; host churn spiked 8% in the following month.', lesson: 'A single high-profile safety failure can undo years of supply-side retention investment. Companies must have a rapid-response trust protocol and CEO-level public accountability within 24 hours.' },
                { name: 'Lack of Post-Stay Re-engagement (2013–2014)', what: 'For several years, Airbnb\'s post-booking communication was limited to a receipt and a review prompt. There was no personalized "plan your next trip" sequence based on trip type or destination. Repeat booking rates sat below 25% annually.', lesson: 'Retention requires a curated post-experience journey, not just a review ask. Use trip data to trigger personalized next-destination recommendations within 2–4 weeks of checkout.' },
                { name: 'Superhost Program Devaluation (2016)', what: 'Airbnb lowered the Superhost qualification threshold, increasing the number of Superhosts by ~40%. Existing Superhosts complained the badge lost meaning, and guest perception of Superhost as a trust signal weakened.', lesson: 'Loyalty and status programs derive value from scarcity and meaningful differentiation. Diluting qualification criteria to grow a status tier destroys the intrinsic motivation that drives the highest-quality contributors.' },
              ],
              do_dont: {
                dos: [
                  'Design for "aspirational browsing" — make your product enjoyable to use even when there\'s no purchase intent',
                  'Treat wishlists as a leading indicator for revenue — they\'re saved intentions, not dead ends',
                  'Personalize notifications to high-intent signals (price drops on wishlisted items, not generic promos)',
                  'Use category-first navigation to drive discovery — it increased Airbnb\'s browsing sessions by 25%',
                ],
                donts: [
                  'Over-notify — if notification CTR drops below 2%, you\'ve crossed from helpful to spam',
                  'Measure engagement only by bookings — you\'ll miss the entire wishlist-to-booking pipeline',
                  'Make browsing feel like shopping — Airbnb succeeded by feeling like Pinterest, not Expedia',
                  'Show static category results — personalization within categories is what makes discovery feel magical',
                ],
              },
              competitor_table: {
                columns: ['Dimension', 'Airbnb', 'Vrbo', 'Booking.com'],
                rows: [
                  { dimension: 'Annual repeat guest rate (est.)', values: [{ text: '~45%', outcome: 'win' }, { text: '~30%', outcome: 'loss' }, { text: '~40%', outcome: 'tie' }] },
                  { dimension: 'Loyalty / rewards program', values: [{ text: 'None (as of 2024)', outcome: 'loss' }, { text: 'None', outcome: 'loss' }, { text: 'Genius loyalty tiers', outcome: 'win' }] },
                  { dimension: 'Re-engagement email CTR (est.)', values: [{ text: '~18%', outcome: 'win' }, { text: '~10%', outcome: 'loss' }, { text: '~15%', outcome: 'tie' }] },
                ],
              },
            },
            practice_prompts: {
              on_the_job: {
                question: 'Superhost status requires 10+ stays, 4.8+ average rating, 90% response rate, and <1% cancellation rate. Data shows hosts who lose Superhost status churn at 3× the rate of hosts who maintain it. How do you use this insight?',
                guidance: 'Three interpretations: (1) status itself causes retention; (2) hosts who meet the criteria are inherently better and would stay anyway; (3) losing Superhost triggers a discouragement response. Test by looking at what happens in the 90 days after Superhost loss.',
                hint: 'The insight about 3× churn is actionable only if the causal mechanism is understood. Design the intervention around the specific trigger (discouragement at loss) rather than the correlation.',
              },
              interview_prep: {
                question: 'How would you measure whether Airbnb\'s Superhost program is creating genuine quality improvement among hosts or just rewarding hosts who were already high quality?',
                guidance: 'Run a regression discontinuity analysis: compare hosts just above and just below the Superhost threshold. If hosts just above have similar quality trajectories as hosts just below it, the program isn\'t changing behavior — it\'s just labeling pre-existing quality.',
                hint: 'Tests whether you can design a causal analysis of a product feature. Regression discontinuity is the right method because the threshold creates a natural experiment.',
              },
            },
            transition: { text: 'Anika books 2–3 trips per year now. She loves browsing. But every time she checks out, she notices the fees. ↓' },
          },
        },
        {
          id: 'monetization',
          layout: 'aarrr_stage',
          content: {
            stage_number: 4,
            stage_name: 'Monetization',
            question: 'Is the business model real and sustainable?',
            narrative_paragraphs: [
              'Anika books the fire lookout in Montana. The nightly rate says $165. She taps "Reserve" and sees the full breakdown: $495 in nightly fees became $704.70. A 42% markup over the advertised nightly rate.',
              'This is the "total price problem" — and it\'s been Airbnb\'s biggest UX controversy for years. The cleaning fee ($75) goes to the host. The Airbnb service fee ($85.50) is roughly 14% of the booking subtotal — this is Airbnb\'s revenue. On the host side, Airbnb also takes a 3% host service fee from Sarah\'s payout. Total take rate: roughly 15–17%.',
              'The split-fee model means neither side bears the full cost alone, and both feel they\'re getting a reasonable deal. Some hosts opt into "simplified pricing" where they absorb the entire ~15% fee — making the guest\'s price look cleaner. This is a smart trade-off for hosts targeting price-sensitive travelers.',
              'Compare this to UberEats, where contribution margin is single-digit dollars per order. Airbnb\'s model is structurally superior: no drivers, no food costs, no delivery logistics. The marketplace takes a percentage of a transaction between two parties. Gross margins exceed 75%. This is why Airbnb generated $4.8B in free cash flow in 2024 — on a product that owns zero real estate.',
              '<strong>Dynamic pricing</strong> via Smart Pricing suggests hosts raise rates during peak season and events. The algorithm knows that a cabin near Glacier should be $300/night in July and $120 in November — and every price increase also increases Airbnb\'s percentage-based fee. <strong>Airbnb Luxe</strong> targets the $1,000+/night market. <strong>Experiences</strong> add a 20% commission on an entirely new revenue stream that requires zero real estate.',
            ],
            phone_mockup: { type: 'phone_mockup', label: 'booking_breakdown' },
            data_tables: [
              {
                label: 'Where the Money Goes — $704.70 Booking',
                columns: ['Line Item', 'Amount', 'Who Gets It'],
                rows: [
                  ['Nightly rate (after 3% host fee)', '$480.15', 'Host (Sarah)'],
                  ['Cleaning fee', '$75.00', 'Host (Sarah)'],
                  ['Guest service fee (~14%)', '$85.50', 'Airbnb'],
                  ['Host service fee (3%)', '$14.85', 'Airbnb'],
                  ['Taxes', '$49.20', 'Government'],
                ],
              },
            ],
            metrics: [
              { value: '$73.7B', label: 'GBV (2024)' },
              { value: '~15%', label: 'Take Rate' },
              { value: '$11.1B', label: 'Revenue (2024)' },
            ],
            war_room: [
              { role: 'PM', insight: '"Total price transparency vs. nightly rate display." In 2023, Airbnb rolled out total price display in search results. Some markets saw lower click-through but higher booking completion. The net effect: fewer "sticker shock" abandonments at checkout.' },
              { role: 'ENG', insight: 'Smart Pricing algorithm: gradient-boosted model incorporating 70+ features — location, seasonality, local events, competitor pricing, listing quality, booking lead time, day of week. Hosts who use Smart Pricing earn 20% more on average.' },
              { role: 'DATA', insight: 'Price elasticity varies wildly by segment. Budget travelers are highly elastic — a $10/night increase drops conversion 15%. Luxury travelers barely notice. The data team segments pricing recommendations by traveler profile, not just listing quality.' },
              { role: 'OPS', insight: '"Cleaning fees are the #1 user complaint." Some hosts charge $200+ cleaning fees on a $100/night listing. PM is exploring caps, mandatory inclusion in nightly rate display, or host education.' },
            ],
            go_deeper: {
              metric_definitions: [
                { metric: 'Gross Booking Value (GBV)', definition: 'Total value of all bookings processed through the platform before any refunds or cancellations', how_to_calculate: 'Sum of (nightly rate × nights + fees) for all completed bookings', healthy_range: 'Airbnb: $73.7B (2024); growing 10–15% YoY is healthy for a mature marketplace' },
                { metric: 'Take Rate', definition: 'Revenue as a % of GBV — the platform\'s cut of every transaction', how_to_calculate: 'Platform Revenue ÷ GBV × 100', healthy_range: '12–18% for hospitality marketplaces; Airbnb ~15%' },
                { metric: 'Gross Margin', definition: '% of revenue retained after direct costs (trust/safety, payment processing, etc.)', how_to_calculate: '(Revenue − COGS) ÷ Revenue × 100', healthy_range: '>60% = strong marketplace; Airbnb >75% — exceptional for a $11B revenue business' },
              ],
              system_design: {
                components: [
                  { component: 'Smart Pricing Engine', what_it_does: 'Suggests dynamic nightly rates to hosts based on demand signals, local events, and competitor pricing', key_technologies: 'Gradient-boosted model with 70+ features. Retrains weekly. Hosts who use it earn 20% more — and Airbnb earns 20% more in fees. Aligned incentives by design.' },
                  { component: 'Fee Display A/B Infrastructure', what_it_does: 'Tests different fee presentation strategies across markets (nightly rate vs. total price, fee breakdown vs. single number)', key_technologies: 'Holdout-based experimentation with booking completion and price perception as primary/guardrail metrics. Different display strategies for mobile vs. web vs. app.' },
                ],
                links: [
                  { tag: 'Strategy', label: 'Marketplace Pricing Strategy: Split Fees vs. Single Take Rate' },
                  { tag: 'Metric', label: 'GBV vs. Revenue vs. Take Rate: What Each Tells You' },
                ],
              },
              failures: [
                { name: 'Airbnb for Business Slow Monetization (2015–2017)', what: 'Airbnb launched a corporate travel product but lacked enterprise billing, expensing integration, and admin controls for 2 years after launch. The $300B+ corporate travel market remained largely untapped while Booking.com and Expedia built business-grade tooling.', lesson: 'Entering an enterprise market requires enterprise-grade infrastructure from day one. Consumer product instincts — ship fast, iterate — fail when procurement teams need predictability, compliance, and expensability.' },
                { name: 'Cleaning Fee Backlash (2021–2022)', what: 'As hosts raised cleaning fees to $200+ on $100/night listings, the total price gap became untenable. User complaints surged, media coverage was uniformly negative, and some markets saw conversion rates drop 10%+.', lesson: 'Take-rate percentage is only sustainable if hosts price rationally. Platform incentive design must account for host behavior — allowing unconstrained cleaning fees created a trust tax on every booking.' },
                { name: 'Experiences Underperformance (2016–2019)', what: 'Despite significant marketing, Airbnb Experiences never exceeded ~1% of total revenue for three years. Quality control was inconsistent — the range from professional tours to awkward backyard activities was too wide.', lesson: 'Expanding the marketplace requires consistent supply quality. Experiences needed a separate curation layer, not just open enrollment. Volume without quality thresholds dilutes the brand even if individual experiences are profitable.' },
              ],
              do_dont: {
                dos: [
                  'Show the fee breakdown transparently at checkout — line-by-line builds trust even when total is higher than expected',
                  'Align platform incentives with host incentives: Smart Pricing increases host earnings AND platform revenue simultaneously',
                  'Segment pricing elasticity by traveler profile — luxury and budget travelers need different signals',
                ],
                donts: [
                  'Allow supply-side behavior (cleaning fees, pricing) to undermine guest trust — the platform reputation is the product',
                  'Enter enterprise markets with consumer product assumptions — B2B buyers need compliance, expensing, and admin controls',
                  'Use take rate as the only monetization metric — GBV growth from expanding use cases (Experiences, long stays) is the real story',
                ],
              },
            },
            practice_prompts: {
              on_the_job: {
                question: 'Your marketplace has a 15% take rate but users frequently complain about "hidden fees." You can either reduce fees or change how fees are displayed. What do you decide and why?',
                guidance: 'Separate the perception problem from the economics problem. Total price display in search results reduces sticker shock at checkout without changing economics. Reducing fees changes unit economics permanently. Test display first.',
                hint: 'Airbnb\'s rollout of total price display in 2023 showed this is a UI/UX problem, not necessarily a pricing problem. Run the A/B before making an economic decision.',
              },
              interview_prep: {
                question: 'Airbnb earns $100 on a $704.70 booking. UberEats earns $5 on a $35 order. Which business model would you rather have and why?',
                guidance: 'Compare: gross margin, capital intensity, operational complexity, defensibility, and growth ceiling. Airbnb: 75%+ margin, zero inventory, regulatory risk. UberEats: thin margin, high operational complexity, network effects at city level.',
                hint: 'The question tests whether you can analyze unit economics beyond "revenue." Focus on margin quality, capital efficiency, and defensibility — not just the revenue number.',
              },
            },
            transition: { text: 'The fees stung a little. But the fire lookout was worth every dollar. Anika\'s already planning her next trip. ↓' },
          },
        },
        {
          id: 'retention',
          layout: 'aarrr_stage',
          content: {
            stage_number: 5,
            stage_name: 'Retention',
            question: 'Do users genuinely need this — or just like it?',
            narrative_paragraphs: [
              'A year in, Anika has 5 completed stays, bilateral reviews, 26 saved listings across 4 wishlists, verified ID, saved payment method, and a guest profile with host reviews. She could switch to Vrbo or Booking.com. She won\'t.',
              'The switching cost isn\'t financial — it\'s informational. Her reviews, wishlists, and host relationships exist only on Airbnb. Switching means starting from zero trust. Every review she writes, every wishlist she creates, increases the cost of leaving.',
              'Airbnb understood this early: the product\'s real retention engine isn\'t features or pricing — it\'s accumulated identity. A guest with 20 reviews is a different kind of user than a guest with 2. The former has invested in the platform. The latter hasn\'t.',
              'When she has a bad experience — a "cozy loft" that was really a converted garage — support delivers a full refund in 24 hours and a $100 coupon. She rebooks the next month. This is AirCover: $3M host liability, $1M guest damage protection, 24/7 support. Not just a safety net — a retention instrument.',
              'The data tells the story: guests with 5+ reviews have 35% higher 12-month retention. Guests with 3+ wishlists: +28%. Guests with verified ID + saved payment: +22%. Each action deepens the relationship. Each deepened relationship lowers churn. The platform is engineered to accumulate switching costs without ever calling them that.',
            ],
            metrics: [
              { value: '70%+', label: 'Repeat Booker Rate' },
              { value: '$1,200', label: 'Avg Annual Spend' },
              { value: '~60%', label: 'Bookings from Repeat Users' },
            ],
            war_room: [
              { role: 'PM', insight: '5+ reviews written = +35% 12-month retention; 3+ wishlists = +28%; verified ID + saved payment = +22%. Each data point becomes an activation trigger for retention nudges.' },
              { role: 'ENG', insight: 'Churn prediction model: wishlist activity decline is a stronger signal than booking gaps — users who stop browsing are already churning before they\'ve stopped booking.' },
              { role: 'DATA', insight: 'Superhost stay on first trip increases second-booking rate by 40% — first-stay quality is the highest-leverage retention lever in the entire funnel.' },
              { role: 'OPS', insight: 'AirCover ($3M host liability, $1M damage protection) makes guests 30% more likely to book higher-priced listings and try new destinations. Safety programs are retention instruments.' },
            ],
            go_deeper: {
              metric_definitions: [
                { metric: 'Repeat Booker Rate', definition: '% of users who have completed at least 2 bookings within a rolling 12-month window', how_to_calculate: 'Users with 2+ bookings in 12 months ÷ Total users with 1+ booking × 100', healthy_range: '>60% for mature marketplace; Airbnb ~70%+' },
                { metric: 'Net Revenue Retention (NRR)', definition: 'Revenue from existing cohort in period N+1 compared to period N, including expansion', how_to_calculate: '(Starting cohort revenue + expansion − churn) ÷ Starting cohort revenue × 100', healthy_range: '>100% = expansion outpaces churn; marketplaces typically 90–115%' },
                { metric: 'Switching Cost Score', definition: 'Composite measure of platform-locked assets per user (reviews, wishlists, payment profiles)', how_to_calculate: 'Proprietary: weighted sum of review count, wishlist count, identity verifications, saved payment methods', healthy_range: 'Higher = lower churn; Airbnb uses this as a leading indicator, not disclosed publicly' },
              ],
              system_design: {
                components: [
                  { component: 'Churn Prediction Model', what_it_does: 'Predicts 60-day churn risk based on behavioral signals — wishlist activity decline is a stronger predictor than booking gaps', key_technologies: 'Gradient-boosted classifier. Features: wishlist save rate (rolling 30d), session frequency, notification engagement, days since last review. Feeds re-engagement trigger campaigns.' },
                  { component: 'AirCover Claims Engine', what_it_does: 'Processes guest and host protection claims (damage, misrepresentation, cancellations) with 24-hour resolution target', key_technologies: 'Automated triage + human review pipeline. Claims linked to listing quality score — high-claim listings get proactive outreach. Resolution speed is a retention KPI.' },
                ],
                links: [
                  { tag: 'Strategy', label: 'Designing Switching Costs That Don\'t Feel Like Traps' },
                  { tag: 'Metric', label: 'Churn Prediction: Behavioral Leading Indicators vs. Booking Gaps' },
                ],
              },
              failures: [
                { name: 'Referral Credit Abuse (2014–2015)', what: 'Fraudulent accounts exploited referral credits at scale — users created fake accounts to generate credits, then used them for real bookings. Airbnb\'s fraud detection at the time was insufficient, costing millions in credit losses.', lesson: 'Referral programs must be paired with fraud prevention from day one. Device fingerprinting, email pattern detection, and booking behavior analysis are not optional — they\'re the cost of running a referral program.' },
                { name: 'Host Referral Underinvestment (2013)', what: 'Early Airbnb focused on guest referrals while host supply acquisition remained expensive and slow. Host-side referral programs — where existing hosts recruit new hosts — were underdeveloped for years.', lesson: 'In two-sided marketplaces, referral programs must be designed for both sides. Host-to-host referrals carry higher social proof than any marketing channel because hosts understand the hosting experience.' },
              ],
              do_dont: {
                dos: [
                  'Engineer switching costs through accumulated identity — reviews, wishlists, and reputation data lock users in without locks',
                  'Treat safety and support resolution speed as retention instruments, not cost centers',
                  'Use behavioral leading indicators (wishlist activity) for churn prediction, not lagging indicators (booking gaps)',
                ],
                donts: [
                  'Conflate retention with loyalty programs — Airbnb has no points system and still has 70%+ repeat booker rate',
                  'Ignore the retention impact of first-stay quality — a sub-4.0 first stay cuts repeat booking probability by 67%',
                  'Let support resolution take >24 hours — every unresolved complaint is a potential churn event',
                ],
              },
            },
            practice_prompts: {
              on_the_job: {
                question: 'Your churn model shows that users who stop saving wishlists are 60% more likely to churn within 90 days. What do you build?',
                guidance: 'First, understand why wishlist activity dropped: did users run out of new content? Did they have a bad stay? Are they in a "no travel planning" life phase? Each root cause needs a different intervention.',
                hint: 'Don\'t build a "save to wishlist" nudge without knowing why users stopped. The wishlist drop is a symptom — diagnosing the cause is the product work.',
              },
              interview_prep: {
                question: 'Airbnb has no loyalty points program but 70%+ repeat booking rates. How do they retain users without points?',
                guidance: 'Explain: switching costs (reviews, wishlists, saved profiles), supply quality (unique inventory not available elsewhere), and aspirational engagement (browsing as entertainment). Points programs are retention for fungible products. Airbnb\'s inventory isn\'t fungible.',
                hint: 'Tests whether you understand intrinsic vs. extrinsic retention. Points = extrinsic. Accumulated identity + unique supply = intrinsic. Intrinsic retention is 5× more durable.',
              },
            },
            transition: { text: 'Anika\'s booked 5 stays, saved 26 listings, and written 9 reviews. She\'s not going anywhere. But something new is about to happen — she\'s about to become a host. ↓' },
          },
        },
        {
          id: 'referral',
          layout: 'aarrr_stage',
          content: {
            stage_number: 6,
            stage_name: 'Referral',
            question: 'Does the product spread without paid marketing?',
            narrative_paragraphs: [
              'Travel is inherently social. At a dinner party, Anika shows the fire lookout listing: "You have to stay here." She shares it via text. The listing itself is the referral.',
              'When was the last time someone excitedly shared their Hilton room? Never. But people constantly share Airbnb listings because they\'re interesting — a treehouse, a cliffside villa, a converted train car. Stories worth telling. The product is the marketing.',
              'The most underrated channel is organic social: when Anika shares a listing on iMessage, the preview card shows the property photo, star rating, and price. Designed to look like a travel recommendation, not an ad. Airbnb\'s engineering team has spent years ensuring listing preview cards render perfectly on every messaging platform.',
              'Then there\'s the formal referral program: "Give $40, get $20." Referred users are better users — 25% higher 12-month retention, because they came in with social proof already attached. The friend vouched for the platform before the product had to.',
              'But the deepest referral channel is Anika herself becoming a host. When she lists her spare room, she suddenly has strong opinions about Airbnb — and shares them. Host communities on Reddit, Facebook groups, and local forums generate millions of organic touchpoints that no paid campaign could buy.',
            ],
            metrics: [
              { value: '~15–20%', label: 'Organic Social Acquisition' },
              { value: '$60', label: 'Referral Credit CAC' },
              { value: '25%', label: 'Better 12-mo Retention (referred users)' },
            ],
            war_room: [
              { role: 'PM', insight: 'Listing preview cards must render perfectly on iMessage, WhatsApp, Instagram DMs, and Twitter — each has different OG tag requirements. This is a PM-owned engineering priority, not an afterthought.' },
              { role: 'ENG', insight: 'Deep linking to specific listings with platform-specific preview specs; universal links (iOS) + App Links (Android) + deferred deep linking to handle app-not-installed state.' },
              { role: 'DATA', insight: 'Referred users have 25% better 12-month retention. Fraud detection tracks device fingerprints and suspicious booking clusters to prevent referral credit exploitation.' },
              { role: 'DESIGN', insight: '"Give $40, get $20" outperforms "Share and earn" by 22% — generosity framing (what your friend gets) beats self-interest framing (what you get).' },
            ],
            go_deeper: {
              failures: [
                { name: 'China Expansion (Aibiying 2015–2022)', what: 'Despite years of effort and a localized brand, Airbnb never exceeded 1% market share in China. Regulatory barriers, data localization requirements, domestic competitors (Tujia, Meituan), and the inability to run without a VPN for most of its life made the market unwinnable.', lesson: 'Geographic expansion requires regulatory infrastructure, not just product localization. A $1B+ market is worth zero if the regulatory environment prevents viable operation.' },
                { name: 'Latin America Premature Scaling (2014)', what: 'Aggressive paid marketing in Latin America began before reliable payment infrastructure was in place. Hosts couldn\'t reliably receive payouts, and guests had limited payment methods. Growth was paid for but didn\'t stick.', lesson: 'In emerging markets, supply-side and payment infrastructure must precede demand-side marketing. Acquiring guests before you can reliably pay hosts is a retention disaster for both sides.' },
              ],
              do_dont: {
                dos: [
                  'Engineer listing share previews for every messaging platform — the share card IS the ad',
                  'Use generosity framing in referral copy ("Give $40") over self-interest framing ("Earn $20")',
                  'Track referred user retention separately — referred users are better users and justify higher acquisition cost',
                  'Treat host communities as a referral channel — hosts who love the product are the most credible brand ambassadors',
                ],
                donts: [
                  'Launch referral programs without fraud detection infrastructure — fake accounts will exploit credits immediately',
                  'Treat referral as a single program — organic listing sharing and formal credit programs need separate measurement',
                  'Ignore geographic market infrastructure before marketing spend — payment and regulatory gaps make acquisition wasteful',
                ],
              },
            },
            practice_prompts: {
              on_the_job: {
                question: 'Your referral program gives $40 to the referred user and $20 to the referrer. Fraud detection flags that 15% of referrals come from the same IP address. What do you do?',
                guidance: 'Distinguish between fraud investigation and program design. Immediate: freeze suspicious credits pending review. Medium-term: add device fingerprinting, email domain restrictions, and booking-before-credit rules. Don\'t kill the program — fix the detection layer.',
                hint: 'The temptation is to shut down the program. The right answer is to fix the fraud detection, not the program economics.',
              },
              interview_prep: {
                question: 'Airbnb\'s most powerful referral channel is not the formal "$40 for a friend" program — it\'s users sharing listings organically on social media. How would you measure the business impact of organic sharing?',
                guidance: 'Identify what you can measure: link shares (from app share button), preview card renders (server-side), bookings with a share_token parameter. What you can\'t easily measure: screenshots, verbal mentions, DMs without deep links. Estimate using holdout experiments.',
                hint: 'The question tests whether you can design attribution for an unmeasured channel. The answer involves both instrumentation (what you add) and estimation (what you model).',
              },
            },
            transition: { text: 'Six DMs from that Instagram story. Three of Anika\'s friends have now booked Airbnbs for the first time. The product markets itself. ↓' },
          },
        },
        {
          id: 'expansion',
          layout: 'aarrr_stage',
          content: {
            stage_number: 7,
            stage_name: 'Revenue Expansion',
            question: 'Can the business grow without just adding users?',
            narrative_paragraphs: [
              'Anika discovers Experiences: cooking class in Oaxaca, street art tour in Buenos Aires, pottery in Kyoto. She books a local wine tasting for her birthday — $55/person × 5 = $275. Airbnb takes 20%. Experiences are genius: a reason to open the app even when not traveling.',
              'Then she sees a banner: "Your space could earn $1,100/month on Airbnb." Specific to her zip code and room type. She taps it. Onboarding in under 2 hours. First guest books within a week. In one move, Anika went from a guest to a host — from demand side to supply side.',
              'Post-2020, remote work created a new use case: long stays. Guests booking 28+ nights now represent 20%+ of Airbnb\'s booking volume, commanding higher nightly rates and requiring completely different product infrastructure — monthly payment schedules, check-in flexibility, utility policies.',
              'This is expansion done right: not new users, but existing users unlocking new value on the platform. Each transition — guest to experience-buyer to host — roughly doubles a user\'s revenue contribution. The guest-to-host conversion is the highest-leverage growth loop because it adds supply and demand simultaneously.',
            ],
            metrics: [
              { value: '4M+', label: 'Active Hosts' },
              { value: '8%', label: 'Guest-to-Host Conversion (2yr)' },
              { value: '20%+', label: 'Bookings from Long Stays (28+ nights)' },
            ],
            war_room: [
              { role: 'PM', insight: 'Guest-to-host conversion is the highest-leverage growth loop — it adds supply and demand simultaneously from one user, improving both sides of the marketplace.' },
              { role: 'ENG', insight: 'Long stays (28+ nights) require a parallel booking system with different rules — check-in flows, payment schedules, and cancellation policies all differ from short stays. Separate infrastructure was required.' },
              { role: 'DATA', insight: 'Experiences revenue per user is 40% incremental — it doesn\'t reduce stay bookings, it adds on top. Experience buyers have higher overall platform LTV than stay-only users.' },
              { role: 'OPS', insight: 'Airbnb for Business targets $300B+ corporate travel market — the challenge is competing with established travel management companies (TMCs) that have deep enterprise procurement integrations.' },
            ],
            go_deeper: {
              failures: [
                { name: 'COVID-19 Response (March 2020)', what: 'Initially, Airbnb enforced standard cancellation policies and denied refunds for pandemic-related cancellations. After massive host and guest backlash, they reversed and offered full refunds — absorbing $1B+ in losses. The initial response damaged both host and guest trust simultaneously.', lesson: 'Crisis response requires a clear principle hierarchy: guest safety first, then host economics, then platform economics. Ambiguity in that order causes both-sides-simultaneous-backlash, which is the worst possible outcome.' },
                { name: 'Win-Back Email Campaigns (2018)', what: 'Generic "come back and travel" messaging to lapsed users achieved <8% open rate and <1% reactivation. The campaigns had no personalization — every lapsed user got the same message regardless of why they\'d stopped using the product.', lesson: 'Win-back campaigns require knowing why users left. Lapsed due to price sensitivity? Show deals. Lapsed due to bad experience? Acknowledge it. Generic messages implicitly say "we don\'t know who you are," which is the opposite of what re-engagement needs.' },
              ],
              do_dont: {
                dos: [
                  'Design guest-to-host conversion as an explicit growth loop — it\'s the only acquisition motion that improves both sides simultaneously',
                  'Build new use cases (long stays, experiences) on separate booking infrastructure — consumer and monthly-rental assumptions are incompatible',
                  'Personalize expansion prompts with specific earning estimates by zip code and room type — specificity drives action 3× more than generic CTAs',
                ],
                donts: [
                  'Build expansion features on top of existing infrastructure without validating compatibility — long stays and short stays have fundamentally different operational needs',
                  'Treat all lapsed users the same — segment win-back by reason for lapse and design separate campaigns',
                ],
              },
            },
            practice_prompts: {
              on_the_job: {
                question: 'You\'re the PM for Airbnb Experiences. Revenue is flat despite growing host supply. What\'s your diagnosis and what do you build first?',
                guidance: 'Separate supply problem from demand problem. If supply is growing but revenue is flat: either demand isn\'t finding supply (discovery problem), or demand is finding but not booking (quality/trust problem). Check: what % of Experiences page views result in a booking? What\'s the cancellation rate?',
                hint: 'Flat revenue with growing supply usually means a demand or quality problem, not a supply problem. Resist the instinct to add more supply without fixing conversion first.',
              },
              interview_prep: {
                question: 'Airbnb wants to grow revenue without adding new users. What are the three highest-leverage expansion moves, and how would you prioritize them?',
                guidance: 'Map each move by: incremental revenue per user, % of current users addressable, time to revenue, and infrastructure investment required. Guest-to-host conversion has high leverage but high friction. Long stays are already happening — it\'s a capture problem, not a creation problem.',
                hint: 'Tests product strategy thinking. The answer should include a prioritization framework, not just a list of ideas.',
              },
            },
            transition: { text: 'Anika just listed her spare room. In one week, she\'s a host. In one month, she\'s thinking about what to do with her first payout. ↓' },
          },
        },
        {
          id: 'sustainability',
          layout: 'aarrr_stage',
          content: {
            stage_number: 8,
            stage_name: 'Sustainability',
            question: 'Will this product still matter in 3 years?',
            narrative_paragraphs: [
              'Anika doesn\'t see the battles. But they\'re existential. Portland requires hosts to register and pay hotel taxes. Barcelona is banning short-term rentals entirely by 2028. New York City mandates host presence during all stays. Tokyo caps rentals at 180 nights per year. Amsterdam at 30 nights per year.',
              'The pattern everywhere: residents complain about housing costs, politicians blame short-term rentals, regulations follow. Airbnb\'s response to this has evolved from adversarial to collaborative. Early Airbnb fought regulations. Modern Airbnb proactively collects and remits hotel taxes ($5B+ globally) — converting itself from a regulatory enemy to a revenue partner for cities.',
              'Trust and safety is a second existential layer. Airbnb spends an estimated $500M+ per year on it. One bad host — a poorly lit "design studio" that was really a storage room with an air mattress — undermines trust for the entire neighborhood. One party house near a family subdivision triggers legislation in that city. The quality floor for millions of listings is a product problem, not an operations problem.',
              'The regulatory and trust challenges are deeply related: both require Airbnb to convince governments and communities that hosts are responsible actors. The product, engineering, and data teams all have roles in this — not just the government affairs team.',
            ],
            metrics: [
              { value: '$5B+', label: 'Hotel Taxes Collected Globally' },
              { value: '$500M+', label: 'Trust & Safety Spend/yr' },
              { value: '100K+', label: 'Cities with Active Listings' },
            ],
            war_room: [
              { role: 'PM', insight: 'Proactive regulation strategy: collect and remit hotel taxes ($5B+ globally) — converts Airbnb from regulatory enemy to revenue partner for cities. Data-sharing agreements proactively offered before legislation is proposed.' },
              { role: 'ENG', insight: 'Regulatory Rules Engine: configurable per jurisdiction (Paris 120-night cap, NYC registration checks, Amsterdam 30-night limit). One codebase, 100K+ rule sets. Enforcement is automated — non-compliant listings are suppressed.' },
              { role: 'DATA', insight: 'ML regulatory heat map predicts which markets face new regulations before they happen: housing price growth + Airbnb density + political sentiment signals. PM teams brief government affairs 6–12 months before anticipated legislation.' },
              { role: 'OPS', insight: 'Party prevention: IoT noise monitor integration, booking pattern classifier for under-25 guests without reviews, neighborhood impact scoring per listing.' },
            ],
            go_deeper: {
              failures: [
                { name: 'Reactive Regulatory Strategy (2015–2018)', what: 'For years, Airbnb fought hostile legislation after it was proposed, spending $50M+ in legal and lobbying costs on battles that proactive data-sharing could have avoided. In several cities (NYC, Berlin, Barcelona), the adversarial approach accelerated hostile regulation rather than preventing it.', lesson: 'Regulatory strategy must be proactive and data-driven. Sharing neighborhood-level impact data, proactively collecting hotel taxes, and engaging local stakeholders before legislation is drafted converts opponents into partners.' },
                { name: 'Experiences Quality Control (2017–2018)', what: 'Scaling Experiences quickly led to a wide quality range — from professional tours to informal backyard activities. NPS for Experiences lagged the core product by 20 points. Guest trust in the "Experiences" brand eroded when the quality floor wasn\'t maintained.', lesson: 'Quality-gated expansion is better than open supply expansion. Airbnb should have implemented curation (application + review) from day one, not after quality problems emerged.' },
              ],
              do_dont: {
                dos: [
                  'Proactively collect and remit taxes before governments ask — it converts you from threat to partner',
                  'Share neighborhood-level impact data with cities — transparency is your best regulatory defense',
                  'Build the regulatory rules engine before entering each new market — compliance is a product feature, not an afterthought',
                ],
                donts: [
                  'Fight regulation adversarially — it accelerates hostile legislation rather than preventing it',
                  'Scale supply quality without a quality floor — one bad actor undermines trust for thousands of good hosts',
                  'Treat trust and safety as a cost center — it\'s the product\'s operating license',
                ],
              },
            },
            practice_prompts: {
              on_the_job: {
                question: 'Your city is proposing a 90-night annual cap on short-term rentals. You have 6 months before the vote. What does the product team do?',
                guidance: 'Three tracks: data (quantify economic impact on host income, neighborhood benefits), product (build compliance infrastructure so enforcement is automated if the cap passes), policy (proactively engage with proposed amendments that would allow commercial hosts to operate separately).',
                hint: 'Product teams tend to stay out of regulatory fights. The right answer shows how product, data, and engineering can support the regulatory team rather than watching from the sideline.',
              },
              interview_prep: {
                question: 'How would you design the trust and safety system for a new home-sharing marketplace, knowing that one high-profile safety incident can cause significant brand damage?',
                guidance: 'Cover: pre-booking verification (ID, behavioral signals), during-stay monitoring (IoT integration, neighbor reporting), post-stay resolution (claims processing, host/guest outcomes). The goal is early detection, not reactive response.',
                hint: 'Tests whether you think about trust and safety as a system, not a set of features. Strong answers address both prevention (reduce incident rate) and response (limit blast radius when incidents occur).',
              },
            },
            transition: { text: 'The regulations are a headache. But Airbnb is still operating — and Anika\'s hosting income just paid for her summer trip. ↓' },
          },
        },
        {
          id: 'ecosystem',
          layout: 'aarrr_stage',
          content: {
            stage_number: 9,
            stage_name: 'Ecosystem',
            question: 'Has the product become bigger than itself?',
            narrative_paragraphs: [
              'Two years later, something fundamental has shifted. Anika\'s relationship with Airbnb is no longer an app on her phone. She earns $1,200/month hosting her spare room. She uses PriceLabs for dynamic pricing via the Airbnb API. She uses a cleaning service she found on host forums for turnovers. She reviews her hosting stats every morning on a dashboard.',
              'She\'s booked Experiences in 3 cities. She used Airbnb for Business for her team offsite. She has 12 five-star reviews as a host and 8 as a guest. She\'s in three host Facebook groups where she helps new hosts understand pricing strategy.',
              'Anika is no longer a user of Airbnb. She is a node in the Airbnb ecosystem. And this distinction is everything. Each additional layer of engagement cuts annual churn roughly in half: from 45% for a one-trip guest to just 5% for a multi-tool host.',
              'The business implication is profound: multi-layer users generate 3–5× more revenue than single-layer users, with dramatically lower acquisition cost (they were already there) and dramatically lower churn (they\'re too embedded to leave). The highest-leverage growth motion isn\'t acquisition. It\'s depth.',
              'This is what platform moats actually look like. Not a lock-in clause, not a contract, not a switching fee. Just a user so embedded in the platform\'s ecosystem that the cost of leaving is measured in months of disruption, not minutes of inconvenience.',
            ],
            metrics: [
              { value: '45% → 5%', label: 'Churn (1 layer → 4 layers)' },
              { value: '3–5×', label: 'Revenue Multiplier (multi-layer)' },
              { value: '100K+', label: 'Pro Hosts Using Integrated Tools' },
            ],
            war_room: [
              { role: 'PM', insight: 'Platform Depth Score (layers of engagement) is the leading indicator for both churn and LTV — more valuable than any single usage metric. PM teams now optimize for depth, not just acquisition.' },
              { role: 'ENG', insight: 'Host Tools API: RESTful + webhooks for real-time events, OAuth2, tiered rate limiting. Supports availability sync, dynamic pricing, automated messaging, and multi-platform management for pro hosts.' },
              { role: 'DATA', insight: 'Churn model: wishlist activity decline predicts churn 60 days earlier than booking gap signals. For hosts, calendar gap and response rate decline predict churn 45 days earlier than booking drought.' },
              { role: 'DESIGN', insight: 'Guest-to-host conversion prompts that show zip-code-specific earning estimates outperform generic CTAs by 3× — specificity drives action because it makes the abstract concrete.' },
            ],
            go_deeper: {
              failures: [
                { name: 'Affordable Segment Neglect (2019–2022)', what: 'Rising average daily rates and proliferating cleaning fees drove budget travelers to competitors. Airbnb launched "Rooms" (a shared-space product targeting budget travelers) in 2023 — years after the problem was visible in the data. By the time the product shipped, significant budget market share had moved to Booking.com and Hostelworld.', lesson: 'Watching a segment leave for years without a product response is a strategic failure, not just a market failure. The data showed budget traveler churn rising — the product response came too late because the segment wasn\'t a strategic priority.' },
                { name: 'Third-Party API Instability (2015)', what: 'Early API issues — rate limits, sync failures, double-bookings — caused property managers to flee to Booking.com and Vrbo. Once property managers switched platforms, they rarely returned. The ecosystem damage from poor API quality compounded over years.', lesson: 'For ecosystem participants who depend on your API for their livelihood, reliability is more important than features. API instability is existential for third-party businesses — and their departure is permanent.' },
              ],
              do_dont: {
                dos: [
                  'Measure Platform Depth Score (layers of engagement per user) as a leading indicator for both LTV and churn',
                  'Design explicit pathways between layers: guest → experience-buyer → host → pro host. Each transition is a retention event.',
                  'Build API infrastructure before you need it — pro hosts with integrated tooling have 5× lower churn than manual hosts',
                ],
                donts: [
                  'Let API reliability slip — pro hosts and third-party developers leave permanently after one bad experience',
                  'Ignore segment-level churn signals — watching a segment drift for years before responding is a strategic failure',
                  'Treat ecosystem development as an enterprise feature — the deepest users generate the most value and need the deepest tools',
                ],
              },
            },
            practice_prompts: {
              on_the_job: {
                question: 'Your data shows that hosts who use third-party dynamic pricing tools (like PriceLabs) have 40% higher earnings and 30% lower churn. The CEO wants to know if you should build dynamic pricing in-house and remove API access for third parties. What do you recommend?',
                guidance: 'Frame as build vs. partner tradeoff with ecosystem implications. Building in-house: captures more value, but alienates pro hosts who depend on third-party tools and reduces ecosystem depth. Maintaining API: third parties build on your platform, deepening ecosystem lock-in. Recommend: build Smart Pricing (already exists) as the default option, maintain API access for pro hosts who need more control.',
                hint: 'The question tests whether you can reason about ecosystem dynamics, not just feature economics. Removing API access trades short-term revenue for long-term ecosystem damage.',
              },
              interview_prep: {
                question: 'What does a true "platform moat" look like versus a "feature moat"? Use Airbnb as an example.',
                guidance: 'Feature moat: competitors can replicate individual features (better search, better UI). Platform moat: users are embedded in a network that generates value independently of any single feature (reviews, reputation, host community, API integrations). Airbnb\'s moat is the bilateral review system, supply quality, and host ecosystem — not any individual feature.',
                hint: 'Tests strategic thinking. Strong candidates explain why moats must be structural (hard to replicate) rather than featural (easy to copy). Airbnb\'s moat is the accumulated trust data and host ecosystem, not the booking flow.',
              },
            },
          },
        },
        {
          id: 'closing',
          layout: 'aarrr_closing',
          content: {
            headline: 'The Full Picture',
            summary: 'Anika started as a product designer Googling weekend cabins. Nine stages later, she\'s a host earning $14,400 a year, a repeat guest with eight trips booked, a wishlist curator with 26 saved listings, an Experiences buyer, a Business travel booker, and an ecosystem participant who would need months to unwind her platform relationship. A product is replaceable. An ecosystem is defensible. Airbnb stopped competing on listings a long time ago. Now it competes on how deeply hosts depend on it for income, how deeply guests depend on it for trust, and how deeply both are connected to a network no competitor can replicate.',
            cta_text: 'Back to all autopsies',
            cta_path: '/explore/showcase',
          },
        },
      ],
    },
  ],
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getShowcaseProducts(): Promise<AutopsyProduct[]> {
  if (IS_MOCK) {
    return MOCK_PRODUCTS
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('autopsy_products')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

  // Compute story count per product
  const productIds = (data ?? []).map((p: { id: string }) => p.id)
  const countMap: Record<string, number> = {}
  if (productIds.length > 0) {
    const { data: storyCounts } = await supabase
      .from('autopsy_stories')
      .select('product_id')
      .in('product_id', productIds)
    for (const row of (storyCounts ?? []) as { product_id: string }[]) {
      countMap[row.product_id] = (countMap[row.product_id] ?? 0) + 1
    }
  }

  return (data ?? []).map((p: AutopsyProduct) => ({
    ...p,
    story_count: countMap[p.id] ?? 0,
  })) as AutopsyProduct[]
}

export async function getShowcaseProduct(slug: string): Promise<AutopsyProductDetail | null> {
  if (IS_MOCK) {
    if (slug === 'notion') return MOCK_NOTION_DETAIL
    if (slug === 'airbnb') return MOCK_AIRBNB_DETAIL
    return null
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('autopsy_products')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!product) return null

  const { data: decisions } = await supabase
    .from('autopsy_decisions')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true })

  // Fetch stories for this product (always, regardless of decisions)
  const { data: stories } = await supabase
    .from('autopsy_stories')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true })

  if (!decisions || decisions.length === 0) {
    return { ...product, decisions: [], stories: (stories ?? []) as AutopsyStory[] } as AutopsyProductDetail
  }

  const decisionIds = decisions.map((d: { id: string }) => d.id)

  const { data: challenges } = await supabase
    .from('autopsy_challenges')
    .select('*')
    .in('decision_id', decisionIds)

  const challengeMap: Record<string, AutopsyChallenge> = {}
  for (const c of (challenges ?? []) as AutopsyChallenge[]) {
    challengeMap[c.decision_id] = c
  }

  return {
    ...product,
    decisions: decisions.map((d: { id: string }) => ({
      ...d,
      challenge: challengeMap[d.id],
    })),
    stories: (stories ?? []) as AutopsyStory[],
  } as AutopsyProductDetail
}
