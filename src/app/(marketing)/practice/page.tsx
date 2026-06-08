import type { Metadata } from 'next'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CtaBand } from '@/components/landing-v3/sections'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { itemListJsonLd, PRACTICE_DIRECTORIES } from '@/lib/seo/directory-content'
import { PracticeCatalogClient, type PracticeCatalogItem } from './PracticeCatalogClient'

export const metadata: Metadata = buildMetadata({
  title: 'Practice Catalog for FLOW-Scored Career Reps | HackProduct',
  description:
    'Browse public HackProduct practice previews by discipline, FLOW move, and career goal. Open the full app for Hatch coaching, scoring, and saved progress.',
  path: '/practice',
  keywords: ['product sense practice questions', 'system design practice questions', 'SQL product analytics practice', 'FLOW practice reps'],
})

const PRACTICE_META: Record<string, Pick<PracticeCatalogItem, 'flowMoves' | 'goals'>> = {
  'spotify-session-drop-product-sense': {
    flowMoves: ['Frame', 'List'],
    goals: ['Interview prep', 'Role transition', 'Promotion readiness'],
  },
  'realtime-notification-system': {
    flowMoves: ['List', 'Optimize'],
    goals: ['Interview prep', 'Promotion readiness'],
  },
  'multi-tenant-saas-data-model': {
    flowMoves: ['Frame', 'Optimize'],
    goals: ['Role transition', 'Promotion readiness', 'Salary proof'],
  },
  'sql-product-analytics-retention': {
    flowMoves: ['Frame', 'Win'],
    goals: ['Interview prep', 'Role transition'],
  },
  'ai-assisted-coding-debugging': {
    flowMoves: ['Optimize', 'Win'],
    goals: ['Interview prep', 'AI-native growth', 'Salary proof'],
  },
}

export default function PracticeDirectoryPage() {
  const items = PRACTICE_DIRECTORIES.map((practice) => ({
    label: practice.title,
    href: `/practice/${practice.slug}`,
    description: practice.summary,
  }))
  const catalogItems: PracticeCatalogItem[] = PRACTICE_DIRECTORIES.map((practice) => ({
    slug: practice.slug,
    title: practice.title,
    summary: practice.summary,
    discipline: practice.discipline,
    href: `/practice/${practice.slug}`,
    flowMoves: PRACTICE_META[practice.slug]?.flowMoves ?? ['Frame'],
    goals: PRACTICE_META[practice.slug]?.goals ?? ['Interview prep'],
  }))

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Practice', path: canonicalUrl('/practice') },
          ]),
          itemListJsonLd('HackProduct public practice previews', items),
        ]}
      />
      <V3PageHero
        eyebrow="Practice catalog"
        title="Filter reps by discipline, FLOW move, and career goal."
        subtitle="Public previews show the scenario, skill focus, rubric hints, and Hatch-style nudges. The full app adds the answer workspace, follow-ups, scoring, and saved progress."
        ctas={[{ label: 'Start a free rep', href: '/login?returnTo=/challenges' }]}
      />
      <V3Section
        eyebrow="Sneak peek catalog"
        title="Useful previews without replacing logged-in practice."
        subtitle="Use filters to find the next rep. Public pages show the prompt and rubric preview; Hatch coaching and saved receipts happen in the app."
      >
        <PracticeCatalogClient items={catalogItems} />
      </V3Section>
      <V3CtaBand
        title="Start training for your next career move."
        subtitle="Public previews show the map. The app gives you reps, Hatch follow-ups, FLOW feedback, weak-move drills, and saved proof of progress."
        ctas={[{ label: 'Start a free rep', href: '/login?returnTo=/challenges' }]}
      />
    </V3PageShell>
  )
}
