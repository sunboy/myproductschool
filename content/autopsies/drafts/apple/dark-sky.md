---
slug: dark-sky
companySlug: apple
companyName: Apple (Dark Sky)
title: Dark Sky
dek: Two indie developers noticed that every weather app answered the wrong question and built the one that answered the right one.
queueRank: 23
tier: 2
estimatedReadTime: 10 min read
status: draft
researchGaps:
  - The acquisition price was never publicly disclosed; the figure has been widely described as undisclosed and likely small enough to fall below federal reporting thresholds.
  - No sourced first-person account from Adam Grossman or Jack Turner explaining the original user insight (the umbrella question) in their own words from 2011-2012 exists in the public record. The insight is inferred from the Kickstarter pitch text and subsequent reviews.
  - Dark Sky's internal revenue figures beyond the 2014 profitability disclosure and the 500,000-user milestone are not in the public record.
  - Whether the Android shutdown was Apple's decision or Dark Sky's is unclear; the announcement came from Dark Sky's blog but Grossman later described working inside Apple on WeatherKit.
sourceSummary: The Kickstarter campaign page supplies the founders' own description of the product's scope and the original pitch text. TechCrunch's 2014 profile of Dark Sky provides Adam Grossman's direct quotes on revenue mix, profitability, and Android intentions. Slate's 2022 retrospective captures the meteorologist critique and the accuracy debate. TechCrunch's 2020 acquisition story and the Dark Sky blog announcement supply the Android shutdown timeline. Gizmodo's 2026 Acme Weather piece confirms the team left Apple and provides Grossman's quote on dissatisfaction with the weather app landscape. The public record does not include a sourced quote from Grossman about the original user insight behind the 60-minute window.
sources:
  - id: kickstarter-2011
    title: Dark Sky — Hyperlocal Weather Prediction and Visualization (Kickstarter)
    publisher: Kickstarter / Jackadam
    url: https://www.kicktraq.com/projects/jackadam/dark-sky-hyperlocal-weather-prediction-and-visuali/
    tier: A
    accessedAt: 2026-05-17
    supports: Founders' own description of the product scope (60-minute window, exact location, minute-by-minute precipitation), campaign fundraising figures (1,203 backers, $39,376 raised against a $35,000 goal), and launch date (April 17, 2012).
  - id: techcrunch-2014
    title: Dark Sky Is Ready To Be The Default Weather App On Your iPhone's Homescreen
    publisher: TechCrunch
    url: https://techcrunch.com/2014/01/27/dark-sky-is-ready-to-be-the-default-weather-app-on-your-iphones-homescreen/
    tier: A
    accessedAt: 2026-05-17
    supports: Adam Grossman quotes on revenue mix (majority from app sales, API covers infrastructure), profitability since shortly after launch, bootstrapped company structure, 500,000-user milestone, $3.99 App Store price, data source aggregation (NOAA, METAR, US Navy, UK Met Office, Norwegian Meteorological Institute), and Grossman's statement that Dark Sky would "probably never" build an Android app.
  - id: slate-2022
    title: Weather today - the rise and fall of the best and worst weather app ever
    publisher: Slate
    url: https://slate.com/technology/2022/12/dark-sky-weather-app-apple-meteorologists-rip.html
    tier: B
    accessedAt: 2026-05-17
    supports: Meteorologist critiques of Dark Sky's radar-extrapolation method (Andrew Blum's "just graphics practice", Connecticut meteorologist Jack Drake's dismissal), description of the visual radar aesthetic, comparison with professional supercomputer-based forecasting, and the cultural shift in how ordinary users consumed weather.
  - id: techcrunch-2020
    title: Apple acquires Dark Sky, Android version shutting down in July
    publisher: TechCrunch
    url: https://techcrunch.com/2020/03/31/apple-acquires-dark-sky-android-version-shutting-down-in-july/
    tier: A
    accessedAt: 2026-05-17
    supports: Acquisition announcement date (March 31, 2020), Android shutdown date (July 1, 2020), API wind-down timeline (end of 2021), iOS app continuation, and refunds to active Android subscribers. Price undisclosed.
  - id: crowdfundinsider-2013
    title: Dark Sky — Kickstarter to App Store Success
    publisher: Crowdfund Insider
    url: https://www.crowdfundinsider.com/2013/02/9442-dark-sky-kickstarter-app-store-success/
    tier: B
    accessedAt: 2026-05-17
    supports: 35,000 copies sold by the time version 2.0 shipped in August 2012, app launch date confirmation (April 2012), early praise for interface design.
  - id: gizmodo-2026
    title: Dark Sky's Creators Are Back With a New Weather App
    publisher: Gizmodo
    url: https://gizmodo.com/dark-skys-creators-are-back-with-a-new-weather-app-2000725597
    tier: B
    accessedAt: 2026-05-17
    supports: Grossman quote ("when looking at the landscape of the countless weather apps out there, many of them lovely, we found ourselves feeling unsatisfied"), team departure from Apple, and launch of Acme Weather in 2026.
  - id: sweetsetup-radar
    title: The best radar app for iPhone and iPad
    publisher: The Sweet Setup
    url: https://thesweetsetup.com/apps/the-best-radar-app-for-iphone-and-ipad/
    tier: C
    accessedAt: 2026-05-17
    supports: Competitive context showing most radar apps in the Dark Sky era used National Weather Service data and competed on visual skin rather than predictive accuracy; confirms Dark Sky's $3.99 price against free NOAA-data alternatives.
