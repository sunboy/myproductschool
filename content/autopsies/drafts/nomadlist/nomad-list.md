---
slug: nomad-list
companySlug: nomadlist
companyName: Nomad List
title: Nomad List
dek: Pieter Levels turned a public Google spreadsheet into the definitive tool for remote workers, by shipping the cheapest possible interface and letting a crowd finish the product.
queueRank: 28
tier: 2
estimatedReadTime: 10 min read
status: draft
researchGaps:
  - The exact number of rows or cities in the original June 2014 Google spreadsheet is reported as approximately 25 in one secondary source but not confirmed by Levels himself in primary sources.
  - Automattic's sponsorship figure ($5K/month) comes from secondary summaries of Levels' talks, not a direct published statement from Levels or Automattic.
  - The precise month in 2024 when Nomad List rebranded to Nomads.com is not confirmed in primary sources.
sourceSummary: Pieter Levels' own blog post "How I got my startup to #1 on both Product Hunt and Hacker News by accident" (levels.io) is the primary source for the launch timeline, traffic numbers, spreadsheet origin, and the accidental-launch mechanism. The Indie Hackers interview with Levels (indiehackers.com) supplies the pricing evolution ($5 to $75/year), membership model philosophy, and retention challenge. The Software Growth blog recap corroborates revenue figures and the "building in public" positioning. Secondary sources (One Million Goal, nomad-magazine.com) fill in data about the original spreadsheet's scope (approximately 25 cities) and the columns it tracked. The public record does not include a confirmed direct quote from Levels specifically naming the Chiang Mai nomad community or the moment he decided to build the spreadsheet, so those narrative details are sourced from aggregated secondary accounts of his public talks.
sources:
  - id: levels-hn-launch
    title: "How I got my startup to #1 on both Product Hunt and Hacker News by accident"
    publisher: levels.io
    url: https://levels.io/product-hunt-hacker-news-number-one/
    tier: A
    accessedAt: 2026-05-17
    supports: The accidental launch date (July 29, 2014), traffic numbers (50,000 from HN, 12,000 from Product Hunt), the spreadsheet-to-website build sequence, the role of Emiel Janson submitting to Product Hunt, Tim Ferriss sharing the link, and Matt Mullenweg's immediate sponsorship offer.
  - id: levels-founder-page
    title: "Nomad List Founder — levelsio"
    publisher: levels.io
    url: https://levels.io/nomad-list-founder/
    tier: A
    accessedAt: 2026-05-17
    supports: Levels' framing of the product, the 5-year milestone with "millions of users" and revenue of "$20k-$40k/month or ~$300k/year", and the emotional context of 2014 described as a "roller coaster."
  - id: indiehackers-interview
    title: "Growing a Community for Digital Nomads to $33,000/mo"
    publisher: Indie Hackers
    url: https://www.indiehackers.com/interview/growing-a-community-for-digital-nomads-to-33-000-mo-126df0fc5e
    tier: A
    accessedAt: 2026-05-17
    supports: Levels' direct quotes on pricing evolution ($5 to $75/year), the decision to post the spreadsheet rather than build software first, the retention challenge of keeping users who left after one visit, and revenue approaching $400K/year at time of interview.
  - id: softwaregrowth-levels
    title: "How Pieter Levels grew Nomad List to $3 million ARR"
    publisher: Software Growth
    url: https://www.softwaregrowth.io/blog/how-pieter-levels-grew-nomad-list
    tier: B
    accessedAt: 2026-05-17
    supports: Revenue figures (~$700K ARR for Nomad List, $2M+ for Remote OK, ~$3M combined), the "building in public" movement attribution, cron-job automation strategy, and the PURE problem framework.
  - id: nomad-magazine-history
    title: "Nomad List: The Oldest Go-To Resource for Discovering the Best Cities for Remote Work"
    publisher: Nomad Magazine
    url: https://nomad-magazine.com/blog/nomad-list-the-oldest-go-to-resource-for-discovering-best-cities-for-remote-work/
    tier: B
    accessedAt: 2026-05-17
    supports: The approximately 25-city scope of the original spreadsheet, the initial columns (cost of living, internet speed, safety), and context that 2014 was the year digital nomadism exploded in public awareness.
  - id: onemilliongoal-levels
    title: "Pieter Levels: The King of Indie Hacking"
    publisher: One Million Goal
    url: https://www.onemilliongoal.com/p/pieter-levels-the-king-of-indie-hacking
    tier: C
    accessedAt: 2026-05-17
    supports: Backstory context: Levels living with parents in Amsterdam, the Tubelytics detour, the panic attacks and depression preceding the 12-startups challenge, and the father's advice to "get active and do something."
