#!/usr/bin/env node
// Generates the Hatch egg Lottie animations:
//   public/lottie/hatch/egg-idle.json   - gentle bob + wiggle loop (pre-tap state)
//   public/lottie/hatch/egg-hatch.json  - wobble, crack, shell pop, Hatch springs out
//
// Vector Hatch geometry is translated from src/components/shell/HatchGlyph.tsx
// (viewBox 0 0 64 72), scaled 4x, origin moved to the glyph's visual center
// (32, 38). Brand palette per the Hatch visual style bible.
//
// Run: node scripts/lottie/build-hatch-lottie.mjs

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../public/lottie/hatch')

// ── Palette (0-1 RGBA) ─────────────────────────────────────
const rgba = (hex, a = 1) => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a]
}
const FOREST = rgba('#4a7c59')
const CREAM = rgba('#f5f1ea')
const EGG_CREAM = rgba('#faf6f0')
const GOLD = rgba('#c4a66a')
const LIGHT_GREEN = rgba('#8ecf9e')
const MIST = rgba('#dfe6dc')

// ── Lottie helpers ─────────────────────────────────────────
const stat = (k) => ({ a: 0, k })
const EASE_OUT = { i: { x: [0.2], y: [1] }, o: { x: [0.4], y: [0] } }
const EASE_IN_OUT = { i: { x: [0.55], y: [1] }, o: { x: [0.45], y: [0] } }
/** keyframed property: pairs of [t, value], smooth ease by default */
const anim = (pairs, ease = EASE_IN_OUT) => ({
  a: 1,
  k: pairs.map(([t, v], i) =>
    i === pairs.length - 1
      ? { t, s: Array.isArray(v) ? v : [v] }
      : { t, s: Array.isArray(v) ? v : [v], ...ease },
  ),
})

const trIdentity = { ty: 'tr', p: stat([0, 0]), a: stat([0, 0]), s: stat([100, 100]), r: stat(0), o: stat(100) }
const group = (nm, items, tr = {}) => ({ ty: 'gr', nm, it: [...items, { ...trIdentity, ...tr }] })
const ellipse = (p, s) => ({ ty: 'el', p: stat(p), s: stat(s) })
const rect = (p, s, r = 0) => ({ ty: 'rc', p: stat(p), s: stat(s), r: stat(r) })
const fill = (c, o = 100) => ({ ty: 'fl', c: stat(c), o: stat(o) })
const stroke = (c, w, o = 100) => ({ ty: 'st', c: stat(c), w: stat(w), o: stat(o), lc: 2, lj: 2 })
/** open/closed bezier path. verts absolute; tangents relative (default 0 = polyline) */
const path = (verts, { closed = false, i, o } = {}) => ({
  ty: 'sh',
  ks: stat({
    c: closed,
    v: verts,
    i: i ?? verts.map(() => [0, 0]),
    o: o ?? verts.map(() => [0, 0]),
  }),
})
const layer = (nm, shapes, ks, { ip = 0, op = 9999 } = {}) => ({
  ddd: 0, ty: 4, nm, ip, op, st: 0,
  ks: { o: stat(100), r: stat(0), p: stat([0, 0, 0]), a: stat([0, 0, 0]), s: stat([100, 100, 100]), ...ks },
  shapes,
})

// ── Egg geometry (composition 512x512) ─────────────────────
// Egg body: bezier blob, center (0,0) in its own space; placed at (256, 318).
const EGG_W = 92 // half-width
const EGG_TOP = -125
const EGG_BOT = 112
const eggPath = (vScale = 1) =>
  path(
    [[0, EGG_TOP * vScale], [EGG_W, -8], [0, EGG_BOT], [-EGG_W, -8]],
    {
      closed: true,
      i: [[-52, 0], [0, -62], [56, 0], [0, 64]],
      o: [[52, 0], [0, 64], [-56, 0], [0, -62]],
    },
  )

