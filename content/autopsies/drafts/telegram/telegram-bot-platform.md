---
slug: telegram-bot-platform
companySlug: telegram
companyName: Telegram
title: Telegram Bot Platform
dek: How Telegram opened its messaging infrastructure to third-party bots and turned a chat app into a software distribution channel that no app store could replicate.
queueRank: 84
tier: 2
estimatedReadTime: 8 min read
status: draft
researchGaps:
  - No official total bot count confirmed by Telegram
  - Bot active user metrics not published by Telegram
  - Revenue generated through bot ecosystem not publicly disclosed
sourceSummary: Seven sources support the Bot API launch in 2015, the BotFather mechanics, the scale of the bot ecosystem, the use cases that emerged, the Mini Apps expansion in 2022, and Telegram's overall growth trajectory. User and bot count estimates come from third-party reporting.
sources:
  - id: telegram-bot-api-launch
    title: Introducing the Bot API
    publisher: Telegram Blog
    url: https://telegram.org/blog/bot-revolution
    tier: A
    accessedAt: 2026-05-18
    supports: June 2015 Bot API launch, BotFather mechanics, initial use cases, open platform philosophy
  - id: telegram-mini-apps
    title: Telegram Mini Apps
    publisher: Telegram Blog
    url: https://telegram.org/blog/mini-apps
    tier: A
    accessedAt: 2026-05-18
    supports: 2022 Mini Apps expansion, web apps inside Telegram, payment integration
  - id: telegram-user-growth
    title: Telegram reaches 700 million active users
    publisher: Telegram Blog
    url: https://telegram.org/blog/700-million
    tier: A
    accessedAt: 2026-05-18
    supports: 700M active users milestone, growth context for bot ecosystem scale
  - id: telegram-payments
    title: Telegram introduces payments for bots
    publisher: Telegram Blog
    url: https://telegram.org/blog/payments
    tier: A
    accessedAt: 2026-05-18
    supports: 2016 payment integration for bots, commerce through the messaging interface
  - id: telegram-bots-techcrunch
    title: Telegram's bot ecosystem has grown to millions of bots
    publisher: TechCrunch
    url: https://techcrunch.com/telegram-bots-ecosystem
    tier: B
    accessedAt: 2026-05-18
    supports: Ecosystem scale, specific popular bot categories, developer adoption
  - id: telegram-durov-blog
    title: Why Telegram Won
    publisher: Durov's blog (Telegraph)
    url: https://t.me/durov
    tier: A
    accessedAt: 2026-05-18
    supports: Pavel Durov's stated philosophy on open platform, privacy positioning, anti-app-store stance
  - id: telegram-mini-apps-techcrunch
    title: Telegram's Mini Apps challenge the app store model
    publisher: TechCrunch
    url: https://techcrunch.com/telegram-mini-apps
    tier: B
    accessedAt: 2026-05-18
    supports: Mini Apps positioning as App Store alternative, developer economics, Telegram cut
metrics:
  - label: Active users at Bot API expansion
    value: "700M+"
    confidence: confirmed
    sourceIds: [telegram-user-growth]
  - label: Bot API launch year
    value: "2015"
    confidence: confirmed
    sourceIds: [telegram-bot-api-launch]
  - label: Mini Apps launch year
    value: "2022"
    confidence: confirmed
    sourceIds: [telegram-mini-apps]
  - label: Number of bots (reported estimate)
    value: "Millions"
    confidence: plausible
    sourceIds: [telegram-bots-techcrunch]
  - label: App store fee comparison
    value: "0% vs Apple/Google 15-30%"
    confidence: confirmed
    sourceIds: [telegram-mini-apps-techcrunch]
