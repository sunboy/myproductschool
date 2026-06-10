// The Hatch ad-pose library spec.
//
// Poses are generated FROM the official mascot reference (style-bible rule:
// never prompt-only): public/images/hatch/hatch-official-mascot.png.
// Generation runs through the Codex companion (user's subscription); the
// gpt-image-1 API script scripts/hatch-art/generate-pose.mjs is the fallback.
//
// Hard constraints for every pose (the trait lock):
//  - rounded forest-green head frame, cream face and body
//  - graduation cap on the head, upward growth arrow near the cap
//  - green H mark on the chest, simple mitten hands
//  - bright friendly cartoon eyes with simple highlights
//  - flat clean vector-like illustration, crisp edges, no gradients, no 3D
//  - transparent background, NO text anywhere in the image, no extra objects
//    beyond the pose's named prop
//
// Reject list (regenerate on any): changed head shape, missing cap/arrow/
// H-mark, photoreal or painterly texture, extra fingers, baked-in text,
// non-transparent background.

export const POSES = [
  // ── Pilot set (S1 "Hatch graded it" + S5 "The egg" + CTA end-card) ──
  {
    name: 'hatch-red-pen',
    series: ['graded', 'contrarian'],
    pilot: true,
    prompt:
      'reading a blank white sheet of paper held in one mitten hand, holding a large red marker in the other, one eyebrow raised in appraisal, body angled slightly toward the sheet',
  },
  {
    name: 'hatch-stamp',
    series: ['graded'],
    pilot: true,
    prompt:
      'mid-motion slamming a large wooden rubber stamp downward with both mitten hands, energetic squash-and-stretch feel, the stamp face is blank',
  },
  {
    name: 'hatch-sit-egg',
    series: ['egg'],
    pilot: true,
    prompt:
      'sitting calmly cross-armed on top of a giant cream egg that has a single hairline zigzag crack, content expression, the egg takes the lower half of the image',
  },
  {
    name: 'hatch-peek',
    series: ['looking-for', 'egg'],
    pilot: true,
    prompt:
      'peeking over a horizontal edge at the bottom of the frame, only the head, eyes and two mitten hands gripping the edge are visible, curious wide eyes',
  },
  {
    name: 'hatch-wave-cta',
    series: ['all-end-cards'],
    pilot: true,
    prompt:
      'waving warmly at the viewer with one mitten hand while the other points downward at empty space below, friendly open smile',
  },

  // ── Full set (post-pilot) ──
  {
    name: 'hatch-clipboard',
    series: ['graded'],
    pilot: false,
    prompt:
      'holding a blank clipboard out toward the viewer with both mitten hands, appraising look',
  },
  {
    name: 'hatch-point-side',
    series: ['meter', 'salary'],
    pilot: false,
    prompt:
      'pointing emphatically to its left at empty space with one mitten arm fully extended, focused expression',
  },
  {
    name: 'hatch-smug',
    series: ['duel'],
    pilot: false,
    prompt:
      'arms crossed, confident smirk, slight head tilt, one eyebrow up, challenger energy',
  },
  {
    name: 'hatch-megaphone',
    series: ['contrarian'],
    pilot: false,
    prompt:
      'shouting into a plain blank megaphone held with both mitten hands, energetic wide stance, motion lines absent',
  },
  {
    name: 'hatch-magnify',
    series: ['graded'],
    pilot: false,
    prompt:
      'leaning forward inspecting something below the frame through a large magnifying glass, one eye comically enlarged through the lens',
  },
  {
    name: 'hatch-think',
    series: ['carousel'],
    pilot: false,
    prompt:
      'mitten hand on chin, eyes looking up and to the side, weighing two invisible options, thoughtful',
  },
  {
    name: 'hatch-present',
    series: ['carousel', 'salary'],
    pilot: false,
    prompt:
      'both mitten palms open and presenting upward toward empty space above, game-show host energy, proud smile',
  },
  {
    name: 'hatch-wince',
    series: ['graded', 'contrarian'],
    pilot: false,
    prompt:
      'holding a blank card at arm’s length and wincing at it sympathetically, the reaction is directed at the card it holds, not at the viewer',
  },
]

export const REFERENCE = 'public/images/hatch/hatch-official-mascot.png'
export const OUT_DIR = 'public/images/hatch/ad-poses'
export const CANDIDATES_PER_POSE = 2

export function fullPrompt(pose) {
  return (
    `Redraw this exact mascot character in a new pose: ${pose.prompt}. ` +
    'Keep every character trait identical to the reference: rounded forest-green head frame, cream face and cream body, ' +
    'graduation cap on top of the head, upward growth arrow near the cap, green H mark on the chest, ' +
    'bright friendly cartoon eyes with simple highlights, simple mitten hands, friendly coach expression. ' +
    'Flat clean vector-like illustration, crisp edges, no gradients, no 3D, no photorealism, no texture. ' +
    'Transparent background. No text anywhere in the image, no shadow, no objects beyond the pose itself.'
  )
}
