---
slug: facebook-like-button
companySlug: meta
companyName: Meta
title: The Facebook Like Button
dek: A two-year internal fight to ship one button, saved by a data scientist who proved it would create more conversation, not less.
queueRank: 3
tier: 1
estimatedReadTime: 9 min read
status: draft
researchGaps:
  - Day-one click volume for the February 9, 2009 launch is not in the public record.
  - The exact internal vote count on Leah Pearlman's hackathon proposal is not documented.
  - The precise date of Justin Rosenstein's first internal mockup presentation in 2007 is not stated in public sources beyond the July hackathon.
sourceSummary: Sources support the 2007 hackathon origin, the codenames Props and Awesome, Mark Zuckerberg's initial rejection, data scientist Itamar Rosenn's evidence that Likes increased comments rather than cannibalising them, the February 9 2009 launch via Leah Pearlman's blog post, the F8 April 21 2010 expansion to external websites with 30-plus launch partners and Zuckerberg's prediction of one billion likes in twenty-four hours, and the February 24 2016 global rollout of Reactions. Sources do not confirm day-one click volume, exact internal vote counts, or claims about long-term sentiment effects.
sources:
  - id: ringer-rosenstein-2017
    title: The Rise of the Like Economy
    publisher: The Ringer
    url: https://www.theringer.com/2017/02/15/tech/how-the-like-button-took-over-the-internet-ebe778be2459
    tier: A
    accessedAt: 2026-05-17
    supports: Direct quotes from Justin Rosenstein and Leah Pearlman about the hackathon, the codenames Props and Awesome, and Zuckerberg's renaming.
  - id: newstatesman-cursed-2015
    title: A cursed project, a short history of the Facebook like button
    publisher: New Statesman
    url: https://www.newstatesman.com/science-tech/2015/10/cursed-project-short-history-facebook-button
    tier: B
    accessedAt: 2026-05-17
    supports: Andrew Bosworth quotes, the December 2008 revival, and data scientist Itamar Rosenn's role in proving Likes increased comments.
  - id: fb-techcrunch-2010-launch
    title: Facebook We Will Serve 1 Billion Likes on the Web in Just 24 Hours
    publisher: TechCrunch
    url: https://techcrunch.com/2010/04/21/facebook-like-button/
    tier: B
    accessedAt: 2026-05-17
    supports: F8 2010 launch on external websites, 30-plus launch partners, the billion-likes-in-24-hours prediction, and CNN, ESPN, IMDb partnerships.
  - id: fb-reactions-2016
    title: Reactions Now Available Globally
    publisher: Meta Newsroom
    url: https://about.fb.com/news/2016/02/reactions-now-available-globally/
    tier: A
    accessedAt: 2026-05-17
    supports: February 24 2016 global launch of Reactions with Love, Haha, Wow, Sad, and Angry alongside Like.
  - id: like-button-wikipedia
    title: Like button
    publisher: Wikipedia
    url: https://en.wikipedia.org/wiki/Like_button
    tier: C
    accessedAt: 2026-05-17
    supports: February 9 2009 launch date and Zuckerberg's directive to rename Awesome to Like.
metrics:
  - label: Public launch date
    value: February 9, 2009
    confidence: confirmed
    sourceIds: [like-button-wikipedia, ringer-rosenstein-2017]
  - label: F8 expansion to the open web
    value: April 21, 2010
    confidence: confirmed
    sourceIds: [fb-techcrunch-2010-launch]
  - label: Launch partner sites at F8 2010
    value: Roughly 30, including CNN, ESPN, IMDb
    confidence: high_confidence
    sourceIds: [fb-techcrunch-2010-launch]
  - label: Zuckerberg projection on day one of F8 launch
    value: Over 1 billion likes across the web in 24 hours
    confidence: high_confidence
    sourceIds: [fb-techcrunch-2010-launch]
  - label: Reactions launched globally
    value: February 24, 2016
    confidence: confirmed
    sourceIds: [fb-reactions-2016]
