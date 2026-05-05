'use client'

import { useState, useEffect, useCallback } from 'react'
import { Instrument_Serif, DM_Sans, Geist_Mono } from 'next/font/google'
import { WaitlistForm } from '@/components/marketing/WaitlistForm'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], variable: '--wf-display' })
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--wf-body' })
const geistMono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--wf-mono' })

// ── Types ──────────────────────────────────────────────────────
type FlowMove = 'frame' | 'list' | 'optimize' | 'win'

// ── Waitlist modal ─────────────────────────────────────────────
function WaitlistModal({ trigger, onClose }: { trigger: string; onClose: () => void }) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer"
      style={{ background: 'rgba(14,27,21,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 relative cursor-default"
        style={{ background: '#FAF6F0', boxShadow: '0 24px 64px rgba(14,27,21,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ color: 'rgba(14,27,21,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(14,27,21,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0" }}>close</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <HatchGlyph size={28} state="idle" className="text-primary shrink-0" />
          <span className="font-headline font-bold text-primary">hackproduct</span>
        </div>
        <h3 style={{ fontFamily: 'var(--wf-display)', fontSize: '1.75rem', fontWeight: 400, lineHeight: 1.1, color: '#0E1B15', marginBottom: '0.5rem' }}>
          {trigger === 'FLOW' ? 'Join the waitlist' : <>Practice <em style={{ color: '#4A7C59' }}>{trigger}</em> first</>}
        </h3>
        <p style={{ fontFamily: 'var(--wf-body)', fontSize: '0.88rem', color: 'rgba(14,27,21,0.6)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          Get early access to HackProduct — the practice gym for product thinking. Free to join, no credit card.
        </p>

        <WaitlistForm />

        <p style={{ fontFamily: 'var(--wf-mono)', fontSize: '0.58rem', letterSpacing: '0.08em', color: 'rgba(14,27,21,0.3)', marginTop: '1rem', textAlign: 'center' }}>
          FREE · NO CREDIT CARD · EARLY ACCESS
        </p>
      </div>
    </div>
  )
}


// ── SVG Illustrations (geometry only — no text) ───────────────

// Frame: Before — 3 scattered solution boxes (chaos)
function FrameBeforeSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="4" y="6" width="32" height="18" rx="4" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.2"/>
      <rect x="6" y="10" width="18" height="2.5" rx="1" fill="#4A7C59" opacity=".4"/>
      <rect x="6" y="15" width="12" height="2.5" rx="1" fill="#4A7C59" opacity=".25"/>
      <rect x="30" y="22" width="32" height="18" rx="4" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.2"/>
      <rect x="32" y="26" width="16" height="2.5" rx="1" fill="#4A7C59" opacity=".4"/>
      <rect x="32" y="31" width="10" height="2.5" rx="1" fill="#4A7C59" opacity=".25"/>
      <rect x="14" y="42" width="32" height="18" rx="4" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.2"/>
      <rect x="16" y="46" width="14" height="2.5" rx="1" fill="#4A7C59" opacity=".4"/>
      <rect x="16" y="51" width="20" height="2.5" rx="1" fill="#4A7C59" opacity=".25"/>
    </svg>
  )
}

// Frame: Move — magnifying glass / question mark (asking why)
function FrameMoveSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <circle cx="34" cy="30" r="18" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.8"/>
      <line x1="47" y1="43" x2="58" y2="55" stroke="#4A7C59" strokeWidth="2.5" strokeLinecap="round"/>
      {/* question mark */}
      <path d="M29 24 Q29 20 34 20 Q39 20 39 25 Q39 29 34 31" stroke="#4A7C59" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="34" cy="36" r="1.5" fill="#4A7C59"/>
    </svg>
  )
}

// Frame: After — single focused card (clarity)
function FrameAfterSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="10" y="10" width="60" height="48" rx="8" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.2"/>
      {/* target / bullseye */}
      <circle cx="40" cy="28" r="10" stroke="#4A7C59" strokeWidth="1.2" fill="none"/>
      <circle cx="40" cy="28" r="5" stroke="#4A7C59" strokeWidth="1.2" fill="none"/>
      <circle cx="40" cy="28" r="2" fill="#4A7C59"/>
      {/* label lines */}
      <rect x="18" y="44" width="28" height="2.5" rx="1" fill="#4A7C59" opacity=".35"/>
      <rect x="18" y="49" width="18" height="2.5" rx="1" fill="#4A7C59" opacity=".2"/>
    </svg>
  )
}

// List: Before — single node dangling (tunnel vision)
function ListBeforeSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="20" y="4" width="40" height="14" rx="4" fill="#F5E6C8" stroke="#705C30" strokeWidth="1.2"/>
      <rect x="26" y="8" width="20" height="2.5" rx="1" fill="#705C30" opacity=".4"/>
      <rect x="26" y="13" width="12" height="2" rx="1" fill="#705C30" opacity=".25"/>
      <line x1="40" y1="18" x2="40" y2="50" stroke="#705C30" strokeWidth="1.5" strokeDasharray="4 3"/>
      <circle cx="40" cy="56" r="8" fill="#F5E6C8" stroke="#705C30" strokeWidth="1.5"/>
      {/* single dot = one solution */}
      <circle cx="40" cy="56" r="2.5" fill="#705C30"/>
    </svg>
  )
}

