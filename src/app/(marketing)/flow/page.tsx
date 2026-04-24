'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────
type FlowMove = 'frame' | 'list' | 'optimize' | 'win'

interface StoryCard {
  title: string
  body: string
  highlight?: string
}

interface MoveData {
  key: FlowMove
  symbol: string
  label: string
  tagline: string
  accentColor: string
  bgColor: string
  cards: StoryCard[]
  stepLabel: string
  sub: string
  body: string
  expert: { initials: string; name: string; role: string; quote: string }
  scenario: { label: string; text: string }
  hatchMessage: string
}

function exampleBody(scenario: string, explanation: string): string {
  return `Scenario: "${scenario}"\n\n${explanation}`
}

// ── FLOW move data (copied from in-app /learn/flow) ───────────
const MOVES: MoveData[] = [
  {
    key: 'frame',
    symbol: 'F',
    label: 'Frame',
    tagline: 'Find the real job behind the request',
    accentColor: '#2e7d32',
    bgColor: '#e8f5e9',
    stepLabel: 'Step 1 of 4',
    sub: 'Find the real job behind the request',
    body: 'Stop solving the stated problem. Every feature request is a disguised symptom. Framing means surfacing the underlying job-to-be-done — the outcome the user actually wants — before evaluating any solutions.',
    expert: {
      initials: 'MC',
      name: 'Marty Cagan · SVPG',
      role: 'Author, Inspired',
      quote: '"The most common mistake is confusing the solution with the outcome. Features are hypotheses. The job is to discover which problem is actually worth solving."',
    },
    scenario: {
      label: 'Applied — B2B SaaS notifications',
      text: "PM says: add real-time push notifications. Framed correctly, the job isn't to notify — it's to keep teams in sync without breaking focus. That's a completely different problem to solve.",
    },
    hatchMessage: "Before jumping to solutions, great product thinkers ask one question: what job is this person actually trying to do? The answer is almost never what was stated.",
    cards: [
      {
        title: 'Most people start solving immediately',
        body: "The instinct is to jump to solutions. DAU dropped? Ship a push notification. Churn up? Add a discount. But solving fast without framing is the most common product mistake.",
        highlight: "You can't solve the right problem if you haven't defined it.",
      },
      {
        title: 'Strong framers ask "why" before "what"',
        body: "Frame is the move where you decide what problem you're actually solving. Most people skip it — they jump straight to solutions before questioning the brief.",
        highlight: 'The best product decisions start with the right question.',
      },
      {
        title: 'The question that changes everything',
        body: "If you Frame wrong, every subsequent move — no matter how sharp — solves the wrong thing. Framing isn't the slow move. It's the move that makes all the others faster.",
        highlight: 'Reframe the brief before accepting it.',
      },
      {
        title: 'Frame in the wild',
        body: exampleBody("DAU up 20% but revenue flat — what do you ask first?", "Bad frame: \"How do we convert more users?\" Good frame: \"Which user segments are growing and why aren't they paying?\" The first chases a symptom. The second finds the driver."),
      },
    ],
  },
  {
    key: 'list',
    symbol: 'L',
    label: 'List',
    tagline: 'Open the solution space before evaluating anything',
    accentColor: '#705c30',
    bgColor: '#f5e6c8',
    stepLabel: 'Step 2 of 4',
    sub: 'Open the solution space before evaluating anything',
    body: "Don't commit to a solution yet. Generate every plausible approach to the framed problem — at least five distinct options that vary in effort, reach, and mechanism. The goal is breadth before depth.",
    expert: {
      initials: 'TT',
      name: 'Teresa Torres · Product Talk',
      role: 'Author, Continuous Discovery Habits',
      quote: '"Jumping to solutions is the product team\'s version of premature optimization. The Opportunity Solution Tree forces you to separate problem discovery from solution generation."',
    },
    scenario: {
      label: 'Applied — B2B SaaS notifications',
      text: "Listed: push notifs, Slack/Teams integration, daily digest, in-app feed, @mention threads, smart batching. The Slack integration — which nobody asked for — turns out to be the highest-leverage option by far.",
    },
    hatchMessage: "The first solution you think of is almost never the best one. Generate until you surprise yourself — that's when you know you've actually opened the space.",
    cards: [
      {
        title: "A brainstorm dump isn't a List",
        body: "Throwing every idea on a whiteboard feels productive but leaves you with a mess, not a structure. List is not about quantity — it's about coverage without overlap.",
        highlight: 'Not exhaustive. Not exclusive. Both at once.',
      },
      {
        title: 'The MECE test',
        body: "List is the move where you break a complex problem into distinct, non-overlapping pieces. Mutually Exclusive, Collectively Exhaustive — you're looking for segments, dimensions, or options that cover the space without doubling up.",
        highlight: "If two buckets feel similar, you haven't structured it yet.",
      },
      {
        title: 'Who else is in the room?',
        body: "A well-structured List prevents you from solving the loudest part of a problem while the real driver hides in a corner. Different user segments often have fundamentally different needs.",
        highlight: 'Map the whole population before drawing conclusions.',
      },
      {
        title: 'List in the wild',
        body: exampleBody('Power users vs. new users react differently to the same change.', 'Bad list: "Users, admins, people who pay." Good list: "New users (0-7 days) · Active users (weekly) · Power users (daily) · Churned (30d+ inactive)." The second is structured — each bucket is distinct.'),
      },
    ],
  },
  {
    key: 'optimize',
    symbol: 'O',
    label: 'Optimize',
    tagline: 'Pick the highest-leverage bet with explicit evidence',
    accentColor: '#7a3010',
    bgColor: '#fde8d8',
    stepLabel: 'Step 3 of 4',
    sub: 'Pick the highest-leverage bet with explicit evidence',
    body: "Not all solutions are equal. Apply a scoring lens — RICE, ICE, LNO — before you fall in love with any single approach. The goal is to replace preference with evidence and make the tradeoff visible.",
    expert: {
      initials: 'SD',
      name: 'Shreyas Doshi · ex-Stripe, Twitter',
      role: 'Creator, LNO Framework',
      quote: '"Product leverage is about finding the work that is 10x more impactful than everything else. Most teams optimize locally — they do a good job on the wrong things."',
    },
    scenario: {
      label: 'Applied — B2B SaaS notifications',
      text: "RICE scores: Push notifs = 42. Daily digest = 31. Slack bot = 118. The number makes the decision obvious — and gives you something concrete to bring into the planning meeting instead of a preference.",
    },
    hatchMessage: "A number beats an opinion every time. Even a rough RICE score converts a preference argument into a tradeoff conversation — and that's a much better meeting.",
    cards: [
      {
        title: 'Anyone can list options',
        body: "Once you've framed and listed, the real work begins. Optimize is not about adding more options — it's about narrowing to the one that's actually defensible given your constraints.",
        highlight: "Stakeholders need a recommendation, not a menu.",
      },
      {
        title: 'Constraints are the filter',
        body: "Optimize is where you sharpen from many options to the best one given real constraints — time, resources, risk, and evidence. It's not about the perfect option in a vacuum.",
        highlight: "A perfect option you can't ship isn't an option.",
      },
      {
        title: 'The recommendation, not the menu',
        body: "Optimize is what separates PMs who produce clarity from PMs who produce decks full of bullets. Your job is to make the call — and to make it legible to others.",
        highlight: 'Come with a PoV before the meeting, not during.',
      },
      {
        title: 'Optimize in the wild',
        body: exampleBody('Cut free tier from 10K to 1K API calls — or find a smarter lever?', '"Cutting to 1K is highest-leverage — triggers 40% of power free-users to evaluate paid. Validate with a 2-week shadow limit before enforcement." The second makes a call.'),
      },
    ],
  },
  {
    key: 'win',
    symbol: 'W',
    label: 'Win',
    tagline: "Position your recommendation — don't just present it",
    accentColor: '#1a4731',
    bgColor: '#d8f0de',
    stepLabel: 'Step 4 of 4',
    sub: "Position your recommendation — don't just present it",
    body: "Great analysis that can't be communicated doesn't ship. Positioning means framing your recommendation for the decision-maker's context — not your own. They need a story, not a spreadsheet.",
    expert: {
      initials: 'AD',
      name: 'April Dunford · Obviously Awesome',
      role: 'Author, positioning strategist',
      quote: '"Positioning isn\'t about what you build — it\'s the context you create so your audience instantly understands why yours is the right answer. Engineers forget that the decision-maker needs a story, not a spreadsheet."',
    },
    scenario: {
      label: 'Applied — B2B SaaS notifications',
      text: 'Instead of "we should build a Slack bot (RICE: 118)," you say: "For our enterprise users who run operations in Slack, this replaces their current workflow of switching back to our app — and we can validate it in one sprint." Approved in the meeting.',
    },
    hatchMessage: "Engineers think the win is building the right thing. Product thinkers know the win is getting the right thing built. Those are different skills — and this step is where you develop the second one.",
    cards: [
      {
        title: "A decision no one hears isn't a decision",
        body: "You can Frame the problem perfectly, List every option, and pick the right one — and still fail if you can't land it with the people who need to act on it.",
        highlight: 'Clarity is a product deliverable.',
      },
      {
        title: 'BLUF: recommendation first, evidence after',
        body: "Win is the move where you land your recommendation with clarity and conviction. Bottom Line Up Front — the room knows what you're recommending before you've shown a single data point.",
        highlight: "If they need to read to the end to understand your point, rewrite.",
      },
      {
        title: 'Handling pushback without losing the thread',
        body: "The Win move is absorbing a constraint and redirecting it into the plan, not fighting it or folding.",
        highlight: "A brilliant product call that can't be communicated isn't a product call.",
      },
      {
        title: 'Win in the wild',
        body: exampleBody('Convince your CEO to invest in auth refactor over 3 features.', '"Auth refactor is the safer bet this quarter. Three features assume the current auth holds — it won\'t past 50K users. We\'d ship features onto a cracking foundation. Refactor now unblocks all three features in Q2 with half the risk."'),
      },
    ],
  },
]

