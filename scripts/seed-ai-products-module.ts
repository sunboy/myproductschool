// scripts/seed-ai-products-module.ts
//
// Seeds AI Products module prose + structured figures.
// Run: npx tsx --tsconfig tsconfig.json scripts/seed-ai-products-module.ts

import { createClient } from '@supabase/supabase-js'
import type { ChapterFigure } from '../src/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MODULE_SLUG = 'ai-products'

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
  body_mdx: `## The distinction that matters

Most product teams building with AI are confused about which category they are in, and the confusion is expensive because AI-assisted products and AI-native products fail in completely different ways.

An AI-assisted product adds AI capabilities on top of an existing product architecture. The product was designed for human workflows first, and AI augments those workflows: autocomplete in an editor, smart search in a content library, a suggested reply in a messaging app. The product works without the AI. The AI makes it faster or better. Adobe Firefly is AI-assisted: Photoshop's core workflow is unchanged, and Firefly adds generative fill as an accelerant. GitHub Copilot launched as AI-assisted: the IDE, the file structure, the PR review loop were all designed for humans, and Copilot adds suggestions inline.

An AI-native product is built from the start around the premise that AI is doing the work. The workflow itself is different. There is no "without the AI" version because the product's value proposition assumes the AI capability. Cursor is AI-native: the entire editing experience is built around model suggestions, not an IDE that happens to have model suggestions added. Perplexity is AI-native: the product is a retrieval and synthesis engine, not a search engine with AI layered on top.

## Why the distinction matters for product decisions

<!-- figure:0 -->

Kevin Scott, Microsoft's CTO, described Copilot's evolution from an AI-assisted to an AI-native rethink in 2023 when the team realized that Copilot as a feature inside Word was not the same ambition as building a product whose entire interaction model assumed AI. The AI-assisted version optimizes existing workflows. The AI-native version redesigns them. These require different product judgment, different infrastructure decisions, different trust models, and different success metrics.

Figma's AI features remained AI-assisted through 2024: they accelerated the existing design workflow without changing what designing in Figma meant. The question of whether Figma would become AI-native (whether the design workflow itself would be rebuilt around model generation) was the harder, more consequential product call, and it required a different kind of judgment than adding a smart rename feature.

## Where most builders are confused

The confusion usually looks like this: a team builds AI-assisted features, watches adoption lag, and concludes that "AI doesn't work for our users." The real failure is that they built AI-assisted features into a workflow that needed to be redesigned from scratch, and the friction came not from AI skepticism but from the mismatch between the old workflow's assumptions and what AI actually makes possible.

The inverse confusion is also common: a team tries to build an AI-native product before they have the model capability or the user trust to support it, and ships something that feels unreliable rather than powerful.

The first question any product builder should answer is which category they are actually in, not which category they wish they were in. The answer changes everything downstream: the design system, the trust model, the fallback states, the success metric, and the moat.

## One handle to take with you

Write down one sentence that completes this: "Our product works without AI by doing ___." If the blank cannot be filled, the product is AI-native. If it can, the product is AI-assisted, and every subsequent product decision should account for that.

Next: **When execution is cheap, judgment is expensive**, the frame that explains why AI-native products require a fundamentally different kind of product thinking.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'AI-assisted versus AI-native product characteristics',
      caption: 'The distinction between AI-assisted and AI-native products runs through every layer of product decisions, from design to trust to moat. Knowing which category a product occupies is the prerequisite for making those decisions well.',
      headers: ['Dimension', 'AI-assisted', 'AI-native'],
      rows: [
        { cells: ['Core workflow', 'Designed for humans, AI augments', 'Designed around AI doing the work'], tone: 'neutral' },
        { cells: ['Without the AI', 'Product still works', 'Product does not exist'], tone: 'neutral' },
        { cells: ['Failure mode', 'AI feature ignored or bypassed', 'AI unreliability breaks the whole product'], tone: 'warn' },
        { cells: ['Trust model', 'User trusts the product; AI is a helper', 'User must trust the AI itself'], tone: 'neutral' },
        { cells: ['Success metric', 'Engagement with AI feature', 'Task completion via AI workflow'], tone: 'neutral' },
        { cells: ['Example', 'Adobe Firefly, GitHub Copilot (v1)', 'Cursor, Perplexity, Devin'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 2 ────────────────────────────────────────────────────────────────

const CH2: ChapterSeed = {
  slug: 'chapter-2',
  sort_order: 2,
  body_mdx: `## The frame

