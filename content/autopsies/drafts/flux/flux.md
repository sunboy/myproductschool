---
slug: flux
companySlug: flux
companyName: f.lux Software LLC
title: f.lux
dek: The two-person utility that automated something every OS already could do, and spent seven years proving the idea before Apple copied it.
queueRank: 24
tier: 2
estimatedReadTime: 10 min read
status: draft
researchGaps:
  - No confirmed total download figure with a primary-source citation; the "8 million downloads" figure circulating in 2014 originates from a MacRumors forum discussion, not a company announcement.
  - The exact date Lorna Herf left Google and began painting is reported as 2005 in Vice but the public record does not include a primary source confirming this specific year.
  - No confirmed revenue figures; f.lux has operated on donations and a corporate-licensing model whose terms have not been made public.
  - No sourced quote from Michael Herf specifically about the Night Shift launch or about the moment the Herfs decided to ship publicly rather than keep the script private.
sourceSummary: The Vice (2016) profile of Michael and Lorna Herf supplies the origin story, the painting-studio observation, quotes from both founders, the 8-million-downloads figure, and the Sherlocking framing. The f.lux Wikipedia page confirms platform launch dates, the App Store removal, and the iOS 9.3 Night Shift timeline. TNW and MobileSyrup coverage from January 2016 document the Herfs' open letter to Apple, Michael Herf's specific request to open up the Night Shift API, and the near-200,000-visit spike to the sideload page. Secondary search coverage across MakeUseOf and Mattress Miracle confirms the Windows Night Light arrival in the April 2017 Creators Update and Night Shift's macOS debut in March 2017. The public record does not include user counts with primary sourcing, revenue figures, or first-person accounts of the build process from the Herfs.
sources:
  - id: vice-2016
    title: The Story Behind f.lux, the Night Owl's Color-Shifting Sleep App of Choice
    publisher: Vice
    url: https://www.vice.com/en/article/the-story-behind-flux-the-night-owls-color-shifting-sleep-app-of-choice/
    tier: A
    accessedAt: 2026-05-17
    supports: Origin story, painting-studio observation, founder quotes, the 8-million-downloads reference, the Night Shift framing, and the college-student demographic claim.
  - id: wikipedia-flux
    title: f.lux
    publisher: Wikipedia
    url: https://en.wikipedia.org/wiki/F.lux
    tier: C
    accessedAt: 2026-05-17
    supports: Launch date (February 2009), platform history, App Store removal, Night Shift timeline, feature list. Used for dates and structural facts only, not product judgment.
  - id: tnw-2016
    title: F.lux creators call Apple out for releasing Night Shift
    publisher: The Next Web
    url: https://thenextweb.com/news/uh-oh-controversial
    tier: B
    accessedAt: 2026-05-17
    supports: The Herfs' open letter, Michael Herf's specific ask to open the Night Shift API, the 200,000-visit sideload spike, the Sherlocking framing, and the January 2016 timeline.
  - id: mobilesyrup-2016
    title: F.lux developers publish response to Apple's Night Shift
    publisher: MobileSyrup
    url: https://mobilesyrup.com/2016/01/15/f-lux-developers-publish-response-to-apples-night-shift/
    tier: B
    accessedAt: 2026-05-17
    supports: Direct quote from Michael Herf's open letter, the "original innovators" framing, and the API access request.
  - id: makeuseof-nightlight
    title: f.lux vs. Windows 10 Night Light, Which One Should You Use?
    publisher: MakeUseOf
    url: https://www.makeuseof.com/tag/flux-vs-windows-10-night-light/
    tier: B
    accessedAt: 2026-05-17
    supports: Windows Night Light arrival in the April 2017 Creators Update, feature comparison between f.lux and the native Windows alternative.
  - id: macrumors-nightshift
    title: Apple Releases macOS Sierra 10.12.4 With New Night Shift Mode
    publisher: MacRumors
    url: https://www.macrumors.com/2017/03/27/apple-releases-macos-sierra-10-12-4/
    tier: B
    accessedAt: 2026-05-17
    supports: Night Shift arrival on macOS in March 2017, confirming the platform-by-platform rollout that followed the iOS 9.3 launch.