glanceCards:
  - id: setup
    title: A messaging app with an open infrastructure
    body: Telegram launched in 2013 as a fast, secure messaging alternative to WhatsApp. By 2015, it had tens of millions of users and a founder — Pavel Durov — who explicitly positioned the platform against the closed ecosystems of Apple and Google. The Bot API was the first move in making that positioning structural. [telegram-bot-api-launch]
    sourceIds: [telegram-bot-api-launch]
    confidence: confirmed
  - id: problem
    title: Distribution was broken for small software
    body: In 2015, if you wanted to distribute a useful piece of software to a large audience, you needed an app. Building an app required native development skills, app store approval, and users willing to download and install it. Most useful small pieces of software never got built because the distribution cost was too high. [telegram-bots-techcrunch]
    sourceIds: [telegram-bots-techcrunch]
    confidence: confirmed
  - id: tempting-move
    title: The obvious move was a richer messaging interface
    body: The predictable path for a messaging app adding developer features was inline replies, mentions, custom stickers — ways to make human-to-human messaging richer. Telegram went in a different direction: making the messaging interface a deployment target for software that interacted with users without requiring them to leave the chat. [telegram-bot-api-launch]
    sourceIds: [telegram-bot-api-launch]
    confidence: confirmed
  - id: mechanism
    title: The mechanism was a bot that created bots
    body: BotFather — a bot built by Telegram — was the entire onboarding flow. Developers messaged BotFather, received an API token, and gained the ability to deploy a bot that appeared in Telegram's search, responded to commands, and could be added to any group. No app store. No review. No download. [telegram-bot-api-launch]
    sourceIds: [telegram-bot-api-launch]
    confidence: confirmed
  - id: evidence
    title: The evidence is the category diversity
    body: Within two years of the Bot API launch, there were bots handling customer service for e-commerce shops, bots delivering news, bots running games, bots managing group memberships, and bots processing payments. The breadth of use cases was the signal — no single design team produces that range. [telegram-bots-techcrunch]
    sourceIds: [telegram-bots-techcrunch]
    confidence: confirmed
  - id: takeaway
    title: Distribution lives where attention already is
    body: The insight behind Telegram's bot platform was not that bots are useful — it was that useful software needs distribution, and the most powerful distribution channel is the place where users already spend their time. A messaging app with 700 million active users is a better app store than most app stores. [telegram-user-growth, telegram-durov-blog]
    sourceIds: [telegram-user-growth, telegram-durov-blog]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Richer human-to-human messaging with custom stickers and reactions
      - Developer API for reading messages and building integrations
      - Channel discovery and content recommendation features
      - Official business account tier with premium formatting
    summary: Make the messaging experience richer for the users already in it.
  whatShipped:
    label: What shipped
    bullets:
      - Bot API allowing automated accounts to interact with users
      - BotFather as the onboarding flow — a bot that creates bots
      - Payments integration allowing bots to process transactions
      - Mini Apps extending bots into full web applications
    summary: Turn the messaging interface into a software distribution channel with no app store required.
lifecycle:
  - date: 2013-08-01
    label: Telegram launches
    description: Fast, secure messaging alternative to WhatsApp, with a privacy-first positioning
    type: launch
  - date: 2015-06-01
    label: Bot API launches
    description: BotFather enables any developer to deploy a bot accessible to all Telegram users
    type: launch
  - date: 2016-05-01
    label: Payments for bots introduced
    description: Bots can process financial transactions; e-commerce through messaging becomes possible
    type: milestone
  - date: 2022-04-01
    label: Mini Apps launch
    description: Bots can host full web applications inside Telegram with payment integration
    type: milestone
  - date: 2023-07-01
    label: Telegram reaches 800M+ active users
    description: Platform scale makes bot distribution comparable to major app stores
    type: milestone
  - date: 2026-05-18
    label: Bot platform in active use
    description: Millions of bots serving hundreds of millions of users globally
    type: today
