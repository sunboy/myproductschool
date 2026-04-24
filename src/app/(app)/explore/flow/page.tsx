'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

// ── Types ──────────────────────────────────────────────────────
type FlowMove = 'frame' | 'list' | 'optimize' | 'win'

interface MoveData {
  key: FlowMove
  symbol: string
  label: string
  tagline: string
  stepLabel: string
  sub: string
  body: string
  accent: string
  accentBg: string
  accentDeep: string
  expert: { initials: string; name: string; role: string; quote: string }
  scenario: { label: string; text: string }
  hatchMessage: string
  panelBefore: string
  panelMove: string
  panelAfter: string
}

const MOVES: MoveData[] = [
  {
    key: 'frame',
    symbol: 'F',
    label: 'Frame',
    tagline: 'Find the real job behind the request',
    stepLabel: 'Step 1 of 4',
    sub: 'Find the real job behind the request',
    accent: '#4a7c59',
    accentBg: '#e8f1ec',
    accentDeep: '#2e5138',
    body: 'Stop solving the stated problem. Every feature request is a disguised symptom. Framing means surfacing the underlying job-to-be-done — the outcome the user actually wants — before evaluating any solutions.',
    expert: {
      initials: 'MC',
      name: 'Marty Cagan',
      role: 'SVPG · author, Inspired',
      quote: 'The most common mistake is confusing the solution with the outcome. Features are hypotheses. The job is to discover which problem is actually worth solving.',
    },
    scenario: {
      label: 'Applied · B2B SaaS notifications',
      text: "PM says: add real-time push notifications. Framed correctly, the job isn't to notify — it's to keep teams in sync without breaking focus. That's a completely different problem to solve.",
    },
    hatchMessage: "Before jumping to solutions, great product thinkers ask one question: what job is this person actually trying to do? The answer is almost never what was stated.",
    panelBefore: 'Three solutions in three seconds. None answer the actual question — because nobody asked the actual question yet.',
    panelMove: 'Ask what job this person is really trying to do. The spinner hides latency. It doesn\'t fix the anxiety of not knowing if the action worked.',
    panelAfter: '"Slow load times" becomes a trust problem. Now you\'re solving something real — and the solution set gets far more interesting.',
  },
  {
    key: 'list',
    symbol: 'L',
    label: 'List',
    tagline: 'Open the solution space before evaluating',
    stepLabel: 'Step 2 of 4',
    sub: 'Open the solution space before evaluating anything',
    accent: '#c9933a',
    accentBg: '#f7ebc9',
    accentDeep: '#7a5a1e',
    body: "Don't commit to a solution yet. Generate every plausible approach to the framed problem — at least five distinct options that vary in effort, reach, and mechanism. The goal is breadth before depth.",
    expert: {
      initials: 'TT',
      name: 'Teresa Torres',
      role: 'Product Talk · Continuous Discovery',
      quote: "Jumping to solutions is the product team's version of premature optimization. The Opportunity Solution Tree forces you to separate problem discovery from solution generation.",
    },
    scenario: {
      label: 'Applied · B2B SaaS notifications',
      text: 'Listed: push notifs, Slack/Teams integration, daily digest, in-app feed, @mention threads, smart batching. The Slack integration — which nobody asked for — turns out to be the highest-leverage option by far.',
    },
    hatchMessage: "The first solution you think of is almost never the best one. Generate until you surprise yourself — that's when you know you've actually opened the space.",
    panelBefore: 'One problem, one solution, shipped by Thursday. This is feature thinking at its most efficient — and most dangerous.',
    panelMove: "Teresa Torres' Opportunity Solution Tree: branch every possibility before scoring any of them. Generate five. Then generate two more.",
    panelAfter: 'Four distinct options. Each solves the same underlying problem differently. Now you can have an intelligent conversation about tradeoffs.',
  },
  {
    key: 'optimize',
    symbol: 'O',
    label: 'Optimize',
    tagline: 'Pick the highest-leverage bet with evidence',
    stepLabel: 'Step 3 of 4',
    sub: 'Pick the highest-leverage bet with explicit evidence',
    accent: '#c2633a',
    accentBg: '#fce0d2',
    accentDeep: '#7a3a18',
    body: "Not all solutions are equal. Apply a scoring lens — RICE, ICE, LNO — before you fall in love with any single approach. The goal is to replace preference with evidence and make the tradeoff visible.",
    expert: {
      initials: 'SD',
      name: 'Shreyas Doshi',
      role: 'ex-Stripe, Twitter · creator of LNO',
      quote: 'Product leverage is about finding the work that is 10x more impactful than everything else. Most teams optimize locally — they do a good job on the wrong things.',
    },
    scenario: {
      label: 'Applied · B2B SaaS notifications',
      text: 'RICE scores: Push notifs = 42. Daily digest = 31. Slack bot = 118. The number makes the decision obvious — and gives you something concrete to bring into the planning meeting instead of a preference.',
    },
    hatchMessage: "A number beats an opinion every time. Even a rough RICE score converts a preference argument into a tradeoff conversation — and that's a much better meeting.",
    panelBefore: 'All three look reasonable. The loudest voice wins. This is how roadmaps become wish lists.',
    panelMove: 'RICE scoring: score every option on Reach, Impact, Confidence, Effort. Force the conversation from opinion to evidence.',
    panelAfter: 'Slack integration wins at RICE 118. Push notifs score 42. The number makes the decision obvious — and gives you something to defend.',
  },
  {
    key: 'win',
    symbol: 'W',
    label: 'Win',
    tagline: "Position your recommendation, don't just present it",
    stepLabel: 'Step 4 of 4',
    sub: "Position your recommendation, don't just present it",
    accent: '#5b3aa3',
    accentBg: '#e8e0f7',
    accentDeep: '#3e2470',
    body: "Great analysis that can't be communicated doesn't ship. Positioning means framing your recommendation for the decision-maker's context — not your own. They need a story, not a spreadsheet.",
    expert: {
      initials: 'AD',
      name: 'April Dunford',
      role: 'Obviously Awesome · positioning',
      quote: "Positioning isn't about what you build — it's the context you create so your audience instantly understands why yours is the right answer.",
    },
    scenario: {
      label: 'Applied · B2B SaaS notifications',
      text: 'Instead of "we should build a Slack bot (RICE: 118)," you say: "For enterprise users who run operations in Slack, this replaces their current workflow of switching back to our app — and we can validate it in one sprint." Approved in the meeting.',
    },
    hatchMessage: "Engineers think the win is building the right thing. Product thinkers know the win is getting the right thing built. Those are different skills.",
    panelBefore: "You've got the data. You share the RICE scores. You get 'interesting, let's think about it.' Which means no.",
    panelMove: "April Dunford's positioning: who is it for, what's the alternative they live with now, and what's your unique advantage?",
    panelAfter: '"For Slack-native teams, this replaces the copy-paste habit they currently hate." They get it immediately. Approved.',
  },
]