const speckles = group('speckles', [
  group('s1', [ellipse([-34, -52], [10, 10]), fill(GOLD, 55)]),
  group('s2', [ellipse([30, -24], [8, 8]), fill(GOLD, 45)]),
  group('s3', [ellipse([-18, 36], [12, 12]), fill(GOLD, 40)]),
  group('s4', [ellipse([40, 52], [9, 9]), fill(GOLD, 50)]),
])

const eggWhole = (nm = 'egg') =>
  group(nm, [eggPath(), fill(EGG_CREAM), stroke(FOREST, 8)])

// Zigzag crack across the egg (y ~ -10 band)
const crackShape = path(
  [[-78, -16], [-44, 4], [-16, -22], [12, 6], [40, -18], [70, -2]],
)

// Shell halves: same egg outline, split by the zigzag.
const shellTop = group('shell-top', [
  path(
    [[0, EGG_TOP], [EGG_W - 4, -14], [70, -2], [40, -18], [12, 6], [-16, -22], [-44, 4], [-78, -16], [-(EGG_W - 4), -14]],
    {
      closed: true,
      i: [[-52, 0], [0, -40], ...Array(7).fill([0, 0])],
      o: [[52, 0], [0, 0], ...Array(7).fill([0, 0])],
    },
  ),
  fill(EGG_CREAM),
  stroke(FOREST, 8),
])

const shellBottom = group('shell-bottom', [
  path(
    [[-78, -16], [-44, 4], [-16, -22], [12, 6], [40, -18], [70, -2], [EGG_W - 2, 0], [0, EGG_BOT], [-(EGG_W - 2), 0]],
    {
      closed: true,
      i: [...Array(6).fill([0, 0]), [0, -28], [56, 0], [0, 36]],
      o: [...Array(6).fill([0, 0]), [0, 36], [-56, 0], [0, -28]],
    },
  ),
  fill(EGG_CREAM),
  stroke(FOREST, 8),
])

const shadow = (nm = 'shadow') =>
  group(nm, [ellipse([0, 0], [180, 34]), fill(MIST, 80)])

// ── Vector Hatch (scale 4x of HatchGlyph, origin at glyph [32,38]) ──
const G = (x, y) => [(x - 32) * 4, (y - 38) * 4]

// Shape order: earlier entries render ON TOP, so face features come first,
// then the head plate, then the ear nubs poking out the sides.
const hatchBody = [
  // delighted eyes: happy arches (quadratic-ish curves), stroked
  group('eye-l', [
    path([G(22, 37), G(25, 33.4), G(28, 37)], {
      i: [[0, 0], [-6, 0], [0, 0]],
      o: [[0, 0], [6, 0], [0, 0]],
    }),
    stroke(FOREST, 10),
  ]),
  group('eye-r', [
    path([G(36, 37), G(39, 33.4), G(42, 37)], {
      i: [[0, 0], [-6, 0], [0, 0]],
      o: [[0, 0], [6, 0], [0, 0]],
    }),
    stroke(FOREST, 10),
  ]),
  // wide smile
  group('smile', [
    path([G(26, 43.5), G(32, 47.5), G(38, 43.5)], {
      i: [[0, 0], [-13, 0], [0, 0]],
      o: [[0, 0], [13, 0], [0, 0]],
    }),
    stroke(FOREST, 10),
  ]),
  // head
  group('head', [rect(G(32, 37), [144, 120], 32), fill(CREAM), stroke(FOREST, 12)]),
  // ear nubs
  group('ear-l', [rect(G(11, 37), [24, 40], 12), fill(FOREST)]),
  group('ear-r', [rect(G(53, 37), [24, 40], 12), fill(FOREST)]),
]

const hatchCap = [
  group('cap-brim', [
    path([G(18, 22), G(46, 22), G(50, 16), G(14, 16)], { closed: true }),
    fill(FOREST),
  ]),
  group('cap-board', [rect(G(32, 16), [80, 48], 4), fill(FOREST)]),
  group('cap-button', [ellipse(G(32, 10), [12, 12]), fill(FOREST)]),
  group('tassel-line', [path([G(42, 12), G(46, 18)]), stroke(FOREST, 6)]),
  group('tassel-ball', [ellipse(G(46, 19), [12, 12]), fill(FOREST)]),
  // growth arrow
  group('arrow-line', [path([G(48, 18), G(54, 10)]), stroke(LIGHT_GREEN, 10)]),
  group('arrow-head', [path([G(50, 10), G(54, 10), G(54, 14)]), stroke(LIGHT_GREEN, 10)]),
]

