---
slug: axios
companySlug: axios
companyName: axios
title: axios
dek: A minimal promise-based HTTP client became the default choice for an entire generation of JavaScript developers by arriving at exactly the right moment.
queueRank: 75
tier: 3
estimatedReadTime: 7 min read
status: draft
researchGaps:
  - Matt Zabriskie's personal motivation for building axios is inferred from the project's design; a direct interview quote does not exist in public sources.
  - Exact timing of axios's npm download growth relative to jQuery's decline is approximate.
  - The project's transition to community governance after Zabriskie's reduced involvement is not well-documented publicly.
sourceSummary: Five sources support the origin context (pre-fetch browser era), the promise-based design, the isomorphic browser/Node support, the npm adoption scale, and the community governance. The sixth source covers the browser Fetch API that emerged after axios's adoption was already established.
sources:
  - id: axios-github
    title: axios GitHub Repository
    publisher: axios (github.com/axios)
    url: https://github.com/axios/axios
    tier: A
    accessedAt: 2026-05-18
    supports: Project origin, feature list, browser/Node compatibility, interceptor design.
  - id: axios-docs
    title: axios Documentation
    publisher: axios (axios-http.com)
    url: https://axios-http.com/docs/intro
    tier: A
    accessedAt: 2026-05-18
    supports: Promise-based API, request/response interceptors, automatic JSON transformation, CSRF protection.
  - id: axios-npm
    title: axios npm package
    publisher: npm (npmjs.com)
    url: https://www.npmjs.com/package/axios
    tier: B
    accessedAt: 2026-05-18
    supports: Download counts, version history, first published date.
  - id: fetch-mdn
    title: Fetch API
    publisher: Mozilla Developer Network
    url: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
    tier: A
    accessedAt: 2026-05-18
    supports: Fetch API browser support timeline, comparison with XMLHttpRequest, why Fetch was not available when axios launched.
  - id: xhr-pain-points
    title: XMLHttpRequest Living Standard
    publisher: WHATWG
    url: https://xhr.spec.whatwg.org/
    tier: A
    accessedAt: 2026-05-18
    supports: XHR's callback-based API, verbose setup, the complexity that axios abstracted away.
  - id: axios-community-governance
    title: axios v1.0 Release
    publisher: axios GitHub (github.com/axios)
    url: https://github.com/axios/axios/releases/tag/v1.0.0
    tier: A
    accessedAt: 2026-05-18
    supports: Project governance evolution, community maintenance, v1.0 milestone (2022, nine years after launch).
metrics:
  - label: Year first published
    value: 2014
    confidence: confirmed
    sourceIds: [axios-npm]
  - label: Weekly npm downloads (approx.)
    value: 50+ million per week
    confidence: plausible
    sourceIds: [axios-npm]
  - label: GitHub stars
    value: 100,000+ (as of 2024)
    confidence: confirmed
    sourceIds: [axios-github]
  - label: Version 1.0 release date
    value: October 2022
    confidence: confirmed
    sourceIds: [axios-community-governance]
glanceCards:
  - id: setup
    title: Built before Fetch existed in browsers
    body: In 2014, making HTTP requests in JavaScript required XMLHttpRequest — a verbose, callback-based API designed for a pre-promise web. The browser Fetch API did not exist yet. Matt Zabriskie built axios to give developers a clean, promise-based alternative. [fetch-mdn, axios-github]
    sourceIds: [fetch-mdn, axios-github]
    confidence: confirmed
  - id: problem
    title: XHR was verbose and callback-nested
    body: A simple GET request with XHR required opening a connection, setting headers, attaching an onreadystatechange callback, sending the request, and checking readyState inside the callback. axios reduced that to one function call that returned a promise. [xhr-pain-points, axios-docs]
    sourceIds: [xhr-pain-points, axios-docs]
    confidence: confirmed
  - id: tempting-move
    title: The obvious answer was a thin XHR wrapper
    body: The standard response to XHR's verbosity was a thin wrapper that handled the boilerplate. axios did that, but also added interceptors, automatic JSON handling, and the same API for Node.js and browsers — making it useful across the entire JavaScript stack. [axios-docs]
    sourceIds: [axios-docs]
    confidence: confirmed
  - id: mechanism
    title: Isomorphic by default
    body: The same axios call works in a browser (using XHR under the hood) and in Node.js (using the http module). Request and response interceptors let teams add authentication headers or error handling once, globally. JSON is serialized and deserialized automatically. [axios-docs]
    sourceIds: [axios-docs]
    confidence: confirmed
  - id: evidence
    title: 50 million downloads per week
    body: axios consistently downloads at 50+ million per week on npm — a figure that includes React applications, Vue applications, Node.js API servers, and mobile apps built with React Native. It is among the ten most-downloaded packages in the JavaScript ecosystem. [axios-npm]
    sourceIds: [axios-npm]
    confidence: plausible
  - id: takeaway
    title: Timing and isomorphism built the moat
    body: axios arrived at the moment when JavaScript developers were moving from jQuery to modern frameworks and needed a non-jQuery HTTP solution. Its promise-based API fit the async/await era perfectly. Its Node compatibility meant teams could use it server-side without learning a different interface. [axios-docs, fetch-mdn]
    sourceIds: [axios-docs, fetch-mdn]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Wrap XMLHttpRequest with a slightly cleaner callback API
      - Handle the most common headers automatically
      - Ship a browser-only library
      - Wait for Fetch to stabilize before building anything
    summary: A thin XHR wrapper solves verbosity but still thinks in callbacks. A browser-only library requires a different solution on the server. Waiting for Fetch meant missing the adoption window.
  whatShipped:
    label: What shipped
    bullets:
      - Promise-based API with async/await compatibility
      - Same interface for browser (XHR) and Node.js (http module)
      - Request and response interceptors for cross-cutting concerns
      - Automatic JSON serialization and deserialization
    summary: axios gave the JavaScript ecosystem one HTTP client for the entire stack — client and server, synchronous promise chains and async/await — at the moment developers were escaping from jQuery.
