import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { getSkill, itemListJsonLd, SKILL_DIRECTORIES } from '@/lib/seo/directory-content'
import { OUTCOME_PAGES } from '@/lib/seo/outcomes'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

type Props = {
  params: Promise<{ slug: string }>
}

const FLOW_MAPPING: Record<string, string[]> = {
  'product-sense': [
    'Frame the user, segment, metric, and actual job-to-be-done.',
    'List hypotheses, segments, solution paths, and trade-offs before picking one.',
    'Optimize with impact, confidence, effort, and evidence quality.',
    'Win with a clear recommendation, risks, and next validation step.',
  ],
  'system-design': [
    'Frame product requirements, scale, reliability, latency, and durability constraints.',
    'List components, APIs, storage choices, queues, and failure modes.',
    'Optimize for the bottleneck that matters most to the product.',
    'Win by defending the architecture and naming what breaks first.',
  ],
  'data-modeling': [
    'Frame the product domain, actors, rules, and access patterns.',
    'List entities, relationships, events, and invariants.',
    'Optimize normalization, denormalization, history, and tenant boundaries.',
    'Win by explaining how the model answers future product questions.',
  ],
  sql: [
    'Frame the business question and define the metric precisely.',
    'List tables, join paths, filters, and edge cases.',
    'Optimize query shape, assumptions, and result interpretation.',
    'Win by translating output into a decision someone can trust.',
  ],
  coding: [
    'Frame constraints, input shape, correctness bar, and communication plan.',
    'List approaches and edge cases before committing to implementation.',
    'Optimize complexity, maintainability, and confidence in the proof.',
    'Win by explaining trade-offs and reviewing AI output critically.',
  ],
  'ai-native-workflows': [
    'Frame the workflow, human risk, model role, and acceptance criteria.',
    'List context sources, evals, review loops, and fallback paths.',
    'Optimize for quality, latency, cost, safety, and product value.',
    'Win by making model behavior and human control legible.',
  ],
}

export function generateStaticParams() {
  return SKILL_DIRECTORIES.map((skill) => ({ slug: skill.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const skill = getSkill(slug)
  if (!skill) return {}
  return buildMetadata({
    title: skill.metaTitle,
    description: skill.metaDescription,
    path: `/skills/${skill.slug}`,
    keywords: [skill.shortTitle, `${skill.shortTitle} interview practice`, `${skill.shortTitle} AI coaching`, 'HackProduct'],
  })
}

export default async function SkillDirectoryDetailPage({ params }: Props) {
  const { slug } = await params
  const skill = getSkill(slug)
  if (!skill) notFound()

  const related = skill.related.map((item) => ({
    label: item.label,
    href: item.href,
    description: item.description ?? `Related HackProduct directory for ${skill.shortTitle}.`,
  }))

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: skill.title,
    description: skill.summary,
    url: canonicalUrl(`/skills/${skill.slug}`),
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    educationalLevel: skill.eyebrow,
    teaches: skill.outcomes,
    audience: skill.audience.map((audience) => ({ '@type': 'Audience', audienceType: audience })),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: 'PT20M',
    },
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: skill.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }

  const flowSteps = ['Frame', 'List', 'Optimize', 'Win']

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Skills', path: canonicalUrl('/skills') },
            { name: skill.shortTitle, path: canonicalUrl(`/skills/${skill.slug}`) },
          ]),
          courseJsonLd,
          itemListJsonLd(`${skill.shortTitle} related directories`, related),
          faqJsonLd,
        ]}
      />

      <V3PageHero
        eyebrow={skill.eyebrow}
        title={skill.title}
        subtitle={`${skill.summary} ${skill.thesis}`}
        ctas={[
          { label: `Practice ${skill.shortTitle}`, href: '/signup' },
          { label: 'Browse previews', href: '/practice' },
        ]}
      />

      <V3Section title={`Who should practice ${skill.shortTitle.toLowerCase()}?`}>
        <V3CardGrid>
          {skill.audience.map((item) => (
            <V3Card key={item} title={item} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="Outcomes"
        title="What Hatch trains you to do"
        subtitle="These are the capabilities the app grades and coaches while you work through scenarios."
      >
        <V3CardGrid>
          {skill.outcomes.map((outcome) => (
            <V3Card key={outcome} title={outcome} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="FLOW mapping"
        title={`How FLOW scores ${skill.shortTitle.toLowerCase()}`}
        subtitle="The same four moves apply across every discipline, but the evidence changes by track."
      >
        <V3CardGrid>
          {(FLOW_MAPPING[skill.slug] ?? FLOW_MAPPING['product-sense']).map((item, index) => (
            <V3Card key={item} eyebrow={flowSteps[index]} title={item} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section eyebrow="Practice formats" title="Representative prompts">
        <V3CardGrid>
          {skill.practiceTypes.map((type) => (
            <V3Card key={type} eyebrow="Format" title={type} />
          ))}
        </V3CardGrid>
        <V3CardGrid>
          {skill.samplePrompts.map((prompt) => (
            <V3Card key={prompt} eyebrow="Prompt" title={prompt} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="Career outcomes"
        title="Where this skill creates leverage"
        subtitle="HackProduct sells the career moment first, then routes you into the reps and disciplines that prove the skill."
      >
        <V3CardGrid>
          {OUTCOME_PAGES.map((outcome) => (
            <V3Card
              key={outcome.slug}
              href={outcome.path}
              eyebrow="Outcome"
              title={outcome.shortTitle}
              body={outcome.proofPoint}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section title="Related directories">
        <V3CardGrid>
          {skill.related.map((link) => (
            <V3Card
              key={link.href}
              href={link.href}
              title={link.label}
              body={link.description ?? `Continue exploring ${skill.shortTitle} through HackProduct's public learning directory.`}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section eyebrow="FAQ" title={`Questions about ${skill.shortTitle.toLowerCase()}`}>
        <V3CardGrid>
          {skill.faqs.map((faq) => (
            <V3Card key={faq.q} title={faq.q} body={faq.a} />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title={`Turn ${skill.shortTitle.toLowerCase()} into reps.`}
        subtitle="Run a live loop, get a score, and see the next move."
        ctas={[
          { label: 'Back to all skills', href: '/skills' },
          { label: 'Get started', href: '/signup' },
        ]}
      />
    </V3PageShell>
  )
}
