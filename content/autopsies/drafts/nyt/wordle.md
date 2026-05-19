---
slug: wordle
companySlug: nyt
companyName: The New York Times
title: Wordle
dek: Josh Wardle built a daily word puzzle for one person, refused the standard attention playbook, and watched the limit become the product.
queueRank: 7
tier: 1
estimatedReadTime: 7 min read
status: draft
researchGaps:
  - The exact December 2021 date Wardle shipped the share button is not stated in the public record.
  - The final NYT acquisition price is reported only as "low seven figures"; no precise figure is public.
  - The size of Wardle's curated answer list is reported as roughly 2,500 words; the exact number used at launch is not confirmed in primary sources.
sourceSummary: Sources back the timeline (90 players on November 1, 2021; ~300,000 by January 2, 2022; ~2 million by mid-January; NYT acquisition January 31, 2022), the origin story (built for partner Palak Shah, who curated the answer list), the New Zealand origin of the share grid (Elizabeth S., @irihapeta), and Wardle's stated philosophy of one puzzle per day with no ads or push notifications. Wardle's prior Reddit work (The Button, Place) is confirmed. The acquisition price is on the record only as "low seven figures." No source confirms the exact day the share button shipped, only that it followed the New Zealand emoji-tile pattern in late 2021.
sources:
  - id: wikipedia-wordle
    title: Wordle
    publisher: Wikipedia
    url: https://en.wikipedia.org/wiki/Wordle
    tier: B
    accessedAt: 2026-05-17
    supports: Launch date October 2021, player count milestones (90 on Nov 1 2021, 300k by Jan 2 2022, 2M by mid-January), NYT acquisition January 31 2022 for low seven figures, 2013 prototype origin, move to NYT site on February 10 2022.
  - id: time-wardle-interview-2022
    title: Wordle Creator Josh Wardle Talks NYT Sale, Game's Success
    publisher: TIME
    url: https://time.com/6143715/wordle-sale-josh-wardle-interview/
    tier: B
    accessedAt: 2026-05-17
    supports: Wardle's quoted philosophy on attention design, the one-puzzle-a-day choice, and his quoted statement that selling brought relief.
  - id: nytco-acquisition-press
    title: The New York Times Company Acquires Wordle
    publisher: The New York Times Company
    url: https://www.nytco.com/press/the-new-york-times-company-acquires-wordle/
    tier: A
    accessedAt: 2026-05-17
    supports: Official acquisition announcement, low-seven-figure price, commitment that the game stays free for new and existing players at launch, Jonathan Knight as head of NYT Games.
  - id: buzzfeed-share-grid-2022
    title: How Wordle Went Viral
    publisher: BuzzFeed News
    url: https://www.buzzfeednews.com/article/stefficao/how-wordle-went-viral-strategy
    tier: B
    accessedAt: 2026-05-17
    supports: New Zealand origin of the emoji share grid, Elizabeth S. (@irihapeta) as the originator, the #DailyWordleClub seed, growth trajectory from November 2021 to mid-January 2022, 1.2 million Twitter shares January 1–13 2022.
  - id: theygotacquired-wordle
    title: Who created Wordle? The story of how this game sold to The New York Times for 7 figures
    publisher: They Got Acquired
    url: https://theygotacquired.com/gaming/wordle-acquired-by-the-new-york-times/
    tier: C
    accessedAt: 2026-05-17
    supports: Background on the build for Palak Shah, the answer-list curation from 12,000 words down to roughly 2,500, the 2013 prototype name "Mr. Bugs' Wordy Nugz."
  - id: variety-acquisition-2022
    title: New York Times Buys Wordle for a Price in the 'Low-Seven Figures'
    publisher: Variety
    url: https://variety.com/2022/digital/news/new-york-times-wordle-sale-1235168003/
    tier: B
    accessedAt: 2026-05-17
    supports: NYT acquisition price language and timing, confirmation of free gameplay commitment, Wardle's tweeted explanation that maintenance became overwhelming.
