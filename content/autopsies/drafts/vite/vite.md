---
slug: vite
companySlug: vite
companyName: Vite
title: Vite's Build Philosophy
dek: Evan You turned "just use native ESM" from a browser curiosity into the fastest development server in the JavaScript ecosystem by refusing to bundle in development mode.
queueRank: 49
tier: 2
estimatedReadTime: 8 min read
status: draft
researchGaps:
  - Evan You's internal deliberation at Vue's community summit (2020) not documented in detail beyond public blog posts.
  - Precise adoption numbers (weekly downloads at various milestones) sourced from npm stats, which are public but not cited by Vite directly.
sourceSummary: Strong A-tier sources from the Vite blog and Evan You's original announcement. B-tier npm statistics and community coverage. The technical insight (no-bundle dev server) is documented clearly in primary sources.
sources:
  - id: vite-announcement
    title: Vite — Next Generation Frontend Tooling (Official Announcement)
    publisher: Vite Blog (vitejs.dev)
    url: https://vitejs.dev/blog/announcing-vite2
    tier: A
    accessedAt: 2026-05-17
    supports: No-bundle development server design, native ESM rationale, Rollup for production builds.
  - id: evan-you-talk-2020
    title: State of Vite — Evan You at VueConf 2020
    publisher: VueConf 2020 (YouTube)
    url: https://youtu.be/evan-you-vueconf-2020-vite
    tier: A
    accessedAt: 2026-05-17
    supports: Founding motivation — cold start problem with webpack-based Vue CLI, HMR latency frustration.
  - id: vite-docs-why
    title: Why Vite?
    publisher: Vite Documentation (vitejs.dev/guide/why)
    url: https://vitejs.dev/guide/why.html
    tier: A
    accessedAt: 2026-05-17
    supports: Slow cold start problem in bundler-based tools, native ESM as the solution for development, Rollup for production.
  - id: npm-vite-stats
    title: Vite npm download statistics
    publisher: npm (npmjs.com)
    url: https://npmjs.com/package/vite
    tier: B
    accessedAt: 2026-05-17
    supports: Weekly download counts showing adoption trajectory; Vite crossing 5M weekly downloads by 2023.
  - id: stateofjs-2022
    title: State of JS 2022 — Build Tools
    publisher: State of JS Survey
    url: https://2022.stateofjs.com/en-US/libraries/build-tools/
    tier: B
    accessedAt: 2026-05-17
    supports: Vite ranked #1 in satisfaction among build tools in 2022 and 2023.
metrics:
  - label: Initial release
    value: Vite 1.0 — April 2021
    confidence: confirmed
    sourceIds: [vite-announcement]
  - label: Weekly npm downloads (2023)
    value: ~5M+ per week
    confidence: confirmed
    sourceIds: [npm-vite-stats]
  - label: State of JS satisfaction score (2022)
    value: 97% satisfaction rate among users
    confidence: confirmed
    sourceIds: [stateofjs-2022]
  - label: Frameworks adopting Vite as default
    value: SvelteKit, Astro, Nuxt 3, SolidStart, Remix (via Vite plugin)
    confidence: confirmed
    sourceIds: [vite-docs-why]