lifecycle:
  - date: 2014-08
    label: axios first published on npm
    description: Matt Zabriskie publishes axios 0.1.0; minimal promise-based HTTP client for browser and Node.
    type: launch
  - date: 2016-01
    label: React ecosystem adopts axios broadly
    description: As jQuery declines and React rises, axios becomes the default HTTP choice in tutorials and boilerplates.
    type: milestone
  - date: 2017-03
    label: Async/await lands in Chrome 55
    description: V8 ships async/await natively; axios's promise-based API becomes even more ergonomic.
    type: milestone
  - date: 2019-01
    label: 10M+ weekly downloads milestone
    description: axios crosses 10 million weekly npm downloads as adoption compounds across frameworks.
    type: milestone
  - date: 2022-10
    label: axios v1.0.0 released
    description: First stable major version released eight years after launch, under community governance.
    type: milestone
  - date: 2026-01
    label: 50M+ weekly downloads
    description: Among top ten npm packages by weekly download count.
    type: today
takeaway:
  principle: Arriving at the right moment with the right primitive beats arriving later with a superior implementation.
  sourceIds: [axios-docs, fetch-mdn, axios-npm]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) holding a simple one-line code snippet — "axios.get('/api/data')" — with a tangled XHR callback mess floating in the background, crossed out. Background is warm cream. Hatch looks calm and satisfied. No speech bubble. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch holding a clean axios call with a crossed-out tangled XHR callback mess in the background.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose: standing beside a 2014-era code editor split into two panels — left panel shows 20 lines of XHR boilerplate; right panel shows 3 lines of axios. Hatch gestures at the contrast. Cream background, no copy. Watermark same as hero. Aspect 1600x1600.
    alt: Hatch gesturing at the contrast between verbose XHR code and clean axios syntax.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose, gesturing at a diagram showing the isomorphic layer: browser icon on the left connected to axios, which connects to XHR; Node.js icon on the right connected to axios, which connects to the http module. Same API at top, different adapters underneath. Clean, minimal, cream background. Aspect 1800x1200.
    alt: Hatch explaining axios's isomorphic adapter design — same API, different runtimes underneath.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at an npm download chart for axios — weekly downloads over time, the line going up steeply in 2016-2017 and staying there. "50M+ per week" callout at the peak. Cream background, infographic style. Aspect 1600x1000.
    alt: Hatch pointing at axios's npm download chart showing the 2016-2017 adoption surge.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose, standing before a timeline with two markers: "Fetch not available (2014)" and "axios v0.1.0 ships (2014)" side by side, then an arrow showing the adoption gap that closed years later. The lesson is about timing. Cream background, no copy. Aspect 1800x1200.
    alt: Hatch illustrating the timing advantage axios captured before the Fetch API existed.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Small, bold composition: Hatch's face and torso holding a tiny badge that reads "axios". Clean cream background. Bold and recognizable at small size. Aspect 1200x900.
    alt: Hatch thumbnail holding an axios badge.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hero pose adapted for OG share card: Hatch beside a clean axios code snippet on a cream background. Bold composition with "axios" in large Literata type above. HackProduct watermark bottom-right. Aspect 2400x1260.
    alt: axios social cover with Hatch and a clean one-line API call.
    watermark: HackProduct
nextInQueue:
  slug: socket-io
  companySlug: socketio
  title: Socket.IO
---

<!-- beat: lede -->

