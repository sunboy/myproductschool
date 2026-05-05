import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
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
import { getStudyPlan, STUDY_PLAN_DIRECTORIES } from '@/lib/seo/directory-content'

type Props = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return STUDY_PLAN_DIRECTORIES.map((plan) => ({ slug: plan.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const plan = getStudyPlan(slug)
  if (!plan) return {}
  return buildMetadata({
    title: plan.metaTitle,
    description: plan.metaDescription,
    path: `/study-plans/${plan.slug}`,
    keywords: [plan.title, plan.audience, 'HackProduct study plan'],
  })
}

export default async function StudyPlanDirectoryDetailPage({ params }: Props) {
  const { slug } = await params
  const plan = getStudyPlan(slug)
  if (!plan) notFound()

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: plan.title,
    description: plan.summary,
    url: canonicalUrl(`/study-plans/${plan.slug}`),
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    educationalLevel: plan.level,
    teaches: plan.outcomes,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: `P${plan.weeks}W`,
    },
  }

  return (
    <DirectoryShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Study plans', path: canonicalUrl('/study-plans') },
            { name: plan.title, path: canonicalUrl(`/study-plans/${plan.slug}`) },
          ]),
          courseJsonLd,
        ]}
      />
      <DirectoryHero
        eyebrow={`${plan.weeks} weeks · ${plan.level}`}
        title={plan.title}
        description={plan.summary}
        ctaLabel="Start this plan"
      />
      <DirectorySection title="Built for">
        <PillList items={[plan.audience]} />
      </DirectorySection>
      <DirectorySection shaded eyebrow="Sequence" title="Plan chapters">
        <BulletGrid items={plan.chapters} />
      </DirectorySection>
      <DirectorySection eyebrow="Outcomes" title="What you should be able to do">
        <BulletGrid items={plan.outcomes} />
      </DirectorySection>
      <CtaBand title="Use the preview as the map. Use Hatch for the reps." />
    </DirectoryShell>
  )
}