Shreyas Doshi's 2023 observation about AI and product work cuts to something most product teams take months to internalize: when a model can generate 100 options in seconds, the bottleneck stops being execution and becomes judgment. Knowing which option is right is the new scarce resource.

This is a structural shift, not a productivity story. For decades, the primary constraint in product and engineering work was execution capacity. Teams had more ideas than time to build them. The judgment layer (which idea, why, for whom) was important but secondary, because execution was the gate. AI removes that gate for a wide class of tasks. Code can be generated. Designs can be drafted. Copy can be written. Analysis can be run. The teams that recognize this restructuring are making different product bets than the teams that treat AI as a faster version of the old execution bottleneck.

## What moves to the foreground

<!-- figure:0 -->

Doshi's broader frame on product work is about the distinction between "doing the work" and "knowing what work to do." He has written extensively about how the best PMs and engineers spend disproportionate time on the second problem: problem selection, framing, sequencing, and criterion-setting. AI accelerates the first problem dramatically. It does not help with the second, and in fact makes the second more consequential because mistakes propagate faster when execution is cheap.

The practical implication is that product builders need to get much better at judgment-intensive moves: identifying which of 100 generated options is actually right, knowing when a generated output is subtly wrong, and deciding when to trust the model and when to override it. These are not the skills that traditional PM training or engineering training has emphasized, because they were not the bottleneck.

## The options problem

The abundance of options is itself a new product challenge. A team that can generate 100 marketing copy variants, 50 UI layouts, or 20 architecture proposals in an afternoon now faces a different kind of problem: how do they evaluate those options consistently and at speed. The answer is not to evaluate more carefully. The answer is to have sharper criteria before generating.

Doshi's "execution is table stakes" framing points at this: when execution is cheap, the value is in knowing what to execute. That means front-loading the judgment work. Define the criterion. Name the constraint. Specify the success condition before the model runs. The teams that do this well use AI to explore the option space from a well-defined starting point. The teams that do not use AI to generate a flood of plausible options and then spend weeks arguing about which one to ship.

## A concrete example

The explosion of AI-generated UI design tools in 2023 and 2024 demonstrated this pattern clearly. Teams that could ship a dozen design variants in hours faced a new problem: they had no better framework for choosing among them than they had before. The constraint was never the ability to produce options. It was always the judgment about which option served the user and the business. AI moved the work forward without moving the bottleneck.

Cursor's development team described a version of this in 2024: with AI generating large amounts of code, the review and judgment step became the rate-limiting factor. They had to build better tooling for the judgment layer because that was now the constraint.

## One handle to take with you

Before the next AI-assisted task runs, write down the evaluation criterion in one sentence. What makes an output correct, not just plausible? That criterion is the judgment that AI cannot provide, and it is increasingly the most valuable thing a product builder can contribute.

