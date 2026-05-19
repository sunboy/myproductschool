---
slug: unsplash
companySlug: unsplash
companyName: Unsplash
title: Unsplash
dek: Crew had ten leftover photos and a $28 Tumblr blog. They solved the one problem stock photography refused to touch.
queueRank: 26
tier: 2
estimatedReadTime: 10 min read
status: draft
researchGaps:
  - The acquisition price Getty Images paid for Unsplash in March 2021 was never publicly disclosed.
  - The specific internal Getty strategy document or meeting at which the acquisition rationale was finalized is not in the public record.
  - Causal share of Unsplash traffic versus Crew's other marketing initiatives is hard to isolate; the 80% referral figure comes from Cho's own recollection, not independently audited data.
sourceSummary: The Changelog Founders Talk episode 54 with Mikael Cho is the primary source, supplying direct quotes on the founding, the photographer flywheel, the spin-out decision, and the Getty acquisition rationale. The freecodecamp.org piece by Luke Chesser covers the Tumblr launch mechanics and first-day traffic in detail. Strategy Breakdowns supplies the API distribution and photographer-flywheel metrics. PetaPixel's post-acquisition analysis by Paul Melcher supplies the strategic logic of the Getty deal and the 11,135 API application figure. The public record does not include Getty's acquisition price or a detailed breakdown of Unsplash's revenue at acquisition.
sources:
  - id: cho-changelog
    title: "From side project to $7.25M for Unsplash with Mikael Cho (Founders Talk #54)"
    publisher: Changelog Media
    url: https://changelog.com/founderstalk/54
    tier: A
    accessedAt: 2026-05-17
    supports: Direct Mikael Cho quotes on founding, the Tumblr decision, the photographer supply model, Crew referral percentages, and the Getty acquisition conversation. Primary source.
  - id: fcc-unsplash
    title: The Unsplash Formula — How Crew went from almost broke to getting 5 million visitors
    publisher: freeCodeCamp
    url: https://www.freecodecamp.org/news/the-unsplash-formula-how-crew-went-from-almost-broke-to-getting-5-million-visitors-ec4db8e7d6cd
    tier: B
    accessedAt: 2026-05-17
    supports: Tumblr launch mechanics ($9 domain, $19 Tumblr theme, public Dropbox links), first-day HN result, 1 million downloads in year one, Crew referral traffic. Written by co-founder Luke Chesser.
  - id: petapixel-getty
    title: What's Really Behind Getty Images' Acquisition of Unsplash
    publisher: PetaPixel
    url: https://petapixel.com/2021/05/01/whats-really-behind-getty-images-acquisition-of-unsplash/
    tier: B
    accessedAt: 2026-05-17
    supports: Getty's strategic rationale for the acquisition, 11,135 API application figure, 100 billion all-time API requests, and the customer-acquisition-funnel analysis. By industry analyst Paul Melcher.
  - id: strategy-breakdowns
    title: "Unsplash's viral distribution playbook"
    publisher: Strategy Breakdowns
    url: https://strategybreakdowns.com/p/unsplash-viral-distribution-playbook
    tier: B
    accessedAt: 2026-05-17
    supports: Photographer flywheel mechanics, API launch timeline (2015 beta, 2017 open), 30% distribution power figure, returning-user percentage.
  - id: mark-macleod-cho
    title: Unsplash CEO Mikael Cho on How a Marketing Experiment Created a Photo Empire
    publisher: Mark MacLeod
    url: https://markmacleod.me/unsplash-ceo-mikael-cho-on-how-a-marketing-experiment-created-a-photo-empire/
    tier: B
    accessedAt: 2026-05-17
    supports: Cho quotes on photographer supply model, scale metrics at spin-out, and the acquisition rationale. Corroborates Changelog interview.
  - id: petapixel-acquisition
    title: Unsplash is Being Acquired by Getty Images
    publisher: PetaPixel
    url: https://petapixel.com/2021/03/30/unsplash-is-being-acquired-by-getty-images/
    tier: B
    accessedAt: 2026-05-17
    supports: Acquisition announcement details, March 2021 date, undisclosed cash price, continuation of free model.
  - id: unsplash-blog-getty
    title: Unsplash is Being Acquired by Getty Images
    publisher: Unsplash Official Blog
    url: https://unsplash.com/blog/unsplash-getty/
    tier: A
    accessedAt: 2026-05-17
    supports: Cho's official statement on the Getty deal, framing around independence and alignment. Primary source.
