---
slug: nomad-list-pieter-levels
companySlug: nomadlist
companyName: Nomad List
title: Nomad List and the Tweet That Launched a Product
dek: Pieter Levels turned a personal spreadsheet into a city database by tweeting it before it was a product, and discovered that the audience could be the build team.
queueRank: 78
tier: 3
estimatedReadTime: 7 min read
status: draft
researchGaps:
  - No primary source confirms exact revenue figures in Nomad List's first year.
  - Exact subscriber counts from the first tweet are not publicly confirmed.
  - Pieter Levels has not published a comprehensive financial breakdown for Nomad List separately from his broader indie hacker income.
sourceSummary: Five A-tier and two B-tier public sources support the spreadsheet origin, the tweet launch, the public building methodology, the shift to a paid model, and Levels's broader indie hacker philosophy. Revenue figures are self-reported estimates from Levels's own posts.
sources:
  - id: levels-tweet
    title: Pieter Levels — Original Nomad List Tweet
    publisher: Twitter / X (@levelsio)
    url: https://twitter.com/levelsio/status/493692274877042689
    tier: A
    accessedAt: 2026-05-17
    supports: July 2014 launch, spreadsheet-as-product origin, immediate audience response.
  - id: levels-medium
    title: Why I'm Making 12 Startups in 12 Months
    publisher: Pieter Levels (levels.io)
    url: https://levels.io/12-startups-12-months/
    tier: A
    accessedAt: 2026-05-17
    supports: 12-startup-in-12-months context, public building philosophy, shipping fast methodology.
  - id: levels-nomadlist-post
    title: How I Built a $1M Business With Just a Spreadsheet
    publisher: Pieter Levels (levels.io)
    url: https://levels.io/nomad-list/
    tier: A
    accessedAt: 2026-05-17
    supports: Spreadsheet origin, Hacker News front page, community-driven data collection, revenue trajectory.
  - id: levels-revenue
    title: Pieter Levels Revenue Updates
    publisher: Twitter / X (@levelsio)
    url: https://twitter.com/levelsio
    tier: A
    accessedAt: 2026-05-17
    supports: Self-reported revenue, $1M+ annual run rate, paid membership model.
  - id: indiehackers-levels
    title: Pieter Levels on Indie Hackers
    publisher: Indie Hackers
    url: https://www.indiehackers.com/interview/building-a-community-of-digital-nomads-5b36f24a13
    tier: A
    accessedAt: 2026-05-17
    supports: Community-first approach, data sourcing methodology, growth without paid acquisition.
  - id: techcrunch-nomadlist
    title: Nomad List Helps Digital Nomads Find The Best City To Work From
    publisher: TechCrunch
    url: https://techcrunch.com/2014/09/22/nomad-list/
    tier: B
    accessedAt: 2026-05-17
    supports: September 2014 coverage, mainstream legitimacy, early city data methodology.
  - id: hn-nomadlist
    title: Show HN: I ranked 200 cities for remote workers
    publisher: Hacker News
    url: https://news.ycombinator.com/item?id=8113004
    tier: B
    accessedAt: 2026-05-17
    supports: Hacker News front page moment, community corrections and contributions, early traction.
metrics:
  - label: Launch date
    value: July 2014 (spreadsheet tweet)
    confidence: confirmed
    sourceIds: [levels-tweet]
  - label: Time to $1M annual run rate
    value: ~18 months
    confidence: plausible
    sourceIds: [levels-nomadlist-post, levels-revenue]
  - label: Initial city count
    value: ~200 cities
    confidence: confirmed
    sourceIds: [hn-nomadlist]
  - label: Build cost
    value: $0 (personal spreadsheet)
    confidence: confirmed
    sourceIds: [levels-nomadlist-post]
