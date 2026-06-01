# Code-Execution Backend: Architecture Research & Recommendation

**Date:** 2026-05-30
**Trigger:** The coding workspace's Run/Submit returns `HTTP 429 — Too many requests` and `HTTP 500` from Judge0 CE on RapidAPI. Root cause is architectural, not a code bug: a single shared RapidAPI key + parallel per-test submissions + zero throttle/backoff means concurrent users (and even one user's 3 simultaneous test submissions) trip the per-key rate limit.

This document is the synthesized output of a multi-agent deep-research pass (107 search/fetch/verify agents). Claims below were adversarially verified; where a claim was refuted or corrected, that is noted inline.

---

## TL;DR Recommendation

**Phase 0 (today, hours):** Fix the client-side amplification — batch submissions into Judge0's `POST /submissions/batch` (1 request for all tests instead of N parallel) and add 429/5xx retry-with-backoff. This alone removes the single-user failure in the screenshot. It does NOT fix concurrent users.

**Phase 1 (this week, the real fix):** Stand up **self-hosted Judge0 on a single Hetzner/EC2 VM (not Fargate, not Cloud Run)** behind an **Upstash Redis token-bucket** that serializes submissions to stay under the box's capacity. Make `JUDGE0_HOST` env-driven (it's currently hardcoded). This gives true concurrency control at trivial cost (~$15-40/mo) and removes RapidAPI entirely.

**Phase 2 (scale / when traffic justifies):** Migrate the execution backend to **E2B** (Firecracker microVMs, strongest sandbox, ~125-200ms cold start, all 5 languages via custom templates). E2B is **self-hostable** (Apache-2.0, Terraform) OR SaaS ($150/mo Pro + usage). The Phase-1 queue abstraction makes this a backend swap, not a rewrite.

**Avoid:** ECS Fargate and GCP Cloud Run for self-hosted Judge0 — they block privileged mode, which Judge0's `isolate` sandbox requires. Confirmed below.

---

## The hard constraint that eliminates the "easy" options

**Judge0's `isolate` sandbox needs privileged container mode + cgroup access.** Two verified facts:

1. **Judge0 requires cgroup v1 + privileged mode.** Modern hosts default to cgroup v2; running Judge0 requires editing `/etc/default/grub`, regenerating GRUB, and **rebooting the host** (Tutorials Dojo walkthrough; Railway/Tanto Security operational reports: "Failed to create control group"). This requires host-level kernel/boot control.

2. **AWS Fargate and GCP Cloud Run do NOT allow privileged mode.** AWS official docs state privileged mode is unsupported on ECS Fargate and EKS Fargate; AWS containers-roadmap issue #1000 (requesting it) is still open as of 2026. Cloud Run is fully managed with no kernel/privileged access. *(Verified against AWS primary docs + roadmap issue, multi-source.)*

**Conclusion:** Self-hosted Judge0 must run on a **real VM or VM-backed node** (EC2, GCE Compute Engine, DigitalOcean Droplet, Hetzner VPS, or a GKE/EKS node group on actual EC2/GCE instances — not the serverless Fargate/Autopilot variants).

---

## Option comparison

Ops burden scored 1 (turnkey) – 5 (heavy).

