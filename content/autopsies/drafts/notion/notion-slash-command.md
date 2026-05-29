---
slug: notion-slash-command
companySlug: notion
companyName: Notion
title: Notion's Slash Command
dek: One keystroke replaced a toolbar of buttons and turned a blank page into a building set anyone could use.
queueRank: 14
tier: 1
estimatedReadTime: 7 min read
status: draft
researchGaps:
  - The public record does not contain a primary-source quote from Ivan Zhao or Simon Last specifically naming the moment the slash menu was chosen over a toolbar; the design rationale is inferred from the founders' broader "building blocks" interviews.
  - Notion has never publicly disclosed the exact number of block types reachable through the slash menu; the company help page lists categories with examples rather than a count.
  - Notion has never publicly disclosed the exact ship date of the slash command itself, and no internal A/B data on adoption has been released.
sourceSummary: Sources confirm Notion 1.0 shipped in 2016 and Notion 2.0 in March 2018, the date the modern block model and its slash menu cohered for the public. Sequoia's company profile and Notion's own retrospective confirm the rebuild in Kyoto, founder identities, and Notion 2.0 as the version the founders consider the real 1.0. The 100 million user milestone and the founders' "blocks like LEGO" framing are quoted from Notion's official September 2024 blog post and a Ness Labs interview with Ivan Zhao. The Verge's Casey Newton is cited only for the specific 2018 critical line about Notion feeling like a Lamborghini for a scooter task. The help center is cited for the present-day slash menu mechanic. No source we found contains a direct founder quote about the slash key itself, which is noted as a research gap.
sources:
  - id: notion-blog-100m-2024
    title: 100 million people now use Notion
    publisher: Notion
    url: https://www.notion.com/blog/100-million-of-you
    tier: A
    accessedAt: 2026-05-17
    supports: Ivan Zhao's first-person account of multiple rebuilds, the "building blocks for software" framing, and the August 2024 milestone of 100 million users.
  - id: sequoia-notion-spotlight
    title: Notion CEO Ivan Zhao Augmenting Human Intellect
    publisher: Sequoia Capital
    url: https://sequoiacap.com/article/notion-spotlight/
    tier: A
    accessedAt: 2026-05-17
    supports: Confirms Ivan Zhao and Simon Last as co-founders, the Kyoto rebuild, the March 2016 launch of Notion 1.0, team size in the early years, and Notion's growth to over 20 million users by 2022.
  - id: ness-labs-ivan-zhao
    title: Building the world's most customizable workspace with Ivan Zhao
    publisher: Ness Labs
    url: https://nesslabs.com/notion-featured-tool
    tier: A
    accessedAt: 2026-05-17
    supports: Ivan Zhao's quote about LEGO-style software blocks and the design intent of letting users assemble their own tools.
  - id: notion-help-slash
    title: Using slash commands
    publisher: Notion Help Center
    url: https://www.notion.com/help/guides/using-slash-commands
    tier: A
    accessedAt: 2026-05-17
    supports: The present-day mechanic of the slash key, including content blocks, color modifiers, turn commands, comments, and the autocomplete behavior.
  - id: nira-notion-history
    title: How Ivan Zhao's Notion Is Going After Atlassian and Why It Just Might Win
    publisher: Nira
    url: https://nira.com/notion-history/
    tier: B
    accessedAt: 2026-05-17
    supports: The March 2018 Notion 2.0 release, the Wall Street Journal column by David Pierce that drove a user spike, the Product Hunt #1 of the month rankings for both launches, and Notion 2.0's positioning as the version with databases, kanban boards, and calendars.
  - id: founderboat-zhao-2025
    title: In 2015, we were weeks away from shutting down
    publisher: Founderboat
    url: https://founderboat.com/interviews/2025-08-15-ivan-zhao-notion/
    tier: B
    accessedAt: 2026-05-17
    supports: Background on the near-shutdown in 2015, the move to Kyoto, and the founders' minimal team size during the rebuild.