metrics:
  - label: Cost to build the original Tumblr site
    value: $28 total ($9 domain + $19 Tumblr theme)
    confidence: confirmed
    sourceIds: [cho-changelog, fcc-unsplash]
  - label: Downloads on first day (10 photos)
    value: ~30,000 downloads in a few hours
    confidence: confirmed
    sourceIds: [cho-changelog]
  - label: Unsplash referrals to Crew, year one
    value: ~80% of all Crew project referrals
    confidence: high_confidence
    sourceIds: [cho-changelog]
  - label: Monthly downloads at spin-out (~2017)
    value: ~30 million image downloads per month
    confidence: high_confidence
    sourceIds: [mark-macleod-cho]
  - label: API applications connected to Unsplash at acquisition
    value: 11,135 applications, 100 billion all-time API requests
    confidence: confirmed
    sourceIds: [petapixel-getty]
  - label: Total image views per month at acquisition (2021)
    value: 22 billion image impressions, 300 million people per month
    confidence: confirmed
    sourceIds: [petapixel-getty]
glanceCards:
  - id: setup
    title: A $28 blog with ten leftover photos
    body: In May 2013, Crew's homepage photoshoot left ten unused images on a hard drive. The team built a Tumblr blog for $28 total, posted the photos under an open license, and submitted the link to Hacker News expecting a quiet response from a few hundred people. [fcc-unsplash][cho-changelog]
    sourceIds: [fcc-unsplash, cho-changelog]
    confidence: confirmed
  - id: problem
    title: A market built on friction no one wanted to remove
    body: Getty and Shutterstock had turned rights management into a revenue line. Attribution requirements, watermarks, licence forms, and per-use pricing were features of the business model, not bugs. No incumbent had structural incentive to remove them. [petapixel-getty]
    sourceIds: [petapixel-getty]
    confidence: confirmed
  - id: tempting-move
    title: The obvious answer was to sell the photos
    body: Crew could have put the leftover images on iStock, charged a modest licence fee, or traded them for Shutterstock credits. All of those paths respected the existing market's pricing model. All of them gave away the asymmetric advantage that came from giving the photos away entirely. [cho-changelog]
    sourceIds: [cho-changelog]
    confidence: confirmed
  - id: mechanism
    title: Traffic in exchange for distribution rights
    body: Unsplash gave photographers something Getty's licence contract structurally could not: millions of portfolio impressions per month, earned by putting their name on images used across the web. The exchange was reach for rights, not cash for rights. [strategy-breakdowns][cho-changelog]
    sourceIds: [strategy-breakdowns, cho-changelog]
    confidence: confirmed
  - id: evidence
    title: The disruptor absorbed
    body: By the time Getty acquired Unsplash in March 2021, the platform carried 11,135 connected API applications and 100 billion all-time image requests. Getty bought the audience it could not license away. [petapixel-getty]
    sourceIds: [petapixel-getty]
    confidence: confirmed
  - id: takeaway
    title: Aligned incentives compound faster than locked contracts
    body: Stock photography had built its pricing on a rights-friction wedge between creator and user. Unsplash collapsed that wedge by realigning the photographer's incentive from per-image cash to per-image reach, and the supply side filled itself. [cho-changelog][strategy-breakdowns]
    sourceIds: [cho-changelog, strategy-breakdowns]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Licence the ten leftover photos through iStock, Shutterstock, or a comparable marketplace
      - Give them away with a Creative Commons Attribution licence and collect goodwill
      - Use them in Crew's own marketing and let them sit on the hard drive afterward
    summary: Treat ten surplus photos as a minor asset to monetise or ignore, and stay focused on Crew's core hiring marketplace.
  whatShipped:
    label: What shipped
    bullets:
      - A $28 Tumblr blog with zero friction to download (no account, no licence form, no attribution requirement)
      - Ten high-resolution images released under terms that asked for nothing in return
      - A quiet link back to Crew as the only call to action on the page
      - An open submission form that let photographers join the supply side immediately after the HN post went viral
    summary: Turn ten photos into a zero-friction distribution engine that compounded because photographers wanted the reach, not the royalty.
