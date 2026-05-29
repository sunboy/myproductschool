---
slug: linkedin-pymk
companySlug: linkedin
companyName: LinkedIn
title: LinkedIn PYMK
dek: A physicist noticed that your email inbox already knew everyone you'd worked with. LinkedIn just needed permission to read it.
queueRank: 16
tier: 2
estimatedReadTime: 10 min read
status: draft
researchGaps:
  - No first-person quote from Jonathan Goldman directly describing his thought process when he first saw the triangle-closing pattern in the data has surfaced in public sources. The HBR article by Davenport and Patil is the primary narrative record.
  - The precise pre-PYMK user growth rate (the "plateau" period before mid-2006) is not stated in the public record with citable specificity.
  - Whether the email contact importer was already live before Goldman's PYMK experiment, or was built alongside it, is not confirmed in public sources. The benchhacks.com growth study notes an Outlook plugin was built in 2004 as an earlier distinct hack.
  - No LinkedIn executive has given a public, citable account of the internal debate about whether PYMK was too aggressive in surfacing weak ties.
sourceSummary: The Harvard Business Review article "Data Scientist: The Sexiest Job of the 21st Century" (Davenport and Patil, 2012) is the canonical primary account of Jonathan Goldman arriving at LinkedIn in June 2006, observing the connection-rate problem, designing the PYMK experiment as an ad module, and achieving click-through rates far above any prior feature. The LinkedIn Engineering blog post (Mitul Tiwari, 2015) supplies the technical description of triangle closing, the logistic regression model, and the 50 percent of LinkedIn's professional graph attribution. The benchhacks.com LinkedIn growth study documents the double viral loop design and the email contact import history. The Gizmodo 10-year history of PYMK (2018) confirms LinkedIn launched in 2006, that Facebook copied the feature name in 2008, and supplies the Lars Backstrom quote about PYMK driving a significant chunk of all friending on Facebook. The interactually.com and imonlinkedinnowwhat.com sources document the privacy backlash. Profitability (March 2006), member milestones, and Reid Hoffman's CEO tenure are confirmed by multiple secondary sources.
sources:
  - id: hbr-2012
    title: Data Scientist: The Sexiest Job of the 21st Century
    publisher: Harvard Business Review
    url: https://hbr.org/2012/10/data-scientist-the-sexiest-job-of-the-21st-century
    tier: A
    accessedAt: 2026-05-17
    supports: The canonical narrative of Jonathan Goldman arriving in June 2006, the conference-reception analogy, the PYMK experiment as an ad module, click-through rates, Reid Hoffman's support for bypassing the product release cycle, and the growth trajectory shift.
  - id: li-engineering-pymk
    title: People You May Know
    publisher: LinkedIn Engineering
    url: https://engineering.linkedin.com/teams/data/artificial-intelligence/people-you-may-know
    tier: A
    accessedAt: 2026-05-17
    supports: Triangle closing as the foundational algorithm, the 50-percent-of-LinkedIn's-professional-graph attribution, the binary classification framing, scale numbers (hundreds of terabytes, hundreds of billions of candidate pairs daily).
  - id: tiwari-2015
    title: Reinventing People You May Know at LinkedIn
    publisher: LinkedIn Pulse
    url: https://www.linkedin.com/pulse/reinventing-people-you-may-know-linkedin-mitul-tiwari
    tier: A
    accessedAt: 2026-05-17
    supports: Technical detail on triangle closing, organizational overlap model, impression discounting, and the framing of PYMK as link prediction over a social graph.
  - id: benchhacks-linkedin
    title: LinkedIn Growth Study
    publisher: BenchHacks
    url: https://benchhacks.com/growthstudies/linkedin-growth-hacks.htm
    tier: B
    accessedAt: 2026-05-17
    supports: The double viral loop design (PYMK plus Recommendations), the email contact import Outlook plugin history (2004), first profitability in March 2006, the endorsements follow-on in 2012.
  - id: gizmodo-pymk-2018
    title: "People You May Know: A Controversial Facebook Feature's 10-Year History"
    publisher: Gizmodo
    url: https://gizmodo.com/people-you-may-know-a-controversial-facebook-features-1827981959
    tier: B
    accessedAt: 2026-05-17
    supports: LinkedIn's 2006 launch as ads with the highest click-through rate ever seen, Facebook's 2008 adoption of the identical name, Lars Backstrom's quote about PYMK driving a significant chunk of all friending on Facebook, and the early privacy concern reported by AdWeek within a year of Facebook's launch.
  - id: interactually-creepy
    title: LinkedIn is the Creepiest Social Network
    publisher: Interactually
    url: https://www.interactually.com/linkedin-creepiest-social-network/
    tier: C
    accessedAt: 2026-05-17
    supports: User privacy backlash and the stalking problem that eventually led LinkedIn to add a blocking feature.
  - id: li-blog-2008
    title: Learn more about People You May Know
    publisher: LinkedIn Official Blog
    url: https://www.linkedin.com/blog/member/archive/learn-more-abou-2
    tier: A
    accessedAt: 2026-05-17
    supports: Confirms PYMK had been live for almost a year by April 2008 (consistent with a mid-2007 standard-feature launch), the three-recommendation module design, and the feedback-to-improve-algorithms copy.
