---
slug: twitter-hashtag
companySlug: twitter
companyName: Twitter
title: The Twitter Hashtag
dek: A consultant proposed a one-character convention, Twitter called it too nerdy, and a wildfire shipped it anyway.
queueRank: 9
tier: 1
estimatedReadTime: 9 min read
status: draft
researchGaps:
  - The CNBC profile of Messina was unreachable during fetch (HTTP 403); quotes attributed to Stone and Williams via that piece are cross-confirmed in Euronews and Web Directions but not first-party verified here.
  - No public number exists for daily hashtag volume in 2007 or 2008; the only multi-source figure is the 125M-per-day average reported by The Guardian and re-cited a decade later.
  - The exact size of Twitter's product team in August 2007 is not stated in the sources gathered, and the internal decision-making behind the initial rejection survives only as Messina's later recollection.
sourceSummary: Messina's own 2007 blog post and his original public tweet establish the proposal text, date, and reasoning. Wikipedia and Buffer provide the adoption timeline (San Diego wildfires, July 2009 hyperlinking, 2010 Trending Topics). Euronews and Web Directions supply direct Messina quotes about Twitter's initial rejection and later forced adoption. The Biz Stone "we'll get right on that" line is reported by Web Directions citing Stone's own Medium recollection. No source surveyed gives a hard hashtag-volume figure for the 2007-2010 window; the 125M/day number is a 2017 Guardian estimate.
sources:
  - id: messina-factoryjoe-2007
    title: Groups for Twitter; or A Proposal for Twitter Tag Channels
    publisher: Factory Joe (Chris Messina's blog)
    url: https://factoryjoe.com/2007/08/25/groups-for-twitter-or-a-proposal-for-twitter-tag-channels/
    tier: A
    accessedAt: 2026-05-17
    supports: The mechanics of the original proposal, the IRC and Jaiku influences, the mobile-keypad argument for the pound sign, and the exact framing Messina pitched.
  - id: hashtag-wikipedia
    title: Hashtag
    publisher: Wikipedia
    url: https://en.wikipedia.org/wiki/Hashtag
    tier: C
    accessedAt: 2026-05-17
    supports: Date of the first hashtag tweet, July 2, 2009 hyperlinking, 2010 Trending Topics launch, the Stowe Boyd post date. Used only for dates per the brief.
  - id: messina-wikipedia
    title: Chris Messina (open-source advocate)
    publisher: Wikipedia
    url: https://en.wikipedia.org/wiki/Chris_Messina_(open-source_advocate)
    tier: C
    accessedAt: 2026-05-17
    supports: Messina's background as a consultant and BarCamp organiser in 2007 and Twitter's initial dismissal language. Used only for biographical date facts per the brief.
  - id: buffer-hashtag-history
    title: The Surprising History of Twitter's Hashtag Origin
    publisher: Buffer
    url: https://buffer.com/resources/a-concise-history-of-twitter-hashtags-and-how-you-should-use-them-properly/
    tier: B
    accessedAt: 2026-05-17
    supports: The adoption timeline between August 2007 and 2010, the San Diego wildfire moment, the Evan Williams "too nerdy" line, and Messina's framing of the Instagram tipping point.
  - id: euronews-trojan-horse-2017
    title: Hashtags entered Twitter like a Trojan horse, says creator Chris Messina
    publisher: Euronews
    url: https://www.euronews.com/2017/08/24/hashtags-entered-twitter-like-a-trojan-horse-says-creator-chris-messina
    tier: B
    accessedAt: 2026-05-17
    supports: The "simplest, stupidest thing that could possibly work" quote, the Trojan horse framing, and the July 2011 milestone for Twitter publicly acknowledging hashtags.
  - id: web-directions-10-years
    title: Chris Messina and 10 Years of the #hashtag
    publisher: Web Directions
    url: https://webdirections.org/blog/chris-messina-10-years-hashtag/
    tier: B
    accessedAt: 2026-05-17
    supports: Biz Stone's "Sure, we'll get right on that" recollection, the 125M-per-day Guardian estimate, and the August 23, 2007 12:25 PM PST timestamp on the original tweet.
metrics:
  - label: First hashtag tweet
    value: August 23, 2007, 12:25 PM PST
    confidence: confirmed
    sourceIds: [hashtag-wikipedia, web-directions-10-years, messina-factoryjoe-2007]
  - label: Days from proposal to follow-up blog post
    value: 2 days
    confidence: confirmed
    sourceIds: [messina-factoryjoe-2007, buffer-hashtag-history]
  - label: Twitter begins hyperlinking hashtags
    value: July 2, 2009
    confidence: confirmed
    sourceIds: [hashtag-wikipedia, messina-wikipedia]
  - label: Average daily hashtags shared on Twitter, 2017
    value: 125 million per day
    confidence: medium_confidence
    sourceIds: [web-directions-10-years]
glanceCards:
  - id: setup
    title: A consultant with no Twitter login
    body: In August 2007 Chris Messina ran a small consultancy and helped organise BarCamp meetups. He used Twitter heavily and noticed unrelated conversations collapsing into one timeline with no way to pull a thread apart [messina-factoryjoe-2007].
    sourceIds: [messina-factoryjoe-2007, messina-wikipedia]
    confidence: confirmed
  - id: problem
    title: Conversations with no rooms
    body: Twitter in 2007 had no groups, no channels, no topic filter. People at BarCamp could not find each other's posts unless they already followed each other, and big shared moments dissolved into noise the next morning [messina-factoryjoe-2007].
    sourceIds: [messina-factoryjoe-2007]
    confidence: confirmed
  - id: tempting-move
    title: Build groups, like Flickr
    body: The obvious shape was a Flickr style groups feature with membership, settings, and a dashboard. Messina opens his proposal by rejecting that route, saying he is not convinced groups are a good fit for the medium [messina-factoryjoe-2007].
    sourceIds: [messina-factoryjoe-2007]
    confidence: confirmed
  - id: mechanism
    title: One character, no backend
    body: His pitch was one symbol the user types inline. Type `#barcamp` in your tweet and you have joined the channel. No accounts, no membership rolls, no admins. The convention borrowed from IRC and Jaiku and worked on T9 phone keypads [messina-factoryjoe-2007].
    sourceIds: [messina-factoryjoe-2007]
    confidence: confirmed
  - id: evidence
    title: A wildfire did the launch
    body: Twitter co-founders called it too nerdy [buffer-hashtag-history]. Two months later Nate Ritter started tagging posts `#sandiegofire` during the October 2007 California wildfires and people followed the tag for live updates. Twitter began hyperlinking hashtags on July 2, 2009 [hashtag-wikipedia].
    sourceIds: [buffer-hashtag-history, hashtag-wikipedia]
    confidence: confirmed
  - id: takeaway
    title: The lesson
    body: A convention that costs the platform nothing and the user one keystroke can outrun a feature roadmap. Twitter shipped the hashtag by not blocking it, which is sometimes the only call the team has to get right [euronews-trojan-horse-2017].
    sourceIds: [euronews-trojan-horse-2017]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Build a Groups feature with names, descriptions, members, and admins.
      - Add a settings panel so users can manage which groups they belong to.
      - Treat conversations as containers the platform owns and assigns IDs to.
      - Ship later, after the data model and the moderation rules are figured out.
    summary: Reach for Flickr style groups and spend a quarter building the wrong thing.
  whatShipped:
    label: What shipped
    bullets:
      - One inline character, the pound sign, typed by the user in any tweet.
      - No accounts, no membership, no admin role, no database table.
      - A convention drawn from IRC and Jaiku, already familiar to the early Twitter crowd.
      - Adoption first, recognition by the platform almost two years later.
    summary: A keystroke convention the user supplies, with the platform agreeing to render it later.
lifecycle:
  - date: 2007-08-23
    label: The proposal tweet
    description: Messina posts "How do you feel about using #" on Twitter.
    type: launch
  - date: 2007-08-25
    label: The Factory Joe writeup
    description: A 2,000 word follow-up post details the mechanics and mockups.
    type: milestone
  - date: 2007-10
    label: San Diego wildfires
    description: '#sandiegofire becomes the first widely tracked tag.'
    type: milestone
  - date: 2009-07-02
    label: Twitter hyperlinks hashtags
    description: Every # becomes a clickable search query.
    type: milestone
  - date: 2010
    label: Trending Topics
    description: Hashtags get a front-page surface and an algorithm.
    type: milestone
  - date: 2026
    label: Universal convention
    description: Hashtags ship inside every major social platform and most messaging apps.
    type: today
takeaway:
  principle: The cheapest feature is a convention the user supplies and the platform only has to agree to render later.
  sourceIds: [messina-factoryjoe-2007, euronews-trojan-horse-2017]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct autopsy hero illustration about the Twitter hashtag. Foreground centre shows a giant forest-green pound sign in deep forest `#244232` outline on a warm cream `#faf6f0` background, with three short cream tweet bars to its right tagged with small amber `#705c30` `#barcamp` and `#sandiegofire` labels stacked like sticky notes. Small Hatch narrator in the lower left, around 14 percent canvas height, in narrator pose, gesturing toward the pound sign, with the canonical rounded forest-green head frame, cream face and body, graduation cap, growth arrow above the cap, green H mark on the chest, simple mitten hands, friendly coach expression. Soft amber `#c9ad68` highlight ring behind the hashtag. Mist `#dfe6dc` band along the bottom for a clean horizon. Leave quiet negative space upper-left for a title overlay. Aspect 2400x1350. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A forest-green pound sign with three tweet cards labelled with early hashtags, narrated by a small Hatch mascot.
    caption: One character, one convention, one decade of social media chrome.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct autopsy scene illustration set inside a small 2007 office. Two cream desk silhouettes with charcoal `#1e211c` linework, an early Twitter dashboard rendered as three abstract message bars in forest green, and a paper printout labelled "tag channels proposal" lying on the floor like it was tossed aside. A wall calendar shows AUG 2007. Hatch in narrator pose at right, around 18 percent canvas height, with cap and growth arrow intact, cream face, green H on the chest, mitten hand pointing at the printout, friendly coach expression. Background is warm cream `#faf6f0` with a soft amber `#c9ad68` light bar from a window. No human faces, no real product screenshots. Aspect 1600x1600. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A pitch document for hashtag channels lies on the floor of an early Twitter office while Hatch points at it from the corner.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric diagram of how the hashtag works as a user-supplied convention. Centre shows a single tweet card in cream with deep forest `#244232` outline, the typed body reading "watching the smoke from #sandiegofire" with the hashtag highlighted in soft amber `#c9ad68`. A forest-green arrow leaves the hashtag and fans out to three smaller tweet cards on the right, each carrying the same `#sandiegofire` token. A second arrow loops back to a small search box with the hashtag as the query. To the left, a vertical "no database needed" label in amber `#705c30` next to a struck-through grey rectangle representing a rejected groups table. Hatch at lower-right at 16 percent canvas height in thinking-pointing pose, cap and growth arrow visible, mitten hand pointing at the fan-out arrow. Aspect 1800x1200. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A tweet containing a hashtag fans out to other tweets and a search query, with Hatch pointing at the routing arrow.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct evidence card showing the hashtag adoption timeline as a single horizontal forest-green `#4a7c59` band on warm cream `#faf6f0`. Four ticks across the band, labelled in charcoal `#1e211c`: "Aug 23 2007 proposal", "Oct 2007 #sandiegofire", "Jul 2 2009 hyperlinked", "2010 Trending Topics". One soft amber `#c9ad68` dot sits at the wildfire tick, slightly larger, signalling the inflection. Hatch absent, only a tiny corner watermark mark. Single short caption strip at the top reading "Adoption did the work" in amber `#705c30`. Aspect 1600x1000. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A timeline band shows four hashtag adoption milestones with the San Diego wildfire emphasised as the inflection point.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct lesson illustration. Centre shows a single key on a cream `#faf6f0` keyboard tile, the key embossed with a forest-green `#4a7c59` pound sign and a small upward arrow next to it. Around the tile, three concentric mist `#dfe6dc` rings expand outward to suggest ripple adoption. Below the key, a thin soft-amber `#c9ad68` plinth labelled "user-supplied" in amber `#705c30`. Hatch on the right in coaching stance at around 18 percent canvas height, calm and friendly, cap and growth arrow visible, cream face, green H on chest, mitten hand gesturing toward the keyboard tile. No dense text. Aspect 1800x1200. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A single keyboard key etched with a hashtag radiates outward while Hatch gestures toward it in a coaching pose.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct thumbnail composition. One large forest-green `#4a7c59` pound sign centred on a warm cream `#faf6f0` square background, with a soft amber `#c9ad68` halo behind it. A tiny Hatch watermark-adjacent mark in the lower-right corner at about 8 percent canvas height showing only the head silhouette with cap and growth arrow, no body needed. No labels. One single strong focal shape readable at 320 pixels wide. Aspect 1200x900. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A bold forest-green hashtag on a cream square with a tiny Hatch icon in the corner.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct social cover for the Twitter hashtag story. Central forest-green `#4a7c59` pound sign on warm cream `#faf6f0`, slightly offset right with three small soft-amber `#c9ad68` tweet cards drifting toward it from the left like iron filings to a magnet. Title-safe centre 70 percent kept clear of edge-critical content. Hatch as a small narrator at the far left edge, around 14 percent canvas height, in narrator pose, with cap, growth arrow, cream face, green H chest mark, mitten hand pointing inward. Deep forest `#244232` thin border line along the bottom for ballast. Aspect 2400x1260. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A pound sign attracts small tweet cards across a cream canvas with Hatch narrating from the left edge.
    watermark: HackProduct
nextInQueue:
  slug: duolingo-streak
  companySlug: duolingo
  title: Duolingo Streak
---

<!-- beat: lede -->

At 12:25 PM Pacific on August 23, 2007, a freelance product consultant named Chris Messina typed a single sentence into Twitter and pressed send. "how do you feel about using # (pound) for groups. As in #barcamp [msg]?" [web-directions-10-years]. The post collected no retweets and no likes, because Twitter in 2007 had not built either of those buttons yet. It was not a product announcement. It was a user reaching past the product, with a one-character idea about how the product might work better.

Two days later Messina published a 2,000 word follow-up on his blog laying out the mechanics, the precedent from IRC and Jaiku, and a set of hand-drawn mockups [messina-factoryjoe-2007]. Twitter declined to ship anything. The convention spread anyway. By October a fire in San Diego would do the launching the platform refused to do, and almost two years later Twitter would quietly start turning every # into a clickable search [hashtag-wikipedia]. The interesting thing is not the feature. The interesting thing is who shipped it, and why a roomful of product people initially said no.

The question worth carrying through the read is small. When the cheapest version of a feature is a convention the user already writes, who gets credit for the build, and what does it cost the team to step out of the way?

<!-- beat: glance -->
## At a glance

**1. A consultant with no Twitter login**

In August 2007 Chris Messina ran a small consultancy and helped organise BarCamp meetups. He used Twitter heavily and noticed unrelated conversations collapsing into one timeline with no way to pull a thread apart [messina-factoryjoe-2007].

**2. Conversations with no rooms**

Twitter in 2007 had no groups, no channels, no topic filter. People at BarCamp could not find each other's posts unless they already followed each other, and big shared moments dissolved into noise the next morning [messina-factoryjoe-2007].

**3. Build groups, like Flickr**

The obvious shape was a Flickr style groups feature with membership, settings, and a dashboard. Messina opens his proposal by rejecting that route, saying he is not convinced groups are a good fit for the medium [messina-factoryjoe-2007].

**4. One character, no backend**

His pitch was one symbol the user types inline. Type `#barcamp` in your tweet and you have joined the channel. No accounts, no membership rolls, no admins. The convention borrowed from IRC and Jaiku and worked on T9 phone keypads [messina-factoryjoe-2007].

**5. A wildfire did the launch**

Twitter co-founders called it too nerdy [buffer-hashtag-history]. Two months later Nate Ritter started tagging posts `#sandiegofire` during the October 2007 California wildfires and people followed the tag for live updates. Twitter began hyperlinking hashtags on July 2, 2009 [hashtag-wikipedia].

**6. The lesson**

A convention that costs the platform nothing and the user one keystroke can outrun a feature roadmap. Twitter shipped the hashtag by not blocking it, which is sometimes the only call the team has to get right [euronews-trojan-horse-2017].

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

Twitter in August 2007 is a small site held together by string. The company has barely cleared its first year, runs on a Ruby on Rails monolith that crashes most weeks, and ships from a tiny South Park office in San Francisco. There is no public API beyond a handful of read endpoints, no direct messages, no retweets, no likes. Tweets arrive in a single firehose ordered by recency, and there is exactly one way to find a conversation: follow every person in it before it starts.

Chris Messina is in his mid-twenties, freelancing as a product consultant out of Citizen Agency, and spends his evenings helping organise BarCamp, an unconference series whose entire culture runs on lightweight conventions [messina-wikipedia]. He has been on IRC for nearly a decade, where every channel name starts with a `#` and rooms cost nothing to spin up. The pattern is sitting in plain sight. When two hundred people walk into the same building for a weekend, they need a way to find each other's posts without already following each other, and Twitter offers no such surface [messina-factoryjoe-2007].

Messina takes the obvious step and walks the idea to the Twitter office. The version that survives in the public record is brief and unflattering. Biz Stone, deep in firefighting another outage, replies with a polite "Sure, we'll get right on that" before turning back to the crash [web-directions-10-years]. Evan Williams, in the line that travels furthest later, calls the whole notion too nerdy and tells Messina it will never catch on outside a niche of IRC users [buffer-hashtag-history]. The rejection is not hostile. It is the considered judgment of two founders who genuinely cannot see a normal person typing a pound sign into a tweet on purpose.

So Messina goes home, opens his laptop on August 23, and asks the only group whose opinion can route around the founders. He types the proposal directly into Twitter, in public, where the people who actually use the product can answer. The fork is now in front of him: keep arguing with the people who own the codebase, or write the convention down so cleanly that the codebase becomes optional.

<!-- beat: choice -->
## The obvious answer and what shipped instead

The obvious answer in 2007 was Groups, and it had three credible shapes. The first was the polite product-led move: build a real Groups feature with names, descriptions, members, admins, and a settings panel, the way Flickr and Yahoo and a dozen other social products had done it. That was the move a serious platform was expected to make, and the move a careful PM would have shipped. The second was to do nothing at all, on the perfectly defensible grounds that Twitter could barely keep the site up, and that grouping conversations was a problem for a company with engineers to spare. The third was a dedicated topics page, a curated index of subjects the platform itself maintained. Each of these was a reasonable answer to a real problem, and any of them could have been defended in a roadmap review. They were also, taken together, the moves that would have buried the cheapest version of the feature under months of meetings.

| The tempting move | What shipped |
|---|---|
| Build a Groups feature with names, descriptions, members, and admins. | One inline character, the pound sign, typed by the user in any tweet. |
| Add a settings panel so users can manage which groups they belong to. | No accounts, no membership, no admin role, no database table. |
| Treat conversations as containers the platform owns and assigns IDs to. | A convention drawn from IRC and Jaiku, already familiar to the early Twitter crowd. |
| Ship later, after the data model and the moderation rules are figured out. | Adoption first, recognition by the platform almost two years later. |
| *Reach for Flickr style groups and spend a quarter building the wrong thing.* | *A keystroke convention the user supplies, with the platform agreeing to render it later.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The seam almost nobody at Twitter noticed is that the platform had already shipped the feature. Tweets in 2007 were plain text strings indexed by Twitter's own search, and the search backend treated any sequence of characters between word boundaries as a token to be matched [messina-factoryjoe-2007]. A user who typed `#barcamp` was not invoking any product surface. They were writing seven characters in a status update, and Twitter's existing search would happily find every other tweet that had written the same seven characters. The hashtag did not need a database table, a permissions model, or a single backend deploy. It needed a convention, and conventions are notational. The platform was already storing the necessary data; it just had to agree, eventually, to stop treating the `#` as a typo.

Messina's writeup is explicit about what the convention honours. It costs the user a single character, composes inside the 140 character limit, works on the T9 keypads of the era, and borrows a shape that BarCamp regulars already use without thinking [messina-factoryjoe-2007]. The constraint it refuses to honour is top-down product control. There is no register of approved tags, no way for Twitter to assign ownership of `#barcamp`, no permission gate, no moderation surface at the protocol level. The team that ships this gives up the ability to gatekeep a primitive that touches every tweet on the platform. For two founders who had reflexively reached for a more controllable shape, this was the part of the trade they could not, in the moment, see paying for.

The launch did not come from Twitter. On October 21, 2007 a wildfire broke out near San Diego and grew into the largest fire emergency California had seen in a decade. Nate Ritter, a local web developer, began tagging his on-the-ground updates with `#sandiegofire` and asking others to do the same [buffer-hashtag-history]. The convention caught because there was no alternative. People needed a way to follow the fire, the only filter available was Twitter's search, and `#sandiegofire` was the cheapest agreement strangers could reach without anyone in charge. Almost two years later, on July 2, 2009, Twitter quietly shipped the smallest possible product change: every `#` followed by alphanumerics became a clickable link to the search results page [hashtag-wikipedia]. The convention was acknowledged, not invented.

The second-order effects were enormous and almost entirely unanticipated. The hashtag became the unit of cultural moments, from `#icebucketchallenge` to `#metoo` to `#blacklivesmatter`, and the substrate for protest coordination, breaking-news triage, and brand activism. It also became the substrate for the worst pathologies of the algorithmic discovery layer: brand-jacking, hashtag spam wars, and the slow drift from organic coordination to gamed visibility. Twitter spent the better part of a decade cleaning up after a primitive it never quite chose to ship.

<!-- beat: evidence -->
## Evidence

The public record on this story is unusually clean because most of it lives on Messina's own blog and Twitter account, both still online. The exact text of the August 23, 2007 tweet, the August 25 follow-up post, and the attached mockups are primary sources with timestamps anyone can verify against the live URLs [messina-factoryjoe-2007][web-directions-10-years]. The October 2007 adoption around `#sandiegofire` is documented in contemporaneous coverage. Twitter's July 2, 2009 hyperlinking change and the 2010 Trending Topics launch are dated and uncontested [hashtag-wikipedia]. By 2017 the platform was averaging an estimated 125 million hashtag-bearing tweets per day, a Guardian figure cited across the ten-year retrospectives and the only multi-source volume number in the public record [web-directions-10-years].

What the record does not nail down is the inside of the room. Messina's "too nerdy" line is his own recollection, repeated for over a decade and never publicly contested by Stone or Williams, but a recollection nonetheless [buffer-hashtag-history]. The "Sure, we'll get right on that" exchange comes via Stone's later Medium writing as paraphrased by Web Directions [web-directions-10-years]. Neither company has produced original internal notes, and the exact size of the Twitter product team in August 2007 is not stated in any source gathered. The honest claim is that Twitter declined, the user shipped instead, and the platform formally caught up two years later. The texture of the no is folklore, told consistently enough to be probably true.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| First hashtag tweet | Aug 23 2007, 12:25 PM PST | Confirmed | [web-directions-10-years] |
| Days from proposal to follow-up post | 2 days | Confirmed | [messina-factoryjoe-2007] |
| Twitter begins hyperlinking hashtags | July 2, 2009 | Confirmed | [hashtag-wikipedia] |
| Average daily hashtags on Twitter, 2017 | 125 million | Medium | [web-directions-10-years] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "It was the simplest, stupidest thing that could possibly work. In some ways, it was kind of a trojan horse thing."
>
> — Chris Messina, on the hashtag's adoption, Euronews, August 2017

<!-- beat: aftermath -->
## Timeline

1. **2007-08-23**, Messina posts "how do you feel about using #" on Twitter at 12:25 PM PST.
2. **2007-08-25**, A 2,000 word follow-up post on factoryjoe.com details the mechanics and mockups.
3. **2007-10**, `#sandiegofire` becomes the first widely tracked tag during the California wildfires.
4. **2009-07-02**, Twitter begins hyperlinking every hashtag to a search query.
5. **2010**, Trending Topics ships on the Twitter front page, surfacing tags by algorithm.
6. **2026**, Hashtags are universal chrome across every major social platform and most messaging apps.

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **The cheapest feature is a convention the user supplies and the platform only has to agree to render later.**
>
> — HackProduct autopsy

The same move turns up across products that quietly became infrastructure. The `@-mention` arrived on Twitter the same way, lifted out of IRC by users who had been addressing each other with a leading `@` for years before any platform made the symbol a link. Slack's threading began as a user workaround, teams spinning up parallel side channels for every aside, and the official threading feature shipped years later as a formal version of behaviour the users had already invented. The team holds the rendering layer. The users hold the convention. The cheapest feature is the one where the team stops fighting the keystroke.

<!-- beat: references -->
## References

1. **Groups for Twitter; or A Proposal for Twitter Tag Channels**, Factory Joe · Tier A · accessed 2026-05-17. [https://factoryjoe.com/2007/08/25/groups-for-twitter-or-a-proposal-for-twitter-tag-channels/](https://factoryjoe.com/2007/08/25/groups-for-twitter-or-a-proposal-for-twitter-tag-channels/)
   Supports: the mechanics of the original proposal, IRC and Jaiku influences, mobile keypad rationale.
2. **Hashtag**, Wikipedia · Tier C · accessed 2026-05-17. [https://en.wikipedia.org/wiki/Hashtag](https://en.wikipedia.org/wiki/Hashtag)
   Supports: date of the first hashtag tweet, July 2, 2009 hyperlinking, 2010 Trending Topics launch.
3. **Chris Messina (open-source advocate)**, Wikipedia · Tier C · accessed 2026-05-17. [https://en.wikipedia.org/wiki/Chris_Messina_(open-source_advocate)](https://en.wikipedia.org/wiki/Chris_Messina_(open-source_advocate))
   Supports: Messina's background as a consultant and BarCamp organiser in 2007.
4. **The Surprising History of Twitter's Hashtag Origin**, Buffer · Tier B · accessed 2026-05-17. [https://buffer.com/resources/a-concise-history-of-twitter-hashtags-and-how-you-should-use-them-properly/](https://buffer.com/resources/a-concise-history-of-twitter-hashtags-and-how-you-should-use-them-properly/)
   Supports: the adoption timeline, the San Diego wildfire moment, the "too nerdy" framing.
5. **Hashtags entered Twitter like a Trojan horse**, Euronews · Tier B · accessed 2026-05-17. [https://www.euronews.com/2017/08/24/hashtags-entered-twitter-like-a-trojan-horse-says-creator-chris-messina](https://www.euronews.com/2017/08/24/hashtags-entered-twitter-like-a-trojan-horse-says-creator-chris-messina)
   Supports: the "simplest, stupidest thing" quote, the Trojan horse framing, the July 2011 platform acknowledgement milestone.
6. **Chris Messina and 10 Years of the #hashtag**, Web Directions · Tier B · accessed 2026-05-17. [https://webdirections.org/blog/chris-messina-10-years-hashtag/](https://webdirections.org/blog/chris-messina-10-years-hashtag/)
   Supports: Biz Stone's "Sure, we'll get right on that" recollection, the 125M-per-day Guardian estimate.

<!-- beat: forward -->
## Next in queue

**Duolingo Streak**, One number, sitting next to your avatar, doing the heavy lifting of a daily habit.

→ [/autopsies/duolingo/duolingo-streak](/autopsies/duolingo/duolingo-streak)