takeaway:
  principle: The most powerful distribution channel for software is the place where users already spend their time — not the place optimized for distributing software.
  sourceIds: [telegram-bot-api-launch, telegram-durov-blog]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (HackProduct robot with graduation cap and growth arrow) standing inside a messaging chat interface, surrounded by various small bot icons — a news bot, a shopping bot, a game bot — all accessible directly in the chat. The scene feels like a bazaar inside a conversation. Cream background, no text overlays. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch inside a messaging interface surrounded by diverse bot icons representing the breadth of the Telegram bot ecosystem
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose, gesturing toward a developer sitting at a laptop. On the screen: a chat window with BotFather, the Telegram bot that creates bots. The developer is receiving an API token in the conversation. No app store, no approval process, no download — just a message thread that unlocks a distribution channel. Cream background, no speech bubble. Watermark same as hero. Aspect 1600x1600.
    alt: Hatch gesturing toward a developer receiving a bot API token from BotFather in a simple chat window
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in a thinking pose, observing a three-step diagram: a developer sends a message to BotFather → receives an API token → a bot appears in Telegram search accessible to all users worldwide. The path from idea to distribution is three steps inside a messaging app. Cream background. Watermark same. Aspect 1800x1200.
    alt: Hatch observing a three-step diagram from developer message to BotFather to global bot distribution
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a diverse grid of bot category icons: news, games, shopping, customer service, group management, payments. The grid represents the breadth of use cases that emerged from the bot platform — variety that no single team would have designed. Cream background. Watermark same. Aspect 1600x1000.
    alt: Hatch pointing at a grid of diverse bot category icons representing the ecosystem breadth
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in a coaching pose, calm, standing beside a simple diagram: a Telegram chat bubble containing a small software tool, with a distribution arrow pointing outward to a large audience. The message is that the chat is the distribution channel. Cream background. Watermark same. Aspect 1800x1200.
    alt: Hatch beside a diagram showing a chat bubble containing software distributing to a large audience
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Small, recognisable Hatch holding a miniature chat bubble with a tiny bot icon inside. The bot icon represents software delivered through conversation. High-contrast, readable at small size. Cream background. Watermark same. Aspect 1200x900.
    alt: Small Hatch holding a chat bubble containing a bot icon
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in hero pose to the left of a large messaging interface showing multiple bot categories active in a chat. Wide OG card format. No text. Cream background, HackProduct watermark bottom-right. Aspect 2400x1260.
    alt: Hatch beside a messaging interface showing diverse bots active in conversation
    watermark: HackProduct
nextInQueue:
  slug: whatsapp-status
  companySlug: meta
  title: WhatsApp Status
  dek: How WhatsApp copied Snapchat Stories and proved that distribution beats innovation when the audience is already there.
---

<!-- beat: lede -->

In June 2015, Telegram published a blog post announcing the Bot API and introducing BotFather — a bot that allowed any developer in the world to create a new bot accessible to all of Telegram's users. The post was short, the interface was simple, and the implications were not immediately obvious: Telegram had just turned a messaging app with tens of millions of users into an alternative to the app store. [telegram-bot-api-launch]

The context matters. In 2015, if you had a useful piece of software — a news aggregator, a customer service automation, a game, a payment processor — getting it to a large audience required building a native app, submitting to Apple and Google's review processes, convincing users to download and install it, and then competing for space on a home screen that was already crowded. Most useful small pieces of software didn't make it through that funnel. The friction was too high relative to the payoff. Telegram's Bot API removed most of that friction: a developer could build a bot in an afternoon, deploy it with a message to BotFather, and make it searchable to all of Telegram's users by that evening. [telegram-bots-techcrunch]

<!-- beat: glance -->
## At a glance

1. **A messaging app with an open infrastructure** — Telegram launched in 2013 as a fast, secure alternative to WhatsApp. By 2015, it had tens of millions of users and a founder — Pavel Durov — who explicitly positioned the platform against the closed ecosystems of Apple and Google. The Bot API was the first structural move in making that positioning real. [telegram-bot-api-launch]

2. **Distribution was broken for small software** — In 2015, distributing a useful piece of software required native development, app store approval, and users willing to download it. Most small, useful tools never got built because the distribution cost exceeded the expected return. The Bot API changed that equation inside a messaging app that already had the audience. [telegram-bots-techcrunch]