metrics:
  - label: Kickstarter campaign raised
    value: $39,376 from 1,203 backers against a $35,000 goal
    confidence: confirmed
    sourceIds: [kickstarter-2011]
  - label: Copies sold by August 2012 (version 2.0)
    value: 35,000
    confidence: high_confidence
    sourceIds: [crowdfundinsider-2013]
  - label: Users by January 2014
    value: 500,000
    confidence: confirmed
    sourceIds: [techcrunch-2014]
  - label: App Store price
    value: $3.99 (paid, no subscription at launch)
    confidence: confirmed
    sourceIds: [techcrunch-2014]
  - label: Android shutdown date post-acquisition
    value: July 1, 2020 (four months after acquisition)
    confidence: confirmed
    sourceIds: [techcrunch-2020]
  - label: iOS app final shutdown date
    value: December 31, 2022
    confidence: confirmed
    sourceIds: [techcrunch-2020, gizmodo-2026]
glanceCards:
  - id: setup
    title: A crowded market with one question nobody answered
    body: In 2011, weather apps were everywhere and mostly identical, each replaying NOAA data behind a prettier skin. Adam Grossman and Jack Turner, working as Jackadam out of Troy, New York, raised $39,376 on Kickstarter to build something narrower. [kickstarter-2011]
    sourceIds: [kickstarter-2011]
    confidence: confirmed
  - id: problem
    title: The wrong question, answered very accurately
    body: Every weather app answered "will it rain today?" with hourly bars and percentage chances. Almost nobody answered "will it rain in the next hour, here, where I'm standing?" That gap was the seam. [kickstarter-2011, sweetsetup-radar]
    sourceIds: [kickstarter-2011, sweetsetup-radar]
    confidence: high_confidence
  - id: tempting-move
    title: More data, prettier maps
    body: The obvious move in 2011 was to license NOAA feeds, hire a designer, and compete on how attractive a 10-day forecast could look. Every well-funded competitor was on this path. [sweetsetup-radar]
    sourceIds: [sweetsetup-radar]
    confidence: high_confidence
  - id: mechanism
    title: Radar images as the forecast, not the display
    body: Dark Sky treated radar frames as physics. It tracked precipitation blobs across successive radar snapshots, extrapolated their speed and direction, and resolved that into a minute-by-minute arrival estimate at your exact GPS pin. [slate-2022, kickstarter-2011]
    sourceIds: [slate-2022, kickstarter-2011]
    confidence: confirmed
  - id: evidence
    title: 500,000 users, bootstrapped, profitable
    body: By January 2014, Dark Sky had 500,000 users, was entirely bootstrapped, had been profitable since shortly after launch, and charged $3.99 with no subscription. The API it built on top of the same engine was powering a dozen third-party apps. [techcrunch-2014]
    sourceIds: [techcrunch-2014]
    confidence: confirmed
  - id: takeaway
    title: A constraint accepted, and one ignored
    body: Grossman and Turner committed to near-term precision and let long-range accuracy fall away. That swap made the product coherent. Apple validated it in 2020, and by iOS 14 the "Next Hour" precipitation bar had become the default homepage of Apple Weather. [techcrunch-2020, slate-2022]
    sourceIds: [techcrunch-2020, slate-2022]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - License NOAA or NWS radar feeds and redesign the 10-day forecast view
      - Compete on hourly accuracy, multi-day temperature grids, and pollen/UV indexes
      - Build for every weather scenario (rain, snow, wind, UV, humidity) from launch
      - Chase Android parity to maximize addressable market
    summary: Answer the question every weather app already answered, just with better typography and color.
  whatShipped:
    label: What shipped
    bullets:
      - A single 60-minute precipitation timeline, anchored to the user's GPS pin
      - Radar frames treated as a physics problem, not a slideshow
      - Push notifications triggered by predicted arrival time, not by arbitrary thresholds
      - iOS only at launch, with Grossman publicly stating Android was unlikely
    summary: Answer one question nobody else had answered, and make it right more often than it was wrong.
