'use client'

import { useEffect, useState } from 'react'
import { HackProductWordmark } from '@/components/brand/HackProductBrand'

export function V3Nav() {
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
        <a className="nav-logo" href="#top">
          <HackProductWordmark
            className="nav-logo-wordmark"
            priority
          />
        </a>
        <div className="nav-links">
          <a className="nav-link" href="#disciplines">Disciplines <span className="caret">▾</span></a>
          <a className="nav-link" href="#features">Features <span className="caret">▾</span></a>
          <a className="nav-link" href="#live">Live Interviews</a>
          <a className="nav-link" href="#analytics">Live Analyst</a>
          <a className="nav-link" href="#hatch">Hatch</a>
          <a className="nav-link" href="#pricing">Pricing</a>
        </div>
        <div className="nav-cta-row">
          <a className="nav-signin" href="/login">Sign in</a>
          <button
            type="button"
            className="btn btn-amber nav-cta"
            onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'signup' } }))}
          >
            Get started <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