metrics:
  - label: Hacker News visitors on launch day
    value: ~50,000 unique visitors
    confidence: high_confidence
    sourceIds: [levels-hn-launch]
  - label: Product Hunt visitors on launch day
    value: ~12,000 unique visitors
    confidence: high_confidence
    sourceIds: [levels-hn-launch]
  - label: Email signups in first two weeks
    value: ~2,500 (5% conversion from launch traffic)
    confidence: high_confidence
    sourceIds: [levels-hn-launch]
  - label: Nomad List ARR at time of Indie Hackers interview
    value: Approaching $400K/year (membership + ads + job posts)
    confidence: medium_confidence
    sourceIds: [indiehackers-interview]
  - label: Cities in the original spreadsheet
    value: Approximately 25
    confidence: medium_confidence
    sourceIds: [nomad-magazine-history]
  - label: Nomad List ARR (later reported)
    value: ~$700K/year (Nomad List alone), ~$3M combined with Remote OK
    confidence: medium_confidence
    sourceIds: [softwaregrowth-levels]
glanceCards:
  - id: setup
    title: Scattered data, no one map
    body: In 2014, the information a remote worker needed to pick a city was scattered across blog posts, forum threads, and word-of-mouth. Cost of living, internet speed, and safety existed nowhere in one filterable place. [nomad-magazine-history]
    sourceIds: [nomad-magazine-history]
    confidence: confirmed
  - id: problem
    title: A survey that needed 2,500 cells
    body: Levels calculated that tracking 50 indicators across 50 cities meant 2,500 individual data points. He could not fill them himself. A solo developer was the wrong tool for this job. [indiehackers-interview]
    sourceIds: [indiehackers-interview]
    confidence: confirmed
  - id: tempting-move
    title: The obvious answer
    body: The obvious move was to build a database, scrape city statistics from government sources, and launch a polished product. That meant weeks of data work before any user could tell Levels whether the concept was worth building at all. [softwaregrowth-levels]
    sourceIds: [softwaregrowth-levels]
    confidence: high_confidence
  - id: mechanism
    title: A spreadsheet as the product
    body: On June 24, 2014, Levels posted a public Google spreadsheet on Twitter and asked people to fill it in. Within days, hundreds of contributors had added cities, invented new columns, and sent the sheet to Reddit and Hacker News. [levels-hn-launch]
    sourceIds: [levels-hn-launch]
    confidence: confirmed
  - id: evidence
    title: The numbers that followed
    body: The accidental website launch on July 29, 2014 drove roughly 50,000 unique visitors from Hacker News and 12,000 from Product Hunt. Within 24 hours, Matt Mullenweg emailed Levels to buy a sponsorship, making the project profitable from day one. [levels-hn-launch]
    sourceIds: [levels-hn-launch]
    confidence: confirmed
  - id: takeaway
    title: The interface was the hypothesis
    body: A spreadsheet cost Levels nothing to deploy and nothing to maintain. The crowd that filled it proved demand. The website that came after was not the product test; the spreadsheet was. [indiehackers-interview]
    sourceIds: [indiehackers-interview]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Spend weeks scraping government and travel databases to assemble verified city data
      - Build a full web app with filters, scores, and user accounts before any public launch
      - Wait until the data was comprehensive enough to feel authoritative
    summary: Treat data collection as a prerequisite and delay user validation until the product felt ready.
  whatShipped:
    label: What shipped
    bullets:
      - A public Google spreadsheet posted to Twitter asking the crowd to fill in city data
      - A minimal PHP website inspired by Product Hunt's design, built on top of the crowd-sourced data
      - An accidental launch triggered by a misuploaded nginx config file during a server reboot
    summary: Use the cheapest interface that lets users do the data work themselves, and validate demand before building anything.