metrics:
  - label: LinkedIn accounts when Goldman arrived
    value: Just under 8 million
    confidence: confirmed
    sourceIds: [hbr-2012]
  - label: PYMK click-through rate vs. other site prompts
    value: 30% higher than any other prompt to visit more pages
    confidence: confirmed
    sourceIds: [hbr-2012]
  - label: Share of LinkedIn's professional graph built by PYMK
    value: More than 50%
    confidence: confirmed
    sourceIds: [li-engineering-pymk]
  - label: LinkedIn members by April 2007
    value: Approaching 10 million
    confidence: high_confidence
    sourceIds: [benchhacks-linkedin]
glanceCards:
  - id: setup
    title: A network that barely connected
    body: When Jonathan Goldman joined LinkedIn in June 2006, the site had just under 8 million accounts. Members were signing up and then going quiet. Connections were being made at well below the rate executives expected, and nobody had named exactly why. [hbr-2012]
    sourceIds: [hbr-2012]
    confidence: confirmed
  - id: problem
    title: The ghost in the data
    body: The social graph LinkedIn needed already existed, invisibly, in every user's email inbox. Everyone who had ever worked with anyone had evidence of that relationship sitting in Outlook, Gmail, or Yahoo Mail. LinkedIn just could not see it without permission. [hbr-2012, benchhacks-linkedin]
    sourceIds: [hbr-2012, benchhacks-linkedin]
    confidence: high_confidence
  - id: tempting-move
    title: The obvious answer
    body: A careful product team would have built better search, added prompts like "add colleagues from your current job," or politely asked users to fill out their connections manually. Passive and permission-respecting, and almost certainly not enough to break the plateau. [hbr-2012]
    sourceIds: [hbr-2012]
    confidence: high_confidence
  - id: mechanism
    title: Triangle closing as an ad
    body: Goldman built a custom module and published it as an ad, bypassing the standard product release cycle with Hoffman's blessing. The module showed each user their three statistically likeliest unconnected contacts, based on triangle closing and shared employers. [hbr-2012, li-engineering-pymk]
    sourceIds: [hbr-2012, li-engineering-pymk]
    confidence: confirmed
  - id: evidence
    title: The numbers moved
    body: The click-through rate on Goldman's PYMK ads was the highest LinkedIn had ever seen. Once promoted to a standard feature, it drove millions of new page views and shifted LinkedIn's growth trajectory upward. More than 50% of LinkedIn's professional graph would eventually be built by this feature. [hbr-2012, li-engineering-pymk]
    sourceIds: [hbr-2012, li-engineering-pymk]
    confidence: confirmed
  - id: takeaway
    title: The implicit graph made explicit
    body: PYMK's lasting contribution is the observation that weak professional ties already exist, encoded in email metadata, and that surfacing them at the right moment is more valuable than asking users to recall them. Every major social platform would run the same play within a decade. [gizmodo-pymk-2018]
    sourceIds: [gizmodo-pymk-2018]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Build better search so users can find specific people by name or company
      - Add prompts asking users to enter their current and former colleagues manually
      - Show a "You have N potential connections at your company" badge on the homepage
      - Ask users to rate which suggested connections they actually know, and learn from the ratings over time
    summary: Treat network density as a user-education problem and wait for members to fill in the graph themselves.
  whatShipped:
    label: What shipped
    bullets:
      - A physicist reads the connection data and recognises that shared employers and triangle-closed paths predict real-world acquaintance
      - A custom ad module shows each user their three likeliest unconnected contacts, served at the top of popular pages
      - A single-click action to connect, reducing the friction to near zero
      - The module ships as an ad, bypassing the product release cycle, so the experiment runs before any committee can stop it
    summary: Treat the implicit social graph already living in email metadata as the missing seed dataset, and surface it one triangle at a time.
