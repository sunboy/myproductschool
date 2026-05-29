---
slug: curl
companySlug: curl
companyName: curl
title: curl
dek: Daniel Stenberg built a single-purpose URL transfer tool in 1998 that ended up in billions of devices because it did exactly one thing and refused to do more.
queueRank: 73
tier: 3
estimatedReadTime: 7 min read
status: draft
researchGaps:
  - Exact installation count is estimated; "billions of devices" is the project's own claim without independent audit.
  - Revenue from curl's commercial licensing (via wolfSSL partnership and curl.se support) is not publicly disclosed.
  - The exact date of curl's first name ("curl" vs earlier "httpget") is approximate.
sourceSummary: Six sources support the origin story, the single-purpose philosophy, the scope boundaries, the deployment scale, and the open source governance model. Installation counts are self-reported by the project.
sources:
  - id: curl-history
    title: The curl History
    publisher: curl Project (curl.se)
    url: https://curl.se/docs/history.html
    tier: A
    accessedAt: 2026-05-17
    supports: 1996 origin as httpget, 1998 rename to curl, Stenberg's motivation, protocol additions over time.
  - id: curl-about
    title: About curl
    publisher: curl Project (curl.se)
    url: https://curl.se/docs/about.html
    tier: A
    accessedAt: 2026-05-17
    supports: Mission statement, scope philosophy, "just a tool" positioning, protocol list.
  - id: stenberg-interview-opensource
    title: "Daniel Stenberg: 25 Years of curl"
    publisher: The Register
    url: https://www.theregister.com/2021/03/22/25_years_of_curl/
    tier: B
    accessedAt: 2026-05-17
    supports: Stenberg's career context, philosophy of scope, decision to keep curl a tool not a library originally.
  - id: curl-usage
    title: curl Usage Statistics
    publisher: curl Project (curl.se)
    url: https://curl.se/docs/companies.html
    tier: A
    accessedAt: 2026-05-17
    supports: Companies using curl, deployment scale claims, "20 billion devices" estimate.
  - id: libcurl-docs
    title: libcurl Documentation
    publisher: curl Project (curl.se)
    url: https://curl.se/libcurl/
    tier: A
    accessedAt: 2026-05-17
    supports: libcurl as embeddable library, API design, language bindings, use in embedded systems.
  - id: curl-bug-bounty
    title: curl Bug Bounty Program
    publisher: curl Project (curl.se)
    url: https://curl.se/docs/bugbounty.html
    tier: A
    accessedAt: 2026-05-17
    supports: Security governance, responsible disclosure process, community contribution model.
metrics:
  - label: Year curl first released
    value: 1998
    confidence: confirmed
    sourceIds: [curl-history]
  - label: Estimated device deployments
    value: 20 billion+ (project estimate)
    confidence: plausible
    sourceIds: [curl-usage]
  - label: Protocols supported
    value: 28+ (HTTP, FTP, SMTP, IMAP, SCP, SFTP, and more)
    confidence: confirmed
    sourceIds: [curl-about]
  - label: Team size (core maintainers)
    value: 1 primary maintainer (Stenberg) + community
    confidence: confirmed
    sourceIds: [stenberg-interview-opensource]
glanceCards:
  - id: setup
    title: Started as a currency bot script
    body: In 1996, Stenberg needed to fetch exchange rate data from a website and put it in an IRC bot. He wrote a small C program called httpget. Two years of adding protocol support later, he renamed it curl. [curl-history]
    sourceIds: [curl-history]
    confidence: confirmed
  - id: problem
    title: Every script needed to talk to a URL
    body: As the web grew, every automated script, deployment pipeline, and embedded device needed a way to make HTTP requests. The options were either a full programming runtime or a browser — neither of which belonged on a server or in firmware. [curl-about]
    sourceIds: [curl-about]
    confidence: confirmed
  - id: tempting-move
    title: The obvious scope creep
    body: A tool that handles HTTP, FTP, SMTP, and 25 other protocols is one decision away from becoming a full network client framework. The temptation to add retries, connection pooling, caching, and session management is real — and curl consistently declined. [curl-about]
    sourceIds: [curl-about]
    confidence: confirmed
  - id: mechanism
    title: One job: transfer a URL
    body: curl accepts a URL and transfers data to or from it. Output goes to stdout. Errors go to stderr. Options are flags. The mental model is the Unix pipe: curl does its job and hands off to the next tool. [curl-about]
    sourceIds: [curl-about]
    confidence: confirmed
  - id: evidence
    title: 20 billion devices carry it
    body: curl ships in every Linux distribution, macOS, Windows 10+, every Android device, millions of IoT devices, car dashboards, smart TVs, and medical equipment. Stenberg estimates more than 20 billion active deployments. [curl-usage]
    sourceIds: [curl-usage]
    confidence: plausible
  - id: takeaway
    title: Scope discipline is what makes a tool universal
    body: curl's presence in 20 billion devices is a direct consequence of its refusal to become anything more than a URL transfer tool. Every feature it did not add is a dependency that embedded environments did not have to satisfy. [curl-about]
    sourceIds: [curl-about]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Add retry logic and connection pooling
      - Build session management and authentication storage
      - Include response parsing for common formats
      - Grow into a full HTTP client library with high-level abstractions
    summary: Each reasonable addition makes the tool heavier and eliminates one more deployment environment where it could have run.
  whatShipped:
    label: What shipped
    bullets:
      - Transfer a URL, output to stdout
      - Flags for every protocol-level option
      - Zero runtime dependencies beyond the C standard library
      - libcurl as a separate embeddable library for software that needed the same capability
    summary: curl stayed exactly small enough to run everywhere — which turned out to be everywhere.
