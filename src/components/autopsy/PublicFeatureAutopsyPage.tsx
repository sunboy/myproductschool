import Image from 'next/image'
import Link from 'next/link'
import { StoryReader } from '@/components/autopsy/StoryReader'
import { canReadAutopsyStory, getAutopsyGateLabel, type AutopsyAccess } from '@/lib/autopsies/access'
import { featureAutopsyToStory } from '@/lib/autopsies/showcase-adapter'
import type { CompanyHub, FeatureAutopsy } from '@/lib/autopsies/types'

interface Props {
  company: CompanyHub
  story: FeatureAutopsy
  access: AutopsyAccess
}

export function PublicFeatureAutopsyPage({ company, story, access }: Props) {
  const canRead = canReadAutopsyStory(story, access)

  return (
    <div className="h-screen min-w-0 overflow-hidden bg-background text-on-surface">
      <PublicAutopsyTopBar />
      <main className="h-[calc(100dvh-52px)] min-w-0 overflow-y-auto pb-12">
        {canRead ? (
          <StoryReader
            story={featureAutopsyToStory(story, company)}
            productName={company.name}
            productSlug={company.slug}
            backHref={`/autopsies/${company.slug}`}
            sidebarOffset={false}
            forceVisible
          />
        ) : (
          <LockedFeatureAutopsy company={company} story={story} access={access} />
        )}
      </main>
    </div>
  )
}

function formatStoryType(story: FeatureAutopsy) {
  return story.storyType === 'company_teardown' ? 'company teardown' : 'feature autopsy'
}

function PublicAutopsyTopBar() {
  return (
    <header
      className="z-40 flex h-[52px] items-center border-b border-outline-variant/60 bg-background/85 px-3 backdrop-blur md:px-6"
    >
      <Link href="/autopsies" className="flex min-w-0 items-center no-underline">
        <Image
          src="/images/wordmark.png"
          alt="HackProduct"
          width={190}
          height={48}
          className="h-9 w-auto max-w-[168px] object-contain"
          priority
        />
      </Link>
      <nav className="ml-auto flex items-center gap-2">
        <Link
          href="/autopsies"
          className="hidden rounded-full px-3 py-2 text-xs font-label font-bold text-on-surface-variant no-underline hover:bg-surface-container-low sm:inline-flex"
        >
          Autopsies
        </Link>
        <Link
          href="/signup"
          prefetch={false}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-label font-bold text-on-primary no-underline"
        >
          Sign up
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </nav>
    </header>
  )
}

function LockedFeatureAutopsy({ company, story, access }: Props) {
  return (
    <section className="mx-auto flex min-h-full max-w-5xl flex-col justify-center px-6 py-16 md:px-10">
      <div className="rounded-[24px] border border-outline-variant/50 bg-surface-container-low p-7 md:p-10">
        <span className="font-label text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {company.name} {formatStoryType(story)}
        </span>
        <h1 className="mt-3 font-headline text-4xl font-extrabold leading-tight text-on-surface md:text-6xl">
          {story.title}
        </h1>
        <p className="mt-4 max-w-2xl font-body text-base leading-7 text-on-surface-variant">
          {story.dek}
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-label font-bold">
          <span className="rounded-full bg-primary-fixed px-3 py-1.5 text-primary">
            {getAutopsyGateLabel(story, access)}
          </span>
          <span className="rounded-full bg-background px-3 py-1.5 text-on-surface-variant">
            {story.estimatedReadTime}
          </span>
          <span className="rounded-full bg-background px-3 py-1.5 text-on-surface-variant">
            {story.sources.length} sources
          </span>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup" className="rounded-full bg-primary px-5 py-3 text-sm font-label font-bold text-on-primary no-underline">
            Sign up to read
          </Link>
          <Link href="/autopsies" className="rounded-full border border-outline-variant px-5 py-3 text-sm font-label font-bold text-primary no-underline">
            Back to autopsies
          </Link>
        </div>
      </div>
    </section>
  )
}