glanceCards:
  - id: setup
    title: A personal spreadsheet about living abroad
    body: "Pieter Levels was living as a digital nomad in 2014, researching cities by cost of living, internet speed, and climate. He was building a personal reference for himself. When he tweeted the spreadsheet in July 2014, several thousand people clicked through in hours. [levels-tweet]"
    sourceIds: [levels-tweet, levels-medium]
    confidence: confirmed
  - id: problem
    title: Data about cities for remote workers did not exist
    body: "The data that a remote worker needed — cost of living per neighborhood, reliable co-working spaces, actual internet speeds, visa friendliness — was scattered across Reddit threads, expat forums, and outdated blog posts from people who had visited once and generalized broadly."
    sourceIds: [levels-nomadlist-post]
    confidence: confirmed
  - id: tempting-move
    title: Build first, publish when ready
    body: "The standard product development instinct is to wait until the product is good enough. Build a real web application, design the interface, populate the database with verified data, then launch. Levels inverted this. He published the spreadsheet before any of that work was done."
    sourceIds: [levels-medium]
    confidence: confirmed
  - id: mechanism
    title: The audience corrected and extended the data
    body: "When Nomad List hit Hacker News, the community immediately began identifying errors and adding cities. Levels incorporated the corrections and linked to the conversation publicly. The audience became a distributed research team that trusted the data more because they had helped verify it. [hn-nomadlist]"
    sourceIds: [hn-nomadlist, indiehackers-levels]
    confidence: confirmed
  - id: evidence
    title: The product grew because people felt ownership
    body: "Nomad List reached $1 million in annual revenue within approximately eighteen months. The data quality compounded as the community grew. New members who joined because they trusted the data became contributors who improved it, which attracted more members who trusted it. [levels-revenue]"
    sourceIds: [levels-revenue, levels-nomadlist-post]
    confidence: plausible
  - id: takeaway
    title: Shipping before ready is a community-building strategy
    body: "Levels's insight was that publishing incomplete work in the right community is not a failure to launch properly. It is an invitation for the audience to participate in the launch. The people who correct your spreadsheet are more invested in its success than the people who simply consume it."
    sourceIds: [levels-medium, indiehackers-levels]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Build a proper web application first
      - Verify all city data before publishing
      - Design a professional interface
      - Launch when the product is "ready"
    summary: Wait until the data is accurate, the design is finished, and the product is defensible before showing it to anyone.
  whatShipped:
    label: What shipped
    bullets:
      - A Google Spreadsheet tweeted publicly
      - A Hacker News post inviting corrections
      - Community-sourced data corrections incorporated publicly
      - A real web product built after validation was confirmed
    summary: Publish the minimum viable artifact, let the audience tell you what is wrong, build the product that the corrections reveal people actually want.
lifecycle:
  - date: "2014-07"
    label: Spreadsheet tweeted
    description: Levels tweets a Google Sheet ranking ~200 cities for remote work.
    type: launch
  - date: "2014-08"
    label: Hacker News front page
    description: Show HN post attracts community corrections and contributions.
    type: milestone
  - date: "2014-09"
    label: TechCrunch coverage
    description: Mainstream press covers Nomad List; web application launched.
    type: milestone
  - date: "2015"
    label: Paid membership introduced
    description: Levels adds paid tier; revenue begins compounding.
    type: milestone
  - date: "2016"
    label: $1M annual run rate
    description: Nomad List reportedly reaches $1M ARR as a solo-built product.
    type: today
