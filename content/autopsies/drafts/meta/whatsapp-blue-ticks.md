---
slug: whatsapp-blue-ticks
companySlug: meta
companyName: Meta
title: WhatsApp Blue Ticks
dek: A tick that turned blue when your message was read, shipped in November 2014, made the entire chat feed a small instrument of social accountability.
queueRank: 4
tier: 1
estimatedReadTime: 9 min read
status: draft
researchGaps:
  - The exact day in November 2014 the feature first appeared in stable Android and iOS releases is reported as around November 5 but not confirmed by a primary WhatsApp announcement.
  - No first-person quote from Jan Koum or Brian Acton justifying the design has been sourced.
  - User counts attributed to the days right after launch are not available in the public record.
  - The causal effect of read receipts on response times and message volume is not isolated in the public record.
sourceSummary: Sources support the November 2014 launch window, the three states of one grey tick sent, two grey ticks delivered, two blue ticks read, the public backlash that followed, and the version 2.11.44 beta that introduced a privacy toggle to disable read receipts while also losing the ability to see other people's blue ticks. The Wikipedia entry on WhatsApp anchors the November 2014 launch month. Group chats remain a special case where the toggle does not apply. Sources do not provide a first-person Koum quote, day-one engagement deltas, or any causal measure of how read receipts changed response rates.
sources:
  - id: wikipedia-whatsapp
    title: WhatsApp
    publisher: Wikipedia
    url: https://en.wikipedia.org/wiki/WhatsApp
    tier: C
    accessedAt: 2026-05-17
    supports: November 2014 introduction of read receipts and the update within a week that allowed disabling them.
  - id: ibtimes-blue-ticks-2014
    title: WhatsApp Launches Read Receipts Feature To Disable Infamous Double Blue Ticks
    publisher: IBTimes Australia
    url: https://www.ibtimes.com.au/whatsapp-launches-read-receipts-feature-disable-infamous-double-blue-ticks-1389191
    tier: B
    accessedAt: 2026-05-17
    supports: Backlash to read receipts and the WhatsApp 2.11.44 beta that introduced the privacy toggle.
  - id: panda-checkmarks-explainer
    title: Understanding WhatsApp Check Marks One or Two, Gray or Blue
    publisher: Panda Security
    url: https://www.pandasecurity.com/en/mediacenter/whatsapp-check-marks/
    tier: C
    accessedAt: 2026-05-17
    supports: The three states of one grey tick sent, two grey ticks delivered, two blue ticks read, and that group chats only show blue ticks once every participant has read.
  - id: rasayel-read-receipts
    title: WhatsApp Read Receipts Explained
    publisher: Rasayel
    url: https://learn.rasayel.io/en/blog/whatsapp-read-receipts/
    tier: C
    accessedAt: 2026-05-17
    supports: Behaviour of the privacy toggle and that turning it off also blocks the user from seeing others' read receipts.
  - id: whatsapp-faq-read-receipts
    title: How to check read receipts
    publisher: WhatsApp Help Center
    url: https://faq.whatsapp.com/665923838265756/?cms_platform=web
    tier: A
    accessedAt: 2026-05-17
    supports: Current company description of the read receipt states and the privacy setting.
metrics:
  - label: Read receipts launch month
    value: November 2014
    confidence: confirmed
    sourceIds: [wikipedia-whatsapp, ibtimes-blue-ticks-2014]
  - label: Privacy toggle release
    value: WhatsApp beta 2.11.44, within roughly a week of launch
    confidence: high_confidence
    sourceIds: [ibtimes-blue-ticks-2014, wikipedia-whatsapp]
  - label: States the feature added to a chat
    value: Three, sent, delivered, read
    confidence: confirmed
    sourceIds: [panda-checkmarks-explainer, whatsapp-faq-read-receipts]
  - label: Tradeoff in the toggle
    value: Turning off blue ticks removes them in both directions
    confidence: confirmed
    sourceIds: [rasayel-read-receipts, whatsapp-faq-read-receipts]