glanceCards:
  - id: setup
    title: A button stuck in committee
    body: Inside Facebook in 2007, popular posts collected dozens of one-word comments. Leah Pearlman and Justin Rosenstein wanted a single reaction to consolidate them. The proposal sat in committee for almost two years. [ringer-rosenstein-2017]
    sourceIds: [ringer-rosenstein-2017]
    confidence: confirmed
  - id: problem
    title: Zuckerberg said no
    body: Mark Zuckerberg worried a cheap one-click reaction would cannibalise the valuable interactions, the comments and reshares. Internally the project got nicknamed cursed. Development effectively stopped. [newstatesman-cursed-2015]
    sourceIds: [newstatesman-cursed-2015]
    confidence: confirmed
  - id: tempting-move
    title: The lightweight rebuild trap
    body: The tempting path was to dress the same idea up with a heavier rating system, stars, or up and down voting. Each variant added complexity. None solved Zuckerberg's real objection that engagement might drop. [ringer-rosenstein-2017]
    sourceIds: [ringer-rosenstein-2017]
    confidence: high_confidence
  - id: mechanism
    title: A data scientist saved the project
    body: When the team revived the work in December 2008, data scientist Itamar Rosenn ran the test. Posts with a Like button collected more comments, not fewer, because likes boosted reach in the News Feed. [newstatesman-cursed-2015]
    sourceIds: [newstatesman-cursed-2015]
    confidence: confirmed
  - id: evidence
    title: Cross the web in fourteen months
    body: The button launched on February 9, 2009. Fourteen months later at F8, Facebook extended it to roughly 30 partner sites including CNN, ESPN, and IMDb, and predicted a billion likes across the open web in the first day. [fb-techcrunch-2010-launch]
    sourceIds: [fb-techcrunch-2010-launch, like-button-wikipedia]
    confidence: confirmed
  - id: takeaway
    title: A cheap signal, not a small one
    body: The button looked small because it took one click. It was load-bearing because every click fed ranking. Reactions in 2016 extended the same primitive, six emotions tied to one tap. [fb-reactions-2016]
    sourceIds: [fb-reactions-2016]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Add a five-star rating widget so users could grade posts.
      - Build an up and down voting system in the style of Reddit or Digg.
      - Pair every Like with a forced text field so the system still got comments.
    summary: Each variant tried to make feedback feel more substantial and ended up making it heavier.
  whatShipped:
    label: What shipped
    bullets:
      - One thumbs-up icon, one click, no required text.
      - Like counts wired directly into the News Feed ranking signal.
      - The button placed below the post as a single primary action.
    summary: The lightest possible reaction, fed straight into the algorithm that decided what people saw next.
lifecycle:
  - date: 2007-07
    label: First hackathon
    description: Pearlman, Rosenstein, Bosworth and others build the Awesome button overnight.
    type: launch
  - date: 2007-11
    label: Zuckerberg rejects it
    description: First review goes badly. Internally the work gets called the cursed project.
    type: milestone
  - date: 2008-12
    label: Revival with data
    description: Itamar Rosenn shows Likes drive more comments, not fewer.
    type: milestone
  - date: 2009-02-09
    label: Public launch
    description: Pearlman ships the Like button with a blog post titled I like this.
    type: launch
  - date: 2010-04-21
    label: F8 expansion to the open web
    description: Like button rolls out across roughly 30 partner sites.
    type: milestone
  - date: 2016-02-24
    label: Reactions ship globally
    description: Like extends to six emotions, Love, Haha, Wow, Sad, Angry.
    type: today