// ── Worked example data ────────────────────────────────────────
const WORKED = [
  {
    symbol: 'F',
    title: "Frame — What's the real job?",
    body: "The question isn't \"which feature?\" — it's why daily active listening dropped among 18-24s. Discovery data shows choice paralysis: too many options, no clear starting point. The real job is reducing friction-to-first-listen, not adding more surfaces.",
    chips: ['JTBD reframe', 'Not "which feature"', 'Discovery data'],
  },
  {
    symbol: 'L',
    title: 'List — Open the space',
    body: "Solutions generated: AI DJ, social feed, contextual playlists (morning/gym/focus), \"continue from friends\" widget, mood-based radio, one-tap start from home screen. That's six options — not two. The original framing collapsed the solution space prematurely.",
    chips: ['6 options', 'Opportunity tree', 'Expanded framing'],
  },
  {
    symbol: 'O',
    title: 'Optimize — Score with evidence',
    body: 'RICE: AI DJ scores 94 — high reach, proven listen-through rate in beta, medium effort. Social feed scores 41 — low confidence, failed twice before. Contextual playlists score 67. AI DJ wins clearly, with data behind it.',
    chips: ['RICE scoring', 'Beta data', 'AI DJ wins at 94'],
  },
  {
    symbol: 'W',
    title: 'Win — Position to get buy-in',
    body: 'Not: "We should build AI DJ (RICE: 94) instead of the social feed." Instead: "For our Gen Z listeners who stall on the home screen, the AI DJ replaces the decision they currently dread. Beta cohort shows 23% lift in listen-through. We can prove Q3 impact in a 4-week sprint." One read, clear yes.',
    chips: ['Outcome-first', 'Named alternative', 'Validation plan'],
  },
]

