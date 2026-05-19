---
slug: whatsapp-groups
companySlug: meta
companyName: Meta
title: WhatsApp Groups
dek: A 2011 group chat feature shipped on top of one-to-one messaging unlocked the social graph WhatsApp had been growing without knowing it.
queueRank: 5
tier: 1
estimatedReadTime: 11 min read
status: draft
researchGaps:
  - The exact launch date inside 2011 for the Groups feature is not stated in any sourced primary record. WhatsApp's own 2022 tweet confirms 2011 but not the month or day.
  - Specific build duration in days, sometimes anecdotally quoted as two, is not corroborated by a primary source.
  - First-person quotes from Jan Koum or Brian Acton specifically about the Groups decision are not in the public record.
sourceSummary: Sources support that WhatsApp introduced Group Chats in 2011, that the initial group size limit was up to 100 members and was raised over time to 256, then 512, and most recently 1,024, that in October 2011 WhatsApp passed one billion messages per day, and that the company was already a top-twenty app on the U.S. App Store by early 2011 with eight million dollars from Sequoia Capital in April 2011. Sources do not confirm the precise launch month, the build duration, or first-person founder quotes about the Groups decision.
sources:
  - id: whatsapp-x-2022-groupchats
    title: WhatsApp tweet introducing Group Chats in 2011
    publisher: WhatsApp on X
    url: https://x.com/WhatsApp/status/1522290925212426240
    tier: A
    accessedAt: 2026-05-17
    supports: Company confirmation that Group Chats were introduced in 2011.
  - id: wikipedia-whatsapp-groups
    title: WhatsApp
    publisher: Wikipedia
    url: https://en.wikipedia.org/wiki/WhatsApp
    tier: C
    accessedAt: 2026-05-17
    supports: Sequoia $8 million investment in April 2011, October 2011 one billion messages per day milestone, and early platform expansion across iPhone, BlackBerry, Symbian, and Android by August 2010.
  - id: zoko-whatsapp-history
    title: The History of WhatsApp Founders, Funders, and Timeline
    publisher: Zoko
    url: https://www.zoko.io/post/the-history-of-whatsapp
    tier: C
    accessedAt: 2026-05-17
    supports: Top twenty Apple App Store position by early 2011, growth narrative around the founders, and platform expansion.
  - id: clickup-whatsapp-group-size
    title: WhatsApp Max Group Size Manage Large Chats Efficiently
    publisher: ClickUp
    url: https://clickup.com/blog/whatsapp-max-group-size/
    tier: C
    accessedAt: 2026-05-17
    supports: Initial group size limit of 100, subsequent increases to 256, 512, and 1,024.
  - id: firstmonday-chatapps-publics
    title: Ten years of WhatsApp, the role of chat apps in the formation and mobilization of online publics
    publisher: First Monday
    url: https://firstmonday.org/ojs/index.php/fm/article/download/10412/8319
    tier: B
    accessedAt: 2026-05-17
    supports: Sociological framing of WhatsApp groups as a vehicle for collective identity formation and weak and strong tie networks.
metrics:
  - label: Group chats introduced
    value: 2011
    confidence: confirmed
    sourceIds: [whatsapp-x-2022-groupchats]
  - label: Initial group size limit
    value: 100 members
    confidence: high_confidence
    sourceIds: [clickup-whatsapp-group-size]
  - label: Messages per day at end of October 2011
    value: 1 billion
    confidence: confirmed
    sourceIds: [wikipedia-whatsapp-groups]
  - label: Sequoia investment in April 2011
    value: 8 million USD at roughly 250 million valuation
    confidence: confirmed
    sourceIds: [wikipedia-whatsapp-groups]
  - label: Current group size limit
    value: Up to 1,024 members
    confidence: confirmed
    sourceIds: [clickup-whatsapp-group-size]