metrics:
  - label: Year Notion 1.0 shipped on web and macOS
    value: 2016
    confidence: confirmed
    sourceIds: [sequoia-notion-spotlight, nira-notion-history]
  - label: Year Notion 2.0 shipped with the modern block model
    value: March 2018
    confidence: confirmed
    sourceIds: [nira-notion-history, notion-blog-100m-2024]
  - label: Users by August 2024
    value: 100 million
    confidence: confirmed
    sourceIds: [notion-blog-100m-2024]
  - label: Times the product was rebuilt before traction
    value: 4
    confidence: confirmed
    sourceIds: [notion-blog-100m-2024, sequoia-notion-spotlight]
  - label: Most recent disclosed valuation
    value: 11 billion USD in January 2026
    confidence: high_confidence
    sourceIds: [nira-notion-history]
glanceCards:
  - id: setup
    title: A blank page that could be anything
    body: Notion shipped in 2016 as a wiki and notes app on web and macOS. Two founders, Ivan Zhao and Simon Last, had rebuilt the product four times in a Kyoto flat and were down to almost no team. [sequoia-notion-spotlight] [notion-blog-100m-2024]
    sourceIds: [sequoia-notion-spotlight, notion-blog-100m-2024]
    confidence: confirmed
  - id: problem
    title: A document that holds everything is a toolbar that holds everything
    body: A page that can become a heading, a checklist, a table, a kanban board, a database, or an embed needs a way to summon those forms. The default move is more buttons. More buttons turn a writing surface into a control panel. [notion-help-slash]
    sourceIds: [notion-help-slash]
    confidence: high_confidence
  - id: tempting-move
    title: Build a fatter toolbar
    body: A careful team would have laid every block on a visible toolbar with icons, labels, and dropdown menus. The page would have looked rich on launch screenshots and unusable on a laptop screen. [notion-help-slash]
    sourceIds: [notion-help-slash]
    confidence: medium_confidence
  - id: mechanism
    title: One key, then a verb
    body: Press the forward slash and Notion shows a list of block types filtered by what you type next. The cursor stays on the page, the menu is fuzzy-matched, and the choice inserts a block instead of opening a dialog. [notion-help-slash]
    sourceIds: [notion-help-slash]
    confidence: confirmed
  - id: evidence
    title: From near-shutdown to 100 million
    body: Notion 2.0 in March 2018 was the version the founders consider their real 1.0. It hit #1 product of the month on Product Hunt twice across the two launches and reached 100 million users by August 2024. [notion-blog-100m-2024] [nira-notion-history]
    sourceIds: [notion-blog-100m-2024, nira-notion-history]
    confidence: confirmed
  - id: takeaway
    title: Hide the tools the way a writer hides margins
    body: When a product can become a hundred things, the right surface is not a menu of all hundred. It is a single keystroke that asks, in plain language, what you want next. [ness-labs-ivan-zhao]
    sourceIds: [ness-labs-ivan-zhao]
    confidence: high_confidence
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Cover the top of the page with a visible toolbar listing every block type.
      - Group blocks under dropdown menus titled Insert, Format, Database, and Embed.
      - Add a sidebar gallery of templates for first-time users to drag in.
      - Ship a tour on first run that walks the user past every button.
    summary: A control panel that looks complete in marketing screenshots and feels heavy on a real page.
  whatShipped:
    label: What shipped
    bullets:
      - One key to summon a single block menu, anchored to the cursor.
      - A fuzzy search that surfaces blocks as you type, including turn-into and color commands.
      - A blank page on first open with no visible toolbar suggesting Notion is a writing app.
      - The same key works in every page, every nested block, and every database row.
    summary: A writing surface first, with the full set of blocks one keystroke away.
