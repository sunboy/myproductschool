# Mental Models Framework — System Design
## How Expert Systems Thinking Maps to FLOW

**Version:** 1.0
**Date:** 2026-05-01

---

## 1. Why This Doc Exists

A candidate who can name CAP theorem often cannot tell you what they would actually sacrifice in a real system under real constraints. This doc maps five engineering traditions into FLOW's rubric criteria and competency dimensions, so that every piece of feedback Hatch gives in a system design challenge connects to the underlying reasoning move being built. This is not a reference sheet for distributed systems trivia. It is a map from intellectual traditions into gradeable moves: naming trade-offs, anticipating failure, spending a latency budget, drawing a contract, and accepting that distributed systems misbehave in correlated ways. No thinker names appear in the product. The frameworks surface as reasoning patterns.

---

## 2. The Competency Taxonomy

### `scalability_intuition`

**What it measures:** The sense for what breaks first as load grows.

Every system has a bottleneck, a component or assumption that holds at current load and snaps at 10x. Scalability intuition is the move of naming that bottleneck before the system hits it. Not "this might slow down" but "the database connection pool is the ceiling and we hit it at roughly 500 concurrent requests." The discipline is in the specificity.

**Failure mode it prevents:** Designing for the happy path. Systems that assume uniform load growth, ignore fan-out, or treat "add more servers" as a complete answer to every scale question. The learner produces a design that works at the interview scale and fails silently at production scale.

**Sample coaching language:**
"You described the architecture correctly, but you didn't say where it breaks first. Which component hits its limit when traffic doubles? Name it before Optimize."

"The read replica is a good call. What's the replication lag assumption? At what write volume does lag become a user-facing problem?"

**Reasoning move:** Name the bottleneck before it finds you.

---

### `failure_mode_reasoning`

**What it measures:** Anticipating how systems degrade, not just how they function.

A system is not a success story, it's a failure story waiting to happen. Failure mode reasoning is the discipline of asking: what happens when a dependency is slow instead of down? What happens when a message is delivered twice? What happens when the network partitions? The move is systematic: name the failure, name the degradation behavior, name the mitigation.

**Failure mode it prevents:** Designing systems as if dependencies are infinitely reliable. The learner draws boxes and arrows without asking what happens when an arrow breaks. Reliability is treated as a property of individual components, not of the system under failure conditions.

**Sample coaching language:**
"You have a synchronous call to the payment service. What does the user see when that service is slow, not down, just slow? Walk me through the degradation path."

"You said the queue decouples the services. What happens when the consumer falls behind? At what queue depth does this become a user problem versus an ops problem?"

**Reasoning move:** Design for degradation, not for the happy path.

---

### `latency_judgment`

**What it measures:** Naming the latency budget and showing where it gets spent.

Every user-facing request has a latency budget, a number users will tolerate before the product feels broken. That budget is finite and gets spent across the request path: network hops, database round-trips, cache misses, serialization. Latency judgment is the move of naming the budget, naming the expensive operations, and showing how the design keeps spending within bounds.

**Failure mode it prevents:** Designing around throughput while ignoring tail latency. A system that looks fast on average but has a p99 that destroys user trust. Learners add components without accounting for what each adds to the critical path.

**Sample coaching language:**
"You added a synchronous enrichment call before the response returns. How much does that add to p99? Does the use case justify it?"

"The cache helps average latency. What's your p99 on a cold cache? Walk me through the request path on a cache miss."

**Reasoning move:** Name the budget. Name where it's spent. Make the trade-offs visible.

---

### `api_contract_thinking`

**What it measures:** Designing the durable interface, not the implementation behind it.

Implementations change; contracts persist. An API contract is a promise from a service to its callers, it specifies shape, behavior, error modes, and versioning strategy. API contract thinking is the discipline of designing at the boundary level: what does the caller need to know, and what can change without breaking them?

**Failure mode it prevents:** Designing internal implementation details as if they were API contracts, and designing APIs that are tightly coupled to one caller's current needs. The learner draws a service boundary but cannot say what the contract is or how it would evolve.

**Sample coaching language:**
"You said the service will return user data. What's the shape? What error codes does it surface? What can a caller depend on not changing across versions?"

"You're proposing a direct database join across service boundaries. What happens when Service B changes its schema? Where's the contract?"

