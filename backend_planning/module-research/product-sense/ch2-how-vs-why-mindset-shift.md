# Ch 2: The "how" vs "why" mindset shift

## Hook

Engineers are trained to jump to "how do we build this" the moment a spec lands. The single biggest unlock in product thinking is staying in "why" long enough for the "how" to get a different answer.

## Core idea

Engineering culture rewards fast execution and the "how" is where competence lives: architecture, performance, correctness. But every ten minutes an engineer spends upstream on "why" often saves weeks downstream on "how", because the best "how" changes when the "why" changes. Product thinking is not less rigor, it is rigor applied to the layer above the one engineers normally inhabit. The shift is not adding a skill, it is practicing the same rigor on the right question.

## Quotes

- Simon Sinek, *Start With Why*: the entire thesis, often paraphrased by product leaders, is that the most differentiated products start from a clear "why" and the "how" and "what" fall out of it. Engineers who skip "why" produce technically correct products that solve the wrong problem.
- Gergely Orosz, *The Product-Minded Software Engineer*: "They are curious and keen to ask 'why?' Product-minded engineers ask why certain features are prioritized, why certain milestones are picked, and why certain things are measured."
- Marty Cagan has a widely circulated framing that "we need teams of missionaries, not teams of mercenaries." Missionaries start with why; mercenaries start with the ticket.

## Named examples

- **Instagram 2010**: the original product was Burbn, a check-in app with photo sharing as one feature among many. The "how" question (how do we build a better check-in app) kept producing diminishing returns. The "why" question (why are people actually using this) revealed that only the photo filter use case had traction, and the founders killed everything else to ship Instagram. Source: widely reported, see *Creative Selection* (Ken Kocienda) and the Systrom interviews on *Masters of Scale*.
- **Gmail 2004**: Paul Buchheit has said in interviews that the 1GB storage decision came from asking "why do users keep running out of space" rather than "how do we give them a bigger quota button". The answer reframed email as archive, not inbox.

## Engineering analog

The Five Whys exercise from Toyota production and Google's postmortem culture is exactly this shift, applied to incidents. "The test is flaky" is a "how" framing. "Why is the test flaky" walks upstream until the answer is "because the service has a race condition between the cache warm-up and the health check", which is a different fix in a different file. Product rooms are just slower feedback loops for the same move.

## Anti-pattern to catch

The engineer reading a spec and mentally skipping to implementation the moment they understand the ask. The chapter names the skip as the source of most "engineers who are technically strong but lack product sense" feedback, and reframes asking "why" not as a delay but as the cheapest thing an engineer can do before code is written.

## Suggested diagram

A vertical stack with two layers. The top layer is "Why" (problem, user, business context). The bottom layer is "How" (architecture, implementation, release). An arrow from the top down to the bottom labeled "answer flows down". A dotted back-arrow from the bottom up labeled "engineer instinct" (the wrong direction). The diagram makes clear that the "how" should derive from the "why", not the other way around.

## Sources

- Sinek, S. *Start With Why*, 2009.
- Orosz, G. *The Product-Minded Software Engineer*, 2019: <https://blog.pragmaticengineer.com/the-product-minded-engineer/>
- Cagan, M. *Inspired: How to Create Tech Products Customers Love*, 2nd ed., 2017. The "missionaries vs mercenaries" framing appears across his talks and blog at <https://www.svpg.com/>.
- Kocienda, K. *Creative Selection*, 2018. (Instagram/Burbn teardown is secondary; primary is Systrom's own account on *Masters of Scale*.)
- HackProduct internal: `content/CONTENT_PLANNING.md`, Module 8 "Engineer-to-PM Mindset Shift" notes.