lifecycle:
  - date: 2013-05
    label: Unsplash launches on Tumblr
    description: Ten photos, $28 site, HN front page on day one.
    type: launch
  - date: 2013-06
    label: Community submissions open
    description: Open submit link added; photographer supply begins self-filling.
    type: milestone
  - date: 2014
    label: One million downloads
    description: First-year milestone signals the model will not slow down.
    type: milestone
  - date: 2015
    label: API launched (closed beta)
    description: Trello and InVision among early adopters; distribution expands.
    type: launch
  - date: 2017-04
    label: Crew acquired by Dribbble; Unsplash spins out
    description: Team goes full-time on Unsplash as a standalone company.
    type: pivot
  - date: 2021-03
    label: Getty Images acquires Unsplash
    description: Undisclosed cash deal; disruptor absorbed by the incumbent it threatened.
    type: today
takeaway:
  principle: When incumbents monetise the friction between creator and user, removing that friction is the product.
  sourceIds: [cho-changelog, petapixel-getty]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy hero illustration for Unsplash's 2013 founding. Canvas role: hero, aspect 2400x1350. Compose a cream #faf6f0 background. On the left, show a small forest-green #4a7c59 Tumblr-style blog frame holding ten small photographic rectangles in mist #dfe6dc, arranged in two rows of five, each with a soft amber #c9ad68 download arrow below it. On the right, show a much larger deep forest #244232 grid of photographic tiles expanding outward, representing millions of images, with thin charcoal #1e211c grid lines. Between them, draw a single wide forest-green arrow labelled ZERO FRICTION in JetBrains Mono, connecting the small blog frame to the large grid. Place Hatch (from public/images/hatch/hatch-official-mascot.png) in the upper right corner in narrator pose: rounded green head frame, cream face and body, graduation cap with growth arrow, H chest mark, bright eyes, mitten hands, friendly coach expression. Hatch points one mitten hand at the arrow. Leave the upper left quarter clear for title overlay. No human faces, no photorealistic photography, no recreated Tumblr UI. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A cream-and-forest editorial illustration showing a small ten-image Tumblr blog on the left connected by a wide zero-friction arrow to a vast expanding grid of images on the right, with Hatch narrating from the upper right.
    caption: Ten photos, a $28 blog, and a constraint the whole industry shared.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric scene illustration for the Montreal Crew office in May 2013, aspect 1600x1600. Show a warm cream #faf6f0 room with a low desk in forest green #4a7c59. On the desk: a laptop screen showing a simple Tumblr window with ten small photographic rectangles, a notepad with a list in soft amber #c9ad68 ink, and a small external hard drive in mist #dfe6dc. On a wall shelf in the background, stack a few design books with charcoal #1e211c spines and amber #705c30 bookmarks. A single window in deep forest #244232 lets in diffuse mist-coloured light. Place Hatch (from public/images/hatch/hatch-official-mascot.png) standing beside the desk in narrator pose: rounded green head frame, cream face and body, graduation cap with growth arrow, H chest mark, bright eyes, mitten hands, friendly coach expression. Hatch gestures toward the laptop with one mitten hand. No human figures, no photorealism, no branded logos, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch standing beside a small desk in the Crew Montreal office, gesturing at a laptop displaying a simple Tumblr window with ten image thumbnails.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric mechanism diagram for the Unsplash photographer supply flywheel, aspect 1800x1200. On cream #faf6f0, draw a circular flywheel with four nodes connected by forest-green #4a7c59 arc arrows moving clockwise. Node 1 (deep forest #244232 circle): ZERO FRICTION DOWNLOAD. Node 2 (forest green circle): BROAD WEB DISTRIBUTION. Node 3 (soft amber #c9ad68 circle): PHOTOGRAPHER PORTFOLIO REACH. Node 4 (mist #dfe6dc circle with charcoal #1e211c text): MORE PHOTOGRAPHERS SUBMIT. Between nodes 1 and 4, show a thin charcoal note reading NO CASH REQUIRED in JetBrains Mono at 8pt. In the centre of the flywheel, place a single deep forest #244232 label: SUPPLY SELF-FILLS. Place Hatch (from public/images/hatch/hatch-official-mascot.png) at the lower right in a thinking pose: rounded green head frame, cream face and body, graduation cap with growth arrow, H chest mark, bright eyes, mitten hands, friendly coach expression. Hatch points one mitten hand at node 3, the photographer reach node. No screenshots, no real UI, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A four-node circular flywheel diagram labelled with zero-friction download, broad web distribution, photographer portfolio reach, and more photographers submit, with Hatch pointing at the reach node.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric evidence illustration for Unsplash's scale contrast, aspect 1600x1000. On cream #faf6f0, show three vertical bar columns side by side. Left column in mist #dfe6dc labelled DAY ONE: 30K DOWNLOADS. Middle column in forest green #4a7c59, about four times taller, labelled YEAR ONE: 1M DOWNLOADS. Right column in deep forest #244232, towering above both, labelled 2017: 30M / MONTH, with a soft amber #c9ad68 cap on top. Below each column, show a thin charcoal #1e211c baseline. Between the middle and right columns, place a small forest-green arrow pointing right labelled SPIN-OUT. Place Hatch (from public/images/hatch/hatch-official-mascot.png) at the left edge in a pointing pose: rounded green head frame, cream face and body, graduation cap with growth arrow, H chest mark, bright eyes, mitten hands, friendly coach expression. Hatch's gaze and one mitten hand gesture toward the towering right column. No fake screenshots, no human faces, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Three vertical bars of increasing height labelled Day One 30K downloads, Year One 1M, and 2017 30M per month, with Hatch pointing at the tallest bar.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric lesson illustration for the takeaway that removing friction is the product when incumbents monetise it, aspect 1800x1200. On cream #faf6f0, show a single large horizontal wall in mist #dfe6dc with deep forest #244232 padlock icons arranged along it, labelled RIGHTS FRICTION in charcoal JetBrains Mono at the top. To the left of the wall, show a small figure-absent forest-green #4a7c59 door opening outward with a soft amber #c9ad68 glow at the threshold and a label ZERO FRICTION below. From the door, draw a wide cream ribbon flowing to the right side of the frame where a deep forest #244232 cluster of small rectangles labelled SUPPLY fills the space. Place Hatch (from public/images/hatch/hatch-official-mascot.png) at the left of the scene in a calm coaching pose: rounded green head frame, cream face and body, graduation cap with growth arrow, H chest mark, bright eyes, mitten hands, friendly coach expression. Hatch faces the reader with one mitten hand open toward the door. No human figures, no photorealism, no branded assets, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A mist-coloured wall of padlock icons labelled Rights Friction with a single open door glowing soft amber, and a wide ribbon flowing from the door to a cluster of supply tiles, with Hatch coaching from the left.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric thumbnail for the Unsplash autopsy, aspect 1200x900. On warm cream #faf6f0, show one bold focal shape: ten small mist #dfe6dc photographic rectangles arranged in two rows on the left, and a single large deep forest #244232 grid of tiles expanding to fill the right two-thirds of the canvas, with a single soft amber #c9ad68 arrow connecting the small row of ten to the large grid. Keep the composition readable at small size with high contrast. Place Hatch (from public/images/hatch/hatch-official-mascot.png) as a small mark in the bottom-left corner, no taller than 12 percent of canvas height, in its standard upright form: rounded green head frame, cream face and body, graduation cap with growth arrow, H chest mark, bright eyes, mitten hands. No labels, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Ten small image tiles on the left connected by a soft amber arrow to a large expanding grid on the right, with a small Hatch mark in the bottom-left corner.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric social cover for the Unsplash autopsy, aspect 2400x1260. On warm cream #faf6f0, centre a composition occupying the centre 70 percent of the canvas. Left of centre: a small forest-green #4a7c59 Tumblr blog frame holding ten mist #dfe6dc image tiles in two rows of five. Right of centre: a large deep forest #244232 expanding grid of image tiles representing global scale. Between them: a wide soft amber #c9ad68 arrow labelled ZERO FRICTION in JetBrains Mono charcoal #1e211c at small scale. Above the composition in charcoal, set two short lines: UNSPLASH / FROM TUMBLR SIDE PROJECT TO GETTY ACQUISITION in JetBrains Mono. Place Hatch (from public/images/hatch/hatch-official-mascot.png) in the upper right corner in narrator pose: rounded green head frame, cream face and body, graduation cap with growth arrow, H chest mark, bright eyes, mitten hands, friendly coach expression. No recreated UI, no human faces, no photorealism, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A wide social cover showing a small Tumblr blog frame on the left and a large expanding image grid on the right connected by a zero-friction arrow, with Hatch narrating in the upper right and a two-line headline above.
    watermark: HackProduct
