import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const ROLES = ['All', 'SWE', 'Data Eng', 'ML Eng', 'DevOps', 'EM', 'Founding Eng'] as const

const PATHWAYS = [
  {
    name: 'Traditional',
    tagline: 'Build the right thing, not just the thing right. Core fundamentals of product logic.',
    challengeCount: 150,
    icon: 'architecture',
    borderColor: 'border-primary',
    bgColor: 'bg-primary-fixed/20',
    iconBg: 'bg-primary-container',
    subtopics: ['Failure Analysis', 'Second-Order Thinking', 'Scope Negotiation'],
  },
  {
    name: 'AI-Assisted',
    tagline: 'Use AI tools without losing judgment. Enhancing productivity through co-pilots.',
    challengeCount: 50,
    icon: 'smart_toy',
    borderColor: 'border-tertiary',
    bgColor: 'bg-tertiary-container/10',
    iconBg: 'bg-tertiary-container',
    subtopics: ['AI Tool Judgment', 'Impact Translation'],
  },
  {
    name: 'Agentic',
    tagline: 'Design systems where agents act autonomously. New architectures for intent.',
    challengeCount: 70,
    icon: 'hub',
    borderColor: 'border-primary-container',
    bgColor: 'bg-primary-container/10',
    iconBg: 'bg-primary-container',
    subtopics: ['Trust & Autonomy', 'Agent Economics'],
  },
  {
    name: 'AI-Native',
    tagline: "Products that couldn't exist without AI. Ground-up zero-to-one strategy.",
    challengeCount: 70,
    icon: 'neurology',
    borderColor: 'border-secondary',
    bgColor: 'bg-secondary-container/20',
    iconBg: 'bg-secondary-container',
    subtopics: ['AI Product Strategy', 'AI UX Patterns'],
  },
] as const

const STUDY_PLANS = [
  {
    title: 'Staff Engineer Path',
    roles: ['SWE'],
    duration: '6 weeks',
    description: 'Master high-level architecture and organizational impact.',
    slug: 'staff-engineer-path',
  },
  {
    title: '7-Day Prep',
    roles: ['SWE', 'Data', 'ML'],
    duration: '7 days',
    description: 'Intensive refresher for upcoming product design interviews.',
    slug: '7-day-prep',
  },
  {
    title: 'AI Product Fluency',
    roles: ['SWE', 'ML', 'Founding'],
    duration: '4 weeks',
    description: 'Bridging the gap between model capabilities and UX.',
    slug: 'ai-product-fluency',
  },
  {
    title: 'Data Eng -> Product',
    roles: ['Data Eng'],
    duration: '4 weeks',
    description: 'Leveraging data pipelines for product decisions.',
    slug: 'data-eng-product',
  },
] as const

const FLASHCARD_DECKS = [
  { name: 'Product Terms', cards: 42, icon: 'menu_book' },
  { name: 'Growth Loops', cards: 28, icon: 'cycle' },
  { name: 'User Psych', cards: 35, icon: 'psychology' },
  { name: 'Metric Guardrails', cards: 15, icon: 'monitoring' },
] as const

const FRAMEWORKS = [
  { name: 'CIRCLES Method\u2122', description: 'Product Design Interview Classic', tag: 'CIRC' },
  { name: 'RICE Prioritization', description: 'Reach, Impact, Confidence, Effort', tag: 'RICE' },
  { name: 'Kano Model', description: 'Delighters vs. Basic Needs', tag: 'KANO' },
] as const

interface ExplorePageProps {
  searchParams: Promise<{ role?: string }>
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { role } = await searchParams
  const activeRole = role || 'All'