takeaway:
  principle: A one-click primitive earns its place when it makes the ranking signal richer, not the interface heavier.
  sourceIds: [newstatesman-cursed-2015, fb-techcrunch-2010-launch]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct autopsy hero illustration for the Facebook Like Button origin story. Canvas role hero at aspect 2400x1350. Show a forest green thumbs-up shape rising out of a stack of three rejected sticky note designs labelled with simple star, heart, and plus-minus icons. The rejected stickies are tinted soft amber and mist with charcoal linework. The thumbs-up is filled forest green on a cream background. Small Hatch as narrator at the lower left of the canvas, about 14 percent of canvas height, in narrator pose holding a clipboard, with cap and growth arrow visible. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Leave quiet space in the upper left for title overlay. No human faces, no fake Facebook UI screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A green thumbs-up rises out of a stack of discarded rating concepts while Hatch watches from the corner.
    caption: The one button that beat every heavier rating system on its way to launch.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct illustration of the 2007 internal hackathon scene. Canvas role hatch-narrator at aspect 1600x1600. Show a glowing window into a dim Palo Alto office, a low coffee table with three open laptops, a paper sketch reading Awesome pinned to a corkboard with the word Props crossed out above it, and a wall clock reading 5:47. Use deep forest as the night sky, cream walls, soft amber lamp glow, charcoal linework. Hatch in narrator pose at center, about 28 percent of canvas height, gesturing toward the corkboard, with cap and growth arrow visible and the green H mark on chest. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no real product UI, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch stands beside a corkboard with the crossed-out word Props and a fresh sketch reading Awesome in a dim office at dawn.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct illustration of how the Like button feeds the News Feed. Canvas role failure-mechanism at aspect 1800x1200. Show a single forest green thumbs-up at the lower left connected by a forest green arrow to a stack of three abstract post tiles climbing diagonally to the upper right, each post tile slightly larger than the one below it to convey ranking lift. Add small charcoal tick marks on each tile to represent comments accumulating. Use cream background, mist accent shapes, soft amber arrow tip. Hatch in thinking pose at the upper left, about 18 percent of canvas height, pointing at the lifting tiles, with cap and growth arrow visible. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no fake Facebook UI, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A thumbs-up at the bottom left feeds an arrow that lifts three post tiles upward as Hatch points at the rising stack.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct evidence card visualising the F8 2010 launch numbers. Canvas role evidence-card at aspect 1600x1000. Show a horizontal forest green timeline running from a small thumbs-up labelled Feb 9 2009 on the left to a larger thumbs-up labelled Apr 21 2010 on the right. Below the right thumb, a cream rectangle with the number 30 in large charcoal numerals and a small label reading partner sites. Beneath that, a small mist-coloured cloud shape with the phrase 1B likes in 24 hours rendered in charcoal. Hatch absent from this card to preserve label legibility. Use cream background, deep forest linework, soft amber accents. Use one short label and one visible artifact shape only. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A timeline runs from a small thumbs-up dated February 2009 to a larger one dated April 2010 with thirty partner sites called out.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct lesson illustration. Canvas role lesson-frame at aspect 1800x1200. Show a single large forest green thumbs-up on the left side of the canvas connected to a row of six small reaction shapes on the right, a heart, an open-mouth wow, a tear, a frown, a laugh, and a flame, each in mist with charcoal outlines and a soft amber dot beneath. The arrow between them is forest green and thick. Hatch in coaching pose at the lower center, about 22 percent of canvas height, calm and explanatory, with cap and growth arrow visible. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Cream background. No human faces, no fake product UI, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A single thumbs-up on the left connects via a forest green arrow to six smaller reaction shapes on the right while Hatch stands below in coaching pose.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct thumbnail composition for the Facebook Like Button autopsy. Canvas role thumbnail at aspect 1200x900. Show one strong forest green thumbs-up shape filling the center two-thirds of the canvas with a small soft amber circular badge in the upper right corner reading 2009 in charcoal. Cream background, deep forest outline. A tiny Hatch mark, just the rounded green head silhouette with the cap and growth arrow, sits in the bottom left at about 8 percent of canvas height. Make the decision readable at small size with one strong focal shape. No human faces, no fake Facebook UI, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A bold forest green thumbs-up fills the thumbnail with a 2009 badge and a tiny Hatch head silhouette in the corner.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct social cover for the Facebook Like Button autopsy. Canvas role social-cover at aspect 2400x1260. Show a single large forest green thumbs-up centered on a cream background with three faint discarded ghost shapes behind it, a star, a heart, and a plus-minus, each rendered at 25 percent opacity in deep forest. A horizontal soft amber band at the very bottom holds the words Told by Hatch in small charcoal type. A small Hatch at the lower right at about 12 percent of canvas height in narrator pose, with cap and growth arrow visible. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Keep the center 70 percent clear of edge-critical details. No human faces, no fake Facebook UI. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A large forest green thumbs-up centered on cream with ghosted alternative reaction shapes behind it and a small Hatch in the corner.
    watermark: HackProduct
nextInQueue:
  slug: whatsapp-blue-ticks
  companySlug: meta
  title: WhatsApp Blue Ticks
---

<!-- beat: lede -->

In the summer of 2007, the engineer Justin Rosenstein stood in a small conference room at Facebook's University Avenue office in Palo Alto and clicked through a mockup of a feature called the Awesome button. It was a single thumbs-up, the size of a fingernail, slotted underneath a post in the news stream. The room, by every later account, liked it. The room did not get to decide. Two floors of management would spend the next year and a half debating whether shipping it would kill the conversations on the site or save them [ringer-rosenstein-2017][newstatesman-cursed-2015].