lifecycle:
  - date: 2014-03
    label: 12 startups challenge begins
    description: Levels commits publicly to launching one startup per month.
    type: launch
  - date: 2014-06-24
    label: Spreadsheet goes live
    description: Levels posts the public Google spreadsheet to Twitter.
    type: launch
  - date: 2014-07-29
    label: Accidental website launch
    description: A misuploaded nginx config pushes the site live; hits number one on Product Hunt and Hacker News the same day.
    type: milestone
  - date: 2015
    label: Paid membership introduced
    description: One-time Slack community access starts at $5, rising to $25 then $50.
    type: milestone
  - date: 2016-04
    label: Switches to annual recurring
    description: Membership becomes $75/year; signups hold and continue growing.
    type: pivot
  - date: 2024
    label: Rebrand to Nomads.com
    description: Nomad List renamed and moved to nomads.com; community and data platform intact.
    type: today
takeaway:
  principle: The cheapest interface that tests demand is the product; everything built after is just wrapping.
  sourceIds: [indiehackers-interview, levels-hn-launch]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy hero illustration for Nomad List's 2014 origin story. Canvas role: hero, aspect 2400x1350. Compose a wide cream #faf6f0 canvas showing a large open browser window containing a simple grid of rows and columns in mist #dfe6dc, evoking a Google spreadsheet, with two or three columns labelled in charcoal #1e211c monospaced type: CITY, COST/MO, WIFI. To the right of the spreadsheet, draw a small forest-green #4a7c59 website card with a simple ranked list of city names, connected to the spreadsheet by a soft amber #c9ad68 arrow. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small narrator figure in the upper right, pointing at the arrow between the spreadsheet and the website. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Leave quiet space in the upper left for title overlay. No human faces, no photorealism, no recreated Google or Nomad List screenshots. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A cream editorial illustration showing a spreadsheet on the left connected by an arrow to a ranked city list on the right, with Hatch pointing at the transition.
    caption: A public Google spreadsheet, two Twitter followers, and a server reboot away from a million-dollar product.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric scene illustration for Pieter Levels in early 2014 Amsterdam, aspect 1600x1600. Show a quiet cream #faf6f0 room at night, one desk lit by a forest-green #4a7c59 lamp, a laptop screen with a soft mist #dfe6dc glow showing a simple grid of rows and columns. Through a small window, draw angular Dutch rooftop silhouettes in charcoal #1e211c against a deep forest #244232 sky. A coffee mug in soft amber #c9ad68 sits beside the keyboard. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as the main narrator, standing to the left of the desk in a calm observing pose, one mitten hand resting gently near the laptop as if reading the screen. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human figures, no photorealism, no real software screenshots. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch standing beside a desk in a quiet Amsterdam room at night, observing a glowing laptop showing a simple grid.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric mechanism diagram for Nomad List's spreadsheet-to-product pipeline, aspect 1800x1200. Lay out four horizontal stages from left to right on cream #faf6f0. Stage one: a mist #dfe6dc grid labelled SPREADSHEET, with small plus-sign icons representing contributors adding rows. Stage two: a deep forest #244232 Twitter bird shape (abstract, not logo) labelled SHARED ON TWITTER, with a small cloud of dots radiating outward. Stage three: a cream browser frame labelled PHP WEBSITE, with three sorted rows visible inside and a forest-green #4a7c59 highlight on row one. Stage four: a soft amber #c9ad68 lightning bolt shape labelled ACCIDENTAL LAUNCH with a small charcoal #1e211c burst. Connect stages with thin deep forest lines. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in a pointing pose at the lower right, one mitten hand aimed at stage one to mark the spreadsheet as the real test. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No screenshots, no logos, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A four-stage pipeline from spreadsheet to accidental launch, with Hatch pointing at the spreadsheet stage as the origin of the test.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric evidence card for Nomad List's launch day traffic, aspect 1600x1000. On cream #faf6f0, draw two vertical bars side by side. The tall bar on the left is deep forest #244232, labelled HACKER NEWS 50K VISITORS at the top. The shorter bar on the right is forest-green #4a7c59, labelled PRODUCT HUNT 12K VISITORS. Below both bars, draw a single soft amber #c9ad68 horizontal line with a small envelope icon labelled 2,500 EMAIL SIGNUPS / 2 WEEKS. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png standing between the two bars in a pointing pose, one mitten hand indicating the tall bar and gaze toward the viewer. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Simple label typography only, no dense text, no fake screenshots. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Two vertical bars showing Hacker News and Product Hunt launch-day traffic, with Hatch standing between them pointing at the taller bar.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric lesson illustration for the takeaway that the cheapest interface is the product test, aspect 1800x1200. Background is cream #faf6f0. In the centre, draw a large mist #dfe6dc grid shape labelled SPREADSHEET, with a small forest-green #4a7c59 checkmark in the top-right corner. To the right, draw a thin charcoal #1e211c arrow leading to a smaller deep forest #244232 website card, labelled WRAPPING. Above the grid, draw a soft amber #c9ad68 arc connecting the word DEMAND with the word PROVED. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in a calm coaching pose to the lower left, facing the grid with one mitten hand extended toward it as if introducing the concept. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no photorealism, no recreated screenshots. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A central grid labelled Spreadsheet with a checkmark and an arrow pointing right to a smaller card labelled Wrapping, with Hatch coaching from the left.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric thumbnail composition for the Nomad List origin story, aspect 1200x900. On warm cream #faf6f0, render one bold focal shape: a deep forest #244232 grid of rows and columns, slightly tilted, occupying the centre of the canvas. From the right edge, draw a single soft amber #c9ad68 arrow pointing to a small forest-green #4a7c59 rectangle evoking a simple website card. Keep the composition readable at small size with one strong focal shape and two colors. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a tiny watermark-adjacent mark in the bottom-left corner, no larger than 12 percent of canvas height. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No labels, no screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A tilted dark grid in the centre with a soft amber arrow pointing to a small green rectangle on the right, with a tiny Hatch mark in the corner.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric social cover image for the Nomad List origin story, aspect 2400x1260. On warm cream #faf6f0, place a central composition occupying the centre 70 percent of the canvas: a large mist #dfe6dc spreadsheet grid on the left with charcoal #1e211c column headers and a few filled rows, and a smaller forest-green #4a7c59 ranked-list card on the right. Connect them with a deep forest #244232 arrow labelled CROWD FILLS IT in charcoal monospaced text. Keep the outer 15 percent of each edge free of critical detail. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small narrator in the upper right, one mitten hand pointed at the arrow. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No fake screenshots, no human faces, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A wide cover showing a spreadsheet grid on the left connected by an arrow labelled CROWD FILLS IT to a ranked city list on the right, with small Hatch narrator in the upper right.
    watermark: HackProduct
