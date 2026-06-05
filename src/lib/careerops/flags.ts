// CareerOps feature flags.
//
// One central module that reads `NEXT_PUBLIC_ENABLE_CAREEROPS*` env vars. Works
// on both server and client (the vars are inlined at build time), exactly like
// the existing `AFFILIATES_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AFFILIATES`
// pattern in `TopNav.tsx`.
//
// Everything defaults to OFF, so the whole section ships dark and is turned on
// deliberately. A sub-flag does nothing while the master flag is off, and the
// dependency rules below mirror the graceful-degradation contract in the plan.

export type CareerOpsFeature =
  | 'master'
  | 'scorer'
  | 'discovery'
  | 'routing'
  | 'tracker'
  | 'resume'
  | 'stories'

function readBool(value: string | undefined): boolean {
  return value === 'true'
}

// Raw env reads. Must reference the literal `process.env.NEXT_PUBLIC_*` keys so
// Next.js can statically inline them into the client bundle.
const RAW = {
  master: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS),
  scorer: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS_SCORER),
  discovery: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS_DISCOVERY),
  routing: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS_ROUTING),
  tracker: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS_TRACKER),
  resume: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS_RESUME),
  stories: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS_STORIES),
} as const

// Dependency edges: master → {scorer, tracker, resume, stories}, scorer →
// {routing, discovery}. A feature is only "enabled" when its whole chain is on.
export const careeropsFlags: Record<CareerOpsFeature, boolean> = {
  master: RAW.master,
  scorer: RAW.master && RAW.scorer,
  // discovery reuses the scorer for its Stage-B auto-scoring, so it requires it.
  discovery: RAW.master && RAW.scorer && RAW.discovery,
  routing: RAW.master && RAW.scorer && RAW.routing,
  tracker: RAW.master && RAW.tracker,
  resume: RAW.master && RAW.resume,
  stories: RAW.master && RAW.stories,
}

export function isCareerOpsFeatureEnabled(key: CareerOpsFeature): boolean {
  return careeropsFlags[key]
}
