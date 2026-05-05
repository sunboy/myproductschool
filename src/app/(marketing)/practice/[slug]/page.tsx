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
import { getPractice, PRACTICE_DIRECTORIES } from '@/lib/seo/directory-content'

type Props = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return PRACTICE_DIRECTORIES.map((practice) => ({ slug: practice.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const practice = getPractice(slug)
  if (!practice) return {}
  return buildMetadata({
    title: practice.metaTitle,
    description: practice.metaDescription,
    path: `/practice/${practice.slug}`,
    keywords: [practice.title, practice.discipline, 'HackProduct practice'],
  })
}

export default async function PracticeDirectoryDetailPage({ params }: Props) {
  const { slug } = await params
  const practice = getPractice(slug)
  if (!practice) notFound()

  const learningResourceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: practice.title,
    description: practice.summary,
    url: canonicalUrl(`/practice/${practice.slug}`),
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    educationalUse: 'Practice',
    teaches: practice.skills,
  }

  return (
    <DirectoryShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Practice', path: canonicalUrl('/practice') },
            { name: practice.title, path: canonicalUrl(`/practice/${practice.slug}`) },
          ]),
          learningResourceJsonLd,
        ]}
      />
      <DirectoryHero
        eyebrow={practice.discipline}
        title={practice.title}
        description={practice.summary}
        ctaLabel="Practice in the app"
      />
      <DirectorySection eyebrow="Scenario" title="Prompt preview">
        <blockquote className="max-w-4xl rounded-2xl bg-surface-container-lowest p-6 font-headline text-2xl font-semibold leading-snug ring-1 ring-outline-variant/35">
          {practice.scenario}
        </blockquote>
      </DirectorySection>
      <DirectorySection shaded title="Skills this rep trains">
        <PillList items={practice.skills} />
      </DirectorySection>
      <DirectorySection eyebrow="Follow-ups" title="Hatch-style coaching prompts">
        <BulletGrid items={practice.prompts} />
      </DirectorySection>
      <CtaBand title="Open the full workspace to answer, run, and get scored." />
    </DirectoryShell>
  )
}
