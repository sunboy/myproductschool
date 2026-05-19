import Image from 'next/image'
import Link from 'next/link'
import {
  getFeaturedAppStory,
  getReadableAppCompanies,
  getReadableLegacyOnlyShowcaseProducts,
  getReadableAppStories,
  hasLegacyCompanyTeardown,
} from '@/lib/autopsies/app-library'
import type { AutopsyCompanyWithStories, AutopsyImageRole, CompanyHub, FeatureAutopsy } from '@/lib/autopsies/types'
import type { AutopsyProduct, AutopsyProductDetail, AutopsyStory } from '@/lib/types'

interface ShowcaseIndexProps {
  companies: AutopsyCompanyWithStories[]
  stories: FeatureAutopsy[]
  legacyProducts?: AutopsyProduct[]
}

interface CompanyHubProps {
  company: AutopsyCompanyWithStories
  legacyProduct?: AutopsyProductDetail | null
}

interface LegacyCompanyHubProps {
  product: AutopsyProductDetail
}

const fallbackImages = [
  '/images/hacky_reading.png',
  '/images/hacky_thinking.png',
]

function storyHref(story: FeatureAutopsy) {
  return `/explore/showcase/${story.companySlug}/stories/${story.slug}`
}

function getStoryImage(story: FeatureAutopsy, role: AutopsyImageRole) {
  return story.images.find(image => image.role === role)
}

function formatStoryType(story: FeatureAutopsy) {
  return story.storyType === 'company_teardown' ? 'Company teardown' : 'Feature autopsy'
}