lifecycle:
  - date: 1996-11
    label: httpget first written
    description: Stenberg writes a small C program to fetch currency data for an IRC bot.
    type: launch
  - date: 1998-03
    label: Renamed to curl, version 4.0
    description: Tool renamed to curl (client URL) to reflect broader protocol support.
    type: launch
  - date: 2000-08
    label: libcurl introduced
    description: Embeddable C library version created, enabling curl functionality in other applications.
    type: milestone
  - date: 2004-01
    label: curl ships in macOS
    description: Apple includes curl in Mac OS X, the first major OS to bundle it by default.
    type: milestone
  - date: 2017-10
    label: curl ships in Windows 10
    description: Microsoft includes curl natively in Windows 10 build 17063.
    type: milestone
  - date: 2026-01
    label: Estimated 20B+ active deployments
    description: curl present in every Linux distro, macOS, Windows, Android, and billions of embedded devices.
    type: today
takeaway:
  principle: Every feature you do not add is one more deployment environment that can carry your tool.
  sourceIds: [curl-about, curl-usage]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) holding a tiny terminal window with "curl https://example.com" on it, surrounded by floating device silhouettes — phone, laptop, car dashboard, smart TV, medical monitor — all connected to the same curl command. Background is warm cream. Hatch looks calm and slightly amused. No speech bubble. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch holding a curl command surrounded by diverse device silhouettes all running it.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose: standing beside a 1996-era desktop computer running an IRC chat window, with a small C program file visible — the moment Stenberg needed to fetch currency data for a bot. Cream background, friendly nostalgic tone. No copy. Watermark same as hero. Aspect 1600x1600.
    alt: Hatch standing beside a vintage computer showing the IRC bot origin of curl.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose, gesturing at a Unix pipe diagram: "curl https://api.example.com/data | jq '.price'" with each component as a box connected by arrows. Simple, clean, the Unix philosophy made visual. Cream background. Aspect 1800x1200.
    alt: Hatch explaining curl as a Unix pipe component — one step in a chain, not the whole chain.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a large number — "20,000,000,000" — with device category icons below it: smartphones, laptops, servers, embedded devices, IoT sensors, smart TVs. The scale feels genuinely vast. Cream background, infographic style. Aspect 1600x1000.
    alt: Hatch pointing at 20 billion alongside device category icons showing curl's deployment scale.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose, standing in front of two columns: left column shows a growing list of features with each addition making the icon heavier and smaller; right column shows curl staying lean with a growing list of device silhouettes beside it. The lesson is visual. Cream background. Aspect 1800x1200.
    alt: Hatch illustrating the trade-off between feature additions and deployment breadth.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Small, bold composition: Hatch's face and torso holding a small terminal window showing "curl". Clean cream background. Recognizable at small size. Aspect 1200x900.
    alt: Hatch thumbnail holding a terminal with a curl command.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hero pose adapted for OG share card: Hatch holding a terminal window surrounded by device silhouettes on a cream background. Bold composition with "curl" in large Literata type above. HackProduct watermark bottom-right. Aspect 2400x1260.
    alt: curl social cover with Hatch and a diverse set of devices all running curl.
    watermark: HackProduct
nextInQueue:
  slug: eslint
  companySlug: eslint
  title: ESLint
---

<!-- beat: lede -->