nextInQueue:
  slug: product-hunt
  companySlug: producthunt
  title: Product Hunt
---

<!-- beat: lede -->

In May 2013, a Montreal startup called Crew had ten photographs on a hard drive and a product that was not growing fast enough. Mikael Cho, the co-founder, had commissioned a photographer to shoot the company's new homepage. The shoot left a surplus of images no one would use. Cho and his co-founder Stephanie built a Tumblr blog in three hours, posted the photos under terms that asked for nothing in return, and submitted the link to Hacker News. Total cost: twenty-eight dollars [cho-changelog][fcc-unsplash].

Within hours the site was number one on Hacker News, thirty thousand people had downloaded images from public Dropbox links that buckled under the load, and the head of engineering at Dropbox personally upgraded the account to keep the site running [cho-changelog]. The ten photos were never meant to become a company. They were supposed to drive a few hundred designers toward Crew's hiring marketplace. What happened instead was that a supply-side flywheel started turning, built on reach rather than royalty [fcc-unsplash].

The deeper move was not the Tumblr trick. It was the discovery that stock photography's entire business model rested on a piece of friction, the rights-management contract sitting between photographer and user, and that removing it aligned incentives the traditional market had spent decades misaligning. The question Unsplash forced into the open was structural: who gets more value from a photograph distributed to a million people for free?

