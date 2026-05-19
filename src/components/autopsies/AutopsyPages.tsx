import Image from 'next/image'
import Link from 'next/link'
import { Fragment } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Lock,
  SearchCheck,
  ShieldCheck,
} from 'lucide-react'
import { canReadAutopsyStory, getAutopsyGateLabel, type AutopsyAccess } from '@/lib/autopsies/access'
import type { AutopsyCompanyWithStories, AutopsyImageRole, CompanyHub, FeatureAutopsy, QuickReadCard as QuickReadCardData } from '@/lib/autopsies/types'

const hatchImages = [
  '/images/hacky_reading.png',
  '/images/hacky_thinking.png',
]

interface AutopsyIndexPageProps {
  companies: AutopsyCompanyWithStories[]
  stories: FeatureAutopsy[]
  access: AutopsyAccess
}

interface CompanyPageProps {
  company: AutopsyCompanyWithStories
  access: AutopsyAccess
}

interface StoryPageProps {
  company: CompanyHub
  story: FeatureAutopsy
  access: AutopsyAccess
}

export function AutopsyIndexPage({ companies, stories, access }: AutopsyIndexPageProps) {
  const companyTeardowns = stories.filter(story => story.storyType === 'company_teardown')
  const featureStories = stories.filter(story => story.storyType === 'feature_autopsy')
  const visibleStories = featureStories.slice(0, access.freeStoryLimit)
  const signedUpOnlyCount = Math.max(0, featureStories.length - visibleStories.length)
  const publishedCount = stories.filter(story => story.status === 'published').length

  return (
    <AutopsyShell>
      <AutopsyHero
        eyebrow="Public autopsies"
        title="Product stories with receipts, visuals, and clear judgment."
        description="Company hubs hold both the larger teardown and the narrower feature autopsies. The reader sees one library, grouped by company."
        imageSrc="/images/hacky_reading.png"
        stats={[
          { label: 'Feature queue', value: `${featureStories.length}` },
          { label: 'Company teardowns', value: `${companyTeardowns.length}` },
          { label: 'Company hubs', value: `${companies.length}` },
          { label: 'Public pilot slots', value: `${access.freeStoryLimit}` },
          { label: 'Published', value: `${publishedCount}` },
        ]}
      />

      <section className="border-y border-[#d8d0c0] bg-[#faf6f0] px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-bold text-[#4a7c59]">Intelligent gate</p>
            <h2 className="mt-3 max-w-2xl font-headline text-3xl font-semibold leading-tight text-[#1e211c] sm:text-4xl">
              Read the first three. See the full research map. Sign up for the rest.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <GateStat icon={<BookOpen size={18} />} label="Open" value={`${visibleStories.length} pieces`} />
            <GateStat icon={<Lock size={18} />} label="Signed-up readers" value={`${signedUpOnlyCount} pieces`} />
            <GateStat icon={<ShieldCheck size={18} />} label="Publish rule" value="Approved only" />
          </div>
        </div>
      </section>

      <AutopsySection
        eyebrow="Editorial system"
        title="A library built for marketing without lowering the evidence bar."
        description="Each public article must clear source, claim, proofread, image, watermark, and mobile checks before it can move from queue to publish."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MethodCard icon={<SearchCheck />} title="Research first" body="At least five credible sources, source tiers, claim maps, and metric confidence labels." />
          <MethodCard icon={<FileText />} title="Narrative craft" body="Each story moves from context to tradeoff to product decision to evidence-backed lesson." />
          <MethodCard icon={<ImageIcon />} title="Image led" body="Hatch appears as narrator, with role-specific art, crops, alt text, and watermark QA." />
          <MethodCard icon={<BadgeCheck />} title="Proofread gate" body="No published piece ships without approved proofreading and copy lint passing." />
        </div>
      </AutopsySection>

      <AutopsySection
        shaded
        eyebrow="First public reads"
        title="The opening set"
        description="These are the first reader-facing slots. Drafts show production briefs until the full research and image packet is approved."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {visibleStories.map((story, index) => (
            <StoryCard
              key={story.slug}
              story={story}
              company={companies.find(item => item.slug === story.companySlug)}
              access={access}
              visualIndex={index}
              featured
            />
          ))}
        </div>
      </AutopsySection>

      {companyTeardowns.length > 0 && (
        <AutopsySection
          eyebrow="Company teardowns"
          title="The hub-level stories"
          description="Company teardowns explain the system and operating bet. Feature autopsies sit underneath them as narrower reading pieces."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {companyTeardowns.map((story, index) => (
              <StoryCard
                key={story.slug}
                story={story}
                company={companies.find(item => item.slug === story.companySlug)}
                access={access}
                visualIndex={index}
              />
            ))}
          </div>
        </AutopsySection>
      )}

      <AutopsySection
        eyebrow="Company hubs"
        title="Company hubs organize the library."
        description="Each hub keeps company context, the company-level teardown, timeline notes, and feature autopsies together."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map(company => (
            <Link
              key={company.slug}
              href={`/autopsies/${company.slug}`}
              className="group rounded-lg bg-white p-5 text-[#1e211c] no-underline ring-1 ring-[#d8d0c0] transition hover:-translate-y-0.5 hover:ring-[#4a7c59]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#4a7c59]">{company.industry}</p>
                  <h3 className="mt-2 font-headline text-2xl font-semibold">{company.name}</h3>
                </div>
                <span className="rounded-lg px-3 py-1 text-sm font-bold" style={{ backgroundColor: `${company.accent}22`, color: company.accent }}>
                  {company.stories.length}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#565d52]">{company.thesis}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#244232]">
                Open hub <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </AutopsySection>

      <AutopsySection
        shaded
        eyebrow="Full queue"
        title="All 50 planned feature autopsies"
        description="The full set stays visible so readers understand the editorial promise. Signed-up readers get access beyond the public preview limit as pieces are approved."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {featureStories.map((story, index) => (
            <StoryRow
              key={story.slug}
              story={story}
              company={companies.find(item => item.slug === story.companySlug)}
              access={access}
              visualIndex={index}
            />
          ))}
        </div>
      </AutopsySection>
    </AutopsyShell>
  )
}

export function AutopsyCompanyPage({ company, access }: CompanyPageProps) {
  const companyTeardowns = company.stories.filter(story => story.storyType === 'company_teardown')
  const featureStories = company.stories.filter(story => story.storyType === 'feature_autopsy')

  return (
    <AutopsyShell>
      <AutopsyHero
        eyebrow={`${company.industry} hub`}
        title={`${company.name} autopsy hub`}
        description={company.thesis}
        imageSrc="/images/hacky_thinking.png"
        accent={company.accent}
        stats={[
          { label: 'Company teardowns', value: `${companyTeardowns.length}` },
          { label: 'Feature stories', value: `${featureStories.length}` },
          { label: 'Reader gate', value: access.isSignedIn ? 'Signed in' : `First ${access.freeStoryLimit}` },
        ]}
      />

      <AutopsySection
        eyebrow="Company context"
        title="Hub before story."
        description="The company page keeps the system context, company teardown, and feature autopsies together without making the article routes more complex."
      >
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg bg-white p-5 ring-1 ring-[#d8d0c0]">
            <p className="text-sm font-bold text-[#4a7c59]">Hub thesis</p>
            <p className="mt-3 text-base leading-7 text-[#1e211c]">{company.dek}</p>
          </div>
          <div className="grid gap-3">
            {company.timeline.map(item => (
              <div key={`${item.date}-${item.label}`} className="rounded-lg bg-white p-4 ring-1 ring-[#d8d0c0]">
                <p className="text-sm font-bold text-[#244232]">{item.date}</p>
                <p className="mt-1 text-sm leading-6 text-[#565d52]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </AutopsySection>

      {companyTeardowns.length > 0 && (
        <AutopsySection shaded eyebrow="Company teardown" title={`The larger ${company.name} story`}>
          <div className="grid gap-4 lg:grid-cols-2">
            {companyTeardowns.map((story, index) => (
              <StoryCard
                key={story.slug}
                story={story}
                company={company}
                access={access}
                visualIndex={index}
                featured={index === 0}
              />
            ))}
          </div>
        </AutopsySection>
      )}

      <AutopsySection shaded={companyTeardowns.length === 0} eyebrow="Feature autopsies" title={`Feature stories in the ${company.name} hub`}>
        <div className="grid gap-4 lg:grid-cols-3">
          {featureStories.map((story, index) => (
            <StoryCard
              key={story.slug}
              story={story}
              company={company}
              access={access}
              visualIndex={index}
              featured={index === 0}
            />
          ))}
        </div>
      </AutopsySection>
    </AutopsyShell>
  )
}

export function AutopsyStoryPage({ company, story, access }: StoryPageProps) {
  const canRead = canReadAutopsyStory(story, access)
  const heroImage = getStoryImage(story, 'hero', '/images/hacky_reading.png')

  if (!canRead) {
    return <LockedStoryPage company={company} story={story} access={access} />
  }

  return (
    <AutopsyShell>
      <article>
        <AutopsyHero
          eyebrow={`${company.name} ${formatStoryType(story).toLowerCase()}`}
          title={story.title}
          description={story.dek}
          imageSrc={heroImage.src}
          imageAlt={heroImage.alt}
          accent={company.accent}
          stats={[
            { label: 'Chapters', value: `${story.flow.length}` },
            { label: 'Source pack', value: `${story.sources.length}` },
            { label: 'Proofread', value: formatStatus(story.proofreadStatus) },
          ]}
        />

        <QuickReadDeck story={story} compact={false} />

        <section className="bg-[#faf6f0] px-5 py-8 sm:px-8">
          <div className="mx-auto flex max-w-4xl flex-wrap gap-3 text-sm">
            <StatusPill label={`Read time: ${story.estimatedReadTime}`} />
            <StatusPill label={`${story.sources.length} sources`} />
            <StatusPill label={`Proofread: ${formatStatus(story.proofreadStatus)}`} />
            <StatusPill label={getAutopsyGateLabel(story, access)} />
          </div>
        </section>

        <section className="px-5 py-12 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-8">
              <div className="rounded-lg bg-white p-6 ring-1 ring-[#d8d0c0]">
                <p className="text-sm font-bold text-[#4a7c59]">Evidence boundary</p>
                <p className="mt-3 text-base leading-7 text-[#565d52]">
                  {story.sourceSummary}
                </p>
              </div>

              {story.flow.map((section, index) => (
                <Fragment key={section.move}>
                  <section className="rounded-lg bg-white p-6 ring-1 ring-[#d8d0c0]">
                    <p className="text-sm font-bold text-[#4a7c59]">Chapter {String(index + 1).padStart(2, '0')}</p>
                    <h2 className="mt-3 font-headline text-3xl font-semibold leading-tight text-[#1e211c]">{section.title}</h2>
                    <div className="mt-4 space-y-4">
                      {section.body.map(paragraph => (
                        <p key={paragraph} className="text-base leading-7 text-[#565d52]">{paragraph}</p>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {section.sourceIds.length > 0 ? section.sourceIds.map(sourceId => (
                        <span key={sourceId} className="rounded-lg bg-[#edf3ea] px-3 py-1 text-xs font-bold text-[#244232]">
                          Source {sourceId}
                        </span>
                      )) : (
                        <span className="rounded-lg bg-[#f4eee2] px-3 py-1 text-xs font-bold text-[#705c30]">
                          Source map pending
                        </span>
                      )}
                    </div>
                  </section>
                  {index === 1 && <StoryInlineVisual story={story} role="failure-mechanism" />}
                  {index === 2 && <StoryEvidenceLedger story={story} />}
                </Fragment>
              ))}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <SourceDrawer story={story} />
              <MetricDrawer story={story} />
              <CorrectionBox story={story} />
            </aside>
          </div>
        </section>
      </article>
    </AutopsyShell>
  )
}

function LockedStoryPage({ company, story, access }: StoryPageProps) {
  const heroImage = getStoryImage(story, 'hero', '/images/hacky_thinking.png')

  return (
    <AutopsyShell>
      <AutopsyHero
        eyebrow="Signed-up reader story"
        title={story.title}
        description={story.dek}
        imageSrc={heroImage.src}
        imageAlt={heroImage.alt}
        accent={company.accent}
        stats={[
          { label: 'Queue', value: `#${story.queueRank}` },
          { label: 'Public limit', value: `${access.freeStoryLimit}` },
          { label: 'Status', value: formatStatus(story.status) },
        ]}
      />
      <section className="px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg bg-white p-7 ring-1 ring-[#d8d0c0]">
            <Lock size={28} className="text-[#4a7c59]" />
            <h2 className="mt-4 font-headline text-3xl font-semibold text-[#1e211c]">
              This autopsy is part of the signed-up reader library.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#565d52]">
              The topic stays visible because the library should be inspectable before signup. Full reading access opens after account creation.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-[#244232] px-4 py-3 text-sm font-bold text-[#faf6f0] no-underline">
                Sign up to read <ArrowRight size={16} />
              </Link>
              <Link href="/autopsies" className="inline-flex items-center gap-2 rounded-lg border border-[#d8d0c0] px-4 py-3 text-sm font-bold text-[#244232] no-underline">
                View public reads
              </Link>
            </div>
          </div>
          <div className="rounded-lg bg-[#f4eee2] p-7 ring-1 ring-[#d8d0c0]">
            <p className="text-sm font-bold text-[#4a7c59]">What remains visible</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#565d52]">
              <li>Company hub and topic title</li>
              <li>Short editorial promise</li>
              <li>Research and image QA standards</li>
              <li>Correction policy and source requirements</li>
            </ul>
          </div>
        </div>
      </section>
      <QuickReadDeck story={story} compact locked />
    </AutopsyShell>
  )
}

function AutopsyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbf8f1] text-[#1e211c]">
      <header className="sticky top-0 z-40 border-b border-[#d8d0c0] bg-[#fbf8f1]/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8" aria-label="Autopsy navigation">
          <Link href="/" className="font-headline text-lg font-bold text-[#1e211c] no-underline">
            HackProduct
          </Link>
          <div className="hidden items-center gap-5 text-sm font-semibold text-[#565d52] md:flex">
            <Link className="hover:text-[#244232]" href="/autopsies">Autopsies</Link>
            <Link className="hover:text-[#244232]" href="/skills">Skills</Link>
            <Link className="hover:text-[#244232]" href="/study-plans">Study plans</Link>
          </div>
          <Link
            href="/signup"
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-lg bg-[#244232] px-4 py-2 text-sm font-bold text-[#faf6f0] no-underline"
          >
            Sign up <ArrowRight size={15} />
          </Link>
        </nav>
      </header>
      {children}
      <footer className="border-t border-[#d8d0c0] bg-[#102018] px-5 py-10 text-[#faf6f0] sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="font-headline text-2xl font-semibold">HackProduct Autopsies</div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#faf6f0]/70">
              Public product storytelling with source maps, Hatch visuals, and correction paths.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-[#faf6f0]/70">
            <Link className="hover:text-white" href="/autopsies">Library</Link>
            <Link className="hover:text-white" href="/help">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function AutopsyHero({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  stats,
  accent = '#4a7c59',
}: {
  eyebrow: string
  title: string
  description: string
  imageSrc: string
  imageAlt?: string
  stats: Array<{ label: string; value: string }>
  accent?: string
}) {
  const usesGeneratedAutopsyImage = imageSrc.startsWith('/images/autopsies/')

  return (
    <section className="relative overflow-hidden bg-[#102018] px-5 py-14 text-[#faf6f0] sm:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-bold" style={{ color: accent }}>{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-headline text-5xl font-semibold leading-none sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#faf6f0]/72">{description}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(stat => (
              <div key={`${stat.label}-${stat.value}`} className="rounded-lg border border-white/20 bg-white/10 p-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-xs font-bold text-[#faf6f0]/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-white/20 bg-[#f4eee2]">
          {usesGeneratedAutopsyImage ? (
            <Image
              src={imageSrc}
              alt={imageAlt ?? title}
              width={960}
              height={540}
              priority
              className="absolute inset-0 h-full w-full object-contain p-4"
            />
          ) : (
            <>
              <div className="absolute inset-x-0 top-0 h-16 bg-[#244232]" />
              <div className="absolute left-6 top-6 rounded-lg bg-[#faf6f0] px-3 py-2 text-xs font-bold text-[#244232]">
                Told by Hatch · HackProduct
              </div>
              <div className="absolute inset-x-6 bottom-6 grid gap-3 rounded-lg bg-white/90 p-4 text-[#1e211c] ring-1 ring-[#d8d0c0]">
                <div className="h-3 w-1/2 rounded-lg bg-[#4a7c59]" />
                <div className="h-3 w-4/5 rounded-lg bg-[#d8d0c0]" />
                <div className="h-3 w-2/3 rounded-lg bg-[#c9ad68]" />
              </div>
              <Image
                src={imageSrc}
                alt={imageAlt ?? 'Hatch reading an autopsy brief'}
                width={420}
                height={420}
                priority
                className="absolute bottom-14 right-4 h-auto w-[220px] sm:w-[280px]"
              />
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function AutopsySection({
  eyebrow,
  title,
  description,
  children,
  shaded = false,
}: {
  eyebrow?: string
  title: string
  description?: string
  children: React.ReactNode
  shaded?: boolean
}) {
  return (
    <section className={`px-5 py-14 sm:px-8 ${shaded ? 'bg-[#f4eee2]' : 'bg-[#fbf8f1]'}`}>
      <div className="mx-auto max-w-7xl">
        {eyebrow && <p className="text-sm font-bold text-[#4a7c59]">{eyebrow}</p>}
        <div className="mb-8 max-w-3xl">
          <h2 className="mt-2 font-headline text-3xl font-semibold leading-tight text-[#1e211c] sm:text-4xl">{title}</h2>
          {description && <p className="mt-3 text-base leading-7 text-[#565d52]">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  )
}

function MethodCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg bg-white p-5 ring-1 ring-[#d8d0c0]">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf3ea] text-[#244232]">{icon}</div>
      <h3 className="mt-4 font-headline text-xl font-semibold text-[#1e211c]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#565d52]">{body}</p>
    </div>
  )
}

function GateStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-4 ring-1 ring-[#d8d0c0]">
      <div className="flex items-center gap-2 text-[#4a7c59]">{icon}<span className="text-sm font-bold">{label}</span></div>
      <p className="mt-2 text-xl font-bold text-[#1e211c]">{value}</p>
    </div>
  )
}

function StoryCard({
  story,
  company,
  access,
  visualIndex,
  featured = false,
}: {
  story: FeatureAutopsy
  company?: CompanyHub
  access: AutopsyAccess
  visualIndex: number
  featured?: boolean
}) {
  const canRead = canReadAutopsyStory(story, access)
  const href = story.canonicalPath
  const fallbackImage = hatchImages[visualIndex % hatchImages.length]
  const thumbnail = getStoryImage(story, 'thumbnail', fallbackImage)
  const hasFinalThumbnail = thumbnail.src !== fallbackImage

  return (
    <Link
      href={href}
      className={`group flex h-full flex-col overflow-hidden rounded-lg bg-white text-[#1e211c] no-underline ring-1 ring-[#d8d0c0] transition hover:-translate-y-0.5 hover:ring-[#4a7c59] ${featured ? 'lg:min-h-[460px]' : ''}`}
    >
      <div className="relative h-48 bg-[#244232]">
        <div className="absolute inset-4 rounded-lg bg-[#faf6f0]">
          <div className="absolute left-4 top-4 z-10 rounded-lg bg-[#244232] px-2 py-1 text-xs font-bold text-[#faf6f0]">
            #{story.queueRank}
          </div>
          {!canRead && (
            <div className="absolute right-4 top-4 z-10 rounded-lg bg-[#1e211c] px-2 py-1 text-xs font-bold text-[#faf6f0]">
              <Lock size={12} className="mr-1 inline" /> Signup
            </div>
          )}
          {hasFinalThumbnail ? (
            <Image
              src={thumbnail.src}
              alt=""
              width={thumbnail.width}
              height={thumbnail.height}
              className="absolute inset-0 h-full w-full rounded-lg object-cover"
            />
          ) : (
            <>
              <Image
                src={thumbnail.src}
                alt=""
                width={240}
                height={240}
                className="absolute bottom-0 right-3 h-auto w-[145px]"
              />
              <div className="absolute bottom-4 left-4 right-28 space-y-2">
                <div className="h-3 rounded-lg bg-[#4a7c59]" />
                <div className="h-3 w-3/4 rounded-lg bg-[#c9ad68]" />
                <div className="h-3 w-1/2 rounded-lg bg-[#d8d0c0]" />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
          <p className="text-sm font-bold text-[#4a7c59]">{company?.name ?? story.companySlug}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#705c30]">{formatStoryType(story)}</p>
        <h3 className="mt-2 font-headline text-2xl font-semibold leading-tight">{story.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-[#565d52]">{story.dek}</p>
        <div className="mt-5 flex items-center justify-between gap-4">
          <span className="rounded-lg bg-[#f4eee2] px-3 py-1 text-xs font-bold text-[#705c30]">
            {getAutopsyGateLabel(story, access)}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-[#244232]">
            {canRead ? 'Open' : 'Preview'} <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  )
}

function QuickReadDeck({
  story,
  compact,
  locked = false,
}: {
  story: FeatureAutopsy
  compact: boolean
  locked?: boolean
}) {
  return (
    <section className={`px-5 sm:px-8 ${compact ? 'pb-14' : 'py-12'} bg-[#f4eee2]`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#4a7c59]">Quick read</p>
            <h2 className="mt-2 font-headline text-3xl font-semibold leading-tight text-[#1e211c]">
              The story in six cards.
            </h2>
            {locked && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#565d52]">
                The quick read stays open so the topic is useful before signup. The full article opens after account creation.
              </p>
            )}
          </div>
          <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#244232] ring-1 ring-[#d8d0c0]">
            Swipe on mobile
          </span>
        </div>
        <div className="flex snap-x gap-3 overflow-x-auto pb-3 md:grid md:grid-cols-3 md:overflow-visible">
          {story.quickRead.map((card, index) => (
            <QuickReadCard key={card.id} card={card} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

function QuickReadCard({ card, index }: { card: QuickReadCardData; index: number }) {
  return (
    <article className="min-w-[280px] snap-start rounded-lg bg-white p-5 ring-1 ring-[#d8d0c0] md:min-w-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#244232] text-sm font-bold text-[#faf6f0]">
          {index + 1}
        </span>
        <span className="rounded-lg bg-[#f4eee2] px-2 py-1 text-xs font-bold text-[#705c30]">
          {formatStatus(card.confidence)}
        </span>
      </div>
      <p className="text-xs font-bold uppercase text-[#4a7c59]">{card.id.replaceAll('-', ' ')}</p>
      <h3 className="mt-2 font-headline text-xl font-semibold leading-tight text-[#1e211c]">{card.title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#565d52]">{card.body}</p>
      <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#244232]">
        <span>Quick take</span>
        <span>{card.sourceIds.length > 0 ? `${card.sourceIds.length} sources` : 'Sources pending'}</span>
      </div>
    </article>
  )
}

function StoryRow({
  story,
  company,
  access,
  visualIndex,
}: {
  story: FeatureAutopsy
  company?: CompanyHub
  access: AutopsyAccess
  visualIndex: number
}) {
  const canRead = canReadAutopsyStory(story, access)
  const fallbackImage = hatchImages[visualIndex % hatchImages.length]
  const thumbnail = getStoryImage(story, 'thumbnail', fallbackImage)
  const hasFinalThumbnail = thumbnail.src !== fallbackImage

  return (
    <Link
      href={story.canonicalPath}
      className="group grid gap-4 rounded-lg bg-white p-4 text-[#1e211c] no-underline ring-1 ring-[#d8d0c0] transition hover:-translate-y-0.5 hover:ring-[#4a7c59] sm:grid-cols-[92px_1fr_auto] sm:items-center"
    >
      <div className="relative h-20 overflow-hidden rounded-lg bg-[#edf3ea]">
        <Image
          src={thumbnail.src}
          alt=""
          width={hasFinalThumbnail ? thumbnail.width : 100}
          height={hasFinalThumbnail ? thumbnail.height : 100}
          className={hasFinalThumbnail ? 'absolute inset-0 h-full w-full object-cover' : 'absolute bottom-0 right-1 h-auto w-16'}
        />
        <span className="absolute left-2 top-2 rounded-lg bg-white px-2 py-1 text-xs font-bold text-[#244232]">#{story.queueRank}</span>
      </div>
      <div>
        <p className="text-xs font-bold text-[#4a7c59]">{company?.name ?? story.companySlug}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#705c30]">{formatStoryType(story)}</p>
        <h3 className="mt-1 font-headline text-xl font-semibold leading-tight">{story.title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#565d52]">{story.dek}</p>
      </div>
      <div className="flex items-center gap-2 text-sm font-bold text-[#244232]">
        {!canRead && <Lock size={16} />}
        {getAutopsyGateLabel(story, access)}
      </div>
    </Link>
  )
}

function StatusPill({ label }: { label: string }) {
  return <span className="rounded-lg bg-white px-3 py-2 font-bold text-[#244232] ring-1 ring-[#d8d0c0]">{label}</span>
}

function SourceDrawer({ story }: { story: FeatureAutopsy }) {
  return (
    <details className="rounded-lg bg-white p-5 ring-1 ring-[#d8d0c0]" open>
      <summary className="cursor-pointer text-sm font-bold text-[#244232]">Source drawer</summary>
      {story.sources.length > 0 ? (
        <div className="mt-4 space-y-4">
          {story.sources.map(source => (
            <div key={source.id}>
              <p className="text-[11px] font-bold text-[#4a7c59]">{source.id}</p>
              <p className="text-sm font-bold text-[#1e211c]">{source.title}</p>
              <p className="text-xs leading-5 text-[#565d52]">{source.publisher} · Tier {source.tier}</p>
              <p className="mt-1 text-xs leading-5 text-[#565d52]">{source.supports}</p>
              <Link href={source.url} className="text-xs font-bold text-[#4a7c59]">Open source</Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[#565d52]">
          Source pack pending. Published autopsies require at least five credible sources.
        </p>
      )}
    </details>
  )
}

function MetricDrawer({ story }: { story: FeatureAutopsy }) {
  return (
    <div className="rounded-lg bg-white p-5 ring-1 ring-[#d8d0c0]">
      <p className="text-sm font-bold text-[#244232]">Metric confidence</p>
      {story.metrics.length > 0 ? (
        <div className="mt-4 space-y-3">
          {story.metrics.map(metric => (
            <div key={metric.label} className="rounded-lg bg-[#f4eee2] p-3">
              <p className="text-sm font-bold text-[#1e211c]">{metric.label}: {metric.value}</p>
              <p className="text-xs text-[#565d52]">{formatStatus(metric.confidence)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[#565d52]">
          No metric is shown until it has a confidence label and source IDs.
        </p>
      )}
    </div>
  )
}

function StoryEvidenceLedger({ story }: { story: FeatureAutopsy }) {
  if (story.metrics.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg bg-[#102018] p-6 text-[#faf6f0]">
      <p className="text-sm font-bold text-[#c9ad68]">Evidence ledger</p>
      <h2 className="mt-3 font-headline text-3xl font-semibold leading-tight">
        What the public record can prove
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#faf6f0]/72">
        The article keeps dates, settings, and product mechanics separate from impact claims. Anything without public support stays outside the conclusion.
      </p>
      <div className="mt-5 grid gap-3">
        {story.metrics.map(metric => (
          <div key={metric.label} className="rounded-lg border border-white/14 bg-white/8 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-[#c9ad68]">{metric.label}</p>
                <p className="mt-1 text-xl font-bold text-white">{metric.value}</p>
              </div>
              <span className="rounded-lg bg-[#faf6f0] px-3 py-1 text-xs font-bold text-[#244232]">
                {formatStatus(metric.confidence)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {metric.sourceIds.map(sourceId => (
                <span key={sourceId} className="rounded-lg border border-white/16 px-2 py-1 text-xs font-bold text-[#faf6f0]/72">
                  {sourceId}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CorrectionBox({ story }: { story: FeatureAutopsy }) {
  const subject = encodeURIComponent(`Autopsy correction: ${story.title}`)

  return (
    <div className="rounded-lg bg-[#244232] p-5 text-[#faf6f0]">
      <p className="text-sm font-bold">Corrections</p>
      <p className="mt-3 text-sm leading-6 text-[#faf6f0]/72">
        See a source issue, date conflict, or visual problem? Send a correction with the relevant evidence.
      </p>
      <Link href={`mailto:corrections@hackproduct.dev?subject=${subject}`} className="mt-4 inline-flex text-sm font-bold text-[#faf6f0]">
        Email corrections
      </Link>
    </div>
  )
}

function StoryInlineVisual({ story, role }: { story: FeatureAutopsy; role: AutopsyImageRole }) {
  const image = story.images.find(item => item.role === role)
  if (!image) {
    return null
  }

  return (
    <figure className="overflow-hidden rounded-lg bg-white ring-1 ring-[#d8d0c0]">
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        className="h-auto w-full object-cover"
      />
      <figcaption className="border-t border-[#d8d0c0] bg-[#faf6f0] px-5 py-4 text-sm leading-6 text-[#565d52]">
        {image.caption}
      </figcaption>
    </figure>
  )
}

function getStoryImage(story: FeatureAutopsy, role: AutopsyImageRole, fallbackSrc: string) {
  return story.images.find(image => image.role === role) ?? {
    src: fallbackSrc,
    alt: '',
    width: 420,
    height: 420,
  }
}

function formatStatus(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase())
}

function formatStoryType(story: FeatureAutopsy) {
  return story.storyType === 'company_teardown' ? 'Company teardown' : 'Feature autopsy'
}
