import type { Metadata } from 'next'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

export const metadata: Metadata = buildMetadata({
  title: 'Live AI Interview Practice for Product, Systems, SQL, Coding | HackProduct',
  description:
    'Run live AI interviews with Hatch across product sense, system design, data modeling, SQL, and coding. Practice follow-ups, transcripts, and rubric feedback.',
  path: '/interviews/live-ai-interviews',
  keywords: ['live AI interview practice', 'AI mock interview', 'product sense mock interview', 'system design AI interviewer'],
})

const disciplines = ['Product sense', 'System design', 'Data modeling', 'SQL', 'Coding']

const interviewSignals = [
  'Voice-to-voice follow-ups when you hand-wave',
  'Scenario selection across product, systems, data, SQL, and coding',
  'Rubric scoring on framing, trade-offs, and recommendation quality',
  'Debriefs that turn one interview into the next practice prescription',
]

const relatedHubs = [
  {
    title: 'Product sense',
    body: 'Practice ambiguous PM and engineering product decisions.',
    href: '/skills/product-sense',
  },
  {
    title: 'System design',
    body: 'Practice architecture, scale, and technical communication.',
    href: '/skills/system-design',
  },
  {
    title: 'Company prep',
    body: 'Map practice to top tech interview styles.',
    href: '/companies',
  },
]

export default function LiveAiInterviewsDirectoryPage() {
  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Live AI interviews', path: canonicalUrl('/interviews/live-ai-interviews') },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: 'Live AI interview practice',
            description: 'AI-led mock interviews across product and technical interview disciplines.',
            url: canonicalUrl('/interviews/live-ai-interviews'),
            provider: {
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
            },
            teaches: disciplines,
            hasCourseInstance: {
              '@type': 'CourseInstance',
              courseMode: 'Online',
            },
          },
        ]}
      />

      <V3PageHero
        eyebrow="Live AI interviews"
        title="Mock interviews that push back like the real loop."
        subtitle="Hatch runs live practice rooms across product sense, system design, data modeling, SQL, and coding, then writes the debrief you can act on."
        ctas={[{ label: 'Open interview room', href: '/live-interviews' }]}
      />

      <V3Section title="Interview disciplines">
        <V3CardGrid>
          {disciplines.map((discipline) => (
            <V3Card key={discipline} title={discipline} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section eyebrow="Signals" title="What the interview room trains">
        <V3CardGrid>
          {interviewSignals.map((signal) => (
            <V3Card key={signal} title={signal} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section title="Related public hubs">
        <V3CardGrid>
          {relatedHubs.map((hub) => (
            <V3Card key={hub.href} title={hub.title} body={hub.body} href={hub.href} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Run the room when you want pressure."
        ctas={[{ label: 'Start an interview', href: '/live-interviews' }]}
      />
    </V3PageShell>
  )
}
