import Link from 'next/link'

export function LandingNav() {
  return (
    <nav className="land-nav" aria-label="Main navigation">
      <Link href="/" className="land-wordmark">
        HackProduct
      </Link>
      <div className="land-nav-center">
        <a href="#how">How to</a>
        <a href="#start">Start</a>
        <a href="#build">Build</a>
        <a href="#review">Review</a>
        <a href="#scale">Scale</a>
      </div>
      <div className="land-nav-actions">
        <Link href="/skills">Resources</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/login" className="land-nav-login">Log in</Link>
        <Link href="/login" className="land-nav-primary">Train now</Link>
        <button className="land-nav-menu" type="button" aria-label="Open navigation">
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  )
}