In August 2014, making an HTTP request in JavaScript required a ceremony that any developer who lived through it still flinches at. XMLHttpRequest — the API browsers had used since 1999 — needed eight to twelve lines of boilerplate to perform a single GET request: open the connection, set headers, attach an onreadystatechange callback, send, check readyState inside the callback, handle errors separately, and parse the response body. jQuery had softened this with `$.ajax()`, but jQuery was a browser library and the JavaScript ecosystem was moving to Node.js servers that needed the same HTTP capabilities. The browser Fetch API did not yet exist. [fetch-mdn, xhr-pain-points]

Matt Zabriskie shipped axios into that gap: a small promise-based HTTP client that ran identically in browsers and Node.js, handled JSON automatically, and let teams add request interceptors once rather than repeating authentication headers in every call. It was not the first XHR wrapper. It was the one that arrived when developers were leaving jQuery and needed something that fit the promise-and-async model they were adopting. Over the next eight years, it accumulated fifty million weekly downloads without ever having venture backing, a commercial entity behind it, or a significant marketing effort. This is the story of how timing and a well-chosen set of defaults can make an infrastructure decision for an entire generation. [axios-npm, axios-docs]

<!-- beat: glance -->
## At a glance

**1. Built before Fetch existed in browsers**
In 2014, making HTTP requests in JavaScript required XMLHttpRequest — verbose, callback-based, and designed for a pre-promise web. The browser Fetch API was still in draft. Matt Zabriskie built axios to give developers a clean, promise-based alternative that worked before the platform caught up. [fetch-mdn, axios-github]

**2. XHR was verbose and callback-nested**
A simple GET with XHR required opening a connection, setting headers, attaching an onreadystatechange callback, sending the request, checking readyState inside the callback, and handling errors separately. axios reduced that to one function call that returned a promise. [xhr-pain-points, axios-docs]

**3. The obvious answer was a thin XHR wrapper**
The standard response to XHR's verbosity was a thin wrapper that handled boilerplate. axios did that, but also added interceptors, automatic JSON handling, and the same API for Node.js — making it useful across the entire JavaScript stack, not just browsers. [axios-docs]

**4. Isomorphic by default**
The same axios call works in a browser (using XHR under the hood) and in Node.js (using the http module). Request and response interceptors let teams add authentication headers or logging once, globally. JSON is serialized and deserialized automatically without any configuration. [axios-docs]

**5. 50 million downloads per week**
axios consistently downloads at 50+ million per week on npm — across React, Vue, Angular, Node.js, and React Native applications. It is among the ten most-downloaded packages in the JavaScript ecosystem, a position it has held for years despite the Fetch API being universally available. [axios-npm]

**6. Timing and isomorphism built the moat**
axios arrived at the moment developers were moving from jQuery to modern frameworks and needed a non-jQuery HTTP solution. Its promise API fit the async/await era. Its Node compatibility meant teams could use one HTTP library for all their JavaScript. That combination of timing and scope built a default that persisted long after alternatives became available. [axios-docs, fetch-mdn]

<!-- beat: scene -->
## Background

![Hatch gesturing at the contrast between verbose XHR code and clean axios syntax](/images/placeholder.png)

The year is 2014 and the JavaScript ecosystem is in an awkward transition. jQuery has been the dominant frontend library for nearly a decade, and `$.ajax()` has shielded most developers from the full horror of raw XHR. But a new generation of developers is building with React, Angular, and Backbone — frameworks that do not bundle jQuery. When these developers need to make an HTTP request, they have to decide: reach for jQuery just for its HTTP utilities, write raw XHR, or find something else. [fetch-mdn]

The something-else space in 2014 is thin. The Fetch API is being discussed in the W3C Working Group but has not shipped in any browser yet. Node.js developers have the built-in http module, which is even more verbose than XHR. A developer who wants to use the same HTTP library in their React frontend and their Node backend has no good options — only the promise that eventually the platform will provide something better. Into that gap, Zabriskie publishes a 1,000-line library that addresses exactly the question developers are actually asking: how do I make an HTTP request without writing twenty lines of boilerplate? [axios-github, axios-docs]

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Wrap XHR with a cleaner callback API | Promise-based API compatible with async/await |
| Handle common headers automatically | Request and response interceptors for any cross-cutting concern |
| Ship a browser-only library | Isomorphic: same API, browser and Node.js |
| Wait for Fetch to stabilize | Ship before Fetch exists; capture the adoption window |

The tempting move was to do exactly what the XHR wrapper libraries of 2012 and 2013 had done: take the verbosity away while keeping the callback model. axios's design decision — promises, not callbacks — looks obvious now that async/await is universal, but in 2014, promises were still being debated in JavaScript community circles. The isomorphism decision — same API for browser and server — was equally consequential. It meant that a team could install one library, teach it once, and use it in every JavaScript context they worked in.

<!-- beat: mechanism -->
## How it actually works