### 1. Self-hosted Judge0 on a VM (EC2 / GCE / DigitalOcean Droplet / Hetzner)
- **Stack:** 3-container Docker Compose (Judge0 worker + Postgres + Redis). Reference sizing: `t3.medium` + 40 GiB, Amazon Linux 2023 (or any 2-vCPU/4GB VM).
- **Concurrency:** Bounded by box CPU. A single t3.medium handles modest concurrent load; scale via worker count / bigger box / multiple boxes behind the queue.
- **Cost @100 DAU (spiky):** ~$15-40/mo (Hetzner CPX21 ~€8/mo; DO 2vCPU/4GB Droplet $24/mo; t3.medium ~$30/mo on-demand). **@1000 DAU:** $40-150/mo (larger box or 2-3 workers).
- **Latency:** Warm box, no cold start. Run latency = compile+exec (~sub-1s for interpreted, 1-3s for C++/Java compile). Best interactive feel of all options.
- **Sandbox strength:** Strong (isolate = namespaces + cgroups + seccomp). Battle-tested for competitive-programming/untrusted code. Weaker than microVM but purpose-built for exactly this.
- **Ops burden:** **3.** One VM to patch; cgroup-v1 boot config is a one-time gotcha. Docker Compose keeps it simple. Front with a small API token + the queue.
- **Best fit for Phase 1.** Front EC2/Droplet with the Vercel route as the API proxy (Judge0 itself never faces the internet).

### 2. Managed Judge0 (judge0.com / Sulu)
- **Pricing (verified against judge0.com):** Pro 2,000 submissions/day, Ultra 5,000/day, Mega 10,000/day, + per-extra-submission overage. **Gated on daily caps, NOT concurrency** — no RPS or parallelism guarantee is published.
- **Implication:** Removes the ops burden but the daily-cap model is the same shape as the RapidAPI problem; a spiky burst can still exhaust the daily quota. No concurrency SLA.
- **Ops burden:** **1.** **Cost:** higher per-submission than a $15 VM at low scale.
- **Verdict:** Reasonable zero-ops stopgap, but you're paying to not solve the concurrency model. Prefer self-host for control.