**Reasoning move:** Contracts outlive implementations. Design for the caller, not for the moment.

---

### `consistency_reasoning`

**What it measures:** Choosing the right consistency model for the use case, and naming the trade-off.

Consistency is not a binary. A system can be strongly consistent, eventually consistent, or anywhere in between, and each choice trades latency, availability, or developer complexity for something else. Consistency reasoning is the move of naming which model the use case actually requires, why a weaker model is acceptable (or not), and what the user experiences when consistency is violated.

**Failure mode it prevents:** Defaulting to strong consistency everywhere (expensive, unavailable under partition) or eventual consistency everywhere (silent data races users discover at the worst moment). The learner cannot explain why they chose a consistency level or what the user experiences if it's violated.

**Sample coaching language:**
"You said you'd use a relational database with transactions. What's the isolation level? Is serializable actually required, or is repeatable read acceptable? What breaks if you drop down?"

"You said the read replicas are fine for this use case. When does a user see a stale read? What happens in the product when they do?"

**Reasoning move:** Name the consistency model. Name what the user experiences when it breaks.

---

## 3. The Thinker Traditions Absorbed

### DATA-INTENSIVE

**Contribution:** Every system trades consistency, availability, and latency. Naming the trade-off is the engineering move.

The data-intensive tradition starts from a stubborn fact: you cannot have strong consistency, high availability, and partition tolerance simultaneously. Every distributed system that works in production has made a choice about which of these to sacrifice, and usually that choice was made explicitly, by the engineers who built it.

What this tradition contributes is a vocabulary for naming the trade-off. The CAP theorem is not a design framework, it's a diagnostic tool. The useful move is being able to say: "Under a network partition, this system will serve stale reads rather than blocking" or "This system will refuse writes during a leader election rather than risk split-brain." The reasoning precedes the implementation.

This tradition also contributes the discipline of thinking about data systems as systems that fail, not systems that run. A log is not just a data structure, it's a contract about ordering. A replication lag is not an operations problem, it's a product decision about which users see which data when.

**Absorbed:**
- Consistency-availability-latency as a triangle, not a menu
- Log-structured storage and its implications for read/write trade-offs
- Replication, partitioning, and quorum as named design decisions, not implementation details

**Left Behind:**
- Detailed implementation analysis of specific storage engines (LSM trees, B-trees, column stores). Useful for deep-dive systems work; too granular for the FLOW rubric's level of abstraction. FLOW grades the reasoning move, not the implementation knowledge.

**Reasoning move:** Name the trade-off. Don't pretend you can have everything.

---

### RELIABILITY FIRST

**Contribution:** Reliability is engineered through embracing failure, not avoiding it.

The reliability-first tradition comes out of operating large systems in production for years. Its central insight is that failure is not an edge case, it's the normal operating condition. Any system large enough to matter will have hardware failures, network failures, software bugs, and human errors, every day, in production. Reliability means the system continues to serve users despite that.

The engineering discipline that follows is error budget thinking: reliability has a cost, and you should spend it deliberately. A system that never fails is a system that isn't being changed. A team with zero error budget is a team that ships nothing. The move is setting an explicit tolerance for failure and managing toward it.

This tradition also contributes the on-call mindset: if a system is not observable, it is not reliable. Every component that can fail must be instrumented. Alerts fire on symptoms users experience, not on machine metrics ops teams track.

**Absorbed:**
- Error budgets as a design constraint, not just an ops concern
- Structured failure tolerance: retry, circuit breaker, graceful degradation as first-class design patterns
- Observability as a design requirement: what does a runbook need to say?

**Left Behind:**
- The full SRE organizational model (SLO negotiation processes, error budget policy documentation). Relevant to engineering leadership; not a reasoning move gradeable in a FLOW challenge.

**Reasoning move:** Plan for failure. Name the degradation path before designing the happy path.

---

### LATENCY BUDGET

**Contribution:** Latency is a finite budget that gets spent across the request path.

Systems performance thinking lives in the space between "this feels fast" and "here is the exact component adding 120ms to your p99." The contribution of this tradition is making latency legible: a request doesn't just take some time, it spends that time somewhere, and the spending can be tracked.

The budget metaphor is the useful move. If you start with a user tolerance of 200ms and you know DNS resolution takes 5ms, TLS handshake takes 20ms, and your database query takes 40ms, you have 135ms left for everything else. That's not an estimate, it's a constraint. Every architectural decision that adds a synchronous step is spending from that budget.

