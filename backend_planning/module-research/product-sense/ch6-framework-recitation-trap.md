# Ch 6: Framework recitation vs actual thinking, the trap the internet set

## Hook

The internet has optimized PM interview prep into a recitation exam. Candidates can pass the test of knowing CIRCLES, DIGS, RICE, HEART, and AARRR without once demonstrating the reasoning those frameworks were invented to produce.

## Core idea

Frameworks are compression of past reasoning. They work backward, not forward: someone made a good decision, noticed the pattern, and named the steps. Using a framework as a scaffold for your own thinking is fine. Using it as a substitute for thinking is what interviewers are trained to detect, and what produces weak product work on the job as well. This chapter argues that the only way out of the trap is to learn the underlying reasoning move, not the framework name. If you understand why CIRCLES' "C" (Comprehend) exists, you never need to say "C is Comprehend".

## Quotes

- Himanshu Prakash, *The Secret Framework*: "The problem isn't the frameworks themselves, it's that they turn what should be an exciting product conversation into a sterile academic exercise." And: "interviewers can tell within the first two minutes whether someone genuinely thinks about products or just memorized the 'right' way to answer."
- Jules Walter, Lenny's Newsletter: "The best product managers don't recite frameworks; they tell stories that reveal their natural curiosity and user empathy."
- Shreyas Doshi, on "Maslow's Hammer" bias: "Over-relying on familiar tools or frameworks everywhere." From his seven biases list, via Buteau.
- Teresa Torres, *Continuous Discovery Habits*, 2021: the book's central argument is that discovery is a set of habits, not a framework to apply at the start of a project. Habits accumulate into judgment; frameworks applied mechanically do not.

## What the popular frameworks actually compress

- **CIRCLES** (Lewis Lin): Comprehend, Identify, Report, Cut, List, Evaluate, Summarize. Under the labels: "don't start with solutions, name the user first, prioritize, list options, evaluate with criteria, recommend." Every move is already in FLOW.
- **RICE** (Intercom, Sean McBride): Reach × Impact × Confidence ÷ Effort. Compresses the Optimize step into a numeric scorecard. The scoring is less important than the move of naming all four dimensions before picking.
- **HEART** (Google): Happiness, Engagement, Adoption, Retention, Task success. A metrics taxonomy, compresses the Win step's "predicted result" into a checklist of outcome categories.
- **AARRR** (Dave McClure): Acquisition, Activation, Retention, Referral, Revenue. A funnel taxonomy. Same shape as HEART for growth contexts.

## Named examples

- **Lewis Lin, *Decode and Conquer* (2013)**: the origin of CIRCLES. Lin himself has written that the framework is meant as a teaching scaffold, not a ritual. The PM interview industry took it as the latter.
- **Sean McBride at Intercom**: the engineer who formalized RICE scoring. Intercom's own blog has been explicit that RICE is a conversation starter, not a verdict, and that teams which use it mechanically end up prioritizing the wrong things.
- **Google HEART**: the Google UX Research team published HEART in 2010 with the explicit caveat that teams should pick metrics from the taxonomy that fit their product, not copy all five.

## Engineering analog

The same trap exists in engineering: candidates who cite "SOLID" or "dependency injection" or "microservices" as a substitute for system design thinking fail design rounds for the same reason. A senior engineer who has debugged a distributed system in production can explain when to violate SOLID; a junior who has memorized the acronym cannot. Frameworks are load-bearing only when you know the conditions under which they break.

## Anti-pattern to catch

The reader concluding "frameworks are worthless, I should improvise" is the overcorrection. The chapter must land the specific rule: learn the reasoning, name it in your own words, reference the framework only when it helps the listener place what you're doing. "I'm going to name the criterion and the sacrifice first" is worth more than "using the RICE framework".

## Suggested diagram

A two-layer diagram. Top layer: "framework name" (CIRCLES, RICE, HEART, AARRR) as small labels. Bottom layer: "underlying reasoning move" (Frame, List, Optimize, Win) as larger labeled boxes. Arrows from each framework pointing down to the FLOW move it compresses. The caption: "the move is the thing. The framework is a handle for the move."

## Sources

- Prakash, H. *The Secret Framework Top PMs Use to Ace Product Sense Questions*: <https://pshimanshu.substack.com/p/the-secret-framework-top-pms-use>
- Walter, J. *How to develop product sense*: <https://www.lennysnewsletter.com/p/product-sense>
- Doshi, S., "Maslow's Hammer" bias, via Buteau: <https://www.antoinebuteau.com/lessons-from-shreyas-doshi/>
- Torres, T. *Continuous Discovery Habits*, 2021.
- Lin, L. *Decode and Conquer*, 2013 (CIRCLES origin).
- McBride, S. *RICE: Simple Prioritization for Product Managers*, Intercom blog.
- Rodden, K., Hutchinson, H., Fu, X. *Measuring the User Experience on a Large Scale* (HEART paper), Google, 2010.