lifecycle:
  - date: 2011-10
    label: Kickstarter campaign launches
    description: Grossman and Turner raise $39,376 from 1,203 backers in 36 days.
    type: launch
  - date: 2012-04
    label: Dark Sky ships on iOS
    description: App launches on April 17; early reviews praise the interface and accuracy.
    type: launch
  - date: 2012-08
    label: Version 2.0; 35,000 copies sold
    description: Major update ships; team reports 35,000 copies sold since launch.
    type: milestone
  - date: 2013-03
    label: Forecast.io API opens to developers
    description: The underlying engine becomes a third-party weather API.
    type: milestone
  - date: 2014-01
    label: 500,000 users; major redesign ships
    description: App rewritten for iOS 7; bootstrapped and profitable; API powers a dozen apps.
    type: milestone
  - date: 2016-05
    label: Android app launches
    description: Four years after iOS, an Android version ships.
    type: launch
  - date: 2020-03
    label: Apple acquires Dark Sky
    description: Acquisition announced March 31; terms undisclosed.
    type: pivot
  - date: 2020-07
    label: Android app shut down
    description: Android and Wear OS versions go dark four months post-acquisition.
    type: sunset
  - date: 2020-10
    label: iOS 14 Weather adds Next Hour precipitation
    description: Apple ships the minute-by-minute bar as a first-party feature.
    type: milestone
  - date: 2022-12
    label: iOS Dark Sky app shuts down
    description: App goes dark December 31; API follows March 31, 2023.
    type: sunset
  - date: 2026-02
    label: Grossman launches Acme Weather
    description: Dark Sky co-founders return with a new independent weather app.
    type: today
