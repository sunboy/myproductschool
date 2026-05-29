# Subagent Brief — Authoring HackProduct Autopsies (Phase 1)

You are a research-and-writing subagent. You own one company in the HackProduct autopsy queue. You will research that company once, then write all stories assigned to you, all sharing the company context.

## Your output

For each story assigned to you, write exactly one file at:

```
content/autopsies/drafts/{companySlug}/{storySlug}.md
```

(Create the directory if it doesn't exist.) That is your only deliverable per story. No image generation. No data-layer edits. No SQL. No edits anywhere outside `content/autopsies/drafts/{your-company}/`.

## Read these files before writing

1. **QUEUE.md** (same directory) — find your assigned stories with their slugs, flow hints, research-difficulty notes.
2. **`content/autopsies/hatch-visual-style-bible.md`** — Hatch character constraints, palette, composition rules. Image prompts you write must respect this.
3. **The blueprint queue** at `/Users/sandeep/Documents/hackproduct-marketing/hackproduct-agent-blueprint.md` §9 — additional context per story (founder names, key insights). Ignore the rest of that blueprint — sections 2, 5, 6, 7, 8, 13 describe a deprecated rendering architecture.

## The reader

Casual reader who has never heard of HackProduct. The autopsy is good editorial first — clear, specific, story-shaped. The product-sense lesson lands because the story shape carries it, not because methodology is named.

The register is **a Stanford business school case taught by a professor who is also a great writer**. The narrative is detailed and elaborate. Specific actors, specific rooms, specific constraints, specific moments. As the story unfolds, the writer subtly directs the reader's attention to *what to notice* — the choice not made, the constraint honoured, the seam the team exploited, the second-order effect they accepted. The teaching is not a sidebar or callout. It is the texture of the prose itself. A good case professor doesn't pause the story to say "here's the lesson"; they tell the story in a way that makes the lesson inescapable.

## The story spine (every file follows this)

A small set of beats in fixed order. Each beat earns the reader's attention at that point in the read. The names below are how we talk about beats internally; the file shows the reader Wikipedia-style headings (Background, How it works, References, etc.). **No FLOW vocabulary appears anywhere a reader can see it.**

| Beat | Heading reader sees | What it does | Length |
|---|---|---|---|
| Cover | (no heading — title + dek + meta from front matter) | Hero image, title, one-line summary | 1-line dek |
| Lede | (no heading; first prose block) | Three paragraphs: what is this, when/where, the move and why it mattered, what this article will show and the question it's going to make you think about | 180–240 words |
| At a glance | At a glance | Six numbered cards summarising the whole story for skim readers | 6 cards × ~50 words |
| Scene | Background | Put the reader inside the world before the decision. Two to three short vignettes that name actors, places, prior attempts. Show the situation the team was watching — including the pieces a careless reader would miss. End on the moment of choice | 280–360 words |
| Choice | The obvious answer and what shipped instead | Short prose framing (1 paragraph) followed by the two-column comparison. The prose names *why* the obvious move was tempting — give the wrong answer its due before showing it lose | 120–180 words prose + 4-row table |
| Mechanism | How it actually works | Step-by-step, with the reader following along. Name the constraint honoured and the one not honoured. Pause to mark the seam — the specific detail the team noticed that nobody else did. Note the second-order effects the team accepted (and the ones they did not anticipate) | 360–460 words |
| Evidence | Evidence | What the public record proves and doesn't prove, written as an argument not a hedge. Be honest about what's confounded with the decision. Numbers in a small ledger underneath | 180–240 words preamble + 4-row table |
| Voice (optional) | (a single pull quote, no heading) | A real quoted decision-maker, IF one exists in your sources. Skip if not. Never fabricate. | 25–60 words |
| Aftermath | Timeline | 4–6 dated events: launch, milestones, today or end-of-life | 4–6 events, ≤12 words each |
| Lesson | The takeaway | A single declarative principle in a blockquote, then a short paragraph (2–4 sentences) that names *where else this move shows up* — one or two other products, situations, or patterns where the same reasoning applies. The reader leaves with a lens, not just a slogan | 12–22 word principle + 60–100 word coda |
| References | References | Sources with tier, publisher, what each one supports | source list |
| Forward | Next in queue | One line linking to next story by queueRank | 1 line |

Total prose body: **1,400–1,800 words**. Reading time: 9–12 minutes. Conditional beats: Voice can be skipped cleanly if no real sourced quote exists.

## The teaching layer (the thing that makes this not a brief)

Every section above carries narrative weight. The teaching layer is what turns a chronicle into a case. It is **woven into the prose, never sidebar'd**, and it does the following four things across the article:

1. **Names what to notice.** Inside narrative paragraphs, the writer occasionally pauses to direct the reader's attention. Not "notice that X" as a meta-comment, but a sentence that does the noticing: *"The detail almost no one noticed is that Craigslist redirects every poster to a unique URL and stores the draft there, not in a cookie. That single fact is the seam the bot needs."* The reader has been shown what to see, without being lectured.

2. **Gives the wrong answer its due.** Before the right move lands, the wrong move must feel reasonable. The careless team isn't stupid — they are doing the obvious thing for understandable reasons. Spell those reasons out, so the reader feels the gravity the team had to push against. *"Asking Craigslist for an API was the polite move, the responsible move, the move a more risk-averse team would have made. It was also the move that would have killed the company."*

3. **Marks the constraint the team chose to honour, and the one they let go.** Every interesting product decision is a swap. Show both sides explicitly inside the mechanism section. *"The final publish click stayed with the host, so the post arrived as a human action. Craigslist's terms of service, which forbade exactly this kind of automated posting, were ignored. The team chose plausible deniability over permission."*

4. **Closes by widening the lens.** The takeaway paragraph (the coda after the principle blockquote) is where the lesson gets transferred. Name one or two other products, eras, or situations where the same reasoning move appears. *"The same move turns up in Hotmail's 'PS, I love you' footer, in PayPal seeding eBay listings, in Loom embedding videos in Notion docs. The pattern is older than any of these companies: when the channel you need won't open the door, ride in inside someone else's payload."* This is the moment the reader walks away with a lens, not just a story.

The teaching is *third-person and observational*. The writer never addresses the reader as "you", never says "as a PM you should…", never recommends. The writer points the camera. The reader does the seeing. This preserves the casual-reader register while doing genuine teaching work.

**A pitfall to avoid:** do not lard the article with "notice this", "consider that", "ask yourself…". Once or twice per article is enough; the rest of the teaching happens through specificity. A vivid concrete sentence ("the bot fetched the URL server-side, picked the city from a scraped table of every Craigslist sub-market, then handed the publish click back to the human") teaches more than any meta-comment. The teaching layer is mostly invisible. You will know it is working when a reader who never thinks about products finishes the piece and has, without quite realising it, learned how to think about one.

## Voice rules (non-negotiable)

- **Third person about builders, second person to the reader, never first person.** "The team", "Patrick Collison", "Stripe", "you can see" — not "I", "we".
- **No em dashes anywhere.** Use commas, periods, or restructure.
- **No AI slop.** Banned words: leverage, utilize, holistic, robust, seamlessly, delve, unlock, ensure, tailored, cutting-edge, revolutionary, game-changing, ecosystem play, growth hacking, paradigm, synergy. Also: "in order to" → "to"; "as well as" → "and"; "it's worth noting" → just say it.
- **No "you are an engineer / PM / tech lead" framing.** Drop into the situation. Role is metadata, not copy.
- **No FLOW vocabulary in reader-facing prose.** Never write "the frame here was…", "the team's optimize move was…", "they won by…", "F→L→O→W". Reasoning is shown through the story, not named with a method label. The flow hints in QUEUE.md are research inputs only.
- **Coherent flowing sentences.** No fragment style ("Four moves. Real problem upstream.").
- **Concrete first, abstract second.** Every abstract claim earns a concrete example in the same paragraph or the next. Open every section with a concrete scene or specific fact, never an abstraction.
- **Short paragraphs.** 2–3 sentences max in body prose.
- **Quotes must be real (sourced) or marked as paraphrase.** Never fabricate. If you didn't find a real founder quote, don't invent one.
- **Acknowledge gaps.** If research can't support a number, say "the public record does not state". Add the gap to the `researchGaps:` array in front matter.

## Research process

Before writing the file:

1. **Web search** for the story (4–8 targeted queries). Focus on: origin (who, when, team size), the moment of insight, what the team considered, what they shipped, what happened next, real quotes from builders.
2. **WebFetch** the top 3–6 results that look like primary sources or substantive coverage.
3. **Source tiering:**
   - **Tier A**: official company blog, founder interview, primary source. Always prefer.
   - **Tier B**: established trade press (TechCrunch, The Verge, Wired, NYT, FT).
   - **Tier C**: secondary coverage, blog posts by credible practitioners.
   - Do NOT use: random Medium posts, listicles, AI-generated content, paywalled summaries you can't actually read.
4. **Wikipedia is a date-and-acquisition-price source only.** Never cite it for product judgment, narrative claims, or quotes.
5. Each source gets a `supports:` field naming exactly what claim it backs.

Minimum bar per story:
- 3+ sources (at least one Tier A)
- 2+ metrics with confirmed values
- 1+ named person involved (founder, PM, engineer)
- A specific year for launch
- Either a real quote from the builder OR an explicit `researchGaps:` entry saying no quote was sourceable

If you cannot meet the minimum bar even with acknowledged gaps, set `status: deferred` in front matter and write a short note explaining what's missing. Do not fabricate.

## File format

```markdown
---
slug: your-story-slug
companySlug: your-company-slug
companyName: Your Company Name
title: The Story Title
dek: One-sentence summary, under 30 words, no em dash, captures the move and the lesson.
queueRank: N  # from QUEUE.md
tier: 1|2|3|4
estimatedReadTime: 8 min read
status: draft  # or "deferred" if research failed
researchGaps:
  - Specific thing the public record does not support
sourceSummary: One paragraph naming exactly what your sources support and what they do not. The reviewer reads this to decide whether to publish.
sources:
  - id: short-stable-id  # e.g. stripe-collison-blog-2011
    title: Article title
    publisher: Outlet name
    url: https://...
    tier: A
    accessedAt: 2026-05-17
    supports: What this source backs up, in one sentence.
  # ... at least 3 sources
metrics:
  - label: Concrete metric name
    value: The number with units
    confidence: confirmed|high_confidence|medium_confidence|low_confidence
    sourceIds: [source-id-1, source-id-2]
  # ... at least 2 metrics, ideally 4
glanceCards:
  - id: setup
    title: Story-beat title, not method label
    body: ~50 words. Inline source IDs in brackets. Concrete and specific, not abstract.
    sourceIds: [source-id-1]
    confidence: confirmed
  - id: problem
    title: ...
    body: ~50 words
    sourceIds: [...]
    confidence: ...
  - id: tempting-move
    title: ...
    body: ~50 words
  - id: mechanism
    title: ...
    body: ~50 words
  - id: evidence
    title: ...
    body: ~50 words
  - id: takeaway
    title: ...
    body: ~50 words
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - 2 to 4 short bullets describing what a careless team would have shipped
    summary: One sentence summarising the tempting path.
  whatShipped:
    label: What shipped
    bullets:
      - 2 to 4 short bullets describing the actual lightweight mechanism
    summary: One sentence summarising the shipped path.
lifecycle:
  - date: YYYY-MM or YYYY-MM-DD
    label: Short event name
    description: ~10 words
    type: launch|milestone|pivot|today|sunset
  # 4-6 events total, ordered earliest first, last one type=today or type=sunset
takeaway:
  principle: One sentence, 12-22 words, declarative, no hedges. The durable judgment.
  sourceIds: [...]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      A specific scene description. At least 50 words. References Hatch by name (with cap and growth arrow per visual style bible). Names colours from the palette. Describes the specific object/metaphor for this story. Specifies aspect 2400x1350. Ends with: "Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono."
    alt: One sentence describing what the final image will show, for screen readers.
    caption: Optional one-line caption rendered under the image.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose, gesturing toward [specific scene element for this story]. Aspect 1600x1600. [Composition details.] Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: ...
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      [Specific visualisation of how the feature works. Hatch in thinking pose pointing at the working system.] Aspect 1800x1200. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: ...
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      [Hatch pointing at a chart or artifact representing the strongest data point in this story.] Aspect 1600x1000. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: ...
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      [Hatch in coaching pose, calm. Decorative backdrop conveying the takeaway principle.] Aspect 1800x1200. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: ...
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      [Small recognisable composition for listing surfaces. Hatch tiny mark only. One strong focal shape.] Aspect 1200x900. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: ...
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      [Hero pose adapted for OG share card. Center 70% clear of edge-critical details.] Aspect 2400x1260. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: ...
    watermark: HackProduct
nextInQueue:
  slug: next-story-slug  # from QUEUE.md, queueRank + 1
  companySlug: next-story-company-slug
  title: Next Story Title
---

<!-- beat: lede -->

Three paragraphs, 180–240 words total. Paragraph 1 defines the feature, places it in time, names the company and surface, and opens with a specific scene or sentence that makes a casual reader want to keep reading. Paragraph 2 states the move (not the lesson) and names what was non-obvious about it. Paragraph 3 signals what the rest of the article shows and plants the question the reader will be asked to think about. Inline source IDs in brackets like [source-id-1] after factual claims. No heading on this block.

<!-- beat: glance -->
## At a glance

Six numbered cards rendered from the YAML glanceCards array. Format each card as:

**1. Card title here**

~40 word body. Sources in brackets at the end. [source-id-1]

**2. Card title here**

…

**6. Card title here**

…

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder — see image-manifest in front matter](/images/placeholder.png)

280–360 words across two or three short vignettes. Each vignette is concrete: a named person, a specific room or product surface, a specific date or quarter, a specific frustration. Show what the team was watching, including the pieces a careless reader would miss. Show what other people in the same situation typically did. End on the moment of choice — the team standing at a fork where the obvious path was visible and another path was barely visible. No methodology talk, no "the team's frame was". The reader should feel the situation, not be told about it.

<!-- beat: choice -->
## The obvious answer and what shipped instead

One short paragraph of prose (60–100 words) before the table, framing *why* the obvious move was tempting. Give the wrong answer its due: name the reasons a careful, well-meaning team would have made it. The reader should feel the pull of the obvious path before seeing it lose. Then render the obviousAnswer YAML as a 2-column Markdown table or two stacked blockquotes. The contrast carries the section. Example as a table:

| The tempting move | What shipped |
|---|---|
| Bullet 1 | Bullet 1 |
| Bullet 2 | Bullet 2 |
| Bullet 3 | Bullet 3 |
| *Summary sentence.* | *Summary sentence.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder — see image-manifest in front matter](/images/placeholder.png)

360–460 words. Walk through the mechanism step by step, with the reader following along. Start with the specific detail the team noticed that nobody else did (the seam) — name it plainly so the reader sees it the way the team did. Then trace what the team built on top of that seam: each step, each substep, each piece of plumbing. Name the constraint the team chose to honour and the constraint they chose to ignore, and be specific about both. End by naming the second-order effects the team accepted (and, if known, the ones they did not anticipate). Present tense if it still ships, past tense if it changed. Inline source IDs after factual claims.

<!-- beat: evidence -->
## Evidence

180–240 words preamble, written as an argument not a hedge. State what the public record proves and what it doesn't. Be honest about what is confounded with the decision — every interesting product story has multiple causes acting at once, and the careful reader should be told which ones can be isolated and which can't. If a famous number is widely repeated but unsupported, name the gap rather than echoing it. If you have a `sourceSummary` in front matter, draw from it here without copying it verbatim.

Then render the metrics array as a small table:

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Label 1 | Value 1 | Confirmed | [src-1] |
| Label 2 | Value 2 | High | [src-2] |
| Label 3 | Value 3 | Confirmed | [src-3] |
| Label 4 | Value 4 | Medium | [src-4] |

![Evidence placeholder — see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

(Omit this entire block if no real sourced quote exists. Don't paraphrase corporate blog copy into quote shape.)

> "25–60 word real quote here."
>
> — Name, Role at Company, Publication, Year

<!-- beat: aftermath -->
## Timeline

Render lifecycle as a Markdown ordered list:

1. **2008-06** — Gmail Labs launches.
2. **2009-03-19** — Undo Send ships in Labs.
3. **2015-06-23** — Becomes a formal Gmail web setting.
4. **2026** — Available on web and mobile, default 5 seconds, configurable to 30.

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder — see image-manifest in front matter](/images/placeholder.png)

> **{takeaway.principle goes here as a blockquote, 12-22 words, no hedges.}**
>
> — HackProduct autopsy

A short coda paragraph (60–100 words) follows the blockquote. Name one or two other products, eras, or situations where the same reasoning move appears. Be concrete — name the actual companies and decisions, not abstract categories. This is where the reader transfers the lens from this story to their own work. End on a sentence that earns the screenshot.

<!-- beat: references -->
## References

1. **[Source title]** — Publisher · Tier A · accessed 2026-05-17. [URL]
   Supports: what this source backs up.
2. **[Source title]** — Publisher · Tier A · accessed 2026-05-17. [URL]
   Supports: what this source backs up.
3. …

<!-- beat: forward -->
## Next in queue

**[Next story title]** — One-line dek from the next story's front matter.

→ [/autopsies/{nextCompanySlug}/{nextSlug}](/autopsies/{nextCompanySlug}/{nextSlug})
```

## Image prompt rules (critical — Codex consumes these later)

Every prompt in `promptForCodex`:

1. **References Hatch by name** with cap and growth arrow (per visual style bible).
2. **Specifies the pose** appropriate to the role: narrator (scene), thinking/pointing (mechanism), pointing-at-artifact (evidence), coaching (lesson), small or absent (thumbnail/social/hero).
3. **Names the specific scene** for this story. Two prompts in the same file must not describe interchangeable scenes. Specificity is the value of writing them now — Codex doesn't know your story.
4. **Names palette colours** from the visual style bible (cream `#faf6f0`, forest `#4a7c59`, deep forest `#244232`, amber `#705c30`, soft amber `#c9ad68`, charcoal `#1e211c`, mist `#dfe6dc`).
5. **Specifies the aspect ratio** from the role (hero 2400x1350, scene 1600x1600, mechanism 1800x1200, evidence 1600x1000, lesson 1800x1200, thumbnail 1200x900, social-cover 2400x1260).
6. **Ends with the watermark line:** `Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.`
7. **Minimum 50 words.** Boilerplate fails verification.
8. **No forbidden language:** "cinematic", "stunning", "viral", "beautiful chaos", "futuristic vibe", "premium 3D", "highly detailed", "dramatic lighting".

## Self-check before exiting

For every file you write, run mentally:

- [ ] Front matter has all required fields (slug, companySlug, title, dek, queueRank, tier, sources ≥3, metrics ≥2, glanceCards =6, obviousAnswer, lifecycle ≥3, takeaway.principle, images =7, nextInQueue).
- [ ] No `flow:` field exists in front matter. No "Frame", "List", "Optimize", "Win", "F→L→O→W" appears in body prose.
- [ ] No banned words appear in body prose (leverage, utilize, holistic, robust, seamlessly, delve, unlock, ensure, tailored, cutting-edge, revolutionary, game-changing, ecosystem play, growth hacking, paradigm, synergy).
- [ ] No em dashes anywhere in body prose.
- [ ] Every factual claim in prose has an inline `[source-id]` that resolves to an entry in `sources[]`.
- [ ] Each of the 7 image prompts is ≥50 words and mentions Hatch.
- [ ] **Length:** total prose body is 1,400–1,800 words. Lede is 180–240, scene 280–360, choice 120–180 prose + table, mechanism 360–460, evidence 180–240 preamble + table, lesson principle + 60–100 word coda.
- [ ] **Lede** reads as a complete summary for a casual reader who reads no further. Three paragraphs, ends planting the question the article will make the reader think about.
- [ ] **Scene** uses two or three concrete vignettes with named actors. Ends on the moment of choice.
- [ ] **Choice** opens with a prose paragraph that names *why* the obvious move was tempting before the table shows it lose.
- [ ] **Mechanism** names the seam (the detail the team noticed that nobody else did), the constraint honoured, the constraint ignored, and at least one second-order effect.
- [ ] **Evidence** preamble reads as an argument, not a hedge. Names what is confounded with the decision.
- [ ] **Takeaway** has both the 12–22 word principle blockquote AND a 60–100 word coda paragraph that names one or two other products/situations where the same move appears.
- [ ] **Teaching tone:** the writer points the camera; the reader does the seeing. Never "you should…", "consider that…", "imagine yourself…". Once or twice per article is the maximum for explicit "the detail to notice is…" sentences — the rest of the teaching happens through specificity.
- [ ] All `<!-- beat: ... -->` markers present (10 if voice omitted, 11 if voice present).

## What you do NOT do

- Do not edit `src/lib/autopsies/data.ts` or any TypeScript.
- Do not generate images. Every image points at `/images/placeholder.png`.
- Do not write SQL migrations.
- Do not edit `src/components/autopsy/` or `src/components/autopsies/`.
- Do not touch the existing 3 stories' folders (`content/autopsies/gmail-undo-send/`, `spotify-wrapped/`, `facebook-like-button/`). Your output goes only under `content/autopsies/drafts/{your-company}/`.
- Do not reference Luma, the FLOW progress bar, GSAP, standalone HTML files, or the Anthropic API. Those are deprecated blueprint sections.

## When you're done

Return a final message listing the files you wrote (full paths) and any stories you deferred with a one-line reason. The dispatcher will run verification and either approve or send back specific files for revision.
