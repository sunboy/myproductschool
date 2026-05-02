# Mental Models Framework — Coding
## How Expert Algorithmic and Engineering Thinking Maps to FLOW

**Version:** 1.0
**Date:** 2026-05-01

---

## 1. Why This Doc Exists

Most coding interview feedback is a verdict, not a lesson. "Wrong approach." "Too slow." "Didn't handle edge cases." These tell a learner what they got wrong without naming the reasoning move they missed. This doc maps three coding traditions into FLOW's rubric criteria and competency dimensions, so that every piece of feedback Hatch gives in a coding challenge names the move, not just the mistake. The goal is a learner who can say, before writing a single line: "This decomposes into two subproblems, the first of which matches a known pattern. The naive approach is O(n²); I'm going to argue for O(n log n) and here's why. The edge cases are empty input, single element, and all identical elements." That's not memorization. It's structured reasoning. No thinker names appear in the product. The frameworks surface as reasoning patterns.

---

## 2. The Competency Taxonomy

### `problem_decomposition`

**What it measures:** Breaking a problem into named subproblems before writing any code.

A problem that looks like one thing is usually two or three things in sequence. Problem decomposition is the move of finding the seams, the natural boundaries between subproblems, and naming each part before implementing any of them. The discipline is in the ordering: decompose first, implement second. A learner who decomposes correctly writes the right code even if their first implementation is slow. A learner who implements without decomposing writes fast code that solves the wrong problem.

**Failure mode it prevents:** Treating a compound problem as a single atomic unit and writing an implementation that handles some cases correctly and others silently wrong. The learner starts coding immediately and discovers a structural problem halfway through, forcing a restart or producing an incomplete solution.

**Sample coaching language:**
"Before writing any code: what are the two or three things this function must do, in sequence? Name them. Then we'll talk about implementation."

"You're halfway through an implementation that merges sorted arrays. But the problem also requires deduplication. These are different operations with different complexity profiles. Decompose them separately, then decide whether to merge the implementations."

**Reasoning move:** Name the subproblems before writing the first line.

---

### `pattern_recognition`

**What it measures:** Mapping a new problem to a known problem shape, and knowing when the mapping is approximate rather than exact.

Most problems that appear in coding challenges are variations of a small set of canonical patterns: two pointers, sliding window, depth-first search, breadth-first search, dynamic programming over a subsequence, topological sort, union-find. Pattern recognition is the discipline of seeing the new problem clearly enough to name the pattern it resembles, and then reasoning about where the fit is imperfect and what adjustment is needed.

**Failure mode it prevents:** Treating every problem as novel. The learner spends time designing a custom algorithm for a problem that is recognizably a sliding window variant, arriving at either the same algorithm the pattern provides or a subtly worse version of it. Pattern blindness is expensive and not a sign of originality.

**Sample coaching language:**
"This looks like a sliding window problem. What's the window invariant? What condition causes the left pointer to advance?"

"You're using DFS here. Is that because the problem structure is a tree/graph traversal, or is it a dynamic programming problem that you're solving with recursion? Naming the pattern tells you what the state space is."

**Reasoning move:** Name the pattern before implementing it. Then name where the problem departs from the pattern.

---

### `complexity_reasoning`

**What it measures:** Stating time and space bounds with confidence, and knowing which part of the solution is responsible for the dominant term.

Complexity analysis is not a ritual performed at the end of an explanation. It is a design tool. Knowing that a nested loop produces O(n²) before writing it means you can ask whether O(n²) is acceptable for this input size before committing to the approach. The reasoning discipline is: state the complexity of the approach first, then decide whether to implement it.

**Failure mode it prevents:** Implementing first and discovering the complexity problem when the code doesn't pass. The learner has invested time in an O(n²) solution when the constraints say n can be 10^5, which should have been a disqualifying signal before the first line of code.

**Sample coaching language:**
"The constraints say n can be 10^6. Your current approach is O(n²). That's 10^12 operations, it won't pass. What's the next approach to try?"

"You have two nested loops. One is iterating over the array; the other is a binary search. What's the overall complexity? Hint: they don't add, one contains the other."

**Reasoning move:** State the complexity before the implementation, not after it.

