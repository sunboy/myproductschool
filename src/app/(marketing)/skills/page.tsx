import type { Metadata } from 'next'
import {
  CtaBand,
  DirectoryCard,
  DirectoryHero,
  DirectorySection,
  DirectoryShell,
} from '@/components/directory/DirectoryChrome'
import { JsonLdScript, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, canonicalUrl } from '@/lib/seo/site'
import { HACKPRODUCT_POSITIONING, itemListJsonLd, SKILL_DIRECTORIES } from '@/lib/seo/directory-content'
import { OUTCOME_PAGES } from '@/lib/seo/outcomes'

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
    <DirectoryShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: 'HackProduct', path: canonicalUrl('/') },
            { name: 'Skills', path: canonicalUrl('/skills') },
          ]),
          itemListJsonLd('HackProduct skill directories', items),
        ]}
      />
      <DirectoryHero
        eyebrow="Skills catalog"
        title="Pick the discipline that strengthens your next career move."
        description={HACKPRODUCT_POSITIONING.subhead}
        ctaHref="/practice"
        ctaLabel="Browse reps"
        secondaryHref="/flow"
        secondaryLabel="See FLOW"
      />
      <DirectorySection
        eyebrow="Outcome filters"
        title="Start from the career goal, then choose the track."
        description="Each skill page shows what the discipline trains, where FLOW applies, and which public reps prove the skill without replacing the full app workspace."
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {OUTCOME_PAGES.map((outcome) => (
            <DirectoryCard
              key={outcome.slug}
              href={outcome.path}
              title={outcome.shortTitle}
              description={outcome.summary}
              meta="Career goal"
            />
          ))}
        </div>
      </DirectorySection>
      <DirectorySection
        eyebrow="All tracks"
        title="One catalog for product, systems, data, SQL, coding, and AI-native work."
        description="Each public hub explains the skill, shows FLOW mapping, previews representative reps, and points toward the career outcomes where that skill creates leverage."
        shaded
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SKILL_DIRECTORIES.map((skill) => (
            <DirectoryCard
              key={skill.slug}
              href={`/skills/${skill.slug}`}
              title={skill.shortTitle}
              description={skill.summary}
              meta={skill.eyebrow}
            />
          ))}
        </div>
      </DirectorySection>
      <CtaBand />
    </DirectoryShell>
  )
}
