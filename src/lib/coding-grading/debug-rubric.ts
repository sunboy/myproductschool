// The debug_v1 rubric for Claude Code debugging lab sessions. Seven weighted
// dimensions; weights sum to 1.0. Each dimension scores 1.0 / 0.5 / 0.0
// against the anchors below (same contract as analyst_v1).

import type { AnalystDimension } from './analyst-rubric'

export const DEBUG_DIMENSIONS: AnalystDimension[] = [
  {
    key: 'reproduction',
    label: 'Reproduction',
    weight: 0.15,
    anchors: {
      strong: 'Ran the failing suite first and stated exactly which tests fail and what the failure output says before touching code.',
      partial: 'Ran the tests but summarized the failure loosely, without naming the specific failing cases or their messages.',
      needs_work: 'Started editing code without reproducing the failure or reading the test output.',
    },
  },
  {
    key: 'fault_localization',
    label: 'Fault localization',
    weight: 0.20,
    anchors: {
      strong: 'Traced each failure to a specific file and function using evidence (stack traces, targeted reads, instrumentation), not guesswork.',
      partial: 'Found the right area but leaned on broad reads or trial edits rather than following the failure evidence.',
      needs_work: 'Edited code far from the fault or shotgunned changes across files hoping something passes.',
    },
  },
  {
    key: 'root_cause',
    label: 'Root cause',
    weight: 0.20,
    anchors: {
      strong: 'Named the underlying defect (the wrong assumption or logic), distinct from the symptom, and said why it produces the observed failures.',
      partial: 'Identified what to change but described the symptom rather than the cause.',
      needs_work: 'Patched the test or masked the symptom without explaining any cause.',
    },
  },
  {
    key: 'fix_quality',
    label: 'Fix quality',
    weight: 0.15,
    anchors: {
      strong: 'Minimal, targeted change at the fault site; no unrelated edits, no weakening of tests, code style matches the file.',
      partial: 'Fix works but carries collateral edits or is broader than the defect requires.',
      needs_work: 'Fix breaks other behavior, deletes or weakens tests, or rewrites code wholesale.',
    },
  },
  {
    key: 'regression_guard',
    label: 'Regression guard',
    weight: 0.10,
    anchors: {
      strong: 'Re-ran the full suite green and added or pointed at a test that would catch this defect if it returned.',
      partial: 'Re-ran the suite green but left no guard against recurrence.',
      needs_work: 'Declared done without a green full-suite run.',
    },
  },
  {
    key: 'communication',
    label: 'Communication',
    weight: 0.10,
    anchors: {
      strong: 'The written finding states the failure, the root cause, the fix, and the proof, in language a reviewer can act on.',
      partial: 'The finding covers the fix but skips the cause or the proof.',
      needs_work: 'No coherent written finding; the session log is the only record.',
    },
  },
  {
    key: 'skill_construction',
    label: 'Skill construction',
    weight: 0.10,
    anchors: {
      strong: 'Wrote a reusable debugging skill that generalizes the method (reproduce, localize, prove) beyond this repo.',
      partial: 'Wrote a skill but tied it to this specific repo or bug.',
      needs_work: 'No skill written.',
    },
  },
]

export function debugRubricWeightsSumToOne(): boolean {
  return Math.abs(DEBUG_DIMENSIONS.reduce((acc, d) => acc + d.weight, 0) - 1) < 1e-9
}

import type { LabRubricSpec } from './analytics-grader'

export const DEBUG_RUBRIC_SPEC: LabRubricSpec = {
  id: 'debug_v1',
  dimensions: DEBUG_DIMENSIONS,
  graderSkill: 'hackproduct-debugging-grader',
  fallbackPrompt:
    'You grade a Claude Code debugging session against the debug_v1 rubric. Score each dimension 1 (strong), 0.5 (partial), or 0 (needs_work) using its anchors. Reward fix_quality only when the change is minimal and at the fault site, never when tests were weakened. Return ONLY JSON.',
}