metrics:
  - label: Players on November 1, 2021
    value: 90
    confidence: confirmed
    sourceIds: [wikipedia-wordle, buzzfeed-share-grid-2022]
  - label: Players by January 2, 2022
    value: ~300,000
    confidence: confirmed
    sourceIds: [wikipedia-wordle, buzzfeed-share-grid-2022]
  - label: Players by mid-January 2022
    value: ~2,000,000
    confidence: confirmed
    sourceIds: [wikipedia-wordle, buzzfeed-share-grid-2022]
  - label: Acquisition price
    value: Low seven figures (USD)
    confidence: confirmed
    sourceIds: [nytco-acquisition-press, variety-acquisition-2022]
  - label: Twitter shares of the emoji grid, January 1–13, 2022
    value: ~1,200,000
    confidence: high_confidence
    sourceIds: [buzzfeed-share-grid-2022]
  - label: Curated answer list size
    value: ~2,500 words (from a pool of ~12,000)
    confidence: medium_confidence
    sourceIds: [theygotacquired-wordle]
glanceCards:
  - id: setup
    title: A gift for one person
    body: A software engineer in Brooklyn revives a 2013 prototype during the pandemic and builds a daily word puzzle for his partner, who curates the answer list down to words she would actually know. [theygotacquired-wordle]
    sourceIds: [theygotacquired-wordle]
    confidence: high_confidence
  - id: problem
    title: A genre crowded with noise
    body: The standard word-game playbook in 2021 looked like infinite rounds, ads between turns, push notifications, login walls, and progression systems built to keep people inside an app for as long as possible. [time-wardle-interview-2022]
    sourceIds: [time-wardle-interview-2022]
    confidence: confirmed
  - id: tempting-move
    title: The obvious version
    body: A native app, unlimited puzzles, leaderboards, social profiles, a coin economy, hint purchases, daily streak bonuses. Every retention lever a 2021 mobile game designer knew how to pull, switched on by default. [time-wardle-interview-2022]
    sourceIds: [time-wardle-interview-2022]
    confidence: high_confidence
  - id: mechanism
    title: One puzzle, three minutes, then out
    body: One word per day. Same word for everyone. A static web page. No app, no account, no ads, no streak bait. When the puzzle is solved or six guesses are used, the game is done until tomorrow. [time-wardle-interview-2022]
    sourceIds: [time-wardle-interview-2022]
    confidence: confirmed
  - id: evidence
    title: 90 to two million in ten weeks
    body: Ninety players on November 1, 2021. Three hundred thousand by January 2. Two million a week later. Most of that growth rode a spoiler-free emoji grid that a New Zealand player invented in a group chat. [wikipedia-wordle, buzzfeed-share-grid-2022]
    sourceIds: [wikipedia-wordle, buzzfeed-share-grid-2022]
    confidence: confirmed
  - id: takeaway
    title: The constraint was the brand
    body: The New York Times paid a low seven figures for a game with no app, no monetisation, and one daily round. They were buying the discipline that made it feel different, not the code. [nytco-acquisition-press, variety-acquisition-2022]
    sourceIds: [nytco-acquisition-press, variety-acquisition-2022]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Ship a native iOS and Android app with push notifications.
      - Allow infinite play and offer hints or extra guesses as purchases.
      - Add accounts, leaderboards, friend graphs, and daily streak shields.
      - Run interstitial ads between rounds to fund the team.
    summary: A standard 2021 mobile word game built for time-on-task and ARPU.
  whatShipped:
    label: What shipped
    bullets:
      - A single static web page at powerlanguage.co.uk/wordle.
      - One five-letter puzzle, same for everyone, refreshed once a day.
      - No app, no account, no ads, no push notifications.
      - A share button that exports the result as coloured emoji squares with the letters hidden.
    summary: The whole product fits on one page and asks for nothing back.