glanceCards:
  - id: setup
    title: A chat that had two states
    body: Before November 2014, a WhatsApp message had two states a casual user could see, sent and delivered. A grey tick said it had left your phone. A second grey tick said it had reached theirs. Beyond that, nothing. [panda-checkmarks-explainer]
    sourceIds: [panda-checkmarks-explainer]
    confidence: confirmed
  - id: problem
    title: Delivered did not mean seen
    body: People kept asking each other if a message had been seen. The product had no way to answer. The ambiguity sat on top of every silent thread and turned waiting into a small uncomfortable game. [wikipedia-whatsapp]
    sourceIds: [wikipedia-whatsapp]
    confidence: high_confidence
  - id: tempting-move
    title: The fuller status panel trap
    body: The obvious move was a richer status panel showing typing, last seen, online now, and detailed timestamps. Each addition would have added a screen, a setting, and more surface for the user to manage. [whatsapp-faq-read-receipts]
    sourceIds: [whatsapp-faq-read-receipts]
    confidence: medium_confidence
  - id: mechanism
    title: A third tick state, no new screen
    body: WhatsApp shipped a third state instead. When the recipient opened the chat, the same two ticks turned blue. No new icon, no new menu, no extra tap. The whole change lived in the colour of two pixels. [panda-checkmarks-explainer, whatsapp-faq-read-receipts]
    sourceIds: [panda-checkmarks-explainer, whatsapp-faq-read-receipts]
    confidence: confirmed
  - id: evidence
    title: A toggle within a week
    body: Backlash arrived fast. Within roughly a week WhatsApp shipped beta version 2.11.44 with a privacy toggle. Turning it off cost the user the ability to see other people's read state too, a deliberate symmetry. [ibtimes-blue-ticks-2014, rasayel-read-receipts]
    sourceIds: [ibtimes-blue-ticks-2014, rasayel-read-receipts]
    confidence: confirmed
  - id: takeaway
    title: A state change is not a small change
    body: Adding a third state to a familiar interface rewires the social contract around it. The pixels were tiny. The behavioural delta was a new norm about response time inside every conversation that used WhatsApp. [wikipedia-whatsapp]
    sourceIds: [wikipedia-whatsapp]
    confidence: high_confidence
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Add a dedicated last seen and typing indicator panel inside every chat.
      - Surface a message info screen with timestamps for sent, delivered, and read.
      - Introduce an opt-in seen marker as a separate icon next to each message.
    summary: Build a richer status surface and let users tune it.
  whatShipped:
    label: What shipped
    bullets:
      - Reuse the existing two-tick icon for delivered.
      - Change its colour to blue the moment the recipient opens the chat.
      - Ship the change globally with no setting at first.
    summary: Repaint two pixels and let the social pressure do the rest.
lifecycle:
  - date: 2014-11
    label: Read receipts launch
    description: Two delivered ticks turn blue when the recipient opens the chat.
    type: launch
  - date: 2014-11
    label: Privacy backlash
    description: Users complain about the loss of plausible deniability.
    type: milestone
  - date: 2014-11
    label: Toggle ships in beta
    description: WhatsApp beta 2.11.44 lets users disable read receipts at the cost of seeing others.
    type: milestone
  - date: 2016-04
    label: End-to-end encryption rollout
    description: Read receipts continue to ride on top of encrypted message delivery.
    type: milestone
  - date: 2026
    label: Still on by default
    description: Read receipts remain a system default with the same toggle pattern.
    type: today