This tradition also contributes the discipline of tail latency. Average latency is not the number that matters to users. A p50 of 80ms and a p99 of 800ms is a product that feels broken for roughly 1 in 100 requests. The design must account for the tail, not the average.

**Absorbed:**
- Latency as a budget to be spent, not a property to be measured after the fact
- Critical path analysis: which steps are sequential, which are parallelizable
- P99 and tail latency as design inputs, not post-hoc metrics

**Left Behind:**
- Detailed profiling methodology (flame graphs, perf, eBPF tooling). Useful for systems engineers debugging production; too implementation-specific for FLOW's design-level reasoning.

**Reasoning move:** Name the budget. Show where it's spent. Make every synchronous step justify its cost.

---

### CONTRACT FIRST

**Contribution:** Contracts outlive implementations.

The contract-first tradition is the discipline of thinking about systems at the boundary, not the interior. Before writing any code, you specify what the service promises to its callers: the shape of the request and response, the error modes, the performance guarantees, the versioning strategy. The implementation can change completely, the contract cannot, without coordination.

REST, RPC, event schemas, database schemas, all of these are contracts. The move is recognizing that the hardest part of distributed systems is not the code inside a service; it's the agreement at the surface. A service that is easy to evolve internally but breaks callers when it changes is not a well-designed service.

This tradition also contributes the backward-compatibility discipline. Adding fields is safe; removing them is a breaking change. Changing semantics silently is worse than changing signatures loudly. A contract violation is not a bug in the implementation, it's a failure of design.

**Absorbed:**
- API-first design: specify the contract before implementing the service
- Backward compatibility as a first-class design constraint
- Interface segregation: what does this caller need, and only that

**Left Behind:**
- REST versus RPC theological debates. The reasoning move (design for the contract, not the implementation) applies regardless of transport or protocol. Grading on REST vs. gRPC choices misses the point.

**Reasoning move:** The boundary outlives the interior. Design the contract first.

---

### DISTRIBUTED REALITY

**Contribution:** Distributed systems fail in correlated, surprising ways.

The distributed reality tradition starts from a list of assumptions that seem reasonable and are all wrong. Networks are not reliable. Latency is not constant. Bandwidth is not infinite. The network is not secure. Topology does not change. There is not one administrator. Transport cost is not zero. The network is not homogeneous.

Each of these false assumptions has produced real production incidents. The value of naming them is not trivia, it's inoculation. An engineer who has internalized that clocks in distributed systems cannot be trusted builds different systems than one who assumes NTP synchronization is good enough. An engineer who knows that message delivery is at-least-once designs their consumers differently than one who assumes exactly-once.

This tradition also contributes the humility discipline: distributed systems are hard not because the engineering is sophisticated but because the failure modes are correlated. A network partition doesn't take one service down, it takes everything that depends on that service, in sequence, as timeouts cascade.

**Absorbed:**
- The eight fallacies as a design checklist: which ones does this architecture assume away?
- Idempotency as a default design pattern for any operation that might be retried
- Cascade failure as a first-class design concern: what depends on what, and what breaks when the first thing fails

**Left Behind:**
- Formal proofs of distributed system correctness (consensus algorithm proofs, formal verification). Valuable research; not a reasoning move a practitioner applies in a FLOW challenge.

**Reasoning move:** Name the assumption you're depending on. Assume the network will violate it.

---

## 4. Competency x FLOW Step Mapping

This is the connective tissue between the grading system and the mental models. The grading rubric encodes these mappings. Every challenge feedback page renders the relevant mappings for the steps the user completed.