// Sparkle burst pieces: [angleDeg, dist, size, color, startFrame]
// Burst originates above the head and radiates outward in a ring so the
// sparkles frame Hatch rather than landing on the face.
const SPARKS = [
  [-150, 215, 14, GOLD, 56],
  [-115, 235, 10, LIGHT_GREEN, 59],
  [-80, 225, 16, GOLD, 57],
  [-45, 235, 11, LIGHT_GREEN, 61],
  [-15, 215, 13, GOLD, 58],
  [-175, 195, 9, LIGHT_GREEN, 62],
  [-65, 265, 9, GOLD, 63],
  [-105, 270, 12, GOLD, 60],
]
const sparkLayers = SPARKS.map(([deg, dist, size, color, t0], idx) => {
  const rad = (deg * Math.PI) / 180
  const from = [256 + Math.cos(rad) * 120, 200 + Math.sin(rad) * 120]
  const to = [256 + Math.cos(rad) * dist, 200 + Math.sin(rad) * dist]
  return layer(
    `spark-${idx}`,
    [group('spark', [ellipse([0, 0], [size, size]), fill(color)])],
    {
      p: anim([[t0, [...from, 0]], [t0 + 22, [...to, 0]]], EASE_OUT),
      s: anim([[t0, [0, 0, 100]], [t0 + 8, [130, 130, 100]], [t0 + 26, [0, 0, 100]]], EASE_OUT),
      o: anim([[t0, 100], [t0 + 20, 100], [t0 + 26, 0]]),
    },
    { ip: t0, op: t0 + 28 },
  )
})

// ── egg-hatch.json ─────────────────────────────────────────
const HATCH_OP = 168
const eggHatch = {
  v: '5.7.0', fr: 60, ip: 0, op: HATCH_OP, w: 512, h: 512,
  nm: 'hatch-egg-reveal',
  assets: [],
  slots: { bgColor: { p: stat([1, 1, 1, 0]) } },
  layers: [
    ...sparkLayers,

    // Cap + arrow: pops slightly higher mid-flight, lands seated on the head
    // (same final transform as the body so there is never a resting gap).
    layer('hatch-cap', hatchCap, {
      p: anim(
        [[40, [256, 424, 0]], [58, [256, 230, 0]], [64, [256, 244, 0]], [76, [256, 252, 0]], [HATCH_OP, [256, 252, 0]]],
        EASE_OUT,
      ),
      s: anim([[40, [55, 55, 100]], [62, [104, 104, 100]], [74, [100, 100, 100]]], EASE_OUT),
      o: anim([[38, 0], [44, 100]]),
    }, { ip: 38 }),

    // Hatch body springs out; final pose tucks the chin into the shell cup.
    layer('hatch-body', hatchBody, {
      p: anim(
        [[40, [256, 424, 0]], [58, [256, 236, 0]], [68, [256, 260, 0]], [78, [256, 252, 0]], [HATCH_OP, [256, 252, 0]]],
        EASE_OUT,
      ),
      s: anim([[40, [55, 55, 100]], [62, [104, 104, 100]], [74, [100, 100, 100]]], EASE_OUT),
      o: anim([[38, 0], [44, 100]]),
    }, { ip: 38 }),

    // Bottom shell cup: sits in front of Hatch; small bounce when the top pops.
    layer('shell-bottom', [shellBottom], {
      p: anim([[36, [256, 318, 0]], [44, [256, 332, 0]], [52, [256, 324, 0]], [HATCH_OP, [256, 324, 0]]], EASE_OUT),
      o: anim([[35, 0], [36, 100]]),
    }, { ip: 35 }),

    // Top shell: launches up-left, spins, fades.
    layer('shell-top', [shellTop], {
      p: anim([[36, [256, 318, 0]], [60, [132, 96, 0]], [78, [110, 140, 0]]], EASE_OUT),
      r: anim([[36, 0], [70, -56]], EASE_OUT),
      o: anim([[35, 0], [36, 100], [66, 100], [80, 0]]),
    }, { ip: 35, op: 82 }),

    // Crack zigzag: flashes on during the final wobble.
    layer('crack', [group('crack', [crackShape, stroke(FOREST, 7)])], {
      p: stat([256, 318, 0]),
      o: anim([[24, 0], [28, 100], [35, 100], [36, 0]]),
    }, { ip: 24, op: 37 }),

    // Whole egg: anticipation squash, wobble, pop, then swapped for the halves.
    layer('egg', [speckles, eggWhole()], {
      a: stat([0, EGG_BOT, 0]),
      p: stat([256, 318 + EGG_BOT, 0]),
      r: anim([[8, 0], [14, -7], [20, 6], [26, -5], [31, 4], [35, 0]]),
      s: anim([[0, [100, 100, 100]], [5, [104, 96, 100]], [10, [100, 100, 100]], [30, [100, 100, 100]], [34, [106, 106, 100]], [36, [102, 102, 100]]]),
      o: anim([[35, 100], [36, 0]]),
    }, { op: 37 }),

    // Ground shadow: squashes with the wobble, widens when Hatch lands.
    layer('shadow', [shadow()], {
      p: stat([256, 446, 0]),
      s: anim([[0, [100, 100, 100]], [14, [108, 90, 100]], [28, [96, 104, 100]], [40, [112, 96, 100]], [70, [100, 100, 100]]]),
    }),

    // Player-compat background (transparent by default via slot).
    {
      ddd: 0, ty: 4, nm: 'background', ip: 0, op: HATCH_OP, st: 0,
      ks: { o: stat(100), r: stat(0), p: stat([256, 256, 0]), a: stat([0, 0, 0]), s: stat([100, 100, 100]) },
      shapes: [group('bg', [rect([0, 0], [512, 512]), { ty: 'fl', c: { sid: 'bgColor' }, o: stat(100) }])],
    },
  ],
}

