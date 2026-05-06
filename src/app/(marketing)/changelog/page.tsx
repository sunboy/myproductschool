import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo/site'

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
    <div className="space-y-4">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {bullets.length > 0 && (
        <ul className="space-y-3">
          {bullets.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ChangelogPage() {
  const entries = getChangelogEntries()

  return (
    <main className="min-h-screen bg-background text-on-surface">
      <section className="border-b border-outline-variant bg-surface-container-low">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-20">
          <div>
            <Link href="/" className="text-sm font-bold text-primary no-underline">
              HackProduct
            </Link>
            <p className="mt-8 text-xs font-black uppercase text-primary">Changelog</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-on-surface sm:text-5xl">
              What changed before launch.
            </h1>
          </div>
          <div className="max-w-2xl">
            <p className="text-lg leading-8 text-on-surface-variant">
              Recent updates focused on launch readiness: safer auth, clearer billing paths, stronger Hatch guardrails, and verified practice flows.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="space-y-6">
          {entries.map((entry) => (
            <article
              key={entry.slug}
              className="rounded-lg border border-outline-variant bg-background p-5 sm:p-6"
            >
              <p className="text-xs font-black uppercase text-primary">{entry.date}</p>
              <h2 className="mt-2 text-2xl font-black text-on-surface">{entry.title}</h2>
              <div className="mt-4 text-sm leading-6 text-on-surface-variant">
                <ChangelogBody body={entry.body} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