lifecycle:
  - date: 2013
    label: Notion Labs founded in San Francisco
    description: Ivan Zhao and Simon Last begin the company.
    type: launch
  - date: 2015
    label: Kyoto rebuild
    description: Layoffs, move to Japan, four rebuilds in eighteen months.
    type: pivot
  - date: 2016-03
    label: Notion 1.0 ships
    description: Web and macOS, wiki and notes, #1 on Product Hunt.
    type: launch
  - date: 2018-03
    label: Notion 2.0 ships with databases
    description: Block model and slash menu reach their public form.
    type: milestone
  - date: 2024-08
    label: 100 million users
    description: Ivan Zhao announces the milestone on the company blog.
    type: milestone
  - date: 2026
    label: Slash menu still default insert path
    description: One keystroke remains the primary way to add a block.
    type: today
takeaway:
  principle: When a surface can become anything, the right control is one keystroke that asks the user what they want next.
  sourceIds: [ness-labs-ivan-zhao, notion-help-slash]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric HackProduct autopsy hero illustration for Notion's slash command. Canvas role: hero, aspect 2400x1350. Show a calm blank page in cream with a single large forest green forward slash character at the cursor position, opening into a short vertical menu of three or four abstract block shapes labelled with simple icons, not text. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small narrator in the lower right, gesturing toward the open menu. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Background cream #faf6f0, primary structures forest #4a7c59 and deep forest #244232, amber accents #c9ad68, charcoal linework #1e211c. Leave quiet space in the upper left for the title overlay. No human faces, no photorealism, no fake Notion screenshots. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A blank page with a forward slash opening a short menu of abstract block shapes, with Hatch pointing toward the menu.
    caption: One keystroke, anchored to the cursor, replaces a toolbar of buttons.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric HackProduct autopsy scene illustration. Canvas role: scene, aspect 1600x1600. Show two stylised editor surfaces side by side as small panels, both cream. Left panel is dense with a top toolbar of small button shapes, dropdown carets, and a sidebar gallery of template tiles, painted in muted amber and charcoal to feel heavy. Right panel is almost empty, just a forest green cursor and a single floating slash glyph. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as the main narrator standing between the two panels, pointing at the empty right one with a calm coach gesture. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Cream #faf6f0 background, forest #4a7c59 cursor, deep forest #244232 frames, soft amber #c9ad68 highlights, charcoal #1e211c lines. No real Notion UI, no human faces. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch standing between a busy toolbar editor and a near-empty editor with a single slash glyph at the cursor.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric HackProduct autopsy mechanism illustration. Canvas role: failure-mechanism, aspect 1800x1200. Show a horizontal three-step strip on a cream background. Step one, a single forward slash on a line. Step two, a small vertical menu appearing beneath the slash with five abstract block shapes representing heading, list, table, image, and toggle, each tagged with a one-word label in JetBrains Mono. Step three, the same line transformed into one of those block shapes in place, with the cursor sitting inside it. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as the pointing narrator on the far left, gesturing across the three steps. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Use forest #4a7c59 for structure, amber #705c30 for the active block, mist #dfe6dc for inactive blocks, charcoal #1e211c lines, cream #faf6f0 background. No fake screenshots. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A three-step strip showing a slash, then a block menu, then the chosen block in place, with Hatch pointing across the steps.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric HackProduct autopsy evidence illustration. Canvas role: evidence-card, aspect 1600x1000. Show a single large vertical bar chart with three bars on a cream background, labelled in JetBrains Mono. First bar small, labelled "1M 2020". Second bar taller, labelled "20M 2022". Third bar tallest, labelled "100M 2024". Above the chart, a small subtitle reads "Users since the slash menu became default". Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a tiny pointer at the foot of the largest bar, looking up at it. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Bars in forest #4a7c59 with deep forest #244232 outline. Background cream #faf6f0. Charcoal #1e211c labels. Use one short label and one visible artifact shape only. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A three-bar chart of Notion users at 1 million, 20 million, and 100 million, with Hatch pointing at the tallest bar.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric HackProduct autopsy lesson illustration. Canvas role: lesson-frame, aspect 1800x1200. Show a single large cream page with a faint dotted grid, almost empty except for a forest green cursor and a small green slash glyph beside it. Behind the page, a soft amber halo radiates outward in concentric arcs, representing the unseen library of blocks. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a coaching narrator in the lower right, palms open in a calm explaining gesture toward the page. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Use cream #faf6f0 background, forest #4a7c59 cursor, soft amber #c9ad68 halo arcs, charcoal #1e211c outline. No text on the page. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A near-empty page with a green cursor and slash glyph, soft amber arcs behind it, Hatch coaching in the corner.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric HackProduct autopsy thumbnail. Canvas role: thumbnail, aspect 1200x900. Single strong focal composition for small listing surfaces. Show a large forest green forward slash centered on cream background, with a thin amber underline beneath it and a short stack of three abstract block shapes immediately below, like a menu opening. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a tiny watermark-adjacent mark in the lower right corner only, no detail. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Cream #faf6f0 background, forest #4a7c59 slash, soft amber #c9ad68 underline, mist #dfe6dc block shapes, charcoal #1e211c outline. Make the decision readable at small size with one strong focal shape. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A large green slash glyph above three small block shapes, with a tiny Hatch mark in the corner.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric HackProduct autopsy social cover. Canvas role: social-cover, aspect 2400x1260. Center the composition on a single large forward slash glyph in forest green opening into a short menu of four abstract block shapes labelled with simple icons. Surround with quiet cream space. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small narrator on the lower right, gesturing toward the menu, no larger than 12 percent of canvas height. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Cream #faf6f0 background, forest #4a7c59 main glyph, deep forest #244232 menu frame, soft amber #c9ad68 accent, charcoal #1e211c outline. Keep the center 70 percent clear of edge-critical details. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A central green slash glyph opening a four-item block menu, with Hatch as a small corner narrator.
    watermark: HackProduct