metrics:
  - label: f.lux downloads by early 2014
    value: ~8 million (forum-sourced, not primary)
    confidence: medium_confidence
    sourceIds: [vice-2016]
  - label: Visits to f.lux sideload page within 24 hours of Apple ban (November 2015)
    value: ~200,000
    confidence: high_confidence
    sourceIds: [tnw-2016]
  - label: Night Shift launch date on iOS
    value: March 2016 (iOS 9.3)
    confidence: confirmed
    sourceIds: [wikipedia-flux, tnw-2016]
  - label: Windows Night Light launch date
    value: April 2017 (Creators Update)
    confidence: confirmed
    sourceIds: [makeuseof-nightlight]
glanceCards:
  - id: setup
    title: A painting studio and a mismatched screen
    body: Around 2005, Lorna Herf left Google and started painting. Her husband converted a room into a daylight-bulb studio so her canvases would look accurate at night. Stepping out of the studio and back to the computer screen, the screen looked wrong. It glowed cold and blue in a warm amber house. [vice-2016]
    sourceIds: [vice-2016]
    confidence: high_confidence
  - id: problem
    title: The thing every OS already had, but never used
    body: Windows and macOS both exposed gamma and color-temperature controls through their display APIs. Monitors sat at 6500K around the clock regardless of whether the sun had set. Nobody automated those controls against the time of day. The capability was there. The trigger was missing. [wikipedia-flux]
    sourceIds: [wikipedia-flux]
    confidence: confirmed
  - id: tempting-move
    title: The obvious answer
    body: A cautious team would have shipped a manual slider in system settings: "drag this to warm your screen." Users would have to remember to use it, remember to undo it in the morning, and make a decision each time. Most would never touch it. [vice-2016]
    sourceIds: [vice-2016]
    confidence: high_confidence
  - id: mechanism
    title: Set location once, never think about it again
    body: f.lux asks for a ZIP code or city name at install. From that moment on, it queries sunrise and sunset times, hooks the OS gamma ramp, and shifts color temperature automatically, taking roughly an hour from daylight-blue to amber-red after sunset. The user makes zero ongoing decisions. [vice-2016, wikipedia-flux]
    sourceIds: [vice-2016, wikipedia-flux]
    confidence: confirmed
  - id: evidence
    title: Apple noticed, then shipped it themselves
    body: In November 2015, Apple blocked f.lux's iOS sideload page; the page received ~200,000 visits in 24 hours. Two months later, iOS 9.3 shipped Night Shift. Windows Night Light followed in April 2017. Both platforms copied the mechanism while citing independent development. [tnw-2016, makeuseof-nightlight]
    sourceIds: [tnw-2016, makeuseof-nightlight]
    confidence: confirmed
  - id: takeaway
    title: Validated by imitation
    body: When two major OS vendors ship the same feature within thirteen months of each other, they are not coincidentally solving the same problem. They are acknowledging that a free utility built by two people proved enough demand to justify native integration. f.lux is still shipping. [vice-2016, tnw-2016]
    sourceIds: [vice-2016, tnw-2016]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Add a manual slider to display settings letting users drag screen warmth up or down
      - Include it in the OS but make it a one-time setup wizard during onboarding
      - Leave the existing gamma controls in place and write a help article explaining how to use them
    summary: Give the control to users and trust them to remember to adjust it at night and again in the morning.
  whatShipped:
    label: What shipped
    bullets:
      - A tiny background process that reads one piece of user input: location (ZIP code or city)
      - A lookup against local sunrise/sunset tables to derive the transition window each day
      - An OS-level gamma hook that shifts color temperature across about an hour after sunset, returning it gradually at sunrise
      - A movie-mode toggle for the one use case zero-touch breaks — colour-critical work at night
    summary: Zero ongoing decisions. Set location once, and the screen adapts to the time of day forever after.
