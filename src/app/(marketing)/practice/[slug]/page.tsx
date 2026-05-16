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

const RUBRIC_PREVIEWS: Record<string, string[]> = {
  'spotify-session-drop-product-sense': [
    'Frame: separates DAU, depth, and segment movement before naming a solution.',
    'List: covers acquisition quality, recommendation changes, content mix, and seasonality.',
    'Win: names the first investigation and what decision it would unlock.',
  ],
  'realtime-notification-system': [
    'Frame: clarifies latency, durability, channel, and user preference requirements.',
    'List: maps fan-out, queueing, storage, retry, and dedupe options.',
    'Optimize: defends the bottleneck and what breaks first at scale.',
  ],
  'multi-tenant-saas-data-model': [
    'Frame: identifies tenant boundary, billing accuracy, and audit requirements.',
    'List: names core entities, events, relationships, and access patterns.',
    'Optimize: explains isolation, denormalization, and history trade-offs.',
  ],
  'sql-product-analytics-retention': [
    'Frame: defines retained, signup cohort, and time window before writing SQL.',
    'Optimize: handles joins, duplicate sessions, and null subscription states.',
    'Win: explains the result as a product decision, not just a table.',
  ],
  'ai-assisted-coding-debugging': [
    'Frame: states constraints and hidden edge cases before editing generated code.',
    'Optimize: compares fix paths for correctness, complexity, and maintainability.',
    'Win: explains why the fix is reliable and how it was verified.',
  ],
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
      <DirectorySection
        eyebrow="Rubric preview"
        title="How FLOW will score the full answer"
        description="The public preview shows what good evidence looks like. The app scores your actual answer and stores the receipt."
      >
        <BulletGrid items={RUBRIC_PREVIEWS[practice.slug] ?? practice.prompts} />
      </DirectorySection>
      <DirectorySection eyebrow="Follow-ups" title="Hatch-style coaching prompts">
        <BulletGrid items={practice.prompts} />
      </DirectorySection>
      <DirectorySection shaded eyebrow="Locked workspace" title="What unlocks after sign in">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            'Answer workspace with timers, notes, schema or code context where relevant.',
            'Hatch follow-ups that adapt to your weak move instead of giving generic hints.',
            'FLOW score receipts across Frame, List, Optimize, and Win.',
            'Next-drill routing into the career goal you are training for.',
          ].map((item) => (
            <div key={item} className="rounded-xl bg-surface-container-lowest p-4 text-sm font-semibold leading-6 ring-1 ring-outline-variant/30">
              {item}
            </div>
          ))}
        </div>
      </DirectorySection>
      <CtaBand title="Open the full workspace to answer, run, and get scored." />
    </DirectoryShell>
  )
}