takeaway:
  principle: Changing the colour of an existing icon can shift the social contract more than adding a whole screen of new ones.
  sourceIds: [panda-checkmarks-explainer, whatsapp-faq-read-receipts]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct autopsy hero illustration for WhatsApp blue ticks. Canvas role hero at aspect 2400x1350. Show a horizontal sequence of three abstract speech bubble shapes, the first with a single grey tick, the second with two grey ticks, and the third with two forest green ticks rendered in slightly cool tint with a small soft amber glow underneath. The bubbles are mist coloured with charcoal outlines on a cream background. Between bubble two and bubble three, a subtle forest green arrow showing the state change. Hatch as a small narrator at the lower right, about 14 percent of canvas height, in narrator pose pointing at the third bubble, with cap and growth arrow visible. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Leave quiet space in the upper left for title overlay. No human faces, no fake WhatsApp UI screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Three speech bubbles show a single grey tick, then two grey ticks, then two green ticks while Hatch points at the third.
    caption: Two pixels changed colour. The social contract changed with them.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct illustration of the moment a recipient opens a chat. Canvas role hatch-narrator at aspect 1600x1600. Show a stylised phone outline in deep forest tilted at a slight angle, with one outgoing speech bubble inside it carrying a checkmark pair just shifting from grey to forest green, and a soft amber pulse ring radiating from the checkmarks. The background is cream with mist accent rings. Hatch at center, about 30 percent of canvas height, in narrator pose with a hand raised toward the phone, with cap and growth arrow visible and green H mark on chest. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no real WhatsApp UI, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A stylised phone shows a speech bubble whose checkmarks are shifting from grey to green while Hatch gestures from beside it.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct mechanism illustration for the three tick states. Canvas role failure-mechanism at aspect 1800x1200. Show three labelled columns running left to right, each containing a single tick or pair of ticks. The leftmost column has one grey tick labelled Sent in small charcoal type. The middle has two grey ticks labelled Delivered. The rightmost has two forest green ticks labelled Read with a soft amber underline. A thick forest green arrow connects column two to column three to emphasise the new state. Use cream background, mist column dividers, deep forest type. Hatch in thinking pose at the lower left, about 18 percent of canvas height, pointing at the third column, with cap and growth arrow visible. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no fake WhatsApp UI, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Three labelled columns show one grey tick, two grey ticks, and two green ticks while Hatch points at the green pair.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct evidence card visualising the privacy toggle that arrived within a week of the November 2014 launch. Canvas role evidence-card at aspect 1600x1000. Show a single horizontal toggle switch shape with the handle on the right and a small forest green check next to a label reading Read receipts. Below the toggle, a thin mist coloured note shape with the words 2.11.44 in charcoal numerals. To the right of the toggle, a small symmetrical diagram showing a pair of green ticks crossed out with a soft amber line. Cream background, deep forest linework. Hatch absent. Use one short label and one visible artifact shape only. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A toggle labelled Read receipts sits next to a note reading 2.11.44 and a small crossed-out pair of green ticks.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct lesson illustration. Canvas role lesson-frame at aspect 1800x1200. Show a single oversized icon at the left, two forest green ticks, paired with three small social pressure markers on the right rendered as small clock shapes in soft amber. A forest green arrow runs from the ticks to the clocks. The cream background is divided by a faint mist diagonal. Hatch in coaching pose at the lower right, about 22 percent of canvas height, calm and explanatory, with cap and growth arrow visible. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no fake WhatsApp UI, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A pair of green ticks on the left connects via an arrow to three small clock shapes on the right while Hatch stands in coaching pose nearby.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct thumbnail composition for WhatsApp blue ticks. Canvas role thumbnail at aspect 1200x900. Show a single pair of bold forest green ticks centred on the canvas with a thin soft amber underline beneath. A small mist coloured speech bubble sits behind the ticks at 25 percent opacity. A tiny Hatch mark, just the rounded green head silhouette with cap and growth arrow, sits in the bottom left at about 8 percent of canvas height. Make the decision readable at small size with one strong focal shape. Cream background. No human faces, no fake WhatsApp UI. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Two large forest green ticks centred on cream with a faint speech bubble behind and a tiny Hatch silhouette in the corner.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      A flat geometric HackProduct social cover for WhatsApp blue ticks. Canvas role social-cover at aspect 2400x1260. Show a horizontal trio of speech bubbles across the centre, the leftmost with a single grey tick, the middle with two grey ticks, the right with two forest green ticks. The right bubble carries a faint soft amber halo. Behind the bubbles, a wide cream field with a faint mist diagonal band. A small Hatch in narrator pose sits at the lower right at about 12 percent of canvas height, with cap and growth arrow visible. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Keep the center 70 percent clear of edge-critical details. No human faces, no fake WhatsApp UI. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Three speech bubbles in a row show the progression from one grey tick to two green ticks with a small Hatch in the corner.
    watermark: HackProduct