<!-- beat: glance -->
## At a glance

**1. A $28 blog with ten leftover photos**

In May 2013, Crew's homepage photoshoot left ten unused images on a hard drive. The team built a Tumblr blog for $28 total, posted the photos under an open licence, and submitted the link to Hacker News expecting a quiet response from a few hundred people. [fcc-unsplash][cho-changelog]

**2. A market built on friction no one wanted to remove**

Getty and Shutterstock had turned rights management into a revenue line. Attribution requirements, watermarks, licence forms, and per-use pricing were features of the business model, not bugs. No incumbent had structural incentive to remove them. [petapixel-getty]

**3. The obvious answer was to sell the photos**

Crew could have put the leftover images on iStock, charged a modest licence fee, or traded them for Shutterstock credits. All of those paths respected the existing market's pricing model. All of them forfeited the asymmetric advantage that came from giving the photos away entirely. [cho-changelog]

**4. Traffic in exchange for distribution rights**

Unsplash gave photographers something Getty's licence contract structurally could not: millions of portfolio impressions per month, earned by putting their name on images used across the web. The exchange was reach for rights, not cash for rights. [strategy-breakdowns][cho-changelog]

**5. The disruptor absorbed**

By the time Getty acquired Unsplash in March 2021, the platform carried 11,135 connected API applications and 100 billion all-time image requests. Getty bought the audience it could not licence away. [petapixel-getty]