lifecycle:
  - date: 2003-05
    label: LinkedIn launches
    description: Professional network goes public; early growth is slow.
    type: launch
  - date: 2006-03
    label: First month of profitability
    description: LinkedIn turns profitable with under 8 million members.
    type: milestone
  - date: 2006-06
    label: Goldman arrives
    description: Physicist Jonathan Goldman joins LinkedIn, begins studying the connection graph.
    type: milestone
  - date: 2006
    label: PYMK experiment ships as an ad
    description: Goldman bypasses product cycle; click-through rates are the highest ever seen.
    type: launch
  - date: 2007-04
    label: PYMK becomes a standard feature
    description: LinkedIn promotes the module to the main homepage; membership approaches 10 million.
    type: milestone
  - date: 2008-05
    label: Facebook copies PYMK
    description: Facebook launches an identical feature under the identical name.
    type: milestone
  - date: 2026
    label: PYMK is now universal
    description: Every major social and professional platform runs a variant of the algorithm.
    type: today
takeaway:
  principle: The social graph a platform needs already exists in users' email; the product that finds it first wins.
  sourceIds: [hbr-2012, li-engineering-pymk]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy hero illustration for LinkedIn's 2006 People You May Know feature. Canvas role: hero, aspect 2400x1350. Compose a wide cream #faf6f0 surface. On the left, draw a schematic inbox column in mist #dfe6dc with three simple horizontal envelope shapes in charcoal #1e211c, representing email contacts. On the right, draw a forest-green #4a7c59 network graph with four circular node shapes connected by thin deep forest #244232 lines, forming one closed triangle. Between the inbox and the graph, draw a single soft amber #c9ad68 arrow bridging the two, labelled with small charcoal text reading PYMK. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small narrator in the upper right, pointing one mitten hand at the triangle in the network graph. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Leave quiet space in the upper left for title overlay. No human faces, no photorealism, no recreated LinkedIn UI screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A cream editorial illustration showing email envelope shapes on the left connected by an amber arrow to a closed triangle network graph on the right, with Hatch pointing at the triangle.
    caption: The social graph was already there. It lived in everyone's inbox.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric scene illustration for LinkedIn's 2006 office, aspect 1600x1600. Show a warm cream #faf6f0 open-plan workspace with a forest-green #4a7c59 desk holding a laptop. The laptop screen shows two abstract panel shapes: one in mist #dfe6dc (the inbox) and one in deep forest #244232 (the graph), connected by a soft amber #c9ad68 line. Scatter three small charcoal #1e211c node-and-edge shapes across the desktop as sketches. Add a low amber #705c30 bookshelf in the background holding two thin volumes. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as the main narrator standing beside the desk, one mitten hand raised toward the laptop screen in a pointing gesture. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human figures other than Hatch, no photorealism, no real LinkedIn screenshots, no logos. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch stands beside a warm-lit desk holding a laptop showing an inbox panel and a network graph panel, with node sketches scattered across the desk surface.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric mechanism diagram illustrating LinkedIn's PYMK triangle-closing algorithm, aspect 1800x1200. On cream #faf6f0, lay out three stages from left to right. Stage one: two separate forest-green #4a7c59 circle nodes labelled A and C, with no edge between them, connected each by separate edges to a third node B in deep forest #244232. Stage two: a soft amber #c9ad68 pulsing arc appearing between A and C, labelled TRIANGLE CLOSE. Stage three: a single-click UI stub in mist #dfe6dc with a small charcoal connect button, labelled ONE CLICK. Connect the three stages with thin charcoal #1e211c arrow lines. Add a small charcoal label beneath stage one reading SHARED EMPLOYER SIGNALS and a small label beneath stage two reading LINK PREDICTION. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in a thinking pose at the lower right, pointing at stage two's pulsing arc. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No screenshots, no real UI recreations, no dense text beyond the short labels. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Three-stage diagram showing nodes A and C unconnected on the left, a pulsing amber arc closing the triangle in the middle, and a single-click connect button on the right, with Hatch pointing at the triangle stage.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric evidence card illustrating PYMK's click-through rate advantage and graph-building scale, aspect 1600x1000. On cream #faf6f0, draw two adjacent bar shapes. Left bar: a shorter mist #dfe6dc column labelled OTHER PROMPTS. Right bar: a taller forest-green #4a7c59 column labelled PYMK, with a small soft amber #c9ad68 tag at the top reading 30% HIGHER. Below the bars, draw a wide deep forest #244232 band labelled 50% OF LINKEDIN'S PROFESSIONAL GRAPH, with charcoal #1e211c tick marks showing accumulation over time. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png standing between the two bar shapes in a pointing pose, one mitten hand raised toward the taller PYMK bar. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No fake screenshots, no dense text beyond short labels. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Two bar shapes of unequal height labelled Other Prompts and PYMK, with Hatch pointing at the taller bar and a wide band below labelled 50% of LinkedIn's Professional Graph.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric lesson illustration for the takeaway that implicit social graphs in email metadata are a platform's most valuable unseized asset, aspect 1800x1200. Background is warm cream #faf6f0. Draw a large envelope shape in mist #dfe6dc on the left, with three small charcoal #1e211c horizontal lines inside representing contacts. Draw a soft amber #c9ad68 ribbon flowing rightward from the envelope into a forest-green #4a7c59 triangle formed by three connected node circles. Above the triangle, draw a thin deep forest #244232 label reading THE GRAPH WAS ALWAYS THERE. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in a calm coaching pose to the left of the envelope, one mitten hand resting on its edge, facing the reader. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no photorealism, no recreated screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A large envelope on the left with an amber ribbon flowing into a closed triangle node graph on the right, with Hatch coaching calmly from beside the envelope.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric thumbnail composition for LinkedIn's PYMK feature, aspect 1200x900. On warm cream #faf6f0, render one bold focal shape: a closed triangle formed by three forest-green #4a7c59 circle nodes connected by deep forest #244232 edges, with a soft amber #c9ad68 glow along one newly-closed edge to mark the moment of connection. Keep the triangle centred and large enough to be legible at small sizes. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a tiny mark in the bottom-left corner, no larger than 12 percent of canvas height. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No labels, no screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A bold closed triangle of three green nodes with an amber-glowing newly-closed edge, readable at small sizes, with a tiny Hatch mark in the corner.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric social cover image for LinkedIn's PYMK feature, aspect 2400x1260. On warm cream #faf6f0, centre a composition occupying the middle 70 percent of the canvas. On the left, a mist #dfe6dc inbox column with three envelope shapes. In the centre, a soft amber #c9ad68 bridge arrow. On the right, a closed triangle of three forest-green #4a7c59 nodes connected by deep forest #244232 edges. Above the bridge arrow, place a small charcoal #1e211c label reading THE IMPLICIT GRAPH. Keep edge-critical details away from canvas borders. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small narrator in the upper right corner, one mitten hand pointing at the triangle. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No fake screenshots, no human faces, no dense text beyond the short label. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A wide cover showing an inbox column on the left connected by an amber bridge arrow to a closed triangle network on the right, with Hatch pointing at the triangle and a short label reading THE IMPLICIT GRAPH.
    watermark: HackProduct
