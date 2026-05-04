'use client'

import Link from 'next/link'

export function FomoBlock() {
  return (
    <section className="land-fomo">
      <div className="land-fomo-eyebrow">
        <span className="land-dot-orange" /> Hatch is always on
      </div>
      <h2>Every engineer and PM you compete with<br /><em>is already practicing.</em></h2>
      <p>Serious access to all five disciplines, live AI-run interviews, context-aware coaching, and a leaderboard built around reps. Start now, cancel anytime.</p>
      <div className="land-fomo-spots">
        <div><b>5</b><span>disciplines</span></div>
        <div><b>24</b><span>hours</span></div>
        <div><b>AI</b><span>interviews</span></div>
        <div className="land-fomo-spots-divider"><b>0</b><span>scheduling</span></div>
      </div>
      <div>
        <Link href="/login" className="land-cta-big">Start for free, no card required →</Link>
      </div>
      <p style={{ fontSize: 12.5, opacity: 0.45, marginTop: 18 }}>Cancel anytime · join 18k+ engineers &amp; PMs</p>
    </section>
  )
}
