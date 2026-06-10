// Grounding for anonymous public runs: no platform history exists, so the
// scorer must rate readiness as unknown instead of guessing, and the result
// leans on whatever background the visitor pasted.

import type { CareerGrounding } from '@/lib/careerops/grounding'
import type { CareerProfile } from '@/lib/careerops/types'

export const ANON_GROUNDING: CareerGrounding = {
  competencyText: 'No practice history. Anonymous run.',
  practiceText:
    'product_sense: 0 completed; system_design: 0 completed; data_modeling: 0 completed; coding: 0 completed; sql: 0 completed',
  practiceByDiscipline: {
    product_sense: 0,
    system_design: 0,
    data_modeling: 0,
    coding: 0,
    sql: 0,
  },
}

export function anonProfile(background?: string | null): CareerProfile {
  return {
    user_id: 'anonymous',
    target_role: null,
    seniority: null,
    locations: [],
    key_skills: [],
    resume_text: background?.trim() || null,
    resume_json: null,
    comp_expectation: null,
    notes: null,
  }
}
