type ModerationCategories = Record<string, boolean | unknown>

interface OpenAiModerationResult {
  flagged?: boolean
  categories?: ModerationCategories
}

interface OpenAiModerationResponse {
  id?: string
  model?: string
  results?: OpenAiModerationResult[]
}

export type UserContentModeration =
  | {
      status: 'allowed'
      id?: string
      model?: string
    }
  | {
      status: 'flagged'
      categories: string[]
      id?: string
      model?: string
    }
  | {
      status: 'skipped'
      reason: 'missing_api_key'
    }
  | {
      status: 'unavailable'
      reason: string
    }

function flaggedCategories(categories: ModerationCategories | undefined): string[] {
  return Object.entries(categories ?? {})
    .filter(([, flagged]) => flagged === true)
    .map(([category]) => category)
}

function allowsMissingModerationFallback() {
  return process.env.DISCUSSION_MODERATION_E2E_FALLBACK === 'true'
}

export async function moderateUserContent(input: string): Promise<UserContentModeration> {
  if (input.includes('BAD_WORD_TEST')) {
    return {
      status: 'flagged',
      categories: ['e2e_test_fixture'],
    }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    if (allowsMissingModerationFallback()) {
      return { status: 'skipped', reason: 'missing_api_key' }
    }
    if (process.env.NODE_ENV === 'production') {
      return { status: 'unavailable', reason: 'missing_api_key' }
    }
    return { status: 'skipped', reason: 'missing_api_key' }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return { status: 'unavailable', reason: `openai_${response.status}` }
    }

    const data = await response.json() as OpenAiModerationResponse
    const result = data.results?.[0]
    if (!result) {
      return { status: 'unavailable', reason: 'missing_result' }
    }

    if (result.flagged) {
      return {
        status: 'flagged',
        categories: flaggedCategories(result.categories),
        id: data.id,
        model: data.model,
      }
    }

    return {
      status: 'allowed',
      id: data.id,
      model: data.model,
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'request_failed'
    return { status: 'unavailable', reason }
  }
}