**6. Aligned incentives compound faster than locked contracts**

Stock photography had built its pricing on a rights-friction wedge between creator and user. Unsplash collapsed that wedge by realigning the photographer's incentive from per-image cash to per-image reach, and the supply side filled itself. [cho-changelog][strategy-breakdowns]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

The stock photography market in 2013 was a market where friction was the product. Getty Images, founded in 1995, had spent nearly two decades building a licensing apparatus around the simple fact that a photograph's value depended on who used it, where they used it, and for how long. A rights-managed licence specified the medium, the territory, the print run, and the duration. Prices varied accordingly. The complexity was deliberate. Each condition the contract named was a billing dimension, and each billing dimension was revenue [petapixel-getty]. Photographers who contributed to Getty's catalogue did not receive reach. They received a share of whatever the licence negotiated, minus the platform's cut, minus the cost of the rights management infrastructure itself.

Crew in early 2013 was a small marketplace in Montreal. Mikael Cho and his co-founder Stephanie had built a platform for matching vetted designers and developers with clients who needed short-term project work. The company was functional but not yet compounding. Growth was a battle. "We had a full team and we were trying to get growth and it was a real battle," Cho recalled later [cho-changelog]. A homepage redesign was one of many things they were trying. They hired a photographer, shot a new set of images for the site, and wound up with ten photographs that cleared the bar for quality but did not fit the page [fcc-unsplash].

The detail that matters is what Cho noticed about those ten photos. Stock photography sites existed, but they sold images the way Crew could not afford to buy them, and their catalogues were full of images that looked like stock photography. Cho's leftover images were better than that. "This is still a really crappy process, to try to find good photos that you could very clearly use," he said [cho-changelog]. He was describing his own recent experience as a buyer. The site he was standing at the edge of building would be the site he had just been unable to find. The choice in front of him was whether to ask for something in return.

<!-- beat: choice -->
## The obvious answer and what shipped instead

The obvious choice was the one the market had trained everyone to make. Ten high-resolution professional photographs represented a small but real asset, and the sensible thing to do with an asset was to extract value from it. iStock would take a few hours to onboard. Shutterstock would accept the images and pay per download. Even a simple Creative Commons Attribution licence would let Crew reclaim some promotional credit whenever someone used the photos. These were all respectable options. A careful operator would have chosen one of them, kept the photos in a controlled inventory, and moved on to the next growth problem.

| The tempting move | What shipped |
|---|---|
| List the ten photos on iStock or Shutterstock and earn per download | A $28 Tumblr blog with no account requirement, no attribution demand, no watermark |
| Release under Creative Commons Attribution for goodwill and credit | Open-licence images (CC0 equivalent): download, use, modify, for any purpose |
| Tell designers to link back to Crew as the attribution condition | The only call to action was a quiet link back to Crew at the bottom of the page |
| *Treat ten surplus photos as a minor asset to monetise or ignore, and stay focused on Crew's marketplace.* | *Turn ten photos into a zero-friction distribution engine where the supply side would fill itself as soon as photographers wanted what Crew could give them: reach.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The seam Crew found was not a technical trick. It was an incentive mismatch that the entire stock photography industry had been ignoring because ignoring it was profitable. Getty and Shutterstock built their supply chains on one assumption: that photographers wanted money per image. The assumption was partially right. Photographers did want money. But they also wanted something the rights-management contract actively prevented: broad, visible distribution of their work to audiences who might become clients, collaborators, or simply admirers [cho-changelog][petapixel-getty].

