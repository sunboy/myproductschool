Here's the writing style guide:

---

# Technical Chapter Writing Guide

**For AI agents authoring chapter content on HackProduct's tech education platform.**

---

## Voice

Write like a staff engineer composing a great internal doc. Confident. Direct. Occasionally opinionated. You've seen this problem before and you know what matters.

The reader is a senior engineer. They don't need hand-holding. They need the non-obvious insight, the real number, the honest tradeoff. Respect their time by saying the hard thing first.

Shreyas Doshi in a tweet thread is the right register. Not a textbook. Not a memo. Not a blog post trying to rank.

---

## Hard Rules

Follow these without exception. No rationalization passes.

**No em dashes.** Use a comma, a period, or restructure the sentence. Never use `—`.

**No AI slop.** These words are banned. If you write one, rewrite the sentence:
> delve, leverage, utilize, robust, seamlessly, holistic, navigate, unlock, ensure, tailored, cutting-edge, revolutionary, game-changing, in order to, as well as

**No padding.** Every sentence earns its place. If removing a sentence loses nothing, remove it.

**No "in this chapter" intros.** Never open with "In this chapter we will learn...", "By the end of this chapter...", or any variant. Drop straight into the problem.

**No bullet-point-everything.** Bullets are for lists of genuinely parallel items. When an idea has connective tissue — cause and effect, contrast, consequence — write a paragraph. A list of four disconnected bullets is not a paragraph. It's an outline pretending to be writing.

**No second-person role framing.** Never write: "You are a senior engineer at...", "As a tech lead, imagine...", "Picture yourself working at Stripe." Drop straight into the situation. Role is metadata, not copy.

**Coherent sentences only.** Fragment-style writing ("Four moves. Real problem is upstream. Metrics matter.") reads like a slide deck, not writing. Exception: UI chrome, labels, buttons.

---

## Chapter Structure

### `hook_text`
1-2 sentences. The sharpest, most surprising thing about this topic. Pull quote material. A reader should be able to share this sentence and have it land without context.

### Opening
No preamble. No "context" section. No "why this matters" throat-clearing. Start with the problem, the situation, or the counterintuitive claim. The first sentence should do work.

### Body
3-5 sections. Use real examples: real companies, real metrics, real incidents. No "a large tech company" vagueness. If you can't name the company, use a different example.

Figures and diagrams appear inline at the exact point of explanation, not collected at the end.

Tradeoffs are explicit. "This approach is faster but adds operational complexity" is better than describing the approach and leaving the reader to infer the cost.

### Closing
One paragraph. What to remember. What to do next. No summary headers. No bullet recap. No "in conclusion."

---

## Length

800-1200 words. Dense, not padded. A reader should finish in 6-8 minutes and walk away with something concrete they can use or argue with.

If you're at 700 words and the chapter is complete, don't pad it to 800. If you're at 1300 words, cut until the chapter is tighter, not shorter.

---

## Sources and Examples

Always cite real examples. Real company names. Real numbers. Real incidents.

| Instead of this | Write this |
|---|---|
| "A large social network..." | "Facebook's 2012 News Feed ranking team..." |
| "One major cloud provider..." | "AWS in 2017, when S3 went down for 4 hours..." |
| "Metrics showed improvement..." | "Latency dropped from 420ms to 95ms at p99..." |

If you don't have a real example, describe the mechanism clearly enough that the reader could verify it themselves. Vague attribution is worse than no attribution.

---

## Quick Checks Before Submitting

Read your draft against this list. Fix anything that fails.

- Does the first sentence do work, or is it warming up?
- Does every paragraph advance the idea, or does any of it restate what came before?
- Is there an em dash anywhere? Remove it.
- Is there an AI slop word anywhere? Replace it.
- Does any sentence exist only to sound thorough? Cut it.
- Does the closing feel like a conclusion, or like the chapter just stopped? Fix it.
- Are all examples real and specific?

---

## What Good Looks Like

A good chapter makes the reader feel like they just had a 10-minute conversation with someone who has been in the room where this decision was made. They disagree with one thing, they learned two they didn't know, and they know what to do differently on Monday.

A bad chapter makes the reader feel like they read documentation.

---