// Quiz config for the /go/salary lead magnet.
// Decision tool: "Should I push this offer?" — not a comp database.
// Step 1: inputs (profile). Step 2: MCQ (leverage situation).
// deriveResult is deterministic from a transparent rule table.
// Import-safe on both server and client: no server-only deps.

import type { MagnetQuizConfig, QuizAnswers } from '@/lib/lead-magnets/quiz-types'

// ── Directional comp bands ───────────────────────────────────────────────────
// Written as directional synthesis of public comp data. The tool's value is
// the push/hold signal, not the band. Ranges are intentionally wide.

type CompKey = `${string}|${string}|${string}` // role|level|region

const COMP_BANDS: Record<CompKey, string> = {
  // PM — US tier-1
  'pm|entry|us-t1': 'roughly $120k to $165k base; equity is typically 4-year with a 1-year cliff',
  'pm|mid|us-t1': 'roughly $155k to $210k base; equity refreshes vary significantly by company',
  'pm|senior|us-t1': 'roughly $185k to $260k base; equity varies more than base at this level',
  'pm|staff|us-t1': 'roughly $230k to $320k base; total comp swings heavily on equity and bonus',

  // PM — US other
  'pm|entry|us-other': 'roughly $95k to $140k base; meaningful step down from tier-1 hubs',
  'pm|mid|us-other': 'roughly $125k to $175k base; some remote-first companies pay at hub rates',
  'pm|senior|us-other': 'roughly $150k to $215k base; depends heavily on whether the company remote-adjusts',
  'pm|staff|us-other': 'roughly $185k to $265k base; staff roles in non-hubs are less common',

  // PM — Europe
  'pm|entry|europe': 'roughly €55k to €85k base; London skews higher, closer to $110k to $140k USD equivalent',
  'pm|mid|europe': 'roughly €75k to €115k base; London and Amsterdam push toward the top of the range',
  'pm|senior|europe': 'roughly €100k to €160k base; equity is less standardised than in the US',
  'pm|staff|europe': 'roughly €140k to €220k base; staff PM roles outside London are rare',

  // PM — India
  'pm|entry|india': 'roughly ₹18L to ₹30L CTC; product-track PMs at startups can exceed this range',
  'pm|mid|india': 'roughly ₹30L to ₹55L CTC; FAANG equivalent roles often add significant equity',
  'pm|senior|india': 'roughly ₹50L to ₹90L CTC; wide variance across company type and funding stage',
  'pm|staff|india': 'roughly ₹80L to ₹140L CTC; uncommon outside Bangalore and Hyderabad',

  // PM — other
  'pm|entry|other': 'highly variable by market; treat any number you hear as directional at best',
  'pm|mid|other': 'highly variable by market; local purchasing power and cost of living dominate the number',
  'pm|senior|other': 'highly variable by market; publicly available data is thin for most non-US, non-EU markets',
  'pm|staff|other': 'highly variable by market; staff PM roles are uncommon in most markets outside the US and UK',

  // AI PM — US tier-1
  'ai-pm|entry|us-t1': 'roughly $135k to $185k base; AI-focused roles carry a small premium over general PM',
  'ai-pm|mid|us-t1': 'roughly $175k to $235k base; demand is outpacing supply at mid-level',
  'ai-pm|senior|us-t1': 'roughly $210k to $290k base; senior AI PMs at labs and frontier companies can go higher',
  'ai-pm|staff|us-t1': 'roughly $260k to $380k base; equity dominates total comp at staff level in AI',

  // AI PM — US other
  'ai-pm|entry|us-other': 'roughly $110k to $155k base; remote-first AI companies sometimes match hub rates',
  'ai-pm|mid|us-other': 'roughly $145k to $195k base; the AI premium shrinks slightly outside major hubs',
  'ai-pm|senior|us-other': 'roughly $175k to $240k base; remote-first AI companies are flattening the geo gap',
  'ai-pm|staff|us-other': 'roughly $215k to $300k base; staff AI PM roles in non-hubs are uncommon',

  // AI PM — Europe
  'ai-pm|entry|europe': 'roughly €65k to €100k base; London and Berlin lead; equity is less liquid',
  'ai-pm|mid|europe': 'roughly €90k to €140k base; demand from AI startups is pushing mid-level rates up',
  'ai-pm|senior|europe': 'roughly €125k to €190k base; a wide range reflects how early the market is',
  'ai-pm|staff|europe': 'roughly €165k to €250k base; equity at European AI labs is still maturing in structure',

  // AI PM — India
  'ai-pm|entry|india': 'roughly ₹22L to ₹38L CTC; AI-product roles at funded startups can sit above this',
  'ai-pm|mid|india': 'roughly ₹38L to ₹68L CTC; FAANG AI roles and well-funded AI startups command premium',
  'ai-pm|senior|india': 'roughly ₹65L to ₹110L CTC; the AI PM market in India is early and moving fast',
  'ai-pm|staff|india': 'roughly ₹95L to ₹160L CTC; few staff AI PM roles exist outside leading companies',

  // AI PM — other
  'ai-pm|entry|other': 'highly variable; AI PM as a defined role is still forming outside major markets',
  'ai-pm|mid|other': 'highly variable; treat any benchmark as directional',
  'ai-pm|senior|other': 'highly variable; publicly available data is limited',
  'ai-pm|staff|other': 'highly variable; staff AI PM roles are rare outside the US and UK',

  // TPM — US tier-1
  'tpm|entry|us-t1': 'roughly $130k to $175k base; TPM entry roles at large tech companies often include equity',
  'tpm|mid|us-t1': 'roughly $165k to $225k base; mid-level TPMs with cross-functional scope command a premium',
  'tpm|senior|us-t1': 'roughly $195k to $265k base; senior TPMs at FAANG sit at the upper end',
  'tpm|staff|us-t1': 'roughly $240k to $340k base; principal TPM roles exist at very few companies',

  // TPM — US other
  'tpm|entry|us-other': 'roughly $105k to $150k base; non-hub TPM roles are common in fintech and enterprise',
  'tpm|mid|us-other': 'roughly $135k to $185k base; enterprise and fintech companies outside hubs are active hirers',
  'tpm|senior|us-other': 'roughly $165k to $225k base; depends heavily on company type',
  'tpm|staff|us-other': 'roughly $205k to $280k base; rare outside tech hubs and major enterprise companies',

  // TPM — Europe
  'tpm|entry|europe': 'roughly €55k to €85k base; London sits higher, closer to $105k to $135k USD equivalent',
  'tpm|mid|europe': 'roughly €80k to €120k base; enterprise-focused companies are the main TPM employers',
  'tpm|senior|europe': 'roughly €110k to €165k base; program management at scale is valued differently than in the US',
  'tpm|staff|europe': 'roughly €145k to €215k base; staff TPM roles are uncommon outside large enterprises',

  // TPM — India
  'tpm|entry|india': 'roughly ₹20L to ₹35L CTC; TPM roles at large tech companies include equity components',
  'tpm|mid|india': 'roughly ₹35L to ₹60L CTC; Bangalore and Hyderabad dominate TPM hiring',
  'tpm|senior|india': 'roughly ₹55L to ₹95L CTC; senior TPMs at FAANG GICs command a premium',
  'tpm|staff|india': 'roughly ₹85L to ₹145L CTC; principal TPM roles are rare',

  // TPM — other
  'tpm|entry|other': 'highly variable by market',
  'tpm|mid|other': 'highly variable by market',
  'tpm|senior|other': 'highly variable by market',
  'tpm|staff|other': 'highly variable by market',

  // Engineer moving to PM — US tier-1
  'eng-to-pm|entry|us-t1': 'roughly $120k to $165k base; associate PM programs at large companies anchor the entry point',
  'eng-to-pm|mid|us-t1': 'roughly $155k to $210k base; engineers with strong product instincts often start here',
  'eng-to-pm|senior|us-t1': 'roughly $185k to $255k base; engineers moving in with 5+ years of experience can negotiate at this level',
  'eng-to-pm|staff|us-t1': 'roughly $225k to $315k base; uncommon for a direct transition; typically requires prior PM experience',

  // Engineer moving to PM — US other
  'eng-to-pm|entry|us-other': 'roughly $95k to $140k base',
  'eng-to-pm|mid|us-other': 'roughly $125k to $170k base',
  'eng-to-pm|senior|us-other': 'roughly $150k to $210k base',
  'eng-to-pm|staff|us-other': 'roughly $185k to $260k base',

  // Engineer moving to PM — Europe
  'eng-to-pm|entry|europe': 'roughly €50k to €80k base; transition roles often start lower while you build PM history',
  'eng-to-pm|mid|europe': 'roughly €75k to €115k base; engineering background is valued for technical PM roles',
  'eng-to-pm|senior|europe': 'roughly €100k to €155k base; strong technical PMs with domain depth command a premium',
  'eng-to-pm|staff|europe': 'roughly €135k to €205k base; rare for first-transition PMs',

  // Engineer moving to PM — India
  'eng-to-pm|entry|india': 'roughly ₹18L to ₹30L CTC; APM programs at product-led companies are the entry path',
  'eng-to-pm|mid|india': 'roughly ₹28L to ₹52L CTC; engineering background often accelerates technical PM roles',
  'eng-to-pm|senior|india': 'roughly ₹48L to ₹85L CTC',
  'eng-to-pm|staff|india': 'roughly ₹75L to ₹130L CTC',

  // Engineer moving to PM — other
  'eng-to-pm|entry|other': 'highly variable by market',
  'eng-to-pm|mid|other': 'highly variable by market',
  'eng-to-pm|senior|other': 'highly variable by market',
  'eng-to-pm|staff|other': 'highly variable by market',
}

