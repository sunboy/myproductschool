import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/site'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'

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

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-on-surface">
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
      <section className="border-b border-outline-variant bg-[#f6f0e7]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-24">
          <div>
            <Link href="/" className="text-sm font-black text-primary no-underline">
              HackProduct
            </Link>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.16em] text-primary">
              About
            </p>
            <h1 className="mt-4 font-headline text-4xl font-black leading-tight text-on-surface sm:text-6xl">
              The AI-native practice system for product and technical judgment.
            </h1>
          </div>
          <div className="max-w-2xl self-end">
            <p className="text-xl font-bold leading-8 text-on-surface">
              Our mission is to make product and technical judgment trainable.
            </p>
            <p className="mt-5 text-lg leading-8 text-on-surface-variant">
              To do this, we built one connected system for interviews, role transitions,
              and high-stakes career moments: live loops, Hatch coaching, rubrics, autopsies,
              study plans, code, canvas, FLOW, and scoring.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-lg border border-outline-variant bg-white p-6">
              <h2 className="text-xl font-black text-on-surface">{pillar.title}</h2>
              <p className="mt-4 text-sm font-semibold leading-6 text-on-surface-variant">
                {pillar.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-primary/20 bg-primary-container/30 p-6 md:p-8">
          <h2 className="font-headline text-3xl font-black text-on-surface">
            Train the full career moment.
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Live interviews', href: '/interviews/live-ai-interviews' },
              { label: 'Skill practice', href: '/skills' },
              { label: 'Autopsies', href: '/explore/autopsies' },
              { label: 'Pricing', href: '/pricing' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-outline-variant bg-white px-4 py-3 text-sm font-black text-on-surface no-underline transition-colors hover:border-primary hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