nextInQueue:
  slug: youtube-autoplay
  companySlug: google
  title: YouTube Autoplay
---

<!-- beat: lede -->

In June 2006, a physicist named Jonathan Goldman arrived at LinkedIn's Mountain View office to find just under eight million members and a network that was barely connecting [hbr-2012]. Members were signing up, accepting a few invitations, and then going quiet. One LinkedIn manager described it to Harvard Business Review as being like arriving at a conference reception and realising you don't know anyone, so you stand in the corner sipping your drink, and you leave early [hbr-2012].

Goldman noticed something in the data. If two people both knew a third person on LinkedIn, the probability that they knew each other in real life was substantially above the platform-wide base rate. The graph already encoded most of the professional relationships the product was trying to build. The problem was that the platform was not showing users the connections they had in the world but hadn't yet made official on the site [hbr-2012][li-engineering-pymk].

The feature he built, People You May Know, is now responsible for more than half of every connection ever made on LinkedIn [li-engineering-pymk]. Facebook launched a copy in 2008 and kept the name [gizmodo-pymk-2018]. Twitter followed with its own variant. The pattern is so standard now it is invisible. The question worth holding through the read is the smaller one: why did it take a physicist, and not the product team, to see what the graph was already saying?

<!-- beat: glance -->
## At a glance