| Step | Competency | The reasoning move being built |
|---|---|---|
| FRAME | `failure_mode_reasoning` | Identify the failure surface before designing the happy path |
| FRAME | `scalability_intuition` | Name the bottleneck the current design hits before recommending a fix |
| FRAME | `consistency_reasoning` | Identify which consistency guarantee the use case actually requires |
| LIST | `scalability_intuition` | Generate options at different scale assumptions, what works at 1x may not work at 10x |
| LIST | `failure_mode_reasoning` | Include degradation options alongside feature options, what does partial success look like? |
| LIST | `api_contract_thinking` | Generate options for the service boundary, not just the internal implementation |
| OPTIMIZE | `latency_judgment` | Name the latency cost of each option across the full request path |
| OPTIMIZE | `consistency_reasoning` | Name what the user experiences if the chosen consistency model is violated |
| OPTIMIZE | `failure_mode_reasoning` | Name the degradation behavior of the chosen option, not just what goes right |
| WIN | `api_contract_thinking` | Make the recommendation at the contract level: what changes, what callers can depend on |
| WIN | `scalability_intuition` | Name the ceiling of the recommended design and the signal that says it's time to evolve |
| WIN | `latency_judgment` | State the latency guarantee the recommendation makes and the p99 it targets |

---

## 5. The Four FLOW Steps for System Design

### Frame, Diagnose the constraint before designing the system

Frame in system design is the move of refusing to design a system until you understand why the current one is failing. Every system design challenge comes with an implicit load, implicit SLA, implicit failure history. The work of Frame is making those explicit: what is the system being asked to do that it cannot do now? What is the constraint, read throughput, write latency, consistency, fan-out, availability?

A Frame done poorly in system design is indistinguishable from a List done poorly: the learner jumps to architectural components (add a cache, add a queue) before naming what the system actually needs. Frame done well identifies the binding constraint and makes the rest of the design honest.

**Rubric criteria:**

- **F1, Constraint identification:** Name the primary constraint the current system hits. Is it read throughput? Write latency? Consistency under partition? A system is only failing one thing first, find it.
- **F2, Use case grounding:** Connect the technical constraint to the user experience it produces. What does the user see when the system is under the constraint? Latency? Errors? Stale data?
- **F3, Load characterization:** Name the load profile the design must handle. Read-heavy or write-heavy? Uniform or bursty? What are the concurrency assumptions?
- **F4, Scope boundary:** What this design is not solving. Which components are out of scope, which failure modes are accepted, which SLA relaxations are allowed.

**Anti-patterns:**
- Starting with "I'd use microservices" before naming the constraint
- Treating all failure modes as equally important without ranking
- Describing a working system without naming what breaks it

**Reasoning move:** Name the constraint. Make the design answer it.

---

### List, Map the solution space at the right level of abstraction

List in system design is the move of generating options before committing to one. The options must be at the right level: not "use PostgreSQL vs. MySQL" (too granular) and not "improve the system" (too vague), but architectural options that trade different properties against each other. Read replicas versus a caching layer. Synchronous versus asynchronous writes. Single region versus multi-region.

Good listing in system design includes failure options alongside feature options: what does the system look like if we accept a weaker consistency guarantee? What does it look like if we trade some availability for stronger consistency? These are real options, and the grader checks whether the learner can see them.

**Rubric criteria:**

- **L1, Trade-off dimensions:** For each option, name what it optimizes for and what it sacrifices. Options without trade-off dimensions are not options, they're implementations.
- **L2, Architectural breadth:** Generate options that differ in kind, not in degree. A caching layer and a read replica are different architectural bets. Two caching strategies are the same bet with different parameters.
- **L3, Failure option inclusion:** Include at least one option that trades a feature guarantee for a reliability or latency gain. Degraded mode is an architectural option.

**Anti-patterns:**
- Generating three caching strategies when the question is about caching vs. denormalization
- Listing components without listing trade-offs
- Ignoring the option of doing less (relaxing SLAs, scoping down the feature)

**Reasoning move:** Generate options that differ in kind. Include the option that gives something up.

---

### Optimize, Choose the trade-off and name the sacrifice

Optimize in system design is the move of choosing between architectural options while naming explicitly what the chosen option gives up. Every system design decision is a trade-off: consistency for availability, latency for throughput, development simplicity for operational sophistication. The engineering discipline is naming the sacrifice as clearly as the gain.

Optimize done poorly is "I'd use option B because it's better for performance." Optimize done well is "Option B gives us 40ms p99 under normal load but sacrifices read-after-write consistency for 30 seconds after a write. That's acceptable because the use case is feed rendering, not financial transactions."

**Rubric criteria:**

- **O1, Named optimization criterion:** State what property this design is optimizing for, explicitly. Not "performance" but "read throughput for anonymous users at the cost of write latency."
- **O2, The sacrifice:** Name what the chosen option gives up. Not as an afterthought, as an explicit design decision. "We give up X. X is acceptable because Y."
- **O3, Operational envelope:** Name the conditions under which the chosen design works and the signals that say it's being exceeded.
- **O4, Consistency model commitment:** Name the consistency guarantee the chosen design makes. What does a caller depend on? What can change?