---

### `edge_case_instinct`

**What it measures:** Generating inputs that break naïve solutions before the solution is written.

Edge cases are not things you remember to check at the end. They are a constraint on the algorithm design. A learner with strong edge case instinct generates the breaking inputs during Frame, before implementation, and uses them to validate the approach. Empty input. Single element. All elements identical. The minimum and maximum valid values. Negative numbers where the problem assumes non-negative.

**Failure mode it prevents:** Submitting a solution that handles the happy path correctly and fails on inputs that should have been obvious. The learner treats edge cases as an afterthought and discovers them through test failure rather than through reasoning.

**Sample coaching language:**
"Before you implement: what inputs would break the naïve solution? I can see at least three. Name them."

"You handle the case where the array is empty. What about a single-element array? What does your algorithm produce? Is that the right answer?"

**Reasoning move:** Generate the breaking inputs before writing the solution.

---

## 3. The Thinker Traditions Absorbed

### ALGORITHMIC

**Contribution:** Analysis precedes implementation. Big-O is the language for defending one approach over another.

The algorithmic tradition is the discipline of reasoning about programs before running them. Its canonical move is the complexity proof: before implementing an algorithm, state what it costs in time and space, and why. Not as a post-hoc analysis but as a design constraint. An approach that is O(n²) on inputs of size 10^6 is not a candidate, regardless of how clean the implementation is.

The tradition's intellectual foundation is the assumption that the correct abstraction makes the algorithm obvious. A sorting problem is a sorting problem: there are a small number of comparison-based sort algorithms, their complexities are known, and the choice between them follows from the problem constraints. The engineering discipline is recognizing the abstraction first, then applying the known complexity analysis.

This tradition also contributes the adversarial instinct: prove your algorithm correct by trying to break it. The worst-case input is not the rarest input, for a well-engineered adversarial system, it's the common case. Reasoning about adversarial inputs is not paranoia; it's specification.

**Absorbed:**
- Complexity analysis as a pre-implementation design constraint, not a post-implementation annotation
- Recurrence relation reasoning for recursive algorithms: T(n) = 2T(n/2) + O(n) before the code
- Lower bound arguments: understanding why some problems cannot be solved faster than certain bounds

**Left Behind:**
- Detailed proof of algorithm correctness through invariant maintenance and loop termination proofs. Valuable for algorithm research and formal verification; too granular for the FLOW rubric level. FLOW grades the reasoning move (state complexity, defend approach), not the formal proof.

**Reasoning move:** State the complexity before the implementation. Let the constraint eliminate approaches.

---

### PATTERN CATALOG

**Contribution:** Most problems are variations of known shapes. Recognition is a skill, not a shortcut.

The pattern catalog tradition starts from an empirical observation: the universe of problem shapes that appear in coding challenges and real engineering problems is not infinite. It's maybe twenty or thirty canonical patterns: two pointers, sliding window, monotonic stack, interval merge, topological sort, BFS/DFS, dynamic programming over strings/arrays/trees, union-find, binary search on answer. A skilled practitioner recognizes which pattern a new problem belongs to within the first minute of reading it.

This is not memorization, it's the same reasoning move a doctor uses when they recognize a diagnosis from a cluster of symptoms, or a structural engineer uses when they categorize a load distribution problem. The pattern gives you the state space, the invariant, and the typical complexity. The problem gives you the specifics.

What this tradition contributes to FLOW is the discipline of explicit pattern naming. Not just "I'll use a hash map" but "this is a two-pass frequency count problem: first pass builds the map, second pass reads it. The pattern guarantees O(n) time and O(k) space where k is the number of distinct elements." Naming the pattern makes the reasoning visible and the complexity defensible.

**Absorbed:**
- Explicit pattern naming before implementation: state the canonical pattern, then state the adaptation needed
- Pattern-to-complexity mapping: two pointers is O(n), sliding window is O(n), DP over an n×m table is O(nm)
- Recognizing when a problem departs from a pattern and naming the departure explicitly

**Left Behind:**
- Problem-specific mnemonics and category taxonomies from specific interview preparation systems. The specific categorization varies by source and changes over time. The reasoning move (see the pattern, name the adaptation) is durable; the specific category names are not.