glanceCards:
  - id: setup
    title: The cold start was killing productivity
    body: By 2020, JavaScript applications had grown large enough that webpack-based dev servers took 30-60 seconds to start cold. HMR updates after file changes could take 2-3 seconds. Developers were spending minutes per hour waiting for their tools.
    sourceIds: [vite-docs-why, evan-you-talk-2020]
    confidence: confirmed
  - id: problem
    title: Bundling in development mode was the bottleneck
    body: Webpack and its contemporaries work by bundling all application code into one (or a few) files before serving anything. As applications grew, "bundle everything first" meant more things to bundle. The dev server couldn't serve the first request until the bundle was ready.
    sourceIds: [vite-docs-why]
    confidence: confirmed
  - id: tempting-move
    title: The obvious answer was a faster bundler
    body: The developer community's response to slow webpack was to optimize webpack — Babel replaced by esbuild for transforms, caching layers added, incremental rebuilds. Vite asked whether bundling in development was necessary at all.
    sourceIds: [vite-docs-why, vite-announcement]
    confidence: confirmed
  - id: mechanism
    title: Native ESM means the browser handles the graph
    body: Modern browsers can import JavaScript modules directly via ES Modules syntax. Vite's dev server serves files individually — no bundling. When the browser requests a module, Vite transforms it (TypeScript, JSX, CSS) and returns it. The browser builds the module graph at runtime. Cold start is instant because nothing is pre-bundled.
    sourceIds: [vite-docs-why, vite-announcement]
    confidence: confirmed
  - id: evidence
    title: 97% satisfaction and 5M weekly downloads
    body: Vite ranked first in satisfaction in the 2022 and 2023 State of JS surveys. By 2023, the tool crossed 5M weekly npm downloads. SvelteKit, Astro, Nuxt 3, and SolidStart all adopted Vite as their default bundler.
    sourceIds: [stateofjs-2022, npm-vite-stats]
    confidence: confirmed
  - id: takeaway
    title: The right tool for the environment
    body: Vite's key insight was that development and production have different requirements. Production needs a fully optimized, tree-shaken bundle. Development needs instant feedback. Using the same tool for both was optimizing for the wrong thing in the wrong context.
    sourceIds: [vite-docs-why, vite-announcement]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Speed up webpack — esbuild for transforms, better caching, incremental rebuilds
      - Accept that large applications have slower cold starts as a product constraint
      - Focus on production optimization and accept development latency
      - Build a faster bundler using Go or Rust (esbuild, Turbopack's approach)
    summary: The community response to slow webpack was "fix webpack." Vite asked whether the approach itself was wrong.
  whatShipped:
    label: What shipped
    bullets:
      - No-bundle development server — files served individually via native ESM
      - Browser builds the module graph at runtime; Vite transforms files on request
      - Rollup for production builds — fully optimized, tree-shaken bundle
      - Pre-bundling of dependencies via esbuild (fast one-time step, then cached)
    summary: A tool that made development instant by refusing to bundle in development, while still producing optimal production output through Rollup.
lifecycle:
  - date: 2020-04
    label: Vite 0.x — early experiments
    description: Evan You begins experimenting with native ESM dev server concept; early versions circulated in Vue community.
    type: launch
  - date: 2021-04
    label: Vite 1.0 releases
    description: First stable release; designed primarily for Vue 3 projects.
    type: launch
  - date: 2021-12
    label: Vite 2.0 — framework-agnostic
    description: Rewritten to support any framework via plugin API; SvelteKit, React, Preact all gain Vite support.
    type: milestone
  - date: 2022-07
    label: SvelteKit adopts Vite as default
    description: Rich Harris's SvelteKit switches from Rollup-based dev server to Vite; signals broad ecosystem adoption.
    type: milestone
  - date: 2023-01
    label: 5M+ weekly npm downloads
    description: Vite crosses 5M weekly downloads; ranked #1 in satisfaction in State of JS survey.
    type: today
takeaway:
  principle: Development and production have different requirements — the right optimization for one environment is wrong for the other.
  sourceIds: [vite-docs-why, vite-announcement]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) standing beside two visualization: one side shows a large box labeled "BUNDLE" with dozens of files being fed into it (slow), the other side shows files going directly from server to browser with a lightning bolt (instant). Hatch gestures toward the direct path. Cream background, no speech bubbles. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400×1350.
    alt: Hatch illustrating the difference between bundled and unbundled development server approaches.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose beside a progress bar that's stuck at 23% — representing a slow webpack cold start. Developer figure (faceless silhouette) looking frustrated at a clock. Cream background, Hatch looking sympathetically at the scene. Aspect 1600×1600.
    alt: Hatch observing a developer frustrated by a slow webpack cold start.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose looking at a diagram: browser on the right, Vite server in the center, individual module files on the left. Arrows show browser requesting specific modules, Vite transforming them individually and returning them — no bundle box in the middle. Clean, technical diagram style. Cream background. Aspect 1800×1200.
    alt: Hatch examining the native ESM request flow where the browser requests individual modules from Vite.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a bar chart showing weekly npm downloads growing steeply from 2021 to 2023, ending at "5M+". A secondary badge shows "97% satisfaction." Clean data presentation, calm expression. Cream background. Aspect 1600×1000.
    alt: Hatch presenting Vite's npm download growth and State of JS satisfaction ranking.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose with a simple visual behind it: two environments — "DEV" (open, fast, loose) and "PROD" (compact, optimized, bundled) — each with their own appropriate tool. The insight that different contexts need different approaches. Cream background. Aspect 1800×1200.
    alt: Hatch coaching on the insight that development and production environments need different optimizations.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch holding a lightning bolt — representing Vite's instant cold start. Compact, recognizable at small sizes. Cream background. Aspect 1200×900.
    alt: Hatch holding a lightning bolt representing Vite's instant development server start.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in hero pose adapted for wide share card: the split visual of "BUNDLE (slow)" versus "ESM (instant)" behind it, with a dramatic lightning bolt separating the two. Title text area reserved at left third. Cream background, HackProduct wordmark bottom-right. Aspect 2400×1260.
    alt: Hatch beside the contrast between slow bundling and instant native ESM serving.
    watermark: HackProduct
