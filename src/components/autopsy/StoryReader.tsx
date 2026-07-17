'use client'
import React from 'react'
import { cn } from '@/lib/utils'
import type { AutopsyStory } from '@/lib/types'
import { trackEvent } from '@/lib/posthog/client'
import {
  EVENT_AUTOPSY_OPENED,
  EVENT_AUTOPSY_SECTION_VIEWED,
  EVENT_AUTOPSY_FINISHED,
} from '@/lib/posthog/events'
import { StorySection } from './StorySection'
import { BackCrumb } from '@/components/navigation/BackButton'

interface Props {
  story: AutopsyStory
  productName: string
  productSlug: string
  backHref?: string
  forceVisible?: boolean
}

export function StoryReader({ story, productName, productSlug, backHref, forceVisible = false }: Props) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [visibleSet, setVisibleSet] = React.useState<Set<number>>(new Set())
  const [visitedSet, setVisitedSet] = React.useState<Set<number>>(new Set())
  const [scrollPct, setScrollPct] = React.useState(0)

  const sectionRefs = React.useRef<(HTMLDivElement | null)[]>([])

  // ── Analytics refs — same payload shape as the legacy AutopsyReaderClient,
  // the article-resume cron reads slug + section_index + pct off these events.
  const scrollPctRef = React.useRef(0)
  const trackedSectionsRef = React.useRef<Set<number>>(new Set())
  const finishedTrackedRef = React.useRef(false)

  // ── Analytics: autopsy_opened ─────────────────────────────────────────────
  React.useEffect(() => {
    trackEvent(EVENT_AUTOPSY_OPENED, { slug: productSlug })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    const main = document.querySelector('main')
    const scrollTarget = main && main.scrollHeight > main.clientHeight + 2 ? main : window
    const handleScroll = () => {
      const scrollEl = scrollTarget === window ? document.documentElement : main
      if (!scrollEl) return
      const pct = scrollEl.scrollHeight - scrollEl.clientHeight > 0
        ? (scrollEl.scrollTop / (scrollEl.scrollHeight - scrollEl.clientHeight)) * 100
        : 0
      scrollPctRef.current = pct
      setScrollPct(pct)
    }
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => scrollTarget.removeEventListener('scroll', handleScroll)
  }, [])

  React.useEffect(() => {
    const main = document.querySelector('main')
    const observerRoot = main && main.scrollHeight > main.clientHeight + 2 ? main : null
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-section-index'))
          if (isNaN(index)) return
          if (entry.isIntersecting) {
            setVisibleSet(prev => new Set([...prev, index]))
            setVisitedSet(prev => new Set([...prev, index]))
            setActiveIndex(index)
            // ── Analytics: autopsy_section_viewed / autopsy_finished ────────
            if (!trackedSectionsRef.current.has(index)) {
              trackedSectionsRef.current.add(index)
              trackEvent(EVENT_AUTOPSY_SECTION_VIEWED, {
                slug: productSlug,
                section_index: index,
                pct: Math.round(scrollPctRef.current),
              })
            }
            if (index === story.sections.length - 1 && !finishedTrackedRef.current) {
              finishedTrackedRef.current = true
              trackEvent(EVENT_AUTOPSY_FINISHED, { slug: productSlug })
            }
          } else {
            setVisibleSet(prev => {
              const next = new Set(prev)
              next.delete(index)
              return next
            })
          }
        })
      },
      { root: observerRoot, rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    )
    sectionRefs.current.forEach(ref => { if (ref) observer.observe(ref) })

    const visibilityFallback = window.setTimeout(() => {
      const allSections = story.sections.map((_, index) => index)
      setVisibleSet(new Set(allSections))
      setVisitedSet(new Set(allSections))
    }, 700)

    return () => {
      observer.disconnect()
      window.clearTimeout(visibilityFallback)
    }
  }, [story.sections, productSlug])

  const scrollToSection = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {/* Scroll progress bar - Terra green */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none"
        style={{
          width: `${scrollPct}%`,
          transition: 'width 0.1s linear',
          background: 'linear-gradient(90deg, #4a7c59, #78a886)',
        }}
      />

      {/* Back bar - single link to the company hub, in normal flow. The old
          fixed top-[52px] band assumed a 52px header and cropped the top of
          the story under the taller app TopNav (and any marketing header). */}
      <div className="flex items-center px-4 py-2 gap-2 bg-surface-container-low border-b border-outline-variant/40">
        <BackCrumb href={backHref ?? `/explore/autopsies/${productSlug}`} label={productName} />
        {story.read_time && (
          <span className="font-label text-[11px] text-on-surface-variant/60 shrink-0 ml-auto">{story.read_time}</span>
        )}
      </div>

      {/* Section navigation dots - right side, hidden mobile */}
      <div className="fixed right-5 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-2.5">
        {story.sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => scrollToSection(s.id)}
            aria-label={`Go to section ${i + 1}`}
            className={cn('rounded-full transition-all duration-300', i === activeIndex ? 'w-2 h-2' : 'w-1.5 h-1.5')}
            style={{
              backgroundColor: '#4a7c59',
              opacity: i === activeIndex ? 1 : visitedSet.has(i) ? 0.35 : 0.15,
              boxShadow: i === activeIndex ? '0 0 6px 1px rgba(74,124,89,0.3)' : 'none',
            }}
          />
        ))}
      </div>

      <div>
        {story.sections.map((section, i) => (
          <div
            key={section.id}
            id={`section-${section.id}`}
            data-section-index={i}
            ref={el => { sectionRefs.current[i] = el }}
          >
            <StorySection
              section={section}
              isVisible={forceVisible || visibleSet.has(i)}
              hasBeenVisible={forceVisible || visitedSet.has(i)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