**Anti-patterns:**
- Recommending strong consistency everywhere without naming the latency and availability cost
- Comparing options on one dimension while ignoring the others
- "It depends" without naming what it depends on

**Reasoning move:** Name the sacrifice as clearly as the gain. That's what makes the design trustworthy.

---

### Win, Make a recommendation at the contract level, with a ceiling

Win in system design is the move of committing to a specific architecture, at the interface level, with an explicit ceiling. The recommendation names what the system promises to callers (the contract), what the design handles (the operational envelope), and what the signal is that the design has been outgrown.

A Win without a ceiling is a liability: it implies the design works forever, which no design does. A Win without a contract is advice: it describes an implementation without committing to what callers can depend on.

**Rubric criteria:**

- **W1, Contract commitment:** State what the API or data contract promises. What does the caller receive? What errors can occur? What performance can the caller depend on?
- **W2, Operational ceiling:** Name the load, concurrency, or data volume at which the recommended design stops working. What's the signal? What's the next evolution?
- **W3, Failure acceptance:** State which failure modes the design accepts and what users experience when they occur.
- **W4, Observability commitment:** Name the signals that tell on-call whether the system is healthy, and the runbook action when they're not.

**Anti-patterns:**
- Recommending "horizontally scalable microservices" without naming what's being scaled or how
- Omitting the ceiling, every design has one
- Defining success as "the system is up" rather than a user-experience SLA

**Reasoning move:** Commit at the contract level. Name the ceiling. Make the design auditable.

---

## 6. How This Surfaces in the Product

### a. Per-MCQ Option Explanations

Each answer option shows which reasoning move it demonstrates or violates. The explanation has two layers:

**Layer 1, What this option does right or wrong (rubric layer):**
> "You added a read replica but didn't name the replication lag assumption. A read replica solves read throughput; it doesn't solve consistency. Whether that matters depends on whether the use case tolerates stale reads, and that requires naming the consistency model."

**Layer 2, Which reasoning pattern it's building (framework layer):**
> Consistency Reasoning: The question isn't 'replica or no replica.' It's 'which consistency model does this feature require, and which architecture delivers it.'

For wrong answers:
> "Adding a distributed cache before naming the read/write ratio is optimizing in the wrong direction. Cache hit rate is determined by access patterns, without knowing the patterns, you can't know if the cache helps."
>
> Scalability Intuition: Name the access pattern before naming the solution. The bottleneck has to be found before it can be fixed.

---

### b. Per-Step Grading Output

Hatch's step-level feedback includes a `competency_signal` block alongside the standard `detected` / `missed` / `coaching` output:

```json
{
  "score": "partial",
  "criteria_scores": { "F1": "strong", "F2": "partial", "F3": "needs_work", "F4": "needs_work" },
  "detected": "You identified the read throughput constraint correctly and named the database as the bottleneck...",
  "missed": "You didn't characterize the load profile, read-heavy vs. write-heavy, bursty vs. uniform. The design choices downstream depend on this.",
  "coaching": "Frame is strong on constraint identification. The missing move is load characterization, naming the profile that the design must handle. Without it, List options are guesses.",
  "competency_signal": {
    "primary": "scalability_intuition",
    "signal": "You found the bottleneck correctly. The next level is naming the load profile that stresses it, read-heavy at what concurrency? Bursty at what peak? That changes which architectural bets make sense.",
    "framework_hint": "Scalability Intuition: finding the bottleneck is the first move. Characterizing the load that stresses it is the second. Without the second, List options are underconstrained."
  }
}
```

---

### c. Post-Challenge Mental Models Breakdown

After completing all four FLOW steps, the feedback page shows a map from this challenge back to the reasoning moves being built:

