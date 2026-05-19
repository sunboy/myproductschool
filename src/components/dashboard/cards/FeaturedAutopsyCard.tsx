import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import type { CompanyHub, FeatureAutopsy } from '@/lib/autopsies/types'

export function FeaturedAutopsyCard({
  story,
  company,
}: {
  story: FeatureAutopsy
  company?: CompanyHub | null
}) {
  const visual = story.images.find(image => image.role === 'thumbnail')
    ?? story.images.find(image => image.role === 'social-cover')
    ?? story.images.find(image => image.role === 'hero')
  const storyHref = `/explore/showcase/${story.companySlug}/stories/${story.slug}`
  const hubHref = `/explore/showcase/${story.companySlug}`

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low p-3 shadow-[0_18px_42px_-38px_rgba(30,27,20,0.45)]">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_126px] sm:items-center">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2 font-label text-[10px] font-extrabold uppercase text-primary">
            <BookOpen size={13} />
            Featured autopsy
            <span className="h-1 w-1 rounded-full bg-outline" aria-hidden="true" />
            <span className="text-on-surface-variant">{story.estimatedReadTime}</span>
          </div>
          <h2 className="line-clamp-2 font-headline text-[18px] font-bold leading-tight text-on-surface sm:text-[19px]">
            {story.title}
          </h2>
          <p className="mt-1.5 line-clamp-2 max-w-2xl text-[12.5px] font-semibold leading-5 text-on-surface-variant">
            {story.dek}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={storyHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[12px] font-label font-extrabold text-on-primary no-underline transition-transform hover:-translate-y-0.5"
            >
              Read
              <ArrowRight size={14} />
            </Link>
            <Link
              href={hubHref}
              className="text-[12px] font-label font-bold text-primary no-underline hover:text-primary/80"
            >
              {company?.name ?? story.companySlug} hub
            </Link>
          </div>
        </div>
        {visual && (
          <Link
            href={storyHref}
            className="relative hidden h-[92px] overflow-hidden rounded-xl border border-outline-variant/40 bg-[#102018] sm:block"
            aria-label={`Read ${story.title}`}
          >
            <Image
              src={visual.src}
              alt=""
              width={visual.width}
              height={visual.height}
              className="h-full w-full object-cover opacity-80"
            />
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(16,32,24,0.18),rgba(201,147,58,0.18))]" />
          </Link>
        )}
      </div>
    </section>
  )
}