// List: Move — tree branching out (opportunity tree)
function ListMoveSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="26" y="2" width="28" height="12" rx="3" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <line x1="40" y1="14" x2="12" y2="32" stroke="#705C30" strokeWidth="1.2"/>
      <line x1="40" y1="14" x2="40" y2="32" stroke="#705C30" strokeWidth="1.2"/>
      <line x1="40" y1="14" x2="68" y2="32" stroke="#705C30" strokeWidth="1.2"/>
      <rect x="2" y="32" width="20" height="10" rx="3" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <rect x="30" y="32" width="20" height="10" rx="3" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <rect x="58" y="32" width="20" height="10" rx="3" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <line x1="12" y1="42" x2="12" y2="54" stroke="#705C30" strokeWidth="1"/>
      <rect x="2" y="54" width="20" height="10" rx="3" fill="#705C30" opacity=".25"/>
    </svg>
  )
}

// List: After — 4 tidy rows (structured options)
function ListAfterSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x="6" y={4 + i*16} width="68" height="12" rx="3" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
          <rect x="12" y={8.5 + i*16} width={20 + i*4} height="3" rx="1" fill="#705C30" opacity=".45"/>
        </g>
      ))}
    </svg>
  )
}

// Opt: Before — 3 equal columns with a shrug (no decision)
function OptBeforeSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="6" y="30" width="18" height="28" rx="3" fill="#FDE8D8" stroke="#C05020" strokeWidth="1"/>
      <rect x="30" y="30" width="18" height="28" rx="3" fill="#FDE8D8" stroke="#C05020" strokeWidth="1"/>
      <rect x="54" y="30" width="18" height="28" rx="3" fill="#FDE8D8" stroke="#C05020" strokeWidth="1"/>
      {/* question marks above */}
      <circle cx="15" cy="18" r="6" fill="none" stroke="#C05020" strokeWidth="1.2" opacity=".4"/>
      <circle cx="39" cy="18" r="6" fill="none" stroke="#C05020" strokeWidth="1.2" opacity=".4"/>
      <circle cx="63" cy="18" r="6" fill="none" stroke="#C05020" strokeWidth="1.2" opacity=".4"/>
      <path d="M13 16 Q13 14 15 14 Q17 14 17 16 Q17 18 15 18.5" stroke="#C05020" strokeWidth="1" strokeLinecap="round" fill="none" opacity=".5"/>
      <path d="M37 16 Q37 14 39 14 Q41 14 41 16 Q41 18 39 18.5" stroke="#C05020" strokeWidth="1" strokeLinecap="round" fill="none" opacity=".5"/>
      <path d="M61 16 Q61 14 63 14 Q65 14 65 16 Q65 18 63 18.5" stroke="#C05020" strokeWidth="1" strokeLinecap="round" fill="none" opacity=".5"/>
    </svg>
  )
}

// Opt: Move — horizontal bar chart / scoring rows
function OptMoveSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      {[
        { y: 6,  w: 44, label: 24 },
        { y: 22, w: 32, label: 16 },
        { y: 38, w: 38, label: 20 },
        { y: 54, w: 16, label: 8  },
      ].map((row, i) => (
        <g key={i}>
          <rect x="6" y={row.y} width="68" height="12" rx="3" fill="#FDE8D8"/>
          <rect x="6" y={row.y} width={row.w} height="12" rx="3" fill="#F5B89A"/>
          <rect x="6" y={row.y + 4} width={row.label} height="4" rx="1" fill="rgba(139,69,19,.25)"/>
        </g>
      ))}
    </svg>
  )
}

// Opt: After — 3 bars with one clearly tallest (winner)
function OptAfterSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="8" y="48" width="18" height="14" rx="3" fill="#FDE8D8" stroke="#C05020" strokeWidth="1"/>
      <rect x="32" y="10" width="18" height="52" rx="3" fill="#8B4513"/>
      <rect x="56" y="34" width="18" height="28" rx="3" fill="#FDE8D8" stroke="#C05020" strokeWidth="1"/>
      {/* star on winner */}
      <path d="M41 4 L42.2 7.6 L46 7.6 L43 9.8 L44.2 13.4 L41 11.2 L37.8 13.4 L39 9.8 L36 7.6 L39.8 7.6 Z" fill="#705C30"/>
    </svg>
  )
}

// Win: Before — person with spreadsheet, no connection (silence)
function WinBeforeSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      {/* person */}
      <circle cx="18" cy="20" r="8" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.2"/>
      <path d="M10 36 Q10 30 18 30 Q26 30 26 36 L26 44" stroke="#4A7C59" strokeWidth="1.2" fill="none"/>
      {/* spreadsheet */}
      <rect x="36" y="12" width="34" height="36" rx="4" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1"/>
      <line x1="36" y1="22" x2="70" y2="22" stroke="#4A7C59" strokeWidth=".8" opacity=".4"/>
      <line x1="36" y1="30" x2="70" y2="30" stroke="#4A7C59" strokeWidth=".8" opacity=".4"/>
      <line x1="36" y1="38" x2="70" y2="38" stroke="#4A7C59" strokeWidth=".8" opacity=".4"/>
      <line x1="52" y1="12" x2="52" y2="48" stroke="#4A7C59" strokeWidth=".8" opacity=".4"/>
      {/* dashed gap = no connection */}
      <line x1="27" y1="30" x2="35" y2="30" stroke="#4A7C59" strokeWidth="1.2" strokeDasharray="2 2"/>
      {/* x mark */}
      <line x1="60" y1="54" x2="68" y2="62" stroke="#C05020" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="68" y1="54" x2="60" y2="62" stroke="#C05020" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// Win: Move — framing boxes with arrow (positioning)
function WinMoveSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="4" y="6" width="72" height="14" rx="4" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1"/>
      <rect x="8" y="10" width="32" height="3" rx="1" fill="#4A7C59" opacity=".4"/>
      <rect x="8" y="15" width="20" height="2" rx="1" fill="#4A7C59" opacity=".25"/>
      <rect x="4" y="26" width="72" height="14" rx="4" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1"/>
      <rect x="8" y="30" width="24" height="3" rx="1" fill="#4A7C59" opacity=".4"/>
      <rect x="8" y="35" width="16" height="2" rx="1" fill="#4A7C59" opacity=".25"/>
      <rect x="4" y="46" width="72" height="16" rx="4" fill="#4A7C59"/>
      <rect x="8" y="50" width="36" height="3" rx="1" fill="#FAF6F0" opacity=".7"/>
      <rect x="8" y="55" width="24" height="2.5" rx="1" fill="#FAF6F0" opacity=".4"/>
      <path d="M56 54 L62 54 L59 50 M62 54 L59 58" stroke="#FAF6F0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".7"/>
    </svg>
  )
}

// Win: After — checkmark in circle + thumbs up (shipped)
function WinAfterSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <circle cx="40" cy="32" r="22" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.5"/>
      <polyline points="28,33 36,42 54,22" stroke="#4A7C59" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="58" cy="52" r="7" fill="#4A7C59"/>
      <path d="M55 52 Q55 48 58 48 L60 48 L60 55 L55 55 Z" fill="#FAF6F0"/>
      <rect x="60" y="50" width="4" height="5" rx="1" fill="#FAF6F0"/>
    </svg>
  )
}