**1. A network that barely connected**

When Jonathan Goldman joined LinkedIn in June 2006, the site had just under 8 million accounts. Members were signing up and then going quiet. Connections were being made at well below the rate executives expected, and nobody had named exactly why. [hbr-2012]

**2. The ghost in the data**

The social graph LinkedIn needed already existed, invisibly, in every user's email inbox and professional history. Everyone who had ever worked alongside anyone had evidence of that relationship sitting in their address book. LinkedIn just could not see it without permission. [hbr-2012, benchhacks-linkedin]

**3. The obvious answer**

A careful product team would have built better search, added prompts like "add colleagues from your current job," or politely asked users to fill out their connections manually. Passive and permission-respecting, and almost certainly not enough to break the plateau. [hbr-2012]

**4. Triangle closing as an ad**

Goldman built a custom module and published it as an ad, bypassing the standard product release cycle with Hoffman's blessing. The module showed each user their three statistically likeliest unconnected contacts, based on triangle closing and shared employers. [hbr-2012, li-engineering-pymk]

**5. The numbers moved**

The click-through rate on Goldman's PYMK ads was the highest LinkedIn had ever seen. Once promoted to a standard feature, it drove millions of new page views and shifted LinkedIn's growth trajectory upward. More than 50% of LinkedIn's professional graph would eventually be built by this one feature. [hbr-2012, li-engineering-pymk]

**6. The implicit graph made explicit**

PYMK's lasting contribution is the observation that weak professional ties already exist, encoded in shared employment history and email metadata, and that surfacing them at the right moment is more valuable than asking users to recall them from memory. Every major social platform would run the same play within a decade. [gizmodo-pymk-2018]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

LinkedIn launched in May 2003 as a professional network built on the premise that business relationships, unlike personal ones, should live in a structured, searchable place. Reid Hoffman, Konstantin Guericke, Allen Blue, Eric Ly, and Jean-Luc Vaillant founded it together; the product went live with 300 employees at its back and a clear hypothesis: professionals would want a real-identity graph where their work history and connections travelled with them across employers [benchhacks-linkedin]. The early years were not spectacular. Growth was slow enough that the founding team spent significant time debating whether the network would ever become dense enough to be useful. A sparse professional graph has nearly the same value as no graph at all.

By 2004, LinkedIn had built an Outlook plugin to scrape users' contact lists, and by March 2006 the company turned its first monthly profit [benchhacks-linkedin]. The milestones were real but the underlying problem persisted. An account that signed up and made fewer than a handful of connections generated little reason to return. The homepage, for a member with a thin network, was a quiet room with nothing to do in it. The engineering team was occupied with scaling; the product roadmap was focused on jobs listings and subscriptions. No one had quite articulated the connection-rate problem as something data could solve.

That is the context when Goldman arrives in June 2006 with a physics PhD from Stanford and an interest in what the connection patterns actually looked like [hbr-2012]. His colleagues were not enthusiastic. The engineering team was focused on keeping the infrastructure running at scale, and some were openly dismissive. Why would LinkedIn need to guess at a user's connections when the site already had an address book importer? The importer let users upload their contacts and send invitations in bulk. The feature existed. The problem, Goldman argued, was that it put the cognitive work on the member, and cognitive work was the thing that stalled professional networks at precisely the moment they most needed momentum.

<!-- beat: choice -->
## The obvious answer and what shipped instead

The polite version of the solution was already in the product. The address book importer asked members to connect their email, extracted their contacts, and presented a long list of names to approve or dismiss. It was functional and well-intentioned, and it did not move the needle enough, because it still required users to recognize names from a raw alphabetical list and decide, one by one, whether the relationship was worth formalising [hbr-2012]. A careful product team would have polished that flow, added employer-specific prompts, or run messaging experiments urging members to complete their profiles. All of these improvements were reasonable. All of them remained squarely on the wrong side of the friction line.

