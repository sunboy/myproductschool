// scripts/seed-root-cause-module.ts
//
// Seeds Root Cause module prose + structured figures.
// Run: npx tsx --tsconfig tsconfig.json scripts/seed-root-cause-module.ts

import { createClient } from '@supabase/supabase-js'
import type { ChapterFigure } from '../src/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MODULE_SLUG = 'root-cause'

type ChapterSeed = {
  slug: string
  sort_order: number
  body_mdx: string
  figures: ChapterFigure[]
}

// ── Chapter 1 ────────────────────────────────────────────────────────────────

const CH1: ChapterSeed = {
  slug: 'chapter-1',
  sort_order: 1,
  body_mdx: `## The superpower you already have

Every engineer who has debugged a production incident has practiced the core move of product thinking without knowing it. Root-cause analysis in systems and root-cause analysis in products are the same discipline under different labels.

When a service goes down and the team runs a postmortem, the process looks like this: the alert fired, the symptom appeared, the team chased the symptom until they reached the actual cause, and they fixed the cause rather than the symptom. That sequence, symptom to cause, is exactly what product interviews test when they ask "how would you improve our retention?" Most candidates answer the symptom. The strongest candidates ask what is underneath it.

Taiichi Ohno, the Toyota production engineer who formalized the Five Whys technique in the 1950s, described the principle in his 1978 book *Toyota Production System*: "By repeating 'why?' five times, the nature of the problem as well as its solution becomes clear." His canonical example involved a welding robot that stopped mid-line. The symptom was a stopped robot. Five Whys deep, the cause was a dirty oil filter due to no preventive maintenance schedule. The fix for the symptom, restart the robot, would have failed again in weeks. The fix for the root cause eliminated the failure class entirely.

## The same move, different surfaces

<!-- figure:0 -->

## Why this matters more than any framework

Most PM interview prep teaches frameworks. CIRCLES, RICE, HEART. They are useful compression once the underlying reasoning is solid. But the candidate who recites a framework on top of a symptom-level diagnosis will fail the same question the candidate who reasons clearly about root causes will pass. The interviewer is not evaluating framework recall. They are evaluating whether the candidate stays curious long enough to get to what actually matters.

Eric Ries in *The Lean Startup* (2011) brought the Five Whys explicitly into product development: "I want to suggest that the five whys is an important technique for sustainable growth." His framing was about defects and waste in product processes, but the move is the same as Ohno's. Ask why until the answer is an actual cause, not a restatement of the symptom.

## One handle to take with you

Before proposing any solution in a product or interview context, count how many times you have asked "why" about the problem. If the answer is zero or one, the diagnosis is probably at the symptom level. The root cause is almost always at least two or three "whys" deeper.

Next: **Symptoms vs. root causes**, the Five Whys applied to product problems, and why most product conversations stall at the wrong level.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Root-cause debugging mapped from systems to products',
      caption: 'The same five-step debugging move runs in both systems and products. Engineers already have the reps. What changes is the surface, not the discipline.',
      headers: ['Systems debugging', 'Product root-cause analysis'],
      rows: [
        { cells: ['Alert fires: service latency up 300%', 'Metric drops: user retention falls 8%'], arrow: true, tone: 'neutral' },
        { cells: ['Symptom: high p99 latency on checkout', 'Symptom: users churning in week 2'], arrow: true, tone: 'neutral' },
        { cells: ['Ask why: DB query taking 4s', 'Ask why: users not completing onboarding'], arrow: true, tone: 'neutral' },
        { cells: ['Ask why: missing index on orders table', 'Ask why: activation step has 60% drop-off'], arrow: true, tone: 'neutral' },
        { cells: ['Fix: add index, eliminate the class', 'Fix: redesign activation, address the class'], arrow: true, tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 2 ────────────────────────────────────────────────────────────────

const CH2: ChapterSeed = {
  slug: 'chapter-2',
  sort_order: 2,
  body_mdx: `## The surface and the cause

"Users are churning" is a metric reading, not a problem. A metric reading tells the team something is wrong. It says nothing about what to fix.

Most product discussions begin and end at the symptom level, not because the people in the room lack intelligence but because moving from symptom to cause requires uncomfortable patience when there is pressure to ship a solution. The Five Whys technique, formalized by Taiichi Ohno at Toyota and adapted for product work by Eric Ries in *The Lean Startup*, is the antidote. Each "why" should take the team one layer closer to a cause that is both specific enough to fix and general enough that fixing it eliminates a class of downstream symptoms.

The discipline is harder than it sounds. The second "why" answer often feels like the real cause because it is more specific than the first. It is usually not. The move is to keep asking until the answer would be different if the product were different, not just if the data were different.

## Whys in a product chain

<!-- figure:0 -->

## What the wrong stopping point looks like

A team sees a drop in week-2 retention. The first "why" yields "users are not returning after the first session." That is a restatement. The second "why" yields "users don't know what to do next." That feels like a cause, and most teams stop there and redesign the empty state. The third "why" yields "the product requires existing context that new users haven't built yet." Now the team is looking at the onboarding sequence, not the empty state. The fourth "why" yields "the product was designed for the team's own mental model of the job, not for how a new user thinks about it." Now the team is looking at the original brief and the user research that did not happen before the product was built.

Fixing the empty state solves the symptom. Fixing the onboarding solves the immediate cause. Fixing the discovery process prevents the next three products in the pipeline from having the same problem. The team that stopped at the second "why" shipped a feature. The team that reached the fourth "why" changed a process. Both teams wrote code. One of them moved a metric.

## How this applies in interviews

In a product-sense interview, the question "how would you reduce churn on this product" is testing whether the candidate treats churn as a symptom or a cause. The candidate who responds with "I would add a re-engagement email" is answering as if churn is the cause. The candidate who responds with "churn is the symptom. The cause depends on when users churn and what they were trying to do" is demonstrating root-cause thinking before proposing a single solution. That distinction is usually the entire interview.

## One handle to take with you

When a problem statement contains a metric, treat it as a symptom by default. Write the metric at the top of a page, draw a downward arrow, and do not write a solution until the page has at least two more "why" layers below the metric.

Next: **Frequency, Severity, and Underservedness**, the triage matrix for deciding which root causes are worth addressing once the team has found them.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Five Whys applied to a product churn problem',
      caption: 'Each layer is a "why" applied to the answer above it. Most teams stop at layer 2 or 3 because the answer feels specific. Layers 4 and 5 are where the fixable root causes live.',
      orientation: 'vertical',
      showArrows: true,
      boxes: [
        { label: 'Symptom', body: ['Users are churning at week 2 (metric reading)'], tone: 'warn' },
        { label: 'Why 1', body: ['Users stop returning after their first session'], tone: 'warn' },
        { label: 'Why 2', body: ['Users don\'t know what to do next in the product'], tone: 'neutral' },
        { label: 'Why 3', body: ['Onboarding doesn\'t build the context users need to find value'], tone: 'neutral' },
        { label: 'Root cause', body: ['Product was designed around team assumptions, not user mental models'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 3 ────────────────────────────────────────────────────────────────

const CH3: ChapterSeed = {
  slug: 'chapter-3',
  sort_order: 3,
  body_mdx: `## Not all problems are worth solving

Finding the root cause of a user problem is the first move. The second move is deciding whether that root cause is worth the team's time. Most product teams skip the second move, which is why backlogs grow faster than teams can work through them.

The Kano model, developed by Noriaki Kano in the 1980s at Tokyo Rika University, gives one lens: problems that, when solved, delight users are different from problems that, when solved, merely satisfy baseline expectations. Both are real problems with real root causes. Only one of them produces a product users talk about. But the Kano model answers the question "how much will users care," not the question "how many users have this problem, how painful is it, and how few alternatives exist." Those three dimensions require a different matrix.

## The three dimensions of a problem worth solving

<!-- figure:0 -->

## What each dimension catches

Frequency without severity produces feature requests that look important in survey data and generate negligible behavior change when shipped. Severity without frequency produces high-drama edge cases that are genuinely terrible for the users who hit them but move no aggregate metric. Frequency and severity together without underservedness produce problems the team solves and users immediately move to a competing solution that was already there. The combination of all three is the screen.

Teresa Torres, in *Continuous Discovery Habits* (2021), describes a similar triangulation when building opportunity solution trees: an opportunity is worth pursuing when it is common, important to the user, and not already addressed by a competing solution or workaround. Her "underserved" dimension is almost identical to what Kano would call the "delighter gap," the distance between what the user expects and what currently exists.

## How this applies in interviews

In a product-sense interview, a candidate who identifies a root cause and then immediately proposes a solution has skipped the triage step. The interviewer will often push back: "is this the most important problem?" The candidate who has done triage can answer this with reasoning. The candidate who has not must retreat to "I think so" and defend intuition without structure.

The triage matrix is also the honest answer to scope questions in a senior role. When a VP asks why the team is not working on problem X, the answer "X scores low on underservedness because workaround Y already exists" is a product-quality answer. The answer "we haven't gotten to it yet" is not.

## One handle to take with you

Before committing to a problem in any product conversation, write three numbers: how many users hit this regularly, how painful it is when they do, and what the best current workaround is. A problem that scores well on all three is worth investigating. A problem that scores well on only one is a feature request.

Next: **Connecting problems to mission fit**, why a high-scoring problem the company does not care about is still the wrong problem to build.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Triage matrix: frequency, severity, and underservedness',
      caption: 'A problem worth solving scores well on all three dimensions. Single-dimension problems are the source of most backlog bloat.',
      headers: ['Dimension', 'What it measures', 'Low score means'],
      rows: [
        { cells: ['Frequency', 'How often users encounter the problem', 'Edge case — real pain, no aggregate impact'], tone: 'neutral' },
        { cells: ['Severity', 'How much the problem disrupts the user\'s goal', 'Minor friction — solved, nobody notices'], tone: 'neutral' },
        { cells: ['Underservedness', 'How poorly current solutions address the problem', 'Workaround exists — fix still ships to lukewarm response'], tone: 'neutral' },
        { cells: ['All three high', 'Problem worth solving', 'Ship it and move the metric'], tone: 'ok' },
        { cells: ['One or two high', 'Feature request', 'Probably stays in the backlog forever'], tone: 'warn' },
      ],
    },
  ],
}

// ── Chapter 4 ────────────────────────────────────────────────────────────────

const CH4: ChapterSeed = {
  slug: 'chapter-4',
  sort_order: 4,
  body_mdx: `## The filter that comes after triage

A problem can be frequent, severe, and underserved and still be the wrong thing to build. The filter that catches this is mission fit: does this problem sit inside what the company is actually trying to accomplish?

Shreyas Doshi, in a widely cited 2020 tweet thread, described three types of product work: work that keeps the lights on, work that is meaningful within the company's existing strategy, and work that is extraordinary relative to what any player in the space could do. His framing was about prioritization within a company. But the underlying structure applies equally to problem selection: a problem that scores high on the triage matrix but sits outside the company's strategic direction will not get resourced, will not get maintained, and will not build toward a durable competitive position even if shipped.

Mission fit is the filter interviewers use when they follow up "what problem would you solve" with "why this company?" A candidate who identifies a real, painful, underserved problem that has nothing to do with what the company is trying to build has demonstrated root-cause reasoning without the strategic layer that senior roles require.

## Problems by mission alignment

<!-- figure:0 -->

## What mission misalignment looks like in practice

Snapchat launched a feature in 2017 called Snap Map, showing the location of friends on a map in real time. The problem it solved, knowing where your friends are and whether something interesting is happening nearby, was real, frequent, and underserved for a social product. It scored well on the triage matrix. Mission alignment was weaker. Snapchat's mission at the time was anchored to ephemeral, private communication. Persistent location sharing was structurally the opposite of ephemeral. The feature was used briefly, generated a round of privacy backlash, and added complexity without advancing the core product. The problem was real. The fit was off.

On the other side, when Google Maps introduced real-time traffic and commute alerts in 2012, the problem was real and the fit was exact. Google's mission at the time, organizing the world's information and making it universally accessible, extended naturally to organizing the world's routes and making commute decisions accessible. The problem scored well on triage and sat squarely within mission. The feature became load-bearing infrastructure.

## How this applies in interviews

The interview question "what would you build next for this product" is testing two things simultaneously. The first is whether the candidate can identify a real user problem. The second is whether the candidate understands what the company is trying to do. The answer that wins is the one that solves a real problem and makes the company more of what it is trying to become, not just less broken.

## One handle to take with you

After triaging a problem, write one sentence describing the company's current strategic direction, then a second sentence describing the problem. If the second sentence does not follow naturally from the first, the problem may score well on triage and still be the wrong answer in this room.

Next: **The problems users stop complaining about**, what happens when a problem is real and painful but users have adapted to it, and why those problems are the most valuable ones to find.`,
  figures: [
    {
      kind: 'mapping_diagram',
      ariaLabel: 'Problems mapped against mission alignment and triage score',
      caption: 'Triage score and mission alignment are independent axes. Only the quadrant that scores well on both produces work worth building.',
      sourcesLabel: 'Problem type',
      targetsLabel: 'Build decision',
      sources: ['High triage + high mission fit', 'High triage + low mission fit', 'Low triage + high mission fit', 'Low triage + low mission fit'],
      targets: [
        { label: 'Build and resource it', body: 'Core product work', tone: 'ok' },
        { label: 'Deprioritize or hand off', body: 'Real problem, wrong company', tone: 'neutral' },
        { label: 'Drop it', body: 'Not worth the team\'s time', tone: 'warn' },
      ],
      links: [
        { from: 0, to: 0 },
        { from: 1, to: 1 },
        { from: 2, to: 1 },
        { from: 3, to: 2 },
      ],
    },
  ],
}

// ── Chapter 5 ────────────────────────────────────────────────────────────────

const CH5: ChapterSeed = {
  slug: 'chapter-5',
  sort_order: 5,
  body_mdx: `## The silent problems

The most dangerous user problems are not the ones users complain about. They are the ones users have stopped complaining about because they have adapted to the constraint.

Paul Buchheit, the engineer who created Gmail, described the 2004 decision to give users 1 gigabyte of free storage in a widely cited interview. Before Gmail, web email services offered 2 to 4 megabytes of storage. Users deleted emails constantly, wrote shorter messages to stay under quota, and complained about storage limits regularly. Then, somewhere around 2002 or 2003, the complaints nearly stopped. Users had adapted. They deleted emails habitually without thinking about it. The problem was still real and still severe. It had simply become invisible because users had built a workaround into their behavior.

Buchheit's team asked not "what are users asking for" but "what have users stopped asking for that is still a real problem." The answer was storage. The decision to offer 1GB was not a response to user demand. User demand had gone quiet. It was a response to a problem that had become structurally invisible because users had given up on asking.

## Latent problems vs. active problems

<!-- figure:0 -->

## Why silence is a signal

The behavioral economics term for what users do when they adapt to a broken situation is "loss aversion normalization." Users stop expecting the situation to be better. The problem does not disappear from their experience. It disappears from their articulation because articulating it produces no result.

Clayton Christensen, in *The Innovator's Dilemma* (1997), describes a related pattern in markets: incumbent products fail not because users asked competitors for something better but because users silently shifted behavior toward whatever tool did the job slightly less frustratingly. The shift happened before the incumbent knew it was happening because surveys and NPS scores do not capture adapted workarounds, only conscious pain.

The product implication is that listening to what users say is necessary but insufficient. The stronger signal is watching what users do, especially the things users do silently and repeatedly that feel like workarounds.

## How this applies in interviews

In a product-sense interview, the most impressive answers often come from identifying a latent problem rather than an active one. The interviewer asks "what would you improve about this product" expecting the candidate to address visible friction. The candidate who identifies a problem users have stopped articulating, backed by a behavioral observation rather than survey data, demonstrates a depth of product thinking that active-problem answers cannot.

For Gmail's case, the insight was not available from complaint tickets. It was available from watching users delete emails the moment they arrived, which is exactly the behavior that said "users have given up on storage and adapted to its absence."

## One handle to take with you

When analyzing a product, look for user behaviors that look like workarounds: exporting data to process it manually, keeping a parallel spreadsheet, deleting before reading, building a personal system alongside the product system. Each of those behaviors is a latent problem that users have stopped expecting to be solved.

Next: **Writing a crisp problem statement**, because finding a root cause is only half the work. The other half is being able to state it in one sentence that a skeptical stakeholder will understand.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Active problems vs latent problems in product work',
      caption: 'Latent problems are often more valuable to solve than active ones because competitors are also looking at the active complaints. The latent problems are where the white space is.',
      headers: ['Active problem', 'Latent problem'],
      rows: [
        { cells: ['User articulates it directly in feedback', 'User has adapted and stopped articulating it'], arrow: false, tone: 'neutral' },
        { cells: ['Shows up in support tickets and NPS comments', 'Shows up in behavioral data and workaround patterns'], arrow: false, tone: 'neutral' },
        { cells: ['Competitor is also watching the same complaints', 'Competitor is reading the same quiet data you are'], arrow: false, tone: 'neutral' },
        { cells: ['Solving it meets expectation', 'Solving it reframes what users believe is possible'], arrow: false, tone: 'ok' },
        { cells: ['Gmail storage complaints ca. 2002', 'Gmail storage silence ca. 2003 — users stopped asking'], arrow: false, tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 6 ────────────────────────────────────────────────────────────────

const CH6: ChapterSeed = {
  slug: 'chapter-6',
  sort_order: 6,
  body_mdx: `## The sentence test

If the root cause of a user problem cannot be written in one sentence, the analysis is not finished. Complexity in a problem statement is usually a sign that the team is holding multiple hypotheses at once and has not committed to the most important one.

The sentence test is not a writing exercise. It is a forcing function for clarity of thought. Teresa Torres, in *Continuous Discovery Habits* (2021), frames the same discipline as "opportunity framing": before an opportunity enters an opportunity solution tree, the team writes a single statement that names who is affected, what they are trying to do, and what is preventing them. Three things in one sentence. If the team cannot write it, the team does not yet understand the problem.

Clayton Christensen's "job story" format, which emerged from his "jobs to be done" framework in *The Innovator's Solution* (2003), is a close relative: when [situation], the user wants to [motivation], so that [expected outcome]. The format forces the problem statement to name a context, a goal, and a gap. A sentence that follows this structure is almost always more useful than one that does not.

## Problem statement quality

<!-- figure:0 -->

## Why hedging is a tell

A problem statement that hedges, "users may have difficulty with onboarding, possibly due to unclear copy or perhaps an overly complex step sequence," is not a problem statement. It is a list of hypotheses dressed as a statement. Hedged problem statements produce hedged solutions that are designed to address several possible causes simultaneously and typically address none of them clearly.

The interviewer who hears a hedged problem statement knows the candidate has not committed to a root cause. This is a different failure mode from not finding the root cause. The candidate who says "I don't know the root cause, but here's how I would find it" is demonstrating rigor. The candidate who writes a hedged statement is presenting the appearance of rigor without the substance.

Senior roles run on crisp problem statements because everyone downstream of the problem statement, design, engineering, marketing, depends on its clarity to know what they are building and why.

## What a strong problem statement contains

A strong problem statement names a specific user type rather than "users" in general, names a specific situation or context where the problem occurs, names the goal the user is trying to accomplish, and names the gap between where the user is and where they are trying to get. It does not name the solution. A statement that names the solution is a feature request, not a problem statement. These are useful but they are not the same thing, and confusing them is the most common problem with most backlogs.

## One handle to take with you

After the next root-cause analysis, write one sentence that would satisfy this template: "[User type] trying to [accomplish goal] in [context] cannot [do specific thing] because [specific structural reason]." If the sentence is uncomfortable to write because it commits to a cause, it is doing the right work. Discomfort in writing the problem statement is the feeling of genuine clarity arriving.

Next: **Case: When the bug you fixed wasn't the real problem**, a fictionalized engineering story about fixing a metric that did not move, and what the team found when they went back to look.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Weak vs strong problem statements',
      caption: 'Strong problem statements commit. Weak ones hedge. The difference is not writing quality. It is clarity of diagnosis.',
      headers: ['Weak problem statement', 'Strong problem statement'],
      rows: [
        {
          cells: [
            'Users might be having trouble with our onboarding flow',
            'New users without prior SaaS experience cannot connect their first data source because the setup wizard assumes existing API knowledge they do not have'
          ],
          tone: 'neutral'
        },
        {
          cells: [
            'Retention is lower than we\'d like, possibly due to engagement issues',
            'Power users on mobile lose their draft state when switching apps, which causes them to abandon the session rather than restart the draft'
          ],
          tone: 'neutral'
        },
        {
          cells: [
            'The checkout experience could potentially be improved',
            'First-time buyers on mobile cannot complete checkout when their billing address differs from their shipping address because the form collapses both into one field'
          ],
          tone: 'neutral'
        },
      ],
    },
  ],
}

// ── Chapter 7 ────────────────────────────────────────────────────────────────

const CH7: ChapterSeed = {
  slug: 'chapter-7',
  sort_order: 7,
  body_mdx: `## The case

A mid-size SaaS company's activation rate had been declining for three months. The growth team traced the drop to a specific step in the onboarding flow: users were abandoning the invite-teammates screen. An engineer filed a bug, found that the invite form had a validation error that failed silently on certain email domains, and shipped a fix in 48 hours. The team closed the ticket, updated the sprint board, and moved on.

Six weeks later, the metric had not moved.

## What the team found when they went back

The postmortem revealed three things. First, the invite form bug was real. It did affect a subset of users. But those users represented about 12% of the abandonment volume. The other 88% were abandoning a working form. Second, the team had measured success at the wrong level. They had tracked whether the bug was fixed, not whether the activation metric moved. Third, the real problem was invisible in the bug report: most users were abandoning the invite screen because the product required teammates to be useful, and 60% of sign-ups at the time were individuals who had no teammates to invite. The invite screen was not broken. It was asking a question that had no right answer for the majority of the user base.

## Why this happens

<!-- figure:0 -->

## The failure class

This case is a specific instance of a failure class that has a name in systems engineering: addressing the proximate cause while the distal cause remains. The proximate cause was a validation bug. The distal cause was a product designed around a collaborative use case that was being marketed to individual users. The engineering fix was correct. The root-cause analysis stopped one level too early.

Product engineers who have run production postmortems will recognize the structure immediately. The alert fires, the team finds the immediate cause, ships a fix, and marks the incident resolved. The incident recurs two weeks later with a different proximate cause but the same distal cause, and the team eventually realizes that the service has a structural problem that the symptom-level fixes are papering over. The product version of this failure is slightly slower, slightly less dramatic, and significantly more common.

## The signals that the fix was the wrong level

Three signals suggested the fix was not at the right level, and all three were available before the postmortem. First, the fix addressed a subset of the failing population, not the whole population. Whenever a fix addresses less than half of the known failure cases, the team is probably looking at a proximate cause. Second, the metric the team was tracking, bug count, was not the metric they were trying to move, activation rate. These were different enough that a clean bug close could coexist with no metric movement. Third, the user segment that was abandoning the invite screen was not a small outlier. Sixty percent of sign-ups were individuals, which meant the invite screen was failing the majority case, not an edge case. Majority-case failures that have existed for months are almost never bugs. They are product decisions with unexamined assumptions underneath them.

## One handle to take with you

After shipping any fix to a product metric, set a calendar reminder for four weeks out to check whether the metric moved. If it did not move, the team fixed the proximate cause. The root cause is still active, and now the team knows more about where to look.

That is the end of the module. The next step is to bring this discipline into a real scenario: pick a challenge that asks you to diagnose a metric drop and practice reaching three levels deep before proposing a solution.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Proximate vs distal cause in the activation case',
      caption: 'The team stopped at the proximate cause and marked the ticket resolved. The distal cause, a product assumption about user type, was still active and responsible for 88% of the abandonment.',
      orientation: 'vertical',
      showArrows: true,
      boxes: [
        { label: 'Metric: activation rate falling', body: ['Sign-ups not completing onboarding, 3-month trend'], tone: 'warn' },
        { label: 'Proximate cause (fixed)', body: ['Invite form validation bug failing silently on some email domains', '12% of abandonment volume'], tone: 'neutral' },
        { label: 'Distal cause (untouched)', body: ['Product requires teammates to be useful, but 60% of sign-ups are individual users', 'Invite screen has no right answer for them'], anti: 'Team never reached this level', tone: 'warn' },
      ],
    },
  ],
}

const CHAPTERS: ChapterSeed[] = [CH1, CH2, CH3, CH4, CH5, CH6, CH7]

async function run() {
  const mod = await supabase.from('learn_modules').select('id').eq('slug', MODULE_SLUG).single()
  if (mod.error || !mod.data) {
    console.error(`[seed-root-cause] module ${MODULE_SLUG} not found:`, mod.error)
    process.exit(1)
  }
  console.log(`[seed-root-cause] module ${MODULE_SLUG} -> ${mod.data.id}`)

  for (const ch of CHAPTERS) {
    const { error } = await supabase
      .from('learn_chapters')
      .update({ body_mdx: ch.body_mdx, figures: ch.figures })
      .eq('module_id', mod.data.id)
      .eq('slug', ch.slug)
    if (error) {
      console.error(`  ${ch.slug} failed:`, error)
      process.exit(1)
    }
    console.log(`  ${ch.sort_order}. ${ch.slug} (${ch.body_mdx.length} chars, ${ch.figures.length} figure${ch.figures.length === 1 ? '' : 's'})`)
  }

  console.log('\n[seed-root-cause] Done.')
}

run().catch(e => { console.error(e); process.exit(1) })