Next: **Designing for agents**, the new UX primitives that emerge when the user of a product interface is not a human.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'The shift from execution bottleneck to judgment bottleneck',
      caption: 'AI moves the primary constraint in product work from execution capacity to judgment quality. The product teams that recognize this restructure their process to front-load criterion-setting and option evaluation rather than expanding their ability to generate more output.',
      orientation: 'vertical',
      showArrows: true,
      boxes: [
        { label: 'Before AI', body: ['Execution is the gate', 'More ideas than time to build them', 'Judgment is important but secondary'], tone: 'neutral' },
        { label: 'After AI', body: ['Execution is table stakes', 'More options than ability to evaluate them', 'Judgment is the primary scarce resource'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 3 ────────────────────────────────────────────────────────────────

const CH3: ChapterSeed = {
  slug: 'chapter-3',
  sort_order: 3,
  body_mdx: `## The new user

Agents do not fill out forms. They do not read error messages and decide what to do next. They do not tolerate ambiguity the way humans do, and they do not bring common sense to edge cases that the designer did not anticipate. When the user of a UI is an agent rather than a human, every assumption baked into that UI is probably wrong.

Anthropic's work on computer use in 2024 exposed this directly. When models were given the ability to operate a standard desktop UI, the failure modes were instructive: the model would get stuck on modal dialogs, misread hover states as buttons, fail on multi-step flows where the next action depended on reading a success message that was only briefly visible, and interpret a loading spinner as the final state of an operation. These were not model failures. They were UI failures: interfaces designed for the human capacity to read context, infer intent, and recover from ambiguity.

## What breaks for agents

<!-- figure:0 -->

The primitive mismatch is the core problem. Human UI primitives assume perception (can see the whole screen), memory (remembers what happened in previous steps), and judgment (knows when something went wrong). Agents have unreliable versions of all three, and the interfaces built for the human versions break in predictable ways.

Devin, Cognition's AI software engineer launched in 2024, ran into several of these failure modes in production: the agent would complete a multi-step task successfully in a sandboxed environment and then fail when the real environment had a dialog it had not been trained to expect. The failure was not the agent's capability. It was the mismatch between the environment's design and the agent's interaction model.

## The new primitives

Building for agents requires different interface primitives. Explicit state over implicit state: instead of a loading spinner that a human interprets as "working," expose a machine-readable status endpoint. Reversible actions over irreversible ones: a human reads "are you sure you want to delete?" and makes a judgment call; an agent needs a dry-run mode or a confirmation protocol with a recoverable default. Structured output over natural language: agents parse structured responses more reliably than reading a paragraph and extracting the relevant fact.

The design question for an AI-native product is not "what does this UI look like" but "what does this system expose to an agent that needs to accomplish a task." Those are different questions with different answers, and the teams building agentic products in 2024 were largely learning this by running into the failure modes rather than anticipating them.

## Linear's auto-close incident

A widely-cited incident in developer tooling involved an AI agent that auto-closed GitHub issues based on pull request merge events. The logic was correct: when a PR that referenced an issue was merged, the issue was closed. What the agent could not handle was the ambiguity of "partial fix" or "merged but needs follow-up." A human reading the PR and the issue would catch this. The agent applied the rule. Teams started finding closed issues that were not actually resolved, and the trust in the automation dropped faster than it had been built.

The failure was a UI and product design failure, not a model failure. The interface needed a "close with exception" primitive and a review queue for cases where the automatic rule might be wrong. Those primitives were not there because the interface was designed for human use.

## One handle to take with you

For any agentic feature in development, identify the three most likely failure modes that arise when the agent encounters an unexpected state. Those failure modes are the design brief for the primitives the interface needs to expose.

Next: **Trust, safety, and the agentic loop**, why every agentic feature ships with a trust budget and what happens when that budget runs out.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'UI primitives designed for humans versus agents',
      caption: 'Every standard UI primitive has an analog designed for agent use. The gap between the two columns is where agentic products break in production.',
      headers: ['Human UI primitive', 'Agent-safe analog'],
      rows: [
        { cells: ['Loading spinner (visual feedback)', 'Machine-readable status endpoint'], tone: 'neutral' },
        { cells: ['"Are you sure?" confirmation dialog', 'Dry-run mode with reversible default'], tone: 'neutral' },
        { cells: ['Error message paragraph', 'Structured error code + recovery action'], tone: 'neutral' },
        { cells: ['Hover state reveals action', 'Explicit action manifest / API endpoint'], tone: 'neutral' },
        { cells: ['Success toast notification', 'Persistent state record in a queryable store'], tone: 'neutral' },
        { cells: ['Multi-step wizard with back button', 'Idempotent step endpoints with state externalized'], tone: 'neutral' },
      ],
    },
  ],
}

// ── Chapter 4 ────────────────────────────────────────────────────────────────

const CH4: ChapterSeed = {
  slug: 'chapter-4',
  sort_order: 4,
  body_mdx: `## The budget

Every agentic feature ships with a trust budget. The budget is not infinite, it does not auto-replenish, and once it is spent it is very hard to recover. This is the most important product constraint in agentic AI that most teams do not name explicitly until they have already overdrawn the account.

The Air Canada chatbot case in 2022 established this clearly: the airline's AI chatbot told a grieving customer he could purchase a bereavement fare after his mother's death and request a refund later. Air Canada argued the chatbot was a separate legal entity and not binding. A Canadian tribunal disagreed, finding Air Canada liable for its chatbot's false statements. The product lesson is not about legal liability. It is about trust: the chatbot spent the company's trust budget by making a commitment it could not keep, and no amount of "this is an AI assistant" disclaimer in the footer recovered that trust for the customer who had relied on it.

## Where the budget goes

<!-- figure:0 -->

Apple's approach to Apple Intelligence in 2024 was explicitly opt-in and deliberately conservative. Features that accessed personal data required clear user consent, not buried permissions. The product reasoning was about trust budget: Apple had spent decades building the user's assumption that Apple is careful with personal data, and deploying aggressive AI features without consent would spend that budget faster than the features would earn it back through utility.

The Chevy dealership incident in 2023, where a dealership's ChatGPT-based chatbot was manipulated into agreeing to sell a car for $1 and offering advice that contradicted the dealership's interests, is a different kind of trust budget story. The budget spent there was the business's trust in the AI system itself: after that incident, every dealership watching had to recalibrate how much autonomy to give their AI-powered sales tools.

## The agentic loop and where trust breaks

Agentic features are particularly trust-intensive because they act on behalf of the user across multiple steps. Each action the agent takes is an opportunity to spend trust: it does something unexpected, the user's confidence in the agent's judgment drops. It does something wrong and the consequence is hard to reverse, the trust budget takes a hit that individual successful actions cannot compensate for.

Devin's trust budget challenges in 2024 followed this pattern. The agent was technically capable of completing many software engineering tasks. The trust failures were not capability failures but predictability failures: the agent would take actions that were locally correct but globally wrong, and users could not tell in advance which tasks would stay on the rails and which would go sideways. The uncertainty itself spent the trust budget even when the outcome was fine.

## Building for trust recovery

The product design question for agentic features is not only "what can this agent do" but "what does the user see when the agent does something unexpected, and how quickly can they recover." Confirmation gates, action logs, undo primitives, and dry-run modes are not UX polish. They are the mechanisms by which the trust budget is managed.

A feature that acts autonomously and never explains itself spends trust faster than it accumulates it, regardless of its accuracy rate. A feature that acts autonomously, explains its reasoning, and makes its actions reversible can sustain a higher trust balance even when it occasionally makes mistakes.

## One handle to take with you

For the next agentic feature, write down the three highest-stakes actions it can take and specify the recovery path for each. If any action has no recovery path, that action needs a human confirmation gate regardless of its accuracy rate.

Next: **Accuracy versus latency**, the trade-off that sits at the heart of every AI product decision and that has no universal right answer.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Trust budget cycle in agentic AI products',
      caption: 'Trust accumulates slowly through consistent, predictable behavior and is spent quickly through unexpected or irreversible actions. Recovery is possible but slow, and the asymmetry means the first few interactions a user has with an agentic feature determine whether the trust budget starts positive or negative.',
      orientation: 'horizontal',
      showArrows: true,
      boxes: [
        { label: 'Trust accumulation', body: ['Consistent predictions', 'Transparent reasoning', 'Reversible actions', 'Correct outcomes'], tone: 'ok' },
        { label: 'Trust spending', body: ['Unexpected behavior', 'Opaque decisions', 'Irreversible mistakes', 'False commitments'], tone: 'warn' },
        { label: 'Recovery', body: ['Very slow', 'Requires repeated positive cycles', 'Some users never return'], tone: 'neutral' },
      ],
    },
  ],
}

// ── Chapter 5 ────────────────────────────────────────────────────────────────

const CH5: ChapterSeed = {
  slug: 'chapter-5',
  sort_order: 5,
  body_mdx: `## The trade-off

Whether a 50ms response with 70% accuracy is better than a 500ms response with 95% accuracy is not a technical question. It is a product question, and the right answer depends entirely on the use case, the user's tolerance for error, and what "wrong" costs in context.

This trade-off was exposed clearly in the practical decisions around GPT-3.5 versus GPT-4 at launch in 2023. GPT-4 was demonstrably more accurate across most tasks but significantly slower. GPT-3.5 was faster and cheaper but made more errors. For a coding assistant, the accuracy gap mattered enormously: a wrong suggestion that looked plausible was worse than a slow correct one. For a first-pass content draft, the latency gap mattered more: users would iterate on a fast draft and catch errors themselves, but they would abandon a tool that made them wait. The same trade-off, two different answers, because the use case and the cost of error were different.

## The latency threshold problem

<!-- figure:0 -->

Human perception of latency is nonlinear. Research on response time and user experience shows that responses under 100ms feel instantaneous, responses between 100ms and 1 second feel immediate but perceptible, responses between 1 and 10 seconds require a progress indicator to maintain the user's attention, and responses beyond 10 seconds risk the user abandoning the interaction entirely. Voice AI has a harder threshold: conversational latency above roughly 800ms breaks the naturalness of spoken interaction, which is why voice AI products in 2024 made architectural choices (smaller models, streaming, predictive generation) specifically to stay below that threshold.

Streaming responses became a dominant pattern in LLM product design because they address the latency perception problem without necessarily improving the underlying model speed. A user who sees text appearing in real time at 200ms after submission has a qualitatively different experience than a user who waits 3 seconds for the same text to appear all at once. The actual time-to-complete is similar. The perceived experience is not.

## When accuracy is the product

For high-stakes decisions, accuracy is not a dimension to trade against latency. A medical information tool that is fast and 70% accurate is a liability, not a product. A legal research tool that saves 30 seconds per query but introduces plausible-sounding errors has an accuracy problem that latency optimization cannot address. The product design in these cases needs to build in accuracy checks, source citation, and confidence signaling rather than optimizing the speed of delivery.

The MLE trade-off framework that works in practice is to first characterize the cost of a wrong answer in the specific use case: is it annoying (low cost), confusing (medium cost), or consequential (high cost)? High-consequence errors mean accuracy takes priority regardless of latency. Low-consequence errors mean the latency-accuracy curve can be optimized for user experience. Most teams skip this characterization step and end up with a product that is optimized for the wrong point on the curve.

## The context window and the hidden latency

One source of latency that product teams consistently underestimate is the context window. Longer context means slower inference. A feature that passes extensive conversation history or large documents to the model to improve accuracy introduces latency that is invisible in development (where context is small) and becomes a production problem at scale (where context grows with every user session).

Cursor's engineering team described this challenge in 2024: the accuracy benefit of long context was real, but the latency cost required explicit product decisions about when to truncate context, which summaries to use, and how to signal to users when the model was operating with less context than ideal.

## One handle to take with you

For the next AI feature, write down the cost of a wrong answer in one sentence. That sentence determines where the feature should sit on the accuracy-latency curve, and it should come before any infrastructure discussion about which model to use.

Next: **What makes an AI feature defensible**, the moat question that every team building AI products needs to answer before the market commoditizes the capability.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Accuracy versus latency trade-off by use case type',
      caption: 'The right point on the accuracy-latency curve is determined by the cost of a wrong answer in context, not by a universal preference for accuracy or speed. The same model capability can serve use cases at opposite ends of this table.',
      headers: ['Use case type', 'Cost of wrong answer', 'Recommended priority'],
      rows: [
        { cells: ['Voice assistant conversational reply', 'Annoying, user corrects naturally', 'Latency first (under 800ms threshold)'], tone: 'ok' },
        { cells: ['First-pass content draft', 'Low, user iterates on output', 'Latency first, accuracy secondary'], tone: 'ok' },
        { cells: ['Code suggestion in editor', 'Medium, plausible wrong code is worse than slow right code', 'Accuracy first, streaming to manage perception'], tone: 'neutral' },
        { cells: ['Medical or legal information', 'High, wrong answer has real consequences', 'Accuracy first, no latency trade'], tone: 'warn' },
        { cells: ['Financial transaction confirmation', 'Very high, irreversible', 'Accuracy absolute, latency irrelevant'], tone: 'warn' },
      ],
    },
  ],
}

// ── Chapter 6 ────────────────────────────────────────────────────────────────

const CH6: ChapterSeed = {
  slug: 'chapter-6',
  sort_order: 6,
  body_mdx: `## The moat question

AI commoditizes execution. A capability that requires a specialized model today will be available in an API next year and in an open-source library the year after. Every team building AI features should answer one question honestly: when the capability is commoditized, what does this product have that alternatives do not?

The question is urgent because the commoditization timeline for AI capabilities is faster than most product teams plan for. The ability to generate text, summarize documents, answer questions, write code, and analyze images moved from rare to widely available in roughly 18 months between 2022 and 2024. Teams that built products whose only differentiation was access to a capable model found themselves competing with every other team that had an API key.

## The three defensible positions

<!-- figure:0 -->

The first moat is data. Products that generate unique training or fine-tuning data through their usage create a compounding advantage. The model improves because users use the product, which makes the product better, which attracts more users. Waymo's approach to self-driving illustrates this: each vehicle mile generates sensor and decision data that improves subsequent models. Tesla's approach is similar in mechanism though different in data philosophy. The data flywheel requires that the product captures feedback about model outputs, not just outputs themselves. A product that generates AI responses but never learns from whether those responses were good is not building a data moat.

The second moat is trust. Users develop trust in specific AI products through experience, and that trust transfers poorly to alternatives. A team that has used Cursor for six months has calibrated their expectations about what it gets right and wrong, what prompting patterns work, and when to override it. A new competitor with equivalent model capability does not inherit that calibration. The trust moat requires that the product make its AI behavior predictable and learnable over time, which is a product design choice that most teams do not make explicitly.

The third moat is workflow integration. A product embedded in the user's daily workflow has switching costs that a technically superior competitor must overcome. Notion AI integrated directly into documents where users already write. GitHub Copilot integrated into the IDE where developers already code. These are not moats because the AI is better; they are moats because the cost of switching includes the workflow change, not just the capability comparison.

## What is not a moat

Being first is not a moat in AI if the capability is the product. Being faster or cheaper is not a moat if the capability is available from providers who will compete on cost. Having a clever prompt is not a moat because prompts are observable. Choosing the right foundation model is not a moat because model access is broadly available.

The teams that conflate capability access with defensibility build products that are impressive demos and fragile businesses. The teams that identify the genuine moat early and build the product to deepen it create durable advantages.

## Waymo versus Tesla as a moat comparison

Waymo and Tesla made different bets on the data moat. Waymo generates dense, high-quality data from a small fleet in a few cities, with human-validated labels. Tesla generates massive quantities of data from a large consumer fleet, with weaker per-example quality but enormous scale. Both are data moats, but they compound differently. Waymo's moat is deep in specific geographic domains. Tesla's moat is broad with potential depth as the model improves. Neither approach is wrong. Both are explicit bets about where the data advantage would matter most. The important point is that both teams named the moat question explicitly and built toward it from the beginning.

## One handle to take with you

Write one sentence that answers: "When any well-funded team can use the same model we use, why does a user still choose our product?" If the answer is "because we were first" or "because our prompts are better," those are not real answers and the moat question has not been answered yet.

Next: **Shadow mode, A/B, and eval design for AI features**, why the standard experiment framework breaks down for AI and what replaces it.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Three defensible moats for AI products',
      caption: 'The three durable AI moats compound through usage. Each requires explicit product design choices to build and maintain. A product that does not choose a moat explicitly is usually building none of them.',
      orientation: 'horizontal',
      showArrows: false,
      boxes: [
        { label: 'Data flywheel', body: ['Usage generates training signal', 'Model improves with scale', 'Requires feedback capture, not just output logging'], tone: 'ok' },
        { label: 'Trust moat', body: ['Users calibrate to specific AI behavior', 'Switching costs include recalibration', 'Requires predictable, learnable AI behavior'], tone: 'ok' },
        { label: 'Workflow integration', body: ['Embedded in daily workflow', 'Switching costs include workflow change', 'Requires deep integration, not a sidebar feature'], tone: 'ok' },
      ],
    },
  ],
}

