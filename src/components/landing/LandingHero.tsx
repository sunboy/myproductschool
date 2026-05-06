import Link from 'next/link'
import { MaskoAvatar } from '@/components/shell/MaskoAvatar'

export function LandingHero() {
  return (
    <section className="land-hero">
      <div className="land-pixel-sky" aria-hidden>
        <span className="sunbeam sunbeam--one" />
      </div>

      <div className="land-hero-copy">
        <h1>HackProduct lets you train for product interviews with AI coaches</h1>
        <p>Practice product sense, systems, SQL, data modeling, coding, and live interview pressure. Try Pro free for 7 days, cancel anytime.</p>
        <div className="land-hero-actions">
          <Link href="/login">Train now</Link>
          <Link href="/practice">Check out practice</Link>
        </div>
      </div>

      <div className="land-hero-hatch" aria-hidden>
        <MaskoAvatar animation="wave" size={320} />
      </div>

      <div className="pixel-hero-notes" aria-hidden>
        <div className="pixel-toast pixel-toast--one"><span /> Task running <b>marketplace case</b></div>
        <div className="pixel-toast pixel-toast--two"><span /> Task completed <b>SQL feedback</b></div>
      </div>
    </section>
  )
}
