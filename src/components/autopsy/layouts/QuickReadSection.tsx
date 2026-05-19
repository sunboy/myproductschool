'use client'

import React from 'react'
import type { StorySection } from '@/lib/types'

interface Props {
  section: Extract<StorySection, { layout: 'quick_read' }>
  isVisible: boolean
  hasBeenVisible: boolean
}

const quickReadAccents = [
  { tint: '#edf4ee', border: '#89a78d', ink: '#2f6f49', rail: '#4f8d62' },
  { tint: '#fbf0d8', border: '#d0a54f', ink: '#8b681a', rail: '#c4912f' },
  { tint: '#f5e7df', border: '#c98970', ink: '#8a4938', rail: '#b9684d' },
  { tint: '#eaf0ee', border: '#7ea69d', ink: '#2e6960', rail: '#4b8d81' },
  { tint: '#f2ecd8', border: '#b6a36c', ink: '#726026', rail: '#a58a31' },
  { tint: '#eef1e8', border: '#98a784', ink: '#4f6738', rail: '#718c4e' },
]

export function QuickReadSection({ section, hasBeenVisible }: Props) {
  const { label, title, cards } = section.content
  const [entered, setEntered] = React.useState(hasBeenVisible)

  React.useEffect(() => {
    if (hasBeenVisible) {
      const t = setTimeout(() => setEntered(true), 60)
      return () => clearTimeout(t)
    }
  }, [hasBeenVisible])

  return (
    <div className="relative overflow-hidden bg-[#f6f0e6] px-0 py-12 md:py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.34]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(74, 124, 89, 0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(74, 124, 89, 0.11) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-[280px_minmax(0,1fr)] md:px-16">
        <div className="md:sticky md:top-28 md:self-start">
          <span className="font-label text-xs font-bold uppercase tracking-[0.24em] text-primary">
            {label}
          </span>
          <h2
            className="mt-3 max-w-xl font-headline font-extrabold leading-tight text-on-surface"
            style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}
          >
            {title}
          </h2>
          <p className="mt-5 max-w-sm font-body text-sm leading-7 text-on-surface-variant">
            Six beats that carry the article: context, choice, trap, mechanism, proof, and lesson.
          </p>
          <div className="mt-8 hidden items-center gap-2 md:flex" aria-hidden="true">
            {cards.map((_, index) => {
              const accent = quickReadAccents[index % quickReadAccents.length]
              return (
                <span
                  key={index}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ backgroundColor: accent.rail }}
                />
              )
            })}
          </div>
        </div>

        <div
          className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-3"
          aria-label="Quick read cards"
        >
          {cards.map((card, index) => (
            <article
              key={`${card.eyebrow}-${card.title}`}
              className="relative min-h-[320px] min-w-[82vw] snap-center overflow-hidden rounded-lg border bg-background p-5 shadow-[0_18px_45px_rgba(42,48,39,0.10)] md:min-w-0"
              style={{
                borderColor: quickReadAccents[index % quickReadAccents.length].border,
                background:
                  `linear-gradient(135deg, ${quickReadAccents[index % quickReadAccents.length].tint} 0%, #fffaf0 56%, #ffffff 100%)`,
                opacity: entered ? 1 : 0,
                transform: entered ? 'none' : 'translateY(14px)',
                transition: 'opacity 0.55s ease, transform 0.55s ease',
                transitionDelay: `${index * 55}ms`,
              }}
            >
              <div
                className="absolute right-3 top-0 font-headline text-[104px] font-extrabold leading-none opacity-[0.075]"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, '0')}
              </div>
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ backgroundColor: quickReadAccents[index % quickReadAccents.length].rail }}
                aria-hidden="true"
              />

              <div className="relative flex min-h-[280px] flex-col">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-label font-black text-white shadow-[0_8px_20px_rgba(45,75,50,0.22)]"
                    style={{ backgroundColor: quickReadAccents[index % quickReadAccents.length].ink }}
                  >
                    {index + 1}
                  </span>
                  <span
                    className="rounded-full border bg-white/70 px-3 py-1 text-[10px] font-label font-black uppercase tracking-[0.14em]"
                    style={{
                      borderColor: quickReadAccents[index % quickReadAccents.length].border,
                      color: quickReadAccents[index % quickReadAccents.length].ink,
                    }}
                  >
                    {String(index + 1).padStart(2, '0')} / {String(cards.length).padStart(2, '0')}
                  </span>
                </div>

                <p
                  className="font-label text-[10px] font-black uppercase tracking-[0.18em]"
                  style={{ color: quickReadAccents[index % quickReadAccents.length].ink }}
                >
                  {card.eyebrow}
                </p>
                <h3 className="mt-3 font-headline text-2xl font-extrabold leading-[1.05] text-on-surface">
                  {card.title}
                </h3>
                <p className="mt-4 text-sm font-body leading-6 text-on-surface-variant">
                  {card.body}
                </p>

                <div className="mt-auto pt-7">
                  <div className="flex items-center gap-2" aria-hidden="true">
                    {cards.map((_, dotIndex) => (
                      <span
                        key={dotIndex}
                        className="h-1.5 rounded-full"
                        style={{
                          width: dotIndex === index ? 24 : 6,
                          backgroundColor:
                            dotIndex === index
                              ? quickReadAccents[index % quickReadAccents.length].rail
                              : 'rgba(74, 83, 68, 0.22)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
