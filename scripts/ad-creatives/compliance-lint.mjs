// Mechanical compliance gate for ad hooks. render.mjs refuses to render any
// manifest that fails this lint. Rules derived from Meta/TikTok 2026 policy
// research (income claims, personal attributes, before/after) plus the
// HackProduct voice bans.

const RULES = [
  {
    name: 'income promise ("go from X to Y")',
    re: /go from .{1,20}(to|->|→)/i,
  },
  {
    name: 'literal salary figure',
    re: /\$\s?\d{2,3}\s?k\b|\$\d{3,}/i,
  },
  {
    name: 'second-person deficit ("are you struggling/failing/stuck")',
    re: /are you (struggling|failing|stuck|losing|getting rejected)/i,
  },
  {
    name: 'rejection framed at the viewer',
    re: /\byou(r)? (keep|kept) (failing|getting rejected)|still getting rejected/i,
  },
  {
    name: 'before/after framing',
    re: /\bbefore\b.{0,30}\bafter\b/i,
  },
  {
    name: 'em dash (voice ban)',
    re: /—/,
  },
  {
    name: 'AI slop word',
    re: /\b(delve|leverage|utilize|holistic|robust|seamlessly|tailored|game-changing|cutting-edge)\b/i,
  },
  {
    name: 'guaranteed outcome',
    re: /\bguarantee(d)?\b|\bwill get (you )?(hired|the offer)\b/i,
  },
]

/** Returns an array of violations: { creativeId, field, rule, text }. */
export function lintManifest(creatives) {
  const violations = []
  for (const c of creatives) {
    const fields = {
      headline: c.hook?.headline,
      sub: c.hook?.sub,
      eyebrow: c.hook?.eyebrow,
      cta: c.hook?.cta,
      ...(c.data?.slides
        ? Object.fromEntries(c.data.slides.map((s, i) => [`slide${i + 1}`, JSON.stringify(s)]))
        : {}),
      ...(c.data?.answer ? { answer: c.data.answer } : {}),
      ...(c.data?.stamp ? { stamp: c.data.stamp } : {}),
    }
    for (const [field, text] of Object.entries(fields)) {
      if (!text) continue
      for (const rule of RULES) {
        if (rule.re.test(text)) {
          violations.push({ creativeId: c.id, field, rule: rule.name, text })
        }
      }
    }
  }
  return violations
}

// Self-test: `node compliance-lint.mjs --self-test` must flag all seeded bads.
if (process.argv[2] === '--self-test') {
  const seeded = [
    { id: 'bad-1', hook: { headline: 'Go from $180k to $260k', cta: 'x' } },
    { id: 'bad-2', hook: { headline: 'Are you struggling with PM rounds?', cta: 'x' } },
    { id: 'bad-3', hook: { headline: 'Before: rejected. After: hired.', cta: 'x' } },
    { id: 'bad-4', hook: { headline: 'We guarantee the offer', cta: 'x' } },
    { id: 'good-1', hook: { headline: 'Hatch graded a real interview answer. 4 out of 10.', cta: 'Take the test' } },
  ]
  const v = lintManifest(seeded)
  const flaggedIds = new Set(v.map((x) => x.creativeId))
  const pass =
    ['bad-1', 'bad-2', 'bad-3', 'bad-4'].every((id) => flaggedIds.has(id)) &&
    !flaggedIds.has('good-1')
  console.log(pass ? 'self-test PASS' : 'self-test FAIL', JSON.stringify(v, null, 1))
  process.exit(pass ? 0 : 1)
}
