// The ad-creative manifest: every creative the compositor renders.
// Full 7-series matrix. Hooks here ARE the final ad copy; render.mjs refuses
// to render anything that fails compliance-lint.mjs.
//
// UTM scheme (captured by src/lib/lead-magnets/utm.ts on the destination):
//   utm_source={tiktok|instagram} utm_medium=paid_social
//   utm_campaign=lm-{series}-{yyyymm} utm_content={creative-id}

/** @typedef {{
 *  id: string,
 *  series: 'graded'|'looking-for'|'meter'|'duel'|'egg'|'contrarian'|'salary',
 *  template: 'poster'|'graded-card'|'meter'|'duel'|'job-post'|'carousel-slide',
 *  hook: { eyebrow?: string, headline: string, sub?: string, cta: string },
 *  pose: string | null,
 *  poseSize?: number,
 *  palette?: 'cream'|'forest-inverse',
 *  ratios: ('9x16'|'4x5'|'1x1')[],
 *  destination: { slug: string, instant: boolean },
 *  data?: Record<string, unknown>,
 * }} AdCreative */

/** @type {AdCreative[]} */
export const CREATIVES = [
  // ── S1: Hatch graded it → /go/spot-the-flaw/i ───────────────────────────
  {
    id: 'graded-second-sentence-a',
    series: 'graded',
    template: 'graded-card',
    hook: {
      headline: 'Hatch graded a real interview answer.',
      sub: 'The mistake is in the second sentence. Most people read past it.',
      cta: 'Spot it yourself',
    },
    pose: 'hatch-red-pen-b.png',
    ratios: ['9x16', '1x1'],
    destination: { slug: 'spot-the-flaw', instant: true },
    data: {
      stamp: '4/10 · Surface',
      answer:
        'I would add an AI assistant to the dashboard. {Users love AI features right now}, and it would differentiate us from competitors fast.',
    },
  },
  {
    id: 'graded-sounds-smart-a',
    series: 'graded',
    template: 'graded-card',
    hook: {
      headline: 'This answer sounds smart. It still got a no.',
      sub: 'Hatch circled the reason. Interviewers see it in seconds.',
      cta: 'Train the eye',
    },
    pose: 'hatch-stamp-a.png',
    ratios: ['9x16', '1x1'],
    destination: { slug: 'spot-the-flaw', instant: true },
    data: {
      stamp: 'Rejected',
      answer:
        'We should ship the faster checkout because {a better experience always wins} and users clearly prefer speed.',
    },
  },

  // ── S2: We're looking for… → /go/ai-pm-readiness/i ──────────────────────
  {
    id: 'lookingfor-tradeoffs-a',
    series: 'looking-for',
    template: 'job-post',
    hook: {
      headline: 'Every senior posting has this line now.',
      sub: 'Ninety seconds tells you whether it is about you.',
      cta: 'Take the 5-tap test',
    },
    pose: 'hatch-peek-a.png',
    ratios: ['9x16', '4x5', '1x1'],
    destination: { slug: 'ai-pm-readiness', instant: true },
    data: { phrase: 'thinks in tradeoffs, not tickets' },
  },
  {
    id: 'lookingfor-product-sense-a',
    series: 'looking-for',
    template: 'job-post',
    hook: {
      headline: '14,000 job posts ask for it. Almost none define it.',
      sub: 'Hatch defines it in five questions.',
      cta: 'See the definition',
    },
    pose: 'hatch-magnify-a.png',
    ratios: ['9x16', '4x5', '1x1'],
    destination: { slug: 'ai-pm-readiness', instant: true },
    data: { phrase: 'strong product sense required' },
  },

  // ── S3: Where do you land? → /go/failure-mode/i (retargeting) ───────────
  {
    id: 'meter-four-taps-a',
    series: 'meter',
    template: 'meter',
    hook: {
      headline: 'Four taps put you on this meter.',
      sub: 'Most engineers land in the middle band. The top band is one habit away.',
      cta: 'Find your band',
    },
    pose: 'hatch-point-side-a.png',
    ratios: ['9x16', '4x5', '1x1'],
    destination: { slug: 'failure-mode', instant: true },
    data: { bands: ['Surface', 'Solid', 'Sharp'], needlePct: 58 },
  },
  {
    id: 'meter-before-interviewer-a',
    series: 'meter',
    template: 'meter',
    hook: {
      headline: 'Hatch sorted thousands of answers into three bands.',
      sub: 'Find yours before an interviewer does.',
      cta: 'Take the test',
    },
    pose: 'hatch-point-side-a.png',
    ratios: ['9x16', '1x1'],
    destination: { slug: 'failure-mode', instant: true },
    data: { bands: ['Surface', 'Solid', 'Sharp'], needlePct: 44 },
  },

  // ── S4: Beat Hatch → /go/teardown/i ─────────────────────────────────────
  {
    id: 'duel-bets-you-miss-a',
    series: 'duel',
    template: 'duel',
    hook: {
      headline: 'Hatch has graded ten thousand product calls.',
      cta: 'Prove it wrong',
    },
    pose: 'hatch-smug-a.png',
    ratios: ['9x16', '1x1'],
    destination: { slug: 'teardown', instant: true },
    data: {
      hatchLine: 'It bets you miss this one.',
      youLine: 'Your call goes here.',
    },
  },
  {
    id: 'duel-undefeated-a',
    series: 'duel',
    template: 'duel',
    hook: {
      headline: 'Two real product decisions. Ninety seconds.',
      cta: 'Your move',
    },
    pose: 'hatch-smug-a.png',
    ratios: ['9x16', '1x1'],
    destination: { slug: 'teardown', instant: true },
    data: {
      hatchLine: 'Hatch is undefeated this week.',
      youLine: 'Most people get one of two.',
    },
  },

  // ── S5: The egg → /go/failure-mode/i ────────────────────────────────────
  {
    id: 'egg-four-taps-a',
    series: 'egg',
    template: 'poster',
    hook: {
      eyebrow: 'A 90-second test',
      headline: 'Tap four times. See what hatches.',
      sub: 'Four product scenarios. Your thinking style cracks out at the end.',
      cta: 'Crack yours',
    },
    pose: 'hatch-sit-egg-a.png',
    poseSize: 520,
    ratios: ['9x16', '1x1'],
    destination: { slug: 'failure-mode', instant: true },
  },
  {
    id: 'egg-crack-in-prep-a',
    series: 'egg',
    template: 'poster',
    palette: 'forest-inverse',
    hook: {
      eyebrow: 'Find it before an interviewer does',
      headline: 'Every prep has a crack in it.',
      sub: 'Four taps find yours. No signup to see the result.',
      cta: 'Find the crack',
    },
    pose: 'hatch-peek-a.png',
    poseSize: 440,
    ratios: ['9x16', '1x1'],
    destination: { slug: 'failure-mode', instant: true },
  },

  // ── S6: 2023 prep → /go/ai-pm-readiness/i ───────────────────────────────
  {
    id: 'contrarian-star-stories-a',
    series: 'contrarian',
    template: 'poster',
    hook: {
      eyebrow: 'The round changed',
      headline: 'Stop rehearsing STAR stories.',
      sub: 'The 2026 product round grades a different muscle. Five questions show you which one.',
      cta: 'See the new round',
    },
    pose: 'hatch-megaphone-a.png',
    poseSize: 440,
    ratios: ['9x16', '4x5'],
    destination: { slug: 'ai-pm-readiness', instant: true },
  },
  {
    id: 'contrarian-leetcode-a',
    series: 'contrarian',
    template: 'poster',
    palette: 'forest-inverse',
    hook: {
      eyebrow: 'The round nobody practices',
      headline: 'Leetcode never saved anyone in the product round.',
      sub: 'Hatch grades the round that actually decides AI-era offers.',
      cta: 'Get graded',
    },
    pose: 'hatch-wince-a.png',
    poseSize: 420,
    ratios: ['9x16', '4x5'],
    destination: { slug: 'ai-pm-readiness', instant: true },
  },
  {
    id: 'contrarian-2023-prep-a',
    series: 'contrarian',
    template: 'poster',
    hook: {
      eyebrow: 'Worth checking',
      headline: 'The prep that worked in 2023 is why strong engineers hear no in 2026.',
      sub: 'Five questions show you the swap.',
      cta: 'Check your prep',
    },
    pose: 'hatch-think-a.png',
    poseSize: 420,
    ratios: ['9x16', '4x5'],
    destination: { slug: 'ai-pm-readiness', instant: true },
  },

  // ── S7: Salary bands (citation-framed ONLY) → /go/salary/i ──────────────
  {
    id: 'salary-one-round-a',
    series: 'salary',
    template: 'meter',
    hook: {
      headline: 'Levels.fyi publishes the bands. The gap between two bands is usually one interview round.',
      sub: 'Two questions tell you whether to push your offer.',
      cta: 'Should you push?',
    },
    pose: 'hatch-present-a.png',
    ratios: ['4x5', '1x1'],
    destination: { slug: 'salary', instant: true },
    data: {
      bands: ['Band N', 'Band N+1', 'Band N+2'],
      needlePct: 38,
      citation: 'bands: levels.fyi',
    },
  },
  {
    id: 'salary-recruiters-know-a',
    series: 'salary',
    template: 'meter',
    hook: {
      headline: 'Recruiters know your band before you do.',
      sub: 'Hatch needs exactly two inputs to tell you whether to push.',
      cta: 'Get the read',
    },
    pose: 'hatch-point-side-a.png',
    ratios: ['4x5', '1x1'],
    destination: { slug: 'salary', instant: true },
    data: {
      bands: ['Band N', 'Band N+1', 'Band N+2'],
      needlePct: 35,
      citation: 'bands: levels.fyi',
    },
  },

  // ── Carousels (rendered as one slide per entry-index) ────────────────────
  ...carousel('carousel-graded', 'graded', { slug: 'spot-the-flaw', instant: true }, 'Spot the flaw', [
    { kind: 'hook', eyebrow: 'Can you see it?', text: 'This answer stumps most engineers in the first read.' },
    { kind: 'question', text: 'A checkout test: Variant A cuts abandonment 18% but adds 40 seconds. Variant B is faster but moves nothing. The candidate answered:' },
    {
      kind: 'options',
      options: [
        'Ship A, abandonment is revenue.',
        'Ship B, faster always feels better.',
        'Name the deciding metric first, then model both.',
        'Run a third variant combining both.',
      ],
    },
    { kind: 'distribution', stat: '23%', text: 'of engineers pick the answer an interviewer scores as strong. Most pick the one that only sounds strong.' },
    { kind: 'cta', text: 'Ten real answers. Tap the flaw, Hatch shows the rejection reason.', cta: 'Train the eye' },
  ]),
  ...carousel('carousel-duel', 'duel', { slug: 'teardown', instant: true }, 'Beat Hatch', [
    { kind: 'hook', eyebrow: 'A challenge', text: 'Hatch calls real product decisions in ten seconds. Think you read them faster?' },
    { kind: 'question', text: 'A subscription product kills its free tier. Churn spikes for two months, then revenue settles 31% higher. Right call?' },
    {
      kind: 'options',
      options: [
        'Wrong: churn is the leading indicator.',
        'Right: the revenue base got healthier.',
        'Wrong: free tiers are acquisition engines.',
        'Cannot tell without cohort data.',
      ],
    },
    { kind: 'distribution', stat: '2 of 3', text: 'decisions is what most engineers get right. Hatch is waiting on the third.' },
    { kind: 'cta', text: 'Two real decisions stand between you and bragging rights.', cta: 'Your move' },
  ]),
]

function carousel(idBase, series, destination, ctaLabel, slides) {
  return slides.map((slide, i) => ({
    id: `${idBase}-slide${i + 1}`,
    series,
    template: 'carousel-slide',
    hook: { headline: slide.text ?? idBase, cta: ctaLabel },
    pose: slide.kind === 'cta' ? 'hatch-wave-cta-b.png' : null,
    ratios: ['1x1'],
    destination,
    data: { slide, index: i + 1, total: slides.length },
  }))
}

export function destinationUrl(c, source = 'instagram') {
  const yyyymm = '202606'
  const base = `https://www.hackproduct.com/go/${c.destination.slug}${c.destination.instant ? '/i' : ''}`
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: 'paid_social',
    utm_campaign: `lm-${c.series}-${yyyymm}`,
    utm_content: c.id.replace(/-slide\d$/, ''),
  })
  return `${base}?${params}`
}
