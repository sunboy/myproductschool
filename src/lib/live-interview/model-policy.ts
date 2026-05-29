export type LiveInterviewModelPurpose =
  | 'chat'
  | 'voice'
  | 'debrief'
  | 'artifact_grade'
  | 'analyze'
  | 'grade_turn'
  | 'classifier'

export const LIVE_INTERVIEW_SONNET_MODEL = 'claude-sonnet-4-6'
export const LIVE_INTERVIEW_HAIKU_MODEL = 'claude-haiku-4-5-20251001'

const MODEL_BY_PURPOSE: Record<LiveInterviewModelPurpose, string> = {
  chat: LIVE_INTERVIEW_SONNET_MODEL,
  voice: LIVE_INTERVIEW_SONNET_MODEL,
  debrief: LIVE_INTERVIEW_SONNET_MODEL,
  artifact_grade: LIVE_INTERVIEW_SONNET_MODEL,
  analyze: LIVE_INTERVIEW_HAIKU_MODEL,
  grade_turn: LIVE_INTERVIEW_HAIKU_MODEL,
  classifier: LIVE_INTERVIEW_HAIKU_MODEL,
}

export function assertNoOpusModel(model: string, route = 'live_interview') {
  if (/\bopus\b/i.test(model)) {
    throw new Error(`Opus is not allowed for ${route}`)
  }
  return model
}

export function liveInterviewModel(purpose: LiveInterviewModelPurpose) {
  return assertNoOpusModel(MODEL_BY_PURPOSE[purpose], `live_interview_${purpose}`)
}