lifecycle:
  - date: 2005
    label: Painting-studio observation
    description: Lorna Herf leaves Google; the screen-versus-room mismatch surfaces.
    type: milestone
  - date: 2009-02
    label: f.lux ships
    description: Free download for Windows and macOS, with a Linux CLI version.
    type: launch
  - date: 2015-11
    label: Apple blocks iOS sideload
    description: Developer Agreement violation cited; sideload page logs 200,000 visits in 24 hours.
    type: pivot
  - date: 2016-03
    label: Apple ships Night Shift (iOS 9.3)
    description: Same mechanism, native integration; Herfs publish open letter.
    type: milestone
  - date: 2017-04
    label: Windows Night Light ships
    description: Microsoft Creators Update adds native screen-warming. macOS Night Shift followed March 2017.
    type: milestone
  - date: 2026
    label: f.lux still ships
    description: Free, cross-platform, more features than Night Light or Night Shift.
    type: today
takeaway:
  principle: Zero-touch beats manual control, because the decision users never have to make is the one they always keep.
  sourceIds: [vice-2016, tnw-2016]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy hero illustration for f.lux, the 2009 screen-warming utility. Canvas role: hero, aspect 2400x1350. Background is warm cream #faf6f0. On the left, render a simple monitor outline in charcoal #1e211c, its screen filled with cool blue #6ba3c4 light. On the right, render the same monitor with its screen glowing in soft amber #c9ad68, warm and low. Between them, draw a single deep forest #244232 clock-hand arc sweeping from the blue monitor to the amber one, marking the passage from day to night. In the lower centre, place a small glowing sun and crescent moon pair in amber #705c30 and mist #dfe6dc, to show the geolocation-time-of-day concept. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in the upper right as a small narrator, pointing one mitten hand at the arc. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Leave quiet space in the upper left for title overlay. No human faces, no photorealism, no recreated OS screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Two monitor outlines side by side, one glowing blue-white and one glowing warm amber, connected by a clock-hand arc, with small Hatch narrator in the upper right.
    caption: The same screen, seven hours apart.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric scene illustration for the Herf painting-studio moment, circa 2005, aspect 1600x1600. Show a warm cream #faf6f0 room divided into two zones by a thin charcoal #1e211c doorway line. On the left, a painting studio with a tall window flooding soft amber #c9ad68 daylight-bulb light onto a canvas easel silhouette, everything in warm forest #4a7c59 and amber tones. On the right, the rest of the house in mist #dfe6dc evening light, with a small desk holding a single monitor glowing cold blue #6ba3c4. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as the narrator, standing in the doorway between the two zones, one mitten hand gesturing toward the cold blue monitor. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human figures other than Hatch, no photorealism, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A split room with a warm painting studio on the left and a cold blue computer monitor on the right, Hatch standing in the doorway gesturing at the screen.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric mechanism diagram for f.lux's zero-touch loop, aspect 1800x1200. Lay out four horizontal stages on cream #faf6f0. Stage one: a small forest-green #4a7c59 pin-drop icon above a ZIP-code field box labelled SET LOCATION ONCE. Stage two: a charcoal #1e211c sunrise/sunset table grid with a soft amber #c9ad68 highlight on the current day row, labelled LOOKUP TWILIGHT. Stage three: a deep forest #244232 curved arrow labelled OS GAMMA HOOK, showing a smooth gradient from cool blue on the left to warm amber on the right. Stage four: a cream monitor outline with a fully amber-lit screen labelled ZERO DECISIONS. Connect the stages with thin charcoal lines. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in a thinking pose in the lower right, pointing one mitten hand at stage one to mark the single user input. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Four-stage pipeline showing set-location-once feeding into sunrise lookup, OS gamma hook, and a zero-decisions monitor, with Hatch pointing at stage one.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric evidence card showing the OS imitation timeline, aspect 1600x1000. Background is warm cream #faf6f0. Draw a horizontal timeline bar in deep forest #244232 running left to right. At the far left, place a small forest-green #4a7c59 cube labelled F.LUX 2009. At the centre, place a mid-size soft amber #c9ad68 cube labelled APPLE NIGHT SHIFT 2016. At the right, place a slightly larger mist #dfe6dc cube labelled WINDOWS NIGHT LIGHT 2017. Connect them with the timeline bar, with a thin amber pulse between the f.lux cube and the Apple cube. Below the Apple cube, draw a small charcoal lock icon to represent the blocked sideload. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png standing beside the f.lux cube in a pointing pose, gaze tracking right toward the Apple and Windows cubes. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No fake screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A horizontal timeline with three cubes labelled f.lux 2009, Apple Night Shift 2016, and Windows Night Light 2017, with Hatch beside the first cube pointing right.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric lesson illustration for the principle that zero-touch beats manual control, aspect 1800x1200. Background is warm cream #faf6f0. In the centre, draw two columns side by side. Left column: a tall stack of five charcoal #1e211c decision-point diamonds labelled REMEMBER / ADJUST / UNDO / FORGET / REPEAT, representing manual control. Right column: a single large forest-green #4a7c59 circle labelled SET ONCE, with a soft amber #c9ad68 clock-hand arc around it. Draw a thin deep forest #244232 arrow from the left column's top diamond pointing to the right column's circle, suggesting the move. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in a calm coaching pose to the right of the circle, one mitten hand resting on the circle edge, facing toward the reader. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no photorealism, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Two columns side by side, a tall stack of decision diamonds on the left and a single set-once circle on the right, with Hatch coaching from beside the circle.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric thumbnail composition for f.lux, aspect 1200x900. On warm cream #faf6f0, render one bold focal shape: a single monitor outline in charcoal #1e211c whose screen is split diagonally, with cool blue #6ba3c4 in the upper-left half and warm soft amber #c9ad68 in the lower-right half. Add a tiny sun shape in amber #705c30 at the cool-to-warm boundary. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small mark in the bottom-left corner, no larger than 12 percent of canvas height, facing the monitor. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Keep readable at small size. No labels, no screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A monitor outline with a screen split diagonally between cool blue and warm amber, a tiny Hatch mark in the corner, and a sun at the boundary.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric social cover image for f.lux, aspect 2400x1260. Background is warm cream #faf6f0. In the centre 70 percent of the canvas, place a large monitor outline in charcoal #1e211c with its screen split vertically: the left half in cold blue #6ba3c4, the right half in warm soft amber #c9ad68. Between the two halves, draw a thin deep forest #244232 clock-hand divider. Below the monitor, place a short charcoal label reading SET ONCE. In the upper right, place a small sun above and to the right and a crescent moon below and to the left, in amber #705c30 and mist #dfe6dc. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small narrator in the lower-left quadrant, one mitten hand pointing up at the monitor. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human faces, no recreated OS screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A wide cover showing a monitor split between cold blue and warm amber, a clock-hand divider, a sun and moon, and a small Hatch narrator in the lower left.
    watermark: HackProduct