**Reasoning move:** Name the pattern first. Then name where this problem departs from it.

---

### CLEAN CODE

**Contribution:** Code is written for the next engineer, not the compiler. Clarity is a correctness property.

The clean code tradition is built on a claim that sounds obvious and is often violated: code is read far more often than it is written. A function that is hard to read is a function that is likely to be modified incorrectly. A variable named `x` instead of `leftPointer` is a variable that will be misunderstood under time pressure. The discipline of naming, decomposition, and documentation is not aesthetic, it is correctness-adjacent.

This tradition also contributes the single responsibility principle as a design tool: a function that does one thing can be tested in isolation. A function that does three things is a function where the third thing breaks without any indication that it was there. In a coding challenge context, this maps directly to problem decomposition: the seams between subproblems should be function boundaries.

The pragmatic programmer extension of this tradition adds the "don't repeat yourself" discipline: if you write the same logic twice, you've created two places where a bug can hide and only one place where you might fix it. In a FLOW coding challenge, this surfaces at Optimize and Win: the clean implementation is not the one with the fewest lines but the one where the logic is easiest to change.

**Absorbed:**
- Names as documentation: variable and function names that express intent, not implementation
- Function decomposition as a correctness strategy: one function, one responsibility, one testable unit
- The "change test": if a requirement changed, how many places in this code would need to change? More than one is a signal.

**Left Behind:**
- Full style guide prescriptions (line length, bracket placement, specific naming conventions). These are preferences that vary by team and language. The reasoning move (clarity aids correctness) is durable; the specific style rules are not. FLOW grades whether the naming and structure makes the logic legible, not whether it conforms to a specific style guide.

**Reasoning move:** Write for the next reader, not the current compiler. Clarity is a correctness property.

---

## 4. Competency x FLOW Step Mapping

This is the connective tissue between the grading system and the mental models. The grading rubric encodes these mappings. Every challenge feedback page renders the relevant mappings for the steps the user completed.

| Step | Competency | The reasoning move being built |
|---|---|---|
| FRAME | `problem_decomposition` | Name the subproblems before designing the algorithm |
| FRAME | `edge_case_instinct` | Generate the breaking inputs before evaluating approaches |
| FRAME | `complexity_reasoning` | State the complexity requirement given the problem constraints |
| LIST | `pattern_recognition` | Generate candidate algorithmic approaches, named by pattern |
| LIST | `problem_decomposition` | List the subproblems and which pattern applies to each |
| LIST | `complexity_reasoning` | State the complexity of each candidate approach before choosing |
| OPTIMIZE | `complexity_reasoning` | Choose the approach whose complexity fits the constraints, naming the trade-off |
| OPTIMIZE | `pattern_recognition` | Name where the chosen approach departs from the canonical pattern and what that costs |
| OPTIMIZE | `edge_case_instinct` | Verify the chosen approach against the breaking inputs identified in Frame |
| WIN | `problem_decomposition` | Structure the final solution as named, decomposed functions |
| WIN | `edge_case_instinct` | Show the solution handles the breaking inputs, not just the happy path |
| WIN | `complexity_reasoning` | State the final complexity of the solution and which part of the code is responsible for the dominant term |

---

## 5. The Four FLOW Steps for Coding

### Frame, Understand the problem, name the subproblems, and generate breaking inputs

Frame in a coding challenge is the move of doing everything before writing code. Read the problem constraints. Name the subproblems. Generate the inputs that would break a naïve solution. State the complexity ceiling given the constraints. A Frame done well makes List an enumeration of known approaches; a Frame done poorly makes List a guess.

The most common Frame failure in coding is starting to code too early. A learner who writes code in the first two minutes of a coding challenge has not Framed. They have Listed with their fingers, which is a slow and expensive way to List.

**Rubric criteria:**