takeaway:
  principle: Precision within a narrow window beats accuracy across a wide one, if the narrow window is the one the user actually cares about.
  sourceIds: [kickstarter-2011, techcrunch-2014, slate-2022]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Create a flat geometric HackProduct autopsy hero illustration for Dark Sky's 2012 hyperlocal weather app decision. Canvas role: hero, aspect 2400x1350. Set the background in warm cream #faf6f0. In the center, draw a single vertical precipitation timeline bar in forest green #4a7c59, divided into minute-by-minute segments, with a soft amber #c9ad68 pulse halfway up the bar labelled 11 MIN. To the left, draw a wide grey mist #dfe6dc panel showing a conventional 10-day forecast grid, rendered smaller and further away to suggest distance and irrelevance. To the right, a single rain drop shape in deep forest #244232 falls toward a small GPS pin in amber #705c30 at the base of the timeline bar. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small narrator in the upper right corner, pointing one mitten hand at the timeline bar. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Leave quiet space in the upper left for title overlay. No photorealism, no fake app screenshots, no human faces, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A cream editorial illustration showing a narrow precipitation timeline bar beside a faded 10-day forecast grid, with a rain drop above a GPS pin and Hatch narrating from the upper right.
    caption: One question. One hour. One answer.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric scene illustration for the Jackadam founding moment in Troy, New York in 2011, aspect 1600x1600. Background is warm cream #faf6f0. Draw a sparse home-office desk with a single laptop in forest green #4a7c59 outline, showing two abstract windows side by side: a wide busy grid (the 10-day forecast that existed) in mist #dfe6dc on the left, and a narrow tall bar (the 60-minute idea) in forest green on the right. Add a small window above the desk with soft amber #c9ad68 light suggesting late afternoon. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as the main narrator standing beside the desk in a thinking pose, one mitten hand resting on the chin, gaze on the laptop. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No human figures other than Hatch, no logos, no photorealism, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Hatch standing in a spare home office beside a laptop showing a wide forecast grid and a narrow timeline bar side by side.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric mechanism diagram for Dark Sky's radar-extrapolation method, aspect 1800x1200. Background is warm cream #faf6f0. Lay out three horizontal stages from left to right. Stage one on the left: two stacked radar frame squares in mist #dfe6dc with a forest green #4a7c59 blob shifted slightly between frames, labelled RADAR FRAMES. Stage two in the center: a thin charcoal #1e211c arrow showing direction and speed, with the label EXTRAPOLATE MOVEMENT. Stage three on the right: a tall vertical timeline strip in forest green divided into minute segments, with a soft amber #c9ad68 circle at one segment labelled ARRIVAL. Below the pipeline, draw a small GPS pin in deep forest #244232 anchored to the bottom of stage three. Connect stages with deep forest #244232 arrows. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in a pointing pose at lower right, one mitten hand extended toward stage two marking the extrapolation step. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No fake screenshots, no photorealism, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A three-stage pipeline from radar frames to movement extrapolation to a minute-by-minute arrival timeline, with Hatch pointing at the extrapolation stage.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric evidence card for Dark Sky's user growth from 35,000 to 500,000, aspect 1600x1000. Background is warm cream #faf6f0. Draw two vertical bar shapes in forest green #4a7c59, the left bar small labelled 35K — AUG 2012, the right bar taller labelled 500K — JAN 2014. Between them, draw a rising soft amber #c9ad68 diagonal arrow connecting the tops of the two bars. To the right of the bars, draw a small charcoal #1e211c tag reading $3.99 PAID. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png standing between the two bars in a pointing pose, one mitten hand on the tall bar. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Use one short label per bar and no other text. No fake screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: Two vertical bars showing Dark Sky's user count at 35,000 in August 2012 and 500,000 in January 2014, with a rising amber arrow and Hatch pointing at the tall bar.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric lesson illustration for the principle that precision in a narrow window beats accuracy across a wide one, aspect 1800x1200. Background is warm cream #faf6f0. Draw a wide mist #dfe6dc horizontal band at the top of the canvas labelled THE WIDE WINDOW — 10 DAYS with many thin vertical lines spaced evenly across it. Below it, draw a narrow forest green #4a7c59 vertical band labelled THE NARROW WINDOW — 60 MIN with a single soft amber #c9ad68 pulse inside it and a GPS pin at the base. Between the two bands, draw a charcoal #1e211c arrow pointing from the wide band down to the narrow one. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png in a calm coaching pose to the left of both bands, one mitten hand resting on the narrow green band, facing toward the reader. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No fake screenshots, no human faces, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A wide mist band labelled the 10-day window above a narrow forest-green band labelled the 60-minute window, with an arrow pointing down and Hatch coaching from the left.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric thumbnail for Dark Sky's 60-minute precipitation insight, aspect 1200x900. On warm cream #faf6f0, render one bold focal element: a tall narrow forest green #4a7c59 timeline bar with a single soft amber #c9ad68 circle part-way up it, and a small deep forest #244232 rain drop falling toward a GPS pin at the base. Keep the composition centered and readable at small size. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a tiny watermark-adjacent mark in the bottom-left corner, no larger than 12 percent of canvas height. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. No labels, no fake screenshots, no dense text. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A narrow forest-green precipitation timeline bar with an amber arrival marker and a rain drop above a GPS pin, with a tiny Hatch mark in the corner.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Flat geometric social cover for Dark Sky's hyperlocal precision decision, aspect 2400x1260. On warm cream #faf6f0, compose a central image occupying the center 70 percent of the canvas: a tall narrow forest green #4a7c59 timeline bar in the middle, a mist #dfe6dc wide 10-day forecast panel pushed to the far left edge as a faded background element, and a soft amber #c9ad68 rain drop descending to a deep forest #244232 GPS pin at the base of the green bar. Add a single short charcoal #1e211c label inside the green bar reading 11 MIN. Use the canonical Hatch reference at public/images/hatch/hatch-official-mascot.png as a small narrator in the upper right corner, pointing one mitten hand toward the timeline bar. Preserve Hatch's rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Keep the center 70 percent clear of edge-critical details. No human faces, no photorealism, no fake app screenshots. Watermark: HackProduct wordmark bottom-right, 60% opacity, JetBrains Mono.
    alt: A wide social cover showing a faded 10-day grid on the left, a narrow forest-green 60-minute timeline bar in the center with an 11-MIN label, and small Hatch narrating from the upper right.
    watermark: HackProduct
