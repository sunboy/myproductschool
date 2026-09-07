export interface StoppableAudioSource {
  stop: () => void
}

export type VoiceCloseAction = 'ignore' | 'reconnect' | 'fallback'

export function voiceCloseAction(input: {
  intentionallyClosed: boolean
  isCurrentSocket: boolean
  reconnectAttempts: number
  maxReconnectAttempts: number
}): VoiceCloseAction {
  if (input.intentionallyClosed || !input.isCurrentSocket) return 'ignore'
  if (input.reconnectAttempts >= input.maxReconnectAttempts) return 'fallback'
  return 'reconnect'
}

/**
 * Remove sources from lifecycle tracking before stopping them. AudioBufferSourceNode
 * emits `ended` after stop(); clearing first keeps teardown/barge-in from being
 * mistaken for natural playback completion by those callbacks.
 */
export function stopAndDrainAudioSources<T extends StoppableAudioSource>(sources: Set<T>) {
  const pending = [...sources]
  sources.clear()

  for (const source of pending) {
    try {
      source.stop()
    } catch {
      // A source that already ended or stopped is safe to ignore during teardown.
    }
  }
}