nextInQueue:
  slug: whatsapp-groups
  companySlug: meta
  title: WhatsApp Groups
---

<!-- beat: lede -->

It is some evening in late November 2014. A sender types a message, hits the arrow, and watches the small icon beside the bubble. One grey tick. Two grey ticks. The recipient's status at the top of the screen reads "online". They are right there, on the other side of the same surface, and the ticks have not turned blue. The "online" indicator flickers off. The ticks are still grey. Something has happened, and nothing has happened, and the silence has acquired a colour.

The colour was new that month. WhatsApp had shipped blue read receipts on top of an existing two-tick checkmark people already understood as delivered [wikipedia-whatsapp][ibtimes-blue-ticks-2014]. No new icon, no new screen, no extra menu. Just a third state on the same shape, triggered the instant the recipient opened the chat the message sat in [panda-checkmarks-explainer][whatsapp-faq-read-receipts]. The cost was almost nothing in interface. The consequence was a new norm about response time that propagated through entire friend graphs in a week.

This is the story of the cheapest possible state change a billion-user product ever shipped, the backlash that followed, and the toggle that arrived in a beta a few days later. The question worth carrying through the read is small. When a single colour change rewires how a billion people read silence, what did the team build, and what did they let go of to build it?

<!-- beat: glance -->
## At a glance

**1. A chat that had two states**

Before November 2014, a WhatsApp message had two states a casual user could see, sent and delivered. A grey tick said it had left your phone. A second grey tick said it had reached theirs. Beyond that, nothing. [panda-checkmarks-explainer]

**2. Delivered did not mean seen**

People kept asking each other if a message had been seen. The product had no way to answer. The ambiguity sat on top of every silent thread and turned waiting into a small uncomfortable game. [wikipedia-whatsapp]

**3. The fuller status panel trap**

The obvious move was a richer status panel showing typing, last seen, online now, and detailed timestamps. Each addition would have added a screen, a setting, and more surface for the user to manage. [whatsapp-faq-read-receipts]

**4. A third tick state, no new screen**

WhatsApp shipped a third state instead. When the recipient opened the chat, the same two ticks turned blue. No new icon, no new menu, no extra tap. The whole change lived in the colour of two pixels. [panda-checkmarks-explainer, whatsapp-faq-read-receipts]

**5. A toggle within a week**

Backlash arrived fast. Within roughly a week WhatsApp shipped beta version 2.11.44 with a privacy toggle. Turning it off cost the user the ability to see other people's read state too, a deliberate symmetry. [ibtimes-blue-ticks-2014, rasayel-read-receipts]

**6. A state change is not a small change**

Adding a third state to a familiar interface rewires the social contract around it. The pixels were tiny. The behavioural delta was a new norm about response time inside every conversation that used WhatsApp. [wikipedia-whatsapp]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

The WhatsApp of late 2014 is past 600 million monthly users and growing faster than any other consumer messaging product [wikipedia-whatsapp]. The company is also, by the standards of the platforms it has overtaken, almost laughably small. Jan Koum and Brian Acton run it out of a converted warehouse in Mountain View. The engineering org is on the order of fifty people serving a chat product that has already eaten SMS in most of the world outside the United States. The Facebook acquisition has closed earlier that year. Koum has not changed his cubicle.

The chat surface is almost embarrassingly thin. A bubble for the message, a timestamp underneath, and beside the bubble a small icon that takes one of two shapes. A single grey tick says the message has left the sender's device. A double grey tick says it has reached the recipient's [panda-checkmarks-explainer]. That second tick already exists. It is already an acknowledgment signal flowing back across the network. The question on the table that autumn is not whether to add receipts. The question is whether to extend the existing acknowledgment one further step, from delivered to read, and how to surface that step in the chat without breaking the thinness of the surface.

Across friend groups, families, and work teams, the same question repeats every day. Did they see it. The product cannot answer. People take screenshots, ask follow-up messages, sometimes start parallel calls to confirm a read. The most common workaround is to assume the worst, that delivered means ignored, and to start narrating that assumption back to the silent other side. The mental load of that uncertainty falls disproportionately on the sender. The team is watching this happen and considering several alternatives, each of them defensible, before choosing the one that ships.

