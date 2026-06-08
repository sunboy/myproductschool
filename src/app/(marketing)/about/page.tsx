import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

export const metadata: Metadata = buildMetadata({
  title: 'About HackProduct | AI-Native Practice System',
  description:
    'HackProduct makes product and technical judgment trainable with live interview loops, Hatch AI coaching, autopsies, study plans, code, canvas, FLOW, and scoring.',
  path: '/about',
  keywords: [
    'about HackProduct',
    'AI-native practice system',
    'product judgment training',
    'technical interview practice',
    'Hatch AI coach',
  ],
})

const pillars = [
  {
    title: 'Practice should feel like the room',
    body: 'The hardest interview moments are not static questions. They are follow-ups, tradeoffs, artifacts, and judgment under pressure.',
  },
  {
    title: 'Feedback should stay connected',
    body: 'Hatch keeps the rep, rubric, blind spot, score, and next action in one loop so learning compounds.',
  },
  {
    title: 'Judgment should be trainable',
    body: 'Product sense, systems thinking, data modeling, SQL, coding, and communication improve through deliberate reps.',
  },
]

const exploreLinks = [
  { label: 'Live interviews', href: '/interviews/live-ai-interviews' },
  { label: 'Skill practice', href: '/skills' },
  { label: 'Autopsies', href: '/autopsies' },
  { label: 'Pricing', href: '/pricing' },
]

export default function AboutPage() {
  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'Home', path: 'https://hackproduct.dev/' },
            { name: 'About', path: 'https://hackproduct.dev/about' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'About HackProduct',
            url: 'https://hackproduct.dev/about',
            description:
              'HackProduct is the AI-native practice system for product and technical judgment.',
          },
        ]}
      />

      <V3PageHero
        eyebrow="About"
        title="The AI-native practice system for product and technical judgment."
        subtitle="Our mission is to make product and technical judgment trainable. To do this, we built one connected system for interviews, role transitions, and high-stakes career moments: live loops, Hatch coaching, rubrics, autopsies, study plans, code, canvas, FLOW, and scoring."
      />

      <V3Section eyebrow="What we believe" title="Three things shape how we build.">
        <V3CardGrid>
          {pillars.map((pillar) => (
            <V3Card key={pillar.title} title={pillar.title} body={pillar.body} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section title="Train the full career moment.">
        <V3CardGrid>
          {exploreLinks.map((link) => (
            <V3Card key={link.href} title={link.label} href={link.href} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Start training judgment, one rep at a time."
        subtitle="Run a live loop, get a score, and see the next move."
        ctas={[{ label: 'Get started', href: '/signup' }]}
      />
    </V3PageShell>
  )
}