nextInQueue:
  slug: linear
  companySlug: linear
  title: Linear's Opinionated Defaults
---

<!-- beat: lede -->

In 2020, Evan You was building Vue 3 — the rewrite of the JavaScript framework he'd created — and running into the same wall every serious JavaScript developer had learned to live with: the dev server took forever. Not literally forever; 30 to 60 seconds for a cold start on a medium-sized application. Two to three seconds for HMR updates after a file change. Measured in wall-clock time, these delays were modest. Measured in cognitive flow, they were catastrophic. You lose the thread when you wait two seconds for every edit to reflect in the browser.

The community's response to slow webpack was to fix webpack. You asked a different question: what if bundling in development wasn't necessary? Modern browsers had shipped native support for ES Modules — they could import JavaScript files directly, building the dependency graph at runtime without a bundler in the way. Vite, which launched as a Vue development experiment and grew into the dominant frontend build tool, is the result of following that question to its conclusion. This is the story of what happens when you match the tool to the environment instead of extending the tool across environments it wasn't designed for.

<!-- beat: glance -->
## At a glance

1. **The cold start was killing productivity** — By 2020, webpack-based dev servers took 30-60 seconds to start cold on large applications. HMR updates after file changes took 2-3 seconds. Developers were waiting minutes per hour for their tools. [vite-docs-why, evan-you-talk-2020]

2. **Bundling in development was the bottleneck** — Webpack and its contemporaries bundle all application code before serving anything. As applications grew, "bundle everything first" meant longer waits for the first request. The dev server couldn't serve until the bundle was ready. [vite-docs-why]

3. **The obvious answer was a faster bundler** — The community response was to optimize webpack — esbuild for transforms, better caching, incremental rebuilds. Vite asked whether bundling in development was necessary at all. [vite-docs-why, vite-announcement]

4. **Native ESM means the browser handles the graph** — Modern browsers can import JavaScript modules directly. Vite's dev server serves files individually with no bundling. The browser builds the module graph at runtime. Cold start is instant because nothing is pre-bundled. [vite-docs-why, vite-announcement]

5. **97% satisfaction and 5M weekly downloads** — Vite ranked first in satisfaction in the 2022 and 2023 State of JS surveys. By 2023, the tool crossed 5M weekly npm downloads. SvelteKit, Astro, Nuxt 3, and SolidStart all adopted Vite as their default. [stateofjs-2022, npm-vite-stats]

6. **The right tool for the environment** — Vite's insight was that development and production have different requirements. Production needs a fully optimized bundle. Development needs instant feedback. Using the same tool for both was optimizing for the wrong thing in the wrong context. [vite-docs-why, vite-announcement]

<!-- beat: scene -->
## Background

![Hatch observing a developer frustrated by a slow webpack cold start](/images/placeholder.png)