glanceCards:
  - id: setup
    title: A one-to-one messenger with momentum
    body: By early 2011 WhatsApp was already a top twenty app in the U.S. App Store, present on iPhone, BlackBerry, Symbian, and Android, and growing through pure word of mouth. The product still only spoke one-to-one. [zoko-whatsapp-history, wikipedia-whatsapp-groups]
    sourceIds: [zoko-whatsapp-history, wikipedia-whatsapp-groups]
    confidence: confirmed
  - id: problem
    title: People were already simulating groups
    body: Users were sending the same message to many contacts one at a time. The chat list filled up with parallel threads that had to be kept in sync by hand. The product was being used in a shape it did not officially support. [firstmonday-chatapps-publics]
    sourceIds: [firstmonday-chatapps-publics]
    confidence: high_confidence
  - id: tempting-move
    title: A full social network move
    body: The obvious move was to build something heavier, a profile, a public feed, a friend graph, a discovery surface. Each addition would have moved WhatsApp closer to Facebook and away from the privacy-first one-to-one model that was already winning. [wikipedia-whatsapp-groups]
    sourceIds: [wikipedia-whatsapp-groups]
    confidence: medium_confidence
  - id: mechanism
    title: A thread that contained many phone numbers
    body: WhatsApp shipped Groups as one new object on top of the existing chat surface, a thread that contained more than two phone numbers. No profile, no public discovery, no membership rules beyond a single admin who could add and remove members. [whatsapp-x-2022-groupchats]
    sourceIds: [whatsapp-x-2022-groupchats]
    confidence: high_confidence
  - id: evidence
    title: A billion messages a day by October
    body: In October 2011, with the new groups primitive in place, WhatsApp crossed one billion messages per day, a milestone that pulled Sequoia in earlier the same year at a quarter-billion valuation. [wikipedia-whatsapp-groups]
    sourceIds: [wikipedia-whatsapp-groups]
    confidence: confirmed
  - id: takeaway
    title: A small object that compounded the existing surface
    body: Groups did not change the chat list, the message bubble, the contact picker, or the notification, it only added a thread shape that held more than two people. The thinness of the change is what let the addressable surface multiply. [clickup-whatsapp-group-size]
    sourceIds: [clickup-whatsapp-group-size]
    confidence: high_confidence
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Build a separate community product with profiles, feeds, and public discovery.
      - Add a friends graph layer with bi-directional follow and invitation flows.
      - Ship admin controls, roles, moderation queues, and pinned content on day one.
    summary: Treat groups as a small social network and build all the social network parts.
  whatShipped:
    label: What shipped
    bullets:
      - A new thread that simply held more than two phone numbers.
      - One admin who could add and remove participants.
      - Reuse of the existing chat list, message bubble, and notifications.
    summary: Add one object on top of the existing chat primitive, ship nothing else.
lifecycle:
  - date: 2010-08
    label: Android launch
    description: WhatsApp ships on Android, completing cross-platform coverage.
    type: milestone
  - date: 2011-04
    label: Sequoia invests
    description: 8 million USD round at a roughly 250 million valuation.
    type: milestone
  - date: 2011
    label: Group Chats ship
    description: New thread type holds more than two phone numbers, single admin.
    type: launch
  - date: 2011-10
    label: One billion messages a day
    description: WhatsApp crosses a billion messages per day with groups now live.
    type: milestone
  - date: 2018-05
    label: Group features expand
    description: Descriptions, mentions, the Catch Up button, and stronger admin controls.
    type: milestone
  - date: 2026
    label: Up to 1,024 members per group
    description: Group size limit raised from 100 to 256 to 512 to 1,024 over a decade.
    type: today
