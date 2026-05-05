# HackProduct Writing Style Guide

The canonical voice for every word the platform produces: chapter bodies, challenge scenarios, MCQ options, nudges, coaching feedback, grading explanations, UI copy, emails, and push notifications. When a skill or prompt or component generates user-facing text, this is the spec it follows.

## The register

Write like Shreyas Doshi in a tweet thread, or an opinionated staff engineer thinking out loud in a product review. Direct. Confident. Slightly opinionated. Academic tone is wrong. Corporate tone is worse.

The reader is an engineer (staff engineer, tech lead, founding engineer, EM, SWE). The tone matches the kind of colleague they would actually listen to: someone who has shipped, who names the thing, who does not hedge.

## Hard rules

These are enforced by the content generation validator and must be observed everywhere.

**No second-person role framing.** Never open a scenario or question with *"you are a tech lead"*, *"as a senior engineer"*, *"imagine you work at"*, or *"you're a PM at..."*. Drop into the situation as if the reader is already in it. Role is metadata used for filtering and role lenses, it is never copy.

**No em dashes.** Use a comma, a period, or restructure the sentence. Not a stylistic preference, a hard ban.

**No AI slop.** Words and phrases that signal the text was written to sound thorough rather than to be read: *delve*, *leverage*, *utilize*, *holistic*, *robust*, *seamlessly*, *it's worth noting*, *in order to*, *as well as*, *embark on*, *navigate*, *unlock*, *landscape*, *tapestry*, *ensure*, *tailored*, *cutting-edge*, *revolutionary*, *game-changing*. If a word is doing nothing except making the sentence sound longer, cut it.

**Coherent sentences, not fragments.** Short fragment-style prose (*"Four moves. Real problem is upstream. Best option was not on the list."*) reads like a bulleted speech rather than writing. Combine related ideas into full flowing sentences that connect to one another. Exception: closing aphorisms in UI chrome (buttons, badges, tags) where terseness is correct.

## What good looks like

### Scenario context

**Bad (role-framed):** *"You're three months into owning the SMB product at a Series B fintech."*

**Bad (corporate):** *"The VP of Product has asked you to evaluate whether the company should expand into a new market segment."*

**Good:** *"Notifications went from 3 a day to 18. DAU dropped 14% the same week. The activity digest quadrupled notification volume. Customer success is hearing 'too many pings' on every call."*

### Option text in an MCQ

**Bad (role-framed):** *"As a tech lead, I would segment users by notification volume and measure churn correlation."*

**Bad (textbook):** *"Apply behavioral segmentation methodology to identify high-volume cohorts."*

**Good:** *"Segment users by notifications received per day and check whether the top quintile is churning faster than the median, because if it is then volume is a proxy for the real problem and the real problem is signal."*

### Nudge

**Bad (tells you the answer):** *"Consider what the root cause might be before jumping to solutions."*

**Good:** *"What would have to be true for this to still be a problem six months from now?"*

### Explanation (why something matters)

**Bad (instruction, rubric language):** *"This question tests strategic thinking and the ability to identify upstream causes rather than treating symptoms."*

**Good:** *"Most people fix the thing that's visibly broken, but the better move is asking what made it breakable in the first place, which is the difference between a patch and a structural change."*

### Coaching feedback

**Bad (motivational, hedged):** *"Great try! Consider exploring alternative framings that might surface additional insights."*

**Good:** *"The framing you picked is correct but it is the second-best framing, because it treats the retention drop as the thing to explain rather than the thing to be explained by a change upstream of retention."*

### Grading explanation

**Bad (diplomatic):** *"The answer demonstrates some good thinking but could be strengthened."*

**Good:** *"The answer names a tradeoff but not the sacrifice, which is the move that separates a real tradeoff from a preference."*

### UI chrome (buttons, labels, status text)

Terse is correct here. *"Mark complete"*, *"Publish"*, *"Retry generation"*. Full sentences and storytelling belong in the body, not the chrome.

## Where this applies

Every generated or authored artifact. This list is not exhaustive but covers the common places.

- Challenge scenarios (`context`, `trigger`, `question`, `explanation`, `engineer_standout`)
- Question text and nudges
- MCQ option text and explanations
- Grading explanations and theme signals
- Luma coaching feedback (role context, career signal)
- Learn chapter bodies, hooks, titles, subtitles
- Competency labels and weakness descriptions
- Push notifications and emails
- Admin UI copy that appears next to user-facing content

## Where this does NOT apply

- Code comments for other developers
- Migration file SQL comments
- Internal docs that are explicitly reference material (like this file)
- Technical README sections
- Error messages meant for developers, not end users

## One-line summary

**Direct, grounded, opinionated. No role framing. No em dashes. No slop. Full sentences that flow. Every sentence earns its place.**