// ── egg-idle.json (loop) ───────────────────────────────────
const IDLE_OP = 180
const eggIdle = {
  v: '5.7.0', fr: 60, ip: 0, op: IDLE_OP, w: 512, h: 512,
  nm: 'hatch-egg-idle',
  assets: [],
  slots: { bgColor: { p: stat([1, 1, 1, 0]) } },
  layers: [
    layer('egg', [speckles, eggWhole()], {
      a: stat([0, EGG_BOT, 0]),
      p: anim([[0, [256, 318 + EGG_BOT, 0]], [45, [256, 312 + EGG_BOT, 0]], [90, [256, 318 + EGG_BOT, 0]], [IDLE_OP, [256, 318 + EGG_BOT, 0]]]),
      // a curious little wiggle partway through the loop
      r: anim([[0, 0], [96, 0], [102, -4], [108, 3.5], [114, -2], [120, 0], [IDLE_OP, 0]]),
    }),
    layer('shadow', [shadow()], {
      p: stat([256, 446, 0]),
      s: anim([[0, [100, 100, 100]], [45, [92, 94, 100]], [90, [100, 100, 100]], [IDLE_OP, [100, 100, 100]]]),
    }),
    {
      ddd: 0, ty: 4, nm: 'background', ip: 0, op: IDLE_OP, st: 0,
      ks: { o: stat(100), r: stat(0), p: stat([256, 256, 0]), a: stat([0, 0, 0]), s: stat([100, 100, 100]) },
      shapes: [group('bg', [rect([0, 0], [512, 512]), { ty: 'fl', c: { sid: 'bgColor' }, o: stat(100) }])],
    },
  ],
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(join(OUT_DIR, 'egg-hatch.json'), JSON.stringify(eggHatch))
writeFileSync(join(OUT_DIR, 'egg-idle.json'), JSON.stringify(eggIdle))
console.log('Wrote egg-hatch.json (%d frames) and egg-idle.json (%d frames) to %s', HATCH_OP, IDLE_OP, OUT_DIR)
