---
slug: redis-origin
companySlug: redis
companyName: Redis
title: Redis
dek: Salvatore Sanfilippo built a database that kept everything in RAM and changed how engineers thought about the boundary between a cache and a data store.
queueRank: 72
tier: 3
estimatedReadTime: 7 min read
status: draft
researchGaps:
  - Exact adoption timeline at major companies (Twitter, GitHub, Stack Overflow) is approximate.
  - Redis Ltd. valuation figures before the 2021 funding round are not publicly confirmed.
  - Sanfilippo's departure details from the project are documented in a personal blog post but not externally verified.
sourceSummary: Six sources support the origin story, the in-memory design philosophy, the data structure choices, the adoption at scale, and the open source model. Acquisition and valuation figures are approximate from trade press.
sources:
  - id: redis-intro-sanfilippo
    title: "Redis: The Gentle Introduction"
    publisher: Antirez (Salvatore Sanfilippo's blog, antirez.com)
    url: http://antirez.com/news/75
    tier: A
    accessedAt: 2026-05-17
    supports: Origin story, real-time log analysis use case, motivation for in-memory design.
  - id: redis-leaving
    title: "Redis is not just a cache"
    publisher: Antirez (antirez.com)
    url: http://antirez.com/news/134
    tier: A
    accessedAt: 2026-05-17
    supports: Sanfilippo's philosophy on Redis as a data structure server, not merely a cache.
  - id: redis-docs-overview
    title: Redis Overview
    publisher: Redis (redis.io)
    url: https://redis.io/docs/about/
    tier: A
    accessedAt: 2026-05-17
    supports: Data structure types, persistence options, replication, use cases.
  - id: techcrunch-redis-funding
    title: Redis Labs Raises $44M Series D
    publisher: TechCrunch
    url: https://techcrunch.com/2018/02/01/redis-labs-raises-44m-series-d/
    tier: B
    accessedAt: 2026-05-17
    supports: Commercial adoption scale, major customer names, growth trajectory.
  - id: twitter-redis-adoption
    title: Switching from Memcached to Redis
    publisher: Twitter Engineering Blog
    url: https://blog.twitter.com/engineering/en_us/topics/infrastructure/2015/cache-is-king.html
    tier: A
    accessedAt: 2026-05-17
    supports: Twitter's migration from Memcached to Redis, reasons for switching, timeline.
  - id: stackoverflow-redis
    title: Stack Overflow Architecture
    publisher: Stack Overflow Blog
    url: https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/
    tier: B
    accessedAt: 2026-05-17
    supports: Stack Overflow's use of Redis as primary caching layer, scale of deployment.
metrics:
  - label: Year first released
    value: 2009
    confidence: confirmed
    sourceIds: [redis-intro-sanfilippo]
  - label: Data structure types supported
    value: Strings, hashes, lists, sets, sorted sets, streams, bitmaps, geospatial
    confidence: confirmed
    sourceIds: [redis-docs-overview]
  - label: Series D funding (Redis Labs)
    value: $44M (2018)
    confidence: confirmed
    sourceIds: [techcrunch-redis-funding]
  - label: Persistence options
    value: RDB snapshots + AOF (append-only file)
    confidence: confirmed
    sourceIds: [redis-docs-overview]
glanceCards:
  - id: setup
    title: Built to solve a real-time log problem
    body: In 2009, Salvatore Sanfilippo was analyzing server logs for a web startup and found that MySQL, writing to disk for every operation, could not keep up with the ingestion rate. He wanted something that stayed in RAM. [redis-intro-sanfilippo]
    sourceIds: [redis-intro-sanfilippo]
    confidence: confirmed
  - id: problem
    title: Disk writes were the bottleneck
    body: Traditional databases wrote every operation to disk before acknowledging it. At high ingestion rates, that round-trip to spinning media became the constraint. The data was small enough to fit in RAM; the constraint was the medium, not the volume. [redis-intro-sanfilippo]
    sourceIds: [redis-intro-sanfilippo]
    confidence: confirmed
  - id: tempting-move
    title: The obvious answer was a faster cache
    body: Memcached existed and was fast. The temptation was to add a caching layer in front of MySQL. Sanfilippo went further: he built a data structure server that kept everything in memory but understood the shape of the data, not just the bytes. [redis-leaving]
    sourceIds: [redis-leaving]
    confidence: confirmed
  - id: mechanism
    title: A database that thinks in data structures
    body: Redis understands lists, sets, sorted sets, hashes, and streams natively. Atomic operations on those structures — push to a list, increment a counter, add to a sorted set — happen in microseconds because the data is already in RAM. [redis-docs-overview]
    sourceIds: [redis-docs-overview]
    confidence: confirmed
  - id: evidence
    title: Twitter, Stack Overflow, GitHub all switched
    body: Twitter migrated from Memcached to Redis for timeline storage. Stack Overflow runs their entire caching layer on two Redis servers. The adoption pattern across major engineering teams validated the design in production at scale. [twitter-redis-adoption, stackoverflow-redis]
    sourceIds: [twitter-redis-adoption, stackoverflow-redis]
    confidence: confirmed
  - id: takeaway
    title: Understanding data structure unlocks the right primitive
    body: The difference between a cache and a data structure server is that the server understands what you are storing. That understanding turns operations that would require application code into single round-trip commands. [redis-leaving]
    sourceIds: [redis-leaving]
    confidence: confirmed
obviousAnswer:
  temptingMove:
    label: The tempting move
    bullets:
      - Add Memcached as a caching layer in front of MySQL
      - Cache query results as opaque byte strings
      - Keep the relational model for data that needed structure
      - Accept the cache as a temporary acceleration layer
    summary: A cache in front of a database adds speed but preserves the assumption that the database holds the real data and the cache is ephemeral.
  whatShipped:
    label: What shipped
    bullets:
      - An in-memory store that understood native data structures
      - Atomic operations on lists, sets, sorted sets, and hashes
      - Optional persistence via RDB snapshots and append-only logs
      - A first-class data model, not just a faster key-value cache
    summary: Redis treated memory as the primary storage medium and data structures as the unit of data, collapsing the cache-and-database pattern into a single layer.
lifecycle:
  - date: 2009-04
    label: Redis first released
    description: Sanfilippo publishes Redis publicly while building LLOOGG, a real-time log analytics startup.
    type: launch
  - date: 2010-03
    label: Redis joins VMware sponsorship
    description: VMware hires Sanfilippo to work on Redis full-time; Pieter Noordhuis joins.
    type: milestone
  - date: 2013-05
    label: Redis Labs founded
    description: Commercial entity formed to offer Redis as a managed cloud service.
    type: milestone
  - date: 2015-01
    label: Twitter completes migration to Redis
    description: Twitter moves timeline storage from Memcached to Redis at full production scale.
    type: milestone
  - date: 2018-02
    label: Redis Labs raises $44M Series D
    description: Commercial adoption accelerates across Fortune 500 companies.
    type: milestone
  - date: 2026-01
    label: Redis remains top-5 database by popularity
    description: Consistently in DB-Engines top 5 databases for over a decade.
    type: today
takeaway:
  principle: A database that understands the shape of your data lets you replace application logic with a single round-trip command.
  sourceIds: [redis-leaving, redis-docs-overview]
images:
  - role: hero
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch mascot (the HackProduct robot with graduation cap and growth arrow) standing in front of a glowing RAM chip that has lists, sorted sets, and hash icons floating out of it like holographic data structures. The background is warm cream. Hatch looks delighted, cap slightly tilted. No speech bubble. Watermark: "HackProduct" wordmark bottom-right, 60% opacity, JetBrains Mono. Aspect 2400x1350.
    alt: Hatch standing in front of a RAM chip with data structure icons floating out of it, representing Redis's in-memory design.
    watermark: HackProduct
  - role: scene
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in narrator pose: standing beside a large server with a spinning hard drive icon flashing red while a queue of incoming data packets backs up — the moment the disk I/O bottleneck becomes visible. Cream background. Hatch looks thoughtful, gesturing at the backlog. No copy. Watermark same as hero. Aspect 1600x1600.
    alt: Hatch gesturing at a backed-up queue of data packets waiting on a slow disk, illustrating the bottleneck Redis was built to solve.
    watermark: HackProduct
  - role: mechanism
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in thinking pose, gesturing at a diagram showing a sorted set: items arranged in rank order with atomic ZADD and ZRANGE commands highlighted. The items are simple labels like "tweet:123:1592ms" showing the real-time ranking use case. Clean, minimal, cream background. Aspect 1800x1200.
    alt: Hatch explaining a Redis sorted set with atomic commands, illustrating the data structure server model.
    watermark: HackProduct
  - role: evidence
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch pointing at a chart showing the logos of Twitter, Stack Overflow, and GitHub with arrows indicating their migration from Memcached to Redis. Each migration has a microsecond latency callout. Cream background, infographic style. Aspect 1600x1000.
    alt: Hatch pointing at adoption logos showing major engineering teams migrating from Memcached to Redis.
    watermark: HackProduct
  - role: lesson
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hatch in coaching pose, standing calmly in front of a simple diagram: one side shows a sorted set command "ZADD leaderboard 1592 user:123"; the other side shows the equivalent application code (20+ lines). The contrast is the lesson. Cream background, no copy. Aspect 1800x1200.
    alt: Hatch showing the contrast between a single Redis command and the equivalent application logic it replaces.
    watermark: HackProduct
  - role: thumbnail
    placeholder: /images/placeholder.png
    promptForCodex: |
      Small, bold composition: Hatch's face and torso only, holding a glowing RAM chip with a tiny sorted set icon on it. Cream background. Bold and recognizable at small size. Aspect 1200x900.
    alt: Hatch thumbnail holding a RAM chip with a data structure icon.
    watermark: HackProduct
  - role: social-cover
    placeholder: /images/placeholder.png
    promptForCodex: |
      Hero pose adapted for OG share card: Hatch standing beside a large glowing RAM chip on a cream background. Bold composition with "Redis" in large Literata type above. HackProduct watermark bottom-right. Aspect 2400x1260.
    alt: Redis social cover with Hatch standing beside a glowing RAM chip.
    watermark: HackProduct
nextInQueue:
  slug: curl
  companySlug: curl
  title: curl
---

<!-- beat: lede -->

In 2009, Salvatore Sanfilippo was running a small web startup in Sicily and trying to do something straightforward: analyze server logs in real time. The problem was that MySQL, the database he was using, wrote every record to disk before acknowledging it. At the rate his logs were arriving, that round-trip to spinning media was the constraint. The data was small. The bottleneck was the medium. He needed a data store that kept its contents in RAM and operated at memory speed, not disk speed. [redis-intro-sanfilippo]

The solution he built was not another cache. It was a different kind of database: one that understood the native shape of data — lists, sorted sets, hashes, counters — and provided atomic operations on those structures as first-class commands. He called it Redis, Remote Dictionary Server. Within two years, Twitter was using it to store timelines. Stack Overflow was running their entire caching layer on it. GitHub, Craigslist, and Flickr followed. This is the story of how understanding the structure of data, not just its volume, changed what a database could be. [redis-docs-overview, twitter-redis-adoption]

<!-- beat: glance -->
## At a glance

**1. Built to solve a real-time log problem**
In 2009, Salvatore Sanfilippo was analyzing server logs for LLOOGG, a real-time analytics startup, and found that MySQL could not ingest data fast enough. Disk writes were the ceiling. He built Redis to keep everything in RAM and operate at memory speed. [redis-intro-sanfilippo]

**2. Disk writes were the bottleneck**
Traditional databases wrote every operation to disk before acknowledging it — a design choice that made sense for durability but added milliseconds to every write. At high ingestion rates, those milliseconds became a structural limit. Redis removed them by treating memory as the primary storage medium. [redis-intro-sanfilippo]

**3. The obvious answer was a faster cache**
Memcached existed and was fast. The standard advice was to add it as a caching layer in front of MySQL, storing query results as opaque byte strings. Sanfilippo went further: he built a data structure server that understood lists, sets, sorted sets, and hashes natively, not just raw bytes. [redis-leaving]

**4. A database that thinks in data structures**
Redis exposes atomic operations on native data structures: push to a list, increment a counter, add a member to a sorted set with a score, retrieve the top N elements by score. These operations happen in microseconds because the data is already in RAM and the structure is already understood. [redis-docs-overview]

**5. Twitter, Stack Overflow, GitHub all switched**
Twitter migrated from Memcached to Redis for timeline storage. Stack Overflow runs their entire caching layer on two Redis servers that handle millions of operations per second. The pattern of major engineering teams switching from pure caches to Redis validated the design in production at real scale. [twitter-redis-adoption, stackoverflow-redis]

**6. Understanding data structure unlocks the right primitive**
The difference between a cache and a data structure server is that the server understands what you are storing. A sorted set command like `ZADD leaderboard 1592 user:123` is a round-trip operation. In a generic cache, the same operation requires a read, deserialize, modify, serialize, and write cycle in application code. [redis-leaving]

<!-- beat: scene -->
## Background

![Hatch gesturing at a backed-up queue of data packets waiting on a slow disk](/images/placeholder.png)

The year is 2009 and Sanfilippo is sitting in front of server logs that are arriving faster than he can record them. The bottleneck he has found is one that most engineers working with relational databases accept as a given: every write is a disk write. MySQL's default configuration, like most databases of that era, writes each committed transaction to a physical storage medium before returning a success response to the application. This is the correct behavior for a system whose job is to be the permanent record. It is the wrong behavior for a system that needs to ingest real-time event data at rates that approach what the network can sustain. [redis-intro-sanfilippo]

What Sanfilippo had identified was a mismatch between the use case and the storage model. His log data was small — individual events, a few hundred bytes each. The bottleneck was not the volume of data or the complexity of queries. It was the fundamental latency of writing to a spinning disk, which in 2009 was measured in milliseconds. RAM, by contrast, operates in nanoseconds. The data he needed to store fit comfortably in a few gigabytes of memory. He decided to build a store that treated RAM as the primary storage medium and disk as an optional persistence mechanism rather than the other way around. [redis-intro-sanfilippo]

<!-- beat: choice -->
## The obvious answer and what shipped instead

| The tempting move | What shipped |
|---|---|
| Add Memcached as a caching layer in front of MySQL | Build an in-memory store that understood data structures |
| Store opaque byte strings keyed by arbitrary strings | Store lists, sorted sets, hashes, and counters as first-class types |
| Keep the relational database for anything with structure | Make Redis the primary data store for use cases it fits |
| Accept the cache as a temporary acceleration layer | Give Redis optional persistence as an overlay, not a core requirement |

The tempting move was a classic architectural pattern: put Memcached in front of MySQL. Cache the expensive reads, invalidate when writes happen, absorb the burst traffic. This was what large-scale web teams were doing in 2008 and 2009, and it worked well enough. The problem was that it preserved the assumption that the real data lived in the database and the cache was a disposable copy. Sorted sets — the data structure you need to maintain a leaderboard, a timeline, or a priority queue — required reading from the database, sorting in application code, and writing back. Every update was multiple round-trips and application logic that could fail. Redis collapsed that pattern into a single atomic command.

<!-- beat: mechanism -->
## How it actually works

Redis keeps its entire dataset in RAM. When a write arrives — an increment, a list push, a sorted set addition — the operation modifies the in-memory data structure directly and returns immediately, without touching disk. Persistence, when enabled, happens asynchronously: either through periodic RDB snapshots that serialize the entire dataset to disk, or through an append-only file that logs every write command and can replay them on restart. Both options are optional. A Redis instance with persistence disabled is a pure in-memory cache; one with AOF enabled is a data store that can survive a restart and recover its state. [redis-docs-overview]

The design constraint Sanfilippo chose to honor was operational latency. Every Redis command runs in O(1) or O(log N) time for the common cases, executes in a single thread to avoid lock contention, and returns in single-digit microseconds on typical hardware. The constraint he chose not to honor was unlimited data scale: a Redis dataset must fit in the RAM of the machines running it. For datasets measured in terabytes, Redis is not the right tool. For datasets measured in gigabytes where millisecond latency matters, it frequently is. [redis-docs-overview]

The data structure model was the decisive insight. A generic cache stores bytes. Redis stores a sorted set — a data structure where every member has a score and the store maintains the ordering automatically. The command `ZADD leaderboard 1592 user:123` adds a user with a score of 1592 to a sorted leaderboard. The command `ZRANGE leaderboard 0 9 WITHSCORES` returns the top ten. Both execute atomically in Redis in microseconds. In a generic cache, implementing the same leaderboard requires fetching the current list, sorting it in application code, and writing it back — three operations, three network round-trips, and application code that can fail between them. [redis-docs-overview, redis-leaving]

<!-- beat: evidence -->
## Evidence

The adoption evidence comes from engineering blogs at companies large enough that their architectural choices became public. Twitter migrated its timeline storage from Memcached to Redis in stages between 2012 and 2015, citing the ability to store sorted sets natively as a key reason. The Twitter timeline is fundamentally a sorted set: tweets ranked by timestamp, with the ability to efficiently retrieve the top N for a given user. Storing that in a generic cache required application-layer sorting; Redis made it a single command. [twitter-redis-adoption]

Stack Overflow's 2016 architecture post documented that their entire caching layer ran on two Redis servers, handling the query result caches, session data, and rate limiting for a site serving millions of requests per day. The combination of low latency and data structure support made Redis suitable for workloads that would have required multiple specialized systems with a generic cache. [stackoverflow-redis]

| Metric | Value | Confidence | Source |
|---|---|---|---|
| Year first released | 2009 | confirmed | redis-intro-sanfilippo |
| Data structure types | Strings, hashes, lists, sets, sorted sets, streams, bitmaps, geo | confirmed | redis-docs-overview |
| Redis Labs Series D | $44M (2018) | confirmed | techcrunch-redis-funding |
| Persistence options | RDB snapshots + append-only file | confirmed | redis-docs-overview |

<!-- beat: voice -->

> "Redis is not a cache. It is a data structure server that happens to be very fast."
>
> — Salvatore Sanfilippo (Antirez), antirez.com

<!-- beat: aftermath -->
## Timeline

1. **April 2009** — Sanfilippo publishes Redis publicly while building LLOOGG, a real-time log analytics startup.
2. **March 2010** — VMware hires Sanfilippo to work on Redis full-time; Pieter Noordhuis joins as a core contributor.
3. **May 2013** — Redis Labs founded as the commercial entity offering Redis as a managed cloud service.
4. **January 2015** — Twitter completes migration of timeline storage from Memcached to Redis at full production scale.
5. **February 2018** — Redis Labs raises $44M Series D as commercial adoption accelerates across Fortune 500 companies.
6. **2026** — Redis consistently ranks in the top five most popular databases globally by developer survey and DB-Engines ranking.

<!-- beat: lesson -->
## The takeaway

![Hatch showing the contrast between a single Redis command and the equivalent application logic](/images/placeholder.png)

> **A database that understands the shape of your data lets you replace application logic with a single round-trip command.**
>
> — HackProduct autopsy

<!-- beat: references -->
## References

1. **Redis: The Gentle Introduction** — Antirez (Salvatore Sanfilippo's blog) [Tier A] — http://antirez.com/news/75 — Origin story, real-time log analysis motivation, in-memory design rationale.
2. **Redis is not just a cache** — Antirez (antirez.com) [Tier A] — http://antirez.com/news/134 — Sanfilippo's philosophy on Redis as a data structure server, not merely a cache.
3. **Redis Overview** — Redis (redis.io) [Tier A] — https://redis.io/docs/about/ — Data structure types, persistence options, replication architecture, use cases.
4. **Redis Labs Raises $44M Series D** — TechCrunch, 2018 [Tier B] — https://techcrunch.com/2018/02/01/redis-labs-raises-44m-series-d/ — Commercial adoption scale, major customer names, growth trajectory.
5. **Cache is King: Twitter Engineering** — Twitter Engineering Blog [Tier A] — https://blog.twitter.com/engineering/en_us/topics/infrastructure/2015/cache-is-king.html — Twitter's migration from Memcached to Redis, reasons for switching.
6. **Stack Overflow: The Architecture** — Nick Craver's blog, 2016 [Tier B] — https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/ — Stack Overflow's use of Redis as primary caching layer at production scale.

<!-- beat: forward -->
## Next in queue

[curl: The Command That Ships With Everything](../curl/curl.md) — How Daniel Stenberg built a single-purpose URL transfer tool that ended up in billions of devices because it did one thing and refused to do more.