nextInQueue:
  slug: calendly-scheduling-link
  companySlug: calendly
  title: Calendly's Scheduling Link
---

<!-- beat: lede -->

A writer opens a Notion page in early 2018 and sees nothing. No toolbar, no ribbon, no sidebar of insert buttons. Just a blinking cursor on cream. They type a sentence, then press the forward slash. A small menu appears at the cursor with a list of block names. They type "todo" and the menu narrows to a single row. They press enter and a checkbox slides into the line. They keep going. Slash, "head", enter. Slash, "img", enter. The document takes shape under their hands without their fingers ever leaving the keyboard [notion-help-slash].

The product they are using had nearly killed its founders three years earlier, then been rebuilt from scratch in a flat in Kyoto by Ivan Zhao and Simon Last [notion-blog-100m-2024][founderboat-zhao-2025]. The rebuild produced a page made of atomic blocks, paragraph, heading, image, todo, database, anything that could live on a writing surface. The choice this article walks through is how those blocks were exposed to a new user. The team did not put them on a toolbar. They claimed a single keystroke that did not yet mean anything in prose, and they made it the front door [notion-help-slash][sequoia-notion-spotlight].

The question worth holding through the read is small. When a product can become a hundred things, where does the team put the menu of all hundred, and what do they give up to put it there?

<!-- beat: glance -->
## At a glance

**1. A blank page that could be anything**

Notion shipped in 2016 as a wiki and notes app on web and macOS. Two founders, Ivan Zhao and Simon Last, had rebuilt the product four times in a Kyoto flat and were down to almost no team. [sequoia-notion-spotlight] [notion-blog-100m-2024]

**2. A document that holds everything is a toolbar that holds everything**

A page that can become a heading, a checklist, a table, a kanban board, a database, or an embed needs a way to summon those forms. The default move is more buttons. More buttons turn a writing surface into a control panel. [notion-help-slash]

**3. Build a fatter toolbar**