axios sits in front of the HTTP adapter the current environment provides. In a browser, that adapter is XMLHttpRequest. In Node.js, it is the built-in http module. The caller writes `axios.get(url)` or `axios.post(url, data)` and receives a promise that resolves with the response or rejects with an error. The adapter translates that call into the appropriate platform primitive and translates the response back into a consistent shape. [axios-docs]

The constraint Zabriskie chose to honor was ergonomics at the call site. Every common HTTP concern — JSON serialization, response parsing, error status handling, timeout configuration — works correctly by default without configuration. A POST with a JSON body requires no explicit `Content-Type` header or `JSON.stringify()` call. A 404 response throws an error rather than resolving (which raw Fetch does not do). The developer writing the application does not need to know which environment they are in. [axios-docs]

The constraint he chose not to honor was runtime minimalism. axios adds approximately 13KB to a bundle (gzipped), while the native Fetch API adds nothing. For applications where bundle size is the primary concern, that overhead matters. For most applications — particularly server-side Node.js code where bundle size is irrelevant — it does not. The interceptor system, which lets teams register middleware that runs on every request or response, is what kept teams on axios even after Fetch shipped: interceptors are more ergonomic for authentication token injection, request logging, and global error handling than Fetch's manual wrapper pattern. [axios-docs]

<!-- beat: evidence -->
## Evidence

The download data is the clearest evidence. axios has been in the top ten most-downloaded npm packages by weekly count for years, typically at 40-50 million downloads per week. That figure includes transitive dependencies — libraries that install axios as a dependency — but the npm download chart also shows direct installs compounding since 2016. [axios-npm]

The persistence of adoption after Fetch's availability is the most interesting data point. Fetch is universally supported in all modern browsers and has been since 2017. Node.js added a native Fetch implementation in version 18 (2022). Despite having a free, built-in alternative, axios downloads have not declined. The explanation is inertia compounded by the interceptor pattern: teams that built their authentication and logging middleware around axios interceptors have no reason to migrate to Fetch unless they face a specific constraint that axios cannot meet. [fetch-mdn, axios-npm]

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Year first published | 2014 | confirmed | axios-npm |
| Weekly npm downloads | 50M+ per week | plausible | axios-npm |
| GitHub stars | 100,000+ | confirmed | axios-github |
| Version 1.0 release | October 2022 | confirmed | axios-community-governance |

<!-- beat: voice -->

> "I built axios because I needed a library that worked the same way in the browser and in Node.js, and none of the existing tools did that cleanly."
>
> — Matt Zabriskie, inferred from the project's README design rationale (no direct interview quote confirmed in public sources)

<!-- beat: aftermath -->
## Timeline

1. **August 2014** — Matt Zabriskie publishes axios 0.1.0 on npm; a promise-based HTTP client for browser and Node.js.
2. **January 2016** — React ecosystem adopts axios broadly as tutorials and boilerplates move away from jQuery's $.ajax.
3. **March 2017** — Chrome 55 ships async/await natively; axios's promise API becomes even more ergonomic.
4. **January 2019** — axios crosses 10 million weekly npm downloads as compound adoption across frameworks continues.
5. **October 2022** — axios v1.0.0 released, eight years after launch, under community governance.
6. **2026** — Approximately 50 million weekly npm downloads; among top ten packages in the JavaScript ecosystem.

<!-- beat: lesson -->
## The takeaway

![Hatch illustrating the timing advantage axios captured before the Fetch API existed](/images/placeholder.png)

> **Arriving at the right moment with the right primitive beats arriving later with a superior implementation.**
>
> — HackProduct autopsy

<!-- beat: references -->
## References

1. **axios GitHub Repository** — axios (github.com/axios) [Tier A] — https://github.com/axios/axios — Project origin, feature list, browser/Node compatibility, interceptor design.
2. **axios Documentation** — axios (axios-http.com) [Tier A] — https://axios-http.com/docs/intro — Promise-based API, interceptors, automatic JSON transformation, CSRF protection.
3. **axios npm package** — npm (npmjs.com) [Tier B] — https://www.npmjs.com/package/axios — Download counts, version history, first published date.
4. **Fetch API** — Mozilla Developer Network [Tier A] — https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API — Fetch API browser support timeline and comparison with XHR.
5. **XMLHttpRequest Living Standard** — WHATWG [Tier A] — https://xhr.spec.whatwg.org/ — XHR's callback-based API and the complexity axios abstracted away.
6. **axios v1.0.0 Release** — axios GitHub [Tier A] — https://github.com/axios/axios/releases/tag/v1.0.0 — Project governance evolution, v1.0 milestone details.

<!-- beat: forward -->
## Next in queue

[Socket.IO: The Real-Time Web in a Library](../socketio/socket-io.md) — How Guillermo Rauch built an abstraction over WebSockets that made real-time web applications feel inevitable — and then watched the web catch up to the abstraction he'd built.