nextInQueue:
  slug: gumroad
  companySlug: gumroad
  title: Gumroad
---

<!-- beat: lede -->

On the morning of June 24, 2014, Pieter Levels posted a link to a Google spreadsheet on Twitter and asked if anyone knew which cities were good for remote workers. The spreadsheet had a few columns — city name, monthly cost, internet speed — and about as many rows. He expected a few dozen responses. Within a day, hundreds of people had added cities he had never heard of, invented columns he had not thought to ask for, and forwarded the sheet to Reddit and Hacker News. The crowd was not filling in his product. The crowd was designing it [levels-hn-launch][indiehackers-interview].

What Levels had noticed, working from laptops across Chiang Mai and Bali and Medellín, was that the information a remote worker needed to pick a city existed almost nowhere in one place. Blog posts had opinions. Forum threads had anecdotes. Nowhere had a sortable, filterable table that put cost of living next to internet speed next to safety, for dozens of cities at once. He also noticed something else: filling that table himself, for 50 cities with 50 indicators each, meant 2,500 individual data points. One person was the wrong tool for that job [indiehackers-interview][nomad-magazine-history].

What follows is the story of a decision that looks, from the outside, like laziness, and that was in fact a precise hypothesis about where the real work of building a product begins. The question worth carrying through the read is what Levels chose to validate first, and what he chose not to build at all.

<!-- beat: glance -->
## At a glance

**1. Scattered data, no one map**

In 2014, the information a remote worker needed to pick a city was scattered across blog posts, forum threads, and word-of-mouth. Cost of living, internet speed, and safety existed nowhere in one filterable place. [nomad-magazine-history]

