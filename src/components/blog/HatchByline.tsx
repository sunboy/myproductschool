import Image from 'next/image'

// Hatch's blog byline. This MUST use a static Codex-generated avatar image,
// never the HatchGlyph SVG — the SVG mascot is reserved for in-app UI, and
// blog visuals are deliberately photographic/illustrated statics (see
// CLAUDE.md "Hatch mascot" + the blog plan's Hatch image kit).

interface HatchBylineProps {
  publishedAt: string | null
  readingMinutes: number | null
}

function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function HatchByline({ publishedAt, readingMinutes }: HatchBylineProps) {
  const dateLabel = formatDate(publishedAt)

  return (
    <div className="flex items-center gap-3">
      <Image
        src="/hatch/avatar.png"
        alt="Hatch"
        width={40}
        height={40}
        className="rounded-full border border-outline-variant"
      />
      <div className="font-label text-sm text-on-surface-variant">
        <p className="font-semibold text-on-surface">Hatch, HackProduct&apos;s coach</p>
        <p>
          {dateLabel}
          {dateLabel && readingMinutes ? ' · ' : null}
          {readingMinutes ? `${readingMinutes} min read` : null}
        </p>
      </div>
    </div>
  )
}