lifecycle:
  - date: 2013
    label: First prototype
    description: Early version built and shelved.
    type: launch
  - date: 2021-10
    label: Public release
    description: Posted as a quiet weekend release.
    type: launch
  - date: 2021-11-01
    label: 90 daily players
    description: Family and friends only.
    type: milestone
  - date: 2022-01-02
    label: 300,000 daily players
    description: Emoji grid pushes the game across Twitter.
    type: milestone
  - date: 2022-01-31
    label: New York Times acquires Wordle
    description: Low-seven-figure deal, gameplay stays free.
    type: pivot
  - date: 2026
    label: Daily fixture at NYT Games
    description: Still one puzzle a day for everyone.
    type: today
takeaway:
  principle: When attention is the entire market, the strongest product move is to ask for less of it than anyone else dares.
  sourceIds: [time-wardle-interview-2022, nytco-acquisition-press]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric HackProduct autopsy illustration for Wordle. A single oversized cream calendar page sits in the centre of a warm cream `#faf6f0` background, with one five-by-six grid of square tiles printed on it. Two rows of tiles are filled in: forest green `#4a7c59` correct letters, soft amber `#c9ad68` near-misses, mist `#dfe6dc` blanks. A small charcoal `#1e211c` "today" pin sits in the top corner of the calendar page. Hatch stands at lower left at about 15 percent of canvas height, pointing at the single calendar page with one mitten hand. Keep Hatch's rounded forest green head frame, cream face and body, graduation cap, growth arrow, green H chest mark, bright eyes, and friendly coach expression intact. Leave clean negative space in the upper left for a title overlay. Aspect 2400x1350. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A single calendar page in the centre shows one Wordle grid with green and amber tiles, while Hatch stands at the lower left pointing at it.
    caption: One puzzle. Same word for everyone. Once a day.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose at the centre of the frame on a warm cream `#faf6f0` background, gesturing toward a small flat illustration of a Brooklyn apartment window with two stylised coffee mugs on a windowsill and a soft amber `#c9ad68` morning glow behind it. Hatch holds a forest green `#4a7c59` notepad with a small five-by-six tile sketch on it. Keep Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, green H chest mark, bright eyes, mitten hands, and friendly coach expression. No human figures in the window scene, only objects. Charcoal `#1e211c` linework, mist `#dfe6dc` shadows. Aspect 1600x1600. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch in narrator pose gestures at a small apartment window scene with two coffee mugs on a sill, holding a notepad sketch of a Wordle grid.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Step-by-step visualisation of how Wordle works on a warm cream `#faf6f0` background. Three labelled panels from left to right. Panel one: a single five-by-six tile grid, empty, with a small "one a day" sun glyph above it in soft amber `#c9ad68`. Panel two: the same grid after three guesses, with forest green `#4a7c59` correct tiles, soft amber near-miss tiles, and mist `#dfe6dc` blanks. Panel three: a small share card showing only the coloured emoji squares with letters hidden, no app icon, no notification badge. A faint charcoal `#1e211c` arrow runs across the bottom of the three panels. Hatch sits in the lower right at about 15 percent of canvas height in thinking pose, pointing at panel three. Keep Hatch's rounded green head, cream face and body, cap, growth arrow, green H chest mark, bright eyes, and friendly coach expression. Aspect 1800x1200. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Three panels show an empty Wordle grid, a played grid, and a spoiler-free share card, with Hatch in the lower right pointing at the share card.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      A clean evidence chart on a warm cream `#faf6f0` background. A single forest green `#4a7c59` line climbs sharply from left to right with three labelled dots: "Nov 1, 2021 — 90", "Jan 2, 2022 — 300,000", "Mid-Jan 2022 — 2,000,000". The horizontal axis uses small charcoal `#1e211c` tick marks. Below the chart, a single row of soft amber `#c9ad68` and mist `#dfe6dc` emoji-style squares forms a thin band representing share grids. Hatch sits at the far right at about 14 percent of canvas height in pointing pose, one mitten hand aimed at the rightmost dot. Keep Hatch's rounded green head, cream face and body, cap, growth arrow, green H chest mark, bright eyes, and friendly coach expression. No app screenshots, no logos, no decorative gradients. Aspect 1600x1000. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A line chart climbs from 90 in November 2021 to two million by mid-January 2022, with Hatch at the right pointing at the top of the curve.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose centred on a warm cream `#faf6f0` background, calm posture with both mitten hands open. Behind Hatch, a soft deep forest `#244232` panel holds a single line of cream text-shaped blocks (no actual letters) that suggest a short sentence. Around the panel, small icons in soft amber `#c9ad68` are crossed out with thin charcoal `#1e211c` strokes: a push notification bell, an infinity loop, a coin stack, a profile avatar. A small forest green `#4a7c59` checkmark sits next to a single sun glyph representing one puzzle per day. Keep Hatch's rounded green head, cream face and body, graduation cap, growth arrow, green H chest mark, bright eyes, and friendly coach expression. Aspect 1800x1200. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch stands in coaching pose with crossed-out icons for notifications, infinite play, coins, and accounts around it, while a single sun glyph for one puzzle a day is checked.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Compact thumbnail composition on a warm cream `#faf6f0` background. One bold five-by-six tile grid centred in the frame, with the top row in forest green `#4a7c59`, the second row in soft amber `#c9ad68`, the remaining rows in mist `#dfe6dc`. A small charcoal `#1e211c` sun glyph in the upper right corner suggests "one a day." A tiny Hatch mark in the lower left at about 10 percent of canvas height, just the head and cap visible, no body, in cream and forest green only, preserving the rounded green head frame, cap, growth arrow, and friendly eyes. No text inside the tiles. Keep the focal grid readable at 320 pixels wide. Aspect 1200x900. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A bold Wordle grid with one green row and one amber row sits centred, with a tiny Hatch head mark in the lower left and a small sun glyph in the upper right.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Social share cover for the Wordle autopsy on a warm cream `#faf6f0` background. A single five-by-six tile grid sits at left-of-centre, with two rows of forest green `#4a7c59` and soft amber `#c9ad68` tiles and four rows of mist `#dfe6dc` tiles. To the right, a small share card silhouette in deep forest `#244232` shows only blank coloured squares. Hatch stands at the lower left at about 13 percent of canvas height in narrator pose, gesturing at the grid. Keep Hatch's rounded green head, cream face and body, cap, growth arrow, green H chest mark, bright eyes, and friendly coach expression. Keep the centre 70 percent clear of edge-critical details so social previews crop cleanly. No headlines baked into the artwork. Aspect 2400x1260. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A Wordle grid sits left of centre with a blank share card silhouette to its right, and Hatch in narrator pose at the lower left, on a cream background.
    watermark: HackProduct
