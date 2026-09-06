import { ConceptProductEvidence } from '@/components/auth/editorial/concepts/ConceptProductEvidence'

/**
 * The live login/signup presentation. Switching which concept is in
 * production is a one-line import swap here — no experiment framework,
 * no feature flags, no traffic splitting (D2). /login and /signup both
 * import this same component so they always render the same variant.
 *
 * Available concepts:
 *   ConceptProductEvidence — 01, brand default (DESIGN_SYSTEM's recommendation)
 *   ConceptDarkEditorial   — 02, dark campaign-style
 *   ConceptQuietStudio     — 03, calmest option
 */
export const ActiveLoginConcept = ConceptProductEvidence