// ── SVG Illustrations ──────────────────────────────────────────
function FrameBeforeSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="4" y="6" width="34" height="20" rx="5" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.2"/>
      <text x="21" y="19" textAnchor="middle" fontSize="8" fill="#3D6B4F" fontFamily="inherit">Add spinner</text>
      <rect x="32" y="24" width="34" height="20" rx="5" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.2"/>
      <text x="49" y="37" textAnchor="middle" fontSize="8" fill="#3D6B4F" fontFamily="inherit">Faster API</text>
      <rect x="14" y="44" width="34" height="20" rx="5" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.2"/>
      <text x="31" y="57" textAnchor="middle" fontSize="8" fill="#3D6B4F" fontFamily="inherit">Cache layer</text>
    </svg>
  )
}
function FrameMoveSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <circle cx="40" cy="34" r="22" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.5"/>
      <text x="40" y="30" textAnchor="middle" fontSize="9" fill="#3D6B4F" fontFamily="inherit">Why do</text>
      <text x="40" y="42" textAnchor="middle" fontSize="9" fill="#3D6B4F" fontFamily="inherit">they leave?</text>
      <line x1="62" y1="14" x2="72" y2="6" stroke="#4A7C59" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18" y1="34" x2="4" y2="34" stroke="#4A7C59" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="62" y1="54" x2="72" y2="62" stroke="#4A7C59" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function FrameAfterSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="8" y="8" width="64" height="52" rx="8" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1"/>
      <text x="40" y="28" textAnchor="middle" fontSize="9" fill="#3D6B4F" fontFamily="inherit">Problem:</text>
      <text x="40" y="41" textAnchor="middle" fontSize="8" fill="#3D6B4F" fontFamily="inherit">Users don&apos;t trust</text>
      <text x="40" y="52" textAnchor="middle" fontSize="8" fill="#3D6B4F" fontFamily="inherit">that the save worked</text>
    </svg>
  )
}
function ListBeforeSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <line x1="40" y1="8" x2="40" y2="56" stroke="#705C30" strokeWidth="2" strokeDasharray="4 3"/>
      <circle cx="40" cy="56" r="10" fill="#F5E6C8" stroke="#705C30" strokeWidth="1.5"/>
      <text x="40" y="60" textAnchor="middle" fontSize="8" fill="#705C30" fontFamily="inherit">Push</text>
      <rect x="14" y="4" width="52" height="13" rx="4" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <text x="40" y="13.5" textAnchor="middle" fontSize="8" fill="#705C30" fontFamily="inherit">Keep teams in sync</text>
    </svg>
  )
}
function ListMoveSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="22" y="4" width="36" height="12" rx="4" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <text x="40" y="13" textAnchor="middle" fontSize="8" fill="#705C30" fontFamily="inherit">In sync</text>
      <line x1="40" y1="16" x2="14" y2="28" stroke="#705C30" strokeWidth="1.2"/>
      <line x1="40" y1="16" x2="40" y2="28" stroke="#705C30" strokeWidth="1.2"/>
      <line x1="40" y1="16" x2="66" y2="28" stroke="#705C30" strokeWidth="1.2"/>
      <rect x="2" y="28" width="24" height="11" rx="3" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <text x="14" y="36.5" textAnchor="middle" fontSize="7" fill="#705C30" fontFamily="inherit">Push notif</text>
      <rect x="28" y="28" width="24" height="11" rx="3" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <text x="40" y="36.5" textAnchor="middle" fontSize="7" fill="#705C30" fontFamily="inherit">Slack bot</text>
      <rect x="54" y="28" width="24" height="11" rx="3" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <text x="66" y="36.5" textAnchor="middle" fontSize="7" fill="#705C30" fontFamily="inherit">Digest</text>
      <line x1="14" y1="39" x2="14" y2="48" stroke="#705C30" strokeWidth="1"/>
      <rect x="2" y="48" width="24" height="11" rx="3" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <text x="14" y="56.5" textAnchor="middle" fontSize="7" fill="#705C30" fontFamily="inherit">Activity log</text>
    </svg>
  )
}
function ListAfterSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="6" y="4" width="68" height="12" rx="3" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <text x="40" y="12.5" textAnchor="middle" fontSize="8" fill="#705C30" fontFamily="inherit">Push notifs</text>
      <rect x="6" y="20" width="68" height="12" rx="3" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <text x="40" y="28.5" textAnchor="middle" fontSize="8" fill="#705C30" fontFamily="inherit">Slack / Teams bot</text>
      <rect x="6" y="36" width="68" height="12" rx="3" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <text x="40" y="44.5" textAnchor="middle" fontSize="8" fill="#705C30" fontFamily="inherit">Daily digest email</text>
      <rect x="6" y="52" width="68" height="12" rx="3" fill="#F5E6C8" stroke="#705C30" strokeWidth="1"/>
      <text x="40" y="60.5" textAnchor="middle" fontSize="8" fill="#705C30" fontFamily="inherit">In-app activity feed</text>
    </svg>
  )
}
function OptBeforeSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="6" y="38" width="18" height="22" rx="3" fill="#FDE8D8" stroke="#C05020" strokeWidth="1"/>
      <rect x="30" y="38" width="18" height="22" rx="3" fill="#FDE8D8" stroke="#C05020" strokeWidth="1"/>
      <rect x="54" y="38" width="18" height="22" rx="3" fill="#FDE8D8" stroke="#C05020" strokeWidth="1"/>
      <text x="15" y="36" textAnchor="middle" fontSize="7" fill="#8B4513" fontFamily="inherit">Push</text>
      <text x="39" y="36" textAnchor="middle" fontSize="7" fill="#8B4513" fontFamily="inherit">Slack</text>
      <text x="63" y="36" textAnchor="middle" fontSize="7" fill="#8B4513" fontFamily="inherit">Digest</text>
      <text x="40" y="16" textAnchor="middle" fontSize="9" fill="#8B4513" fontFamily="inherit">Which one?</text>
      <text x="40" y="28" textAnchor="middle" fontSize="8" fill="#8B4513" fontFamily="inherit" opacity=".5">¯\_(ツ)_/¯</text>
    </svg>
  )
}
function OptMoveSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="6" y="6" width="68" height="12" rx="3" fill="#FDE8D8"/>
      <text x="14" y="15" fontSize="8" fill="#8B4513" fontFamily="inherit">Reach</text>
      <rect x="40" y="7" width="28" height="10" rx="2" fill="#F5B89A"/>
      <rect x="6" y="22" width="68" height="12" rx="3" fill="#FDE8D8"/>
      <text x="14" y="31" fontSize="8" fill="#8B4513" fontFamily="inherit">Impact</text>
      <rect x="40" y="23" width="20" height="10" rx="2" fill="#F5B89A"/>
      <rect x="6" y="38" width="68" height="12" rx="3" fill="#FDE8D8"/>
      <text x="14" y="47" fontSize="8" fill="#8B4513" fontFamily="inherit">Confidence</text>
      <rect x="40" y="39" width="24" height="10" rx="2" fill="#F5B89A"/>
      <rect x="6" y="54" width="68" height="12" rx="3" fill="#FDE8D8"/>
      <text x="14" y="63" fontSize="8" fill="#8B4513" fontFamily="inherit">Effort</text>
      <rect x="40" y="55" width="10" height="10" rx="2" fill="#F5B89A"/>
    </svg>
  )
}
function OptAfterSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="6" y="44" width="18" height="18" rx="3" fill="#FDE8D8" stroke="#C05020" strokeWidth="1"/>
      <rect x="30" y="14" width="18" height="48" rx="3" fill="#8B4513"/>
      <rect x="54" y="34" width="18" height="28" rx="3" fill="#FDE8D8" stroke="#C05020" strokeWidth="1"/>
      <text x="15" y="40" textAnchor="middle" fontSize="7" fill="#8B4513" fontFamily="inherit">Push</text>
      <text x="39" y="10" textAnchor="middle" fontSize="7" fill="#8B4513" fontFamily="inherit">Slack</text>
      <text x="63" y="30" textAnchor="middle" fontSize="7" fill="#8B4513" fontFamily="inherit">Digest</text>
    </svg>
  )
}
function WinBeforeSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <circle cx="20" cy="28" r="12" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.2"/>
      <text x="20" y="32" textAnchor="middle" fontSize="9" fill="#3D6B4F" fontFamily="inherit">You</text>
      <rect x="40" y="12" width="34" height="36" rx="6" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1"/>
      <text x="57" y="28" textAnchor="middle" fontSize="8" fill="#3D6B4F" fontFamily="inherit">RICE</text>
      <text x="57" y="38" textAnchor="middle" fontSize="8" fill="#3D6B4F" fontFamily="inherit">= 118</text>
      <line x1="32" y1="28" x2="40" y2="28" stroke="#4A7C59" strokeWidth="1.2" strokeDasharray="3 2"/>
      <text x="57" y="56" textAnchor="middle" fontSize="8" fill="#3D6B4F" fontFamily="inherit" opacity=".4">...silence</text>
    </svg>
  )
}
function WinMoveSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <rect x="4" y="6" width="72" height="14" rx="4" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1"/>
      <text x="40" y="16" textAnchor="middle" fontSize="8.5" fill="#3D6B4F" fontFamily="inherit">For teams using Slack</text>
      <rect x="4" y="24" width="72" height="14" rx="4" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1"/>
      <text x="40" y="34" textAnchor="middle" fontSize="8" fill="#3D6B4F" fontFamily="inherit">who hate tab-switching</text>
      <rect x="4" y="42" width="72" height="18" rx="4" fill="#4A7C59"/>
      <text x="40" y="53.5" textAnchor="middle" fontSize="8.5" fill="#FAF6F0" fontFamily="inherit">our bot vs. copy-paste</text>
    </svg>
  )
}
function WinAfterSVG() {
  return (
    <svg width="80" height="68" viewBox="0 0 80 68" fill="none">
      <circle cx="40" cy="30" r="22" fill="#E8F1EC" stroke="#4A7C59" strokeWidth="1.5"/>
      <polyline points="28,31 35,40 52,20" stroke="#4A7C59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <text x="40" y="60" textAnchor="middle" fontSize="10" fill="#3D6B4F" fontFamily="inherit" fontWeight="600">Shipped.</text>
    </svg>
  )
}

