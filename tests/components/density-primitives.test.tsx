import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CoverCard } from '@/components/density/CoverCard'
import { HeaderBand } from '@/components/density/HeaderBand'
import { HatchPickCard } from '@/components/density/HatchPickCard'

vi.mock('@/components/redesign/HatchImage', () => ({ HatchImage: () => null }))
vi.mock('next/link', () => ({ default: (p: any) => <a href={p.href}>{p.children}</a> }))

describe('density primitives', () => {
  it('CoverCard renders title, meta and a ring with the pct', () => {
    const html = renderToStaticMarkup(<CoverCard href="/x" seed="a" eyebrow="Study plan" title="Frame like a PM" meta={[{ value: '7', label: 'reps' }]} pct={43} />)
    expect(html).toContain('Frame like a PM'); expect(html).toContain('43%'); expect(html).toContain('href="/x"')
  })
  it('HeaderBand renders title, chips and the right slot', () => {
    const html = renderToStaticMarkup(<HeaderBand title="Practice" chips={[{ label: 'Resume only', href: '/challenges?resume=1' }]} right={<span>R</span>} />)
    expect(html).toContain('Practice'); expect(html).toContain('Resume only'); expect(html).toContain('>R<')
  })
  it('HatchPickCard renders eyebrow, title link and CTA', () => {
    const html = renderToStaticMarkup(<HatchPickCard eyebrow="Hatch's pick" title="Model Accuracy Up" reason="Optimize needs practice" href="/workspace/challenges/x" ctaLabel="Try now" />)
    expect(html).toContain('Model Accuracy Up'); expect(html).toContain('Try now'); expect(html).toContain('/workspace/challenges/x')
  })
})
