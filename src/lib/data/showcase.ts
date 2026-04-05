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
        context:
          'You are the PM for a new note-taking product targeting knowledge workers. Your eng lead says blocks are 3x harder to build than a standard rich-text editor. Your designer says users expect familiar word-processor UX. You need to choose an editing paradigm before the team starts building.',
        options: [
          {
            label: 'A',
            text: 'Build blocks -- composability is a long-term moat even if harder upfront',
            quality: 'best',
            explanation:
              'Correct tradeoff. The short-term cost is real but blocks unlock embedding, linking, and database views that rich-text cannot replicate structurally. This is exactly the bet Notion made.',
          },
          {
            label: 'B',
            text: 'Build rich-text first, migrate to blocks later once you have users',
            quality: 'plausible_wrong',
            explanation:
              'Migration from rich-text to blocks is extremely costly -- it requires re-parsing all existing content and retraining user muscle memory. This "build it later" approach rarely works for foundational architectural choices.',
          },
          {
            label: 'C',
            text: 'Use rich-text and differentiate on collaboration features instead',
            quality: 'surface',
            explanation:
              'Collaboration is table stakes in 2024. Choosing rich-text to save eng time while planning to win on collaboration is a weak competitive position -- you trade a structural moat for a feature race.',
          },
          {
            label: 'D',
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
        context:
          'You are the growth PM at a project management SaaS targeting software teams. The CEO wants to go "enterprise-first" with no free tier to avoid support costs. Your data shows 70% of paid conversions come from users who discovered the product personally before pitching it to their manager.',
        options: [
          {
            label: 'A',
            text: 'Offer a free individual tier -- personal champions drive team adoption',
            quality: 'best',
            explanation:
              'Your own data validates this. When individuals discover value before organizational purchasing, a free personal tier is a growth mechanism, not just a cost center. This is the classic PLG (product-led growth) motion.',
          },
          {
            label: 'B',
            text: 'Go enterprise-first -- free tiers attract non-buyers and inflate support costs',
            quality: 'surface',
            explanation:
              'This ignores the 70% conversion signal in your own data. Enterprise-first works when buyers are centralized procurement teams, but for tools developers choose, the bottom-up motion is more efficient.',
          },
          {
            label: 'C',
            text: 'Offer a time-limited free trial instead -- captures urgency and limits freeloaders',
            quality: 'good_but_incomplete',
            explanation:
              'Time limits create urgency but also create friction for slow-evaluating users and destroy the "always available" positioning that makes champions reliable advocates. Works for high-ACV products, less so for bottom-up PLG.',
          },
          {
            label: 'D',
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
        context:
          'Your note-taking app has strong retention among individual writers. Users frequently request spreadsheet-like features. Your team is split: half want to stay focused on writing, half want to expand into structured data to compete with Airtable. You have 6 months of runway for a major feature investment.',
        options: [
          {
            label: 'A',
            text: 'Add databases only if they can share the same block system -- interoperability is the differentiator',
            quality: 'best',
            explanation:
              'This is exactly the Notion insight. The value is not "we also have a database" -- it is "your document and your database live in the same block, so you can embed a filtered view inside a meeting note." Interoperability is the moat; a bolted-on database is just feature parity.',
          },
          {
            label: 'B',
            text: 'Stay focused on writing -- expanding to databases dilutes the brand',
            quality: 'good_but_incomplete',
            explanation:
              'Focus is valuable, but if users are already context-switching to Airtable from your product, you are not actually retaining their workflow -- just part of it. The "stay focused" instinct is right if the expansion is bolt-on; wrong if it deepens the core use case.',
          },
          {
            label: 'C',
            text: 'Build a separate database product and integrate via API',
            quality: 'surface',
            explanation:
              'Separate products mean separate adoption curves and separate context-switching -- exactly the problem you are trying to solve. API integration rarely achieves the seamlessness that makes the combined workflow valuable.',
          },
          {
            label: 'D',
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
  stories: [],
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

  if (!decisions || decisions.length === 0) {
    return { ...product, decisions: [], stories: [] } as AutopsyProductDetail
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

  // Fetch stories for this product
  const { data: stories } = await supabase
    .from('autopsy_stories')
    .select('*')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true })

  return {
    ...product,
    decisions: decisions.map((d: { id: string }) => ({
      ...d,
      challenge: challengeMap[d.id],
    })),
    stories: (stories ?? []) as AutopsyStory[],
  } as AutopsyProductDetail
}
