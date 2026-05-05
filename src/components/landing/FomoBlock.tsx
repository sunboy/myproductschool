import Link from 'next/link'

export function FomoBlock() {
  return (
    <section className="land-final-cta">
      <div>
        <h2>
          Train for the full product loop
          <span> with AI coaches</span>
        </h2>
        <nav aria-label="Landing page quick links">
          <a href="#how">How to</a>
          <a href="#start">Start</a>
          <a href="#build">Build</a>
          <a href="#review">Review</a>
          <a href="#scale">Scale</a>
        </nav>
        <Link href="/login">Train now</Link>
      </div>
      <div className="land-final-card" aria-hidden>
        <div className="pixel-sunflower">
          <span />
          <span />
          <span />
        </div>
        <div>
          <h3>HackProduct is an AI interview platform designed to build product judgment.</h3>
          <Link href="/login">Train now</Link>
        </div>
      </div>
    </section>
  )
}