const STORYBOARD_SVGS: Record<FlowMove, { before: React.ReactNode; move: React.ReactNode; after: React.ReactNode }> = {
  frame: { before: <FrameBeforeSVG />, move: <FrameMoveSVG />, after: <FrameAfterSVG /> },
  list: { before: <ListBeforeSVG />, move: <ListMoveSVG />, after: <ListAfterSVG /> },
  optimize: { before: <OptBeforeSVG />, move: <OptMoveSVG />, after: <OptAfterSVG /> },
  win: { before: <WinBeforeSVG />, move: <WinMoveSVG />, after: <WinAfterSVG /> },
}

// ── Auth Modal ─────────────────────────────────────────────────
function AuthModal({ moveLabel, onClose }: { moveLabel: string; onClose: () => void }) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/explore/flow')
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
          emailRedirectTo: `${window.location.origin}/onboarding/welcome`,
        }
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else if (data.session) {
        router.push('/explore/flow')
      } else {
        setSuccess("Check your email to confirm your account.")
        setLoading(false)
      }
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/learn/flow` }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer"
      style={{ background: 'rgba(46,50,48,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-sm p-6 relative cursor-default" onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0" }}>close</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <HatchGlyph size={28} state="speaking" className="text-primary shrink-0" />
          <span className="font-headline font-bold text-primary">hackproduct</span>
        </div>
        <p className="font-body text-sm text-on-surface-variant mb-5">
          Practice <strong className="text-on-surface">{moveLabel}</strong> on a real challenge — free.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-surface-container rounded-full w-fit mb-5">
          {(['signup', 'login'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              className={`px-5 py-1.5 rounded-full font-label text-sm font-semibold transition-all ${
                mode === m ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {m === 'signup' ? 'Sign up' : 'Log in'}
            </button>
          ))}
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-2 border border-outline-variant rounded-full py-2.5 text-on-surface text-sm font-medium hover:bg-surface-container transition-colors mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-outline-variant" />
          <span className="font-label text-xs text-on-surface-variant">or</span>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Your name"
              className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors text-sm"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Email"
            className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Password"
            className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors text-sm"
          />
          {mode === 'login' && (
            <div className="text-right">
              <a href="/forgot-password" className="font-label text-xs text-primary hover:underline">Forgot password?</a>
            </div>
          )}
          {error && <p className="text-xs text-error">{error}</p>}
          {success && <p className="text-xs text-primary">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary rounded-full py-2.5 font-label font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? '...' : mode === 'login' ? 'Log In' : 'Create free account'}
          </button>
        </form>

        <p className="font-label text-xs text-on-surface-variant text-center mt-4">Free to try · No credit card</p>
      </div>
    </div>
  )
}