**2. A survey that needed 2,500 cells**

Levels calculated that tracking 50 indicators across 50 cities meant 2,500 individual data points. He could not fill them himself. A solo developer was the wrong tool for this job. [indiehackers-interview]

**3. The obvious answer**

The obvious move was to build a database, scrape city statistics from government sources, and launch a polished product. That meant weeks of data work before any user could tell Levels whether the concept was worth building at all. [softwaregrowth-levels]

**4. A spreadsheet as the product**

On June 24, 2014, Levels posted a public Google spreadsheet on Twitter and asked people to fill it in. Within days, hundreds of contributors had added cities, invented new columns, and sent the sheet to Reddit and Hacker News. [levels-hn-launch]

**5. The numbers that followed**

The accidental website launch on July 29, 2014 drove roughly 50,000 unique visitors from Hacker News and 12,000 from Product Hunt. Within 24 hours, Matt Mullenweg of Automattic emailed Levels to buy a sponsorship, making the project profitable from day one. [levels-hn-launch]

**6. The interface was the hypothesis**

A spreadsheet cost Levels nothing to deploy and nothing to maintain. The crowd that filled it proved demand. The website that came after was not the product test; the spreadsheet was. [indiehackers-interview]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

In early 2014 Pieter Levels is back in Amsterdam, living with his parents at twenty-seven. He had been making $8,000 a month uploading electronic music to YouTube, then the revenue fell to $500 a month and kept falling. He spent 2013 building a YouTube analytics tool called Tubelytics, which attracted almost no customers. By January 2014 he is at his parents' dinner table, income close to zero, making lists of startup ideas and crossing them out [onemilliongoal-levels].

The thing he decides to do is run a public challenge: twelve new startups in twelve months. The reasoning is not optimism. Most products fail, so the expected value of any single bet is low. The only way to beat that math is to take more bets, faster, with less attachment to each one. He commits to shipping one product a month and starts building [onemilliongoal-levels][softwaregrowth-levels].

The fourth product is Nomad List. The question every nomad asks is not "how do I work remotely." It is "where do I go next." The data to answer that question exists, scattered across government statistics websites and travel blogs and digital-nomad forums. What does not exist is a single interface that aggregates it. The detail Levels notices is less about the data and more about the structure of the problem: the data is not hard to find, it is hard to assemble, and no single person should have to assemble all of it alone. He decides not to [indiehackers-interview][nomad-magazine-history].

On June 24, 2014, he posts a Google spreadsheet link on Twitter. The spreadsheet has a few columns and about twenty-five cities. He asks if anyone can help fill it in. A few dozen people add rows. Then a few hundred. Contributors add columns he had not thought to include: LGBTQ-friendliness, coffee shop density, safety scores. Someone posts it to Hacker News. Someone posts it to Reddit. Within days the sheet has grown well past anything Levels could have assembled in weeks [levels-hn-launch][indiehackers-interview]. He is watching from his laptop, looking at a product designed almost entirely by strangers who wanted the thing to exist.

<!-- beat: choice -->
## The obvious answer and what shipped instead

A careful team in 2014 would have looked at the data problem and decided, correctly, that spreadsheets are not products. They would have spent the next month writing scrapers to pull city cost data from Numbeo and the World Bank and Expatistan, hiring a part-time researcher to verify the numbers, and building a proper database before anyone could see the results. That decision would have been defensible. It would also have cost them the information they most needed: whether anyone, given a filterable table of cities, would actually change their plans based on it. Spending weeks on data assembly before asking that question is the move that keeps many technically correct ideas from ever finding out whether they matter [indiehackers-interview].

