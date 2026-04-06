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
}

export function StoryReader({ story, productName, productSlug }: Props) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [visibleSet, setVisibleSet] = React.useState<Set<number>>(new Set())
  const [visitedSet, setVisitedSet] = React.useState<Set<number>>(new Set())
  const [scrollPct, setScrollPct] = React.useState(0)

  const sectionRefs = React.useRef<(HTMLDivElement | null)[]>([])

  // Attach scroll listener to the (app) layout's <main> scroll container
  React.useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const handleScroll = () => {
      const pct = main.scrollHeight - main.clientHeight > 0
        ? (main.scrollTop / (main.scrollHeight - main.clientHeight)) * 100
        : 0
      setScrollPct(pct)
    }
    main.addEventListener('scroll', handleScroll, { passive: true })
    return () => main.removeEventListener('scroll', handleScroll)
  }, [])

  // Observe all section divs with IntersectionObserver
  React.useEffect(() => {
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
      { threshold: 0.3 }
    )
    sectionRefs.current.forEach(ref => { if (ref) observer.observe(ref) })
    return () => observer.disconnect()
  }, [story.sections])

  const scrollToSection = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-50 pointer-events-none"
        style={{ width: `${scrollPct}%`, transition: 'width 0.1s linear' }}
      />

      {/* Sticky breadcrumb — sits below the TopBar (h-13 = 52px) */}
      <div className="sticky top-[52px] z-30 bg-background/90 backdrop-blur-md border-b border-outline-variant/30 h-10 flex items-center px-4 gap-2 text-sm">
        <Link
          href={`/explore/showcase/${productSlug}`}
          className="text-on-surface-variant hover:text-primary transition-colors"
        >
          ← {productName}
        </Link>
        <span className="text-outline-variant">·</span>
        <span className="text-on-surface truncate">{story.title}</span>
        <span className="text-outline-variant">·</span>
        <span className="text-on-surface-variant text-xs shrink-0">{story.read_time}</span>
      </div>

      {/* Section navigation dots — fixed right, hidden on mobile */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-2">
        {story.sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => scrollToSection(s.id)}
            aria-label={`Go to section ${i + 1}`}
            className={cn(
              'rounded-full bg-primary transition-all duration-300',
              i === activeIndex
                ? 'w-2.5 h-2.5 opacity-100'
                : visitedSet.has(i)
                ? 'w-2 h-2 opacity-50'
                : 'w-1.5 h-1.5 opacity-25'
            )}
          />
        ))}
      </div>

      {/* Story sections */}
      {story.sections.map((section, i) => (
        <div
          key={section.id}
          id={`section-${section.id}`}
          data-section-index={i}
          ref={el => { sectionRefs.current[i] = el }}
        >
          <StorySection
            section={section}
            isVisible={visibleSet.has(i)}
            hasBeenVisible={visitedSet.has(i)}
          />
        </div>
      ))}
    </div>
  )
}