  const buildHref = (r: string) => {
    if (r === 'All') return '/explore'
    return `/explore?role=${encodeURIComponent(r)}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-3 animate-fade-in-up">
      {/* Page header */}
      <div>
        <h1 className="font-headline text-2xl font-extrabold text-primary">Explore Hub</h1>
        <p className="text-xs text-on-surface-variant font-body mt-0.5">Browse by paradigm, plan your path, or dive into concepts</p>
      </div>

      {/* Role filter chips */}
      <div className="flex gap-2 flex-wrap">
        {ROLES.map(r => (
          <Link
            key={r}
            href={buildHref(r)}
            className={`px-3 py-1 rounded-full text-xs font-label font-semibold transition-colors ${
              activeRole === r
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {r}
          </Link>
        ))}
      </div>

      {/* Learning Paradigm Pathways - 2x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PATHWAYS.map(pathway => (
          <Link
            key={pathway.name}
            href={`/challenges?paradigm=${encodeURIComponent(pathway.name)}`}
            className={`group card-elevated card-interactive ${pathway.bgColor} rounded-2xl p-4 border-l-4 ${pathway.borderColor} transition-all`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-headline text-base font-bold text-on-surface">{pathway.name}</h3>
              <div className={`w-8 h-8 ${pathway.iconBg} rounded-lg flex items-center justify-center`}>
                <span className="material-symbols-outlined text-primary text-xl">{pathway.icon}</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-2">{pathway.tagline}</p>
            <div className="flex flex-wrap gap-1">
              {pathway.subtopics.map(topic => (
                <span key={topic} className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-full text-[10px] font-label">
                  {topic}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* Study Plans section */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline text-lg font-bold text-on-surface">Study Plans</h2>
          <Link href="/prep/study-plans" className="text-xs font-label font-semibold text-primary hover:underline flex items-center gap-1">
            View All Plans <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STUDY_PLANS.map(plan => (
            <Link
              key={plan.slug}
              href={`/prep/study-plans/${plan.slug}`}
              className="card-elevated card-interactive rounded-xl p-3 transition-all group"
            >
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full font-label font-semibold">{plan.duration}</span>
                {plan.roles.map(r => (
                  <span key={r} className="text-[10px] px-2 py-0.5 bg-primary-fixed text-primary rounded-full font-label font-semibold">{r}</span>
                ))}
              </div>
              <h3 className="font-label font-bold text-on-surface text-sm mb-0.5">{plan.title}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-2">{plan.description}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                <LumaGlyph size={14} className="text-primary" />
                <span>By Luma &amp; Team</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Flashcards & Frameworks side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Flashcards */}
        <section>
          <h2 className="font-headline text-lg font-bold text-on-surface mb-2">Flashcards</h2>
          <div className="grid grid-cols-2 gap-2">
            {FLASHCARD_DECKS.map(deck => (
              <div
                key={deck.name}
                className="card-elevated card-interactive rounded-xl p-3 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">{deck.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-label font-semibold text-on-surface text-xs">{deck.name}</h4>
                    <p className="text-[10px] text-on-surface-variant">{deck.cards} cards</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Frameworks */}
        <section>
          <h2 className="font-headline text-lg font-bold text-on-surface mb-2">Frameworks</h2>
          <div className="space-y-1.5">
            {FRAMEWORKS.map(fw => (
              <div
                key={fw.name}
                className="card-elevated card-interactive rounded-xl p-3 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded font-label tracking-wide">{fw.tag}</span>
                  <div>
                    <h4 className="font-label font-semibold text-on-surface text-xs">{fw.name}</h4>
                    <p className="text-[10px] text-on-surface-variant">{fw.description}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-lg">chevron_right</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Luma CTA banner */}
      <div className="bg-surface-container rounded-2xl p-4 flex items-center gap-3">
        <LumaGlyph size={40} className="text-primary flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-label font-bold text-on-surface text-sm">Not sure where to start?</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">I can help you build a personalized study plan based on your current role and goals. Tell me what you&apos;re working on!</p>
        </div>
        <button className="glow-primary bg-primary text-on-primary rounded-full px-4 py-2 text-xs font-label font-bold whitespace-nowrap hover:opacity-90 active:scale-95 transition-all flex-shrink-0">
          Talk to Luma
        </button>
      </div>
    </div>
  )
}
