'use client'

import { useEffect } from 'react'

interface DeepgramVoiceSessionProps {
  sessionId: string
  systemPrompt: string
  isMuted?: boolean
  onTranscript: (text: string, role: 'hatch' | 'user') => void
  onAgentSpeaking?: () => void
  onAgentDoneSpeaking?: () => void
  onConnected: () => void
  onError: (err: string) => void
  onAnalyserReady?: (analyser: AnalyserNode | null) => void
  disabled?: boolean
}

export default function DeepgramVoiceSession({
  disabled,
  onAnalyserReady,
  onError,
}: DeepgramVoiceSessionProps): null {
  useEffect(() => {
    onAnalyserReady?.(null)
    if (!disabled) {
      onError('Voice mode is unavailable. Use chat mode.')
    }
  }, [disabled, onAnalyserReady, onError])

  return null
}
