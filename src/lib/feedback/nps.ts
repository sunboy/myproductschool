export const NPS_COMPLETED_CHALLENGE_THRESHOLD = 5
export const NPS_PROMPT_COOLDOWN_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

interface ShouldShowNpsPromptInput {
  completedCount: number
  lastPromptAt?: string | null
  now?: Date
}

export function shouldShowNpsPrompt({
  completedCount,
  lastPromptAt,
  now = new Date(),
}: ShouldShowNpsPromptInput) {
  if (completedCount < NPS_COMPLETED_CHALLENGE_THRESHOLD) return false
  if (!lastPromptAt) return true

  const lastPromptTime = new Date(lastPromptAt).getTime()
  if (Number.isNaN(lastPromptTime)) return true

  return now.getTime() - lastPromptTime >= NPS_PROMPT_COOLDOWN_DAYS * DAY_MS
}
