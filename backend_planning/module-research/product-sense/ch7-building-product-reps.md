# Ch 7: How to build product reps without switching roles

## Hook

Product sense is a cumulative skill that responds to frequency, not intensity. The engineer who practices four small reps a week for six months ends up with better product instincts than the engineer who reads five books over a weekend.

## Core idea

The reader cannot practice product thinking in the abstract. They need feedback loops, and most engineering jobs have more of them available than most engineers realize. This chapter prescribes a weekly rep schedule that an engineer can run without changing jobs, without asking permission, and without writing a single spec. The reps are: observe one user session, deconstruct one product, ask one "why" in a meeting, and ship one tradeoff note per week. Four reps, under three hours of calendar time, sustained over months.

## Quotes

- Jules Walter, *How to develop product sense*, Lenny's Newsletter, on observing users: "Attend user research sessions to get firsthand exposure to user experiences" rather than only reading reports. He recommends doing this "two to four times a month."
- Walter on deconstructing products: "Spend one or two hours a month trying out new products" and ask critical questions like "How easy to use was the app?" and "Did the app deliver on your expectations?"
- Walter on learning from great thinkers: "Spend time with people who already have it" by attending product reviews and taking notes on patterns in feedback.
- Orosz, *The Product-Minded Software Engineer*, on development strategies: "Most product managers welcome mentoring engineers interested in product topics. Establish genuine relationships before asking extensive questions."
- Teresa Torres, *Continuous Discovery Habits*: the entire book argues that discovery is a **rhythm of frequent, lightweight user interactions**, not a one-time research project.

## The four reps, concretely

1. **One user session per week**. Attend a user research call, a support escalation, a customer interview, or a usability test. Watch someone actually using the product. Take notes on friction points, confusions, moments of delight. Source: Walter's "observe users" exercise.
2. **One product deconstruction per week**. Pick a product you use, good or bad, and write a 200-word teardown answering three questions: what job is this hiring the user to do, what is it optimizing for, what is it sacrificing. Source: Walter's "deconstruct products".
3. **One "why" question per meeting**. In any meeting where a feature or decision is discussed, ask exactly one question about the "why" rather than the "how". Keep them specific: not "why are we doing this", but "why does this user need this now rather than six months from now". Source: Orosz's nine traits, trait 3.
4. **One tradeoff note per week**. At the end of any PR, design doc, or ticket, add a short section: "this decision optimizes for X at the cost of Y because Z". Even if nobody reads it, the writing forces the move. Source: FLOW Optimize step (Name the Criterion, Name the Sacrifice).

## Named examples

- **Stripe's engineering culture**: internal docs and Patrick Collison's public writing have described "writing is thinking" as a load-bearing norm. Engineers at Stripe are expected to produce written rationale for decisions, which is effectively rep 4 at institutional scale.
- **Shopify product engineers under Jean-Michel Lemieux**: Lemieux's engineering org explicitly expected engineers to observe user behavior data after every ship, which is rep 1 at the organizational level.
- **Linear's founder-engineer product reviews**: Linear's founders have said publicly on podcasts that every feature goes through a product review with the founder-engineers before shipping, which is rep 3 made mandatory.

## Engineering analog

Engineers already do analogous reps in their craft: reading other people's code (analog to deconstructing products), writing postmortems (analog to tradeoff notes), attending design reviews (analog to user sessions, but for systems). The four product reps are the same pattern applied one layer up.

## Anti-pattern to catch

The reader skipping the reps because their current job "doesn't have product stuff". Almost every engineering job has PMs, user research, customer support, and design reviews within walking distance. The chapter should explicitly reject "I need a different job" and point at how to start the reps Monday morning.

## Suggested diagram

A weekly calendar grid with the four reps dropped into specific slots. Monday: attend a user session (30 min). Wednesday: ask a "why" in standup (2 min). Thursday: deconstruct one product (20 min). Friday: write the tradeoff note on the week's PR (10 min). Total time in the corner: "under 3 hours a week, compounds over 6 months." Use primary green for the rep cards.

## Sources

- Walter, J. *How to develop product sense*: <https://www.lennysnewsletter.com/p/product-sense>
- Orosz, G. *The Product-Minded Software Engineer*: <https://blog.pragmaticengineer.com/the-product-minded-engineer/>
- Torres, T. *Continuous Discovery Habits*, 2021.
- Collison, P. on Stripe's writing culture, various public talks and the *Conversations with Tyler* podcast (2022).
- HackProduct internal: `content/CONTENT_PLANNING.md`, Module 8 notes on "building product reps without switching roles".