takeaway:
  principle: A new object that reuses every existing primitive can multiply addressable surface without adding a single new screen.
  sourceIds: [whatsapp-x-2022-groupchats, clickup-whatsapp-group-size]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct autopsy hero illustration for WhatsApp Groups. Canvas role hero at aspect 2400x1350. Show a single large forest green speech bubble at the center of the canvas containing six small circular shapes inside it, each circle a different shade between cream, mist, and soft amber to represent the members of a group thread. A single soft amber circle slightly larger than the others sits at the top of the cluster to suggest the admin. Connected to the large bubble by a thin forest green line is a small grey speech bubble in the lower left, mostly faded, labelled with two faint circles to represent the old one-to-one chat. The contrast between the one-to-one bubble and the group bubble is the focus. Hatch as a small narrator at the lower right, about 14 percent of canvas height, in narrator pose, with cap and growth arrow visible. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Cream background. Leave quiet space in the upper left for title overlay. No human faces, no fake WhatsApp UI, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A large green speech bubble holds six circles representing a group while a faded two-circle bubble sits in the corner.
    caption: One new thread shape that held more than two phone numbers.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct illustration of a 2011 chat list cluttered with parallel one-to-one threads. Canvas role hatch-narrator at aspect 1600x1600. Show a vertical strip of six identical small message tiles stacked on top of each other in mist with charcoal outlines, each tile containing the same tiny green dot in the same position to convey the same message being copy-pasted to many contacts. The stack is on a cream background, with a soft amber pressure ring around the stack. Hatch at center right, about 30 percent of canvas height, in narrator pose pointing at the duplicated stack, with cap and growth arrow visible. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no real WhatsApp UI, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A stack of six identical chat tiles shows the same message being copied to many contacts while Hatch points at the duplicate column.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct mechanism illustration of how a group thread is built on top of an existing chat. Canvas role failure-mechanism at aspect 1800x1200. Show a horizontal split. On the left a small mist speech bubble containing two tiny circles, labelled in small charcoal type as One to one. On the right a much larger forest green speech bubble of the same outer shape containing eight small circles inside it, labelled Group. A thick forest green arrow runs from the left bubble to the right bubble. Between them in the middle a single soft amber crown shape sits above one circle on the right to represent the admin. Cream background, deep forest linework. Hatch in thinking pose at the lower left, about 18 percent of canvas height, pointing at the arrow, with cap and growth arrow visible. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no fake WhatsApp UI. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A small one-to-one bubble on the left connects via an arrow to a large group bubble holding eight circles with a small admin crown above one.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct evidence card visualising the October 2011 one billion messages per day milestone. Canvas role evidence-card at aspect 1600x1000. Show a single large forest green numeral 1 with a small mist coloured B beside it, on a cream background, with a soft amber underline. Below the number, a thin charcoal label reading messages per day, October 2011. To the right of the figure, a small mist coloured bar chart of three ascending bars labelled 2010, early 2011, late 2011 to suggest the growth path. Hatch absent. Use one short label and one visible artifact shape only. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A large 1B figure sits next to a small ascending bar chart with the label messages per day, October 2011.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct lesson illustration. Canvas role lesson-frame at aspect 1800x1200. Show a single forest green tile at the lower left containing the words new object in small charcoal type, with three forest green arrows fanning out to three larger mist coloured rectangles labelled chat list, message bubble, notifications, each rectangle outlined in deep forest. A small soft amber pulse sits over each arrow tip to suggest reuse. Cream background. Hatch in coaching pose at the upper right, about 22 percent of canvas height, calm and explanatory, with cap and growth arrow visible. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no fake WhatsApp UI, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A small green new object tile sends three arrows out to existing surfaces labelled chat list, message bubble, and notifications while Hatch watches from the corner.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct thumbnail composition for WhatsApp Groups. Canvas role thumbnail at aspect 1200x900. Show a single large forest green speech bubble centred on the canvas holding five small cream circles inside it. A soft amber dot sits over the topmost circle to suggest the admin. A tiny Hatch mark, just the rounded green head silhouette with cap and growth arrow, sits in the bottom left at about 8 percent of canvas height. Make the decision readable at small size with one strong focal shape. Cream background. No human faces, no fake WhatsApp UI. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A large green speech bubble holds five small circles with a soft amber admin dot and a tiny Hatch silhouette in the corner.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct social cover for WhatsApp Groups. Canvas role social-cover at aspect 2400x1260. Show a horizontal arrangement, on the left a single small mist speech bubble holding two circles, in the centre a forest green speech bubble holding six circles, on the right an even larger forest green bubble holding twelve circles, the three bubbles connected by a thin forest green arrow that grows wider as it moves right to suggest the surface multiplying. Cream background with a faint soft amber diagonal band. A small Hatch in narrator pose at the lower right at about 12 percent of canvas height, with cap and growth arrow visible. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Keep the center 70 percent clear of edge-critical details. No human faces, no fake WhatsApp UI. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Three speech bubbles in a row grow from two circles to six circles to twelve circles with a small Hatch in the corner.
    watermark: HackProduct