// ── Hatch Rail ──────────────────────────────────────────────────
function HatchRail({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className="sticky top-24 hidden lg:block transition-all duration-400"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(20px)' }}
    >
      <div className="bg-inverse-surface rounded-2xl rounded-bl-sm p-4 mb-3">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-inverse-on-surface opacity-40 mb-2">Hatch</p>
        <p className="text-sm text-inverse-on-surface leading-relaxed">{message}</p>
      </div>
      <div className="flex justify-center">
        <div style={{ animation: 'hatchFloat 3s ease-in-out infinite' }}>
          <HatchGlyph size={56} state="speaking" className="text-primary" />
        </div>
      </div>
      <style>{`@keyframes hatchFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`}</style>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function FlowMarketingPage() {
  const [activePill, setActivePill] = useState<FlowMove | null>(null)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const [openWorked, setOpenWorked] = useState<number | null>(null)
  const [authModal, setAuthModal] = useState<string | null>(null) // move label or null

  useEffect(() => {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id
        if (entry.isIntersecting) {
          setVisibleSections(prev => new Set([...prev, id]))
          if (['frame', 'list', 'optimize', 'win'].includes(id)) {
            setActivePill(id as FlowMove)
          }
        }
      })
    }, { threshold: 0.15 })

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0')
          entry.target.classList.remove('opacity-0', 'translate-y-4')
        }
      })
    }, { threshold: 0.1 })

    document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el))
    document.querySelectorAll('[data-section]').forEach(el => sectionObserver.observe(el))

    return () => { sectionObserver.disconnect(); revealObserver.disconnect() }
  }, [])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Auth Modal ─────────────────────────────────────────── */}
      {authModal && <AuthModal moveLabel={authModal} onClose={() => setAuthModal(null)} />}

      {/* ── Marketing Nav ──────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-outline-variant">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-headline font-bold text-lg text-primary">hackproduct</Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAuthModal('FLOW')}
              className="border border-outline-variant text-on-surface rounded-full px-4 py-2 font-label font-bold text-sm hover:bg-surface-container transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => setAuthModal('FLOW')}
              className="bg-primary text-on-primary rounded-full px-4 py-2 font-label font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-start gap-4">
          <HatchGlyph size={48} state="speaking" className="text-primary shrink-0 mt-1" />
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">HackProduct · The Framework</p>
            <h1 className="font-headline text-4xl font-bold text-on-surface leading-tight mb-2">
              FLOW — <span className="text-on-surface-variant font-normal italic">how product thinkers think</span>
            </h1>
            <p className="font-body text-base text-on-surface-variant leading-relaxed max-w-xl">
              Most engineers solve the stated problem brilliantly. Product thinking is about finding the right problem before writing a single line of code. FLOW is the four-move playbook that gets you there.
            </p>
          </div>
        </div>
      </div>

      {/* ── Pain Section ───────────────────────────────────────── */}
      <div className="bg-surface-container-low py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-6 flex items-center gap-3">
            <span className="w-6 h-px bg-on-surface-variant/40 inline-block" />
            The situation every engineer recognizes
          </p>

          <div
            data-reveal
            className="bg-surface-container rounded-xl p-6 shadow-sm mb-6 opacity-0 translate-y-4 transition-all duration-500"
          >
            <p className="font-body text-base text-on-surface leading-relaxed mb-3">
              Your PM walks over and says: <em className="text-on-surface-variant">&ldquo;Users are complaining about slow load times. Can we add a loading spinner?&rdquo;</em>
            </p>
            <p className="font-body text-base text-on-surface leading-relaxed mb-3">
              The old you says: <em className="text-on-surface-variant">&ldquo;Sure, I&apos;ll have it by tomorrow.&rdquo;</em>
            </p>
            <p className="font-body text-base text-on-surface leading-relaxed">
              The product-thinking you pauses. <strong className="text-primary">Because you know the spinner isn&apos;t the problem — it&apos;s a symptom.</strong> And shipping a symptom fix is how engineers spend careers building the wrong things brilliantly.
            </p>
          </div>

          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">
            FLOW gives you four moves that separate the engineers who get promoted from the ones who stay heads-down forever. It&apos;s not a template — it&apos;s a way of thinking.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MOVES.map((m, i) => (
              <button
                key={m.key}
                onClick={() => scrollTo(m.key)}
                data-reveal
                className="bg-surface-container rounded-xl p-4 text-center hover:bg-surface-container-high transition-colors opacity-0 translate-y-4"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="font-headline text-3xl font-bold text-primary mb-1">{m.symbol}</div>
                <span className="font-label text-sm font-bold text-on-surface block">{m.label}</span>
                <span className="font-label text-xs text-on-surface-variant">{m.tagline.replace(/"/g, '').replace(/'/g, '')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Step Sections ──────────────────────────────────────── */}
      {MOVES.map((move, index) => {
        const svgs = STORYBOARD_SVGS[move.key]
        const isEven = index % 2 === 0
        const isVisible = visibleSections.has(move.key)

        const PANEL_DATA = [
          {
            tag: 'Before',
            tagColor: 'text-on-surface-variant',
            border: 'border-outline-variant',
            svg: svgs.before,
            copy: index === 0
              ? 'Three solutions in three seconds. None answer the actual question — because nobody asked the actual question yet.'
              : index === 1
              ? 'One problem, one solution, shipped by Thursday. This is feature thinking at its most efficient — and most dangerous.'
              : index === 2
              ? 'All three look reasonable. The loudest voice wins. This is how roadmaps become wish lists.'
              : "You've got the data, you share the RICE scores, and get \"interesting, let's think about it.\" Which means no.",
          },
          {
            tag: 'The move',
            tagColor: 'font-bold',
            border: '',
            accentBorder: true,
            svg: svgs.move,
            copy: index === 0
              ? "Ask: what job is this person trying to do? The spinner hides latency. It doesn't fix anxiety about whether the action even worked."
              : index === 1
              ? "Teresa Torres' Opportunity Solution Tree: branch every possibility before scoring any of them. Generate five. Then generate two more."
              : index === 2
              ? 'RICE scoring: score every option on Reach, Impact, Confidence, Effort. Force the conversation from opinion to evidence.'
              : "April Dunford's positioning: who is it for, what's the alternative they live with now, and what's your unique advantage?",
          },
          {
            tag: 'After',
            tagColor: 'text-on-surface-variant',
            border: 'border-outline-variant',
            svg: svgs.after,
            copy: index === 0
              ? '"Slow load times" becomes a trust problem. Now you\'re solving something real — and the solution set gets far more interesting.'
              : index === 1
              ? 'Four distinct options. Each solves the same underlying problem differently. Now you can have an intelligent conversation about tradeoffs.'
              : index === 2
              ? 'Slack integration wins at RICE 118. Push notifs score 42. The number makes the decision obvious — and gives you something to defend.'
              : '"For Slack-native teams, this replaces the copy-paste habit — the thing they currently hate." They get it immediately.',
          },
        ]

        return (
          <div
            key={move.key}
            id={move.key}
            data-section
            className={`py-16 px-6 ${isEven ? 'bg-background' : 'bg-surface-container-low'}`}
          >
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 items-start">

              {/* Left: content */}
              <div>
                <p
                  data-reveal
                  className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-5 flex items-center gap-3 opacity-0 translate-y-4 transition-all duration-500"
                >
                  <span className="w-6 h-px bg-on-surface-variant/40 inline-block" />
                  {move.stepLabel}
                </p>

                {/* Step header */}
                <div
                  data-reveal
                  className="flex items-center gap-4 mb-5 opacity-0 translate-y-4 transition-all duration-500"
                  style={{ transitionDelay: '80ms' }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-headline text-2xl font-bold flex-shrink-0"
                    style={{ background: move.bgColor, color: move.accentColor }}
                  >
                    {move.symbol}
                  </div>
                  <div>
                    <h2 className="font-headline text-3xl font-bold text-on-surface leading-tight">{move.label}</h2>
                    <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mt-0.5">{move.sub}</p>
                  </div>
                </div>

                <p
                  data-reveal
                  className="font-body text-base text-on-surface-variant leading-relaxed mb-6 opacity-0 translate-y-4 transition-all duration-500"
                  style={{ transitionDelay: '120ms' }}
                >
                  {move.body}
                </p>

                {/* 3-panel storyboard */}
                <div
                  data-reveal
                  className="grid grid-cols-3 gap-3 mb-6 opacity-0 translate-y-4 transition-all duration-500"
                  style={{ transitionDelay: '160ms' }}
                >
                  {PANEL_DATA.map((panel, pi) => (
                    <div
                      key={pi}
                      className={`bg-surface-container rounded-xl p-4 border ${panel.accentBorder ? 'border-2' : 'border-outline-variant/50'}`}
                      style={panel.accentBorder ? { borderColor: move.accentColor } : {}}
                    >
                      <p
                        className={`font-label text-[10px] uppercase tracking-widest mb-3 ${panel.accentBorder ? 'font-bold' : 'text-on-surface-variant'}`}
                        style={panel.accentBorder ? { color: move.accentColor } : {}}
                      >
                        {panel.tag}
                      </p>
                      <div className="flex items-center justify-center h-20 mb-3">
                        {panel.svg}
                      </div>
                      <p className="font-body text-xs text-on-surface-variant leading-snug">{panel.copy}</p>
                    </div>
                  ))}
                </div>

                {/* Expert quote */}
                <div
                  data-reveal
                  className="rounded-xl p-4 flex gap-3 mb-4 opacity-0 translate-y-4 transition-all duration-500"
                  style={{ background: move.bgColor, transitionDelay: '200ms' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-label text-xs font-bold flex-shrink-0"
                    style={{ background: move.accentColor + '33', color: move.accentColor }}
                  >
                    {move.expert.initials}
                  </div>
                  <div>
                    <p className="font-label text-sm font-bold text-on-surface">{move.expert.name}</p>
                    <p className="font-label text-xs text-on-surface-variant mb-2">{move.expert.role}</p>
                    <p className="font-headline italic text-base text-on-surface leading-relaxed">{move.expert.quote}</p>
                  </div>
                </div>

                {/* Scenario */}
                <div
                  data-reveal
                  className="border-l-4 pl-4 py-2 mb-6 opacity-0 translate-y-4 transition-all duration-500"
                  style={{ borderColor: move.accentColor, transitionDelay: '240ms' }}
                >
                  <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">{move.scenario.label}</p>
                  <p className="font-body text-sm text-on-surface leading-relaxed">{move.scenario.text}</p>
                </div>

                {/* Conversion CTA (opens auth modal) */}
                <div
                  data-reveal
                  className="opacity-0 translate-y-4 transition-all duration-500"
                  style={{ transitionDelay: '280ms' }}
                >
                  <button
                    onClick={() => setAuthModal(move.label)}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2 font-label font-bold text-sm transition-all border-2"
                    style={{ borderColor: move.accentColor, color: move.accentColor }}
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    Practice {move.label} on a real challenge →
                  </button>
                </div>
              </div>

              {/* Right: Hatch rail */}
              <HatchRail message={move.hatchMessage} visible={isVisible} />
            </div>
          </div>
        )
      })}

      {/* ── Worked Example ─────────────────────────────────────── */}
      <div className="bg-inverse-surface py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="font-label text-xs font-bold uppercase tracking-widest flex items-center gap-3 mb-6" style={{ color: 'rgba(245,240,232,0.5)' }}>
            <span className="w-6 h-px inline-block" style={{ background: 'rgba(245,240,232,0.3)' }} />
            Full FLOW — worked example
          </p>
          <h2 className="font-headline text-4xl font-bold text-inverse-on-surface leading-tight mb-2">
            Spotify&apos;s AI DJ <em className="font-normal" style={{ color: 'rgba(245,240,232,0.55)' }}>decision</em>
          </h2>
          <p className="font-body text-base mb-8 leading-relaxed max-w-xl" style={{ color: 'rgba(245,240,232,0.7)' }}>
            Spotify&apos;s growth team is asked: &ldquo;Should we build the AI DJ or rebuild the social listening feed?&rdquo; Here&apos;s FLOW applied end-to-end.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WORKED.map((item, i) => (
              <button
                key={i}
                onClick={() => setOpenWorked(openWorked === i ? null : i)}
                className="text-left rounded-xl p-5 transition-all duration-200 border"
                style={{
                  background: openWorked === i ? 'rgba(245,240,232,0.1)' : 'rgba(245,240,232,0.05)',
                  borderColor: openWorked === i ? 'rgba(245,240,232,0.35)' : 'rgba(245,240,232,0.2)',
                }}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-headline text-2xl text-inverse-on-surface">{item.symbol}</span>
                  <span className="font-label text-sm font-bold text-inverse-on-surface flex-1">{item.title}</span>
                  <div
                    className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-transform duration-250"
                    style={{
                      borderColor: 'rgba(245,240,232,0.3)',
                      transform: openWorked === i ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}
                  >
                    <span className="material-symbols-outlined text-xs text-inverse-on-surface" style={{ fontVariationSettings: "'FILL' 0" }}>add</span>
                  </div>
                </div>
                {openWorked === i && (
                  <div className="mt-3 pt-3 border-t text-left" style={{ borderColor: 'rgba(245,240,232,0.2)' }}>
                    <p className="font-body text-sm leading-relaxed mb-3" style={{ color: 'rgba(245,240,232,0.7)' }}>{item.body}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.chips.map(chip => (
                        <span
                          key={chip}
                          className="font-label text-xs px-3 py-1 rounded-full"
                          style={{ background: 'rgba(245,240,232,0.12)', color: 'rgba(245,240,232,0.7)' }}
                        >
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
      </div>

      {/* ── CTA Section ────────────────────────────────────────── */}
      <div className="py-20 px-6 text-center">
        <div className="max-w-lg mx-auto">
          <p className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center justify-center gap-3">
            <span className="w-6 h-px bg-on-surface-variant/40 inline-block" />
            Ready to practice
          </p>
          <h2 className="font-headline text-4xl font-bold text-on-surface leading-tight mb-3">
            Put FLOW to work on a real challenge
          </h2>
          <p className="font-body text-base text-on-surface-variant leading-relaxed mb-8">
            Every HackProduct challenge runs you through all four moves — graded on how well you frame, list, optimize, and win. No multiple choice. No templates. Just your thinking, scored.
          </p>
          <div className="flex gap-3 justify-center flex-wrap mb-4">
            <button
              onClick={() => setAuthModal('FLOW')}
              className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-6 py-3 font-label font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Create free account
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
            </button>
          </div>
          <p className="font-label text-xs text-on-surface-variant tracking-wide">Free to try · No credit card · 10 min per challenge</p>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="border-t border-outline-variant py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <span className="font-headline font-bold text-primary">hackproduct</span>
          <p className="font-label text-xs text-on-surface-variant">© 2025 HackProduct. All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={() => setAuthModal('FLOW')} className="font-label text-xs text-on-surface-variant hover:text-primary transition-colors">Sign Up</button>
            <Link href="/flow" className="font-label text-xs text-on-surface-variant hover:text-primary transition-colors">Framework</Link>
          </div>
        </div>
      </div>

    </div>
  )
}