The button is now the most cloned interaction primitive on the consumer internet [fb-reactions-2016]. The story product people miss is how close it came to never shipping. For almost two years the proposal lived under the codenames Props and then Awesome, and Mark Zuckerberg kept rejecting it on the grounds that a cheap reaction would crowd out the long comments and reshares that actually mattered [newstatesman-cursed-2015].

What follows is the story of how a feature gets argued back from the dead, what the team had to prove before the founder said yes, and what the public record can and cannot tell us about the click that ate the internet. The question worth carrying through the read is a small one. When a one-tap signal looks like it is going to thin a conversation, what would actually prove it is going to do the opposite?

<!-- beat: glance -->
## At a glance

**1. A button stuck in committee**

Inside Facebook in 2007, popular posts collected dozens of one-word comments. Leah Pearlman and Justin Rosenstein wanted a single reaction to consolidate them. The proposal sat in committee for almost two years. [ringer-rosenstein-2017]

**2. Zuckerberg said no**

Mark Zuckerberg worried a cheap one-click reaction would cannibalise the valuable interactions, the comments and reshares. Internally the project got nicknamed cursed. Development effectively stopped. [newstatesman-cursed-2015]

**3. The lightweight rebuild trap**

The tempting path was to dress the same idea up with a heavier rating system, stars, or up and down voting. Each variant added complexity. None solved Zuckerberg's real objection that engagement might drop. [ringer-rosenstein-2017]

**4. A data scientist saved the project**

When the team revived the work in December 2008, data scientist Itamar Rosenn ran the test. Posts with a Like button collected more comments, not fewer, because likes boosted reach in the News Feed. [newstatesman-cursed-2015]

**5. Cross the web in fourteen months**

The button launched on February 9, 2009. Fourteen months later at F8, Facebook extended it to roughly 30 partner sites including CNN, ESPN, and IMDb, and predicted a billion likes across the open web in the first day. [fb-techcrunch-2010-launch]

**6. A cheap signal, not a small one**

The button looked small because it took one click. It was load-bearing because every click fed ranking. Reactions in 2016 extended the same primitive, six emotions tied to one tap. [fb-reactions-2016]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

It is summer 2007 in Palo Alto, and Facebook is three years old. Leah Pearlman, one of three product managers on the platform, has been watching popular posts fill up with twenty short comments that all say some version of awesome, nice, congrats [ringer-rosenstein-2017]. The thread is meant to be a conversation. It is a wall of approval noise that buries any real reply. Pearlman puts a feature idea on the internal ideas board and calls it Props.

On the night of July 17, 2007, a small group including Pearlman, the engineer Justin Rosenstein, Andrew Bosworth, Rebekah Cox, Ola Okelola, and Tom Whitnah stays in the office and codes the first version. Rosenstein later told The Ringer, "It was a very classic hackathon of: We stayed up all night and at like six in the morning demoed what we had made" [ringer-rosenstein-2017]. The demo lands well inside the room. Rosenstein takes the mockup, by then renamed the Awesome button, into a review with Zuckerberg later that year.

The review, by Bosworth's own later account, "didn't go well" [newstatesman-cursed-2015]. Zuckerberg's objection was specific and not unreasonable. Facebook's most valuable content, the comments and reshares, took real effort. A one-click thumbs-up offered users a way to discharge the social obligation without producing any of that effort. The risk was a quiet erosion. The site might keep its traffic and lose its conversations.

Feature work effectively stopped. Internally the project picked up a new nickname. People called it the cursed project, and they meant it. The team pitched it again, in different shapes, with different framings, and Zuckerberg kept saying no. Each pitch died in the same room for the same reason. In December 2008, a fresh group including engineers Jonathan Piles and Jaren Morgenstern, designer Soleio Cuervo, and a young data scientist named Itamar Rosenn, took the project off the shelf and decided to try the argument with numbers instead of opinions [newstatesman-cursed-2015]. The next review was the one Zuckerberg approved.

<!-- beat: choice -->
## The obvious answer and what shipped instead