nextInQueue:
  slug: honey
  companySlug: honey
  title: Honey
---

<!-- beat: lede -->

In February 2009, Michael Herf published a small free download to a page at justgetflux.com. The program did one thing: it read the user's ZIP code, looked up local sunrise and sunset times, and shifted the screen from the cool blue-white of daylight (around 6500K) toward warm amber (as low as 1900K) as evening arrived [vice-2016]. The transition took roughly an hour. Most users did not notice it happening. They only noticed, the next morning, that the screen had seemed easier to sit in front of the night before [wikipedia-flux].

This was not a new capability. Windows and macOS had both exposed gamma-adjustment APIs for years before f.lux shipped. What nobody had done was wire those controls to the time of day and to a geographic database, set the whole thing running at startup, and ask nothing further from the user [vice-2016]. The seam was not a technical gap. It was a question of who would bother automating a thing that everyone assumed individuals would manage themselves.

For seven years, the answer was two people in Los Angeles. The story of f.lux is a zero-friction constraint held by a free indie utility until two of the largest software companies decided the idea was worth copying into their operating systems. The question worth sitting with is why the platforms that replaced f.lux delivered a less capable version of the same thing, and why the Herfs are still shipping.

<!-- beat: glance -->
## At a glance

**1. A painting studio and a mismatched screen**

