import Image from 'next/image'
import Link from 'next/link'
import type { AutopsyProduct, AutopsyProductDetail, AutopsyStory } from '@/lib/types'

interface LegacyCompanyHubProps {
  product: AutopsyProductDetail
}

const fallbackImages = [
  '/images/hacky_reading.png',
  '/images/hacky_thinking.png',
]

export function AppLegacyCompanyHub({ product }: LegacyCompanyHubProps) {
  const stories = product.stories ?? []

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <nav className="flex items-center gap-2 font-label text-sm text-on-surface-variant">
        <Link href="/explore/autopsies" className="font-bold text-primary no-underline hover:text-primary/80">
          Showcase
        </Link>
        <span className="material-symbols-outlined text-[16px]" aria-hidden>
          chevron_right
        </span>
        <span className="font-bold text-on-surface">{product.name}</span>
      </nav>

      <section className="grid gap-4 rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: product.cover_color ?? '#4a7c59' }}
              aria-hidden
            />
            <span className="font-label text-xs font-bold uppercase tracking-[0.16em] text-primary">
              {product.industry ?? product.paradigm ?? 'Company'} hub
            </span>
          </div>
          <h1 className="mt-3 text-balance font-headline text-3xl font-extrabold leading-tight text-on-surface sm:text-4xl">
            {product.name} autopsy hub
          </h1>
          <p className="mt-3 max-w-[62ch] font-body text-sm leading-6 text-on-surface-variant sm:text-[15px]">
            {product.tagline}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <LibraryStat label="Chapter reads" value={stories.length.toString()} icon="auto_stories" />
          </div>
          {product.paradigm && (
            <p className="mt-3 font-label text-xs font-bold text-on-surface-variant">
              {product.paradigm}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-background/70 p-4 ring-1 ring-outline-variant/45">
          <p className="font-label text-xs font-bold uppercase tracking-[0.14em] text-primary">Company teardown</p>
          <p className="mt-2 font-body text-sm leading-6 text-on-surface-variant">
            Legacy chapter-style reads from the original showcase library, carried forward without the practice challenge surface.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <SectionHeading
          eyebrow="Chapter reads"
          title={`Stories in ${product.name}`}
          description="Open the chapter read from here. These are older teardown stories preserved as reading content inside the new hub structure."
        />
        <div className="grid gap-3">
          {stories.map((story, index) => (
            <LegacyStoryRow
              key={story.id}
              story={story}
              product={product}
              visualIndex={index}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="max-w-[48ch]">
      <p className="font-label text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-balance font-headline text-2xl font-extrabold leading-tight text-on-surface">
        {title}
      </h2>
      <p className="mt-2 font-body text-sm leading-6 text-on-surface-variant">
        {description}
      </p>
    </div>
  )
}

function LibraryStat({
  label,
  value,
  icon,
  tone = 'light',
}: {
  label: string
  value: string
  icon: string
  tone?: 'light' | 'dark'
}) {
  return (
    <div className={tone === 'dark'
      ? 'inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 ring-1 ring-white/15'
      : 'inline-flex items-center gap-2 rounded-lg bg-background/80 px-3 py-2 ring-1 ring-outline-variant/45'
    }>
      <span className={tone === 'dark' ? 'material-symbols-outlined text-[16px] text-[#c9ad68]' : 'material-symbols-outlined text-[16px] text-primary'} aria-hidden>
        {icon}
      </span>
      <span className={tone === 'dark' ? 'font-mono text-sm font-bold tabular-nums text-[#f8f4e9]' : 'font-mono text-sm font-bold tabular-nums text-on-surface'}>{value}</span>
      <span className={tone === 'dark' ? 'font-label text-xs font-bold text-[#f8f4e9]/62' : 'font-label text-xs font-bold text-on-surface-variant'}>{label}</span>
    </div>
  )
}

function LegacyStoryRow({
  story,
  product,
  visualIndex,
}: {
  story: AutopsyStory
  product: AutopsyProduct
  visualIndex: number
}) {
  const fallbackImage = fallbackImages[visualIndex % fallbackImages.length]

  return (
    <Link
      href={`/explore/autopsies/${product.slug}/stories/${story.slug}`}
      className="group grid overflow-hidden rounded-2xl border border-outline-variant/45 bg-surface-container-low text-on-surface no-underline transition hover:-translate-y-0.5 hover:bg-surface-container hover:ring-1 hover:ring-primary/25 active:translate-y-0 sm:grid-cols-[220px_minmax(0,1fr)]"
    >
      <div className="relative min-h-40 overflow-hidden bg-[#143321]">
        <Image
          src={fallbackImage}
          alt="Hatch reading a company teardown"
          width={420}
          height={420}
          className="absolute bottom-0 right-2 h-auto w-32"
        />
      </div>
      <div className="grid gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-label text-xs font-bold text-primary">{product.name}</span>
          <span className="h-1 w-1 rounded-full bg-outline-variant" aria-hidden />
          <span className="font-label text-xs font-bold text-on-surface-variant">Chapter read</span>
        </div>
        <div>
          <h3 className="line-clamp-2 font-headline text-xl font-extrabold leading-tight">{story.title}</h3>
          <p className="mt-2 font-body text-sm leading-6 text-on-surface-variant">
            {story.read_time} · {story.sections.length} sections
          </p>
        </div>
        <span className="inline-flex items-center gap-1 font-label text-sm font-bold text-primary">
          Read
          <span className="material-symbols-outlined text-[17px] transition group-hover:translate-x-0.5" aria-hidden>
            arrow_forward
          </span>
        </span>
      </div>
    </Link>
  )
}