const WORKED = [
  {
    k: 'f',
    symbol: 'F',
    title: "Frame — what's the real job?",
    body: "The question isn't 'which feature?' — it's why daily active listening dropped among 18-24s. Discovery data shows choice paralysis: too many options, no clear starting point. The real job is reducing friction-to-first-listen, not adding more surfaces.",
    chips: ['JTBD reframe', 'Discovery data', 'Not "which feature"'],
    letterColor: '#7ee099',
  },
  {
    k: 'l',
    symbol: 'L',
    title: "List — open the space",
    body: "Solutions generated: AI DJ, social feed, contextual playlists (morning/gym/focus), 'continue from friends' widget, mood radio, one-tap start from home. Six options — not two. The original framing collapsed the space prematurely.",
    chips: ['6 options', 'Opportunity tree', 'Expanded framing'],
    letterColor: '#f2d684',
  },
  {
    k: 'o',
    symbol: 'O',
    title: "Optimize — score with evidence",
    body: "RICE: AI DJ = 94 (high reach, proven listen-through rate in beta, medium effort). Social feed = 41 (low confidence, failed twice before). Contextual playlists = 67. AI DJ wins clearly, with data behind it.",
    chips: ['RICE: 94', 'Beta data', 'AI DJ wins'],
    letterColor: '#ee9f6f',
  },
  {
    k: 'w',
    symbol: 'W',
    title: "Win — position to get buy-in",
    body: "Not: 'We should build AI DJ (RICE: 94) instead of the social feed.' Instead: 'For our Gen Z listeners who stall on the home screen, the AI DJ replaces the decision they currently dread. Beta cohort shows 23% lift in listen-through. We can prove Q3 impact in a 4-week sprint.' One read, clear yes.",
    chips: ['Outcome-first', 'Named alternative', 'Validation plan'],
    letterColor: '#c5a7f2',
  },
]