nextInQueue:
  slug: instagram-filters
  companySlug: meta
  title: Instagram Filters
---

<!-- beat: lede -->

A cousin gets engaged in Bangalore, and within the hour someone has typed the sentence that now lives in every family on earth. Do we have a WhatsApp group for the wedding. Someone makes it. The hotel block is forwarded twice. The photos arrive late, blurry, at three in the morning. The same shape recurs at a college reunion in Ohio, at a six-person product team coordinating a launch from four time zones. The container for those conversations did not exist before 2011.

Group Chats arrived that year as a small new object placed on top of an app that, until then, had only ever known how to address one phone number at a time [whatsapp-x-2022-groupchats]. The move worth studying is what the team did not build alongside it. No profile, no friend graph, no discovery feed, no follow, no like. Just a thread that held more than two numbers and a single admin who could add and remove members.

What follows is how that single object was bolted onto the existing chat surface, why the heavier paths it could have taken would have killed the product, and what the public record can and cannot prove about its lift. The question worth carrying is narrow. When users are already simulating a missing object by hand, what is the smallest shape that lets them stop?

<!-- beat: glance -->
## At a glance

**1. A one-to-one messenger with momentum**

By early 2011 WhatsApp was already a top twenty app in the U.S. App Store, present on iPhone, BlackBerry, Symbian, and Android, and growing through pure word of mouth. The product still only spoke one-to-one. [zoko-whatsapp-history, wikipedia-whatsapp-groups]

**2. People were already simulating groups**

Users were sending the same message to many contacts one at a time. The chat list filled up with parallel threads that had to be kept in sync by hand. The product was being used in a shape it did not officially support. [firstmonday-chatapps-publics]

**3. A full social network move**

The obvious move was to build something heavier, a profile, a public feed, a friend graph, a discovery surface. Each addition would have moved WhatsApp closer to Facebook and away from the privacy-first one-to-one model that was already winning. [wikipedia-whatsapp-groups]

**4. A thread that contained many phone numbers**

WhatsApp shipped Groups as one new object on top of the existing chat surface, a thread that contained more than two phone numbers. No profile, no public discovery, no membership rules beyond a single admin who could add and remove members. [whatsapp-x-2022-groupchats]

**5. A billion messages a day by October**

In October 2011, with the new groups primitive in place, WhatsApp crossed one billion messages per day, a milestone that pulled Sequoia in earlier the same year at a quarter-billion valuation. [wikipedia-whatsapp-groups]

**6. A small object that compounded the existing surface**

Groups did not change the chat list, the message bubble, the contact picker, or the notification, it only added a thread shape that held more than two people. The thinness of the change is what let the addressable surface multiply. [clickup-whatsapp-group-size]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

It is early 2011 in Mountain View. WhatsApp is a small team, led by Jan Koum and Brian Acton, two former Yahoo engineers who have spent the previous two years refusing every category-conventional move. No advertising. No in-app purchases. No games. No marketing budget. The product does one thing, send a message from one phone number to another, and it does it across iPhone, BlackBerry, Symbian, and Android, the rare cross-platform stack of the era [zoko-whatsapp-history][wikipedia-whatsapp-groups]. In April, Sequoia Capital puts in eight million dollars at roughly a quarter-billion valuation, the first outside money the founders have accepted [wikipedia-whatsapp-groups].

Group messaging is not unknown in 2011, but nowhere has it become the default. BlackBerry Messenger has a group feature and a passionate following, but BBM lives behind a PIN system and only on BlackBerry hardware. Apple's iMessage will introduce group threads later in 2011, only between iPhone users on iOS 5. SMS group messaging technically exists, but every carrier handles it differently, and a message sent to ten contacts on AT&T arrives as ten separate replies that do not thread together. The container for a shared conversation, in 2011, is something users are aware they are missing.

