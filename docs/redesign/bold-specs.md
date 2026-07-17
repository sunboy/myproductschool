# Bold direction build specs (round 2)

Build live, self-contained HTML dashboard mocks for 3 bold directions. Same test user as before (Sandeep: 12-day streak, weakest move Frame Lv2 41%, Product Sense Sprint W2 step 3/5, paused interview loop round 2/3, interview in 18 days, strategic_thinking rising, taste flat). Same content atoms and the same "recommendation + reason" idea, but each direction reinterprets the ENTIRE surface through its metaphor — do not just reskin the previous cream dashboard.

## Shared rules
- Terra base palette: forest `#4a7c59`, dark forest `#1e3528` / `#14241c` / `#0e1a14`, cream `#faf6f0`, cream panes `#f5f1ea`/`#f0ece4`, amber `#c9933a`, amber-soft `#f3e2b9`, taupe outline `#c4c8bc`/`#74796e`, ink `#2e3230`, success `#2f7a4a`, error `#b83230`. Each direction adds exactly ONE accent (specified below).
- Fonts via Google Fonts CDN only. Use these mappings for the named typefaces:
  - Söhne / Neue Haas / ABC Diatype / FF DIN → use "Inter" (grotesk UI)
  - Berkeley Mono / Commit Mono / IBM Plex Mono / JetBrains Mono → use "JetBrains Mono"
  - Tiempos Text → use "Newsreader" (or Literata) for serif reading
  - Literata stays available for serif display
- No emoji as icons (inline SVG only). No off-palette hues beyond the ONE named accent. Real content names (real challenge titles, real autopsy companies: Figma Multiplayer, Duolingo Streak, Dropbox Referral, Arc Browser Invite; challenges: "Frame the buyer, the user, and the payer for Airbnb Experiences", "Reconstruct Delivery Routes from Checkpoint Logs", "Rebuild Playlist from Shuffle Logs").
- Voice: direct, confident, no AI slop, no em dashes, no "you are a PM" role framing.
- 1440px design, reflow cleanly to 768 + 375. Fixed bottom-right pill naming the direction in its own chrome.
- This is the DASHBOARD screen only (the make-or-break screen). One file per direction.

## Direction 1 — The Compiler → `previews/bold/compiler.html`
Metaphor: product judgment as a build transcript. The dashboard is a CI board for your reasoning.
- Accent: phosphor mint `#9be7b0` (active cursor / pass state only). Shell is dark forest `#14241c`; content panes are cream OR dark code panes.
- Layout: top build switcher bar (Queue · Builds · Cases · Interviews · Lab · Hatch) + a ⌘K affordance. Main = a "build" view. Left/main: today's queue rendered as a build pipeline — each item is a build step with a status glyph (pass ✓ green, warn ▲ amber, running ● mint pulse, queued ○). Right: a diagnostic log panel (dark, mono) streaming inline diagnostics on the user's recent reasoning: `warning: segment underspecified`, `fix-it: add constraint`, `pass: tradeoff named`, each with a file-like locus (e.g. `airbnb-experiences.frame:3`).
- Readiness renders as a "build stability" meter + coverage %. FLOW = lowercase pass badges `frame` `list` `optimize` `win` (weak one amber). Difficulty = `O1`–`O4` optimization level. The main CTA is `▸ Resume build` (the session). Recent "builds" list = recent attempts grouped by failing pass, with pass/warn counts. Autopsies appear as "test fixtures you can import". Every recommended item carries a one-line reason styled like a compiler note (`// because Frame is your weakest pass`).
- Signature: the diagnostic log must feel like a real build log (monospace, timestamps, severity colors, a blinking mint cursor at the bottom).

## Direction 2 — Decision DAG → `previews/bold/dag.html`
Metaphor: your judgment is a git branch history; the map is the product.
- Accent: verdigris `#5fd3a5` for the current `HEAD` node only. Cream canvas, dark forest graph lines/nodes.
- Layout: a full-bleed graph canvas is the hero (hand-built inline SVG): a DAG of nodes (past attempts as commits) on 3–4 lanes (practice / autopsies / interviews), edges connecting them, filled forest nodes = merged strengths, hollow amber nodes = dangling/weak branches, one verdigris ringed node = current HEAD ("you are here"). A slim left rail lists branches (Frame, List, Optimize, Win as branch labels with protection level = difficulty). A right side-sheet shows the selected node: a "model diff" (assumptions +added, claims −deleted, tradeoffs rewritten) in mono diff style (green + / red −). Top bar: branch switcher + Cmd-K. Below the graph: a plain "Today" queue fallback strip (the guardrail) with the session Continue CTA + reason lines.
- FLOW = branch labels. Progress = merged nodes vs unresolved branches (a small counter). Readiness shown as "N branches merge-ready, M need a hotfix".
- Signature: the DAG itself (nodes + edges + HEAD ring) must read as a real commit graph, and the model-diff side sheet uses real +/− diff lines about the Airbnb Experiences framing rep.

## Direction 3 — The Docket → `previews/bold/docket.html`
Metaphor: product judgment as case law — evidence, precedent, argument, verdict.
- Accent: redwood seal `#8f3d2f` ONLY on a final verdict stamp. Warm cream paper, dark forest ink, serif for case titles/reading (Newsreader/Literata), grotesk for UI.
- Layout: a top docket bar listing active "matters" (Argue · Rehear · Close). Main surface is a "case file" for today's rep ("Frame the buyer, the user, and the payer for Airbnb Experiences") styled like a legal brief: case title in serif, a numbered margin with citation markers, evidence tabs (Facts / Precedent / Argument / Verdict), and a verdict status. A right "precedent drawer" surfaces relevant autopsy fragments (Figma Multiplayer, Dropbox Referral) you can cite into your answer, each with a pull-quote and a "cite" affordance. Hatch appears as a clerk line ("Hatch prepared this brief"), not a mascot. Today's docket = 3 matters (argue / rehear / close) with reason lines.
- FLOW = exhibit tabs on the page edge. Difficulty = number of disputed issues. Progress = closed cases + stronger cited precedent. Readiness = "N of M issues resolved".
- Signature: margin citations that link body claims to precedent (autopsies), and exactly one redwood verdict stamp (e.g. a "PARTIAL" ruling on the last closed case). No gavels, scales, or legal puns.