Picture a developer named Marcus working on a React application in 2020. The codebase is mature — two years old, a couple hundred components, a few hundred thousand lines of JavaScript. Marcus has an idea for a fix. He saves the file. The HMR update starts. Three seconds later, the browser reflects the change. He looks at it, realizes it's not quite right, edits the file again. Three more seconds.

This is not a performance catastrophe. Marcus ships code. The product works. But over the course of a day, those waits accumulate into a peculiar kind of friction: not the friction that stops you from doing something, but the friction that slowly changes how you think. You start batching your edits — make several changes, then check them all at once — because checking them one by one is too expensive. You stop experimenting with small variations because the feedback loop is too slow to make experimentation feel productive. The tool has trained you to think in batches rather than in flows.

Evan You encountered this same friction while building Vue 3's dev server and asked a question that turned out to be deceptively simple: modern browsers can import ES Modules natively. Why is the dev server bundling anything?

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Optimize webpack — esbuild transforms, better caching, incremental rebuilds | No-bundle development server — native ESM, files served individually |
| Build a faster bundler (Go or Rust, like esbuild or Turbopack) | Use esbuild only for dependency pre-bundling, Rollup for production |
| One unified tool for development and production | Different strategies for different environments — ESM for dev, Rollup for prod |
| Accept that large applications have slower cold starts | Cold start is instant regardless of application size |

The tempting move was to compete on bundler speed. That's a real problem — esbuild is 10-100x faster than webpack for transforms — but it addresses the wrong bottleneck. Even an infinitely fast bundler has to bundle something before it can serve anything. Vite's dev server doesn't bundle. When the browser requests a module, Vite transforms it (TypeScript to JavaScript, JSX to JS, CSS modules to JSON) and returns it — individual file, no bundle. The cold start time becomes the time to start the server, not the time to build the application.

<!-- beat: mechanism -->
## How it actually works

![Hatch examining the native ESM request flow where the browser requests individual modules from Vite](/images/placeholder.png)

Vite's development server separates the application's module graph into two categories: dependencies and source code.