| The tempting move | What shipped |
|---|---|
| Improve the address book importer flow | A module showing each user their three likeliest unknown-to-LinkedIn contacts |
| Add "Add colleagues from your current employer" prompts | Triangle-closing algorithm scoring friend-of-friend paths by shared employer tenure |
| Run campaigns urging users to fill in their connection lists | A single-click connect action reducing confirmation cost to near zero |
| *Treat network density as a user-education problem and wait for members to fill in the graph themselves.* | *Treat the implicit social graph as a seed dataset and surface one closed triangle at a time.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The detail Goldman noticed, the seam the whole algorithm rests on, is that two people who share a mutual LinkedIn connection are very likely to know each other directly. In graph terms: if Alice is connected to Bob, and Carol is connected to Bob, then Alice and Carol probably worked together at some point, even if neither has recorded that edge yet [li-engineering-pymk]. The triangle is closed in the real world. The platform just hasn't written it down.

Goldman built a model that scored every candidate pair on the probability that they knew each other [tiwari-2015]. The primary signals were shared employers, weighted by whether employment dates actually overlapped, how large the organisation was, and how socially active that type of organisation tended to be. Two people at a ten-person startup who overlapped for three years score very differently from two names listed under the same multinational bank with no date intersection. The organisational overlap model combined these signals into a single connection score per pair.

The interface decision was as important as the model. Goldman reduced the surface to three suggestions and one click [hbr-2012]. No algorithm explanation. No ranked list of dozens. Three names, a connect button, and a dismiss option to help future results improve. Accepting a suggestion cost almost nothing; ignoring one cost nothing either.

Hoffman had given Goldman the ability to ship small modules as ads on the site's most popular pages, bypassing the standard product release cycle [hbr-2012]. Goldman used this to place the experiment where members were already spending time, without waiting for a committee. Within days, the click-through rate was the highest LinkedIn had seen on any feature. The engineering team's earlier skepticism dissolved.

The constraint the design honoured was pure-opt-in connection: no one was connected without clicking. The constraint it ignored was social-graph purity. PYMK surfaced weak professional ties from brief overlaps years earlier, people a member barely knew, alongside close colleagues [interactually-creepy]. The decision to reach into the weak-tie layer rather than stay within strong ties drove growth faster, and generated the privacy backlash that would follow the feature for years. The second-order effect the team accepted was the double viral loop: a new member who connected via PYMK triggered a notification to that contact, who returned and was then shown their own PYMK suggestions [benchhacks-linkedin]. Two loops ran at once. The effect the team did not fully anticipate was how unsettling it would feel to users whose professional and personal circles were meant to stay separate.

<!-- beat: evidence -->
## Evidence

The click-through rate claim comes directly from the Harvard Business Review account by Davenport and Patil, which draws on Goldman's own experience [hbr-2012]. The 30 percent advantage over other prompts is stated explicitly in that source. The 50 percent of LinkedIn's professional graph attribution comes from LinkedIn Engineering's own published description of the PYMK team [li-engineering-pymk]. These numbers are among the better-sourced metrics in product history, originating from LinkedIn itself and a named practitioner account in a reviewed journal.

The growth trajectory is harder to isolate. LinkedIn was improving across several dimensions in 2006 and 2007: its jobs product was maturing, its public profiles were indexing in Google, and the company was reaching profitability for the first time [benchhacks-linkedin]. PYMK is the move the historical record returns to, and the click-through data supports giving it significant weight. But no public source breaks out the share of net member growth attributable to PYMK versus the other changes running in parallel. The causal story is cleaner in the retelling than it was in the data at the time.

One number the public record does not confirm is the pre-PYMK plateau. The story implies a stall before June 2006, but the precise growth rate in the months before Goldman's experiment is not stated in a citable source. That gap is worth naming rather than filling with inference.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| LinkedIn accounts when Goldman arrived (June 2006) | Just under 8 million | Confirmed | [hbr-2012] |
| PYMK click-through rate advantage over other prompts | 30% higher | Confirmed | [hbr-2012] |
| Share of LinkedIn's professional graph built by PYMK | More than 50% | Confirmed | [li-engineering-pymk] |
| LinkedIn members by April 2007 | Approaching 10 million | High confidence | [benchhacks-linkedin] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "People with more friends use the site more."
>
> — Lars Backstrom, Facebook Engineering Lead, PYMK presentation, July 2010 [gizmodo-pymk-2018]