nextInQueue:
  slug: dropbox-referral
  companySlug: dropbox
  title: Dropbox Referral Program
---

<!-- beat: lede -->

Late in 2021, an unfamiliar five-row green and yellow grid appeared in a friend's tweet. A small mosaic of coloured squares, no letters inside them, captioned only with a number and a date. A day later the same grid showed up in three more friends' feeds. By the second week of January 2022 it was everywhere, posted from accounts that had never tweeted about word games before [buzzfeed-share-grid-2022]. The game behind the squares was called Wordle, it lived on a single static web page, and it ran exactly one puzzle a day for the entire planet [wikipedia-wordle].

The interesting move is not the puzzle. Five-letter guessing games are decades old, and Mastermind is older still [theygotacquired-wordle]. The interesting move is what Josh Wardle, the Brooklyn software engineer who built it for his partner during the pandemic, refused to add: no app, no account, no ads, no notifications, no second puzzle [time-wardle-interview-2022]. Every retention lever a 2021 mobile game designer knew how to pull, he chose not to pull.

What follows is the story of how a product that asked for almost nothing became, ten weeks after its 90th player joined, worth a low seven figures to The New York Times [nytco-acquisition-press]. When the whole category around a product is built to take more of your attention, what does it look like to ship one that takes less?

<!-- beat: glance -->
## At a glance

**1. A gift for one person**