| The tempting move | What shipped |
|---|---|
| Spend weeks scraping government and travel databases to assemble verified city data | A public Google spreadsheet posted to Twitter asking the crowd to fill in city data |
| Build a full web app with filters, scores, and user accounts before any public launch | A minimal PHP website built on top of the crowd-sourced data, design inspired by Product Hunt |
| Wait until the data was comprehensive enough to feel authoritative | An accidental launch triggered by a misuploaded nginx config file during a server reboot |
| *Treat data collection as a prerequisite and delay user validation until the product felt ready.* | *Use the cheapest interface that lets users do the data work themselves, then validate demand before building anything else.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The mechanism starts with something most product builders treat as a liability. A spreadsheet is unpolished. It has no UI. It cannot be owned or monetised directly. It can be edited by anyone, which means it can be broken by anyone. For Levels in June 2014, these were features, not bugs. A spreadsheet could be created in minutes, shared with a link, and edited without a single line of code. If nobody filled it in, nothing was lost. If people did fill it in, the spreadsheet would prove that the demand existed before a single hour of engineering had been committed to serving it [indiehackers-interview].

The crowd that filled the spreadsheet did two things that Levels had not planned for. First, it expanded the schema. Contributors added columns for safety, nightlife, LGBTQ-friendliness, and coffee shop density, columns that Levels himself had not thought to include [indiehackers-interview]. The product had been co-designed by the people who most needed it, before the product existed. Second, it distributed itself. Participants posted the spreadsheet to Hacker News and Reddit, which brought in contributors who posted it further. The data collection and the marketing were the same event [levels-hn-launch].

Levels then built the website in under a month, in PHP, with a design borrowed from Product Hunt's clean ranked-list aesthetic. The site was a thin wrapper on top of the crowd-sourced data, with a scoring algorithm he called NomadCost that weighted cities by simulated nomad expenses, applying a penalty to cities over a €2,000/month threshold. The constraint he honoured was simplicity: the scoring was public and reproducible, not a black box. The constraint he ignored was authority: the data was crowd-sourced and unverified, and he shipped it anyway [levels-hn-launch].

The launch happened on July 29, 2014, and it was an accident. Levels rebooted his Linode server and accidentally uploaded a local nginx configuration file, which pushed the site live ahead of schedule. He did not find out until tweets started arriving [levels-hn-launch]. Someone had submitted the site to Product Hunt without his knowledge, and it had gone to number one. He then submitted it to Hacker News himself, and it went to number one there too. The traffic from Hacker News alone was approximately 50,000 unique visitors, against 12,000 from Product Hunt [levels-hn-launch].

The second-order effects were two. The first was a community. Levels added a Slack group, charged $5 to join as a spam filter, and found that people paid. He raised the price to $25, then $50, then $65, and signups held. The price signal was the real product validation: the people who most needed the tool were willing to pay for a conversation with others who also needed it [indiehackers-interview]. The second effect was a movement that Levels did not anticipate. Publishing his revenue and user numbers publicly, in real time, while building the product, made Nomad List a proof of concept for something beyond itself. Indie Hackers, the community that codified the "build in public" model, cites Nomad List as one of its founding inspirations [softwaregrowth-levels].

<!-- beat: evidence -->
## Evidence

The launch-day numbers from July 29, 2014 are the cleanest data in this story. Levels published them himself within days of the launch: roughly 50,000 unique visitors from Hacker News, 12,000 from Product Hunt, 2,500 email signups in the first two weeks at a 5% conversion rate [levels-hn-launch]. These are self-reported but granular, which makes them more credible than round-number retrospectives. The traffic figures align with standard Hacker News front-page behavior documented in the same period.

Revenue attribution is harder. Nomad List grew alongside Remote OK, the job board Levels built later in 2014, and the two properties shared audience, brand, and some revenue streams. The figures reported in Levels' Indie Hackers interview, approaching $400K/year at time of interview, cover the combined operation rather than isolating Nomad List's contribution [indiehackers-interview]. Later reports cite Nomad List at roughly $700K ARR and the combined business above $3M, but these postdate Remote OK's growth and cannot be cleanly attributed to the original spreadsheet product [softwaregrowth-levels]. The spreadsheet-to-product move proved demand; precisely how much demand is a number the public record cannot cleanly separate from everything Levels built afterward.

The scope of the original spreadsheet, approximately 25 cities, comes from a secondary source and is not confirmed in Levels' own primary posts. The public record is clean on the direction (start small, let the crowd expand) and ambiguous on the exact starting size.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Hacker News unique visitors on launch day | ~50,000 | High | [levels-hn-launch] |
| Product Hunt unique visitors on launch day | ~12,000 | High | [levels-hn-launch] |
| Email signups in first two weeks | ~2,500 (5% conversion) | High | [levels-hn-launch] |
| Cities in the original spreadsheet | ~25 | Medium | [nomad-magazine-history] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "Instead of building a site first, I simply made a public Google spreadsheet to collect the first data and see if there'd be interest."
>
> — Pieter Levels, Indie Hackers interview, 2017

