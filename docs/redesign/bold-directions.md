# Bold Directions — Round 2 (past "meh")

The first four directions (Precision Instrument / Editorial Academy / Crafted Field Guide / Systems Lab) were competent but safe — any learning startup could wear them. This round pushes for a real point of view: each direction has an **engineer-native organizing metaphor** that makes the product impossible to confuse with a generic learning app. Generated with Codex on gpt-5.5 (xhigh reasoning). Terra palette preserved as the base; each adds one disciplined accent.

## 1. The Compiler ⭐ (top pick)
**Thesis:** HackProduct is where product judgment gets parsed, linted, optimized, and shipped.
**Metaphor:** engineers already trust compilers — they turn vague intent into precise feedback (warnings, failed assumptions, missing edge cases, better rewrites). Product thinking becomes the same. The primary object is a **build transcript of your reasoning**, not a dashboard.
- **Layout/nav:** command-palette first; workspace has three lanes (prompt AST, live answer, diagnostic log). Top build switcher: Queue / Builds / Cases / Interviews / Lab / Hatch.
- **Type:** Söhne (UI) + Berkeley Mono (diagnostics, scores, tags, timestamps) — the mono is identity, not decoration.
- **Color:** dark forest shell `#1e3528`, cream code panes, amber warnings, forest success. One accent: **phosphor mint `#9be7b0`** for the active cursor / pass state.
- **Signature motif:** inline diagnostics on your reasoning — `warning: segment is underspecified`, `fix-it: add constraint`, `pass: tradeoff named`.
- **Dashboard:** a CI board for your judgment. Rows are recent "builds" grouped by failing pass, plus today's queue, stale weaknesses, autopsies as reusable test fixtures.
- **FLOW/difficulty/progress:** FLOW = quiet compiler pass badges (`frame` `list` `optimize` `win`). Difficulty = optimization level `O1–O4`. Progress = build stability + coverage.
- **Steal from:** Vercel build logs — making waiting, failure, and success legible.
- **Risk/guardrail:** could get code-y or punitive → diagnostics stay human-language, more "warnings" than "errors".

## 2. Decision DAG
**Thesis:** your judgment is a living branch history; every challenge is a commit to your mental model.
**Metaphor:** improvement isn't linear — it's divergence, correction, merge, regression, exactly how engineers understand getting better. The **map is the product**.
- Full-bleed DAG canvas; nodes open side sheets; branch-switching + Cmd-K nav.
- Type: ABC Diatype + Commit Mono. Color: cream canvas, forest graph lines, amber divergent branches; accent **verdigris `#5fd3a5`** for current `HEAD`.
- Signature: **"model diff"** after each answer — assumptions added, claims deleted, tradeoffs rewritten, evidence merged.
- Dashboard: your current `HEAD`, dangling branches, hotfix-needed weaknesses, merge-ready strengths. Zoom out = the shape of your judgment.
- Steal from: Sublime Merge / GitButler + Linear (graph-as-navigation, keyboard-first).
- Risk: abstract fast → every graph view has a plain "Today" queue fallback.

## 3. The Docket
**Thesis:** product judgment is case law — evidence, precedent, argument, verdict.
**Metaphor:** interviews and autopsies aren't modules, they're **cases**; great answers cite precedent and make a defensible ruling. An OS for claims and evidence (not editorial styling).
- Top docket bar by active matters; main surface is a case file with margin citations, evidence tabs, verdict status; autopsies as precedent shelves.
- Type: Tiempos Text (case titles + autopsy reading) + ABC Diatype (UI). Accent: **redwood seal `#8f3d2f`** only for final verdict stamps.
- Signature: **precedent drawer** — surfaces relevant autopsy fragments while you solve, to cite into your answer. Hatch is a clerk preparing briefs, not a mascot.
- Steal from: Perplexity (citations as a trust surface, not decoration).
- Risk: legal cosplay → no gavels/scales/seals/puns.

## 4. Pit Wall
**Thesis:** judgment improves like race engineering — sector by sector, under pressure, with telemetry.
**Metaphor:** each interview/challenge/voice session produces **sector splits**: where time was gained, lost, wasted. A live control wall, not a calm heatmap.
- Dense horizontal timing boards; bottom "pit lane" rail; drill view = transcript + telemetry + replay scrubber.
- Type: FF DIN + JetBrains Mono. Accent: **timing lime `#b7d66b`** for personal-best deltas.
- Signature: **sector replay** — scrub an answer, watch Frame/List/Optimize/Win light up with lost-time markers. Recommendations sort by "time lost," not generic priority.
- Steal from: F1 live timing + Whoop (sector deltas, readiness loop).
- Risk: sports theming → telemetry logic only, no cars/flags/tracks.

## 5. Product Exchange
**Thesis:** product thinking is a market of bets, constraints, confidence, calibration.
**Metaphor:** senior judgment isn't knowing the answer, it's **pricing uncertainty** better than others. Looks like a serious decision desk, not "learning."
- Dense blotter UI; rows for skill positions, cases, readiness, calibration gaps; drill = a tradeoff ticket.
- Type: Neue Haas Grotesk Text + IBM Plex Mono. Accent: **moss tick `#8ccf6b`** for improving calibration.
- Signature: **tradeoff order book** — rank segments/constraints/bets/risks; Hatch shows the spread between confidence and evidence. Dashboard = live blotter sorted by biggest calibration gap.
- Steal from: Bloomberg Terminal + Retool (density as authority).
- Risk: finance metaphor alienates → product language first, market second.

## Ranking (most distinctive-yet-shippable → most risky)
1. **The Compiler** — weird without being arbitrary; engineer-native trust pattern applied to judgment; gives Hatch a sharper role (diagnostic engine, not "coach"); scales across challenges/autopsies/interviews/analytics; impossible to confuse with another learning startup.
2. Decision DAG
3. The Docket
4. Pit Wall
5. Product Exchange

## Next
Building a live HTML mock of **The Compiler** dashboard so it can be judged on sight, not described. If it clears the bar, mock 1–2 runners-up (likely Decision DAG or The Docket) for contrast.
