import Link from 'next/link'
import {
  LivePreview_Practice,
  LivePreview_LiveInterview,
  LivePreview_StudyPlans,
  LivePreview_LumaCoach,
  LivePreview_Grading,
} from './LivePreviews'

interface FeatureRowProps {
  num: string
  eyebrow: string
  title: string
  titleEm: string
  body: string
  bullets: string[]
  link: string
  href: string
  reverse?: boolean
  children: React.ReactNode
}

function FeatureRow({ num, eyebrow, title, titleEm, body, bullets, link, href, reverse, children }: FeatureRowProps) {
  return (
    <div className={`land-feature ${reverse ? 'land-feature--reverse' : ''}`}>
      <div className="land-feature-copy">
        <div className="land-feature-num">{num} · {eyebrow}</div>
        <h3 className="land-feature-h">{title} <em>{titleEm}</em></h3>
        <p className="land-feature-p">{body}</p>
        <ul className="land-feature-bullets">
          {bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
        <a href={href} className="land-feature-link">{link} →</a>
      </div>
      <div className="land-feature-stage">
        <div className="land-feature-stage-chrome">
          <span /><span /><span />
          <span className="land-feature-stage-chrome-url">
            hackproduct.app/{eyebrow.toLowerCase().replace(/\s+/g, '-')}
          </span>
        </div>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
          {children}
        </div>
        <span className="land-live-tag">
          <span className="land-dot-orange" /> Live
        </span>
      </div>
    </div>
  )
}

export function FeatureRows() {
  return (
    <section id="features" className="land-section">
      <div className="land-section-inner">
        <div className="land-section-eyebrow">The product</div>
        <h2 className="land-section-h">Five rooms. <em>One operating system</em> for clear thinking.</h2>
        <p className="land-section-sub">Every screen below is live. Click around. These aren&apos;t screenshots.</p>

        <FeatureRow
          num="01" eyebrow="Practice"
          title="Drill the move," titleEm="not the trivia."
          body="Spotify dropped 15% session length. World Cup, or the new home feed? Pick a real scenario, write your answer, watch Hatch score your Frame in real time."
          bullets={['420+ scenarios across 14 paradigms', 'Hatch reacts as you type, no waiting', 'Frame · List · Optimize · Win, every drill']}
          link="Browse scenarios" href="/challenges"
        >
          <LivePreview_Practice />
        </FeatureRow>

        <FeatureRow
          num="02" eyebrow="Live AI Interview"
          title="The mock interview that" titleEm="actually pushes back."
          body="Voice-to-voice with Hatch. It interrupts when you wave hands, asks the follow-up your interviewer would, and grades you against the real rubric staff PMs use."
          bullets={['Senior, Staff, or APM difficulty; switches mid-call', 'Live transcript + rubric scoring', 'Replay any answer, hear what to fix']}
          link="Try a 5-min interview" href="/live-interviews"
          reverse
        >
          <LivePreview_LiveInterview />
        </FeatureRow>

        <FeatureRow
          num="03" eyebrow="Study Plans"
          title="Six weeks." titleEm="A new lens on product."
          body="Pick the plan that matches what you're shipping next. Each week ladders specific moves into the next, with scenarios that reuse what you just learned."
          bullets={['AI-Native, Growth Loops, Agentic, Marketplaces, B2B SaaS, +9 more', 'Built by PMs who actually shipped these things', 'Adapts week-to-week based on your scores']}
          link="See all plans" href="/prep/study-plans"
        >
          <LivePreview_StudyPlans />
        </FeatureRow>

        <FeatureRow
          num="04" eyebrow="Hatch Coaching"
          title="Always-on coach," titleEm="brutally specific."
          body="Stuck? Ask Hatch. It's seen every scenario, knows your last 50 reps, and refuses to let you off the hook with vague answers."
          bullets={["Context-aware: knows what screen you're on", 'Pushes back on hand-waving, like a great mentor would', 'Explains the rubric, not just the score']}
          link="Talk to Hatch" href="/dashboard"
          reverse
        >
          <LivePreview_LumaCoach />
        </FeatureRow>

        <FeatureRow
          num="05" eyebrow="Grading"
          title="The rubric your" titleEm="future hiring panel uses."
          body="Every answer scored across the four FLOW moves with a transparent rubric. See exactly which sub-skill broke down, and what to drill next."
          bullets={['Move-by-move radial score', 'Receipts: which sentences earned points', "One-tap 'drill this weakness' for every miss"]}
          link="See sample report" href="/dashboard"
        >
          <LivePreview_Grading />
        </FeatureRow>
      </div>
    </section>
  )
}