<!-- beat: aftermath -->
## Timeline

1. **2014-03**, Levels commits publicly to 12 startups in 12 months.
2. **2014-06-24**, The public Google spreadsheet posts to Twitter; hundreds fill it in within days.
3. **2014-07-29**, Accidental nginx misconfiguration launches the site; hits number one on Product Hunt and Hacker News the same day.
4. **2015**, Paid Slack community introduced; price climbs from $5 to $50 as signups hold.
5. **2016-04**, Membership converts to annual recurring at $75/year; revenue stabilises into compounding growth.
6. **2024**, Nomad List rebrands to Nomads.com; the product tracks over 2,000 cities with 100,000+ data points.

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **The cheapest interface that tests demand is the product; everything built after is just wrapping.**
>
> — HackProduct autopsy

The same move turns up in two other places that look very different on the surface. Dropbox in 2007 did not have a product when Drew Houston published a demo video to Hacker News and collected 75,000 email signups overnight; the video was the product test, not the software. Notion in 2018 rebooted its user base by sharing a personal-projects template on Reddit and watching it spread through a community that had never heard of the app; the template was a spreadsheet-level artifact deployed to prove demand before a dollar of paid acquisition. Both moves share Levels' underlying logic: the question of whether anyone needs a thing can be answered far more cheaply than the question of how to build the thing, and answering the cheaper question first is not laziness. It is sequencing.

<!-- beat: references -->
## References

1. **How I got my startup to #1 on both Product Hunt and Hacker News by accident**, levels.io · Tier A · accessed 2026-05-17. https://levels.io/product-hunt-hacker-news-number-one/
   Supports: The accidental launch date, traffic numbers, spreadsheet origin, Emiel Janson Product Hunt submission, Tim Ferriss share, and Matt Mullenweg's immediate sponsorship.
2. **Nomad List Founder — levelsio**, levels.io · Tier A · accessed 2026-05-17. https://levels.io/nomad-list-founder/
   Supports: Levels' own framing of the product, five-year revenue milestone, and emotional context of 2014.
3. **Growing a Community for Digital Nomads to $33,000/mo**, Indie Hackers · Tier A · accessed 2026-05-17. https://www.indiehackers.com/interview/growing-a-community-for-digital-nomads-to-33-000-mo-126df0fc5e
   Supports: Pricing evolution ($5 to $75/year), the decision to post a spreadsheet rather than build software first, retention challenge, and revenue approaching $400K/year.
4. **How Pieter Levels grew Nomad List to $3 million ARR**, Software Growth · Tier B · accessed 2026-05-17. https://www.softwaregrowth.io/blog/how-pieter-levels-grew-nomad-list
   Supports: Revenue figures (~$700K ARR for Nomad List alone, ~$3M combined), "building in public" attribution, and automation strategy.
5. **Nomad List: The Oldest Go-To Resource for Discovering the Best Cities for Remote Work**, Nomad Magazine · Tier B · accessed 2026-05-17. https://nomad-magazine.com/blog/nomad-list-the-oldest-go-to-resource-for-discovering-best-cities-for-remote-work/
   Supports: Original spreadsheet scope (approximately 25 cities), initial data columns (cost of living, internet speed, safety), and 2014 as the year digital nomadism became widely visible.
6. **Pieter Levels: The King of Indie Hacking**, One Million Goal · Tier C · accessed 2026-05-17. https://www.onemilliongoal.com/p/pieter-levels-the-king-of-indie-hacking
   Supports: Backstory context of Levels living with parents in Amsterdam, Tubelytics detour, panic attacks preceding the 12-startups challenge, and father's advice to "get active and do something."

<!-- beat: forward -->
## Next in queue

**Gumroad**, The e-commerce tool that proved a solo founder building in plaintext could outlast a VC-backed team building in ambition.

→ [/autopsies/gumroad/gumroad](/autopsies/gumroad/gumroad)
