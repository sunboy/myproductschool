'use client'

import { useState, useRef, useCallback } from 'react'

// SpeechRecognition is available in browsers that support it; not in all @types/web versions.
type SpeechRecognitionType = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start(): void
  stop(): void
}

type SpeechRecognitionEvent = {
  results: Array<Array<{ transcript: string }>>
}

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceInputButton({ onTranscript, disabled }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionType | null>(null)

  const toggle = useCallback(() => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const win = window as unknown as Record<string, new () => SpeechRecognitionType>
    const SpeechRecognitionCtor = win['SpeechRecognition'] ?? win['webkitSpeechRecognition']
    if (!SpeechRecognitionCtor) return
    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      if (transcript.trim()) onTranscript(transcript.trim())
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isListening, onTranscript])

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={isListening ? 'Stop listening' : 'Speak to Hatch'}
      className={`p-2 rounded-full transition-colors ${
        isListening
          ? 'bg-red-100 text-red-600 animate-pulse'
          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
      } disabled:opacity-40`}
    >
      <span className="material-symbols-outlined text-[20px]">
        {isListening ? 'mic_off' : 'mic'}
      </span>
    </button>
  )
}
