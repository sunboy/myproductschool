import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { getPractice, PRACTICE_DIRECTORIES } from '@/lib/seo/directory-content'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import {
  V3PageHero,
  V3Section,
  V3CardGrid,
  V3Card,
  V3ProseSection,
  V3ProseBlock,
  V3CtaBand,
} from '@/components/landing-v3/sections'

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

const LOCKED_WORKSPACE = [
  'Answer workspace with timers, notes, schema or code context where relevant.',
  'Hatch follow-ups that adapt to the skill you are building instead of giving generic hints.',
  'FLOW scores across Frame, List, Optimize, and Win.',
  'A recommended next challenge matched to the career goal you are training for.',
]

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

  // Published workspace slugs verified against the content catalog. Other
  // public examples lead to the relevant catalog rather than implying an
  // exact workspace exists for a marketing-only scenario.
  const workspaceSlugs: Record<string, string> = {
    'spotify-session-drop-product-sense': 'spotifys-15-session-drop',
    'realtime-notification-system': 'design-a-notification-system',
    'analytics-funnel-drop-investigation': 'checkout-funnel-drop',
  }
  const disciplines: Record<string, string> = {
    'Product sense': 'product_sense', 'System design': 'system_design',
    'Data modeling': 'data_modeling', SQL: 'sql', Coding: 'coding', Analytics: 'analytics',
  }
  const workspaceSlug = workspaceSlugs[practice.slug]
  const destination = workspaceSlug
    ? `/workspace/challenges/${workspaceSlug}`
    : `/challenges?discipline=${disciplines[practice.discipline] ?? 'all'}`
  const entryHref = `/login?returnTo=${encodeURIComponent(destination)}`
  const entryLabel = workspaceSlug ? 'Open this challenge' : 'Browse related challenges'

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
    <V3PageShell>
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

      <V3PageHero
        eyebrow={practice.discipline}
        title={practice.title}
        subtitle={practice.summary}
        ctas={[{ label: entryLabel, href: entryHref }]}
      />

      <V3Section eyebrow="Scenario" title="Challenge prompt">
        <V3ProseSection>
          <V3ProseBlock>
            <p>{practice.scenario}</p>
          </V3ProseBlock>
        </V3ProseSection>
      </V3Section>

      <V3Section eyebrow="Skills" title="Skills this challenge builds">
        <V3ProseSection>
          <V3ProseBlock>
            <ul>
              {practice.skills.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </V3ProseBlock>
        </V3ProseSection>
      </V3Section>

      <V3Section
        eyebrow="Rubric preview"
        title="How FLOW scores the full answer"
        subtitle="The public preview shows what strong evidence looks like. The app scores your actual answer and keeps the result in your learning history."
      >
        <V3CardGrid>
          {(RUBRIC_PREVIEWS[practice.slug] ?? practice.prompts).map((item) => (
            <V3Card key={item} title={item} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section eyebrow="Follow-ups" title="Hatch coaching prompts">
        <V3CardGrid>
          {practice.prompts.map((item) => (
            <V3Card key={item} title={item} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section eyebrow="Locked workspace" title="What unlocks after sign in">
        <V3CardGrid>
          {LOCKED_WORKSPACE.map((item) => (
            <V3Card key={item} title={item} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Continue learning in the app."
        subtitle="Public previews show the challenge. The app gives you guided feedback, Hatch follow-ups, FLOW scoring, and a clear next step."
        ctas={[{ label: entryLabel, href: entryHref }]}
      />
    </V3PageShell>
  )
}
