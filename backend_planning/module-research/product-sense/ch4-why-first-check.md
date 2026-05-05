# Ch 4: The Why-First Check

## Hook

Before any feature spec leaves engineering, it should pass three questions in order: user impact, business viability, engineering sense. Engineering sense comes third, not first, and that ordering is the whole lesson.

## Core idea

Engineers default to evaluating ideas in the order they feel competent (engineering sense first, then business, then user). Product-minded engineers invert that order. The Why-First Check is a three-gate filter that catches bad features before code is written: does this matter to a real person, does it connect to someone's actual need or business model, and only then, can we build it well. Skipping gate one or two produces features that are technically excellent and commercially irrelevant. The check is cheap, the failure of not running it is expensive.

## Quotes

- Marty Cagan, *Inspired*: the four risks framing is closely related and widely paraphrased: value risk (will customers use it), usability risk (can they figure it out), feasibility risk (can we build it), business viability risk (does it work for our business). Engineers are trained to solve feasibility first; product thinking starts with the other three.
- Jules Walter, Lenny's Newsletter: "Many PMs jump into solution-finding before they truly understand the problem. This leads to ineffective solutions."
- Shreyas Doshi on the "execution orientation fallacy": "building what's easiest today rather than tackling harder, higher-value problems". Cited in Antoine Buteau's Doshi summary at <https://www.antoinebuteau.com/lessons-from-shreyas-doshi/>.

## The three gates (phrased for the chapter)

1. **User impact**: what changes for a real named person if this ships? If the answer is "nothing visible" or "it might help someone, somewhere", the feature fails gate one.
2. **Business viability**: does this connect to something the business actually needs, or something a user would pay for, or an outcome a stakeholder is accountable for? If no, gate two fails.
3. **Engineering sense**: can we build it well, with the time and people and tolerance for defects we have? If the answer is no, the feature gets deferred, scoped down, or killed, not rewritten to be buildable at the cost of gates one and two.

## Named examples

- **Google+ 2011-2019**: the engineering was excellent. The user impact gate was effectively "none of our users actually asked for this social network", and the business viability gate was "Facebook already owns this job and our users have no switching pressure." Passing gate three (engineering sense) without gates one and two produced a ten-year multi-billion-dollar shutdown. Source: widely reported; *Trillion Dollar Coach* (Schmidt et al.) and the Ars Technica postmortem are the canonical references.
- **Dropbox MVP 2008**: Drew Houston famously skipped the "engineering sense" gate entirely for the initial validation. The MVP was a demo video explaining the product, posted to Hacker News, which sent signup conversions through the roof before a single line of sync code shipped. Gates one and two were proven first; gate three came later. Source: Houston's talks and *The Lean Startup* (Ries).

## Engineering analog

Architecture reviews at companies like Google, Stripe, and Amazon typically require an engineer to write down the user need, the business case, and the engineering plan as separate sections, in that order. The review fails if the engineering section is strong and the other two are thin. The Why-First Check is the same discipline applied to any feature, not just the architecturally-significant ones.

## Anti-pattern to catch

The reader running the check in reverse: "I have a cool idea (gate 3), let me find a user for it (gate 1), and if anyone objects we can say it drives revenue (gate 2)." The chapter should name this as the most common failure mode of engineer-proposed features and explicitly invert the gate order.

## Suggested diagram

A three-gate funnel. Gate 1 (User impact) on top, Gate 2 (Business viability) middle, Gate 3 (Engineering sense) bottom. Arrows flow down. Features that fail any gate are shown dropping off the side in red. Only features passing all three reach "ship". Annotation: "engineer instinct is to start at the bottom; product sense starts at the top."

## Sources

- Cagan, M. *Inspired: How to Create Tech Products Customers Love*, 2017 (2nd ed.).
- Walter, J. *How to develop product sense*, Lenny's Newsletter: <https://www.lennysnewsletter.com/p/product-sense>
- Doshi, S. summarized by Buteau, A.: <https://www.antoinebuteau.com/lessons-from-shreyas-doshi/>
- Ries, E. *The Lean Startup*, 2011 (Dropbox MVP story).
- HackProduct internal: `content/CONTENT_PLANNING.md`, Module 8 notes on the Why-First Check as a three-part gate.
