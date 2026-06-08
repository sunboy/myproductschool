import type { Metadata } from 'next'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { HACKPRODUCT_POSITIONING, itemListJsonLd, SKILL_DIRECTORIES } from '@/lib/seo/directory-content'
import { OUTCOME_PAGES } from '@/lib/seo/outcomes'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3Section, V3CardGrid, V3Card, V3CtaBand } from '@/components/landing-v3/sections'

export const metadata: Metadata = buildMetadata({
  title: 'Skills Catalog for Career-Changing Judgment | HackProduct',
  description:
    'Explore HackProduct discipline tracks for product sense, system design, data modeling, SQL, coding, and AI-native workflows, mapped to interviews, role transitions, promotions, and proof of level.',
  path: '/skills',
  keywords: ['product sense practice', 'system design practice', 'data modeling practice', 'SQL interview practice', 'AI-native workflows'],
})

export default function SkillsDirectoryPage() {
  const items = SKILL_DIRECTORIES.map((skill) => ({
    label: skill.shortTitle,
    href: `/skills/${skill.slug}`,
    description: skill.summary,
  }))

  return (
    <V3PageShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Skills', path: canonicalUrl('/skills') },
          ]),
          itemListJsonLd('HackProduct skill directories', items),
        ]}
      />

      <V3PageHero
        eyebrow="Skills catalog"
        title="Pick the discipline that strengthens your next career move."
        subtitle={HACKPRODUCT_POSITIONING.subhead}
        ctas={[
          { label: 'Browse reps', href: '/practice' },
          { label: 'See FLOW', href: '/flow' },
        ]}
      />

      <V3Section
        eyebrow="Outcome filters"
        title="Start from the career goal, then choose the track."
        subtitle="Each skill page shows what the discipline trains, where FLOW applies, and which public reps prove the skill without replacing the full app workspace."
      >
        <V3CardGrid>
          {OUTCOME_PAGES.map((outcome) => (
            <V3Card
              key={outcome.slug}
              href={outcome.path}
              eyebrow="Career goal"
              title={outcome.shortTitle}
              body={outcome.summary}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3Section
        eyebrow="All tracks"
        title="One catalog for product, systems, data, SQL, coding, and AI-native work."
        subtitle="Each public hub explains the skill, shows FLOW mapping, previews representative reps, and points toward the career outcomes where that skill creates leverage."
      >
        <V3CardGrid>
          {SKILL_DIRECTORIES.map((skill) => (
            <V3Card
              key={skill.slug}
              href={`/skills/${skill.slug}`}
              eyebrow={skill.eyebrow}
              title={skill.shortTitle}
              body={skill.summary}
            />
          ))}
        </V3CardGrid>
      </V3Section>

      <V3CtaBand
        title="Turn the right discipline into proof of level."
        subtitle="Run a live loop, get a score, and see the next move."
        ctas={[{ label: 'Get started', href: '/signup' }]}
      />
    </V3PageShell>
  )
}
