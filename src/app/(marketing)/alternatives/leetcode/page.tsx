import type { Metadata } from 'next'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { COMPARISON_DIRECTORIES } from '@/lib/seo/directory-content'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

const comparison = COMPARISON_DIRECTORIES.leetcode

const BETTER_FIT = [
  'You need product sense, system design, SQL, and coding communication in one place.',
  'You are an engineer trying to become more product-minded in the AI era.',
  'You want live interview pressure, not only silent problem solving.',
  'You want feedback on reasoning quality, not only pass/fail test cases.',
]

export const metadata: Metadata = buildMetadata({
  title: comparison.metaTitle,
  description: comparison.metaDescription,
  path: '/alternatives/leetcode',
  keywords: ['LeetCode alternative', 'product sense practice', 'AI interview practice', 'coding interview alternative'],
})

export default function LeetcodeAlternativePage() {
  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Alternatives', path: canonicalUrl('/alternatives/leetcode') },
            { name: 'LeetCode alternative', path: canonicalUrl('/alternatives/leetcode') },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: comparison.title,
            description: comparison.summary,
            url: canonicalUrl('/alternatives/leetcode'),
          },
        ]}
      />

      <V3PageHero
        eyebrow="LeetCode alternative"
        title="Practice more than algorithm recall."
        subtitle={comparison.summary}
        ctas={[
          { label: 'Start free', href: '/login' },
          { label: 'Explore coding practice', href: '/skills/coding' },
        ]}
      />

      <V3Section
        title="HackProduct vs. LeetCode"
        subtitle="Where each tool earns its place across the AI-era interview loop."
      >
        <V3CardGrid>
          {comparison.comparisons.map(([dimension, leetcode, hackproduct]) => (
            <V3Card
              key={dimension}
              eyebrow={dimension}
              title={`HackProduct: ${hackproduct}`}
              body={`LeetCode: ${leetcode}`}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section title="When HackProduct is the better fit">
        <V3CardGrid>
          {BETTER_FIT.map((item) => (
            <V3Card key={item} title={item} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Keep LeetCode for algorithms. Add HackProduct for judgment."
        subtitle="Public previews show the map. The app gives you reps, Hatch follow-ups, FLOW feedback, weak-move drills, and saved proof of progress."
        ctas={[{ label: 'Start a free rep', href: '/login' }]}
      />
    </V3PageShell>
  )
}