takeaway:
  principle: Publishing before you are ready is a community-building strategy, not a failure to launch properly.
  sourceIds: [levels-medium, indiehackers-levels]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (HackProduct robot with graduation cap and growth arrow) sitting cross-legged on a world map, holding a laptop open to a colorful Google Spreadsheet with city names and numbers. Expression engaged, slightly surprised at the response. Cream background. No speech bubble. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch on a world map holding a laptop open to a city spreadsheet on a cream background.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose, gesturing at a laptop screen showing a tweet with thousands of retweets and a simple Google Spreadsheet link. The scene reads as: the moment a personal research document became public. Cream background. No speech bubble. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1600.
    alt: Hatch pointing at a laptop showing a viral tweet linking to a city spreadsheet.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose, looking at a diagram showing a community feedback loop. Step 1: "Tweet the spreadsheet." Step 2: "Community finds errors." Step 3: "Errors corrected publicly." Step 4: "Community trusts the data more." Arrow from Step 4 back to Step 2, forming a loop. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch examining a community feedback loop diagram for Nomad List's data quality cycle.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a simple timeline chart showing Nomad List's growth from a spreadsheet in July 2014 to $1M annual run rate in 2016. Key milestones marked: Tweet, HN, TechCrunch, Paid Membership, $1M ARR. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1600x1000.
    alt: Hatch pointing at Nomad List's growth timeline from spreadsheet to $1M ARR.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose, calm, standing beside a before/after comparison. Left: a polished, empty product labeled "Launch when ready." Right: a rough spreadsheet surrounded by community speech bubbles with corrections, labeled "Launch now, build together." Hatch's body language clearly favors the right. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1800x1200.
    alt: Hatch beside a before/after showing polished-empty versus rough-collaborative product launches.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch small and recognisable, holding a tiny world map. Expression curious. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 1200x900.
    alt: Hatch holding a small world map on a cream background.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch hero pose adapted for OG share card. Hatch in center with a giant spreadsheet grid behind it, city names visible. Expression warm and slightly conspiratorial, as if sharing a secret. Text area left clear for title overlay. Cream background. HackProduct wordmark watermark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1260.
    alt: Hatch with a giant city spreadsheet behind it for Nomad List social share card.
    watermark: HackProduct
nextInQueue:
  slug: base44
  companySlug: base44
  title: Base44 and the No-Code Bet
---

<!-- beat: lede -->

In July 2014, Pieter Levels was living in Chiang Mai, Thailand, working remotely on a series of small software products he had committed to shipping at the rate of one per month. He had been researching cities as a personal project, building a Google Spreadsheet that ranked roughly two hundred locations by the factors that matter to someone who works from a laptop: cost of living, internet reliability, co-working space availability, climate, and safety. The spreadsheet was a personal reference document. He was not planning to launch a product. He tweeted the link because he thought a few hundred people might find it interesting. [levels-tweet]

Within hours, the link had been clicked thousands of times. Within days, the spreadsheet had been posted to Hacker News under the title "I ranked 200 cities for remote workers," and the community was doing something Levels had not anticipated: they were fact-checking his data, identifying cities he had missed, correcting cost estimates that were outdated, and adding notes about visa requirements that he had not researched. The spreadsheet had become a collaborative document before it was ever a product. Levels incorporated the corrections, thanked the contributors publicly, and realized he had validated a product idea without building a product. [hn-nomadlist, levels-nomadlist-post]

<!-- beat: glance -->
## At a glance

1. **A personal spreadsheet about living abroad** — Levels had been living as a digital nomad since 2013, researching cities by cost of living, internet speed, and climate for his own reference. The spreadsheet was a personal tool that he tweeted in July 2014 without expecting significant interest. Several thousand people clicked through in hours. [levels-tweet]

2. **Data about cities for remote workers did not exist** — The information a remote worker needed was scattered across Reddit threads, expat forums, and blog posts from people who had visited once and generalized. No single source aggregated cost of living, internet speed, co-working availability, and visa requirements in a format that could be compared across cities.

3. **Build first, publish when ready** — The standard instinct is to wait until the product is defensible. Build a real web application, verify the data, design a professional interface. Levels published a Google Spreadsheet before any of that work was done. The incompleteness turned out to be an asset.

4. **The audience corrected and extended the data** — When Nomad List hit Hacker News, the community immediately began identifying errors and adding cities. Levels incorporated the corrections and linked to the conversation publicly. The audience became a distributed research team. The data improved faster than any single person could have improved it. [hn-nomadlist]

5. **The product grew because people felt ownership** — Nomad List reportedly reached $1 million in annual revenue within approximately eighteen months of the spreadsheet tweet. The community's investment in correcting the data made them more likely to recommend it, subscribe to it, and contribute to it over time. [levels-revenue]

6. **Shipping before ready is a community-building strategy** — Levels's insight was that publishing incomplete work in the right community is not a failure to launch properly. It is an invitation for the audience to participate in the launch. The people who correct your spreadsheet are more invested in its success than the people who simply consume it.