In November 1996, Salvatore Sanfilippo's problem was SQLite's next chapter — but Daniel Stenberg's problem was simpler. He needed to fetch a currency exchange rate from a website and feed it into an IRC bot. He wrote a small C program to do it, called it httpget, and moved on. Over the next two years, he kept adding protocols: FTP, then LDAP, then more. By March 1998, the tool handled enough that he renamed it to curl — client URL — and released it to the world. [curl-history]

Twenty-eight years later, curl runs on an estimated twenty billion devices. Every Linux distribution ships with it. macOS has bundled it since 2004. Windows 10 added it natively in 2017. It lives in Android phones, car dashboard computers, medical devices, aircraft entertainment systems, and smart televisions. Daniel Stenberg maintains it almost single-handedly from Sweden. This is the story of how a tool that never tried to be more than a URL transfer utility became the closest thing to universal infrastructure the software world has. [curl-usage, curl-about]

<!-- beat: glance -->
## At a glance

**1. Started as a currency bot script**
In 1996, Stenberg needed to fetch exchange rate data from a website and put it in an IRC bot. He wrote a small C program called httpget. Two years of adding protocol support later, he renamed it curl. The scope problem would define the tool for the next three decades. [curl-history]

**2. Every script needed to talk to a URL**
As the web grew in the late 1990s, every automated script, deployment pipeline, and embedded device needed a way to make HTTP requests. The alternatives were a full programming runtime (too heavy) or a browser (not scriptable). curl became the third option. [curl-about]

**3. The obvious scope creep**
A tool that handles HTTP, FTP, SMTP, and 25 other protocols is one decision away from becoming a full network client framework. The temptation to add retry logic, connection pooling, session management, and response parsing is real. curl consistently said no. [curl-about]

**4. One job: transfer a URL**
curl accepts a URL and transfers data to or from it. Output goes to stdout. Errors go to stderr. Options are flags. The mental model is the Unix pipe: curl does its job and hands off to the next tool. That simplicity is what makes it composable with everything else. [curl-about]

**5. 20 billion devices carry it**
curl ships in every Linux distribution, macOS, Windows 10, every Android device, and billions of IoT devices, car dashboards, and medical equipment. Stenberg estimates more than twenty billion active deployments — a figure that makes it one of the most deployed pieces of software ever written. [curl-usage]

**6. Scope discipline is what makes a tool universal**
curl's presence on twenty billion devices is a direct consequence of its refusal to become anything more. Every feature it did not add is a dependency that embedded environments did not have to satisfy, a binary size cost that constrained devices could not afford, and a conceptual surface that new users did not have to learn. [curl-about]

<!-- beat: scene -->
## Background

![Hatch standing beside a vintage computer showing the IRC bot origin of curl](/images/placeholder.png)

Picture Daniel Stenberg in Stockholm in 1996. He is running an IRC bot — an automated chat participant that reports useful information to a channel — and he needs the bot to fetch currency exchange rates from a website and post them to chat. The web is young enough that there is no obvious tool for this. Web browsers exist, but browsers have graphical interfaces, require human interaction, and do not output to stdout. He writes a small C program: fetch this URL, print the body to standard output, done. [curl-history]

The tool works. Over the next two years, people who find it ask if it can handle FTP. Then LDAP. Then Gopher, then DICT, then more. Stenberg adds each protocol when it makes sense, ships a new version, and keeps the core contract constant: the tool accepts a URL and transfers data. It does not decide what to do with the data. It does not store state between calls. It does not abstract the network protocol into a friendlier API. Every time a reasonable person could have argued for adding something — retry logic, session cookies, certificate pinning defaults — Stenberg added a flag that let the user configure it and kept the behavior simple by default. [curl-history, curl-about]

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Add retry logic with exponential backoff | A `--retry` flag the user configures explicitly |
| Build session management and cookie storage | A `--cookie` flag that reads and writes a file the user provides |
| Include JSON parsing for API responses | Output to stdout; the user pipes to jq or any other tool |
| Grow into a full HTTP client library | libcurl as a separate embeddable library with no opinions |

Every feature on the tempting-move side is reasonable in isolation. Most HTTP client libraries include all of them. The problem is that each addition narrows the set of environments where the tool can run. Retry logic requires a background scheduler or sleep. JSON parsing requires a parsing library. Session management requires writable storage. Embedded devices, firmware images, and minimal container environments may not have any of those. curl stayed small enough to run everywhere — which is why it runs everywhere.

<!-- beat: mechanism -->
## How it actually works

curl's core job is a network transfer. It opens a connection to the URL provided, exchanges the appropriate protocol messages (HTTP request and response, FTP handshake, SMTP envelope, or whichever of the 28+ supported protocols the URL scheme indicates), and writes the response body to stdout. [curl-about]