The pattern that keeps showing up in the WhatsApp logs is parallel threads. The same person is composing the same sentence and sending it to twenty different contacts in succession, then trying to remember which reply belongs to which thread the next day. It is not a feature gap. It is a missing object. The product has only ever known how to address one phone number at a time, and people have been simulating groups by hand on a chat list never built for it. Koum's stance, now folklore, is taped to a wall: no ads, no games, no gimmicks. The team is standing at a fork. Either add the object the users are already simulating, or hold the line on one-to-one and trust the workaround keeps scaling.

<!-- beat: choice -->
## The obvious answer and what shipped instead

The obvious answer was heavier than what shipped, and each heavier path had a logic behind it. A broadcast list was the most disciplined move, a way for one sender to push the same message to many recipients without forcing a shared thread, preserving the one-to-one purity of the product while solving the duplicate-copy-paste pain. A full Chat Room model was the maximalist move, the BlackBerry Enterprise route, with named groups, rich admin roles, moderation queues, pinned messages, and a settings page deep enough to justify its own help article. The third option was to ship nothing at all and stay focused on what was already winning, on the bet that a five-person team did not have the headcount to test a new social object without breaking the surface that was already growing on its own. Each was a defensible call by a careful team. The team chose none of them.

| The tempting move | What shipped |
|---|---|
| Build a separate community product with profiles, feeds, and public discovery | A new thread that simply held more than two phone numbers |
| Add a friends graph layer with bi-directional follow and invitation flows | One admin who could add and remove participants |
| Ship admin controls, roles, moderation queues, and pinned content on day one | Reuse of the existing chat list, message bubble, and notifications |
| *Treat groups as a small social network and build all the social network parts.* | *Add one object on top of the existing chat primitive, ship nothing else.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The seam was already in the protocol. WhatsApp's messaging layer, built on the XMPP standard and modified for mobile, had always supported addressing a single payload to a list of recipient identifiers at the transport level. A one-to-one thread was, on the wire, a multi-recipient message of size one. The product surface hid that. The team chose to expose it.

Building Groups on top of that seam meant adding a shared thread layer, not a new system. An admin opened the contact picker, the same picker used for starting any chat, and selected more than one contact. The thread was created. Members were notified on the same notification stack, with the same sound. Replies fanned out to the group identifier on the server side, then back down to every member's device, where they appeared in a single row in the existing chat list, sorted by recent activity like every other thread. There was no group home page, no group profile. The admin held the right to add and remove members, and that was the entire permission model [whatsapp-x-2022-groupchats][wikipedia-whatsapp-groups].

The constraint the team chose to honour was zero ceremony. No moderation roles. No approval to join. No invitation accept-or-decline screen. No public name search. A group was a private container for a list of numbers that could talk to each other, and the act of creating one was indistinguishable in friction from starting a fresh one-to-one chat. The initial cap was 100 members [clickup-whatsapp-group-size], small enough that an admin could plausibly know everyone on the list, large enough to hold an extended family.

The constraint the team chose to ignore was governance. There was no way to require approval before joining, so anyone with your number could add you to anything. The forwarding mechanism, which let any member forward any message from any group to any other group in two taps, treated a private container as a public broadcast surface the moment a member decided it should be. Within a few years, WhatsApp groups had become the dominant distribution channel for misinformation in India and Brazil, with the 2018 and 2019 Indian election cycles producing enough viral chain forwards that WhatsApp eventually added a five-chat forwarding limit, then a one-chat limit on already-forwarded messages. The read-receipt-in-groups feature became its own small social politics, the difference between blue ticks visible and blue ticks hidden becoming a category of family argument.

The second-order effect the team did anticipate was social-graph distribution at marriage-party scale. The one they did not is that the same primitive that lets a family coordinate a wedding can carry a conspiracy theory the same distance, in the same envelope, with the same notification ping.

<!-- beat: evidence -->
## Evidence

The public record proves the 2011 introduction of Group Chats, the April 2011 Sequoia round, the October 2011 one-billion-messages-per-day milestone, the early 100-member limit, and the later expansion to 256, 512, and 1,024 [whatsapp-x-2022-groupchats][wikipedia-whatsapp-groups][clickup-whatsapp-group-size]. It does not pin the exact launch month inside 2011, does not corroborate the often-quoted two-day build duration, and does not surface a first-person quote from Koum or Acton about the Groups decision.