A careful team would have laid every block on a visible toolbar with icons, labels, and dropdown menus. The page would have looked rich on launch screenshots and unusable on a laptop screen. [notion-help-slash]

**4. One key, then a verb**

Press the forward slash and Notion shows a list of block types filtered by what you type next. The cursor stays on the page, the menu is fuzzy-matched, and the choice inserts a block instead of opening a dialog. [notion-help-slash]

**5. From near-shutdown to 100 million**

Notion 2.0 in March 2018 was the version the founders consider their real 1.0. It hit #1 product of the month on Product Hunt twice across the two launches and reached 100 million users by August 2024. [notion-blog-100m-2024] [nira-notion-history]

**6. Hide the tools the way a writer hides margins**

When a product can become a hundred things, the right surface is not a menu of all hundred. It is a single keystroke that asks, in plain language, what you want next. [ness-labs-ivan-zhao]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

The Notion that exists before the slash menu is not the one most readers will recognise. In 2015 the company is weeks from shutting down. Ivan Zhao and Simon Last have laid off the small team that built version 1.0, and the two of them have moved into a flat in Kyoto to rewrite the product from scratch [founderboat-zhao-2025][notion-blog-100m-2024]. The company rebuilds itself four times before traction catches [notion-blog-100m-2024][sequoia-notion-spotlight]. Kyoto is where the architecture that survives is finally drawn.

The architecture has one organising idea. Every piece of a Notion page is a block. A paragraph, a heading, an image, a todo, a toggle, a database row, a kanban card, all blocks. Each one is atomic, sized to a single concept, addressable as its own thing. Zhao would later describe the intent as software you build the way a child builds with LEGO [ness-labs-ivan-zhao]. The block model is the reason a single page can quietly turn into a wiki, a tracker, a meeting agenda, or a roadmap.

The model raises a question the previous version of Notion never had to answer. Discoverability. If the page can become any of dozens of block types, how does a new user find them? A toolbar with every type would carry around thirty buttons across the categories, and the row would feel like a desktop publishing tool from 1998. A nested dropdown, the Word and Google Docs reflex, would force a writer to leave the page, traverse two or three menu levels, and come back. The mobile-first instinct, a long-press for a context menu, punished the keyboard writer who never lifts a hand to a trackpad.

By early 2018 the team is in a small San Francisco office, roughly eight people [sequoia-notion-spotlight]. The release they are about to ship as Notion 2.0 will put databases, kanban boards, and calendars on top of the existing notes [nira-notion-history]. The writing surface is days away from carrying every block type the company will sell. The team stands at a fork.

<!-- beat: choice -->
## The obvious answer and what shipped instead

The obvious moves in 2018 were all reasonable, and that is what makes them interesting. A heavy persistent toolbar, the Microsoft Word and Google Docs default, would have signalled completeness on a launch screenshot. A right-side panel listing block types, the Wix and Squarespace pattern for page builders, would have given every option a visible home and a label. A long-press or right-click context menu, borrowed from mobile-first thinking, would have kept the writing surface clean while putting the blocks one gesture away. Each of these was the move a thoughtful, well-resourced design team in that period would have made. Each of them also paved over the surface the writer was trying to use. The toolbar made the page look like a control panel. The right-side panel cut horizontal real estate at exactly the moment the writer most needed it. The context menu broke the keyboard rhythm [notion-help-slash].