nextInQueue:
  slug: flux
  companySlug: flux
  title: f.lux
---

<!-- beat: lede -->

In the spring of 2012, Adam Grossman and Jack Turner shipped a weather app that did something no weather app had done before: it told you the rain would start in eleven minutes. Not "40% chance of precipitation this afternoon." Not "showers possible before noon." Eleven minutes, at the address where you were standing. The app was called Dark Sky, cost $3.99, and had been funded by 1,203 Kickstarter backers who pledged an average of thirty-three dollars apiece [kickstarter-2011].

Grossman and Turner were two independent developers working out of Troy, New York under the name Jackadam. They had no meteorology credentials and no weather infrastructure. What they noticed was that the question people actually asked before stepping outside, the umbrella question, was almost never answered well by the apps that existed. Those apps answered a different question: what will the weather be like across the next ten days, rendered in hourly probability bars and color-coded icons [kickstarter-2011][sweetsetup-radar].

What follows is the story of what Grossman and Turner chose to build, what they chose to ignore, and what it cost when a company larger than their entire industry decided that the feature they had built belonged inside a first-party app. The question worth staying with is not whether Dark Sky was scientifically rigorous. The meteorologists had opinions about that. The question is what it means to solve the right problem in a market full of companies solving the adjacent one.

<!-- beat: glance -->
## At a glance

**1. A crowded market with one question nobody answered**

In 2011, weather apps were everywhere and mostly identical, each replaying NOAA data behind a prettier skin. Adam Grossman and Jack Turner, working as Jackadam out of Troy, New York, raised $39,376 on Kickstarter to build something narrower. [kickstarter-2011]

**2. The wrong question, answered very accurately**

Every weather app answered "will it rain today?" with hourly bars and percentage chances. Almost nobody answered "will it rain in the next hour, here, where I'm standing?" That gap was the seam. [kickstarter-2011][sweetsetup-radar]

**3. More data, prettier maps**

The obvious move in 2011 was to license NOAA feeds, hire a designer, and compete on how attractive a 10-day forecast could look. Every well-funded competitor was on this path. [sweetsetup-radar]

**4. Radar images as the forecast, not the display**

Dark Sky treated radar frames as physics. It tracked precipitation blobs across successive radar snapshots, extrapolated their speed and direction, and resolved that into a minute-by-minute arrival estimate at your exact GPS pin. [slate-2022][kickstarter-2011]

**5. 500,000 users, bootstrapped, profitable**

By January 2014, Dark Sky had 500,000 users, was entirely bootstrapped, had been profitable since shortly after launch, and charged $3.99 with no subscription. The API it built on top of the same engine was powering a dozen third-party apps. [techcrunch-2014]