The causal share of Groups in the surge to a billion messages a day is confounded with several forces moving in the same direction. Android shipped at scale in 2010 and 2011 across emerging markets where SMS was metered and expensive, making a data-plan messenger structurally attractive [wikipedia-whatsapp-groups]. WhatsApp's prior one-to-one dominance meant the contact graph was already in place before Groups arrived, so the new object did not have to bootstrap an audience, only give an existing one a new container. The 2014 Facebook acquisition, three years later, supplied the distribution muscle that turned a global product into a default utility. Pulling Groups out of that stack as a single isolated cause is not something the record supports. The defensible claim is narrower. The shape of the new object, a thread that reused every existing primitive without adding a new screen, was the rare addition that compounded the existing surface instead of competing with it.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Group chats introduced | 2011 | Confirmed | [whatsapp-x-2022-groupchats] |
| Initial group size limit | 100 members | High | [clickup-whatsapp-group-size] |
| Messages per day at end of October 2011 | 1 billion | Confirmed | [wikipedia-whatsapp-groups] |
| Current group size limit | Up to 1,024 members | Confirmed | [clickup-whatsapp-group-size] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: aftermath -->
## Timeline

1. **2010-08**. WhatsApp ships on Android and completes cross-platform coverage.
2. **2011-04**. Sequoia Capital invests 8 million USD at roughly a 250 million valuation.
3. **2011**. Group Chats ship, one thread holding more than two phone numbers and a single admin.
4. **2011-10**. WhatsApp crosses one billion messages per day with groups now live.
5. **2018-05**. Group features expand with descriptions, mentions, Catch Up, and stronger admin controls.
6. **2026**. Group size limit reaches up to 1,024 members after a decade of incremental raises.

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **A new object that reuses every existing primitive can multiply addressable surface without adding a single new screen.**
>
> HackProduct autopsy

The same shape shows up wherever a heavyweight container has been ambushed by a lighter one. Slack channels ate Skype rooms by treating a chat as a workspace primitive rather than a meeting artifact, so creating one took a single command and reusing the existing message surface was the entire feature. Discord servers ate TeamSpeak by collapsing voice rooms, text channels, and a roster into one lightweight container with no setup required. The heavier alternative shipped more features and lost. The minimal-group primitive wins because the cost of the hundred-and-first group is the same as the cost of the first.

<!-- beat: references -->
## References

1. **WhatsApp tweet introducing Group Chats in 2011**. WhatsApp on X · Tier A · accessed 2026-05-17. https://x.com/WhatsApp/status/1522290925212426240
   Supports: Company confirmation that Group Chats were introduced in 2011.
2. **WhatsApp**. Wikipedia · Tier C · accessed 2026-05-17. https://en.wikipedia.org/wiki/WhatsApp
   Supports: Sequoia April 2011 investment, October 2011 one billion messages per day milestone, early platform expansion.
3. **The History of WhatsApp Founders, Funders, and Timeline**. Zoko · Tier C · accessed 2026-05-17. https://www.zoko.io/post/the-history-of-whatsapp
   Supports: Top twenty Apple App Store position by early 2011 and platform expansion.
4. **WhatsApp Max Group Size Manage Large Chats Efficiently**. ClickUp · Tier C · accessed 2026-05-17. https://clickup.com/blog/whatsapp-max-group-size/
   Supports: Initial 100-member group cap and the subsequent 256, 512, and 1,024 raises.
5. **Ten years of WhatsApp, the role of chat apps in the formation and mobilization of online publics**. First Monday · Tier B · accessed 2026-05-17. https://firstmonday.org/ojs/index.php/fm/article/download/10412/8319
   Supports: Sociological framing of WhatsApp groups as a vehicle for collective identity formation.

<!-- beat: forward -->
## Next in queue

**Instagram Filters**. A weekend hack out of a failing check-in app, eight weeks of cutting features, and one photo of a dog at a taco stand.

→ [/autopsies/meta/instagram-filters](/autopsies/meta/instagram-filters)