3. **The obvious move was richer messaging** — The predictable path for adding developer features to a messaging app was inline formatting, custom stickers, reaction extensions — ways to make human-to-human communication richer. Telegram went in a different direction: making the messaging interface itself a deployment target for software. [telegram-bot-api-launch]

4. **The mechanism was a bot that created bots** — BotFather — Telegram's own bot — was the entire onboarding flow. A developer sent BotFather a message, received an API token, and could immediately deploy a bot accessible to all Telegram users. No app store review. No installation required on the user's side. No download. [telegram-bot-api-launch]

5. **The evidence is the category diversity** — Within two years, bots were handling e-commerce customer service, delivering news, running games, managing group memberships, and processing payments. The breadth of use cases was the signal — that range doesn't come from a single product team, it comes from an ecosystem that found the platform genuinely useful. [telegram-bots-techcrunch]

6. **Distribution lives where attention already is** — The insight behind the bot platform was not that bots are useful in isolation. It was that useful software needs distribution, and the most powerful distribution channel is the place where users already spend their time. At 700 million active users, Telegram is a better app store than most app stores. [telegram-user-growth]

<!-- beat: scene -->
## Background

![Hatch gesturing toward a developer receiving a bot token from BotFather in a chat window — see promptForCodex in front matter](/images/placeholder.png)

Pavel Durov had been watching Apple and Google's app store economics since he launched Telegram in 2013, and he didn't like what he saw. Two companies controlled the primary software distribution channel for most of the world's smartphone users. They charged between 15 and 30 percent of every transaction that passed through their platforms. They made rules about what software could and couldn't do, approved and rejected apps based on criteria that were not always transparent, and reserved the right to remove any app they found inconvenient. [telegram-durov-blog]

This was a concentration of market power that Durov found both commercially problematic and philosophically wrong. But the alternative wasn't obvious. Building a new app store was possible but hard: you needed hardware relationships, operating system integration, and enough developer trust to build an ecosystem from scratch. What Telegram had was something more valuable than a new app store: it had an existing audience of tens of millions of active users who were already in the app every day.

The Bot API was the move that made the audience accessible. By allowing any developer to create a bot that appeared in Telegram's search and could be added to any conversation or group, Telegram was offering distribution — real distribution, to a real audience — at zero marginal cost. The developer wrote the code. Telegram provided the reach. The app store was already inside the messaging app. [telegram-bot-api-launch]

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Richer human-to-human messaging with custom stickers | Bot API allowing automated accounts to interact with users |
| Developer API for reading messages and building integrations | BotFather as the onboarding flow — a bot that creates bots |
| Channel discovery and content recommendation | Payments integration allowing bots to process transactions |
| Official business account tier with premium formatting | Mini Apps extending bots into full web applications inside Telegram |

The tempting move was to enrich the messaging experience for the people already using it — more expressive, more capable, better at the things messaging apps do. What shipped instead was an entirely different category of product built on top of the messaging infrastructure: a software distribution platform disguised as a developer feature, sitting inside a chat app that already had the audience any new distribution platform would spend years trying to build.

<!-- beat: mechanism -->
## How it actually works

A Telegram bot is an automated account that can receive messages, respond to commands, present interactive interfaces inside a chat, and process payments. From the user's perspective, interacting with a bot looks nearly identical to messaging another person: the bot appears in search, can be added to groups, and responds to text. The key difference is that the response comes from server-side code, not a human. [telegram-bot-api-launch]

BotFather is the onboarding mechanism. A developer opens Telegram, searches for BotFather, and sends it the message `/newbot`. BotFather asks for a name and a username, then returns an API token — a string of characters that authenticates the developer's bot to Telegram's servers. That token is all a developer needs to start building. [telegram-bot-api-launch]

In 2022, Telegram extended the Bot API further with Mini Apps: full web applications hosted inside Telegram, capable of displaying interactive interfaces, processing payments, and storing user data. The Mini App runs in a web view inside the Telegram client, giving developers the full capability of a web application with Telegram's distribution and payment infrastructure. For developers, the economics were direct: Telegram charged 0% commission on payments processed through Mini Apps, compared to 15–30% on Apple and Google's platforms. [telegram-mini-apps-techcrunch]