- **F1, Problem restatement:** State the problem in your own words, including the input shape, output shape, and any constraints. This exposes misunderstanding before it becomes wasted code.
- **F2, Subproblem identification:** Name the two or three subproblems the solution must address. What must happen, in what order?
- **F3, Constraint analysis:** State the size constraints and what they imply for acceptable complexity. n up to 10^5 means O(n²) is borderline; n up to 10^8 means O(n log n) is the ceiling.
- **F4, Breaking inputs:** List the edge cases that a naïve solution would fail on. Empty input. Single element. All elements identical. Integer overflow. Negative numbers. These become the test cases.

**Anti-patterns:**
- Writing code before naming the subproblems
- Stating the algorithm without verifying it handles the breaking inputs
- Ignoring the constraint size when choosing the approach

**Reasoning move:** Frame the problem before solving it. Code is the last thing you write, not the first.

---

### List, Enumerate candidate approaches by pattern, with complexity stated for each

List in a coding challenge is the move of generating multiple approaches before committing to one. Each approach is named by pattern, not by implementation. Not "I'll use a hash map" but "two-pass frequency count: O(n) time, O(k) space." Not "I'll sort it" but "sort-then-scan: O(n log n) time, O(1) extra space after the sort."

Good listing generates approaches at different complexity levels and makes the trade-off visible: the brute force approach is O(n²) and simple to implement; the optimized approach is O(n log n) and requires a sorted structure. The choice between them depends on n and on the time available to implement correctly.

**Rubric criteria:**

- **L1, Brute force baseline:** State the brute force approach, its complexity, and what it gets wrong (too slow, too much space). The baseline is not a failure, it's the reference point.
- **L2, Pattern-named alternatives:** Name at least two approaches by their canonical pattern. Each gets a one-line complexity statement.
- **L3, Trade-off articulation:** For each approach, state what it optimizes for and what it costs. Time vs. space. Implementation complexity vs. runtime performance.

**Anti-patterns:**
- Jumping to the optimal solution without naming the brute force baseline
- Listing approaches without stating their complexities
- Naming data structures ("hash map") without naming the algorithm pattern they enable

**Reasoning move:** State the brute force first. Then name the pattern that improves on it.

---

### Optimize, Choose the approach, verify the complexity, and stress-test against breaking inputs

Optimize in a coding challenge is the move of choosing between candidate approaches while naming what the chosen approach costs and verifying it handles the edge cases. The complexity is not estimated after the fact, it's the reason for the choice. The edge cases are not checked at the end, they're the first thing verified once an approach is selected.

Optimize done poorly is "I'll use the hash map approach because it's faster." Optimize done well is "The two-pass frequency count is O(n) time and O(k) space where k is the number of distinct elements. For the given constraints (n up to 10^5, values up to 10^9), the space cost is acceptable. Now let me verify it handles an empty array and an array of all identical elements."

**Rubric criteria:**

- **O1, Complexity commitment:** State the final complexity of the chosen approach and which step in the algorithm is responsible for the dominant term.
- **O2, Space-time trade-off:** If the chosen approach uses extra space to reduce time (hash map, prefix sum array), name the trade-off explicitly.
- **O3, Edge case verification:** Walk through at least two breaking inputs against the chosen approach. Not "it should handle empty input", walk through what the algorithm does on empty input.
- **O4, Implementation plan:** State the function decomposition before writing code. One function per subproblem identified in Frame.

**Anti-patterns:**
- Choosing an approach without verifying its complexity
- Verifying edge cases on the whiteboard only (claiming "it handles it" without tracing)
- Implementing a monolithic function when the problem decomposes into natural subproblems

**Reasoning move:** Choose the approach whose complexity fits. Verify it on the breaking inputs before implementing.

---

### Win, Implement cleanly, with decomposition and verified correctness

Win in a coding challenge is the move of writing code that is correct, legible, and structured to match the decomposition from Frame. The function names match the subproblem names. The edge cases are handled explicitly, not implicitly. The complexity matches what was committed in Optimize. Anyone who reads the code in six months can understand what problem it's solving.

A Win without decomposition is a function that happens to be correct. A Win without edge case handling is a function that passes the example test cases and fails the hidden ones. A Win without readable names is code that will be misread under pressure.

**Rubric criteria:**