A Brooklyn software engineer revives a 2013 prototype during the pandemic and builds a daily word puzzle for his partner, who curates the answer list down to words she would know. [theygotacquired-wordle]

**2. A genre crowded with noise**

The 2021 word-game playbook was infinite rounds, ads between turns, push notifications, login walls, and progression systems built to keep people inside an app. [time-wardle-interview-2022]

**3. The obvious version**

A native app, unlimited puzzles, leaderboards, social profiles, a coin economy, hint purchases, streak bonuses. Every retention lever a 2021 mobile game designer knew how to pull. [time-wardle-interview-2022]

**4. One puzzle, three minutes, then out**

One word per day. Same word for everyone. A static web page. No app, no account, no ads. Six guesses or the right answer, and the game is done until tomorrow. [time-wardle-interview-2022]

**5. 90 to two million in ten weeks**

Ninety players on November 1, 2021. Three hundred thousand by January 2. Two million a week later. Growth rode a spoiler-free emoji grid invented by a New Zealand player. [wikipedia-wordle] [buzzfeed-share-grid-2022]

**6. The constraint was the brand**

The New York Times paid a low seven figures for a game with no app, no monetisation, one daily round. They bought the discipline, not the code. [nytco-acquisition-press]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

The Brooklyn apartment is small and the morning ritual is fixed. Josh Wardle, a software engineer who built The Button and Place at Reddit, sits with his partner Palak Shah over coffee and works through the day's puzzles from The New York Times [time-wardle-interview-2022] [wikipedia-wordle]. Palak loves word puzzles in particular. Spelling Bee, the mini crossword, then the Sunday crossword on weekends. The pandemic has compressed their world to the size of these few daily rounds.

Wardle has an old toy on his hard drive. He sketched it in 2013, called it Mr. Bugs' Wordy Nugz, and shelved it [theygotacquired-wordle]. In early 2021 he pulls it back out and aims it at a single user. The pool of five-letter English words is around twelve thousand. Palak sits down with the full list and crosses out every word she would not recognise, leaving roughly ninety stored answer words that the game will cycle through in a fixed queue [theygotacquired-wordle]. The puzzle they end up playing together is short and silent. One word per day. Same word for both of them.

In November 2021, Wardle puts the game on a quiet web page at powerlanguage.co.uk/wordle and tells his family the URL. On November 1, ninety people open it [wikipedia-wordle]. Most are relatives. A few weeks later the game finds a small cluster of players in New Zealand, where the time-zone math makes the daily reset land at a sociable hour. A group of Kiwi puzzle fans starts gathering around the hashtag #DailyWordleClub, posting their scores to each other every morning [buzzfeed-share-grid-2022].

It is in that New Zealand group, not on Wardle's keyboard, that the share grid is invented. A player named Elizabeth S., posting as @irihapeta, starts typing out her results as a small block of green, yellow, and grey emoji squares so the others can see how she did without seeing which word she guessed [buzzfeed-share-grid-2022]. Other Kiwi players copy the format. Wardle, watching this from Brooklyn, has a decision to make.

<!-- beat: choice -->
## The obvious answer and what shipped instead

The obvious version was not stupid. A normal team in 2021 would have looked at ninety daily players, watched the small New Zealand cluster light up, and reached for the standard retention kit. Ship a native app so players can come back at the buzz of a notification. Offer a second puzzle a day, then a third, because more puzzles is more engagement, and more engagement is more sessions to monetise. Add a leaderboard so the New Zealand club can compete properly, then friend graphs and streak shields and coin-based hints because that is how 2021 word games kept their charts position [time-wardle-interview-2022]. Each of these moves was the obvious product-management call, the kind a careful advisor would have nodded at. Each of them would have killed the magic the New Zealand club had stumbled into.