<!-- beat: choice -->
## The obvious answer and what shipped instead

Three reasonable answers were on the table, and each had advocates. The first was opt-in receipts of the kind iMessage had shipped two years earlier, off by default with a per-conversation toggle, the polite move that respected the user's privacy by making the user choose to expose it. The second was Koum's preferred answer for years, no read receipts at all, because seen-state was the kind of metadata a chat app modelled on SMS had no business collecting. The third was a more granular indicator, a small "typing now" dot that fired only in the moment of composition, which would have signalled engagement without producing a permanent record of when a message was read. Each was a defensible position. The team picked none of them and shipped read receipts on the existing two-tick icon, on by default, globally.

| The tempting move | What shipped |
|---|---|
| Add a dedicated last seen and typing indicator panel inside every chat | Reuse the existing two-tick icon for delivered |
| Surface a message info screen with timestamps for sent, delivered, and read | Change its colour to blue the moment the recipient opens the chat |
| Introduce an opt-in seen marker as a separate icon next to each message | Ship the change globally with no setting at first |
| *Build a richer status surface and let users tune it.* | *Repaint two pixels and let the social pressure do the rest.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The seam is a piece of data the system was already collecting. WhatsApp's messaging protocol already tracked acknowledgments at two layers for delivery purposes. The server ack confirmed the company's infrastructure had received the message and would push it to the recipient. The client ack came back the moment the message landed on the recipient's device. Together those two acks produced the two grey ticks in the chat. The pieces to track a third event, the moment the recipient opened the chat the message sat in, were already latent in the same client. Adding the "read" state meant exposing data the system already had.

What blue ticks actually do is a four-step round trip on top of that existing plumbing. Server confirms receipt of the outgoing message, sender's first grey tick appears. Recipient's device receives the push and sends a client ack back, second grey tick appears. Recipient opens the chat thread, which fires a client-side read event. That read event travels back to the server, the server forwards it to the sender's client, and both ticks repaint blue [panda-checkmarks-explainer][whatsapp-faq-read-receipts].

The constraint the team chose to honour was minimalism. The chat list had to remain readable at a glance with no new chrome, no extra icon, no message info panel exposed by default. A single colour change was the only design that satisfied that constraint.

The constraint the team chose to ignore was optionality. Read receipts shipped on by default, globally, with no opt-out for over a year for the original cohort that experienced the rollout, until the privacy toggle in beta 2.11.44 arrived a few days after launch and a stable channel update consolidated it later [ibtimes-blue-ticks-2014][wikipedia-whatsapp]. The detail to notice in the toggle is how it was designed. Turning blue ticks off does not hide only the user's outbound read state. It also blocks the user from seeing other people's [rasayel-read-receipts][whatsapp-faq-read-receipts]. The cost of opting out of the social contract is being unable to participate in the other side of it. Group chats are a separate special case, where both ticks turn blue only after every participant has opened the conversation [panda-checkmarks-explainer].

The second-order effects fell out in three waves. The first was the social-accountability vise. A sender could now see that a message had been read and unanswered, and the receiver could see that the sender could see. The ambiguity that used to absorb conflict was gone. The second wave was the 2014 backlash, loud and immediate, which forced the toggle. The third was linguistic. In the months after launch, "she blue-ticked me" entered the vocabulary of friend groups in São Paulo and Mumbai and Madrid as shorthand for a specific kind of small wound. The product had renamed a feeling.

<!-- beat: evidence -->
## Evidence

The public record proves the November 2014 launch month, the privacy backlash, the 2.11.44 beta that introduced the toggle, the symmetric tradeoff in the toggle, and the special-case rules for group chats [wikipedia-whatsapp][ibtimes-blue-ticks-2014][panda-checkmarks-explainer][rasayel-read-receipts][whatsapp-faq-read-receipts]. It does not prove a specific day in November. It does not include a first-person quote from Jan Koum or Brian Acton in the available sources that justifies the design choice. Day-one engagement deltas are not in the public record either.