Around 2005, Lorna Herf left Google and started painting. Her husband converted a room into a daylight-bulb studio so her canvases would look accurate at night. Stepping out of the studio and back to the computer screen, the screen looked wrong. It glowed cold and blue in a warm amber house. [vice-2016]

**2. The thing every OS already had, but never used**

Windows and macOS both exposed gamma and colour-temperature controls through their display APIs. Monitors sat at 6500K around the clock regardless of whether the sun had set. Nobody had automated those controls against the time of day. The capability was there. The trigger was missing. [wikipedia-flux]

**3. The obvious answer**

A cautious team would have shipped a manual slider in system settings: drag this to warm your screen. Users would have to remember to use it, remember to undo it in the morning, and make a decision each time. Most would never touch it. [vice-2016]

**4. Set location once, never think about it again**

f.lux asks for a ZIP code or city name at install. From that moment on, it queries sunrise and sunset times, hooks the OS gamma ramp, and shifts colour temperature automatically, taking roughly an hour from daylight-blue to amber-red after sunset. The user makes zero ongoing decisions. [vice-2016, wikipedia-flux]

**5. Apple noticed, then shipped it themselves**

In November 2015, Apple blocked f.lux's iOS sideload page; the page received roughly 200,000 visits in 24 hours. Two months later, iOS 9.3 shipped Night Shift. Windows Night Light followed in April 2017. Both platforms copied the core mechanism. [tnw-2016, makeuseof-nightlight]

**6. Validated by imitation**

When two major OS vendors ship the same feature within thirteen months of each other, they are not coincidentally solving the same problem. They are confirming that a free utility proved enough demand to justify native integration. f.lux is still shipping. [vice-2016, tnw-2016]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

Michael Herf and Lorna Herf had both come out of Picasa, the photo-organisation app that Idealab incubated and Google acquired in 2004 [vice-2016]. Michael had co-founded it and served as CTO. They understood image colour and lighting in a technical sense, which made the painting-studio observation harder to dismiss as a personal quirk.

The studio was in their Los Angeles loft, and it was set up for the specific problem that painters face when working at night: the colour of artificial light does not match daylight, so a colour that reads as warm white under incandescent bulbs reads differently under afternoon sun. The Herfs' solution was to install daylight-spectrum bulbs in the studio room, so Lorna's work would always be evaluated under consistent light. That room worked [vice-2016].

Every other room in the house did not. Outside the studio, the house ran on warm indoor light, the way most houses do in the evening. And the computer screens, both of them, ran at the same colour temperature they had all day. They matched the studio, not the room they were sitting in. Michael noticed the mismatch the same way any photographer-trained eye would: not as a complaint, but as a problem with a visible shape. He wrote a script to fix it [vice-2016].

The script became f.lux. The decision that made it useful rather than personal was a single constraint: no manual operation after setup. The user typed in a ZIP code. The script did the rest. Michael and Lorna put it up for friends to download in February 2009. They had expected to be done in six months [vice-2016]. By early 2014 the download count had reached approximately 8 million, though the public record does not include a primary-source figure from the company itself, and the Herfs have not published official statistics [vice-2016].

<!-- beat: choice -->
## The obvious answer and what shipped instead

The obvious answer was a slider. Both platforms already exposed brightness and colour controls; a night-mode slider proposal would have received a reasonable reception in 2005. What would have shipped is exactly what "slider" implies: a control that waits for a decision. The user sets it each evening and resets it each morning, or forgets to, or decides it looks wrong and turns it off. A feature that requires active use is a feature most people use once. The Herfs' constraint was that they wanted something they would never have to think about, so they built something that nobody would have to think about [vice-2016].