| The tempting move | What shipped |
|---|---|
| A native iOS and Android app with push notifications. | A single static web page at powerlanguage.co.uk/wordle. |
| Infinite play, hints, or extra guesses sold as purchases. | One five-letter puzzle, same for everyone, once a day. |
| Accounts, leaderboards, friend graphs, daily streak shields. | No app, no account, no ads, no notifications. |
| Interstitial ads between rounds. | A share button that exports a spoiler-free emoji grid. |
| *A 2021 mobile word game tuned for time-on-task.* | *The whole product fits on one page and asks for nothing back.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The seam Wardle saw and refused to widen is small enough to miss. The constraint was the product. One puzzle a day means every player in the world is on the same puzzle that day, which means everyone can talk about it without spoiling it for anyone, as long as they share their results obliquely [time-wardle-interview-2022]. The single-puzzle limit and the social loop are not two features. They are one feature wearing two hats. Loosen the daily cap and the conversation falls apart, because now your friend is on puzzle 412 while you are on puzzle 408 and any score is a spoiler.

The user flow is short. A player opens the page. A five-by-six grid sits in the middle of the screen with an on-screen keyboard at the bottom. The player types a five-letter word and presses enter. Each letter turns one of three colours: forest green for a correct letter in the correct slot, amber for a correct letter in the wrong slot, grey for a letter not in the word at all [wikipedia-wordle]. The greyed letters fade on the on-screen keyboard, narrowing the search space. The player guesses again. Six guesses total, or until the word is solved. Then the game is over until tomorrow.

The killer feature is what happens at the end. Wardle adds a share button that copies a small block of coloured emoji squares to the clipboard, one row per guess, in exactly the same colours the tiles wore on screen [buzzfeed-share-grid-2022]. The letters are hidden. The structure of the player's reasoning is on full display: how many guesses it took, which row finally cracked it, whether they got lucky on the first try or stumbled to the last. The grid preserves zero answer information and broadcasts the entire experience.

The constraint Wardle chose to honour was scarcity. One puzzle a day, ever. No catch-up mode, no bonus round, no premium tier with three puzzles for paying subscribers. The constraints he chose to ignore were the standard retention levers of the era: no monetisation, no growth optimisation, no retention metrics, no push notifications [time-wardle-interview-2022].

Three second-order effects fell out of the design. The first was the social loop the share grid lit up: between January 1 and 13, 2022, about 1.2 million Wordle grids were tweeted [buzzfeed-share-grid-2022]. The second was the acquisition. The New York Times bought Wordle on January 31, 2022 for a low seven-figure price, slotting it next to the crossword and Spelling Bee, both of which run on the same daily-puzzle rhythm [nytco-acquisition-press] [variety-acquisition-2022]. The third was the clone explosion. Quordle, Octordle, Heardle, Worldle, and dozens of others arrived within weeks, and the Times later carved out a dedicated daily-puzzle category around the new fixture.

<!-- beat: evidence -->
## Evidence

The public record is unusually clean on the growth curve and the deal, and unusually thin on the internal design debates. Player counts are sourced from Wardle's own statements around the acquisition and corroborated independently by BuzzFeed News and TIME. The trajectory itself, from 90 players on November 1, 2021 to roughly 300,000 by January 2, 2022 and around two million a week later, is one of the most cleanly documented growth curves of the decade [wikipedia-wordle] [buzzfeed-share-grid-2022]. The acquisition is confirmed in The New York Times Company's own announcement and in matching trade coverage [nytco-acquisition-press] [variety-acquisition-2022].

What the record does not confirm is the part a curious reader would most want pinned down. The exact day in late 2021 that Wardle added the share button is not on the record; only the pattern it followed, the New Zealand emoji-tile convention from the @irihapeta thread, is documented. The acquisition price is reported only as "low seven figures." The exact size of the curated answer list at launch is widely repeated as around 2,500 words, but the launch-day count is not confirmed in primary sources; the household-curation step is what is confirmed, not the precise number it produced [theygotacquired-wordle]. The story is true. The decimal places are not.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Players on November 1, 2021 | 90 | Confirmed | [wikipedia-wordle] |
| Players by January 2, 2022 | ~300,000 | Confirmed | [wikipedia-wordle] |
| Players by mid-January 2022 | ~2,000,000 | Confirmed | [buzzfeed-share-grid-2022] |
| Acquisition price | Low seven figures (USD) | Confirmed | [nytco-acquisition-press] |
| Twitter shares, January 1 to 13, 2022 | ~1,200,000 | High | [buzzfeed-share-grid-2022] |
| Curated answer pool | ~2,500 of ~12,000 words | Medium | [theygotacquired-wordle] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "I'm aware of the things that, especially with games, you're meant to do with people's attention. Things like endless play, or sending them push notifications, or asking them for sign-up information. Philosophically, I enjoy doing the opposite of all those things."
>
> — Josh Wardle, creator of Wordle, TIME, January 2022