```
What you were building in this challenge
─────────────────────────────────────────

FRAME   →   Scalability Intuition + Failure Mode Reasoning
            You were practicing: name the constraint before designing
            the fix. The database connection pool is the ceiling —
            not the query latency, not the network. Finding the right
            bottleneck is the first move.

LIST    →   Failure Mode Reasoning + API Contract Thinking
            You were practicing: include the failure options alongside
            the feature options. What does partial success look like?
            What does the system give callers when the database is slow
            but not down?

OPTIMIZE →  Latency Judgment + Consistency Reasoning
            You were practicing: name the sacrifice as clearly as the
            gain. Read replicas save you read throughput and cost you
            replication lag. That trade-off is only acceptable if the
            use case tolerates stale reads, and that requires naming
            the consistency model.

WIN     →   API Contract Thinking + Scalability Intuition
            You were practicing: commit at the contract level and name
            the ceiling. What does the caller depend on? At what load
            does the design stop working? Every recommendation that
            skips the ceiling implies it works forever.

─────────────────────────────────────────
Your weakest competency this challenge: Consistency Reasoning

You named the architectural options clearly but couldn't say what
the user experiences when replication lag produces a stale read.
That's the consistency reasoning move, the model only earns its
place when you can name what breaks when it's violated.

Next challenge to develop this:
→ The Distributed Counter (Backend · Consistency Track)
  Requires choosing between strong and eventual consistency with
  explicit user experience consequences named for each.
```

---

## 7. Coaching Language Style Guide

Hatch talks about systems as things that fail, not things that run. The coaching voice is direct, specific, and grounded in what the system does to users, not in what it does to machines.

**Voice principles:**

The coaching language names trade-offs, not technologies. "PostgreSQL" is not a reason; "strong consistency at the cost of horizontal write scalability" is. The grading surfaces the reasoning move, not the implementation choice.

Hatch coaches toward specificity. "This might be slow" is not useful feedback. "This synchronous enrichment call adds to the critical path, name the latency cost before committing to it" is the move.

The voice assumes the learner can handle precision. Vague encouragement ("good start") is not coaching. Specific identification of what's missing ("you named the option but not what it gives up") is.

**Phrasings to use:**
- "Name the trade-off, not the option."
- "What does the user see when this assumption is violated?"
- "Which component hits its ceiling first?"
- "You said 'add a cache.' Add a cache to solve what, specifically?"
- "Walk me through the request path on a cache miss."
- "Name the load profile, not just the load."
- "The contract is: what can the caller depend on not changing?"
- "At what point does this design stop working? Name the signal."

**Phrasings to avoid:**
- "Good design!" (no specificity)
- "This is a solid architecture" (solid is meaningless; name what makes it solid)
- "You should consider microservices" (technology name without trade-off reasoning)
- "This scales well" (scales to what? under what load? at what cost?)
- "The system is reliable" (reliable under which failure conditions?)

**Tone calibration:**
Coaching lands between colleague review and direct feedback. Not harsh, not soft. "You named the component but not the trade-off" is not criticism, it's identification of the missing move. The goal is to send the learner to the next challenge knowing exactly what they're developing.

---

## 8. Open Questions

**1. Should `consistency_reasoning` be split?**
Consistency reasoning covers both OLTP consistency models (serializable, repeatable read, read committed) and distributed consistency models (strong, eventual, causal). These are related but distinct. A learner who understands ACID isolation levels may not understand quorum reads. Should this be one competency with two sub-dimensions, or two separate competencies?

**2. Where does security reasoning fit?**
The current taxonomy has no home for authentication, authorization, or secure design decisions. Is security a sixth competency, or is it always contextual, an application of other competencies (contract thinking, failure mode reasoning) to security-specific scenarios? The placeholder answer is "no security competency at v1," but this needs a real decision.

**3. How do FLOW step criteria map to different challenge types?**
A caching challenge has different F1-F4 criteria than a distributed consensus challenge. The current rubric is written at a level of abstraction that applies across challenge types. But some challenges will require criteria that don't map cleanly. How much per-challenge rubric customization does the grader support?

**4. Is `api_contract_thinking` too narrow for some challenges?**
Some system design challenges are internal, no external API. The "contracts outlive implementations" reasoning still applies (database schema as a contract, event schema as a contract), but the framing "API contract" may confuse learners who read it as REST endpoints only. Rename to `interface_contract_thinking`?

**5. What is the right ceiling for domain knowledge expectations?**
`scalability_intuition` requires naming specific numbers ("connection pool ceiling at 500 concurrent requests"). But the right numbers depend on the specific system. How domain-specific should the grader be? Should challenges provide baseline numbers, or should learners be expected to reason from first principles?