The moment Unsplash went live, photographers discovered they could have the second thing without waiting for the first. Cho added a submit link to the Tumblr blog almost as an afterthought, a way to solve the obvious problem that ten photos posted at a rate of ten every ten days would run out quickly. What he did not anticipate was the speed at which contributions arrived. Photographers who had been grinding for visibility through Getty's controlled catalogue suddenly had a route to millions of impressions, with their name and a link to their portfolio attached to every download [fcc-unsplash][strategy-breakdowns]. The supply side filled itself not because photographers stopped wanting to be paid, but because the distribution Unsplash offered was worth more to many of them than the per-image royalty Getty's contract promised.

The mechanism compounded in two directions at once. On the demand side, zero friction turned casual browsers into heavy users. No account registration, no licence form, no watermark to remove, no credit line to track. A designer working on a deadline could download a photograph in under thirty seconds and drop it into a slide deck or a product mockup without a legal review. That frictionlessness drew integrations. By 2015 Unsplash had opened an API in closed beta; by 2017 it was fully open [strategy-breakdowns]. Trello embedded it. Notion embedded it. Figma embedded it. Canva embedded it. The platform was no longer just a website. It was infrastructure for how designers found images inside the tools they already used every day.

On the supply side, each integration expanded the photographer's distribution surface without requiring anything from the photographer at all. A single image uploaded once could be downloaded from Notion's image picker, from Figma's asset panel, from a Medium blog post, and from the Unsplash site directly, all without the photographer ever knowing which channel drove which download [strategy-breakdowns]. The constraint Unsplash chose to honour was zero-friction access for the user. The constraint it chose to ignore was paying photographers directly. The second-order effect the team did not fully anticipate was how quickly API distribution would become the dominant share of usage, reaching 30 percent of total distribution power within three years of the open API launch [strategy-breakdowns], and eventually the most strategically valuable asset the company owned.

<!-- beat: evidence -->
## Evidence

The mechanism is well-documented partly because Cho has spoken about it in detail and partly because the numbers grew large enough that they could not be hidden. The Changelog interview from the period after the Getty acquisition is the clearest primary source. The supply-side dynamics are corroborated by the scale of what the API had become by the time Getty moved: 11,135 applications drawing on Unsplash's image database, with 100 billion all-time API requests recorded by March 2021 [petapixel-getty]. Getty did not disclose the acquisition price, and the public record does not contain it.

Causal attribution is the harder problem. Unsplash grew alongside a broader shift in the visual internet toward high-quality, authentic-feeling photography. The slow death of stock-photo aesthetics was already happening. Unsplash accelerated it, but the timing correlation makes strict attribution difficult. What the record does support clearly is the referral loop. In Crew's first year, Unsplash drove roughly 80 percent of all incoming project referrals, an extraordinary ratio for what started as a three-hour side project [cho-changelog]. By the time the team went full-time on Unsplash in 2017, monthly downloads were running at around 30 million, a figure Cho later described as "bigger than Shutterstock and Adobe combined" at that point in time [mark-macleod-cho].

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Cost to build the original Tumblr site | $28 ($9 domain + $19 Tumblr theme) | Confirmed | [cho-changelog][fcc-unsplash] |
| Downloads on day one (10 photos) | ~30,000 in a few hours | Confirmed | [cho-changelog] |
| Unsplash referrals to Crew in year one | ~80% of all project referrals | High confidence | [cho-changelog] |
| Monthly image downloads at spin-out (2017) | ~30 million / month | High confidence | [mark-macleod-cho] |
| API applications connected at acquisition (2021) | 11,135 applications, 100B all-time requests | Confirmed | [petapixel-getty] |
| Monthly image impressions at acquisition (2021) | 22 billion impressions, 300M people / month | Confirmed | [petapixel-getty] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "We believed the good from giving our images away would far outweigh what we could earn if we required payment or credit. This proved true."
>
> — Mikael Cho, Co-Founder and CEO, Unsplash, freeCodeCamp, 2015

<!-- beat: aftermath -->
## Timeline