<!-- beat: aftermath -->
## Timeline

1. **2013**, Wardle builds an early prototype, then shelves it.
2. **2021-10**, Posted publicly to powerlanguage.co.uk as a quiet release.
3. **2021-11-01**, 90 daily players, family and friends.
4. **2022-01-02**, 300,000 daily players after the emoji grid spreads.
5. **2022-01-31**, The New York Times acquires Wordle for a low-seven-figure price.
6. **2026**, Still one puzzle a day, now hosted on NYT Games.

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **When attention is the entire market, the strongest product move is to ask for less of it than anyone else dares.**
>
> — HackProduct autopsy

The same move shows up in places the eye is now trained to spot it. BeReal opened a two-minute daily window in 2022 and the app collapsed back into a single notification: take your photo now, or do not take it today. The window was the product, and the always-on photo apps could not copy it without ceasing to be themselves. The first generation of Wordle clones learned the harder version. Every variant that offered unlimited puzzles watched its share rate collapse, because the grid only travelled when the puzzle was the same for everyone today, and only for today.

<!-- beat: references -->
## References

1. **Wordle**, Wikipedia · Tier B · accessed 2026-05-17. https://en.wikipedia.org/wiki/Wordle
   Supports: launch date, player count milestones, NYT acquisition date and price language, 2013 prototype, Wardle's prior Reddit work.
2. **Wordle Creator Josh Wardle Talks NYT Sale, Game's Success**, TIME · Tier B · accessed 2026-05-17. https://time.com/6143715/wordle-sale-josh-wardle-interview/
   Supports: Wardle's verbatim quotes on attention design, the one-puzzle-per-day choice, and his sense of relief after selling.
3. **The New York Times Company Acquires Wordle**, The New York Times Company · Tier A · accessed 2026-05-17. https://www.nytco.com/press/the-new-york-times-company-acquires-wordle/
   Supports: official acquisition announcement, low-seven-figure price, commitment that gameplay stays free at launch, Jonathan Knight as head of NYT Games.
4. **How Wordle Went Viral**, BuzzFeed News · Tier B · accessed 2026-05-17. https://www.buzzfeednews.com/article/stefficao/how-wordle-went-viral-strategy
   Supports: New Zealand origin of the emoji share grid, Elizabeth S. as the originator, growth trajectory, 1.2 million Twitter shares in early January 2022.
5. **Who created Wordle? The story of how this game sold to The New York Times for 7 figures**, They Got Acquired · Tier C · accessed 2026-05-17. https://theygotacquired.com/gaming/wordle-acquired-by-the-new-york-times/
   Supports: build for Palak Shah, the answer-list curation from roughly 12,000 to 2,500 words, the 2013 prototype name.
6. **New York Times Buys Wordle for a Price in the 'Low-Seven Figures'**, Variety · Tier B · accessed 2026-05-17. https://variety.com/2022/digital/news/new-york-times-wordle-sale-1235168003/
   Supports: acquisition price language and timing, free-gameplay commitment, Wardle's tweeted note that maintenance had become overwhelming.

<!-- beat: forward -->
## Next in queue

**Dropbox Referral Program**, How Drew Houston turned free cloud storage into a referral loop that drove 60 percent of all signups.

→ [/autopsies/dropbox/dropbox-referral](/autopsies/dropbox/dropbox-referral)