// Fallback band for any combo not explicitly listed.
const FALLBACK_COMP_BAND =
  'directional data is limited for this profile combination; the push/hold signal is more reliable than the number range'

export function getCompBand(role: string, level: string, region: string): string {
  const key = `${role}|${level}|${region}` as CompKey
  return COMP_BANDS[key] ?? FALLBACK_COMP_BAND
}

export const METHODOLOGY_NOTE =
  'These ranges are a directional synthesis of publicly reported compensation data from surveys, offer-sharing communities, and recruiter benchmarks. The purpose of this tool is not to give you a precise number — it is to give you a push or hold signal, and a starting frame for the conversation. Real offers vary by company size, funding stage, business unit, and negotiating leverage. Treat the range as a reference point, not a target.'

// ── Scoring rule table ───────────────────────────────────────────────────────
// Transparent rules the result card can surface to the user.

// Alternatives dimension
// multiple offers: +3, still-expecting: -1, one offer: 0
// Leverage MCQ
// fine-competing: +3, fine-no-competing: +2, need-to-move: +1, between-roles: 0
// Seniority bonus
// senior or staff: +1

function scoreAlternatives(offers: string): number {
  if (offers === 'multiple') return 3
  if (offers === 'expecting') return -1
  return 0 // 'one' or unrecognised
}

