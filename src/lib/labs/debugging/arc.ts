// The default debugging-lab arc: a repo with failing tests lands in the
// sandbox; the learner drives Claude Code from reproduction to a proven fix,
// then encodes the method as a reusable skill. Same authoring contract as the
// analytics arc: challenges override steps by id via metadata.sub_problems.

import type { AnalyticsSubProblem } from '@/components/v2/mediums/types'

export const DEFAULT_DEBUGGING_ARC: AnalyticsSubProblem[] = [
  {
    id: 'env_setup',
    sequence: 1,
    title: 'Get the build running',
    objective: 'Install dependencies and confirm the project runs its test suite in the sandbox.',
    successCriterion: 'The test suite runs end to end (failures expected) and you can name the test command.',
    suggestedPrompts: [
      'npm install',
      'claude',
      'Run the test suite and show me the output',
    ],
    kind: 'env_setup',
    rubricDimension: 'reproduction',
    whyItMatters:
      'The sandbox ships a real repository, not a toy snippet. Claude Code can read, run, and edit it the way it would on your own machine. Getting the suite running is what turns the code from text into evidence.',
    teachingNote:
      'Click Start sandbox to spin up the environment with the repository already checked out in /workspace. Install dependencies first, then start Claude by typing claude. From there you work in plain language: ask it to run the tests and read the results with you.',
  },
  {
    id: 'reproduce',
    sequence: 2,
    title: 'Reproduce the failure',
    objective: 'Run the failing tests and capture exactly which cases fail and what the output says.',
    successCriterion: 'Paste the failing test names and the key line of each failure message.',
    suggestedPrompts: [
      'Run the test suite and list every failing test with its error message',
      'Which of these failures share a stack trace or a common module?',
    ],
    kind: 'reproduce',
    rubricDimension: 'reproduction',
    teachingNote:
      'A failure you have not reproduced is a rumor. Read the actual output before forming a theory: the failing test names and messages are the first evidence, and they usually point at fewer places than you expect.',
    learnChecklist: [
      'Which tests fail',
      'What each failure message actually says',
      'Whether the failures cluster around one module',
    ],
  },
  {
    id: 'localize',
    sequence: 3,
    title: 'Localize the fault',
    objective: 'Follow the failure evidence to the specific file and function where behavior diverges from intent.',
    successCriterion: 'Name the file and function each failure traces to, with the evidence that took you there.',
    suggestedPrompts: [
      'Trace the first failing test into the source. Which function produces the wrong value?',
      'Add a focused log or assertion to confirm where the value goes wrong',
    ],
    kind: 'localize',
    rubricDimension: 'fault_localization',
    teachingNote:
      'Resist editing until you can point at the line. Narrow with evidence: stack traces, targeted reads, a temporary assertion. Guess-and-patch feels fast and costs more, because every wrong edit adds noise to the next read.',
  },
  {
    id: 'root_cause',
    sequence: 4,
    title: 'Name the root cause',
    objective: 'State the underlying defect, the wrong assumption or logic, as distinct from the failing symptom.',
    successCriterion: 'One or two sentences: the defect, and why it produces exactly these failures.',
    suggestedPrompts: [
      'Explain why this code produces this failure. What assumption does it make that is false?',
      'Would this bug affect any behavior the tests do not cover?',
    ],
    kind: 'root_cause',
    rubricDimension: 'root_cause',
    teachingNote:
      'The symptom is what the test sees; the cause is the false assumption in the code. Fixes aimed at symptoms come back. Say the cause out loud before you patch, and the patch usually shrinks.',
  },
  {
    id: 'fix',
    sequence: 5,
    title: 'Apply the fix',
    objective: 'Make the smallest change that corrects the defect at its source.',
    successCriterion: 'State the file and the change, and why it is the minimal correct fix.',
    suggestedPrompts: [
      'Apply the minimal fix at the fault site. Do not touch the tests.',
      'Show me the diff of what changed',
    ],
    kind: 'fix',
    rubricDimension: 'fix_quality',
    teachingNote:
      'A good fix reads like it was always meant to be there: smallest possible diff, at the cause, matching the style around it. Never bend the test to pass the code.',
  },
  {
    id: 'verify',
    sequence: 6,
    title: 'Prove it',
    objective: 'Re-run the full suite green and guard against the defect returning.',
    successCriterion: 'Paste the green suite summary and name the test that would catch a regression.',
    suggestedPrompts: [
      'Run the full test suite and confirm everything passes',
      'Is there a test that would catch this bug if it came back? If not, add one.',
    ],
    kind: 'verify',
    rubricDimension: 'regression_guard',
    teachingNote:
      'The failing tests going green proves the symptom is gone; the FULL suite going green proves you did not trade one bug for another. A regression test makes the fix permanent.',
  },
  {
    id: 'report',
    sequence: 7,
    title: 'Write the finding',
    objective: 'Have Claude write the failure, root cause, fix, and proof to a report file a reviewer could act on.',
    successCriterion: 'Confirm the report file path, e.g. /workspace/report.md.',
    suggestedPrompts: [
      'Write the failure, the root cause, the fix, and the proof to /workspace/report.md',
      'Add the before and after test output to the report',
    ],
    kind: 'report',
    rubricDimension: 'communication',
    teachingNote:
      'The report is what outlives the session: a reviewer should understand the defect and trust the fix without re-running anything. Cause, change, proof, in that order.',
  },
  {
    id: 'skill',
    sequence: 8,
    title: 'Write a skill',
    objective: 'Encode the debugging method as a .claude/skills file so the next session inherits it.',
    successCriterion: 'Confirm the skill file name you wrote.',
    suggestedPrompts: [
      'Write a .claude/skills/systematic-debugger.md that captures this method',
      'Make the skill generalize to any repo, not just this one',
    ],
    kind: 'skill',
    rubricDimension: 'skill_construction',
    whyItMatters:
      'A skill is a saved play. Write one, and the next session starts already knowing this method, on any repository. This is the move that compounds, and it is what separates a one-off fix from a repeatable capability you own.',
    teachingNote:
      'Teaching Claude a skill is the move that compounds. Encode the method you just ran (reproduce, localize, prove) as a reusable check and every future session starts smarter.',
  },
]

// Open-guidance stretch: defend the fix under scope pressure.
export const BLAST_RADIUS_STEP: AnalyticsSubProblem = {
  id: 'blast_radius',
  sequence: 99,
  title: 'Call the blast radius',
  objective: 'A reviewer asks what else this defect could have corrupted while it was live. Bound the impact with evidence.',
  successCriterion: 'Name what the defect could and could not have affected, with the code path that proves the boundary.',
  suggestedPrompts: [
    'Which callers reach the fixed function, and which of them could have produced bad output while the bug was live?',
  ],
  // stakeholder_tension is the shared stretch kind: the adaptive engine's
  // stretch handling (badges, spine rows, verdict flow) applies unchanged.
  kind: 'stakeholder_tension',
  rubricDimension: 'root_cause',
}
