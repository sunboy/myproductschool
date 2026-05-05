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

export const metadata: Metadata = buildMetadata({
  title: 'Tech Skills Directory for AI-Era Interviews | HackProduct',
  description:
    'Explore HackProduct skill directories for product sense, system design, data modeling, SQL, coding, and AI-native interview practice.',
  path: '/skills',
  keywords: ['product sense practice', 'system design practice', 'data modeling practice', 'SQL interview practice', 'coding interview alternative'],
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
        eyebrow="Skill directory"
        title="Practice the judgment layer of modern tech careers."
        description={HACKPRODUCT_POSITIONING.subhead}
        secondaryHref="/alternatives/leetcode"
        secondaryLabel="Compare with LeetCode"
      />
      <DirectorySection
        eyebrow="All tracks"
        title="One directory for product, systems, data, SQL, and coding."
        description="Each public hub explains the skill, shows representative scenarios, and points to related study plans, concepts, and live interview practice."
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
