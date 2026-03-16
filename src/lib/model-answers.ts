/* ─── Model answer types ─────────────────────────────────────── */

export interface CoachingNote {
  text: string; // italic inline coaching note
}

export interface AnswerBlock {
  type: "prose" | "coaching" | "trap" | "highlight" | "closing";
  content: string;
  /** Only used for type=highlight: the term to visually highlight */
  term?: string;
}

export interface AlternativeApproach {
  name: string;
  summary: string; // 2 sentences
  tradeoff: string; // "This approach prioritizes X over Y"
}

export interface ModelAnswer {
  challengeId: string;
  challengeTitle: string;
  domain: string;
  sections: {
    title: string; // subtle section label
    blocks: AnswerBlock[];
  }[];
  alternatives: AlternativeApproach[];
  oneThing: string; // closing callout
}

/* ─── Model answer for M3 ────────────────────────────────────── */
export const M3_MODEL_ANSWER: ModelAnswer = {
  challengeId: "M3",
  challengeTitle: "Design a route optimization feature for couriers",
  domain: "Logistics",
  sections: [
    {
      title: "Diagnosis",
      blocks: [
        {
          type: "prose",
          content:
            "The first thing I do is decompose the metric. Offer acceptance rate dropped from 74% to 48% — a 26-point decline concentrated in two districts, two peak windows, over three weeks. That specificity is a gift. It tells me this isn't a systemic product failure; it's a localized behavioral shift. Couriers in Zona Sul and Centro are making a deliberate choice to reject offers. The question is why.",
        },
        {
          type: "coaching",
          content:
            "Notice how the diagnosis starts with the metric decomposition, not the feature list. That's the move most people skip. Before you can fix anything, you need to understand what the data is actually telling you versus what you're inferring.",
        },
        {
          type: "prose",
          content:
            "The interview data (n=22) gives us qualitative signal, not statistical proof. Couriers say routes feel inefficient — they're routed through congestion, multi-order stacks require backtracking. But courier perception of route quality and actual route quality are two entirely different problems. One is an algorithm failure. The other is a communication failure. Both are real, but they have very different solutions and very different costs to fix.",
        },
        {
          type: "trap",
          content:
            "The trap here is treating courier perception as ground truth. Twenty-two interviews in one city, self-selected by the operations team, skewed toward the most vocal complainers. That's a signal, not a verdict. You need to cross-reference it against the quantitative data before committing to a 6-week engineering build.",
        },
      ],
    },
    {
      title: "Hypotheses",
      blocks: [
        {
          type: "prose",
          content:
            "I rank three hypotheses by likelihood, working from the data I have. First: the routing algorithm is genuinely producing suboptimal paths — elevated actual travel time versus estimated, concentrated in peak hours when traffic is least predictable. Second: the algorithm is fine but couriers don't trust it because the app doesn't show them the reasoning — they see a route, not why that route was chosen. Third: the acceptance rate drop is a reaction to something else entirely — a recent earnings-per-hour shift, a competitor offer, a new policy — and route quality is a convenient rationalization.",
        },
        {
          type: "coaching",
          content:
            "Hypothesis 3 sounds cynical but it's the right instinct for a PM. Couriers have an economic relationship with DoorDash. Any time you see a behavioral shift, ask: what changed in the value exchange? The routing complaints may be the stated reason, not the root cause.",
        },
        {
          type: "prose",
          content:
            "I assign rough probabilities: H1 (algorithm failure) at 45%, H2 (trust and transparency failure) at 35%, H3 (economic cause) at 20%. The 18-month historical delivery data is my first checkpoint — I want actual vs. estimated route time deltas, broken down by district and hour. If the algorithm is failing, that signal will be unmistakable.",
        },
      ],
    },
    {
      title: "Validation",
      blocks: [
        {
          type: "prose",
          content:
            "Here's the validation move I would make before writing a single line of routing code. I'd surface the estimated versus actual route time to couriers before they accept the offer. Not after — before. This requires zero changes to the routing engine. It's a UI change. A courier sees: 'This route is estimated at 22 minutes. Based on conditions in this zone, historical average is 26 minutes.' They can make an informed decision. I'd run this for two weeks and measure acceptance rate change.",
        },
        {
          type: "highlight",
          term: "zero-engineering test",
          content:
            "This is what I call a zero-engineering test: a change you can ship in days that gives you signal worth six weeks of build time. If surfacing this transparency doesn't move acceptance rate, you've just learned that couriers don't trust the data — they need the algorithm to actually change. If it does move the needle, you've fixed 35% of your problem with a UI change and given yourself the confidence to prioritize the routing engine work.",
        },
        {
          type: "coaching",
          content:
            "The purpose of validation isn't to avoid building things. It's to make sure you're building the right thing. 'Enough confidence' here means: you can tell engineering exactly which hypothesis you're solving for, with data that supports the prioritization.",
        },
      ],
    },
    {
      title: "Recommendation",
      blocks: [
        {
          type: "prose",
          content:
            "Sprint 1 is the transparency experiment: show estimated vs. actual route time before offer acceptance, in Zona Sul only, for a 50% holdout test. Ship in 1–2 weeks. Measure acceptance rate delta. If we see ≥5pp improvement, we have signal that trust is the primary lever and we expand to Centro before touching the routing engine.",
        },
        {
          type: "prose",
          content:
            "If the transparency experiment shows no movement, we escalate to the routing engine work in sprint 2. Engineering has scoped this at 6 weeks. I'd sequence it as: week 1–2 analysis of historical route efficiency data, week 3–4 algorithm updates for peak-hour congestion routing, week 5–6 A/B test on route quality in both districts with a 25% rollout. Metric targets: acceptance rate back to 65%+ within 30 days of full rollout, 70%+ by 90 days.",
        },
        {
          type: "prose",
          content:
            "The tradeoff I'm accepting: I'm not shipping the full routing engine change in sprint 1. I'm giving up 4–5 weeks of potential GMV recovery to buy confidence. At $180K/month in recoverable GMV, that's approximately $30K in delayed recovery. Against a 6-week engineering build that might solve the wrong problem, that's a straightforward bet.",
        },
        {
          type: "coaching",
          content:
            "The scope discipline here is what senior PMs internalize over time. Your job isn't to ship the biggest possible feature — it's to maximize the probability that what you ship actually works. A staged approach with clear decision gates is almost always better than a big-bang launch when the root cause is still uncertain.",
        },
      ],
    },
  ],
  alternatives: [
    {
      name: "The Supply-Side First Approach",
      summary:
        "Investigate whether the acceptance rate drop is actually an earnings-per-hour problem disguised as a routing complaint. Run a 2-week earnings transparency experiment — show couriers projected hourly earnings before accepting — before touching route optimization at all. If earnings transparency restores acceptance rates, the routing work gets deprioritized permanently.",
      tradeoff:
        "This approach prioritizes economic root cause analysis over the stated routing complaint, accepting slower time-to-fix in exchange for not building the wrong thing.",
    },
    {
      name: "The Full Build Approach",
      summary:
        "Accept the engineering team's scoping and ship the full routing engine improvement in 6 weeks. Use the 18-month historical data to retrain the algorithm, run an A/B test across both districts simultaneously, and treat the courier interviews as sufficient validation. The $180K/month GMV impact justifies moving fast.",
      tradeoff:
        "This approach prioritizes speed of recovery over hypothesis validation, accepting the risk of a 6-week build that solves the wrong problem in exchange for potentially faster GMV recovery.",
    },
    {
      name: "The Courier Advisory Approach",
      summary:
        "Before making any product changes, recruit 8–10 couriers in the affected zones for a 3-day ride-along observational study. GPS-track their actual routes versus the app's recommendations, and interview them in real time as they make acceptance decisions. Use the findings to build a precise spec before any sprint begins.",
      tradeoff:
        "This approach prioritizes qualitative depth over quantitative speed, accepting a 2–3 week discovery delay in exchange for much higher confidence that the root cause is correctly identified.",
    },
  ],
  oneThing:
    "The zero-engineering test before the six-week build. That single move — surfacing estimated vs. actual route time before offer acceptance — costs almost nothing, validates the core hypothesis, and might solve 35% of the problem without touching the routing engine. Every senior PM answer has this shape: find the fastest path to signal before committing engineering time. The rest of the answer is good. That's what makes it great.",
};