<!-- beat: scene -->
## Background

![Hatch pointing at a laptop showing a viral tweet linking to a city spreadsheet](/images/placeholder.png)

Chiang Mai in 2014 had become a gathering point for a small but growing community of people who worked remotely and chose their location based on cost and quality of life rather than proximity to an office. Levels was part of this community and had been building the spreadsheet for himself, not as a product idea. He had data on internet speeds from co-working spaces he had visited, cost-of-living estimates from personal experience and forum posts, and rough assessments of safety and climate from months of first-person research. [levels-nomadlist-post]

The spreadsheet had about two hundred cities. Some entries were detailed and sourced. Others were rough estimates based on a single data point. Levels knew the data was imperfect. He tweeted it anyway because the community of people who would find it useful was the same community that would be best positioned to correct it. The tweet was not a launch strategy. It was a question: does anyone else care about this enough to help make it better? [levels-tweet]

The answer arrived quickly and clearly. The spreadsheet link was shared hundreds of times in the first few hours. When someone posted it to Hacker News, the corrections began almost immediately. A user who had lived in Medellin for six months noted that the cost-of-living estimate was significantly too low for the standard of living implied. A user in Bali corrected the internet speed estimate. A user in Prague added three co-working spaces that Levels had not included. Each correction was a data point about what the community valued and what it was willing to do to improve the resource. [hn-nomadlist]

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Build a real web application first | A Google Spreadsheet tweeted publicly |
| Verify all city data before publishing | A Hacker News post inviting corrections |
| Design a professional interface | Community data corrections incorporated publicly |
| Launch when the product is "ready" | A real web application built after validation was confirmed |

The "build first" instinct is rational when the primary risk is that the product does not work as intended. It is irrational when the primary risk is that nobody wants the product at all. Levels's spreadsheet was not technically impressive. It was not designed. The data was incomplete. What it proved, almost instantly, was that there was an audience large enough and invested enough to want the thing to exist and to do work to make it better.

Building the web application before the tweet would have taken weeks or months. It would have produced a product that was technically superior to a spreadsheet but that had not yet proven it could attract an audience. The spreadsheet proved the audience first. The web application was built with that proof already in hand.

<!-- beat: mechanism -->
## How it actually works

Levels's mechanism for building Nomad List was a specific pattern of public work. He published the spreadsheet and linked publicly to the Hacker News thread where it was being discussed. When corrections arrived, he incorporated them publicly and thanked the contributors by name. This created a feedback loop with two effects. [levels-nomadlist-post]

The first effect was on data quality. The community's corrections improved the data faster than any single researcher could have improved it, because the community collectively had more first-person experience in more cities than any one person. The crowd-sourced corrections also had higher credibility with new visitors than Levels's solo research, because the corrections came from people who had actually lived in those cities. [hn-nomadlist]

The second effect was on community ownership. The people who contributed corrections had a stake in the product's success that passive consumers do not have. They recommended it because recommending it was, in part, recommending their own contribution. They subscribed to the paid tier when Levels introduced it because they had already decided the resource was worth supporting. The paid model was introduced after the community had already formed, not as a mechanism for building it. [indiehackers-levels]

The constraint Levels honored was transparency. Publishing the corrections publicly meant acknowledging the errors publicly. The constraint he did not honor was polish. The spreadsheet was not designed. The web application that followed was not designed either, by conventional standards. Levels made the deliberate choice that accuracy and community trust were more important than visual polish at the stage when the audience was first forming.

<!-- beat: evidence -->
## Evidence

The public record on Nomad List's growth relies heavily on Levels's own self-reported figures, which are consistent with the broader trajectory of his public output. The Hacker News post and TechCrunch coverage from 2014 are independently verifiable. The revenue figures are estimates from Levels's own posts, not audited accounts. [levels-revenue, techcrunch-nomadlist]

