import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo/site'
import { V3PageShell } from '@/components/landing-v3/V3PageShell'
import { V3PageHero, V3ProseSection, V3ProseBlock } from '@/components/landing-v3/sections'

export const metadata: Metadata = buildMetadata({
  title: 'Changelog | HackProduct',
  description: 'Recent HackProduct launch-readiness updates for billing, auth, Hatch guardrails, and practice flows.',
  path: '/changelog',
})

interface ChangelogEntry {
  slug: string
  date: string
  title: string
  body: string
}

const CHANGELOG_DIR = path.join(process.cwd(), 'content/changelog')

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { frontmatter: {} as Record<string, string>, body: raw.trim() }

  const frontmatter: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const [key, ...valueParts] = line.split(':')
    if (!key || valueParts.length === 0) continue
    frontmatter[key.trim()] = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '')
  }

  return { frontmatter, body: match[2].trim() }
}

function getChangelogEntries(): ChangelogEntry[] {
  return readdirSync(CHANGELOG_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(path.join(CHANGELOG_DIR, file), 'utf8')
      const { frontmatter, body } = parseFrontmatter(raw)
      return {
        slug: file.replace(/\.md$/, ''),
        date: frontmatter.date ?? file.slice(0, 10),
        title: frontmatter.title ?? 'HackProduct update',
        body,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

function ChangelogBody({ body }: { body: string }) {
  const lines = body.split('\n').map((line) => line.trim()).filter(Boolean)
  const bullets = lines.filter((line) => line.startsWith('- ')).map((line) => line.slice(2))
  const paragraphs = lines.filter((line) => !line.startsWith('- '))

  return (
    <>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {bullets.length > 0 && (
        <ul>
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </>
  )
}

export default function ChangelogPage() {
  const entries = getChangelogEntries()

  return (
    <V3PageShell>
      <V3PageHero
        eyebrow="Changelog"
        title="What changed before launch."
        subtitle="Recent updates focused on launch readiness: safer auth, clearer billing paths, stronger Hatch guardrails, and verified practice flows."
      />

      <V3ProseSection>
        {entries.map((entry) => (
          <V3ProseBlock key={entry.slug} title={entry.title}>
            <p className="v3-card-eyebrow">{entry.date}</p>
            <ChangelogBody body={entry.body} />
          </V3ProseBlock>
        ))}
      </V3ProseSection>
    </V3PageShell>
  )
}