/* ─── Model answer for E1 ────────────────────────────────────── */
export const E1_MODEL_ANSWER: ModelAnswer = {
  challengeId: "E1",
  challengeTitle: "Design a payment failure recovery flow",
  domain: "Payments",
  sections: [
    {
      title: "Diagnosis",
      blocks: [
        {
          type: "prose",
          content:
            "An 8.3% failed renewal rate against a 3–4% industry average is a product problem, not a payments problem. The gap is too large and too consistent to be explained by bad luck or an unusual customer mix. Something about the current recovery flow is failing — and the 61% unrecovered failure rate confirms it. The default recovery path (one email, three days later, immediate access cutoff) isn't working.",
        },
        {
          type: "coaching",
          content:
            "The diagnostic frame here is: what does the data tell us about where the recovery flow is failing? We have decline reason codes. That's a gift. Most teams look at total failed payment rate and optimize for it. The right move is to decompose by reason code before designing any intervention.",
        },
        {
          type: "prose",
          content:
            "The breakdown tells a clear story: insufficient funds at 34% and expired card at 28% together account for 62% of failures — and both are recoverable with the right intervention. Insufficient funds is a timing problem. Expired card is a proactive notification problem. Stolen/blocked card (19%) and do-not-honor (12%) have much lower recovery ceilings and require different logic entirely.",
        },
        {
          type: "trap",
          content:
            "The trap here is treating all payment failures as one problem and building one recovery flow. That's what the current system does — one email, three days later, no segmentation. The reason it recovers only 39% of failures is that it applies the same passive intervention to customers who need completely different things.",
        },
      ],
    },
    {
      title: "Hypotheses",
      blocks: [
        {
          type: "prose",
          content:
            "I work from the highest-volume, highest-recoverability segments first. For insufficient funds (34%): the core insight is payday cycle timing. If a customer failed on the 3rd of the month, retrying on the 15th or 1st costs nothing and has meaningful recovery probability. The current system doesn't retry at all. For expired card (28%): this is almost entirely preventable with proactive outreach 30 and 7 days before the card expires. These customers intend to pay — they just forget.",
        },
        {
          type: "highlight",
          term: "decline-reason segmentation",
          content:
            "This framing — treating each decline reason as a distinct product problem — is what I call decline-reason segmentation. It sounds obvious once you say it, but most teams don't do it because it requires coordination between the payments, product, and lifecycle email teams. The reward is a recovery flow that's significantly more effective because it's actually designed for the specific failure mode.",
        },
      ],
    },
    {
      title: "Validation",
      blocks: [
        {
          type: "prose",
          content:
            "Before building anything, I'd validate two assumptions. First: do payday-aligned retries actually outperform fixed-interval retries for the insufficient funds segment? Pull the last 12 months of failed insufficient-funds charges and match them against the customer's historical payment success dates. If there's a payday signal, it will be visible in the data. Second: does a 7-day grace period (continued access after failed charge) improve recovery rate without unacceptably increasing abuse?",
        },
        {
          type: "prose",
          content:
            "For the grace period: industry data puts the sweet spot at 5–10 days before abuse rates rise. I'd start at 7 days, measure the recovery rate of customers in the grace period versus those without access, and track abuse signals (customers who recover and immediately cancel, payment methods flagged as fraudulent) weekly for the first 90 days. If abuse stays below 2% of recovered customers, the grace period is net positive.",
        },
        {
          type: "coaching",
          content:
            "Notice that 'validate' here means two things: validate with existing data before building (the retry timing analysis), and validate with a controlled experiment after building (the grace period A/B test). Both are necessary. The data validation prevents you from building the wrong thing; the experiment tells you whether what you built actually works.",
        },
      ],
    },
    {
      title: "Recommendation",
      blocks: [
        {
          type: "prose",
          content:
            "I'd ship a three-track recovery flow. Track 1 — Insufficient Funds: intelligent retry on day 7, 15, and 1 of the following month (payday-aligned), with a 7-day grace period from failure date. In-app notification on day 1 with a payment update prompt. Email sequence: day 1 (empathetic, soft), day 4 (direct, update payment method), day 7 (urgency, grace period ending). Track 2 — Expired Card: 30-day and 7-day proactive email before expiry with a direct link to update. On failure, immediate in-app prompt with card update flow. Track 3 — Stolen/Blocked: one email, one in-app prompt, no retries (these won't recover without the customer actively switching payment methods).",
        },
        {
          type: "prose",
          content:
            "Success metrics for 90-day review: overall failed payment recovery rate (target: 55%, from current 39%), recovery rate by decline reason (insufficient funds target: 50%, expired card target: 65%), time-to-recovery median (target: ≤10 days), grace period abuse rate (target: ≤2%), and downstream 12-month LTV of recovered customers versus organic renewals (I expect recovered customers to have higher churn — I want to quantify this, not ignore it).",
        },
        {
          type: "coaching",
          content:
            "The LTV metric is the one most teams forget. Recovered customers are not the same as customers who never failed. They're more likely to churn again. Building this into your success framework from day one prevents a false-positive result where you celebrate a high recovery rate but miss a downstream LTV problem.",
        },
      ],
    },
  ],
  alternatives: [
    {
      name: "The Grace Period First Approach",
      summary:
        "Implement a 7-day grace period immediately — with zero retry logic changes — as the highest-leverage single intervention. Let customers continue using the product while the existing email sequence runs, then measure recovery rate improvement before building the full multi-track flow.",
      tradeoff:
        "This approach prioritizes speed of first intervention over completeness, accepting a simpler v1 in exchange for shipping in days rather than weeks.",
    },
    {
      name: "The Proactive Prevention Approach",
      summary:
        "Shift the strategy upstream: focus the first sprint entirely on preventing expired card failures with 30/7-day proactive notification, rather than improving recovery after failure. Expired cards (28%) are nearly 100% preventable and represent the lowest-complexity intervention.",
      tradeoff:
        "This approach prioritizes prevention over recovery, accepting slower improvement to overall recovery rate in exchange for eliminating a large, avoidable failure category.",
    },
    {
      name: "The Account Pause Approach",
      summary:
        "Instead of a grace period, introduce an 'account pause' state: customers who fail payment keep read-only access to their data but cannot use new features. This removes the binary access-cutoff cliff while giving a clear recovery incentive and reducing perceived abuse risk.",
      tradeoff:
        "This approach prioritizes customer experience continuity over simplicity, accepting more engineering complexity in exchange for a recovery incentive that doesn't feel like a freebie.",
    },
  ],
  oneThing:
    "Decline-reason segmentation before you design a single touchpoint. The current flow fails because it treats all payment failures as one problem. The moment you separate insufficient funds from expired card from stolen card, you have three different recovery problems with three different solution shapes. Everything else in this answer follows from that one structural decision.",
};

export const MODEL_ANSWER_MAP: Record<string, ModelAnswer> = {
  m3: M3_MODEL_ANSWER,
  e1: E1_MODEL_ANSWER,
};

export function getModelAnswer(challengeId: string): ModelAnswer | null {
  return MODEL_ANSWER_MAP[challengeId.toLowerCase()] ?? null;
}