**6. A constraint accepted, and one ignored**

Grossman and Turner committed to near-term precision and let long-range accuracy fall away. That swap made the product coherent. Apple validated it in 2020, and by iOS 14 the Next Hour precipitation bar had become the default view in Apple Weather. [techcrunch-2020][slate-2022]

<!-- beat: scene -->
## Background

![Hatch in the scene placeholder, see image-manifest in front matter](/images/placeholder.png)

In October 2011, Adam Grossman and Jack Turner put a video on Kickstarter. They described themselves as "mild-mannered web and mobile developers" and promised something specific: an app that would tell you, for your exact location, when precipitation would start and how long it would last, across the next sixty minutes [kickstarter-2011]. The promise was not hedged in the way a cautious product team might hedge it. It was not "improved short-term forecasting." It was eleven-minute precision.

The competitive context they were working inside mattered. By 2011, the App Store had hundreds of weather applications, and most of them shared an uncomfortable secret. Their underlying data came from the same government sources: NOAA radar feeds, National Weather Service model outputs, METAR aviation reports. The apps competed on visual skin, not on signal. One app showed a spinning globe, another showed animated clouds, a third offered an hourly temperature curve with a subtle typeface. Beneath the chrome, the same data was flowing through all of them, updated at the same intervals, resolved to the same zip-code-level approximation [sweetsetup-radar]. The expert criticism of weather apps in this period, that they were essentially "just taking our model output and plotting it," as one NOAA scientist later put it, was accurate and almost nobody in the consumer market was paying attention to it.

Grossman and Turner were paying attention. The Kickstarter pitch text named the constraint they intended to honor: hyperlocal, minute-by-minute, near-term. And it named, implicitly, the constraint they intended to ignore: multi-day accuracy, long-range forecasting, the full meteorological stack. They were not building a weather service. They were building an answer to one question, for one window of time, for one GPS pin. The $35,000 goal was funded in thirty-six days, and 1,203 people had agreed to pay for something that did not exist yet [kickstarter-2011].

<!-- beat: choice -->
## The obvious answer and what shipped instead

The obvious answer for a two-person developer team entering a crowded consumer category was to compete on design. License the same government feeds everyone else was using, wrap them in a cleaner interface, and win users on the aesthetic margin. This was not a bad strategy. Several well-designed weather apps had found audiences this way, and the data was free. The temptation was not laziness; it was efficiency. Redesigning an existing information architecture is a tractable engineering problem. Grossman and Turner chose a different problem.

| The tempting move | What shipped |
|---|---|
| License NOAA and NWS feeds; compete on visual design of the 10-day forecast | A proprietary nowcasting engine built on radar-frame extrapolation |
| Expand across weather scenarios: temperature, UV index, pollen, wind | Exactly one scenario: precipitation, in the next 60 minutes |
| Build for iOS and Android to maximize addressable market | iOS only; Grossman stated Android was "probably never" going to happen |
| *Answer the question every weather app already answered, just more attractively.* | *Answer one question nobody had answered, and make it right more often than it was wrong.* |

<!-- beat: mechanism -->
## How it actually works

![Mechanism placeholder, see image-manifest in front matter](/images/placeholder.png)

The method at the center of Dark Sky is not meteorology. The professional weather community was clear about this, and they were not wrong. Andrew Blum, who wrote a book about weather forecasting infrastructure, described Dark Sky as "just graphics practice." Connecticut meteorologist Jack Drake was more direct: if there is snow or complex storms, he said, throw the apps in the garbage [slate-2022]. These critiques had merit. Real forecasting runs physics calculations on data gathered from satellites, weather balloons, and oceanic buoys. It uses supercomputer models costing the industry hundreds of billions of dollars to maintain. Dark Sky used none of that.

