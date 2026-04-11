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
    <div className="relative pt-10">
      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none"
        style={{
          width: `${scrollPct}%`,
          transition: 'width 0.1s linear',
          background: 'linear-gradient(90deg, #4a7c59, #8ecf9e)',
        }}
      />

      {/* Fixed breadcrumb — pinned just below the TopBar (52px), offset by NavRail on desktop */}
      <div
        className="fixed top-[52px] left-0 md:left-56 right-0 z-30 h-10 flex items-center px-4 gap-2 text-sm"
        style={{ background: 'rgba(11,22,16,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(74,124,89,0.15)' }}
      >
        <Link
          href={`/explore/showcase/${productSlug}`}
          className="font-label text-xs transition-colors"
          style={{ color: 'rgba(142,207,158,0.7)' }}
        >
          ← {productName}
        </Link>
        <span style={{ color: 'rgba(74,124,89,0.4)' }}>·</span>
        <span className="font-label text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{story.title}</span>
        <span style={{ color: 'rgba(74,124,89,0.4)' }}>·</span>
        <span className="font-label text-[11px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{story.read_time}</span>
      </div>

      {/* Section navigation dots — fixed right, hidden on mobile */}
      <div className="fixed right-5 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-2.5">
        {story.sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => scrollToSection(s.id)}
            aria-label={`Go to section ${i + 1}`}
            className={cn('rounded-full transition-all duration-300', i === activeIndex ? 'w-2 h-2' : 'w-1.5 h-1.5')}
            style={{
              backgroundColor: '#8ecf9e',
              opacity: i === activeIndex ? 1 : visitedSet.has(i) ? 0.35 : 0.15,
              boxShadow: i === activeIndex ? '0 0 6px 1px rgba(142,207,158,0.4)' : 'none',
            }}
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