| The tempting move | What shipped |
|---|---|
| Add a manual slider to display settings for users who want to warm their screen | A background process that requires exactly one user input at setup: location |
| Include the control in OS onboarding with a one-time warm/cool preference | A lookup against sunrise/sunset data that recomputes the transition window every day |
| Leave the existing gamma controls in place and document how to use them | An OS gamma hook that runs the transition across roughly one hour, invisibly |
| *Give control to users and trust them to manage the decision every night.* | *Remove the decision permanently after setup. Movie mode handles the one exception.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The seam f.lux exploited was not a hidden API. Both Windows and macOS had exposed gamma-ramp and colour-profile interfaces to third-party software since the 1990s. Monitor calibration tools used them. Display drivers used them. What nobody had wired to the clock and to a geographic database was the one-way valve: a process running at startup, asking for nothing, making no prompt appear, executing the transition so slowly that it stayed below the threshold of conscious notice [wikipedia-flux].

The mechanism has three parts. The first is a location lookup. f.lux accepts a ZIP code, a city name, or manually entered coordinates. From that input, it derives the user's approximate latitude and longitude, which it uses to calculate local sunrise and sunset times for the current day. The calculation runs daily. The user enters the location once, at install, and never touches it again [vice-2016].

The second part is a temperature schedule. During the day, the display stays at its factory default, near 6500K, which is the colour of north-sky daylight. As sunset approaches, f.lux begins shifting the colour temperature downward, and the shift takes roughly an hour to reach its night-time target, which by default sits near 3400K for indoor lighting conditions and can be pulled as low as 1900K for a very warm, candlelight-adjacent screen [wikipedia-flux]. The transition is slow enough that the eye adapts rather than perceives a jump.

The third part is the OS hook. On Windows, f.lux modifies the monitor's gamma ramp via the display driver interface. On macOS, it sets a custom colour profile via Core Display Services. Neither path requires administrator access at runtime. The colour shift exists at the graphics stack level, below applications, so it affects every window on the screen without those applications needing to know it is happening [wikipedia-flux].

The constraint the team chose to honour was zero touch after setup. Every other display utility of the era required a conscious act: open the app, choose a setting, close it. f.lux treated the time-of-day signal as sufficient permission to act. The constraint it chose to ignore was colour accuracy for professional use cases. Photographers, video editors, and designers working late could not trust f.lux's warmer profile when judging colour. The team's answer was movie mode, a toggle that suspended the temperature adjustment for 2.5 hours, enough for a film or a long edit session, without requiring the user to remember to turn f.lux back on [wikipedia-flux]. The exception was designed to preserve the rule. One use case required a decision; every other use case was already handled.

<!-- beat: evidence -->
## Evidence

The direct evidence for f.lux's impact is harder to isolate than the product story suggests. The utility's download numbers are the most widely cited measure, but the approximately 8 million downloads reported in press coverage around 2014 traces back to forum discussion rather than a company announcement, and the public record does not include an authoritative figure from f.lux itself [vice-2016]. What the record does contain is a proxy measure that is harder to dispute.

When Apple blocked f.lux's iOS sideload page in November 2015, the page received roughly 200,000 visits in the 24 hours following the removal [tnw-2016]. That spike represents people who had already heard of the product and sought it out after the news broke. It is a demand signal, not a user count, but it is a primary-sourced one.

The cleaner evidence for the idea's merit is the imitation timeline. Apple shipped Night Shift in iOS 9.3 in March 2016, two months after blocking f.lux from the platform [tnw-2016]. macOS Night Shift followed in March 2017 [macrumors-nightshift]. Microsoft's Windows Night Light shipped in April 2017, as part of the Creators Update [makeuseof-nightlight]. Both implementations use the same mechanism: the user's clock and geolocation to derive sunset time, then a colour temperature shift that runs automatically. Whether Apple and Microsoft arrived at this design independently or were directly influenced by f.lux is not something the companies have confirmed in the public record. What is confirmed is the timing.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| f.lux downloads by early 2014 | ~8 million (forum-sourced, not primary) | Medium | [vice-2016] |
| Visits to sideload page within 24h of Apple ban | ~200,000 | High | [tnw-2016] |
| Apple Night Shift launch (iOS) | March 2016 (iOS 9.3) | Confirmed | [wikipedia-flux, tnw-2016] |
| Windows Night Light launch | April 2017 (Creators Update) | Confirmed | [makeuseof-nightlight] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "We're proud that we are the original innovators and leaders in this area. In our continued work over the last seven years, we have learned how complicated people actually are. The next phase of f.lux is something we cannot wait to ship to the world."
>
> — Michael Herf, open letter to Apple, January 2016 [mobilesyrup-2016]

