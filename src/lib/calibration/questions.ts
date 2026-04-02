import type { OptionQuality } from '@/lib/types'

export interface CalibrationOption {
  id: 'A' | 'B' | 'C' | 'D'
  text: string
  quality: OptionQuality
}

export interface CalibrationQuestion {
  move: 'frame' | 'list' | 'optimize' | 'win'
  q: string
  luma: string
  options: CalibrationOption[]
}

export const QUESTIONS: CalibrationQuestion[] = [
  // ── Frame move ──────────────────────────────
  {
    move: 'frame',
    q: 'You\'re a PM at OpenAI. Leadership just told you Sora is being discontinued — effective in 60 days. What\'s your first move?',
    luma: 'Frame move — I\'m watching how you define the problem before jumping to solutions.',
    options: [
      { id: 'A', text: 'Ask why it\'s being discontinued — cost, safety, low adoption, or strategic pivot? The framing changes everything', quality: 'best' },
      { id: 'B', text: 'Identify who the most affected users are and what they\'ll lose', quality: 'good_but_incomplete' },
      { id: 'C', text: 'Look at usage data to understand whether this is a surprise or something the metrics already showed', quality: 'good_but_incomplete' },
      { id: 'D', text: 'Draft a migration plan to move Sora users to alternative tools', quality: 'plausible_wrong' },
    ],
  },
  {
    move: 'frame',
    q: 'An exec says "Sora failed because the market wasn\'t ready for AI video." How do you respond?',
    luma: 'Still on Frame — how you challenge (or accept) a narrative reveals your instincts.',
    options: [
      { id: 'A', text: '"That\'s a story, not a finding — what data are we looking at to separate market timing from product fit?"', quality: 'best' },
      { id: 'B', text: 'Ask whether competitors in AI video saw similar drop-off, or if this is OpenAI-specific', quality: 'good_but_incomplete' },
      { id: 'C', text: 'Check whether Sora\'s retention curves differed by use case — creators vs. enterprise vs. hobbyists', quality: 'good_but_incomplete' },
      { id: 'D', text: 'Agree to do user interviews before drawing conclusions', quality: 'surface' },
    ],
  },
  // ── List move ───────────────────────────────
  {
    move: 'list',
    q: 'Sora had strong trial signups but low repeat usage. Which user segment do you investigate first?',
    luma: 'List move — I\'m watching how you slice a messy problem into distinct groups.',
    options: [
      { id: 'A', text: 'Users who generated more than 3 videos vs. those who only tried once — behaviour over demographics', quality: 'best' },
      { id: 'B', text: 'Professional creators vs. casual experimenters — different jobs to be done', quality: 'good_but_incomplete' },
      { id: 'C', text: 'Users who came via API vs. the web UI — channel likely signals intent', quality: 'good_but_incomplete' },
      { id: 'D', text: 'Users who churned in week 1 vs. week 4 — timing of drop-off reveals the friction point', quality: 'surface' },
    ],
  },
  {
    move: 'list',
    q: 'You have one query to run before a 30-minute exec readout on why Sora failed. What do you pull?',
    luma: 'Still on List — your first-choice metric tells me how you prioritise signal over noise.',
    options: [
      { id: 'A', text: 'Week-over-week active users split by use case (creative, research, enterprise) — shows where value was and wasn\'t landing', quality: 'best' },
      { id: 'B', text: 'Video generation completion rate — did users start and abandon, or not return after first success?', quality: 'good_but_incomplete' },
      { id: 'C', text: 'Cohort retention at day 1, 7, and 30 — when exactly did users stop coming back?', quality: 'good_but_incomplete' },
      { id: 'D', text: 'NPS from churned users — qualitative signal on the core disappointment', quality: 'surface' },
    ],
  },
  // ── Optimize move ────────────────────────────
  {
    move: 'optimize',
    q: 'You\'ve identified that Sora\'s best users were professional video editors who needed frame-level control. Leadership wants a fix in 6 weeks. What do you cut?',
    luma: 'Optimize move — I\'m watching how you sharpen a solution under real constraints.',
    options: [
      { id: 'A', text: 'Ship frame-level editing only for the top 500 power users as a closed beta — learn before scaling', quality: 'best' },
      { id: 'B', text: 'Cut the 6-week timeline — a half-built feature for professionals will hurt more than help', quality: 'good_but_incomplete' },
      { id: 'C', text: 'Scope down to one workflow (e.g. trim + caption sync) that solves 80% of the professional pain', quality: 'best' },
      { id: 'D', text: 'Negotiate scope with engineering to understand what\'s feasible before committing to anything', quality: 'good_but_incomplete' },
    ],
  },
  {
    move: 'optimize',
    q: 'Three possible bets: (A) re-launch with a freemium tier, (B) pivot to an API-first product for enterprises, (C) double down on creator tools for professional video editors. How do you choose?',
    luma: 'Still on Optimize — how you weigh bets under uncertainty reveals your product judgement.',
    options: [
      { id: 'A', text: 'Run a quick assumption map — list the 2 most critical unknowns for each bet, pick the one with the most validated assumptions', quality: 'best' },
      { id: 'B', text: 'Go where the existing traction points — check which segment had the highest activation rate and double down there', quality: 'good_but_incomplete' },
      { id: 'C', text: 'Freemium is default — it lowers acquisition cost and lets the product speak for itself', quality: 'surface' },
      { id: 'D', text: 'Take it to a leadership review with a one-pager on each option — get alignment before going deep on any', quality: 'surface' },
    ],
  },
  // ── Win move ─────────────────────────────────
  {
    move: 'win',
    q: 'You\'re presenting your recommendation to re-launch Sora as an API-first product to the leadership team. You have 5 minutes. What\'s your opener?',
    luma: 'Win move — I\'m watching how you land an idea with clarity and conviction.',
    options: [
      { id: 'A', text: '"Sora didn\'t fail — it found the wrong customer. Here\'s who actually needs it and what we do next."', quality: 'best' },
      { id: 'B', text: 'Walk through the data story first: signups, drop-off, segment behaviour, then the recommendation', quality: 'good_but_incomplete' },
      { id: 'C', text: 'Open with a competitor doing this well to establish urgency before proposing the pivot', quality: 'surface' },
      { id: 'D', text: 'State the recommendation up front, then spend 4 minutes on the evidence behind it', quality: 'best' },
    ],
  },
  {
    move: 'win',
    q: 'An engineering lead pushes back: "We built Sora for consumers — pivoting to API-first means rewriting the auth layer." How do you respond?',
    luma: 'Still on Win — how you handle a hard pushback in the room is the real test.',
    options: [
      { id: 'A', text: '"That\'s a real constraint — help me understand the scope and we\'ll build it into the roadmap estimate"', quality: 'best' },
      { id: 'B', text: '"We can phase it — ship read-only API access first to validate demand before touching auth"', quality: 'best' },
      { id: 'C', text: 'Acknowledge the concern, park it, and bring it back with a concrete proposal after the meeting', quality: 'surface' },
      { id: 'D', text: '"Fair point — let\'s figure out if there\'s a path that avoids the rewrite before we commit"', quality: 'good_but_incomplete' },
    ],
  },
]

export const QUESTIONS_BY_MOVE = {
  frame:    QUESTIONS.filter(q => q.move === 'frame'),
  list:     QUESTIONS.filter(q => q.move === 'list'),
  optimize: QUESTIONS.filter(q => q.move === 'optimize'),
  win:      QUESTIONS.filter(q => q.move === 'win'),
}
