// The ad-creative manifest: every creative the compositor renders.
// PILOT BATCH: S1 "Hatch graded it" + S5 "The egg", 2 hooks each, 2 ratios.
// The full 7-series matrix lands after the pilot review gate.
//
// UTM scheme (captured by src/lib/lead-magnets/utm.ts on the destination):
//   utm_source={tiktok|instagram} utm_medium=paid_social
//   utm_campaign=lm-{series}-{yyyymm} utm_content={creative-id}-{ratio}

/** @typedef {{
 *  id: string,
 *  series: 'graded'|'looking-for'|'meter'|'duel'|'egg'|'contrarian'|'salary',
 *  template: 'poster'|'graded-card'|'meter'|'duel'|'job-post'|'carousel-slide',
 *  hook: { eyebrow?: string, headline: string, sub?: string, cta: string },
 *  pose: string | null,             // file in public/images/hatch/ad-poses/ (or pieces/)
 *  poseSize?: number,
 *  palette?: 'cream'|'forest-inverse',
 *  ratios: ('9x16'|'4x5'|'1x1')[],
 *  destination: { slug: string, instant: boolean },
 *  data?: Record<string, unknown>,
 * }} AdCreative */

/** @type {AdCreative[]} */
export const CREATIVES = [
  // ── S1: Hatch graded it ──────────────────────────────────
  {
    id: 'graded-second-sentence-a',
    series: 'graded',
    template: 'graded-card',
    hook: {
      headline: 'Hatch graded a real interview answer.',
      sub: 'The mistake is in the second sentence. Most people read past it.',
      cta: 'Spot it yourself',
    },
    pose: 'hatch-red-pen-a.png',
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
    pose: 'hatch-red-pen-a.png', // TEMP stand-in until hatch-stamp lands
    ratios: ['9x16', '1x1'],
    destination: { slug: 'spot-the-flaw', instant: true },
    data: {
      stamp: 'Rejected',
      answer:
        'We should ship the faster checkout because {a better experience always wins} and users clearly prefer speed.',
    },
  },

  // ── S5: The egg ──────────────────────────────────────────
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
    pose: 'hatch-pop-512.png', // TEMP stand-in until hatch-sit-egg lands
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
    pose: 'hatch-pop-512.png', // TEMP stand-in until hatch-peek lands
    poseSize: 440,
    ratios: ['9x16', '1x1'],
    destination: { slug: 'failure-mode', instant: true },
  },
]

export function destinationUrl(c, source = 'instagram') {
  const yyyymm = '202606'
  const base = `https://www.hackproduct.com/go/${c.destination.slug}${c.destination.instant ? '/i' : ''}`
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: 'paid_social',
    utm_campaign: `lm-${c.series}-${yyyymm}`,
    utm_content: c.id,
  })
  return `${base}?${params}`
}