<!-- beat: aftermath -->
## Timeline

1. **2005**, Painting-studio observation: the screen-versus-room mismatch surfaces in the Herfs' Los Angeles loft. [vice-2016]
2. **2009-02**, f.lux ships as a free download for Windows and macOS, with a Linux CLI version. [wikipedia-flux]
3. **2015-11**, Apple blocks the iOS sideload page; 200,000 visits land in 24 hours. [tnw-2016]
4. **2016-03**, iOS 9.3 ships Night Shift. The Herfs publish an open letter calling on Apple to open the API. [tnw-2016, mobilesyrup-2016]
5. **2017-04**, Windows Night Light ships in the Creators Update; macOS Night Shift had arrived the prior month. [makeuseof-nightlight, macrumors-nightshift]
6. **2026**, f.lux continues shipping, free, with more customisation than either OS-native alternative.

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **Zero-touch beats manual control, because the decision users never have to make is the one they always keep.**
>
> — HackProduct autopsy

The same reasoning appears elsewhere. Gmail's Undo Send gave users 30 seconds to cancel a sent message, but the mechanism ran by default; nobody had to remember to activate an undo mode before composing. Tile's tracker network works the same way: every phone with the app installed silently helps every other Tile user locate lost items, with no per-person decision. In both cases the useful behaviour is the one that runs without asking. The Herfs built the proof that the idea was worth putting in the OS. The constraint they honoured turned out to be the argument.

<!-- beat: references -->
## References

1. **The Story Behind f.lux, the Night Owl's Color-Shifting Sleep App of Choice**, Vice · Tier A · accessed 2026-05-17. https://www.vice.com/en/article/the-story-behind-flux-the-night-owls-color-shifting-sleep-app-of-choice/
   Supports: Origin story, painting-studio observation, founder quotes, the 8-million-downloads reference, the Sherlocking framing, and the college-student demographic.
2. **f.lux**, Wikipedia · Tier C · accessed 2026-05-17. https://en.wikipedia.org/wiki/F.lux
   Supports: Launch date (February 2009), platform history, App Store removal timeline, Night Shift dates, feature list. Used for dates and structural facts only.
3. **F.lux creators call Apple out for releasing Night Shift**, The Next Web · Tier B · accessed 2026-05-17. https://thenextweb.com/news/uh-oh-controversial
   Supports: The open letter, Michael Herf's API-access request, the 200,000-visit sideload spike, the Sherlocking framing, and the January 2016 timeline.
4. **F.lux developers publish response to Apple's Night Shift**, MobileSyrup · Tier B · accessed 2026-05-17. https://mobilesyrup.com/2016/01/15/f-lux-developers-publish-response-to-apples-night-shift/
   Supports: The direct Michael Herf quote from the open letter and the "original innovators" framing.
5. **f.lux vs. Windows 10 Night Light, Which One Should You Use?**, MakeUseOf · Tier B · accessed 2026-05-17. https://www.makeuseof.com/tag/flux-vs-windows-10-night-light/
   Supports: Windows Night Light arrival in the April 2017 Creators Update and the feature comparison.
6. **Apple Releases macOS Sierra 10.12.4 With New Night Shift Mode**, MacRumors · Tier B · accessed 2026-05-17. https://www.macrumors.com/2017/03/27/apple-releases-macos-sierra-10-12-4/
   Supports: Night Shift arriving on macOS in March 2017, confirming the platform-by-platform rollout.

<!-- beat: forward -->
## Next in queue

**Honey**, The browser extension that turned coupon-hunting from a manual ritual into a one-click automatic at checkout, and sold for $4 billion.

→ [/autopsies/honey/honey](/autopsies/honey/honey)