// ── SVG storyboard illustrations ───────────────────────────────
function FrameBeforeSVG() {
  return (
    <svg viewBox="0 0 140 100" fill="none" style={{ width: '100%', maxHeight: 110 }}>
      <rect x="8" y="10" width="60" height="22" rx="6" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.4"/>
      <text x="38" y="25" textAnchor="middle" fontSize="10" fill="#2E5138" fontFamily="monospace">Add spinner</text>
      <rect x="56" y="38" width="60" height="22" rx="6" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.4"/>
      <text x="86" y="53" textAnchor="middle" fontSize="10" fill="#2E5138" fontFamily="monospace">Faster API</text>
      <rect x="26" y="66" width="60" height="22" rx="6" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.4"/>
      <text x="56" y="81" textAnchor="middle" fontSize="10" fill="#2E5138" fontFamily="monospace">Cache layer</text>
    </svg>
  )
}
function FrameMoveSVG() {
  return (
    <svg viewBox="0 0 140 100" fill="none" style={{ width: '100%', maxHeight: 110 }}>
      <circle cx="70" cy="50" r="32" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="2"/>
      <text x="70" y="46" textAnchor="middle" fontSize="12" fill="#2E5138" fontWeight="700">Why do</text>
      <text x="70" y="60" textAnchor="middle" fontSize="12" fill="#2E5138" fontWeight="700">they leave?</text>
      <line x1="102" y1="22" x2="118" y2="10" stroke="#4A7C59" strokeWidth="2" strokeLinecap="round"/>
      <line x1="38" y1="50" x2="20" y2="50" stroke="#4A7C59" strokeWidth="2" strokeLinecap="round"/>
      <line x1="102" y1="78" x2="118" y2="90" stroke="#4A7C59" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function FrameAfterSVG() {
  return (
    <svg viewBox="0 0 140 100" fill="none" style={{ width: '100%', maxHeight: 110 }}>
      <rect x="12" y="12" width="116" height="76" rx="12" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.5"/>
      <text x="70" y="38" textAnchor="middle" fontSize="11" fill="#2E5138" fontFamily="monospace" fontWeight="700">THE REAL JOB:</text>
      <text x="70" y="58" textAnchor="middle" fontSize="12" fill="#2E5138" fontWeight="700">Users don&apos;t trust</text>
      <text x="70" y="74" textAnchor="middle" fontSize="12" fill="#2E5138" fontWeight="700">the save worked</text>
    </svg>
  )
}

function ListBeforeSVG() {
  return (
    <svg viewBox="0 0 140 100" fill="none" style={{ width: '100%', maxHeight: 110 }}>
      <rect x="24" y="10" width="92" height="20" rx="6" fill="#F7EBC9" stroke="#7A5A1E" strokeWidth="1.4"/>
      <text x="70" y="24" textAnchor="middle" fontSize="10" fill="#7A5A1E" fontFamily="monospace">Keep teams in sync</text>
      <line x1="70" y1="32" x2="70" y2="66" stroke="#7A5A1E" strokeWidth="2" strokeDasharray="4 3"/>
      <circle cx="70" cy="78" r="14" fill="#F7EBC9" stroke="#7A5A1E" strokeWidth="1.5"/>
      <text x="70" y="82" textAnchor="middle" fontSize="10" fill="#7A5A1E" fontFamily="monospace" fontWeight="700">Push</text>
    </svg>
  )
}
function ListMoveSVG() {
  return (
    <svg viewBox="0 0 140 100" fill="none" style={{ width: '100%', maxHeight: 110 }}>
      <rect x="50" y="6" width="40" height="16" rx="5" fill="#F7EBC9" stroke="#7A5A1E" strokeWidth="1.4"/>
      <text x="70" y="17" textAnchor="middle" fontSize="10" fill="#7A5A1E" fontFamily="monospace" fontWeight="700">In sync</text>
      <line x1="70" y1="22" x2="22" y2="42" stroke="#7A5A1E" strokeWidth="1.5"/>
      <line x1="70" y1="22" x2="70" y2="42" stroke="#7A5A1E" strokeWidth="1.5"/>
      <line x1="70" y1="22" x2="118" y2="42" stroke="#7A5A1E" strokeWidth="1.5"/>
      <rect x="6" y="42" width="32" height="14" rx="4" fill="#F7EBC9" stroke="#7A5A1E" strokeWidth="1"/>
      <text x="22" y="52" textAnchor="middle" fontSize="9" fill="#7A5A1E" fontFamily="monospace">Push</text>
      <rect x="54" y="42" width="32" height="14" rx="4" fill="#F7EBC9" stroke="#7A5A1E" strokeWidth="1"/>
      <text x="70" y="52" textAnchor="middle" fontSize="9" fill="#7A5A1E" fontFamily="monospace">Slack</text>
      <rect x="102" y="42" width="32" height="14" rx="4" fill="#F7EBC9" stroke="#7A5A1E" strokeWidth="1"/>
      <text x="118" y="52" textAnchor="middle" fontSize="9" fill="#7A5A1E" fontFamily="monospace">Digest</text>
      <line x1="22" y1="56" x2="22" y2="70" stroke="#7A5A1E" strokeWidth="1"/>
      <rect x="6" y="70" width="32" height="14" rx="4" fill="#F7EBC9" stroke="#7A5A1E" strokeWidth="1"/>
      <text x="22" y="80" textAnchor="middle" fontSize="9" fill="#7A5A1E" fontFamily="monospace">Log</text>
      <line x1="118" y1="56" x2="118" y2="70" stroke="#7A5A1E" strokeWidth="1"/>
      <rect x="102" y="70" width="32" height="14" rx="4" fill="#F7EBC9" stroke="#7A5A1E" strokeWidth="1"/>
      <text x="118" y="80" textAnchor="middle" fontSize="9" fill="#7A5A1E" fontFamily="monospace">@Ment</text>
    </svg>
  )
}
function ListAfterSVG() {
  return (
    <svg viewBox="0 0 140 100" fill="none" style={{ width: '100%', maxHeight: 110 }}>
      <rect x="8" y="6" width="124" height="16" rx="5" fill="#F7EBC9" stroke="#7A5A1E" strokeWidth="1.4"/>
      <text x="70" y="17" textAnchor="middle" fontSize="10" fill="#7A5A1E" fontFamily="monospace" fontWeight="700">1. Push notifs</text>
      <rect x="8" y="26" width="124" height="16" rx="5" fill="#F7EBC9" stroke="#7A5A1E" strokeWidth="1.4"/>
      <text x="70" y="37" textAnchor="middle" fontSize="10" fill="#7A5A1E" fontFamily="monospace" fontWeight="700">2. Slack / Teams bot</text>
      <rect x="8" y="46" width="124" height="16" rx="5" fill="#F7EBC9" stroke="#7A5A1E" strokeWidth="1.4"/>
      <text x="70" y="57" textAnchor="middle" fontSize="10" fill="#7A5A1E" fontFamily="monospace" fontWeight="700">3. Daily digest</text>
      <rect x="8" y="66" width="124" height="16" rx="5" fill="#F7EBC9" stroke="#7A5A1E" strokeWidth="1.4"/>
      <text x="70" y="77" textAnchor="middle" fontSize="10" fill="#7A5A1E" fontFamily="monospace" fontWeight="700">4. In-app feed</text>
    </svg>
  )
}

function OptBeforeSVG() {
  return (
    <svg viewBox="0 0 140 100" fill="none" style={{ width: '100%', maxHeight: 110 }}>
      <rect x="10" y="58" width="28" height="32" rx="4" fill="#FCE0D2" stroke="#C2633A" strokeWidth="1.4"/>
      <rect x="56" y="58" width="28" height="32" rx="4" fill="#FCE0D2" stroke="#C2633A" strokeWidth="1.4"/>
      <rect x="102" y="58" width="28" height="32" rx="4" fill="#FCE0D2" stroke="#C2633A" strokeWidth="1.4"/>
      <text x="24" y="54" textAnchor="middle" fontSize="9" fill="#7A3A18" fontFamily="monospace" fontWeight="700">Push</text>
      <text x="70" y="54" textAnchor="middle" fontSize="9" fill="#7A3A18" fontFamily="monospace" fontWeight="700">Slack</text>
      <text x="116" y="54" textAnchor="middle" fontSize="9" fill="#7A3A18" fontFamily="monospace" fontWeight="700">Digest</text>
      <text x="70" y="24" textAnchor="middle" fontSize="12" fill="#7A3A18" fontWeight="700">Which one?</text>
      <text x="70" y="40" textAnchor="middle" fontSize="10" fill="#7A3A18" fontFamily="monospace" opacity=".55">¯\_(ツ)_/¯</text>
    </svg>
  )
}
function OptMoveSVG() {
  return (
    <svg viewBox="0 0 140 100" fill="none" style={{ width: '100%', maxHeight: 110 }}>
      <text x="8" y="14" fontSize="9" fill="#7A3A18" fontFamily="monospace" fontWeight="700">REACH</text>
      <rect x="54" y="6" width="80" height="10" rx="2" fill="#FCE0D2"/>
      <rect x="54" y="6" width="56" height="10" rx="2" fill="#C2633A"/>
      <text x="8" y="34" fontSize="9" fill="#7A3A18" fontFamily="monospace" fontWeight="700">IMPACT</text>
      <rect x="54" y="26" width="80" height="10" rx="2" fill="#FCE0D2"/>
      <rect x="54" y="26" width="68" height="10" rx="2" fill="#C2633A"/>
      <text x="8" y="54" fontSize="9" fill="#7A3A18" fontFamily="monospace" fontWeight="700">CONF</text>
      <rect x="54" y="46" width="80" height="10" rx="2" fill="#FCE0D2"/>
      <rect x="54" y="46" width="44" height="10" rx="2" fill="#C2633A"/>
      <text x="8" y="74" fontSize="9" fill="#7A3A18" fontFamily="monospace" fontWeight="700">EFFORT</text>
      <rect x="54" y="66" width="80" height="10" rx="2" fill="#FCE0D2"/>
      <rect x="54" y="66" width="20" height="10" rx="2" fill="#C2633A"/>
      <text x="70" y="92" textAnchor="middle" fontSize="11" fill="#7A3A18" fontWeight="900">RICE = 118</text>
    </svg>
  )
}
function OptAfterSVG() {
  return (
    <svg viewBox="0 0 140 100" fill="none" style={{ width: '100%', maxHeight: 110 }}>
      <rect x="14" y="60" width="30" height="30" rx="4" fill="#FCE0D2" stroke="#C2633A" strokeWidth="1"/>
      <text x="29" y="78" textAnchor="middle" fontSize="9" fill="#7A3A18" fontFamily="monospace">42</text>
      <rect x="54" y="14" width="30" height="76" rx="4" fill="#C2633A"/>
      <text x="69" y="52" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="900">118</text>
      <text x="69" y="66" textAnchor="middle" fontSize="9" fill="#fff" fontFamily="monospace" opacity=".8">WIN</text>
      <rect x="94" y="48" width="30" height="42" rx="4" fill="#FCE0D2" stroke="#C2633A" strokeWidth="1"/>
      <text x="109" y="72" textAnchor="middle" fontSize="9" fill="#7A3A18" fontFamily="monospace">31</text>
      <text x="29" y="52" textAnchor="middle" fontSize="9" fill="#7A3A18" fontFamily="monospace" fontWeight="700">Push</text>
      <text x="69" y="8" textAnchor="middle" fontSize="10" fill="#7A3A18" fontFamily="monospace" fontWeight="700">Slack</text>
      <text x="109" y="42" textAnchor="middle" fontSize="9" fill="#7A3A18" fontFamily="monospace" fontWeight="700">Digest</text>
    </svg>
  )
}

function WinBeforeSVG() {
  return (
    <svg viewBox="0 0 140 100" fill="none" style={{ width: '100%', maxHeight: 110 }}>
      <circle cx="28" cy="50" r="18" fill="#E8E0F7" stroke="#5B3AA3" strokeWidth="1.5"/>
      <text x="28" y="54" textAnchor="middle" fontSize="11" fill="#3E2470" fontWeight="700">You</text>
      <rect x="66" y="26" width="60" height="52" rx="8" fill="#E8E0F7" stroke="#5B3AA3" strokeWidth="1.5"/>
      <text x="96" y="48" textAnchor="middle" fontSize="10" fill="#3E2470" fontFamily="monospace" fontWeight="700">RICE</text>
      <text x="96" y="62" textAnchor="middle" fontSize="12" fill="#3E2470" fontWeight="900">= 118</text>
      <line x1="48" y1="50" x2="66" y2="50" stroke="#5B3AA3" strokeWidth="1.5" strokeDasharray="3 2"/>
      <text x="96" y="90" textAnchor="middle" fontSize="10" fill="#3E2470" fontFamily="monospace" opacity=".4">...silence</text>
    </svg>
  )
}
function WinMoveSVG() {
  return (
    <svg viewBox="0 0 140 100" fill="none" style={{ width: '100%', maxHeight: 110 }}>
      <rect x="6" y="8" width="128" height="22" rx="6" fill="#E8E0F7" stroke="#5B3AA3" strokeWidth="1.4"/>
      <text x="70" y="23" textAnchor="middle" fontSize="10" fill="#3E2470" fontFamily="monospace" fontWeight="700">For Slack-native teams</text>
      <rect x="6" y="36" width="128" height="22" rx="6" fill="#E8E0F7" stroke="#5B3AA3" strokeWidth="1.4"/>
      <text x="70" y="51" textAnchor="middle" fontSize="10" fill="#3E2470" fontFamily="monospace" fontWeight="700">who hate tab-switching</text>
      <rect x="6" y="64" width="128" height="26" rx="6" fill="#5B3AA3"/>
      <text x="70" y="81" textAnchor="middle" fontSize="10" fill="#FAF6F0" fontFamily="monospace" fontWeight="700">our bot beats copy-paste</text>
    </svg>
  )
}
function WinAfterSVG() {
  return (
    <svg viewBox="0 0 140 100" fill="none" style={{ width: '100%', maxHeight: 110 }}>
      <circle cx="70" cy="44" r="28" fill="#E8E0F7" stroke="#5B3AA3" strokeWidth="2"/>
      <polyline points="54,46 66,58 86,36" stroke="#5B3AA3" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <text x="70" y="92" textAnchor="middle" fontSize="13" fill="#3E2470" fontWeight="900">Shipped.</text>
    </svg>
  )
}

const SVGS: Record<FlowMove, { before: React.ReactNode; move: React.ReactNode; after: React.ReactNode }> = {
  frame: { before: <FrameBeforeSVG />, move: <FrameMoveSVG />, after: <FrameAfterSVG /> },
  list: { before: <ListBeforeSVG />, move: <ListMoveSVG />, after: <ListAfterSVG /> },
  optimize: { before: <OptBeforeSVG />, move: <OptMoveSVG />, after: <OptAfterSVG /> },
  win: { before: <WinBeforeSVG />, move: <WinMoveSVG />, after: <WinAfterSVG /> },
}

// ── Main page ──────────────────────────────────────────────────
export default function LearnFlowPage() {
  const [activePill, setActivePill] = useState<FlowMove | null>(null)
  const [openWorked, setOpenWorked] = useState<number | null>(null)
  const [scrollPct, setScrollPct] = useState(0)

  useEffect(() => {
    // Scroll progress
    function onScroll() {
      const sc = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      setScrollPct(max > 0 ? (sc / max) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // Section observer for active pill
    const sectionObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && ['frame', 'list', 'optimize', 'win'].includes(e.target.id)) {
          setActivePill(e.target.id as FlowMove)
        }
      })
    }, { threshold: 0.3 })

    MOVES.forEach(m => {
      const el = document.getElementById(m.key)
      if (el) sectionObs.observe(el)
    })

    // Reveal observer
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('flow-revealed')
          revealObs.unobserve(e.target)
        }
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })

    document.querySelectorAll('.flow-reveal').forEach(el => revealObs.observe(el))

    return () => {
      window.removeEventListener('scroll', onScroll)
      sectionObs.disconnect()
      revealObs.disconnect()
    }
  }, [])

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: 'var(--font-body, "Nunito Sans", sans-serif)', background: '#fdfbf6', color: '#1e1b14' }}>

      {/* Scroll progress bar */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, height: 3, zIndex: 100,
          background: 'linear-gradient(90deg, #4a7c59, #c9933a, #c2633a, #5b3aa3)',
          width: `${scrollPct}%`,
          transition: 'width 80ms linear',
          pointerEvents: 'none',
        }}
      />

      <style>{`
        .flow-reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .flow-reveal.flow-revealed { opacity: 1; transform: translateY(0); }
        .flow-reveal.d1 { transition-delay: 0.08s; }
        .flow-reveal.d2 { transition-delay: 0.16s; }
        .flow-reveal.d3 { transition-delay: 0.24s; }
        .flow-reveal.d4 { transition-delay: 0.32s; }
        .move-card-hover:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(30,27,20,0.1); }
        .move-card-hover { transition: transform 0.25s, box-shadow 0.25s; }
        .sb-panel-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(30,27,20,0.08); }
        .sb-panel-hover { transition: transform 0.25s, box-shadow 0.25s; }
        .wk-body-expand { max-height: 0; overflow: hidden; opacity: 0; transition: max-height 0.4s ease, opacity 0.3s; }
        .wk-body-expand.open { max-height: 500px; opacity: 1; }
        @keyframes hatchFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes liveGlow { 0% { box-shadow: 0 0 0 0 rgba(196,166,106,0.5); } 70% { box-shadow: 0 0 0 10px rgba(196,166,106,0); } 100% { box-shadow: 0 0 0 0 rgba(196,166,106,0); } }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px 32px', position: 'relative', overflow: 'hidden' }}>
        {/* Big background FLOW letters */}
        <div aria-hidden style={{
          position: 'absolute', right: -30, top: 20, zIndex: 0,
          display: 'flex', gap: 0, pointerEvents: 'none',
          fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
          fontWeight: 900,
          fontSize: 'clamp(180px, 22vw, 320px)',
          lineHeight: 0.85, opacity: 0.055, letterSpacing: '-0.08em',
        }}>
          <span style={{ color: '#4a7c59' }}>F</span>
          <span style={{ color: '#c9933a' }}>L</span>
          <span style={{ color: '#c2633a' }}>O</span>
          <span style={{ color: '#5b3aa3' }}>W</span>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div className="flow-reveal mb-6">
            <Link href="/explore" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12.5, fontWeight: 700, color: '#78715f',
              textDecoration: 'none',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
              Explore
            </Link>
          </div>

          {/* Eyebrow */}
          <div className="flow-reveal" style={{
            fontFamily: 'monospace', fontSize: 11.5, letterSpacing: '2.5px',
            textTransform: 'uppercase', fontWeight: 700, color: '#78715f',
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
          }}>
            <span style={{ width: 32, height: 1.5, background: '#78715f', display: 'block' }} />
            The framework · The operating system behind every challenge
          </div>

          {/* H1 */}
          <h1 className="flow-reveal d1" style={{
            fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
            fontWeight: 600,
            fontSize: 'clamp(44px, 6vw, 84px)',
            lineHeight: 0.98, letterSpacing: '-0.035em',
            color: '#1e1b14', marginBottom: 24,
          }}>
            <span style={{
              display: 'inline-block',
              background: 'linear-gradient(92deg, #4a7c59 0%, #c9933a 33%, #c2633a 66%, #5b3aa3 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 900,
            }}>FLOW</span>
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: '#78715f', display: 'block', fontSize: '0.62em', marginTop: 8, letterSpacing: '-0.02em' }}>
              how product thinkers think.
            </em>
          </h1>

          {/* Deck */}
          <p className="flow-reveal d2" style={{
            fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
            fontSize: 21, lineHeight: 1.5, color: '#3d392e',
            maxWidth: 680, marginBottom: 32, fontWeight: 400,
          }}>
            Most engineers solve the stated problem brilliantly.{' '}
            <strong style={{ color: '#1e1b14', fontWeight: 700 }}>Product thinking is finding the right problem before writing a single line of code.</strong>{' '}
            FLOW is the four-move playbook that gets you there.
          </p>

          {/* Meta row */}
          <div className="flow-reveal d3" style={{
            display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
            fontFamily: 'monospace', fontSize: 12, letterSpacing: '1px',
            color: '#78715f', textTransform: 'uppercase', fontWeight: 600,
            marginBottom: 24,
          }}>
            <span>4 moves</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#78715f', opacity: 0.5, display: 'inline-block' }} />
            <span>8 min read</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#78715f', opacity: 0.5, display: 'inline-block' }} />
            <span>1 worked example</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#78715f', opacity: 0.5, display: 'inline-block' }} />
            <Link href="/challenges" style={{ color: '#4a7c59', textDecoration: 'none', fontWeight: 700 }}>
              Free to try →
            </Link>
          </div>

          {/* Jump pills */}
          <div className="flow-reveal d4" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MOVES.map(m => (
              <button
                key={m.key}
                onClick={() => jumpTo(m.key)}
                style={{
                  padding: '9px 18px', borderRadius: 999,
                  fontWeight: 700, fontSize: 13,
                  border: activePill === m.key ? 'none' : `1px solid #e7dfc9`,
                  background: activePill === m.key ? m.accent : 'transparent',
                  color: activePill === m.key ? '#fff' : '#1e1b14',
                  cursor: 'pointer',
                  fontFamily: 'monospace', letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                }}
              >
                {m.symbol} — {m.label}
              </button>
            ))}
            <Link
              href="/challenges"
              style={{
                padding: '9px 20px', borderRadius: 999,
                fontWeight: 800, fontSize: 13,
                background: '#4a7c59', color: 'white',
                textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'inherit',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
              Try a FLOW challenge
            </Link>
          </div>
        </div>
      </section>

      {/* ── PAIN SECTION ─────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(180deg, #f3ede0 0%, #ede5d0 100%)', padding: '48px 32px', borderTop: '1px solid #e7dfc9', borderBottom: '1px solid #e7dfc9' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="flow-reveal" style={{
            fontFamily: 'monospace', fontSize: 11.5, letterSpacing: '2.5px',
            textTransform: 'uppercase', fontWeight: 700, color: '#78715f',
            marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ width: 32, height: 1.5, background: '#78715f', display: 'block' }} />
            The situation every engineer recognizes
          </div>

          {/* Dialog bubbles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 36 }}>
            <div className="flow-reveal" style={{
              padding: '24px 28px', borderRadius: 20, position: 'relative',
              background: 'white', border: '1px solid #e7dfc9',
              boxShadow: '0 4px 16px rgba(30,27,20,0.04)',
              fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
              fontSize: 18.5, lineHeight: 1.5,
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10, opacity: 0.55 }}>Your PM · 11:04am</div>
              Users are complaining about slow load times. Can we add a loading spinner?
              {/* Arrow down */}
              <div style={{
                position: 'absolute', bottom: -10, left: 36,
                width: 20, height: 20, background: 'white',
                borderRight: '1px solid #e7dfc9', borderBottom: '1px solid #e7dfc9',
                transform: 'rotate(45deg)',
              }} />
            </div>
            <div className="flow-reveal d1" style={{
              padding: '24px 28px', borderRadius: 20, position: 'relative',
              background: '#1e1b14', color: '#faf6f0', marginLeft: 40, marginTop: 32,
              fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
              fontSize: 18.5, lineHeight: 1.5,
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10, color: '#c4a66a' }}>The old you · 11:04am</div>
              Sure, I&apos;ll have it by tomorrow.
              {/* Arrow up */}
              <div style={{
                position: 'absolute', top: -10, right: 36,
                width: 20, height: 20, background: '#1e1b14',
                transform: 'rotate(45deg)',
              }} />
            </div>
          </div>

          {/* Punch text */}
          <p className="flow-reveal" style={{
            fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
            fontSize: 26, lineHeight: 1.4, color: '#1e1b14',
            maxWidth: 820, fontWeight: 500, margin: '32px 0 24px', letterSpacing: '-0.015em',
          }}>
            The product-thinking you <em>pauses</em>. Because you know the spinner isn&apos;t the problem —{' '}
            <span style={{ background: 'linear-gradient(180deg, transparent 55%, #fbe88a 55%)', padding: '0 2px' }}>it&apos;s a symptom.</span>{' '}
            And shipping a symptom fix is how engineers spend careers building the wrong things brilliantly.
          </p>

          {/* 4 move cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {MOVES.map((m, i) => (
              <button
                key={m.key}
                onClick={() => jumpTo(m.key)}
                className={`flow-reveal move-card-hover d${i + 1}`}
                style={{
                  borderRadius: 20, padding: '28px 24px', position: 'relative', overflow: 'hidden',
                  cursor: 'pointer', border: `1.5px solid transparent`,
                  textAlign: 'left', background: m.accentBg,
                  borderColor: m.key === 'frame' ? '#cfe0d4' : m.key === 'list' ? '#e6d4a0' : m.key === 'optimize' ? '#efc3ac' : '#ccbde8',
                  minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  fontFamily: 'inherit',
                }}
              >
                <div>
                  <div style={{
                    fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
                    fontWeight: 900, fontSize: 68, lineHeight: 0.85,
                    letterSpacing: '-0.05em', marginBottom: 12, color: m.accentDeep,
                  }}>{m.symbol}</div>
                  <div style={{ fontFamily: 'var(--font-headline, Literata, Georgia, serif)', fontWeight: 700, fontSize: 22, marginBottom: 6, letterSpacing: '-0.015em', color: '#1e1b14' }}>{m.label}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: '#3d392e' }}>{m.sub}</div>
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  alignSelf: 'flex-end',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOVE SECTIONS ─────────────────────────────────────── */}
      {MOVES.map((move, index) => {
        const svgs = SVGS[move.key]
        const isEven = index % 2 === 0

        return (
          <section
            key={move.key}
            id={move.key}
            style={{
              padding: '56px 32px',
              background: isEven ? '#fdfbf6' : '#f3ede0',
            }}
          >
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 48, alignItems: 'start' }}>

              {/* Left content */}
              <div>
                {/* Step label */}
                <div className="flow-reveal" style={{
                  fontFamily: 'monospace', fontSize: 11.5, letterSpacing: '2.5px',
                  textTransform: 'uppercase', fontWeight: 700, color: move.accentDeep,
                  marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ width: 32, height: 1.5, background: move.accentDeep, opacity: 0.4, display: 'block' }} />
                  {move.stepLabel} · {move.label}
                </div>

                {/* Move hero */}
                <div className="flow-reveal d1" style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 16 }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
                    fontWeight: 900, fontSize: 58, lineHeight: 1,
                    letterSpacing: '-0.04em', flexShrink: 0,
                    background: move.accentBg, color: move.accentDeep,
                  }}>
                    {move.symbol}
                  </div>
                  <div>
                    <h2 style={{
                      fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
                      fontWeight: 700, fontSize: 52, lineHeight: 1,
                      letterSpacing: '-0.03em', marginBottom: 8, color: '#1e1b14',
                    }}>{move.label}</h2>
                    <div style={{
                      fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
                      fontStyle: 'italic', fontSize: 19, color: '#78715f',
                      lineHeight: 1.4, maxWidth: 520,
                    }}>{move.tagline}.</div>
                  </div>
                </div>

                {/* Body */}
                <p className="flow-reveal d2" style={{
                  fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
                  fontSize: 18, lineHeight: 1.65, color: '#3d392e',
                  maxWidth: 660, marginBottom: 28,
                }}>{move.body}</p>

                {/* 3-panel storyboard */}
                <div className="flow-reveal d3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
                  {/* Before */}
                  <div className="sb-panel-hover" style={{
                    background: '#fdfbf6', border: '1.5px solid #e7dfc9',
                    borderRadius: 18, padding: 20, position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 800, marginBottom: 14, color: '#78715f' }}>Before</div>
                    <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{svgs.before}</div>
                    <div style={{ fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.55, color: '#3d392e' }}>{move.panelBefore}</div>
                  </div>

                  {/* The Move */}
                  <div className="sb-panel-hover" style={{
                    background: 'white', border: `2.5px solid ${move.accent}`,
                    borderRadius: 18, padding: 20, position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      fontFamily: 'monospace', fontSize: 9, letterSpacing: '1.5px',
                      textTransform: 'uppercase', fontWeight: 800, marginBottom: 14,
                      background: move.accent, color: 'white',
                      display: 'inline-block', padding: '3px 8px', borderRadius: 4,
                    }}>THE MOVE</div>
                    <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{svgs.move}</div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.55, color: move.accentDeep, fontWeight: 600 }}>{move.panelMove}</div>
                  </div>

                  {/* After */}
                  <div className="sb-panel-hover" style={{
                    background: '#fdfbf6', border: '1.5px solid #e7dfc9',
                    borderRadius: 18, padding: 20, position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 800, marginBottom: 14, color: '#78715f' }}>After</div>
                    <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{svgs.after}</div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#3d392e' }}>{move.panelAfter}</div>
                  </div>
                </div>

                {/* Expert quote */}
                <div className="flow-reveal d3" style={{
                  display: 'flex', gap: 20, alignItems: 'flex-start',
                  borderRadius: 22, padding: '20px 24px', marginBottom: 20,
                  background: move.accentBg, position: 'relative', overflow: 'hidden',
                }}>
                  <div aria-hidden style={{
                    position: 'absolute', top: -30, right: 28,
                    fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
                    fontSize: 160, lineHeight: 1, fontWeight: 900, fontStyle: 'italic',
                    opacity: 0.12, color: move.accentDeep, pointerEvents: 'none',
                  }}>"</div>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: move.accent, color: 'white',
                    fontWeight: 800, fontSize: 16, position: 'relative', zIndex: 1,
                  }}>{move.expert.initials}</div>
                  <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1e1b14', marginBottom: 1 }}>{move.expert.name}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#78715f', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>{move.expert.role}</div>
                    <div style={{ fontFamily: 'var(--font-headline, Literata, Georgia, serif)', fontStyle: 'italic', fontSize: 18.5, lineHeight: 1.55, color: '#1e1b14' }}>
                      &ldquo;{move.expert.quote}&rdquo;
                    </div>
                  </div>
                </div>

                {/* Scenario */}
                <div className="flow-reveal d4" style={{
                  borderLeft: `4px solid ${move.accent}`, padding: '8px 0 8px 20px', marginBottom: 24,
                }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, color: '#78715f', marginBottom: 6 }}>{move.scenario.label}</div>
                  <div style={{ fontSize: 15.5, lineHeight: 1.6, color: '#3d392e' }}>{move.scenario.text}</div>
                </div>

                {/* CTA */}
                <div className="flow-reveal d4">
                  <Link
                    href="/challenges"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      border: `2px solid ${move.accent}`, borderRadius: 999,
                      padding: '12px 22px', fontWeight: 800, fontSize: 14,
                      color: move.accentDeep, textDecoration: 'none',
                      transition: 'all 0.2s', background: 'transparent',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = move.accent;
                      (e.currentTarget as HTMLElement).style.color = 'white';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = move.accentDeep;
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_arrow</span>
                    Practice {move.label} on a real challenge
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  </Link>
                </div>
              </div>

              {/* Right: Hatch rail */}
              <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{
                  background: '#1e1b14', color: '#faf6f0',
                  borderRadius: 20, borderBottomRightRadius: 6,
                  padding: '18px 20px',
                }}>
                  <div style={{
                    fontFamily: 'monospace', fontSize: 9.5, letterSpacing: '2px',
                    textTransform: 'uppercase', fontWeight: 800, color: '#c4a66a',
                    marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#c4a66a', display: 'inline-block',
                      animation: 'liveGlow 2s infinite',
                    }} />
                    HATCH · YOUR COACH
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{move.hatchMessage}</p>
                </div>
                <div style={{ animation: 'hatchFloat 3.5s ease-in-out infinite' }}>
                  <HatchGlyph size={72} state="speaking" className="text-primary" />
                </div>
              </div>
            </div>
          </section>
        )
      })}

      {/* ── WORKED EXAMPLE (dark) ─────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(160deg, #16281f 0%, #1e3528 100%)',
        color: '#faf6f0', padding: '56px 32px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Dot texture */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 70% 80% at 60% 50%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 60% 50%, black 30%, transparent 80%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          <div className="flow-reveal" style={{
            fontFamily: 'monospace', fontSize: 11.5, letterSpacing: '2.5px',
            textTransform: 'uppercase', fontWeight: 700, color: 'rgba(250,246,240,0.5)',
            marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ width: 32, height: 1.5, background: 'rgba(250,246,240,0.3)', display: 'block' }} />
            Full FLOW — worked example
          </div>

          <h2 className="flow-reveal d1" style={{
            fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
            fontWeight: 600, fontSize: 'clamp(38px, 5vw, 60px)',
            lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 16, color: '#faf6f0',
          }}>
            Spotify&apos;s AI DJ{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'rgba(250,246,240,0.55)' }}>decision.</em>
          </h2>

          <p className="flow-reveal d2" style={{
            fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
            fontSize: 18.5, lineHeight: 1.55, color: 'rgba(250,246,240,0.75)',
            maxWidth: 640, marginBottom: 48,
          }}>
            Spotify&apos;s growth team is asked: &ldquo;Should we build the AI DJ or rebuild the social listening feed?&rdquo; Here&apos;s FLOW applied end-to-end. Click each card to expand.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {WORKED.map((w, i) => (
              <button
                key={w.k}
                className={`flow-reveal d${Math.min(i, 3) + 1}`}
                onClick={() => setOpenWorked(openWorked === i ? null : i)}
                style={{
                  background: openWorked === i ? 'rgba(250,246,240,0.09)' : 'rgba(250,246,240,0.05)',
                  border: `1px solid ${openWorked === i ? 'rgba(250,246,240,0.2)' : 'rgba(250,246,240,0.12)'}`,
                  borderRadius: 20, padding: 24,
                  transition: 'all 0.3s', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left',
                  color: 'inherit', fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
                    fontWeight: 900, fontSize: 36, lineHeight: 1,
                    letterSpacing: '-0.04em', width: 44, textAlign: 'center',
                    color: w.letterColor,
                  }}>{w.symbol}</div>
                  <div style={{
                    fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
                    fontWeight: 700, fontSize: 16.5, lineHeight: 1.25,
                    letterSpacing: '-0.01em', color: '#faf6f0', flex: 1,
                  }}>{w.title}</div>
                  <div style={{
                    fontFamily: 'monospace', fontSize: 11, color: 'rgba(250,246,240,0.5)',
                    letterSpacing: '0.5px', marginLeft: 'auto', flexShrink: 0,
                  }}>{openWorked === i ? '−' : '+'}</div>
                </div>
                <div className={`wk-body-expand ${openWorked === i ? 'open' : ''}`}>
                  <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'rgba(250,246,240,0.72)', marginBottom: 12 }}>{w.body}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {w.chips.map(chip => (
                      <span key={chip} style={{
                        fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.5px',
                        padding: '3px 9px', borderRadius: 999,
                        background: 'rgba(250,246,240,0.1)', color: 'rgba(250,246,240,0.72)',
                        fontWeight: 600,
                      }}>{chip}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section style={{
        background: '#f3ede0', padding: '56px 32px',
        textAlign: 'center', borderTop: '1px solid #e7dfc9',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 className="flow-reveal" style={{
            fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
            fontWeight: 600,
            fontSize: 'clamp(36px, 5vw, 58px)',
            lineHeight: 1.05, letterSpacing: '-0.03em',
            marginBottom: 20, color: '#1e1b14',
          }}>
            Stop solving symptoms.{' '}
            <em style={{ fontStyle: 'italic', color: '#78715f', fontWeight: 400 }}>Start thinking in moves.</em>
          </h2>
          <p className="flow-reveal d1" style={{
            fontFamily: 'var(--font-headline, Literata, Georgia, serif)',
            fontSize: 19, lineHeight: 1.55, color: '#3d392e', marginBottom: 36,
          }}>
            FLOW isn&apos;t a template — it&apos;s how product thinkers think. Practice it on real challenges, get Hatch&apos;s feedback on every move, and watch your recommendations start landing.
          </p>
          <div className="flow-reveal d2" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <Link
              href="/challenges"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#4a7c59', color: 'white',
                borderRadius: 999, padding: '16px 32px',
                fontWeight: 800, fontSize: 15.5, textDecoration: 'none',
                fontFamily: 'inherit',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>play_arrow</span>
              Practice FLOW on a real challenge — free
            </Link>
            <Link
              href="/explore"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'transparent', color: '#1e1b14',
                border: '1.5px solid #e7dfc9',
                borderRadius: 999, padding: '16px 32px',
                fontWeight: 700, fontSize: 15.5, textDecoration: 'none',
                fontFamily: 'inherit',
              }}
            >
              Back to Explore
            </Link>
          </div>
          <div className="flow-reveal d3" style={{
            fontFamily: 'monospace', fontSize: 11, letterSpacing: '1.5px',
            textTransform: 'uppercase', color: '#78715f', fontWeight: 600,
          }}>
            Free to try · No credit card · 10 min per challenge
          </div>
        </div>
      </section>

    </div>
  )
}