// ── Chapter 7 ────────────────────────────────────────────────────────────────

const CH7: ChapterSeed = {
  slug: 'chapter-7',
  sort_order: 7,
  body_mdx: `## Why standard experiments break

The A/B test is the canonical tool for validating product decisions, and it breaks for AI features in several specific ways. The failure is not that experiments are useless for AI; it is that the assumptions baked into standard A/B testing do not hold for a class of AI product behaviors, and teams that do not recognize this end up with confidence in the wrong thing.

A standard A/B test assumes that the treatment and control experiences are stable and consistent across users. For AI features, neither is true. The same model will give different outputs to the same input with temperature above zero. The quality of the output depends on context that varies per user. Two users in the same treatment bucket have different experiences because the model generates different responses for them. The aggregate metric (click rate, task completion, retention) may move, but the signal about whether the AI is actually better at the task it is supposed to do is buried in noise that the standard experiment framework cannot decompose.

## Evals are not experiments

<!-- figure:0 -->

The OpenAI evals framework, released publicly in 2023, established a different paradigm: evals are offline, model-graded assessments of AI output quality against a set of reference examples or criteria. They answer "is this model better at this task" rather than "do users who see this feature click more." Both questions matter, but they are different questions with different methodologies, and conflating them is a common source of bad AI product decisions.

LLM-as-judge is the pattern where a capable model grades the outputs of another model against a rubric. This does not require a live user experiment. It requires a test set with known-good reference answers, a rubric that captures the dimensions of quality that matter for the use case, and a grading model that has been calibrated against human raters on a sample of the test set. The result is a repeatable, offline quality signal that can be run on every model version before any A/B experiment is designed.

## Shadow mode shipping

Cursor's approach to shipping AI improvements used shadow mode: the new model would run alongside the current model in production, generating responses that were logged but not shown to users. The team could evaluate quality differences between old and new model outputs without exposing users to potential regressions. When the shadow eval results were consistently better, the new model went live. When they were mixed, the team investigated the regression cases before proceeding.

Shadow mode is expensive (it runs two models per request) but it addresses a fundamental problem with AI A/B testing: you need to know whether the model got better before you put users in the treatment bucket, because a bad model in the treatment bucket generates user trust costs (spent trust budget) that do not fully recover even after the bad model is removed.

## Designing evals for your use case

An eval is useful only if the rubric captures what actually matters for the use case. A coding assistant eval that measures "did the code compile" misses the quality of the code that compiles. A summarization eval that measures "does the summary contain the key terms from the source" misses whether the summary is readable or whether it emphasizes the right things. The hardest part of eval design is not building the grading infrastructure. It is deciding what "better" means for the specific use case and encoding that in a rubric that a model can apply consistently.

The practical steps are: identify three to five dimensions of quality that matter for this feature, write examples of good and bad outputs along each dimension, run a human rating exercise on a sample set to calibrate the rubric, and then automate the rubric against the full eval set. The calibration step is the one most teams skip, and skipping it means the automated eval is measuring something that correlates loosely with quality rather than quality itself.

## One handle to take with you

Before running any A/B experiment on an AI feature, run an offline eval that answers "is this version better at the task." If the offline eval does not show improvement, the experiment is measuring user behavior around a feature that the team already knows is not better. That is a waste of experiment capacity and, if the experiment runs long enough, a trust cost paid to the users in the treatment bucket.

Next: **Case: When agentic went wrong**, a product autopsy of a feature that worked exactly as designed and failed because the design assumed a level of user trust that did not exist.`,
  figures: [
    {
      kind: 'comparison_table',
      ariaLabel: 'Evals versus A/B experiments for AI features',
      caption: 'Evals and experiments answer different questions and require different methodology. Using one when the other is needed is a common source of bad AI product decisions. Both are necessary; neither is sufficient alone.',
      headers: ['Dimension', 'Eval', 'A/B experiment'],
      rows: [
        { cells: ['Question answered', 'Is this model better at the task?', 'Do users respond better to this experience?'], tone: 'neutral' },
        { cells: ['When to run', 'Before shipping, on every model version', 'After eval shows improvement, to validate user response'], tone: 'neutral' },
        { cells: ['Execution', 'Offline, against test set with rubric', 'Live, with real users split into groups'], tone: 'neutral' },
        { cells: ['Speed', 'Fast (hours, repeatable)', 'Slow (days to weeks for significance)'], tone: 'neutral' },
        { cells: ['Failure mode if skipped', 'Ship a worse model, spend trust budget', 'Ship a better model with no user behavior signal'], tone: 'warn' },
      ],
    },
  ],
}