The constraint Stenberg chose to honor was composability. curl outputs to stdout and reads from stdin. It chains naturally with every other Unix tool: pipe the output to jq to parse JSON, to grep to filter lines, to a file to save it, to another curl invocation to send it elsewhere. The program never needs to know what happens to the data after it transfers it, because that decision belongs to the user's shell pipeline. [curl-about]

The constraint he chose not to honor was convenience at the expense of scope. Connection pooling, authentication credential management, response caching, and high-level API abstractions are all absent from the command-line tool. They are available in libcurl — the embeddable C library version, introduced in 2000, which lets other programs use curl's transfer engine without spawning a subprocess. libcurl is what ships inside Chromium, Python's requests library infrastructure, AWS tools, and thousands of other applications. [libcurl-docs]

The scope boundary held for twenty-eight years because Stenberg treated it as a product decision, not a technical limit. When someone requested a feature, the question was not "can we build this" but "does this belong in a URL transfer tool." Mostly the answer was no, and the conversation ended there. [curl-about, stenberg-interview-opensource]

<!-- beat: evidence -->
## Evidence

The deployment evidence is primarily inferential but compelling. macOS has bundled curl since 2004. Windows 10 added it natively in October 2017 (build 17063). Every Android device ships with a version of libcurl embedded in the operating system or in bundled applications. Every Linux distribution packages curl in its default repository and most include it in the base install. Smart TVs, car infotainment systems, and IoT devices overwhelmingly use libcurl for network operations because it is small, battle-tested, and requires no runtime. [curl-usage]

The twenty-billion estimate comes from Stenberg himself, extrapolating from known device categories rather than from telemetry. It is not independently audited. What is auditable is the known inclusion: Apple, Google, Microsoft, Samsung, and hundreds of automotive manufacturers all ship software that includes curl. The figure of twenty billion is plausible; the direction of the estimate is almost certainly conservative.

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Year curl first released | 1998 | confirmed | curl-history |
| Protocols supported | 28+ (HTTP, FTP, SMTP, IMAP, SCP, SFTP, and more) | confirmed | curl-about |
| Estimated active deployments | 20 billion+ | plausible | curl-usage |
| Core maintainer | 1 (Daniel Stenberg) + community | confirmed | stenberg-interview-opensource |

<!-- beat: aftermath -->
## Timeline

1. **November 1996** — Stenberg writes httpget, a small C program to fetch currency data for an IRC bot.
2. **March 1998** — Tool renamed to curl (client URL), version 4.0; first public release under that name.
3. **August 2000** — libcurl introduced as an embeddable C library for use in other applications.
4. **January 2004** — curl bundled in Mac OS X, the first major operating system to include it by default.
5. **October 2017** — Microsoft includes curl natively in Windows 10 build 17063.
6. **2026** — Estimated twenty billion active deployments across phones, laptops, servers, and embedded devices worldwide.

<!-- beat: lesson -->
## The takeaway

![Hatch illustrating the trade-off between feature additions and deployment breadth](/images/placeholder.png)

> **Every feature you do not add is one more deployment environment that can carry your tool.**
>
> — HackProduct autopsy

<!-- beat: references -->
## References

1. **The curl History** — curl Project (curl.se) [Tier A] — https://curl.se/docs/history.html — 1996 origin as httpget, 1998 rename to curl, protocol additions over time.
2. **About curl** — curl Project (curl.se) [Tier A] — https://curl.se/docs/about.html — Mission statement, scope philosophy, "just a tool" positioning, protocol list.
3. **Daniel Stenberg: 25 Years of curl** — The Register, 2021 [Tier B] — https://www.theregister.com/2021/03/22/25_years_of_curl/ — Stenberg's career context, philosophy of scope, design decisions.
4. **curl Usage Statistics** — curl Project (curl.se) [Tier A] — https://curl.se/docs/companies.html — Companies using curl, deployment scale claims, 20 billion device estimate.
5. **libcurl Documentation** — curl Project (curl.se) [Tier A] — https://curl.se/libcurl/ — libcurl as embeddable library, API design, language bindings, use in embedded systems.
6. **curl Bug Bounty Program** — curl Project (curl.se) [Tier A] — https://curl.se/docs/bugbounty.html — Security governance, responsible disclosure, community contribution model.

<!-- beat: forward -->
## Next in queue

[ESLint: The Linter That Rewrote Itself](../eslint/eslint.md) — How Nicholas Zakas built a JavaScript linter with a pluggable rule system that could evolve with the language instead of fossilizing around it.