export function AppAutopsyShowcaseIndex({ companies, stories, legacyProducts = [] }: ShowcaseIndexProps) {
  const readableCompanies = getReadableAppCompanies(companies)
  const legacyProductsWithStories = legacyProducts.filter(product => product.is_published && (product.story_count ?? 0) > 0)
  const legacyProductsBySlug = new Map(legacyProductsWithStories.map(product => [product.slug, product]))
  const legacyOnlyProducts = getReadableLegacyOnlyShowcaseProducts(
    legacyProducts,
    readableCompanies.map(company => company.slug)
  )
  const readableStories = getReadableAppStories(stories)
  const teardownStories = readableStories.filter(story => story.storyType === 'company_teardown')
  const featureStories = readableStories.filter(story => story.storyType === 'feature_autopsy')
  const staticLegacyTeardownCounts = teardownStories.reduce((counts, story) => {
    if (!hasLegacyCompanyTeardown(story)) return counts
    counts.set(story.companySlug, (counts.get(story.companySlug) ?? 0) + 1)
    return counts
  }, new Map<string, number>())
  const legacyTeardownProducts = legacyProductsWithStories.filter(product => {
    const alreadyRepresented = staticLegacyTeardownCounts.get(product.slug) ?? 0
    return Math.max(0, (product.story_count ?? 0) - alreadyRepresented) > 0
  })
  const legacyTeardownCount = legacyProductsWithStories.reduce((total, product) => {
    const alreadyRepresented = staticLegacyTeardownCounts.get(product.slug) ?? 0
    return total + Math.max(0, (product.story_count ?? 0) - alreadyRepresented)
  }, 0)
  const companyHubCount = readableCompanies.length + legacyOnlyProducts.length
  const teardownCount = teardownStories.length + legacyTeardownCount
  const featuredStory = getFeaturedAppStory(stories)
  const featuredCompany = featuredStory
    ? readableCompanies.find(company => company.slug === featuredStory.companySlug)
      ?? companies.find(company => company.slug === featuredStory.companySlug)
    : undefined

  return (
    <div className="mx-auto flex max-w-[1220px] flex-col gap-7 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <section className="relative overflow-hidden rounded-[22px] border border-outline-variant/45 bg-[#122219] text-[#f8f4e9] shadow-[0_28px_80px_-64px_rgba(18,34,25,0.95)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.24]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(248,244,233,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(248,244,233,0.10) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#c9ad68]/20 blur-3xl"
          aria-hidden
        />
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.12fr)_420px] lg:p-8">
          <div className="min-w-0">
            <p className="font-label text-[11px] font-black uppercase tracking-[0.22em] text-[#c9ad68]">
              Product autopsies
            </p>
            <h1 className="mt-4 max-w-3xl text-balance font-headline text-4xl font-extrabold leading-[0.98] text-[#f8f4e9] sm:text-5xl lg:text-[58px]">
              Read the product decisions behind the product.
            </h1>
            <p className="mt-4 max-w-[62ch] font-body text-base leading-7 text-[#f8f4e9]/72">
              Company hubs collect the larger teardown and the feature-level stories. Start with a system story, then zoom into the product moments that made it work.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <LibraryStat label="Company hubs" value={companyHubCount.toString()} icon="business" tone="dark" />
              <LibraryStat label="Feature reads" value={featureStories.length.toString()} icon="auto_stories" tone="dark" />
              <LibraryStat label="Teardowns" value={teardownCount.toString()} icon="account_tree" tone="dark" />
            </div>
          </div>

          {featuredStory && (
            <FeaturedReadCard
              story={featuredStory}
              company={featuredCompany}
            />
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 border-b border-outline-variant/50 pb-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Company hubs"
            title="Browse by company."
            description="Each hub keeps the teardown and feature reads together, so the story has a home."
          />
          <Link
            href="/autopsies"
            className="inline-flex items-center gap-1.5 font-label text-xs font-bold text-primary no-underline hover:text-primary/80"
          >
            Public library
            <span className="material-symbols-outlined text-[15px]" aria-hidden>
              arrow_forward
            </span>
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {readableCompanies.map((company, index) => (
            <CompanyHubRow
              key={company.slug}
              company={company}
              legacyProduct={legacyProductsBySlug.get(company.slug)}
              index={index}
            />
          ))}
          {legacyOnlyProducts.map((product, index) => (
            <LegacyCompanyHubRow
              key={product.slug}
              product={product}
              index={readableCompanies.length + index}
            />
          ))}
        </div>
      </section>

      {(teardownStories.length > 0 || legacyTeardownProducts.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-[0.62fr_1.38fr]">
          <SectionHeading
            eyebrow="Company teardowns"
            title="Start with the system story."
            description="These read like chapters, not exercises. They set up the company-level bet before the feature stories."
          />
          <div className="grid gap-3 md:grid-cols-2">
            {teardownStories.map((story, index) => (
              <StoryTile
                key={story.slug}
                story={story}
                company={companies.find(company => company.slug === story.companySlug)}
                visualIndex={index}
                prominent
              />
            ))}
            {legacyTeardownProducts.map((product, index) => (
              <LegacyTeardownTile
                key={product.slug}
                product={product}
                visualIndex={teardownStories.length + index}
              />
            ))}
          </div>
        </section>
      )}

      {featureStories.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-[0.62fr_1.38fr]">
          <SectionHeading
            eyebrow="Feature autopsies"
            title="Focused reads with a real lesson."
            description="Shorter stories that zoom into one product decision, one mechanism, and one transferable takeaway."
          />
          <div className="grid gap-3 md:grid-cols-2">
            {featureStories.map((story, index) => (
              <StoryTile
                key={story.slug}
                story={story}
                company={companies.find(company => company.slug === story.companySlug)}
                visualIndex={index + teardownStories.length}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function AppAutopsyCompanyHub({ company }: CompanyHubProps) {
  return <AppAutopsyCompanyHubWithLegacy company={company} />
}

export function AppAutopsyCompanyHubWithLegacy({ company, legacyProduct }: CompanyHubProps) {
  const readableStories = getReadableAppStories(company.stories)
  const companyTeardowns = readableStories.filter(story => story.storyType === 'company_teardown')
  const featureStories = readableStories.filter(story => story.storyType === 'feature_autopsy')
  const staticTeardownSlugs = new Set(companyTeardowns.map(story => story.slug))
  const legacyStories = legacyProduct?.stories
    ?.filter(story => !staticTeardownSlugs.has(story.slug)) ?? []

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <nav className="flex items-center gap-2 font-label text-sm text-on-surface-variant">
        <Link href="/explore/showcase" className="font-bold text-primary no-underline hover:text-primary/80">
          Showcase
        </Link>
        <span className="material-symbols-outlined text-[16px]" aria-hidden>
          chevron_right
        </span>
        <span className="font-bold text-on-surface">{company.name}</span>
      </nav>

      <section className="grid gap-4 rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: company.accent }}
              aria-hidden
            />
            <span className="font-label text-xs font-bold uppercase tracking-[0.16em] text-primary">
              {company.industry} hub
            </span>
          </div>
          <h1 className="mt-3 text-balance font-headline text-3xl font-extrabold leading-tight text-on-surface sm:text-4xl">
            {company.name} autopsy hub
          </h1>
          <p className="mt-3 max-w-[62ch] font-body text-sm leading-6 text-on-surface-variant sm:text-[15px]">
            {company.thesis}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <LibraryStat label="Teardowns" value={companyTeardowns.length.toString()} icon="account_tree" />
            <LibraryStat label="Feature reads" value={featureStories.length.toString()} icon="auto_stories" />
            {legacyStories.length > 0 && (
              <LibraryStat label="Chapter reads" value={legacyStories.length.toString()} icon="menu_book" />
            )}
          </div>
        </div>
        <div className="divide-y divide-outline-variant/45 rounded-xl bg-background/70 ring-1 ring-outline-variant/45">
          {company.timeline.map(item => (
            <div key={`${item.date}-${item.label}`} className="p-4">
              <p className="font-label text-xs font-bold uppercase tracking-[0.14em] text-primary">{item.date}</p>
              <p className="mt-1 font-body text-sm leading-6 text-on-surface-variant">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {companyTeardowns.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <SectionHeading
            eyebrow="Company teardown"
            title={`The larger ${company.name} story`}
            description="Read the company-level narrative first when you want the system, market, and operating bet before the feature-level cases."
          />
          <div className="grid gap-3">
            {companyTeardowns.map((story, index) => (
              <StoryTile
                key={story.slug}
                story={story}
                company={company}
                visualIndex={index}
                prominent
              />
            ))}
          </div>
        </section>
      )}

      {legacyProduct && legacyStories.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <SectionHeading
            eyebrow="Company teardown"
            title={`Chapter reads in ${company.name}`}
            description="Legacy company teardowns from the original showcase library, preserved as reading content inside the new hub structure."
          />
          <div className="grid gap-3">
            {legacyStories.map((story, index) => (
              <LegacyStoryRow
                key={story.id}
                story={story}
                product={legacyProduct}
                visualIndex={index}
              />
            ))}
          </div>
        </section>
      )}

      {featureStories.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <SectionHeading
            eyebrow="Feature autopsies"
            title={`Stories in ${company.name}`}
            description="Open the long read from here. Sources stay in the appendix, while the article keeps a story-first pace."
          />
          <div className="grid gap-3">
            {featureStories.map((story, index) => (
              <StoryTile
                key={story.slug}
                story={story}
                company={company}
                visualIndex={index}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function AppLegacyCompanyHub({ product }: LegacyCompanyHubProps) {
  const stories = product.stories ?? []

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <nav className="flex items-center gap-2 font-label text-sm text-on-surface-variant">
        <Link href="/explore/showcase" className="font-bold text-primary no-underline hover:text-primary/80">
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

function FeaturedReadCard({ story, company }: { story: FeatureAutopsy; company?: CompanyHub }) {
  const image = getStoryImage(story, 'social-cover') ?? getStoryImage(story, 'thumbnail') ?? getStoryImage(story, 'hero')
  const fallbackImage = story.slug === 'buffer-fake-landing-page-mvp'
    ? '/images/autopsies/buffer-fake-landing-page-mvp/final/thumbnail.webp'
    : fallbackImages[0]

  return (
    <Link
      href={storyHref(story)}
      className="group grid min-h-[300px] overflow-hidden rounded-[18px] bg-[#f8f4e9] text-[#17251c] no-underline ring-1 ring-white/16 transition hover:-translate-y-0.5 hover:ring-[#c9ad68]/55 active:translate-y-0"
    >
      <div className="relative h-40 overflow-hidden bg-[#143321]">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            priority
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <Image
            src={fallbackImage}
            alt="Hatch reading a product story"
            width={420}
            height={420}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-label text-xs font-bold uppercase tracking-[0.14em] text-[#4a7c59]">Featured read</p>
          <p className="font-label text-xs font-bold text-[#17251c]/55">{story.estimatedReadTime}</p>
        </div>
        <h3 className="mt-3 font-headline text-2xl font-extrabold leading-tight">{story.title}</h3>
        <p className="mt-2 line-clamp-3 font-body text-sm leading-6 text-[#17251c]/68">{story.dek}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-label text-xs font-bold text-[#17251c]/58">{company?.name ?? story.companySlug}</span>
          <span className="inline-flex items-center gap-1 font-label text-sm font-bold text-[#244232]">
            Read
            <span className="material-symbols-outlined text-[17px] transition group-hover:translate-x-0.5" aria-hidden>
              arrow_forward
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}

function CompanyHubRow({
  company,
  legacyProduct,
  index,
}: {
  company: AutopsyCompanyWithStories
  legacyProduct?: AutopsyProduct
  index: number
}) {
  const previewStories = company.stories.slice(0, 2)
  const staticTeardownCount = company.stories.filter(story => story.storyType === 'company_teardown').length
  const representedLegacyCount = company.stories.filter(hasLegacyCompanyTeardown).length
  const extraLegacyTeardownCount = Math.max(0, (legacyProduct?.story_count ?? 0) - representedLegacyCount)
  const teardownCount = staticTeardownCount + extraLegacyTeardownCount
  const featureCount = company.stories.filter(story => story.storyType === 'feature_autopsy').length

  return (
    <Link
      href={`/explore/showcase/${company.slug}`}
      className="group relative min-h-[210px] overflow-hidden rounded-2xl border border-outline-variant/45 bg-surface-container-low p-4 text-on-surface no-underline transition hover:-translate-y-0.5 hover:bg-surface-container hover:ring-1 hover:ring-primary/25 active:translate-y-0"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: company.accent }}
        aria-hidden
      />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-label text-sm font-black tracking-[0.02em] text-white"
              style={{ backgroundColor: company.accent }}
            >
              {getCompanyMark(company.name)}
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-headline text-xl font-extrabold leading-tight">{company.name}</h3>
              <p className="font-label text-xs font-bold text-on-surface-variant">{company.industry}</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold tabular-nums text-on-surface-variant">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <p className="mt-4 line-clamp-3 font-body text-sm leading-6 text-on-surface-variant">{company.thesis}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {previewStories.map(story => (
            <span key={story.slug} className="rounded-md bg-background/80 px-2 py-1 font-label text-[11px] font-bold text-on-surface-variant ring-1 ring-outline-variant/35">
              {story.title}
            </span>
          ))}
          {extraLegacyTeardownCount > 0 && (
            <span className="rounded-md bg-background/80 px-2 py-1 font-label text-[11px] font-bold text-on-surface-variant ring-1 ring-outline-variant/35">
              Company teardown
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="font-label text-xs font-bold text-on-surface-variant">
            {teardownCount > 0 ? `${teardownCount} teardown · ` : ''}{featureCount} {featureCount === 1 ? 'feature' : 'features'}
          </span>
          <span className="material-symbols-outlined text-[18px] text-primary transition group-hover:translate-x-0.5" aria-hidden>
            arrow_forward
          </span>
        </div>
      </div>
    </Link>
  )
}

function LegacyCompanyHubRow({ product, index }: { product: AutopsyProduct; index: number }) {
  const teardownCount = product.story_count ?? 0

  return (
    <Link
      href={`/explore/showcase/${product.slug}`}
      className="group relative min-h-[210px] overflow-hidden rounded-2xl border border-outline-variant/45 bg-surface-container-low p-4 text-on-surface no-underline transition hover:-translate-y-0.5 hover:bg-surface-container hover:ring-1 hover:ring-primary/25 active:translate-y-0"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: product.cover_color ?? '#4a7c59' }}
        aria-hidden
      />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-label text-sm font-black tracking-[0.02em] text-white"
              style={{ backgroundColor: product.cover_color ?? '#4a7c59' }}
            >
              {getCompanyMark(product.name)}
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-headline text-xl font-extrabold leading-tight">{product.name}</h3>
              <p className="font-label text-xs font-bold text-on-surface-variant">{product.industry ?? product.paradigm ?? 'Company teardown'}</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold tabular-nums text-on-surface-variant">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <p className="mt-4 line-clamp-3 font-body text-sm leading-6 text-on-surface-variant">{product.tagline}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-background/80 px-2 py-1 font-label text-[11px] font-bold text-on-surface-variant ring-1 ring-outline-variant/35">
            Company teardown
          </span>
          <span className="rounded-md bg-background/80 px-2 py-1 font-label text-[11px] font-bold text-on-surface-variant ring-1 ring-outline-variant/35">
            Chapter read
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="font-label text-xs font-bold text-on-surface-variant">
            {teardownCount} {teardownCount === 1 ? 'teardown' : 'teardowns'}
          </span>
          <span className="material-symbols-outlined text-[18px] text-primary transition group-hover:translate-x-0.5" aria-hidden>
            arrow_forward
          </span>
        </div>
      </div>
    </Link>
  )
}

function StoryTile({
  story,
  company,
  visualIndex,
  prominent = false,
}: {
  story: FeatureAutopsy
  company?: CompanyHub
  visualIndex: number
  prominent?: boolean
}) {
  const image = getStoryImage(story, prominent ? 'hero' : 'thumbnail') ?? getStoryImage(story, 'thumbnail')
  const fallbackImage = fallbackImages[visualIndex % fallbackImages.length]
  const legacy = hasLegacyCompanyTeardown(story)

  return (
    <Link
      href={storyHref(story)}
      className="group grid overflow-hidden rounded-2xl border border-outline-variant/45 bg-surface-container-low text-on-surface no-underline transition hover:-translate-y-0.5 hover:bg-surface-container hover:ring-1 hover:ring-primary/25 active:translate-y-0"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#143321]">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <Image
            src={fallbackImage}
            alt="Hatch reading a product story"
            width={420}
            height={420}
            className="absolute bottom-0 right-2 h-auto w-32"
          />
        )}
      </div>
      <div className="grid gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-label text-xs font-bold text-primary">{company?.name ?? story.companySlug}</span>
          <span className="h-1 w-1 rounded-full bg-outline-variant" aria-hidden />
          <span className="font-label text-xs font-bold text-on-surface-variant">{formatStoryType(story)}</span>
          {legacy && (
            <>
              <span className="h-1 w-1 rounded-full bg-outline-variant" aria-hidden />
              <span className="font-label text-xs font-bold text-on-surface-variant">Chapter read</span>
            </>
          )}
        </div>
        <div>
          <h3 className="line-clamp-2 font-headline text-xl font-extrabold leading-tight">{story.title}</h3>
          <p className="mt-2 line-clamp-3 font-body text-sm leading-6 text-on-surface-variant">{story.dek}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-label text-xs font-bold text-on-surface-variant">{story.estimatedReadTime}</span>
          <span className="inline-flex items-center gap-1 font-label text-sm font-bold text-primary">
            Read
            <span className="material-symbols-outlined text-[17px] transition group-hover:translate-x-0.5" aria-hidden>
              arrow_forward
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}

function LegacyTeardownTile({
  product,
  visualIndex,
}: {
  product: AutopsyProduct
  visualIndex: number
}) {
  const fallbackImage = fallbackImages[visualIndex % fallbackImages.length]

  return (
    <Link
      href={`/explore/showcase/${product.slug}`}
      className="group grid overflow-hidden rounded-2xl border border-outline-variant/45 bg-surface-container-low text-on-surface no-underline transition hover:-translate-y-0.5 hover:bg-surface-container hover:ring-1 hover:ring-primary/25 active:translate-y-0"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#143321]">
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
          <span className="font-label text-xs font-bold text-on-surface-variant">Company teardown</span>
          <span className="h-1 w-1 rounded-full bg-outline-variant" aria-hidden />
          <span className="font-label text-xs font-bold text-on-surface-variant">Chapter read</span>
        </div>
        <div>
          <h3 className="line-clamp-2 font-headline text-xl font-extrabold leading-tight">{product.name}</h3>
          <p className="mt-2 line-clamp-3 font-body text-sm leading-6 text-on-surface-variant">{product.tagline}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-label text-xs font-bold text-on-surface-variant">
            {product.story_count ?? 0} {(product.story_count ?? 0) === 1 ? 'read' : 'reads'}
          </span>
          <span className="inline-flex items-center gap-1 font-label text-sm font-bold text-primary">
            Open hub
            <span className="material-symbols-outlined text-[17px] transition group-hover:translate-x-0.5" aria-hidden>
              arrow_forward
            </span>
          </span>
        </div>
      </div>
    </Link>
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
      href={`/explore/showcase/${product.slug}/stories/${story.slug}`}
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

function getCompanyMark(label: string) {
  const words = label.split(/\s+/).filter(Boolean)
  const mark = words.length > 1
    ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`
    : label.slice(0, 2)

  return mark.toUpperCase()
}