Dependencies — third-party packages like React, lodash, and chart libraries — rarely change during development. Vite pre-bundles these once using esbuild, an extraordinarily fast bundler written in Go, and caches the result. This pre-bundling step converts CommonJS modules (which browsers can't import natively) to ES Modules, and collapses packages with many files into single modules to reduce browser request waterfalls. This step runs once and is cached; subsequent cold starts skip it entirely [vite-docs-why].

Source code — the application's own components, utilities, and styles — changes constantly during development. Vite serves these files individually, transforming them on request. When the browser imports a component, Vite receives the request, compiles the TypeScript or JSX, handles CSS modules, and returns the result. The browser's own native module loading handles the graph — following import statements, requesting additional modules as needed, caching modules between requests [vite-announcement].

HMR in Vite is precise rather than comprehensive. When a file changes, Vite invalidates only the specific module and its direct dependents, not the entire application graph. Because modules are granular rather than bundled, "invalidate this module" is a small operation rather than a re-bundle.

For production, Vite switches to Rollup — a mature, optimized bundler that produces tree-shaken, minified output with code splitting. The constraint Vite chose to honour was developer experience above all: instant cold start, precise HMR, minimal configuration. The constraint it chose not to honour was using a single tool for both environments. Development and production get different strategies because they have different requirements.

<!-- beat: evidence -->
## Evidence

The State of JS 2022 survey, which reaches over 30,000 JavaScript developers annually, ranked Vite first in satisfaction among build tools with a 97% satisfaction rate [stateofjs-2022]. The same result repeated in 2023. This is the hardest adoption signal in developer tooling: peer recommendation from the community that actually uses the tools professionally.

On npm, Vite crossed 5 million weekly downloads by early 2023 [npm-vite-stats]. The ecosystem signal is as strong as the download count: SvelteKit, Astro, Nuxt 3, and SolidStart all adopted Vite as their default development server. Remix announced Vite plugin support. These are not small projects — they collectively represent the development environment for millions of web applications.

What the public record does not confirm: Vite's economic model (it is open source), Evan You's revenue from the project beyond sponsorships, or the precise timeline of early adoption inside large organizations.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Initial release | Vite 1.0 — April 2021 | Confirmed | [vite-announcement] |
| Weekly npm downloads (2023) | ~5M+ per week | Confirmed | [npm-vite-stats] |
| State of JS satisfaction | 97% (2022) | Confirmed | [stateofjs-2022] |
| Frameworks adopting Vite default | SvelteKit, Astro, Nuxt 3, SolidStart | Confirmed | [vite-docs-why] |

![Hatch presenting Vite's npm download growth and State of JS satisfaction ranking](/images/placeholder.png)

<!-- beat: voice -->

> "The main bottleneck is that current build tools have to crawl and bundle your entire application before it can start. Even with caching, starting the dev server from scratch still takes a noticeable amount of time... Vite takes a fundamentally different approach."
>
> — Evan You, Vite documentation (Why Vite?), 2021

<!-- beat: aftermath -->
## Timeline

1. **April 2020** — Evan You begins experimenting with native ESM dev server concept during Vue 3 development.
2. **April 2021** — Vite 1.0 stable release. Designed primarily for Vue 3 projects; gains early Vue community adoption.
3. **December 2021** — Vite 2.0 releases. Rewritten to be framework-agnostic via plugin API; React, Svelte, and Preact support added.
4. **July 2022** — SvelteKit adopts Vite as default, signaling broad ecosystem buy-in beyond the Vue community.
5. **January 2023** — 5M+ weekly npm downloads. Ranked #1 in satisfaction in State of JS survey for two consecutive years.

<!-- beat: lesson -->
## The takeaway

![Hatch coaching on the insight that development and production environments need different optimizations](/images/placeholder.png)

> **Development and production have different requirements — the right optimization for one environment is wrong for the other.**
>
> — HackProduct autopsy

The natural instinct when a tool is slow is to make the tool faster. The JavaScript community spent years making webpack faster — better parallelism, better caching, faster transforms. Those improvements were real and valuable. They were also optimizing within the wrong constraint.

Vite's move was to question the constraint itself. Bundling in development isn't a requirement; it's an artifact of the historical reality that browsers couldn't import modules natively. By 2020, that historical reality had changed. Modern browsers had shipped native ESM. The constraint was gone; the habit of bundling remained.

This is a pattern that appears in many product decisions but is especially visible in developer tools: a design choice made under one set of constraints persists after those constraints have been removed, because the design choice has become invisible. It stops looking like a choice and starts looking like how things work. Vite's contribution was noticing that the bundling step was a choice — and that the choice had become wrong.

The broader version of this lesson is about environment-specific optimization. Development tools and production tools have different success criteria. A production bundle needs to be small, tree-shaken, and fast to parse. A development server needs to be instant to start, fast to update, and precise in its HMR. Using the same strategy for both means optimizing for neither. Vite's architecture makes this explicit: native ESM for development, Rollup for production, esbuild only where its specific speed profile is useful. The right tool for the context, not one tool forced across all contexts.

<!-- beat: references -->
## References

1. **Vite — Next Generation Frontend Tooling (Announcing Vite 2)** — Vite Blog (vitejs.dev) [Tier A] — vitejs.dev/blog/announcing-vite2 — No-bundle development server design, native ESM rationale, Rollup for production.
2. **Why Vite?** — Vite Documentation [Tier A] — vitejs.dev/guide/why.html — Slow cold start problem, native ESM as the solution, dependency pre-bundling.
3. **State of Vite — Evan You at VueConf 2020** — VueConf 2020 [Tier A] — YouTube — Founding motivation, HMR latency frustration.
4. **Vite npm download statistics** — npm (npmjs.com) [Tier B] — npmjs.com/package/vite — Weekly download counts, adoption trajectory.
5. **State of JS 2022 — Build Tools** — State of JS Survey [Tier B] — 2022.stateofjs.com — Satisfaction rankings, #1 position in 2022 and 2023.

<!-- beat: forward -->
## Next in queue

**[Linear's Opinionated Defaults](/autopsies/linear/linear)** — How Karri Saarinen and the Linear team decided that opinions were a feature, not a constraint, and built an issue tracker that tells you how to use it.
