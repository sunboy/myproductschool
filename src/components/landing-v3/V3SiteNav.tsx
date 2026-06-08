'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HackProductWordmark } from '@/components/brand/HackProductBrand'

const NAV_LINKS = [
  { label: 'Practice', href: '/practice' },
  { label: 'Skills', href: '/skills' },
  { label: 'Live Interviews', href: '/interviews/live-ai-interviews' },
  { label: 'Analytics', href: '/claude-code-analytics' },
  { label: 'FLOW', href: '/flow' },
  { label: 'Pricing', href: '/pricing' },
]

/**
 * Route-linked variant of V3Nav for content/marketing pages. Reuses the exact
 * same `.nav` CSS classes as the landing nav, but links to real pages instead
 * of in-page hash anchors (which only exist on the landing route).
 */
export function V3SiteNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={'nav' + (scrolled ? ' scrolled' : '')}>
      <div className="shell nav-inner">
        <Link className="nav-logo" href="/">
          <HackProductWordmark className="nav-logo-wordmark" priority />
        </Link>
        <div className="nav-links">
          {NAV_LINKS.map((link) => (
            <Link className="nav-link" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="nav-cta-row">
          <Link className="nav-signin" href="/login">
            Sign in
          </Link>
          <Link className="btn btn-amber nav-cta" href="/signup">
            Get started <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