// ── Step data ──────────────────────────────────────────────────
const STEPS = [
  {
    key: 'frame' as FlowMove,
    letter: 'F',
    name: 'Frame',
    sub: 'Find the real job behind the request',
    stepNum: 'Step 1 of 4',
    body: 'Stop solving the stated problem. Every feature request is a disguised symptom. Framing means surfacing the underlying job-to-be-done — the outcome the user actually wants — before evaluating any solutions.',
    badgeClass: 'badge-f',
    accentHex: '#4A7C59',
    panels: [
      { tag: 'Before', copy: 'Three solutions in three seconds. None answer the actual question — because nobody asked the actual question yet.' },
      { tag: 'The move', copy: "Ask: what job is this person trying to do? The spinner hides latency. It doesn't fix anxiety about whether the action even worked.", accent: true },
      { tag: 'After', copy: '"Slow load times" becomes a trust problem. Now you\'re solving something real — and the solution set gets far more interesting.' },
    ],
    svgs: [<FrameBeforeSVG key="fb"/>, <FrameMoveSVG key="fm"/>, <FrameAfterSVG key="fa"/>],
    expert: { initials: 'MC', name: 'Marty Cagan · SVPG', role: 'Author, Inspired', quote: '"The most common mistake is confusing the solution with the outcome. Features are hypotheses. The job is to discover which problem is actually worth solving."', avatarStyle: 'avatar-f' },
    scenario: { label: 'Applied — B2B SaaS notifications', text: "PM says: add real-time push notifications. Framed correctly, the job isn't to notify — it's to keep teams in sync without breaking focus. That's a completely different problem to solve." },
    hatchMsg: "Before jumping to solutions, great product thinkers ask one question: what job is this person actually trying to do? The answer is almost never what was stated.",
  },
  {
    key: 'list' as FlowMove,
    letter: 'L',
    name: 'List',
    sub: 'Open the solution space before evaluating anything',
    stepNum: 'Step 2 of 4',
    body: "Don't commit to a solution yet. Generate every plausible approach to the framed problem — at least five distinct options that vary in effort, reach, and mechanism. The goal is breadth before depth.",
    badgeClass: 'badge-l',
    accentHex: '#705C30',
    panels: [
      { tag: 'Before', copy: 'One problem, one solution, shipped by Thursday. This is feature thinking at its most efficient — and most dangerous.' },
      { tag: 'The move', copy: "Teresa Torres' Opportunity Solution Tree: branch every possibility before scoring any of them. Generate five. Then generate two more.", accent: true },
      { tag: 'After', copy: 'Four distinct options. Each solves the same underlying problem differently. Now you can have an intelligent conversation about tradeoffs.' },
    ],
    svgs: [<ListBeforeSVG key="lb"/>, <ListMoveSVG key="lm"/>, <ListAfterSVG key="la"/>],
    expert: { initials: 'TT', name: 'Teresa Torres · Product Talk', role: 'Author, Continuous Discovery Habits', quote: '"Jumping to solutions is the product team\'s version of premature optimization. The Opportunity Solution Tree forces you to separate problem discovery from solution generation."', avatarStyle: 'avatar-l' },
    scenario: { label: 'Applied — B2B SaaS notifications', text: "Listed: push notifs, Slack/Teams integration, daily digest, in-app feed, @mention threads, smart batching. The Slack integration — which nobody asked for — turns out to be the highest-leverage option by far." },
    hatchMsg: "The first solution you think of is almost never the best one. Generate until you surprise yourself — that's when you know you've actually opened the space.",
  },
  {
    key: 'optimize' as FlowMove,
    letter: 'O',
    name: 'Weigh',
    sub: 'Pick the highest-leverage bet with explicit evidence',
    stepNum: 'Step 3 of 4',
    body: "Not all solutions are equal. Apply a scoring lens — RICE, ICE, LNO — before you fall in love with any single approach. The goal is to replace preference with evidence and make the tradeoff visible.",
    badgeClass: 'badge-o',
    accentHex: '#8B4513',
    panels: [
      { tag: 'Before', copy: 'All three look reasonable. The loudest voice wins. This is how roadmaps become wish lists.' },
      { tag: 'The move', copy: 'RICE scoring: score every option on Reach, Impact, Confidence, Effort. Force the conversation from opinion to evidence.', accent: true },
      { tag: 'After', copy: 'Slack integration wins at RICE 118. Push notifs score 42. The number makes the decision obvious — and gives you something to defend.' },
    ],
    svgs: [<OptBeforeSVG key="ob"/>, <OptMoveSVG key="om"/>, <OptAfterSVG key="oa"/>],
    expert: { initials: 'SD', name: 'Shreyas Doshi · ex-Stripe, Twitter', role: 'Creator, LNO Framework', quote: '"Product leverage is about finding the work that is 10x more impactful than everything else. Most teams optimize locally — they do a good job on the wrong things."', avatarStyle: 'avatar-o' },
    scenario: { label: 'Applied — B2B SaaS notifications', text: "RICE scores: Push notifs = 42. Daily digest = 31. Slack bot = 118. The number makes the decision obvious — and gives you something concrete to bring into the planning meeting instead of a preference." },
    hatchMsg: "A number beats an opinion every time. Even a rough RICE score converts a preference argument into a tradeoff conversation — and that's a much better meeting.",
  },
  {
    key: 'win' as FlowMove,
    letter: 'W',
    name: 'Win',
    sub: "Position your recommendation — don't just present it",
    stepNum: 'Step 4 of 4',
    body: "Great analysis that can't be communicated doesn't ship. Positioning means framing your recommendation for the decision-maker's context — not your own. They need a story, not a spreadsheet.",
    badgeClass: 'badge-w',
    accentHex: '#2D5A3E',
    panels: [
      { tag: 'Before', copy: "You've got the data, you share the RICE scores, and get \"interesting, let's think about it.\" Which means no." },
      { tag: 'The move', copy: "April Dunford's positioning: who is it for, what's the alternative they live with now, and what's your unique advantage?", accent: true },
      { tag: 'After', copy: '"For Slack-native teams, this replaces the copy-paste habit — the thing they currently hate." They get it immediately.' },
    ],
    svgs: [<WinBeforeSVG key="wb"/>, <WinMoveSVG key="wm"/>, <WinAfterSVG key="wa"/>],
    expert: { initials: 'AD', name: 'April Dunford · Obviously Awesome', role: 'Author, positioning strategist', quote: '"Positioning isn\'t about what you build — it\'s the context you create so your audience instantly understands why yours is the right answer. Engineers forget that the decision-maker needs a story, not a spreadsheet."', avatarStyle: 'avatar-w' },
    scenario: { label: 'Applied — B2B SaaS notifications', text: 'Instead of "we should build a Slack bot (RICE: 118)," you say: "For our enterprise users who run operations in Slack, this replaces their current workflow of switching back to our app — and we can validate it in one sprint." Approved in the meeting.' },
    hatchMsg: "Engineers think the win is building the right thing. Product thinkers know the win is getting the right thing built. Those are different skills — and this step is where you develop the second one.",
  },
]

// ── Worked example ─────────────────────────────────────────────
const WORKED = [
  {
    letter: 'F',
    title: "Frame — What's the real job?",
    body: "The question isn't \"which feature?\" — it's why daily active listening dropped among 18-24s. Discovery data shows choice paralysis: too many options, no clear starting point. The real job is reducing friction-to-first-listen, not adding more surfaces.",
    chips: ['JTBD reframe', 'Not "which feature"', 'Discovery data'],
  },
  {
    letter: 'L',
    title: 'List — Open the space',
    body: "Solutions generated: AI DJ, social feed, contextual playlists (morning/gym/focus), \"continue from friends\" widget, mood-based radio, one-tap start from home screen. That's six options — not two. The original framing collapsed the solution space prematurely.",
    chips: ['6 options', 'Opportunity tree', 'Expanded framing'],
  },
  {
    letter: 'O',
    title: 'Weigh — Score with evidence',
    body: 'RICE: AI DJ scores 94 — high reach, proven listen-through rate in beta, medium effort. Social feed scores 41 — low confidence, failed twice before. Contextual playlists score 67. AI DJ wins clearly, with data behind it.',
    chips: ['RICE scoring', 'Beta data', 'AI DJ wins at 94'],
  },
  {
    letter: 'W',
    title: 'Win — Position to get buy-in',
    body: 'Not: "We should build AI DJ (RICE: 94) instead of the social feed." Instead: "For our Gen Z listeners who stall on the home screen, the AI DJ replaces the decision they currently dread. Beta cohort shows 23% lift in listen-through. We can prove Q3 impact in a 4-week sprint." One read, clear yes.',
    chips: ['Outcome-first', 'Named alternative', 'Validation plan'],
  },
]