The harder question is causal. Read receipts arrived during a period when WhatsApp was already growing rapidly on its own momentum, and several adjacent changes to the product, including end-to-end encryption rollout in 2016, ran in the same multi-year window. The public record does not isolate the effect of blue ticks on response rates, on message volume per conversation, or on the share of messages that go unanswered. Anecdote and product folklore both insist response times tightened after launch, and the linguistic evidence supports the claim that the social pressure was real, but no source breaks out the engagement curve in a form a careful reader can audit.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Read receipts launch month | November 2014 | Confirmed | [wikipedia-whatsapp][ibtimes-blue-ticks-2014] |
| Privacy toggle release | WhatsApp beta 2.11.44, within roughly a week | High | [ibtimes-blue-ticks-2014][wikipedia-whatsapp] |
| States added to a chat | Three, sent, delivered, read | Confirmed | [panda-checkmarks-explainer][whatsapp-faq-read-receipts] |
| Toggle tradeoff | Turning off blue ticks removes them in both directions | Confirmed | [rasayel-read-receipts][whatsapp-faq-read-receipts] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: aftermath -->
## Timeline

1. **2014-11**. Read receipts launch globally, two delivered ticks turn blue when the recipient opens the chat. [wikipedia-whatsapp]
2. **2014-11**. Public backlash about loss of plausible deniability spreads through press and social. [ibtimes-blue-ticks-2014]
3. **2014-11**. WhatsApp beta 2.11.44 ships a privacy toggle to disable read receipts at the cost of seeing others. [ibtimes-blue-ticks-2014]
4. **2016-04**. End-to-end encryption rolls out across all chats, read receipts continue to ride on top.
5. **2026**. Read receipts remain on by default with the same symmetric toggle pattern. [whatsapp-faq-read-receipts]

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **Changing the colour of an existing icon can shift the social contract more than adding a whole screen of new ones.**
>
> — HackProduct autopsy

The same move turns up wherever a product makes visibility a default rather than a choice. Apple's iMessage shipped read receipts two years before WhatsApp and made the opposite call, off by default, opt-in per conversation, which is why iMessage seen-state never produced the cultural backlash blue ticks did. LinkedIn went the other way with "viewed your profile", which turned browsing into a record the other party can see, and built a paid tier around the asymmetry. The same product question, three different answers. Whose comfort does the default protect, the watcher's or the watched's?

<!-- beat: references -->
## References

1. **How to check read receipts**. WhatsApp Help Center · Tier A · accessed 2026-05-17. https://faq.whatsapp.com/665923838265756/?cms_platform=web
   Supports: Current company description of read receipt states and the privacy setting.
2. **WhatsApp**. Wikipedia · Tier C · accessed 2026-05-17. https://en.wikipedia.org/wiki/WhatsApp
   Supports: November 2014 introduction of read receipts and the update within a week that allowed disabling them.
3. **WhatsApp Launches Read Receipts Feature To Disable Infamous Double Blue Ticks**. IBTimes Australia · Tier B · accessed 2026-05-17. https://www.ibtimes.com.au/whatsapp-launches-read-receipts-feature-disable-infamous-double-blue-ticks-1389191
   Supports: Backlash to read receipts and the WhatsApp 2.11.44 beta that introduced the privacy toggle.
4. **Understanding WhatsApp Check Marks One or Two, Gray or Blue**. Panda Security · Tier C · accessed 2026-05-17. https://www.pandasecurity.com/en/mediacenter/whatsapp-check-marks/
   Supports: The three states sent, delivered, read and the group chat behaviour.
5. **WhatsApp Read Receipts Explained**. Rasayel · Tier C · accessed 2026-05-17. https://learn.rasayel.io/en/blog/whatsapp-read-receipts/
   Supports: Behaviour of the privacy toggle and the symmetric tradeoff when it is off.

<!-- beat: forward -->
## Next in queue

**WhatsApp Groups**. A two-day build in 2011 that turned a private chat app into the closest thing the internet has to a global address book of small communities.

→ [/autopsies/meta/whatsapp-groups](/autopsies/meta/whatsapp-groups)