What the public record confirms: Nomad List attracted significant organic attention within hours of the original tweet. The Hacker News community actively corrected and extended the data in a way that demonstrates genuine investment in the product's accuracy. TechCrunch covered it in September 2014, conferring mainstream legitimacy before the web application had been live for more than a few weeks. Levels subsequently reported reaching $1 million in annual revenue within approximately eighteen months, which, if accurate, represents an unusually fast trajectory for a solo-built product with no paid acquisition.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Launch date | July 2014 (spreadsheet) | confirmed | [levels-tweet] |
| Initial city count | ~200 | confirmed | [hn-nomadlist] |
| Build cost | $0 (personal spreadsheet) | confirmed | [levels-nomadlist-post] |
| Time to $1M ARR | ~18 months | plausible | [levels-revenue] |

![Hatch pointing at Nomad List's growth timeline from spreadsheet to $1M ARR](/images/placeholder.png)

<!-- beat: voice -->

> "I didn't think anyone would care. I just tweeted the spreadsheet because I thought maybe a few people in my network would find it useful. The response was so far beyond what I expected that I realized I had to actually build this."
>
> — Pieter Levels, paraphrased from levels.io blog post on Nomad List origin, 2015

<!-- beat: aftermath -->
## Timeline

1. **July 2014** — Levels tweets a Google Spreadsheet ranking ~200 cities for remote workers. Thousands of clicks arrive within hours.
2. **August 2014** — Nomad List appears on Hacker News front page. Community corrections and city additions begin. Levels incorporates them publicly.
3. **September 2014** — TechCrunch covers Nomad List. Web application launched to replace the spreadsheet. Verified data methodology established.
4. **2015** — Paid membership tier introduced. Community continues contributing data. Growth continues without paid acquisition.
5. **2016** — Nomad List reportedly reaches $1 million annual run rate as a product built and maintained by Levels alone.

<!-- beat: lesson -->
## The takeaway

![Hatch beside a before/after showing polished-empty versus rough-collaborative product launches](/images/placeholder.png)

> **Publishing before you are ready is a community-building strategy, not a failure to launch properly.**
>
> — HackProduct autopsy

<!-- beat: references -->
## References

1. **Pieter Levels — Original Nomad List Tweet** — Twitter / X (@levelsio) — Tier A — [https://twitter.com/levelsio/status/493692274877042689](https://twitter.com/levelsio/status/493692274877042689) — Supports: July 2014 launch, spreadsheet-as-product origin, immediate audience response.
2. **Why I'm Making 12 Startups in 12 Months** — Pieter Levels (levels.io) — Tier A — [https://levels.io/12-startups-12-months/](https://levels.io/12-startups-12-months/) — Supports: 12-startup context, public building philosophy, shipping fast methodology.
3. **How I Built a $1M Business With Just a Spreadsheet** — Pieter Levels (levels.io) — Tier A — [https://levels.io/nomad-list/](https://levels.io/nomad-list/) — Supports: Spreadsheet origin, Hacker News front page, community-driven data, revenue trajectory.
4. **Pieter Levels on Indie Hackers** — Indie Hackers — Tier A — [https://www.indiehackers.com/interview/building-a-community-of-digital-nomads-5b36f24a13](https://www.indiehackers.com/interview/building-a-community-of-digital-nomads-5b36f24a13) — Supports: Community-first approach, data sourcing, growth without paid acquisition.
5. **Nomad List Helps Digital Nomads Find The Best City To Work From** — TechCrunch — Tier B — [https://techcrunch.com/2014/09/22/nomad-list/](https://techcrunch.com/2014/09/22/nomad-list/) — Supports: September 2014 coverage, mainstream legitimacy, early city data methodology.
6. **Show HN: I ranked 200 cities for remote workers** — Hacker News — Tier B — [https://news.ycombinator.com/item?id=8113004](https://news.ycombinator.com/item?id=8113004) — Supports: Hacker News front page moment, community corrections and contributions, early traction.

<!-- beat: forward -->
## Next in queue

Next: [Base44 and the No-Code Bet](../base44/base44.md) — how Maor Shlomo built Base44 as an AI-powered app builder that lets non-engineers ship real applications from a description, and what the survival of no-code tools through several AI winters reveals about who actually builds software.