- **W1, Decomposed implementation:** The code is structured as named functions that match the subproblems from Frame. No monolithic function that does all three things.
- **W2, Explicit edge case handling:** Edge cases identified in Frame are handled explicitly in the code. Not "I assume the input is non-empty", the code checks and returns the correct value.
- **W3, Complexity match:** The final implementation matches the complexity committed in Optimize. If the complexity changed during implementation, name why.
- **W4, Readable naming:** Variable and function names express intent. A reviewer who didn't watch the solve can understand the code from reading it.

**Anti-patterns:**
- Writing all logic in one function regardless of how many subproblems there are
- Handling edge cases in comments rather than in code
- Using single-letter variable names for anything other than loop indices in two-line loops

**Reasoning move:** Write for the next reader. Clarity is part of correctness.

---

## 6. How This Surfaces in the Product

### a. Per-MCQ Option Explanations

Each answer option shows which reasoning move it demonstrates or violates. The explanation has two layers:

**Layer 1, What this option does right or wrong (rubric layer):**
> "Starting with a brute force O(n²) approach and then explaining the optimization path is correct reasoning, not a failure to find the optimal answer. It establishes a baseline, makes the trade-off visible, and demonstrates that the optimization is an improvement over something, not just a choice."

**Layer 2, Which reasoning pattern it's building (framework layer):**
> Complexity Reasoning: The brute force baseline is the reference point. Every optimization is measured against it. A learner who jumps to the optimal solution without naming the brute force cannot defend why the optimal approach is actually better.

For wrong answers:
> "Stating 'I'll use a hash map' without naming what the hash map enables is a pattern name without pattern reasoning. The question is: what algorithm does the hash map make possible, and what's the complexity of that algorithm?"
>
> Pattern Recognition: Naming a data structure is not the same as naming the pattern. The pattern tells you the state space, the invariant, and the complexity. The data structure is an implementation choice inside the pattern.

---

### b. Per-Step Grading Output

Hatch's step-level feedback includes a `competency_signal` block alongside the standard `detected` / `missed` / `coaching` output:

```json
{
  "score": "partial",
  "criteria_scores": { "F1": "strong", "F2": "partial", "F3": "needs_work", "F4": "needs_work" },
  "detected": "You restated the problem correctly and identified the two main subproblems. The decomposition is accurate...",
  "missed": "You didn't generate the breaking inputs before choosing an approach. An empty array, a single-element array, and an array where all elements are identical would all behave differently on your initial approach.",
  "coaching": "Frame is strong on subproblem identification. The missing move is edge case generation, producing the inputs that break naïve approaches before you commit to one. Those inputs should constrain the approach choice, not be discovered after implementation.",
  "competency_signal": {
    "primary": "edge_case_instinct",
    "signal": "You found the subproblems correctly. The next level is generating the breaking inputs at Frame time, before choosing an approach. Those inputs are constraints on the algorithm, not tests of the implementation.",
    "framework_hint": "Edge Case Instinct: edge cases are not things you check at the end. They are signals about the algorithm's invariant. Finding them at Frame time eliminates approaches before you invest in implementing them."
  }
}
```

---

### c. Post-Challenge Mental Models Breakdown

After completing all four FLOW steps, the feedback page shows a map from this challenge back to the reasoning moves being built:

```
What you were building in this challenge
─────────────────────────────────────────

FRAME   →   Problem Decomposition + Edge Case Instinct
            You were practicing: name the subproblems before
            writing any code, and generate the inputs that
            break the naïve approach before choosing between
            approaches. Frame is where you eliminate wrong
            answers before you start implementing.

LIST    →   Pattern Recognition + Complexity Reasoning
            You were practicing: see the canonical shape in
            the new problem, name it, and state its complexity.
            Not "I'll sort it" but "merge-sort-based approach,
            O(n log n) time, here's why it fits."

OPTIMIZE →  Complexity Reasoning + Edge Case Instinct
            You were practicing: choose based on complexity,
            then verify on the breaking inputs before
            implementing. Optimization without verification
            is assumption.

WIN     →   Problem Decomposition + Edge Case Instinct
            You were practicing: write code that matches the
            decomposition, with edge cases handled explicitly
            in code, not in comments. Clear structure and
            explicit edge case handling are what makes code
            correct under maintenance.

─────────────────────────────────────────
Your weakest competency this challenge: Edge Case Instinct

You identified the algorithm correctly and implemented it
cleanly. But you didn't handle a single-element input, which
produces an off-by-one in the boundary conditions. Strong
edge case instinct means finding that input at Frame time —
before the implementation, not discovering it through a
test failure.

Next challenge to develop this:
→ The Interval Merge (Coding · Edge Case Track)
  Every wrong answer comes from a different boundary
  condition. There are five of them.
```