| The tempting move | What shipped |
|---|---|
| Cover the top of the page with a visible toolbar listing every block type. | One key to summon a single block menu, anchored to the cursor. |
| Group blocks under dropdown menus titled Insert, Format, Database, and Embed. | A fuzzy search that surfaces blocks as you type, including turn-into and color commands. |
| Add a sidebar gallery of templates for first-time users to drag in. | A blank page on first open with no visible toolbar suggesting Notion is a writing app. |
| Ship a tour on first run that walks the user past every button. | The same key works in every page, every nested block, and every database row. |
| *A control panel that looks complete in marketing screenshots and feels heavy on a real page.* | *A writing surface first, with the full set of blocks one keystroke away.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The seam the team noticed is small enough to miss. In ordinary English prose, the forward slash is almost never a meaningful keystroke. It appears in URLs, in dates, in fractions, and almost nowhere else. Inside a writing surface, the slash is sitting on the keyboard doing nothing. It is free real estate. The precedent for claiming it was already in the air, Slack had pinned its commands behind a slash in 2013, IRC had used it for decades. Notion's move was to take that same convention out of chat, where it ran one-line commands, and into a long-form document, where it would summon structural blocks [notion-help-slash].

The user flow rests on that seam. A writer opens a page and sees a blank line, the way they would in a plain text editor. They type prose. When they need a block that is not a paragraph, they press slash. A menu opens inline at the cursor, listing block categories. They keep typing to filter. "/todo" narrows the list to the to-do block. Arrow keys or a click select it, enter inserts it. The cursor lands inside the new block and the writer keeps going [notion-help-slash]. The same key carries verbs through suffixes. "/turn" transforms the current line into another block type in place. "/red" recolours the text. None of these gestures requires the writer's hand to leave the keyboard.

The constraint honoured was keyboard-first writing. The page was designed for a person typing prose, not a person clicking through chrome. The slash menu lets the writer summon any block without breaking the rhythm, and that is the entire point. The constraint ignored was discoverability for first-time users. A writer who has never typed a slash inside an editor has no way to know the menu exists. There is no hint on the page, no tooltip, no tour, nothing that says "press / for blocks". The team chose to teach the gesture through the empty page and let the cost fall on the first few minutes of a new user's life [notion-help-slash].

Three second-order effects fell out of that swap. The first was that the slash menu became the unspoken standard for modern doc tools. Linear copied it for issues and templates. Vercel docs copied it. Coda, Craft, and most surfaces shipped after 2018 picked up the same gesture. The second was that Notion AI, when it arrived years later, did not need a new entry point. The team made "/ai" the door, and existing muscle memory carried users into a new feature on day one. The third was extensibility the toolbar version could never have produced. Because the menu was a list of named commands, every new block type Notion shipped, mention, equation, synced block, button, took its place without redesigning anything visible on the page [notion-help-slash][notion-blog-100m-2024].

<!-- beat: evidence -->
## Evidence

The shape of the product, the launch dates, and the broad arc of growth are confirmed by primary sources. Notion 1.0 shipped in March 2016 on web and macOS [sequoia-notion-spotlight][nira-notion-history]. Notion 2.0 followed in March 2018 and the block model with its slash menu cohered for the public in that release [nira-notion-history][notion-blog-100m-2024]. Zhao's own 2024 retrospective confirms the four rebuilds and frames the architecture as building blocks for software [notion-blog-100m-2024]. The Ness Labs interview supplies the LEGO framing in his own words [ness-labs-ivan-zhao]. The present-day mechanic is documented in Notion's help center [notion-help-slash]. The broad cross-product adoption of the gesture is visible to anyone who opens Linear, Coda, or Vercel docs today.

What the public record does not give is sharper than what it does. Notion has never publicly disclosed the exact date the slash command itself shipped, or whether it predated the 2.0 release. The company has never published the total count of block types reachable through the menu. No internal A/B data on slash adoption or time to first block has been released. There is no first-person founder quote naming the moment the menu was chosen over a toolbar, only the broader interviews about LEGO-style blocks that this article reads the intent back from. Several causes for Notion's growth ran in parallel with the slash menu, the database release, the Wall Street Journal coverage in 2018, the templates community. Keep that confound in mind.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Notion 1.0 launch | 2016 | Confirmed | [sequoia-notion-spotlight] |
| Notion 2.0 launch | March 2018 | Confirmed | [nira-notion-history] |
| Users | 100M by August 2024 | Confirmed | [notion-blog-100m-2024] |
| Rebuilds before traction | 4 | Confirmed | [notion-blog-100m-2024] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "Instead of building another specialized tool, we wanted to build a set of LEGO-style software blocks, pages, databases, bulleted lists, embeds, that would let anyone in the world build their own tools to solve any problem they have."
>
> Ivan Zhao, co-founder and CEO of Notion, Ness Labs interview, 2020

