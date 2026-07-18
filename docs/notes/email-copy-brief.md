# Email copy brief

The single source of truth for the 2026-07 email copy rework. Every sender in
`src/lib/email/senders/*` gets rewritten against this brief. The engine already
supports everything you need: see the payload fields cheatsheet below.

## Register

CLAUDE.md Writing Style applies to every user-facing string. Shreyas Doshi in a
tweet thread: direct, confident, slightly opinionated. Hard bans: em dashes in
prose (the Hatch signature line "— Hatch, your HackProduct coach" is the one
allowed exception), AI slop words (delve, leverage, utilize, holistic, robust,
seamlessly, ensure, unlock-as-verb, tailored, navigate, landscape, in order to,
as well as), "you are a"-style role framing, and sentence fragments posing as
prose. Hatch is "it", never "she" or "he".

## The rules every email follows

1. **Preview text**: every email sets `previewText`, a curiosity hook that
   extends the subject rather than repeating it. This is the line Gmail shows
   after the subject.
2. **Name where we have it**: subjects use the first name when it reads
   naturally ("Your week: 4 challenges, 210 XP"). Never force it.
3. **Concrete stakes first**: the opening paragraph names what is at stake for
   THIS user, specifically. "You have practiced 6 days in a row. The 1.3x XP
   multiplier you built is real." Not "We noticed you've been busy!"
4. **Real urgency only**: `deadline` requires an actual ISO date from real data
   (streak reset window, Stripe periodEnd, payment retry date). If there is no
   real deadline, there is no urgency banner. Never invent scarcity.
5. **One idea per paragraph, 2-4 paragraphs** for lifecycle emails. Longer than
   today's one-liners, but every sentence earns its place.
6. **CTA labels are verbs with objects**: "Keep the streak", "Read your
   feedback", "Fix payment". Not "Click here", not "Learn more".
7. **Long emails repeat the CTA** (`repeatCta: true`) so the reader at the
   bottom never scrolls back up.