1. **2013-05**, Unsplash launches on Tumblr with ten photos and a $28 total budget.
2. **2013-06**, Open submission link added; photographer supply begins self-filling after HN virality.
3. **2014**, One million total downloads; Cho marks this as confirmation the model will not slow.
4. **2015**, API launched in closed beta; Trello and InVision among early integrations.
5. **2017-04**, Crew acquired by Dribbble; Unsplash team goes full-time on the platform as a standalone company.
6. **2021-03**, Getty Images acquires Unsplash for an undisclosed cash sum; the disruptor is absorbed by the incumbent it most threatened.

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **When incumbents monetise the friction between creator and user, removing that friction is the product.**
>
> — HackProduct autopsy

The same move appears across industries once the eye is trained to see it. Wikipedia replaced Britannica not by producing better entries but by removing the rights wall between a reader who knew something and a page that needed updating. Spotify did not win by paying artists more than labels did; it won by eliminating the download-and-manage friction iTunes required. In both cases the incumbent had structured its business around a transaction cost, and the new entrant discovered that removing it could be the business. Unsplash added one twist: photographers came not from altruism but because reach turned out to be a currency.

<!-- beat: references -->
## References

1. **From side project to $7.25M for Unsplash with Mikael Cho (Founders Talk #54)**, Changelog Media · Tier A · accessed 2026-05-17. https://changelog.com/founderstalk/54
   Supports: Direct Mikael Cho quotes on founding, Tumblr decision, photographer supply model, Crew referral percentages (80%), monthly download scale at spin-out, and Getty acquisition rationale.
2. **The Unsplash Formula — How Crew went from almost broke to getting 5 million visitors**, freeCodeCamp · Tier B · accessed 2026-05-17. https://www.freecodecamp.org/news/the-unsplash-formula-how-crew-went-from-almost-broke-to-getting-5-million-visitors-ec4db8e7d6cd
   Supports: Tumblr launch mechanics ($9 domain, $19 Tumblr theme, Dropbox hosting), day-one HN result, 1 million downloads in year one, Crew referral traffic. Written by co-founder Luke Chesser.
3. **What's Really Behind Getty Images' Acquisition of Unsplash**, PetaPixel · Tier B · accessed 2026-05-17. https://petapixel.com/2021/05/01/whats-really-behind-getty-images-acquisition-of-unsplash/
   Supports: Getty's strategic rationale for the acquisition, 11,135 API application figure, 100 billion all-time API requests, 22 billion monthly impressions, and customer-acquisition-funnel analysis.
4. **Unsplash's viral distribution playbook**, Strategy Breakdowns · Tier B · accessed 2026-05-17. https://strategybreakdowns.com/p/unsplash-viral-distribution-playbook
   Supports: Photographer flywheel mechanics, API launch timeline (2015 closed beta, 2017 open), 30% API distribution power figure, and returning-user metrics.
5. **Unsplash CEO Mikael Cho on How a Marketing Experiment Created a Photo Empire**, Mark MacLeod · Tier B · accessed 2026-05-17. https://markmacleod.me/unsplash-ceo-mikael-cho-on-how-a-marketing-experiment-created-a-photo-empire/
   Supports: Cho quotes on scale at spin-out, "bigger than Shutterstock and Adobe combined" claim, and Getty acquisition conversation framing.
6. **Unsplash is Being Acquired by Getty Images** (official blog), Unsplash · Tier A · accessed 2026-05-17. https://unsplash.com/blog/unsplash-getty/
   Supports: Cho's official statement on the deal, framing around independence and alignment. Primary source.
7. **Unsplash is Being Acquired by Getty Images**, PetaPixel · Tier B · accessed 2026-05-17. https://petapixel.com/2021/03/30/unsplash-is-being-acquired-by-getty-images/
   Supports: Acquisition announcement details, March 2021 date, undisclosed cash-only price, promise to maintain free content model.

<!-- beat: forward -->
## Next in queue

**Product Hunt**, How a side-project newsletter became the launch pad the startup world built its launch strategy around.

→ [/autopsies/producthunt/product-hunt](/autopsies/producthunt/product-hunt)