---

## 7. Coaching Language Style Guide

Hatch talks about coding like a senior engineer giving a whiteboard review, direct, specific, and focused on the reasoning before the code.

**Voice principles:**

The coaching language targets the reasoning move, not the implementation choice. "Use a hash map" is not coaching. "Name the algorithm that the hash map enables and state its complexity" is the move.

Hatch coaches toward pre-implementation reasoning. The most common failure mode in coding challenges is starting to code before thinking. Coaching should surface that a learner who writes code in the first two minutes has likely skipped Frame entirely.

The coaching voice names the consequence of the missing move. "You didn't name the complexity upfront" is not useful. "Your approach is O(n²) on input sizes up to 10^5, which is 10^10 operations. That's the signal to revisit the approach before implementing" is the move.

**Phrasings to use:**
- "Before writing any code: what are the subproblems?"
- "Name the pattern. Then name where this problem departs from it."
- "The constraints say n up to 10^5. What does that tell you about acceptable complexity?"
- "Walk me through what your algorithm does on an empty array."
- "You said the approach is O(n log n). Which line of the implementation is responsible for the log n factor?"
- "Write the function signatures before the implementations."
- "State the invariant before writing the loop."
- "What input would break this?"

**Phrasings to avoid:**
- "Good approach!" (no specificity)
- "This is efficient" (efficient compared to what? At what input size?)
- "Just use a hash map" (name the algorithm, not the data structure)
- "This doesn't handle edge cases" (name which edge case and what the algorithm produces on it)
- "The code is hard to read" (name which name is unclear and what it should be instead)

**Tone calibration:**
Coding coaching is precise and forward-pointing. "You're O(n²) and the constraint is 10^5" is not a verdict, it's a diagnostic that tells the learner exactly where to go next. The coaching should leave the learner at the start of their next step, not at the end of a postmortem.

---

## 8. Open Questions

**1. Should `pattern_recognition` include a catalog, or stay abstract?**
The current definition keeps pattern recognition at the abstract level: name the pattern, name the complexity, name the departure. But learners may need a shared vocabulary to name patterns consistently ("two pointers" vs. "sliding window" vs. "fast-slow pointers"). Should the rubric define the canonical pattern names, or treat pattern naming as a learner choice? A defined catalog makes grading more consistent; an open catalog may be more genuine.

**2. How does FLOW handle implementation language differences?**
The FLOW step definitions are language-agnostic. But complexity guarantees depend on the implementation language (Python lists are dynamic arrays; Python dicts are hash maps with specific collision behavior). Should the grading rubric account for language-specific complexity guarantees, or grade at the algorithmic level and ignore implementation language?

**3. Is `clean_code` reasoning gradeable from MCQ alone?**
Readability and naming are hard to grade from multiple-choice selection. The current rubric scores `problem_decomposition` and `edge_case_instinct` from MCQ; `complexity_reasoning` is straightforward; but `clean code` principles may require a freeform step where the learner writes actual code. Is this competency adequately represented in the current MCQ format, or does it require a different challenge type?

**4. Where does debugging fit?**
None of the four competencies explicitly covers debugging, the process of diagnosing why existing code is wrong. This is a significant part of real engineering work and often a component of coding challenges. Is debugging a subskill of `edge_case_instinct` (generating the input that exposes the bug), or does it warrant its own competency? This is unresolved for v1.

**5. How should the rubric handle the optimize-vs-readable trade-off?**
`complexity_reasoning` rewards choosing a more efficient approach. `problem_decomposition` (and the clean code tradition it draws on) rewards clear structure. In some cases these are in tension: the more efficient algorithm is less readable. Should the grader have explicit guidance on how to weigh these when they conflict, or is that a per-challenge calibration decision?