The obvious answers were the heavier ones, and each had a real defender inside the building. One camp wanted to keep the comment field as the only reaction, the existing rich primitive, and treat the wall-of-praise problem as something to be solved by better moderation. Another camp pointed at FriendFeed, then a hotly watched rival, which had already shipped a multi-emoji reaction palette, and argued Facebook should do the same to express more than approval [newstatesman-cursed-2015]. A third camp wanted a heavier rating widget, stars or up-and-down votes, on the theory that nuance would protect quality. Each of these had a defender. Each of them was a reasonable answer to a real problem. The Awesome button, in 2007, was the move with the weakest defenders and the heaviest opposition. It was also the only one that was cheap enough to act as a signal underneath the system, instead of another thing demanding attention on top of it [ringer-rosenstein-2017].

| The tempting move | What shipped |
|---|---|
| Add a five-star rating widget so users could grade posts | One thumbs-up icon, one click, no required text |
| Build a multi-emoji palette like FriendFeed had already shipped | Like counts wired directly into the News Feed ranking signal |
| Pair every Like with a forced text field so the system still got comments | The button placed below the post as a single primary action |
| *Each variant tried to make feedback feel more substantial and ended up making it heavier.* | *The lightest possible reaction, fed straight into the algorithm that decided what people saw next.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The detail almost nobody outside the team noticed is that the Like button was never really about the click. It was about the count. When a user clicked the thumbs-up, four things happened at once. The post's like count incremented by one and became a visible public number underneath the content. The post's author got a notification. The user's friends in the News Feed saw a small line of text reading that the user had liked the post. And, the part that mattered most, the click was logged as a positive signal that fed the algorithm deciding which posts surfaced next in everyone else's feed [newstatesman-cursed-2015]. The visible part was the interface. The load-bearing part was the four downstream events.

That separation is the seam. Every previous proposal had argued about the surface object. The reaction palette debate, the star rating debate, the up-and-down vote debate, were all debates about what the user would see and tap. The thing the December 2008 team understood was that the click's value lived in what happened after it, not in what it looked like [newstatesman-cursed-2015].

Rosenn ran a controlled experiment on posts that had a Like button against posts that did not. The hypothesis Zuckerberg was protecting was that Likes would replace comments. The result Rosenn measured was the opposite. Posts with a Like button collected more comments, not fewer, because the like count fed the News Feed ranking, which surfaced the post to more people, which produced more eyeballs, which produced more comments [newstatesman-cursed-2015]. The cheap signal did not crowd out the expensive one. It fed it. Zuckerberg approved the project in early 2009 and personally renamed Awesome to Like, on the grounds it would translate cleanly across languages [ringer-rosenstein-2017][like-button-wikipedia]. Pearlman shipped the launch post, titled "I like this", on February 9, 2009.

The constraint the team chose to honour was Zuckerberg's, that aggregate conversation must rise. The constraint they ignored was the one that said feedback had to feel substantial to count. A Like did not have to mean anything in particular. It only had to be cheap enough to give freely and visible enough to count.

Two second-order effects followed. The first was the engagement-metric feedback loop. Once the platform's ranking ran on cheap signals, every product team at Facebook learned that the path to distribution was building features that produced more cheap signals, and over the next decade the entire News Feed economy organised itself around that arithmetic. The second was the missing nuance. The Like did not distinguish between agreement, acknowledgment, condolence, or anger, and could not express disagreement. After years of complaints about a death notice receiving thumbs-ups, the company shipped Reactions on February 24, 2016, extending the same one-tap primitive to six emotions [fb-reactions-2016]. The original constraint, one cheap click as the unit of feedback, never moved.

<!-- beat: evidence -->
## Evidence

The public record proves the launch date, the internal codenames, the cast of people, the rejection-and-revival arc, Rosenn's data-driven turning point, and the F8 expansion to the open web [ringer-rosenstein-2017][newstatesman-cursed-2015][fb-techcrunch-2010-launch]. What it does not prove is the Like button's isolated contribution to engagement after launch. That number cannot be cleanly recovered.

Facebook in 2009 and 2010 was changing in several directions at once. The News Feed itself was being re-ranked through that period as the team replaced chronological ordering with algorithmic ordering. The mobile app rollout was bringing tens of millions of users from desktop sessions to all-day sessions on phones. The platform was opening to Facebook Connect, then to the broader graph at F8 2010, and the user base was expanding by hundreds of millions a year. Any one of those shifts would have moved engagement by itself. Picking the Like out of that stack is not possible from public sources.

