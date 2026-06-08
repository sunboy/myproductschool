import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { getStudyPlan, STUDY_PLAN_DIRECTORIES } from '@/lib/seo/directory-content'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

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
    <V3PageShell>
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

      <V3PageHero
        eyebrow={`${plan.weeks} weeks · ${plan.level}`}
        title={plan.title}
        subtitle={plan.summary}
        ctas={[{ label: 'Start this plan', href: '/signup' }]}
      />

      <V3Section title="Built for">
        <V3CardGrid>
          <V3Card title={plan.audience} />
        </V3CardGrid>
      </V3Section>

      <V3Section eyebrow="Sequence" title="Plan chapters">
        <V3CardGrid>
          {plan.chapters.map((chapter, index) => (
            <V3Card key={chapter} eyebrow={`Chapter ${index + 1}`} title={chapter} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section eyebrow="Outcomes" title="What you should be able to do">
        <V3CardGrid>
          {plan.outcomes.map((outcome) => (
            <V3Card key={outcome} title={outcome} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Use the preview as the map. Use Hatch for the reps."
        subtitle="Run a live loop, get a score, and see the next move."
        ctas={[{ label: 'Get started', href: '/signup' }]}
      />
    </V3PageShell>
  )
}