// ── Main page ──────────────────────────────────────────────────
export default function WaitlistFlowPage() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const [openWorked, setOpenWorked] = useState<number | null>(null)
  const [waitlistModal, setWaitlistModal] = useState<string | null>(null)

  useEffect(() => {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleSections(prev => new Set([...prev, entry.target.id]))
        }
      })
    }, { threshold: 0.15 })

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('wf-revealed')
        }
      })
    }, { threshold: 0.1 })

    document.querySelectorAll('[data-wf-reveal]').forEach(el => revealObserver.observe(el))
    document.querySelectorAll('[data-wf-section]').forEach(el => sectionObserver.observe(el))

    return () => { sectionObserver.disconnect(); revealObserver.disconnect() }
  }, [])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const fontVars = [instrumentSerif.variable, dmSans.variable, geistMono.variable].join(' ')

  return (
    <div className={fontVars} style={{ fontFamily: 'var(--wf-body)', background: '#FAF6F0', color: '#0E1B15', minHeight: '100vh' }}>

      {/* ── Styles ──────────────────────────────────────────────── */}
      <style>{`
        .wf-body { font-family: var(--wf-body, 'DM Sans', sans-serif); }
        .wf-display { font-family: var(--wf-display, 'Instrument Serif', serif); }
        .wf-mono { font-family: var(--wf-mono, 'Geist Mono', monospace); }

        [data-wf-reveal] {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        [data-wf-reveal].wf-revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .hatch-float { animation: wfFloat 3s ease-in-out infinite; }
        @keyframes wfFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

        .wf-nav-step {
          font-family: var(--wf-mono); font-size: 0.65rem; letter-spacing: 0.1em;
          color: rgba(14,27,21,.35); padding: 0.3rem 0.7rem; border-radius: 60px;
          cursor: pointer; transition: background 0.2s, color 0.2s; text-decoration: none;
          white-space: nowrap;
        }
        .wf-nav-step:hover { background: #4A7C59; color: #FAF6F0; }

        .wf-flow-pill {
          background: #FAF6F0; border: 1.5px solid rgba(14,27,21,.12); border-radius: 14px;
          padding: 1.25rem 1rem; text-align: center; cursor: pointer;
          transition: border-color 0.2s, transform 0.15s;
        }
        .wf-flow-pill:hover { border-color: #4A7C59; transform: translateY(-2px); }

        .wf-sb-panel {
          border: 1.5px solid rgba(14,27,21,.12); border-radius: 14px;
          padding: 1rem; background: #FAF6F0;
        }
        .wf-worked-card {
          border: 1.5px solid rgba(250,246,240,.2); border-radius: 14px; padding: 1.25rem;
          cursor: pointer; transition: background 0.2s, border-color 0.2s;
          background: rgba(250,246,240,.05); text-align: left;
        }
        .wf-worked-card:hover { background: rgba(250,246,240,.09); border-color: rgba(250,246,240,.5); }
        .wf-worked-card.wf-open { background: rgba(250,246,240,.1); border-color: rgba(250,246,240,.35); }

        .badge-f { background: #E8F1EC; color: #4A7C59; }
        .badge-l { background: #F5E6C8; color: #705C30; }
        .badge-o { background: #FDE8D8; color: #8B4513; }
        .badge-w { background: #E8F1EC; color: #2D5A3E; }

        .avatar-f { background: #9FE1CB; color: #2D5A3E; }
        .avatar-l { background: #F5D78E; color: #705C30; }
        .avatar-o { background: #F5B89A; color: #7A3010; }
        .avatar-w { background: #9FE1CB; color: #2D5A3E; }

        .wf-btn-primary {
          font-family: var(--wf-body); font-size: 0.88rem; font-weight: 600;
          padding: 0.6rem 1.5rem; border-radius: 60px; border: none; cursor: pointer;
          background: #4A7C59; color: #FAF6F0;
          box-shadow: 0 4px 0 #3D6B4F;
          transition: transform 0.12s, box-shadow 0.12s;
          display: inline-flex; align-items: center; gap: 0.4rem;
          text-decoration: none;
        }
        .wf-btn-primary:active { transform: translateY(4px); box-shadow: none; }
        .wf-btn-primary:hover { opacity: 0.92; }

        .wf-btn-ghost {
          font-family: var(--wf-body); font-size: 0.88rem; font-weight: 500;
          padding: 0.55rem 1.4rem; border-radius: 60px;
          border: 1.5px solid rgba(14,27,21,.18); cursor: pointer;
          background: transparent; color: rgba(14,27,21,.6);
          transition: border-color 0.2s; text-decoration: none;
          display: inline-flex; align-items: center; gap: 0.4rem;
        }
        .wf-btn-ghost:hover { border-color: rgba(14,27,21,.4); }

        @media (max-width: 700px) {
          .wf-hide-mobile { display: none !important; }
          .wf-step-inner { grid-template-columns: 1fr !important; }
          .wf-storyboard { grid-template-columns: 1fr !important; }
          .wf-flow-overview { grid-template-columns: repeat(2, 1fr) !important; }
          .wf-worked-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Waitlist modal ───────────────────────────────────────── */}
      {waitlistModal && <WaitlistModal trigger={waitlistModal} onClose={() => setWaitlistModal(null)} />}

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#FAF6F0', borderBottom: '1px solid rgba(14,27,21,.12)',
        padding: '0 2rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '56px',
      }}>
        <a href="/waitlist-flow" className="font-headline font-bold text-lg text-primary" style={{ textDecoration: 'none' }}>
          hackproduct
        </a>
        <ul className="wf-hide-mobile" style={{ display: 'flex', gap: '0.25rem', listStyle: 'none', margin: 0, padding: 0 }}>
          {[{href:'#frame',label:'F — Frame'},{href:'#list',label:'L — List'},{href:'#optimize',label:'O — Weigh'},{href:'#win',label:'W — Win'}].map(n => (
            <li key={n.href}>
              <a className="wf-nav-step" href={n.href}>{n.label}</a>
            </li>
          ))}
        </ul>
        <button className="wf-btn-primary" onClick={() => setWaitlistModal('FLOW')}>
          Join Waitlist
          <span className="material-symbols-outlined" style={{ fontSize: '1rem', fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
        </button>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{ background: '#2D5A3E', color: '#FAF6F0', padding: '5rem 2rem 4rem', position: 'relative', overflow: 'hidden' }}>
        {/* bg shapes */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
          <svg width="100%" height="100%" viewBox="0 0 1200 480" preserveAspectRatio="xMidYMid slice">
            <circle cx="1100" cy="80" r="180" fill="rgba(250,246,240,.04)"/>
            <circle cx="80" cy="400" r="120" fill="rgba(250,246,240,.04)"/>
            <rect x="900" y="280" width="200" height="200" rx="40" fill="rgba(250,246,240,.04)"/>
            <rect x="200" y="20" width="100" height="100" rx="20" fill="rgba(250,246,240,.04)"/>
          </svg>
        </div>

        <div style={{ maxWidth: '780px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="wf-mono" style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(250,246,240,.5)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            HackProduct · The Framework
            <span style={{ flex: 1, maxWidth: '60px', height: '1px', background: 'rgba(250,246,240,.2)' }} />
          </div>
          <h1 className="wf-display" style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)', fontWeight: 400, lineHeight: 0.95, letterSpacing: '-3px', marginBottom: '1.5rem', color: '#FAF6F0' }}>
            FLOW —<br /><em style={{ color: 'rgba(250,246,240,.55)' }}>how product<br />thinkers think</em>
          </h1>
          <p className="wf-body" style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'rgba(250,246,240,.7)', maxWidth: '540px', marginBottom: '2.25rem' }}>
            Most engineers solve the stated problem brilliantly. Product thinking is about finding the right problem before writing a single line of code. FLOW is the four-move playbook that gets you there.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="wf-btn-primary" style={{ background: '#4A7C59', boxShadow: '0 4px 0 #3D6B4F' }} onClick={() => setWaitlistModal('FLOW')}>
              Get early access
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
            </button>
            <button className="wf-btn-ghost" style={{ borderColor: 'rgba(250,246,240,.25)', color: 'rgba(250,246,240,.7)' }} onClick={() => scrollTo('frame')}>
              Read the framework
            </button>
          </div>
        </div>
      </section>

      {/* ── Pain section ─────────────────────────────────────────── */}
      <section style={{ background: '#F2EDE4', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div className="wf-mono" style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(14,27,21,.35)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: '24px', height: '1px', background: 'rgba(14,27,21,.35)' }} />
            The situation every engineer recognizes
          </div>

          <div data-wf-reveal style={{
            background: '#FAF6F0', border: '1.5px solid rgba(14,27,21,.12)',
            borderRadius: '14px', padding: '1.75rem 2rem',
            boxShadow: '0 1px 3px rgba(14,27,21,.08), 0 4px 16px rgba(14,27,21,.06)',
            marginBottom: '1.5rem',
          }}>
            <p className="wf-body" style={{ fontSize: '1.05rem', lineHeight: 1.75 }}>
              Your PM walks over and says: <em style={{ color: 'rgba(14,27,21,.6)' }}>&ldquo;Users are complaining about slow load times. Can we add a loading spinner?&rdquo;</em>
            </p>
            <p className="wf-body" style={{ fontSize: '1.05rem', lineHeight: 1.75, marginTop: '0.75rem' }}>
              The old you says: <em style={{ color: 'rgba(14,27,21,.6)' }}>&ldquo;Sure, I&apos;ll have it by tomorrow.&rdquo;</em>
            </p>
            <p className="wf-body" style={{ fontSize: '1.05rem', lineHeight: 1.75, marginTop: '0.75rem' }}>
              The product-thinking you pauses. <strong style={{ fontWeight: 600, color: '#3D6B4F' }}>Because you know the spinner isn&apos;t the problem — it&apos;s a symptom.</strong> And shipping a symptom fix is how engineers spend careers building the wrong things brilliantly.
            </p>
          </div>

          <p className="wf-body" style={{ fontSize: '0.95rem', color: 'rgba(14,27,21,.6)', lineHeight: 1.7, marginBottom: '2rem' }}>
            FLOW gives you four moves that separate the engineers who get promoted from the ones who stay heads-down forever. It&apos;s not a template — it&apos;s a way of thinking.
          </p>

          {/* Flow pills */}
          <div className="wf-flow-overview" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                className="wf-flow-pill"
                data-wf-reveal
                style={{ transitionDelay: `${i * 80}ms` }}
                onClick={() => scrollTo(s.key)}
              >
                <div className="wf-display" style={{ fontSize: '2.5rem', color: '#4A7C59', lineHeight: 1, marginBottom: '0.3rem' }}>{s.letter}</div>
                <span className="wf-body" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0E1B15', display: 'block' }}>{s.name}</span>
                <span className="wf-mono" style={{ fontSize: '0.6rem', color: 'rgba(14,27,21,.35)', letterSpacing: '0.05em' }}>{s.sub.split(' ').slice(0, 3).join(' ')}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Step sections ─────────────────────────────────────────── */}
      {STEPS.map((step, index) => {
        const isEven = index % 2 === 0
        const isVisible = visibleSections.has(step.key)

        return (
          <section
            key={step.key}
            id={step.key}
            data-wf-section
            style={{ padding: '5rem 2rem', background: isEven ? '#FAF6F0' : '#F2EDE4' }}
          >
            <div className="wf-step-inner" style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '3rem', alignItems: 'start' }}>

              {/* Left: content */}
              <div>
                <div className="wf-mono" style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(14,27,21,.35)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: '24px', height: '1px', background: 'rgba(14,27,21,.35)' }} />
                  {step.stepNum}
                </div>

                {/* Step header */}
                <div data-wf-reveal style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className={`wf-display ${step.badgeClass}`} style={{ width: '54px', height: '54px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
                    {step.letter}
                  </div>
                  <div>
                    <h2 className="wf-display" style={{ fontSize: '1.9rem', fontWeight: 400, lineHeight: 1.1, color: '#0E1B15', marginBottom: '0.2rem' }}>{step.name}</h2>
                    <span className="wf-mono" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(14,27,21,.35)' }}>{step.sub}</span>
                  </div>
                </div>

                <p data-wf-reveal className="wf-body" style={{ fontSize: '1rem', lineHeight: 1.75, color: 'rgba(14,27,21,.6)', marginBottom: '1.25rem' }}>
                  {step.body}
                </p>

                {/* 3-panel storyboard */}
                <div className="wf-storyboard" data-wf-reveal style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
                  {step.panels.map((panel, pi) => (
                    <div
                      key={pi}
                      className="wf-sb-panel"
                      style={panel.accent ? { borderColor: step.accentHex } : {}}
                    >
                      <div className="wf-mono" style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: panel.accent ? step.accentHex : 'rgba(14,27,21,.35)', marginBottom: '0.6rem', fontWeight: panel.accent ? 600 : 400 }}>
                        {panel.tag}
                      </div>
                      <div style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.5rem 0' }}>
                        {step.svgs[pi]}
                      </div>
                      <p className="wf-body" style={{ fontSize: '0.78rem', lineHeight: 1.55, color: 'rgba(14,27,21,.6)' }}>{panel.copy}</p>
                    </div>
                  ))}
                </div>

                {/* Expert quote */}
                <div data-wf-reveal style={{
                  borderRadius: '14px', padding: '1.1rem 1.25rem', marginBottom: '1rem',
                  display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
                  background: step.badgeClass === 'badge-f' ? '#E8F1EC' : step.badgeClass === 'badge-l' ? '#F5E6C8' : step.badgeClass === 'badge-o' ? '#FDE8D8' : '#E8F1EC',
                }}>
                  <div className={`wf-body ${step.expert.avatarStyle}`} style={{ width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0 }}>
                    {step.expert.initials}
                  </div>
                  <div>
                    <div className="wf-body" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0E1B15' }}>{step.expert.name}</div>
                    <div className="wf-body" style={{ fontSize: '0.72rem', color: 'rgba(14,27,21,.35)', margin: '0.1rem 0 0.4rem' }}>{step.expert.role}</div>
                    <div className="wf-display" style={{ fontStyle: 'italic', fontSize: '0.9rem', lineHeight: 1.55, color: '#0E1B15' }}>{step.expert.quote}</div>
                  </div>
                </div>

                {/* Scenario */}
                <div data-wf-reveal style={{ borderLeft: `3px solid ${step.accentHex}`, paddingLeft: '1.1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', marginBottom: '1.25rem', background: '#FAF6F0' }}>
                  <div className="wf-mono" style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(14,27,21,.35)', marginBottom: '0.35rem' }}>{step.scenario.label}</div>
                  <div className="wf-body" style={{ fontSize: '0.88rem', lineHeight: 1.65, color: '#0E1B15' }}>{step.scenario.text}</div>
                </div>

                {/* Waitlist CTA */}
                <div data-wf-reveal>
                  <button
                    className="wf-btn-primary"
                    style={{ background: step.accentHex, boxShadow: `0 4px 0 rgba(14,27,21,.2)` }}
                    onClick={() => setWaitlistModal(step.name)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem', fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    Practice {step.name} on a real challenge →
                  </button>
                </div>
              </div>

              {/* Right: Hatch rail */}
              <div
                className="wf-hide-mobile"
                style={{
                  position: 'sticky', top: '72px', alignSelf: 'start',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                }}
              >
                <div style={{ background: '#0E1B15', color: '#FAF6F0', borderRadius: '14px 14px 14px 4px', padding: '0.875rem 1rem', marginBottom: '0.75rem' }}>
                  <div className="wf-mono" style={{ fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(250,246,240,.4)', marginBottom: '0.4rem' }}>Hatch</div>
                  <p className="wf-body" style={{ fontSize: '0.82rem', lineHeight: 1.55 }}>{step.hatchMsg}</p>
                </div>
                <div className="hatch-float" style={{ display: 'flex', justifyContent: 'center' }}>
                  <HatchGlyph size={64} state="speaking" className="text-primary" />
                </div>
              </div>

            </div>
          </section>
        )
      })}

      {/* ── Worked example ────────────────────────────────────────── */}
      <section style={{ background: '#2D5A3E', padding: '5rem 2rem', color: '#FAF6F0' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div className="wf-mono" style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(250,246,240,.5)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: '24px', height: '1px', background: 'rgba(250,246,240,.3)' }} />
            Full FLOW — worked example
          </div>
          <h2 className="wf-display" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '0.75rem' }}>
            Spotify&apos;s AI DJ<br /><em style={{ color: 'rgba(250,246,240,.55)' }}>decision</em>
          </h2>
          <p className="wf-body" style={{ color: 'rgba(250,246,240,.7)', fontSize: '1rem', lineHeight: 1.65, maxWidth: '540px', marginBottom: '2.5rem' }}>
            Spotify&apos;s growth team is asked: &ldquo;Should we build the AI DJ or rebuild the social listening feed?&rdquo; Here&apos;s FLOW applied end-to-end.
          </p>

          <div className="wf-worked-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            {WORKED.map((item, i) => (
              <button
                key={i}
                className={`wf-worked-card ${openWorked === i ? 'wf-open' : ''}`}
                onClick={() => setOpenWorked(openWorked === i ? null : i)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <span className="wf-display" style={{ fontSize: '1.5rem', color: '#FAF6F0', lineHeight: 1 }}>{item.letter}</span>
                  <span className="wf-body" style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FAF6F0', flex: 1, textAlign: 'left' }}>{item.title}</span>
                  <div style={{
                    width: '22px', height: '22px', border: '1.5px solid rgba(250,246,240,.2)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'transform 0.25s, border-color 0.2s',
                    transform: openWorked === i ? 'rotate(45deg)' : 'rotate(0deg)',
                    borderColor: openWorked === i ? 'rgba(250,246,240,.5)' : 'rgba(250,246,240,.2)',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.75rem', color: '#FAF6F0', fontVariationSettings: "'FILL' 0" }}>add</span>
                  </div>
                </div>
                {openWorked === i && (
                  <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid rgba(250,246,240,.2)' }}>
                    <p className="wf-body" style={{ fontSize: '0.85rem', lineHeight: 1.65, color: 'rgba(250,246,240,.7)', marginBottom: '0.75rem' }}>{item.body}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {item.chips.map(chip => (
                        <span key={chip} className="wf-mono" style={{ fontSize: '0.6rem', letterSpacing: '0.08em', background: 'rgba(250,246,240,.12)', color: 'rgba(250,246,240,.7)', padding: '0.25rem 0.6rem', borderRadius: '60px', display: 'inline-block' }}>
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="wf-mono" style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(14,27,21,.35)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <span style={{ width: '24px', height: '1px', background: 'rgba(14,27,21,.35)' }} />
            Ready to practice
            <span style={{ width: '24px', height: '1px', background: 'rgba(14,27,21,.35)' }} />
          </div>
          <h2 className="wf-display" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 400, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '0.75rem', color: '#0E1B15' }}>
            Put FLOW to work<br />on a real challenge
          </h2>
          <p className="wf-body" style={{ fontSize: '1rem', color: 'rgba(14,27,21,.6)', lineHeight: 1.65, marginBottom: '2rem' }}>
            Every HackProduct challenge runs you through all four moves — graded on how well you frame, list, weigh, and win. No multiple choice. No templates. Just your thinking, scored.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button className="wf-btn-primary" onClick={() => setWaitlistModal('FLOW')}>
              Join the waitlist
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
            </button>
          </div>
          <p className="wf-mono" style={{ fontSize: '0.62rem', letterSpacing: '0.08em', color: 'rgba(14,27,21,.35)' }}>
            FREE · NO CREDIT CARD · EARLY ACCESS
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(14,27,21,.12)', padding: '2rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <a href="/waitlist-flow" className="font-headline font-bold text-lg text-primary" style={{ textDecoration: 'none' }}>
          hackproduct
        </a>
        <p className="wf-mono" style={{ fontSize: '0.62rem', letterSpacing: '0.06em', color: 'rgba(14,27,21,.35)' }}>© 2025 HackProduct. All rights reserved.</p>
        <button className="wf-btn-ghost" onClick={() => setWaitlistModal('FLOW')} style={{ fontSize: '0.78rem', padding: '0.4rem 1rem' }}>
          Join Waitlist
        </button>
      </footer>

    </div>
  )
}
