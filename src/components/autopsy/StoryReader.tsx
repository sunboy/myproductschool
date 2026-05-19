'use client'
import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { AutopsyStory } from '@/lib/types'
import { StorySection } from './StorySection'

interface Props {
  story: AutopsyStory
  productName: string
  productSlug: string
  backHref?: string
  sidebarOffset?: boolean
  forceVisible?: boolean
}

export function StoryReader({ story, productName, productSlug, backHref, sidebarOffset = true, forceVisible = false }: Props) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [visibleSet, setVisibleSet] = React.useState<Set<number>>(new Set())
  const [visitedSet, setVisitedSet] = React.useState<Set<number>>(new Set())
  const [scrollPct, setScrollPct] = React.useState(0)

  const sectionRefs = React.useRef<(HTMLDivElement | null)[]>([])

  React.useEffect(() => {
    const main = document.querySelector('main')
    const scrollTarget = main && main.scrollHeight > main.clientHeight + 2 ? main : window
    const handleScroll = () => {
      const scrollEl = scrollTarget === window ? document.documentElement : main
      if (!scrollEl) return
      const pct = scrollEl.scrollHeight - scrollEl.clientHeight > 0
        ? (scrollEl.scrollTop / (scrollEl.scrollHeight - scrollEl.clientHeight)) * 100
        : 0
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
  }, [story.sections])

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

      {/* Breadcrumb - light surface, matches app shell */}
      <div className={cn('fixed top-[52px] left-0 right-0 z-30 h-10 flex items-center px-4 gap-2 bg-surface-container-low border-b border-outline-variant/40', sidebarOffset && 'md:left-56')}>
        <Link
          href={backHref ?? `/explore/showcase/${productSlug}`}
          className="font-label text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>arrow_back</span>
          {productName}
        </Link>
        <span className="text-outline-variant/60 text-xs">·</span>
        <span className="font-label text-xs text-on-surface-variant truncate">{story.title}</span>
        <span className="text-outline-variant/60 text-xs">·</span>
        <span className="font-label text-[11px] text-on-surface-variant/60 shrink-0">{story.read_time}</span>
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

      {/* Story sections - offset for fixed breadcrumb */}
      <div className="pt-10">
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
