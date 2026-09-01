import Image from 'next/image'
import Link from 'next/link'
import {
  BarChart3,
  Blocks,
  BookOpen,
  BrainCircuit,
  ClipboardCheck,
  Code2,
  FileSearch,
  GraduationCap,
  Layers3,
  LibraryBig,
  LineChart,
  ListChecks,
  MessageSquareText,
  Mic2,
  Network,
  PlayCircle,
  Route,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'

type FeatureCell = {
  title: string
  icon: LucideIcon
  href: string
  muted?: boolean
}

type SpotlightFeature = {
  key: string
  title: string
  eyebrow: string
  icon: LucideIcon
  href: string
  image: string
  imageFit?: 'cover' | 'contain'
}

const featureCells: FeatureCell[] = [
  { title: 'Live loops', icon: Mic2, href: '/live-interviews' },
  { title: 'Live analyst', icon: LineChart, href: '/claude-code-analytics' },
  { title: 'Challenges', icon: Target, href: '/challenges' },
  { title: 'FLOW', icon: Route, href: '/flow' },
  { title: 'Autopsies', icon: FileSearch, href: '/explore/autopsies' },
  { title: 'Study plans', icon: GraduationCap, href: '/study-plans' },
  { title: 'Learn', icon: BookOpen, href: '/explore/modules' },
  { title: 'Scoring', icon: BarChart3, href: '/progress' },
  { title: 'Quick takes', icon: Timer, href: '/practice', muted: true },
  { title: 'Role tracks', icon: Layers3, href: '/role-transitions' },
  { title: 'Hatch coach', icon: Sparkles, href: '/hatch-preview' },
  { title: 'Product sense', icon: BrainCircuit, href: '/skills/product-sense' },
  { title: 'System design', icon: Network, href: '/skills/system-design' },
  { title: 'Data modeling', icon: Blocks, href: '/skills/data-modeling' },
  { title: 'Coding reps', icon: Code2, href: '/skills/coding' },
  { title: 'Flashcards', icon: ListChecks, href: '/flashcards', muted: true },
  { title: 'Debriefs', icon: ClipboardCheck, href: '/history' },
  { title: 'Simulations', icon: PlayCircle, href: '/simulation' },
  { title: 'Community', icon: Users, href: '/challenges' },
  { title: 'Vocabulary', icon: LibraryBig, href: '/vocabulary', muted: true },
  { title: 'Progress', icon: Trophy, href: '/progress' },
  { title: 'Notes', icon: MessageSquareText, href: '/notes', muted: true },
]

const spotlightFeatures: SpotlightFeature[] = [
  {
    key: 'airbnb',
    title: 'Airbnb decoded',
    eyebrow: 'Autopsy',
    icon: FileSearch,
    href: '/explore/autopsies/airbnb-craigslist-hack',
    image: '/images/autopsies/airbnb-craigslist-hack/final/thumbnail.webp',
  },
  {
    key: 'stripe',
    title: 'Stripe integration',
    eyebrow: 'Teardown',
    icon: Code2,
    href: '/explore/autopsies/stripe-seven-line-integration',
    image: '/images/autopsies/stripe-seven-line-integration/final/thumbnail.webp',
  },
  {
    key: 'loops',
    title: 'Live interview loops',
    eyebrow: 'Practice',
    icon: Mic2,
    href: '/live-interviews',
    image: '/mascots/hatch/generated/interview-conversation-v1/speaking.webp',
    imageFit: 'contain',
  },
  {
    key: 'analyst',
    title: 'Drive a live AI analyst',
    eyebrow: 'Live · Claude Code',
    icon: LineChart,
    href: '/claude-code-analytics',
    image: '/images/hacky_learning.png',
  },
]

export function V3FeatureGrid() {
  return (
    <section className="feature-grid-section" id="features" aria-labelledby="feature-grid-heading">
      <div className="shell">
        <div className="feature-grid-copy">
          <h2 id="feature-grid-heading">Everything you practice in one place.</h2>
          <p>
            Live interviews, a live analyst, challenges, autopsies, and scoring, all connected.
          </p>
        </div>

        <div className="feature-grid-frame" aria-label="HackProduct features">
          <div className="feature-grid">
            {featureCells.map((feature) => {
              const Icon = feature.icon

              return (
                <Link
                  className={`feature-cell${feature.muted ? ' is-muted' : ''}`}
                  href={feature.href}
                  key={feature.title}
                >
                  <Icon aria-hidden="true" strokeWidth={1.85} />
                  <span>{feature.title}</span>
                </Link>
              )
            })}

            {spotlightFeatures.map((feature) => {
              const Icon = feature.icon

              return (
                <Link
                  aria-label={`${feature.title}: ${feature.eyebrow}`}
                  className={`feature-spotlight feature-spotlight-${feature.key}`}
                  href={feature.href}
                  key={feature.key}
                >
                  <div className={`feature-spotlight-art is-${feature.imageFit ?? 'cover'}`} aria-hidden="true">
                    <Image
                      alt=""
                      className="feature-spotlight-image"
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 980px) 24vw, 240px"
                      src={feature.image}
                      unoptimized={feature.key === 'loops'}
                    />
                  </div>
                  <div className="feature-spotlight-label">
                    <Icon aria-hidden="true" strokeWidth={2} />
                    <span>
                      <small>{feature.eyebrow}</small>
                      {feature.title}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