function scoreLeverage(leverage: string): number {
  if (leverage === 'fine-competing') return 3
  if (leverage === 'fine-no-competing') return 2
  if (leverage === 'need-to-move') return 1
  return 0 // 'between-roles'
}

function scoreSeniority(level: string): number {
  if (level === 'senior' || level === 'staff') return 1
  return 0
}

// Timing dimension: derived from leverage MCQ choice.
// fine-competing / fine-no-competing = low pressure = high timing score.
// need-to-move = medium pressure. between-roles = high pressure.
function scoreTiming(leverage: string): number {
  if (leverage === 'fine-competing' || leverage === 'fine-no-competing') return 3
  if (leverage === 'need-to-move') return 1
  return 0 // between-roles
}

// ── Quiz config ──────────────────────────────────────────────────────────────

export const salaryQuizConfig: MagnetQuizConfig = {
  magnet: 'salary',
  version: 1,
  steps: [
    {
      kind: 'inputs',
      id: 'profile',
      prompt: 'Tell us about your situation.',
      fields: [
        {
          id: 'role',
          label: 'Role',
          type: 'select',
          options: [
            { value: 'pm', label: 'PM' },
            { value: 'ai-pm', label: 'AI PM' },
            { value: 'tpm', label: 'TPM' },
            { value: 'eng-to-pm', label: 'Engineer moving to PM' },
          ],
        },
        {
          id: 'level',
          label: 'Level',
          type: 'select',
          options: [
            { value: 'entry', label: 'Entry' },
            { value: 'mid', label: 'Mid' },
            { value: 'senior', label: 'Senior' },
            { value: 'staff', label: 'Staff or principal' },
          ],
        },
        {
          id: 'region',
          label: 'Region',
          type: 'select',
          options: [
            { value: 'us-t1', label: 'US tier-1 hub (SF, NYC, Seattle)' },
            { value: 'us-other', label: 'US other' },
            { value: 'europe', label: 'Europe' },
            { value: 'india', label: 'India' },
            { value: 'other', label: 'Other' },
          ],
        },
        {
          id: 'offers',
          label: 'Offer situation',
          type: 'select',
          options: [
            { value: 'one', label: 'One offer in hand' },
            { value: 'multiple', label: 'Multiple offers in hand' },
            { value: 'expecting', label: 'Still expecting more offers' },
          ],
        },
      ],
    },
    {
      kind: 'mcq',
      id: 'leverage',
      prompt: 'Which best describes your situation?',
      options: [
        {
          id: 'fine-competing',
          text: 'My current role is fine and I have a competing offer or real alternative.',
          scores: { leverage: 3 },
        },
        {
          id: 'fine-no-competing',
          text: 'My current role is fine, but I have no competing offer.',
          scores: { leverage: 2 },
        },
        {
          id: 'need-to-move',
          text: 'I need to make a move within the next two months.',
          scores: { leverage: 1 },
        },
        {
          id: 'between-roles',
          text: 'I am currently between roles.',
          scores: { leverage: 0 },
        },
      ],
    },
  ],

  deriveResult(answers: QuizAnswers) {
    const profileAnswers =
      typeof answers.profile === 'object' && answers.profile !== null
        ? (answers.profile as Record<string, string>)
        : {}

    const role = String(profileAnswers.role ?? 'pm')
    const level = String(profileAnswers.level ?? 'mid')
    const region = String(profileAnswers.region ?? 'us-t1')
    const offers = String(profileAnswers.offers ?? 'one')

    const leverageMcq = typeof answers.leverage === 'string' ? answers.leverage : 'fine-no-competing'

    const altScore = scoreAlternatives(offers)
    const levScore = scoreLeverage(leverageMcq)
    const senScore = scoreSeniority(level)
    const timScore = scoreTiming(leverageMcq)

    // Push score: sum of alternatives + leverage + seniority bonus.
    const pushScore = altScore + levScore + senScore

    let band: { key: string; label: string; blurb: string }

    if (pushScore >= 5) {
      band = {
        key: 'push-hard',
        label: 'Push, with numbers',
        blurb:
          'Your position has genuine leverage. A calibrated counter backed by a specific number and a reason is low-risk and often effective. Most companies expect a push at this level of leverage and are holding room precisely because of it.',
      }
    } else if (pushScore >= 3) {
      band = {
        key: 'push-once',
        label: 'One calibrated push',
        blurb:
          'Push once, clearly and without hedging. Name a specific number, give one reason, and then stop. The risk of a second ask in your situation outweighs the incremental upside. One clean ask is the right move.',
      }
    } else {
      band = {
        key: 'hold',
        label: 'Hold and build leverage',
        blurb:
          'Pushing from this position is more likely to slow the process than improve the outcome. The smarter play is to accept what is on the table, perform well, and negotiate from a position of demonstrated leverage in six to twelve months.',
      }
    }

    const directionalBand = getCompBand(role, level, region)

    return {
      band,
      dimensions: [
        { key: 'leverage', label: 'Leverage', value: Math.max(0, levScore + senScore), max: 4 },
        { key: 'timing', label: 'Timing', value: timScore, max: 3 },
        { key: 'alternatives', label: 'Alternatives', value: Math.max(0, altScore), max: 3 },
      ],
      recommendedNext: {
        label: 'Practice the negotiation conversation',
        href: '/challenges',
      },
      detail: {
        directionalBand,
        methodology: METHODOLOGY_NOTE,
        role,
        level,
        region,
        offers,
        leverageMcq,
        pushScore,
      },
    }
  },
}
