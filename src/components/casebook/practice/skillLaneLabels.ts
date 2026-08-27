import type { SkillLane } from './types'

// Readable labels for each skill lane. Keep in sync with cc_skill_lanes.title
// server-side; this is a client-side fallback map so the workspace never
// renders a raw lane key like "driving-the-agent" to the user.
export const SKILL_LANE_LABELS: Record<SkillLane, string> = {
  'driving-the-agent': 'Driving the agent',
  'forming-hypotheses': 'Forming hypotheses',
  'naming-the-verdict': 'Naming the verdict',
}

export function skillLaneLabel(lane: SkillLane): string {
  return SKILL_LANE_LABELS[lane] ?? lane
}
