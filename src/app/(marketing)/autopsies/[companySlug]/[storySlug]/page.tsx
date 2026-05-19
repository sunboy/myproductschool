import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AutopsyReaderClient } from '@/app/(app)/explore/showcase/[slug]/AutopsyReaderClient'
import { PublicFeatureAutopsyPage } from '@/components/autopsy/PublicFeatureAutopsyPage'
import { StoryReader } from '@/components/autopsy/StoryReader'
import { getAutopsyAccess } from '@/lib/autopsies/access'
import { getLegacyCompanyTeardown } from '@/lib/autopsies/legacy-showcase'
import { getAutopsyStory, getAutopsyStoryParams } from '@/lib/autopsies/queries'
import { buildMetadata } from '@/lib/seo/site'

export async function generateStaticParams() {
  return getAutopsyStoryParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string; storySlug: string }>
}): Promise<Metadata> {
  const { companySlug, storySlug } = await params
  const result = await getAutopsyStory(companySlug, storySlug)
  if (!result) {
    return buildMetadata({
      title: 'Autopsy Story Not Found | HackProduct',
      description: 'The requested HackProduct autopsy story was not found.',
      path: '/autopsies',
    })
  }

  const storyTypeKeyword = result.story.storyType === 'company_teardown' ? 'company teardown' : 'feature autopsy'

  return buildMetadata({
    title: `${result.story.title} Autopsy | HackProduct`,
    description: result.story.dek,
    path: result.story.canonicalPath,
    keywords: [result.story.title, `${result.company.name} product strategy`, storyTypeKeyword],
  })
}

export default async function FeatureAutopsyPage({
  params,
}: {
  params: Promise<{ companySlug: string; storySlug: string }>
}) {
  const { companySlug, storySlug } = await params
  const [result, access] = await Promise.all([
    getAutopsyStory(companySlug, storySlug),
    getAutopsyAccess(),
  ])

  if (!result) notFound()

  if (result.story.storyType === 'company_teardown') {
    const legacy = await getLegacyCompanyTeardown(companySlug, storySlug)
    if (legacy?.reader === 'aarrr') {
      return (
        <AutopsyReaderClient
          product={legacy.product}
          backHref={`/autopsies/${companySlug}`}
          backLabel={`${legacy.product.name} hub`}
          closingHref="/autopsies"
        />
      )
    }
    if (legacy) {
      return (
        <div className="h-screen min-w-0 overflow-hidden bg-background text-on-surface">
          <main className="h-screen min-w-0 overflow-y-auto pb-12">
            <StoryReader
              story={legacy.story}
              productName={legacy.product.name}
              productSlug={companySlug}
              backHref={`/autopsies/${companySlug}`}
              sidebarOffset={false}
              forceVisible
            />
          </main>
        </div>
      )
    }
  }

  return <PublicFeatureAutopsyPage company={result.company} story={result.story} access={access} />
}