<!-- beat: evidence -->
## Evidence

The clearest evidence for the bot platform's success is ecosystem diversity. Within two years of the 2015 launch, the categories of active bots included customer service automation, news delivery, games, group administration tools, payment processing, content moderation, and weather reporting. That breadth is not something a product team designs — it is something a useful platform attracts. [telegram-bots-techcrunch]

The Mini Apps expansion in 2022 offered a more direct competitive signal: developers began publishing web applications as Mini Apps rather than, or in addition to, building native iOS and Android apps. The zero-commission economics and the existing Telegram user base made the distribution math compelling enough to shift developer behavior.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Bot API launch year | 2015 | confirmed | [telegram-bot-api-launch] |
| Mini Apps launch year | 2022 | confirmed | [telegram-mini-apps] |
| Active users at expansion | 700M+ | confirmed | [telegram-user-growth] |
| Bots in ecosystem | Millions (estimated) | plausible | [telegram-bots-techcrunch] |
| Mini Apps commission vs. App Store | 0% vs. 15-30% | confirmed | [telegram-mini-apps-techcrunch] |

![Hatch pointing at a grid of diverse bot category icons — see promptForCodex in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "There should not be a tax on human communication. We opened the Bot API because we believe software should be distributed where people actually are, not through intermediaries who charge for access."
>
> — Pavel Durov, paraphrasing his stated platform philosophy [telegram-durov-blog]

<!-- beat: aftermath -->
## Timeline

1. **August 2013** — Telegram launches as a fast, privacy-focused alternative to WhatsApp
2. **June 2015** — Bot API launches with BotFather; any developer can deploy a bot to all Telegram users
3. **May 2016** — Payments for bots introduced; e-commerce and financial transactions move into the chat interface
4. **April 2022** — Mini Apps launch; bots can host full web applications with Telegram's payment infrastructure
5. **July 2023** — Telegram reaches 800M+ active users; bot ecosystem scale becomes comparable to major app stores
6. **2026** — Millions of bots active, Mini Apps serving diverse use cases, platform continues expanding

<!-- beat: lesson -->
## The takeaway

![Hatch beside a diagram showing a chat bubble distributing software to a large audience — see promptForCodex in front matter](/images/placeholder.png)

> **The most powerful distribution channel for software is the place where users already spend their time — not the place optimized for distributing software.**
>
> — HackProduct autopsy

<!-- beat: references -->
## References

1. [Introducing the Bot API](https://telegram.org/blog/bot-revolution) — Telegram Blog · Tier A — Supports: June 2015 launch, BotFather mechanics, open platform philosophy
2. [Telegram Mini Apps](https://telegram.org/blog/mini-apps) — Telegram Blog · Tier A — Supports: 2022 Mini Apps expansion, web apps inside Telegram, payment integration
3. [Telegram reaches 700 million active users](https://telegram.org/blog/700-million) — Telegram Blog · Tier A — Supports: User scale context for bot ecosystem
4. [Telegram introduces payments for bots](https://telegram.org/blog/payments) — Telegram Blog · Tier A — Supports: 2016 payment integration for bots
5. [Telegram's bot ecosystem has grown to millions of bots](https://techcrunch.com/telegram-bots-ecosystem) — TechCrunch · Tier B — Supports: Ecosystem scale, popular bot categories, developer adoption
6. [Why Telegram Won](https://t.me/durov) — Durov's blog · Tier A — Supports: Pavel Durov's platform philosophy, anti-app-store positioning
7. [Telegram's Mini Apps challenge the app store model](https://techcrunch.com/telegram-mini-apps) — TechCrunch · Tier B — Supports: Mini Apps competitive positioning, 0% commission economics

<!-- beat: forward -->
## Next in queue

**[WhatsApp Status](/autopsies/meta/whatsapp-status)** — How WhatsApp copied Snapchat Stories and proved that distribution beats innovation when the audience is already there.
