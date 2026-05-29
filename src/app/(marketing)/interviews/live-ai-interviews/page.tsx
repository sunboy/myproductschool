import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BulletGrid,
  CtaBand,
  DirectoryHero,
  DirectorySection,
  DirectoryShell,
  PillList,
} from '@/components/directory/DirectoryChrome'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'

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

export default function LiveAiInterviewsDirectoryPage() {
  return (
    <DirectoryShell>
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
      <DirectoryHero
        eyebrow="Live AI interviews"
        title="Mock interviews that push back like the real loop."
        description="Hatch runs live practice rooms across product sense, system design, data modeling, SQL, and coding, then writes the debrief you can act on."
        ctaHref="/live-interviews"
        ctaLabel="Open interview room"
      />
      <DirectorySection title="Interview disciplines">
        <PillList items={disciplines} />
      </DirectorySection>
      <DirectorySection shaded eyebrow="Signals" title="What the interview room trains">
        <BulletGrid items={interviewSignals} />
      </DirectorySection>
      <DirectorySection title="Related public hubs">
        <div className="grid gap-3 md:grid-cols-3">
          <Link className="rounded-xl bg-surface-container-lowest p-5 no-underline ring-1 ring-outline-variant/35 hover:ring-primary/35" href="/skills/product-sense">
            <div className="font-headline text-xl font-semibold text-on-surface">Product sense</div>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Practice ambiguous PM and engineering product decisions.</p>
          </Link>
          <Link className="rounded-xl bg-surface-container-lowest p-5 no-underline ring-1 ring-outline-variant/35 hover:ring-primary/35" href="/skills/system-design">
            <div className="font-headline text-xl font-semibold text-on-surface">System design</div>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Practice architecture, scale, and technical communication.</p>
          </Link>
          <Link className="rounded-xl bg-surface-container-lowest p-5 no-underline ring-1 ring-outline-variant/35 hover:ring-primary/35" href="/companies">
            <div className="font-headline text-xl font-semibold text-on-surface">Company prep</div>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Map practice to top tech interview styles.</p>
          </Link>
        </div>
      </DirectorySection>
      <CtaBand title="Run the room when you want pressure." href="/live-interviews" label="Start an interview" />
    </DirectoryShell>
  )
}