TechCrunch's report from April 21, 2010 captures Zuckerberg's prediction of more than a billion likes across the open web in the first twenty-four hours of the F8 expansion, with launch partners including CNN, ESPN, and IMDb [fb-techcrunch-2010-launch]. The prediction is widely repeated. The confirmed delivery against it is not in the record. Day-one click volume for the original February 9, 2009 launch is also not documented. What the public record proves is the shape of the bet, not the size of the win.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Public launch date | February 9, 2009 | Confirmed | [like-button-wikipedia][ringer-rosenstein-2017] |
| F8 expansion to the open web | April 21, 2010 | Confirmed | [fb-techcrunch-2010-launch] |
| Launch partner sites at F8 2010 | Roughly 30, including CNN, ESPN, IMDb | High | [fb-techcrunch-2010-launch] |
| Reactions launched globally | February 24, 2016 | Confirmed | [fb-reactions-2016] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "Something I had been thinking about was, is there a way to increase positivity in the system?"
>
> Justin Rosenstein, engineer on the Like button, The Ringer, 2017

<!-- beat: aftermath -->
## Timeline

1. **2007-07**, Pearlman, Rosenstein, Bosworth and others build the Awesome button overnight at a Facebook hackathon. [ringer-rosenstein-2017]
2. **2007-11**, First review with Zuckerberg goes badly. Internally the work gets called the cursed project. [newstatesman-cursed-2015]
3. **2008-12**, Itamar Rosenn shows Likes drive more comments, not fewer. [newstatesman-cursed-2015]
4. **2009-02-09**, Pearlman ships the Like button with a blog post titled I like this. [like-button-wikipedia]
5. **2010-04-21**, F8 extends the button across the open web with roughly thirty partner sites. [fb-techcrunch-2010-launch]
6. **2016-02-24**, Reactions ship globally, six emotions, same one-tap primitive. [fb-reactions-2016]

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **A one-click primitive earns its place when it makes the ranking signal richer, not the interface heavier.**
>
> HackProduct autopsy

The same move shows up elsewhere, once the eye is trained to see it. Slack added emoji reactions to messages in 2015, and inside teams that adopted them the reaction became the canonical way to acknowledge a request without adding a chatty reply, freeing the channel of approval noise the way Pearlman first imagined freeing the Facebook thread. GitHub shipped reactions on issues and pull requests in 2016, and the small heart and thumbs-up underneath a comment now do the job that long "+1" reply chains used to do, while feeding the platform's signals on which issues actually matter to maintainers. In each case the trick is the same. The cheap click did not replace the substantive contribution. It made room for it.

<!-- beat: references -->
## References

1. **The Rise of the Like Economy**, The Ringer · Tier A · accessed 2026-05-17. https://www.theringer.com/2017/02/15/tech/how-the-like-button-took-over-the-internet-ebe778be2459
   Supports: Direct quotes from Justin Rosenstein and Leah Pearlman about the hackathon, the codenames Props and Awesome, and Zuckerberg's renaming.
2. **A cursed project, a short history of the Facebook like button**, New Statesman · Tier B · accessed 2026-05-17. https://www.newstatesman.com/science-tech/2015/10/cursed-project-short-history-facebook-button
   Supports: Andrew Bosworth quotes, the December 2008 revival, and data scientist Itamar Rosenn's role in proving Likes increased comments.
3. **Facebook We Will Serve 1 Billion Likes on the Web in Just 24 Hours**, TechCrunch · Tier B · accessed 2026-05-17. https://techcrunch.com/2010/04/21/facebook-like-button/
   Supports: F8 2010 launch on external websites, 30-plus partner sites, the billion-likes-in-24-hours prediction.
4. **Reactions Now Available Globally**, Meta Newsroom · Tier A · accessed 2026-05-17. https://about.fb.com/news/2016/02/reactions-now-available-globally/
   Supports: February 24 2016 global launch of Reactions.
5. **Like button**, Wikipedia · Tier C · accessed 2026-05-17. https://en.wikipedia.org/wiki/Like_button
   Supports: February 9 2009 launch date, Zuckerberg's directive to rename Awesome to Like.

<!-- beat: forward -->
## Next in queue

**WhatsApp Blue Ticks**, Three lines of logic that turned every unanswered message into a small social receipt.

→ [/autopsies/meta/whatsapp-blue-ticks](/autopsies/meta/whatsapp-blue-ticks)