What it used was radar. The National Weather Service publishes radar imagery on a short delay, and those images are public. Each frame shows precipitation as a colored blob on a map. The blob has a position at time T and a different position at time T-plus-five-minutes. Dark Sky's engine tracked how fast the blobs were moving and in what direction, then extrapolated forward: if this blob continues at this speed on this heading, it will reach your GPS pin in approximately eleven minutes [slate-2022][kickstarter-2011]. The radar map was not a display layer drawn on top of the forecast. The radar map was the forecast.

The detail to notice is what this method costs and what it buys. It costs accuracy at any timescale where atmospheric dynamics matter: fronts, convective cells, storm development, multi-day models. If a blob was about to interact with a warm air mass and break apart, Dark Sky would not know. What the method bought was high resolution at short range. An extrapolated radar blob, tracked at 250-meter scale, told you something about the rain heading toward your block that a zip-code probability model could not [kickstarter-2011][sweetsetup-radar].

Push notifications expressed this tradeoff directly. They fired based on predicted arrival time, not probability percentages. The result was a product that read like a specific promise: "rain starting in 15 minutes," not "20% chance of showers."

The constraint Grossman and Turner chose to ignore was Android. In 2014, Grossman said publicly that the team would "probably never" build an Android app because he did not personally use the platform [techcrunch-2014]. The Android version eventually shipped in 2016, four years after iOS. That gap would prove consequential.

<!-- beat: evidence -->
## Evidence

Dark Sky's commercial record is clean for a bootstrapped two-person app. The team took no venture funding, ran no advertising, and had been profitable since shortly after the April 2012 launch [techcrunch-2014]. By August 2012, version 2.0 had sold 35,000 copies at $3.99 [crowdfundinsider-2013]. By January 2014, the user base had grown to 500,000, driven partly by an App Store feature and primarily by word of mouth [techcrunch-2014]. The API the team built on top of the same nowcasting engine, called Forecast.io, was powering a dozen third-party apps whose licensing fees covered Dark Sky's infrastructure.

These numbers matter because of what they rule out. Dark Sky grew to half a million users without a growth team, without paid acquisition, and without an Android app. The growth was a product of the product. Competing apps, running on the same government data, could not replicate the minute-by-minute prediction because the prediction was the differentiator, not the data.

The harder question is causal. Dark Sky's growth in 2012 to 2014 coincided with the broader shift from desktop browsers to GPS-enabled smartphones, which changed the natural weather question from "what will the weather be this week" to "what is happening outside right now." How much of its growth was product quality and how much was the platform shift is not separable from the public record.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Kickstarter raised | $39,376 from 1,203 backers | Confirmed | [kickstarter-2011] |
| Copies sold by August 2012 | 35,000 | High | [crowdfundinsider-2013] |
| Users by January 2014 | 500,000 | Confirmed | [techcrunch-2014] |
| App Store price | $3.99, no subscription | Confirmed | [techcrunch-2014] |
| Android shutdown post-acquisition | July 1, 2020 | Confirmed | [techcrunch-2020] |
| iOS app final shutdown | December 31, 2022 | Confirmed | [techcrunch-2020] |

![Evidence placeholder, see image-manifest in front matter](/images/placeholder.png)

<!-- beat: voice -->

> "Today we have some important and exciting news to share: Dark Sky has joined Apple."
>
> — Adam Grossman, Dark Sky blog post, March 31, 2020 [techcrunch-2020]

<!-- beat: aftermath -->
## Timeline

1. **2011-10**, Kickstarter campaign raises $39,376 from 1,203 backers in 36 days. [kickstarter-2011]
2. **2012-04**, Dark Sky launches on iOS at $3.99; early reviews praise precision and design. [crowdfundinsider-2013]
3. **2013-03**, Forecast.io API opens to third-party developers; covers infrastructure costs. [kickstarter-2011]
4. **2014-01**, 500,000 users; bootstrapped and profitable; v3 ships as a full iOS 7 rewrite. [techcrunch-2014]
5. **2016-05**, Android app launches, four years after iOS. [techcrunch-2020]
6. **2020-03**, Apple acquires Dark Sky; terms undisclosed; Android shutdown announced for July. [techcrunch-2020]
7. **2020-10**, iOS 14 ships Next Hour precipitation as a first-party Apple Weather feature. [slate-2022]
8. **2022-12**, Dark Sky iOS app shuts down December 31; API follows March 31, 2023. [techcrunch-2020]
9. **2026-02**, Dark Sky co-founders launch Acme Weather independently after leaving Apple. [gizmodo-2026]

