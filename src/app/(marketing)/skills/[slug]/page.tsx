import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  BulletGrid,
  CtaBand,
  DirectoryCard,
  DirectoryHero,
  DirectorySection,
  DirectoryShell,
  PillList,
} from '@/components/directory/DirectoryChrome'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { getSkill, itemListJsonLd, SKILL_DIRECTORIES } from '@/lib/seo/directory-content'
import { OUTCOME_PAGES } from '@/lib/seo/outcomes'

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

  return (
    <DirectoryShell>
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
      <DirectoryHero
        eyebrow={skill.eyebrow}
        title={skill.title}
        description={`${skill.summary} ${skill.thesis}`}
        ctaHref="/login"
        ctaLabel={`Practice ${skill.shortTitle}`}
        secondaryHref="/practice"
        secondaryLabel="Browse previews"
      />
      <DirectorySection title={`Who should practice ${skill.shortTitle.toLowerCase()}?`}>
        <PillList items={skill.audience} />
      </DirectorySection>
      <DirectorySection
        shaded
        eyebrow="Outcomes"
        title="What Hatch trains you to do"
        description="These are the capabilities the app grades and coaches while you work through scenarios."
      >
        <BulletGrid items={skill.outcomes} />
      </DirectorySection>
      <DirectorySection
        eyebrow="FLOW mapping"
        title={`How FLOW scores ${skill.shortTitle.toLowerCase()}`}
        description="The same four moves apply across every discipline, but the evidence changes by track."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {(FLOW_MAPPING[skill.slug] ?? FLOW_MAPPING['product-sense']).map((item, index) => (
            <div key={item} className="rounded-xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/35">
              <div className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-primary">
                {['Frame', 'List', 'Optimize', 'Win'][index]}
              </div>
              <p className="text-sm font-semibold leading-6 text-on-surface-variant">{item}</p>
            </div>
          ))}
        </div>
      </DirectorySection>
      <DirectorySection eyebrow="Practice formats" title="Representative prompts">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <PillList items={skill.practiceTypes} />
          </div>
          <div className="space-y-3">
            {skill.samplePrompts.map((prompt) => (
              <blockquote key={prompt} className="rounded-xl bg-surface-container-lowest p-5 text-base font-semibold leading-7 ring-1 ring-outline-variant/35">
                {prompt}
              </blockquote>
            ))}
          </div>
        </div>
      </DirectorySection>
      <DirectorySection
        shaded
        eyebrow="Career outcomes"
        title="Where this skill creates leverage"
        description="HackProduct sells the career moment first, then routes you into the reps and disciplines that prove the skill."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {OUTCOME_PAGES.map((outcome) => (
            <DirectoryCard
              key={outcome.slug}
              href={outcome.path}
              title={outcome.shortTitle}
              description={outcome.proofPoint}
              meta="Outcome"
            />
          ))}
        </div>
      </DirectorySection>
      <DirectorySection title="Related directories">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {skill.related.map((link) => (
            <DirectoryCard
              key={link.href}
              href={link.href}
              title={link.label}
              description={link.description ?? `Continue exploring ${skill.shortTitle} through HackProduct's public learning directory.`}
            />
          ))}
        </div>
      </DirectorySection>
      <DirectorySection eyebrow="FAQ" title={`Questions about ${skill.shortTitle.toLowerCase()}`}>
        <div className="grid gap-3 md:grid-cols-2">
          {skill.faqs.map((faq) => (
            <details key={faq.q} className="rounded-xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/35" open>
              <summary className="cursor-pointer font-headline text-lg font-semibold">{faq.q}</summary>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{faq.a}</p>
            </details>
          ))}
        </div>
      </DirectorySection>
      <section className="px-5 pb-8 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/skills" className="text-sm font-bold text-primary">Back to all skills</Link>
        </div>
      </section>
      <CtaBand title={`Turn ${skill.shortTitle.toLowerCase()} into reps.`} />
    </DirectoryShell>
  )
}