// ── Chapter 8 ────────────────────────────────────────────────────────────────

const CH8: ChapterSeed = {
  slug: 'chapter-8',
  sort_order: 8,
  body_mdx: `## The setup

The feature worked exactly as designed. That is the most important sentence in this autopsy, because it means the problem was not a bug, not a model failure, and not an edge case the team had missed. The problem was the design itself, which assumed a level of user trust that did not exist and that the team had not measured.

Meridian, a fictional B2B SaaS company in this scenario, built an AI agent for their customer support platform. The agent could read incoming support tickets, look up account history and product documentation, draft a response, and send it with the customer's name and the support rep's signature if the rep had not acted on the ticket within a defined time window. The product reasoning was sound: tickets were being answered slowly, customer satisfaction scores were dropping, and reps were overwhelmed. The agent would handle routine tickets automatically and escalate the complex ones. It shipped. Within three weeks, Meridian's customer trust in the product had deteriorated faster than it had at any point in the company's history.

## What happened

<!-- figure:0 -->

The agent was technically accurate. It answered questions about pricing, feature availability, and account configuration correctly at rates that matched senior rep performance on a blind evaluation. The responses were appropriate in tone and content. But customers started noticing that replies arrived within seconds of their ticket submission, that the signature on the reply was a human rep they had interacted with before, and that when they replied back with a follow-up question, the response pattern repeated. Several customers directly asked whether they were talking to a bot and received a response that did not answer the question.

When the situation became public on a community forum used by Meridian's customers, the framing was not "the AI gave wrong answers." The framing was "Meridian had been impersonating human support staff and hiding it." The accuracy of the responses was irrelevant to that narrative. The trust budget was spent.

## The design assumption that failed

The team had tested user trust in a controlled context: they ran a survey that showed users support responses and asked whether they found them helpful and professional. Users did. What the team had not tested was whether users would accept AI-authored responses delivered under a human name without disclosure. Those are different questions, and the second one would have revealed the trust failure before launch.

The disclosure gap was the design failure. Meridian's support reps used their real names in the signature because customers responded better to named humans. The team had data on that. What they had not considered was that the same preference that made named humans effective made undisclosed AI impersonation a trust violation. The user's mental model included a human on the other end. The product violated that model while borrowing its benefits.

## What responsible agentic design would have looked like

The trust budget for this feature could have been built before it was spent. Sending responses with a disclosed AI identity ("This reply was drafted by Meridian's support assistant, reviewed by the team") would have reduced response rate by some amount and increased the team's ability to measure actual trust in the AI agent separately from trust in the support rep. Running shadow mode for four to six weeks, logging AI drafts alongside rep responses without sending the AI version, would have generated a real quality signal. Requiring human confirmation on the first response to any customer who had never interacted with the AI before would have caught the cases where the agent misread the ticket's emotional register.

All of these design choices add friction. The team had evidence that friction in the support flow reduced customer satisfaction. They optimized for the metric they were measuring and ignored the trust variable they were not measuring until it was too late.

## The lesson

Features that act on behalf of users in consequential contexts do not earn trust by being accurate. They earn trust by being transparent about what they are, being correct consistently over time, and making their actions easy to see and easy to undo. The Meridian agent was accurate. It was not transparent and its actions were not visible to customers as AI actions. Accuracy without transparency spent the trust budget faster than accuracy could replenish it.

Agentic AI product failures of this type will become more common as agent capabilities improve and teams ship faster. The capability improvement is not the risk. The risk is that capability improvement outpaces the design rigor applied to trust, disclosure, and recoverability.

## One handle to take with you

For any agentic feature that acts under a human name, in a human's voice, or on behalf of a user in a consequential context: write down what a user would think is happening, then write down what is actually happening. If those two descriptions differ, the gap is a trust liability and the design needs to close it before launch.

That is the end of this module. The judgment that AI cannot provide, the trust that no feature earns on its first day, and the moats that compound through usage rather than through capability access: these are the product decisions that determine whether AI features become durable products or impressive demos with short shelf lives.`,
  figures: [
    {
      kind: 'connected_boxes',
      ariaLabel: 'Meridian agentic failure: design assumption to trust collapse',
      caption: 'The Meridian case shows how a technically correct agentic feature can fail catastrophically when the design assumes user trust that was never measured. Each step in the failure chain followed logically from the previous one, and each step could have been interrupted by a different design choice.',
      orientation: 'vertical',
      showArrows: true,
      boxes: [
        { label: 'Design assumption', body: ['Users want fast, accurate responses', 'Named human signatures perform better', 'Disclosed AI would reduce response rate'], tone: 'neutral' },
        { label: 'Design gap', body: ['Trust in AI accuracy was tested', 'Trust in undisclosed AI impersonation was not tested', 'Disclosure cost was estimated, disclosure benefit was not'], tone: 'warn' },
        { label: 'Trust collapse', body: ['Customers discovered undisclosed AI', 'Accurate responses irrelevant to disclosure violation', 'Trust recovery required months, not days'], tone: 'warn' },
        { label: 'What would have worked', body: ['Shadow mode before autonomous sending', 'Disclosed AI identity with gradual trust-building', 'Human confirmation on first AI response per customer'], tone: 'ok' },
      ],
    },
  ],
}

const CHAPTERS: ChapterSeed[] = [CH1, CH2, CH3, CH4, CH5, CH6, CH7, CH8]

async function run() {
  const mod = await supabase.from('learn_modules').select('id').eq('slug', MODULE_SLUG).single()
  if (mod.error || !mod.data) {
    console.error(`[seed-ai-products] module ${MODULE_SLUG} not found:`, mod.error)
    process.exit(1)
  }
  console.log(`[seed-ai-products] module ${MODULE_SLUG} -> ${mod.data.id}`)

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

  console.log('\n[seed-ai-products] Done.')
}

run().catch(e => { console.error(e); process.exit(1) })