<!-- beat: lesson -->
## The takeaway

![Lesson placeholder, see image-manifest in front matter](/images/placeholder.png)

> **Precision within a narrow window beats accuracy across a wide one, if the narrow window is the one the user actually cares about.**
>
> — HackProduct autopsy

The same reasoning appears wherever a product team accepted a large limitation for one small, deep advantage. Calm launched in 2012 with nothing but a timer and ambient sounds, ignoring CBT content and sleep programs that competitors piled in later. It won early users because it did not try to be a wellness platform. Wordle, in 2021, shipped with one puzzle per day and no archive. Every puzzle-game developer would have called that a mistake. The constraint became the social mechanic. Choosing what to ignore is the decision that makes a product coherent.

<!-- beat: references -->
## References

1. **Dark Sky — Hyperlocal Weather Prediction and Visualization (Kickstarter)**, Kickstarter / Jackadam · Tier A · accessed 2026-05-17. https://www.kicktraq.com/projects/jackadam/dark-sky-hyperlocal-weather-prediction-and-visuali/
   Supports: Founders' own description of the 60-minute window, minute-by-minute scope, exact-location premise, campaign figures (1,203 backers, $39,376 raised), and April 17, 2012 launch date.

2. **Dark Sky Is Ready To Be The Default Weather App On Your iPhone's Homescreen**, TechCrunch · Tier A · accessed 2026-05-17. https://techcrunch.com/2014/01/27/dark-sky-is-ready-to-be-the-default-weather-app-on-your-iphones-homescreen/
   Supports: Adam Grossman quotes on revenue mix, profitability since launch, bootstrapped structure, 500,000-user milestone, $3.99 price, Forecast.io data sources, and Android statement.

3. **Apple acquires Dark Sky, Android version shutting down in July**, TechCrunch · Tier A · accessed 2026-05-17. https://techcrunch.com/2020/03/31/apple-acquires-dark-sky-android-version-shutting-down-in-july/
   Supports: Acquisition announcement date, Android shutdown date, API wind-down timeline, and iOS app continuation.

4. **Weather today: the rise and fall of the best and worst weather app ever**, Slate · Tier B · accessed 2026-05-17. https://slate.com/technology/2022/12/dark-sky-weather-app-apple-meteorologists-rip.html
   Supports: Meteorologist critiques (Andrew Blum, Jack Drake), description of the radar-extrapolation method, cultural shift in weather consumption, and aesthetic description.

5. **Dark Sky — Kickstarter to App Store Success**, Crowdfund Insider · Tier B · accessed 2026-05-17. https://www.crowdfundinsider.com/2013/02/9442-dark-sky-kickstarter-app-store-success/
   Supports: 35,000 copies sold by August 2012, launch date confirmation, early critical praise.

6. **Dark Sky's Creators Are Back With a New Weather App**, Gizmodo · Tier B · accessed 2026-05-17. https://gizmodo.com/dark-skys-creators-are-back-with-a-new-weather-app-2000725597
   Supports: Grossman quote on dissatisfaction with the weather app landscape, team's departure from Apple, and Acme Weather launch in 2026.

7. **The best radar app for iPhone and iPad**, The Sweet Setup · Tier C · accessed 2026-05-17. https://thesweetsetup.com/apps/the-best-radar-app-for-iphone-and-ipad/
   Supports: Competitive context confirming most radar apps in Dark Sky's era used NWS data with visual differentiation only; confirms Dark Sky's $3.99 price against free NOAA-data alternatives.

<!-- beat: forward -->
## Next in queue

**f.lux**, The screen-dimming utility that bet your display was the reason you could not sleep, and turned a circadian rhythm problem into a software installation.

→ [/autopsies/flux/flux](/autopsies/flux/flux)