### 3. E2B (e2b.dev) — the Phase-2 target
- **Architecture:** Firecracker microVMs, per-sandbox dedicated kernel — **strongest isolation tier** for untrusted code. ~125-200ms cold start (comfortably sub-2s). High density (~3-5 MB overhead/microVM, ~150 microVMs/sec/host).
- **Self-hostable? YES (corrected).** Apache-2.0; self-host via Terraform + Nomad + Packer. **GCP is the primary/stable target; AWS is Beta/in-progress.** *(An earlier vendor-blog claim that E2B is "not self-hostable / no BYOC" was REFUTED by E2B's own repo + self-host docs.)*
- **SaaS pricing (verified, primary source):** Pro **$150/mo base + usage** ($0.0504/vCPU-hr + $0.0162/GiB-hr; per-second billing fits spiky/idle). $100 free credits.
- **Concurrency reality (verified, marketing corrected):** Hobby **20** concurrent / Pro **100** / +$500/mo add-on → up to **1,100** / Enterprise (~$3k/mo min or BYOC) → more. The homepage "tens of thousands of concurrent sandboxes" is a cherry-picked RL/HuggingFace case-study figure, **REFUTED** as a self-serve guarantee. For 100-1000 DAU, Pro's 100 concurrent is adequate (code runs are short-lived; 100 simultaneous *in-flight* executions ≠ 100 DAU).
- **Languages:** Python, JS/TS, Java, Go confirmed; C++ via custom Linux templates (any language via custom template). Note: E2B's default *code-interpreter* set historically emphasized Python/JS — C++/Go need a custom template, which E2B supports.
- **Ops burden:** **1** (SaaS) / **4** (self-host Firecracker — Linux/KVM-only, needs nested virt, "hard to operate"). Use SaaS.
- **Verdict:** Best long-term backend. Usage-based billing suits spiky traffic. Slightly higher per-run cost than a dedicated VM, but near-zero ops and top-tier isolation.

### 4. Alternative sandboxes (composable)
- **Piston (engineer-man):** OSS, self-hosted multi-language executor, lighter than Judge0. Viable Judge0 alternative on a VM; smaller ecosystem. *(Limited primary coverage in this pass — validate before adopting.)*
- **Firecracker direct / gVisor:** Firecracker = strongest isolation (~125-290ms boot, <5MiB overhead, basis of AWS Lambda) but Linux/KVM-only and **hard to operate** (ops 5) — this is exactly what E2B manages for you. gVisor = syscall-level isolation, middle tier, 10-30% I/O overhead, natural fit for Kubernetes; weaker than microVM, stronger than plain containers.
- **Plain ephemeral containers via queue:** share host kernel → container-escape risk → **not suitable for untrusted multi-tenant code** without gVisor/microVM on top.
- **Vercel Sandbox:** Firecracker-based but constrained runtimes (node + python3.13 only) and single iad1 region — **too limited** for Java/C++/Go.

### 5. The concurrency-control layer (needed regardless of backend)
This is the actual fix for "concurrent users." Vercel functions are per-request isolated, so an in-process limiter (`p-limit`, already a dep) cannot coordinate across users. You need **shared external state**:
- **Upstash Redis token-bucket** (`@upstash/ratelimit`) — serverless-native, pairs with Vercel, the cleanest fit. *(Note: `@upstash/queue` is a stale community project — 85 stars, last release 2024, not officially supported — use `@upstash/ratelimit` for the token bucket, not the queue lib.)*
- **AWS SQS / GCP Cloud Tasks** — durable queue if you want backpressure + retries managed; heavier than a Redis bucket.
- **Existing in-repo primitive:** there's already a DB-backed `findRateLimitBlock` helper (used by `/api/auth/magic-link`) — could back a token bucket without new infra, at the cost of Postgres round-trips per run.

---

## Recommended architecture & phased path

```
Phase 0 (now):  Vercel route → Judge0 CE (RapidAPI), but BATCHED (1 req) + retry/backoff
Phase 1 (week): Vercel route → [Upstash token-bucket] → self-hosted Judge0 on Hetzner/EC2 VM
Phase 2 (scale): Vercel route → [Upstash token-bucket] → E2B (SaaS) microVMs
                 (queue/abstraction unchanged; only the executor swaps)
```

**Why this order:**
- Phase 0 stops the bleeding for single users immediately, cheaply, reversibly.
- Phase 1 removes RapidAPI's per-key wall, gives real concurrency control, costs ~$15-40/mo, warm/low-latency. The queue is the durable abstraction.
- Phase 2 upgrades isolation + scale + ops-simplicity when usage justifies the $150/mo+ floor. Because Phase 1 put a queue/executor boundary in place, E2B is a backend swap behind the same interface — matching the team's stated "support E2B next" direction.

**Codebase changes this implies (for the eventual plan):**
- `src/lib/judge0/client.ts:6` — `JUDGE0_HOST` is hardcoded to `judge0-ce.p.rapidapi.com`; make it env-driven so the same code points at RapidAPI → self-host → (later) an E2B adapter.
- `src/app/api/code/run/route.ts:287-309` — replace parallel `Promise.all` per-test submits with batch submit + the queue gate; keep all result-mapping/compare logic.
- Add `@upstash/ratelimit` + an Upstash Redis (or reuse the DB-backed limiter) for the token bucket.
- Ensure `JUDGE0_RAPIDAPI_KEY` / future `JUDGE0_HOST` set in every Vercel env (prod included) — else the route returns the 503 "not configured" path.

## Avoid
- **ECS Fargate / GCP Cloud Run for Judge0** — no privileged mode, isolate won't run. (Verified.)
- **`@upstash/queue`** — unmaintained community project; use `@upstash/ratelimit`.
- **Plain containers for untrusted code** — escape risk without gVisor/microVM.
- **Vercel Sandbox** — runtime-limited (node/python only), wrong for Java/C++/Go.
- **DIY Firecracker** as a near-term move — high ops burden; let E2B manage it.

## Open items to validate before building
- Piston vs Judge0 head-to-head for the 5 required languages (Piston coverage was thin this pass).
- E2B C++/Go custom-template effort and per-run cost at expected volume.
- Whether the existing DB-backed `findRateLimitBlock` is sufficient as the token bucket, or Upstash Redis is worth adding.