8. **Closing instruction**: lifecycle emails end the last paragraph with one
   concrete next action ("Tonight's session counts even if it is four
   minutes.") before the sign-off.
9. **Stats belong in the grid**: numbers go in `stats` cards, never pipe-joined
   into `detail`.
10. **Content cards sell the content**: `contentCards` descriptions make the
    reader want the thing itself, in 2-3 sentences, the way a good back-cover
    blurb works. Never describe the button.

## Treatment tiers

| Tier | File | Treatment |
|---|---|---|
| a. Lifecycle | `senders/lifecycle.ts` | Full long-form: hero pose, 2-4 paragraphs, bullets or stats or cards, real-deadline banner where one exists, primary + secondary CTA, repeatCta on long ones, Hatch sign-off (default) |
| b. Auth | `senders/auth.ts` | Branded, single CTA, one "what happens next" line, expiry specifics, one "did not request this?" safety line. No hero, no marketing, no urgency banner, default sign-off suppressed (`signoff: null`) |
| c. Billing | `senders/billing.ts` | Facts first (statGrid with amount/plan/date), value reinforcement second, honest win-backs, real deadlines only (periodEnd, retry date). Sign-off default |
| d. Internal | `senders/internal.ts` | Terse. statGrid replaces pipe-joined detail. `signoff: null`. No marketing anything |

## Payload cheatsheet (all optional unless noted)

```
subject, eyebrow, heading, body      required
previewText                          inbox preview line (falls back to body)
bodyParagraphs: string[]             paragraphs after body
stats: {label, value, sublabel?}[]   2x2 stat cards
deadline: {label, at: ISO}           amber banner; needs a REAL date or renders nothing
valueBullets: string[]               green-check list
contentCards: {eyebrow,title,description,ctaLabel,ctaUrl}[]
ctaLabel/ctaUrl, secondaryCta        buttons
repeatCta: true                      repeats primary CTA before sign-off
tone: 'default'|'celebratory'|'urgent'
heroImageUrl: EMAIL_ART['hatch-*']   poses: wave, point, read, unlock, celebrate, insight
signoff: undefined | string | null   undefined = "— Hatch, your HackProduct coach"; null = none
```

## Reference blocks (the quality bar — match this, do not undershoot it)

### streak_reminder (tier a)

```ts
subject: `Day ${streakDays}. Your streak resets at midnight.`
previewText: 'One four-minute session keeps the multiplier you built.'
eyebrow: 'Practice streak'
heading: `${streakDays} days of showing up.`
tone: 'default'
heroImageUrl: EMAIL_ART['hatch-celebrate']
body: `You have practiced ${streakDays} days in a row. That is not a vanity number: the XP multiplier it earns is real, every challenge you complete right now pays out ${multiplier}x, and it took ${streakDays} days to build.`
bodyParagraphs: [
  'One session tonight keeps it. Skip today and the counter goes back to 1, and the multiplier goes with it. A Quick Take counts, and it takes about four minutes.',
]
stats: [
  { label: 'Current streak', value: `${streakDays} days` },
  { label: 'XP multiplier', value: `${multiplier}x`, sublabel: 'Resets if the streak breaks' },
]
deadline: { label: 'Streak resets at midnight PT tonight', at: <real reset ISO> }
ctaLabel: 'Keep the streak'   ctaUrl: /challenges
secondaryCta: { label: 'Do a 4-minute Quick Take', url: /dashboard#quick-take }
```

### weekly_digest (tier a)

```ts
subject: `Your week: ${challengesCompleted} challenges, ${xpEarned} XP`
previewText: `Your ${strongest} answers are landing. ${weakest} is where the next gains are.`
eyebrow: 'Weekly digest'
heading: 'Here is what your practice added up to.'
tone: challengesCompleted > 0 ? 'celebratory' : 'default'
heroImageUrl: EMAIL_ART['hatch-insight']
body: `You put in real reps this week. The numbers below are the summary, but the more useful part is the pattern: your ${strongest} answers are consistently landing, and ${weakest} is where the next gains are.`
stats: [
  { label: 'Challenges', value: String(challengesCompleted) },
  { label: 'XP earned', value: String(xpEarned) },
  { label: 'Strongest area', value: strongest },
  { label: 'Focus area', value: weakest },
]
bodyParagraphs: [recommendationCopy ?? `Pick one ${weakest} challenge this week and treat it as the main event. One deliberate rep on a weak area moves your profile more than three on a strong one.`]
ctaLabel: 'Open your dashboard'   ctaUrl: /dashboard
secondaryCta: { label: `Practice ${weakest}`, url: /challenges }
repeatCta: true
// Zero-activity variant (challengesCompleted === 0): heading 'A quiet week. Easy to fix.',
// no stats grid, single honest paragraph, no urgency, default tone.
```

### trial_ending (tier c)

```ts
subject: `Your Pro trial ends ${formattedDate}`
previewText: 'No surprise charges is the whole point of this email.'
eyebrow: 'Trial ending'
heading: `${daysLeft} days left on your Pro trial.`   // derive from periodEnd, never hardcode "tomorrow"
tone: 'urgent'
heroImageUrl: EMAIL_ART['hatch-unlock']
body: `Your 7-day Pro trial ends on ${formattedDate}. After that, ${planLabel} starts automatically at ${price} unless you cancel first. No surprise charges is the whole point of this email.`
bodyParagraphs: [
  'Here is what stays if you keep Pro, so the decision is easy:',
  `If Pro is not for you right now, cancel in one click from settings before ${formattedDate} and you will not be charged. Everything you practiced stays on your account either way.`,
]
valueBullets: [
  '80 practice questions a month instead of 3',
  'Live interview sessions with spoken feedback',
  'Strengths and gaps tracked across everything you do',
  '40+ breakdowns of real product decisions',
]
deadline: { label: `Trial ends ${formattedDate}`, at: periodEnd }
ctaLabel: 'Keep Pro'   ctaUrl: /settings
secondaryCta: { label: 'Manage or cancel', url: /settings }
```

## Per-email briefs

### senders/lifecycle.ts
- **welcome**: already near the bar. Add previewText, a "what your first week looks like" second paragraph (day 1 one rep, day 2 read the feedback, day 3 the pattern shows), keep bullets, add closing instruction + sign-off.
- **streak_reminder**: reference block above. Input gains `multiplier?: number | null` and `resetAtIso?: string | null` (compute in the cron from the streak window; omit the deadline if not derivable).
- **weekly_digest**: reference block above, incl. zero-activity variant.
- **challenge_completion**: tone celebratory, hero hatch-celebrate, stats (Score, XP earned), P1 = what Hatch found notable is waiting (name the challenge), P2 = the feedback names what a stronger answer does differently, closing instruction "Read it while the attempt is fresh." CTA 'Read your feedback'.
- **resume_challenge**: hero hatch-point. P1 stakes: the thinking you already did is saved, but it goes stale in your head, not in the app. contentCard for the paused challenge (eyebrow 'Paused rep', title = challengeTitle, description = where they stopped + what finishing gets them, CTA 'Continue'). No fake deadline.
- **upgrade_nudge**: keep bullets, add previewText + P2 grounding in their actual usage ("You have used your 3 free challenges this month" when the cron knows it), sign-off, repeatCta.
- **resume_article**: 2 paragraphs, keep the back-half hook, contentCard for the article.
- **promotion**: passthrough; expose new fields (stats, deadline, contentCards, previewText, repeatCta) on PromotionInput so one-off sends can use them.
- **lead_magnet_unlock**: copy lives in src/lib/leads; just add previewText passthrough + keep leads audienceNote.
- **paid_insight**: stats (Strongest, Focus), keep wins bullets, tone celebratory, P2 with one specific instruction for the week.
- **activation_day1/3/7**: keep the strong existing openers, add a contentCard with a concrete named first rep, previewText, closing instruction. day7 stays the honest last email and says so.

### senders/auth.ts
- **verification**: body + "The link expires in 24 hours." + safety line "If you did not create a HackProduct account, ignore this email; nothing happens without the link." `signoff: null`.
- **magic_link**: same shape; expiry specifics; safety line "Nobody can sign in without this email."
- **password_reset**: same shape; "If you did not request this, your password is unchanged."

### senders/billing.ts
- **payment_receipt**: statGrid (Amount, Plan, Next billing date), P2 value reinforcement ("Here is what that covers this month") + 3 bullets, CTA 'View billing'.
- **payment_failed**: tone urgent, statGrid (Amount due, Plan), REAL deadline if the retry date is known (input gains `retryAtIso?`), factual what-pauses list (Pro limits, live interviews), CTA 'Fix payment', closing "It usually takes under a minute."
- **payment_action_required**: tone urgent, one clear step, honest "your bank asked for one more confirmation" framing.
- **trial_ending**: reference block above.
- **cancellation_scheduled**: trust-first: exact end date in stats + deadline banner, what stays vs what pauses, honest one-paragraph win-back, secondary CTA 'Keep Pro'.
- **cancellation_confirmed**: what Free still includes (3 bullets from real limits), honest win-back without guilt, CTA 'Open dashboard', secondary 'See Pro again'.
- **subscription_reactivated**: tone celebratory, stats (Plan, Next billing date), short warm confirmation.
- **plan_changed**: stats (New plan, Next billing date), plain confirmation, one line on what changed.
- **affiliate_payout**: stats (Amount, Destination), thanks with a concrete number framing, CTA to affiliate dashboard.

### senders/internal.ts
- **discussion_reply**: quote the excerpt in a contentCard (eyebrow 'Reply', title = author, description = excerpt), CTA 'View reply'. Sign-off default (user-facing).
- **account_deleted**: respectful, states exactly what was removed and that it is final, no CTA, `signoff: null`.
- **abuse_report / product_feedback / growth_report**: statGrid instead of pipe-joined detail, `signoff: null`, keep terse.

## Checklist per rewritten sender

- [ ] previewText set
- [ ] body 2+ sentences with concrete stakes (tier a/c)
- [ ] numbers in stats, not detail
- [ ] deadline only from real data
- [ ] CTA label verb+object
- [ ] closing instruction (tier a)
- [ ] signoff correct for tier
- [ ] no em dashes / slop words / role framing (run scripts/lint-email-copy.ts)
