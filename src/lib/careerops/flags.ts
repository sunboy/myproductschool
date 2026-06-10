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
  | 'public_score'

function readBool(value: string | undefined): boolean {
  return value === 'true'
}

export type RawCareerOpsFlags = Record<CareerOpsFeature, boolean>

// Apply the dependency edges: master → {scorer, tracker, resume, stories},
// scorer → {routing, discovery}. A feature is only "enabled" when its whole chain
// is on. Pure so it can be unit-tested without env/import gymnastics.
export function deriveCareerOpsFlags(raw: RawCareerOpsFlags): Record<CareerOpsFeature, boolean> {
  return {
    master: raw.master,
    scorer: raw.master && raw.scorer,
    // discovery reuses the scorer for its Stage-B auto-scoring, so it requires it.
    discovery: raw.master && raw.scorer && raw.discovery,
    routing: raw.master && raw.scorer && raw.routing,
    tracker: raw.master && raw.tracker,
    resume: raw.master && raw.resume,
    stories: raw.master && raw.stories,
    // The public anonymous tool runs the same scorer engine, so it requires it.
    public_score: raw.master && raw.scorer && raw.public_score,
  }
}

// Raw env reads. Must reference the literal `process.env.NEXT_PUBLIC_*` keys so
// Next.js can statically inline them into the client bundle.
const RAW: RawCareerOpsFlags = {
  master: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS),
  scorer: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS_SCORER),
  discovery: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS_DISCOVERY),
  routing: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS_ROUTING),
  tracker: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS_TRACKER),
  resume: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS_RESUME),
  stories: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS_STORIES),
  public_score: readBool(process.env.NEXT_PUBLIC_ENABLE_CAREEROPS_PUBLIC_SCORE),
}

export const careeropsFlags: Record<CareerOpsFeature, boolean> = deriveCareerOpsFlags(RAW)

export function isCareerOpsFeatureEnabled(key: CareerOpsFeature): boolean {
  return careeropsFlags[key]
}