<!-- beat: aftermath -->
## Timeline

1. **2003-05**, LinkedIn launches publicly with under a million users.
2. **2006-03**, LinkedIn records its first monthly profit; membership nears 8 million.
3. **2006-06**, Goldman arrives and begins analysing connection patterns; PYMK ships as an ad module within months.
4. **2007-04**, PYMK promoted to a standard homepage feature; membership approaches 10 million.
5. **2008-05**, Facebook launches an identical feature under the identical name. [gizmodo-pymk-2018]
6. **2026**, PYMK runs daily across every major social and professional platform; it processes hundreds of billions of candidate connections per day on LinkedIn alone. [li-engineering-pymk]

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **The social graph a platform needs already exists in users' email; the product that finds it first wins.**
>
> — HackProduct autopsy

The same move appeared in different clothing at Facebook, which in 2010 acquired Octazen, a Malaysian contact-importing service, specifically to feed its own PYMK engine with address-book data from across the web [gizmodo-pymk-2018]. Twitter's "Who to Follow" recommendations, launched in 2010, applied the same triangle-closing logic to follower graphs rather than professional history. In each case, the insight was identical to Goldman's: the platform does not need to build the social graph from scratch, because the social graph already exists in the metadata users have been generating for years in their inboxes and calendars. The product question is only whether to ask for permission to read it.

<!-- beat: references -->
## References

1. **Data Scientist: The Sexiest Job of the 21st Century**, Harvard Business Review · Tier A · accessed 2026-05-17. https://hbr.org/2012/10/data-scientist-the-sexiest-job-of-the-21st-century
   Supports: The canonical narrative of Goldman arriving in June 2006, the conference-reception analogy, the PYMK experiment as an ad module bypassing the product cycle, click-through rates, and Hoffman's grant of autonomy.

2. **People You May Know**, LinkedIn Engineering · Tier A · accessed 2026-05-17. https://engineering.linkedin.com/teams/data/artificial-intelligence/people-you-may-know
   Supports: Triangle closing as the foundational algorithm, the 50% of professional graph attribution, the binary classification framing, and the scale of daily computation.

3. **Reinventing People You May Know at LinkedIn**, LinkedIn Pulse (Mitul Tiwari) · Tier A · accessed 2026-05-17. https://www.linkedin.com/pulse/reinventing-people-you-may-know-linkedin-mitul-tiwari
   Supports: Technical detail on the organisational overlap model, impression discounting, and the link-prediction framing.

4. **LinkedIn Growth Study**, BenchHacks · Tier B · accessed 2026-05-17. https://benchhacks.com/growthstudies/linkedin-growth-hacks.htm
   Supports: The double viral loop design, the 2004 Outlook plugin, first profitability in March 2006, and the Endorsements follow-on.

5. **People You May Know: A Controversial Facebook Feature's 10-Year History**, Gizmodo · Tier B · accessed 2026-05-17. https://gizmodo.com/people-you-may-know-a-controversial-facebook-features-1827981959
   Supports: LinkedIn's 2006 launch, Facebook's 2008 adoption of the identical name, Lars Backstrom's quote, and the early AdWeek privacy report.

6. **Learn more about People You May Know**, LinkedIn Official Blog · Tier A · accessed 2026-05-17. https://www.linkedin.com/blog/member/archive/learn-more-abou-2
   Supports: Feature had been live for almost a year by April 2008, the three-recommendation module design, and the feedback-to-refine-algorithms framing.

7. **LinkedIn is the Creepiest Social Network**, Interactually · Tier C · accessed 2026-05-17. https://www.interactually.com/linkedin-creepiest-social-network/
   Supports: User privacy backlash and the stalking concerns that led LinkedIn to add a blocking feature.

<!-- beat: forward -->
## Next in queue

**YouTube Autoplay**, The feature that turned a video site into a television, and made a decade of attention-economy criticism inevitable.

→ [/autopsies/google/youtube-autoplay](/autopsies/google/youtube-autoplay)
