import type { Metadata } from 'next'
import { canReadAutopsyStory, getAutopsyAccess, getAutopsyGateLabel } from '@/lib/autopsies/access'
import { getAutopsyCompanies, getQueuedAutopsyStories } from '@/lib/autopsies/queries'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

export const metadata: Metadata = buildMetadata({
  title: 'Product Autopsies | HackProduct',
  description:
    'Read public HackProduct product autopsies, company teardowns, source-backed feature stories, and Hatch-led visual product lessons.',
  path: '/autopsies',
  keywords: ['product autopsies', 'company teardowns', 'feature autopsies', 'product strategy examples'],
})

export default async function AutopsiesPage() {
  // Data fetching — UNCHANGED. Same three parallel reads as before.
  const [companies, stories, access] = await Promise.all([
    getAutopsyCompanies(),
    getQueuedAutopsyStories(),
    getAutopsyAccess(),
  ])

  // Gating logic — UNCHANGED. First `access.freeStoryLimit` feature stories are
  // public; the rest require sign-up. canReadAutopsyStory + getAutopsyGateLabel
  // drive per-card access exactly as the old AutopsyIndexPage did.
  const companyTeardowns = stories.filter((story) => story.storyType === 'company_teardown')
  const featureStories = stories.filter((story) => story.storyType === 'feature_autopsy')
  const visibleStories = featureStories.slice(0, access.freeStoryLimit)
  const signedUpOnlyCount = Math.max(0, featureStories.length - visibleStories.length)
  const publishedCount = stories.filter((story) => story.status === 'published').length

  const companyName = (slug: string) => companies.find((item) => item.slug === slug)?.name ?? slug

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Autopsies', path: canonicalUrl('/autopsies') },
          ]),
        ]}
      />

      <V3PageHero
        eyebrow="Public autopsies"
        title="Product stories with receipts, visuals, and clear judgment."
        subtitle="Company hubs hold both the larger teardown and the narrower feature autopsies. The reader sees one library, grouped by company."
      />

      <V3Section
        eyebrow="Intelligent gate"
        title="Read the first three. See the full research map. Sign up for the rest."
        subtitle={`${visibleStories.length} pieces open now, ${signedUpOnlyCount} for signed-up readers. ${publishedCount} published across ${companies.length} company hubs.`}
      >
        <V3CardGrid>
          <V3Card eyebrow="Open" title={`${visibleStories.length} pieces`} body="Public reads available before signup." />
          <V3Card eyebrow="Signed-up readers" title={`${signedUpOnlyCount} pieces`} body="Full library access opens after account creation." />
          <V3Card eyebrow="Publish rule" title="Approved only" body="Every piece clears source, claim, proofread, image, and mobile checks." />
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="First public reads"
        title="The opening set"
        subtitle="These are the first reader-facing slots. Drafts show production briefs until the full research and image packet is approved."
      >
        <V3CardGrid>
          {visibleStories.map((story) => (
            <V3Card
              key={story.slug}
              href={story.canonicalPath}
              eyebrow={`${companyName(story.companySlug)} · ${getAutopsyGateLabel(story, access)}`}
              title={story.title}
              body={story.dek}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      {companyTeardowns.length > 0 ? (
        <V3Section
          eyebrow="Company teardowns"
          title="The hub-level stories"
          subtitle="Company teardowns explain the system and operating bet. Feature autopsies sit underneath them as narrower reading pieces."
        >
          <V3CardGrid>
            {companyTeardowns.map((story) => (
              <V3Card
                key={story.slug}
                href={story.canonicalPath}
                eyebrow={`${companyName(story.companySlug)} · ${getAutopsyGateLabel(story, access)}`}
                title={story.title}
                body={story.dek}
              />
            ))}
          </V3CardGrid>
        </V3Section>
      ) : null}

      <V3Section
        eyebrow="Company hubs"
        title="Company hubs organize the library."
        subtitle="Each hub keeps company context, the company-level teardown, timeline notes, and feature autopsies together."
      >
        <V3CardGrid>
          {companies.map((company) => (
            <V3Card
              key={company.slug}
              href={`/autopsies/${company.slug}`}
              eyebrow={`${company.industry} · ${company.stories.length} stories`}
              title={company.name}
              body={company.thesis}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="Full queue"
        title="All planned feature autopsies"
        subtitle="The full set stays visible so readers understand the editorial promise. Signed-up readers get access beyond the public preview limit as pieces are approved."
      >
        <V3CardGrid>
          {featureStories.map((story) => (
            <V3Card
              key={story.slug}
              href={story.canonicalPath}
              eyebrow={`#${story.queueRank} · ${companyName(story.companySlug)}${
                canReadAutopsyStory(story, access) ? '' : ' · Signup required'
              }`}
              title={story.title}
              body={story.dek}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Read the library, then run the loop."
        subtitle="Sign up to unlock every autopsy and start practicing the judgment behind them."
        ctas={[{ label: 'Sign up', href: '/signup' }]}
      />
    </V3PageShell>
  )
}