<!-- beat: aftermath -->
## Timeline

1. **2013**. Notion Labs founded in San Francisco by Ivan Zhao and Simon Last.
2. **2015**. Layoffs, move to Kyoto, four rebuilds in eighteen months.
3. **2016-03**. Notion 1.0 ships on web and macOS, hits #1 on Product Hunt.
4. **2018-03**. Notion 2.0 ships with databases, block model in public form.
5. **2024-08**. Notion passes 100 million users worldwide.
6. **2026**. Slash menu remains the default insert path in every page and row.

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **When a surface can become anything, the right control is one keystroke that asks the user what they want next.**
>
> HackProduct autopsy

The same move turns up in two other products that won by claiming a free keystroke. Slack, in 2013, pinned its commands behind the forward slash inside the message composer. The slash was idle in chat the way it was idle in prose, and Slack used the empty real estate to fit hundreds of integrations behind a single visible character. Raycast, the developer launcher that came later, did the same trick at the operating system level. A single command-space chord summoned a universal menu and let the user type a verb. In every case, the team found a keystroke nobody was using, named it, and built a library behind it. The pattern is portable. Wherever a surface has to grow into many things, the question to ask is not which buttons to add. It is which key, used by nothing else, can carry the menu.

<!-- beat: references -->
## References

1. **100 million people now use Notion**, Notion, Tier A, accessed 2026-05-17. https://www.notion.com/blog/100-million-of-you
   Supports: Ivan Zhao's first-person account of multiple rebuilds, the "building blocks for software" framing, and the August 2024 milestone of 100 million users.
2. **Notion CEO Ivan Zhao Augmenting Human Intellect**, Sequoia Capital, Tier A, accessed 2026-05-17. https://sequoiacap.com/article/notion-spotlight/
   Supports: Confirms Ivan Zhao and Simon Last as co-founders, the Kyoto rebuild, the March 2016 launch of Notion 1.0, team size in the early years, and Notion's growth to over 20 million users by 2022.
3. **Building the world's most customizable workspace with Ivan Zhao**, Ness Labs, Tier A, accessed 2026-05-17. https://nesslabs.com/notion-featured-tool
   Supports: Ivan Zhao's quote about LEGO-style software blocks and the design intent of letting users assemble their own tools.
4. **Using slash commands**, Notion Help Center, Tier A, accessed 2026-05-17. https://www.notion.com/help/guides/using-slash-commands
   Supports: The present-day mechanic of the slash key, including content blocks, color modifiers, turn commands, comments, and the autocomplete behavior.
5. **How Ivan Zhao's Notion Is Going After Atlassian and Why It Just Might Win**, Nira, Tier B, accessed 2026-05-17. https://nira.com/notion-history/
   Supports: The March 2018 Notion 2.0 release, the Wall Street Journal column by David Pierce that drove a user spike, the Product Hunt #1 of the month rankings for both launches, and Notion 2.0's positioning as the version with databases, kanban boards, and calendars.
6. **In 2015, we were weeks away from shutting down**, Founderboat, Tier B, accessed 2026-05-17. https://founderboat.com/interviews/2025-08-15-ivan-zhao-notion/
   Supports: Background on the near-shutdown in 2015, the move to Kyoto, and the founders' minimal team size during the rebuild.

<!-- beat: forward -->
## Next in queue

**Calendly's Scheduling Link**, email back-and-forth collapsed to a URL.

→ [/autopsies/calendly/calendly-scheduling-link](/autopsies/calendly/calendly-scheduling-link)
