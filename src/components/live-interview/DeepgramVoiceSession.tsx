'use client'

// SECURITY: NEXT_PUBLIC_DEEPGRAM_API_KEY exposes the key client-side. For production,
// proxy through a server-side WebSocket relay that injects the key server-side.

import { useEffect, useRef } from 'react'

interface DeepgramVoiceSessionProps {
  sessionId: string
  systemPrompt: string
  onTranscript: (text: string, role: 'luma' | 'user') => void
  onAudioChunk: (buffer: ArrayBuffer) => void
  onAgentSpeaking?: () => void
  onConnected: () => void
  onError: (err: string) => void
  disabled?: boolean // mock mode — renders nothing, calls no APIs
}

export default function DeepgramVoiceSession(props: DeepgramVoiceSessionProps): null {
  const {
    sessionId,
    systemPrompt,
    onTranscript,
    onAudioChunk,
    onAgentSpeaking,
    onConnected,
    onError,
    disabled,
  } = props

  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (disabled) return

    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ?? ''
    const ws = new WebSocket('wss://agent.deepgram.com/agent', ['token', apiKey])
    wsRef.current = ws
    ws.binaryType = 'arraybuffer'

    ws.addEventListener('open', async () => {
      // Request mic access and pipe audio — do this first so we know the actual sample rate
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream

        const audioCtx = new AudioContext({ sampleRate: 16000 })
        audioCtxRef.current = audioCtx

        // Read back the actual sample rate (browsers may not honour the requested value)
        const actualSampleRate = audioCtx.sampleRate

        // Send settings message using the actual sample rate
        const settings = {
          type: 'Settings',
          audio: {
            input: { encoding: 'linear16', sample_rate: actualSampleRate },
            output: { encoding: 'linear16', sample_rate: actualSampleRate, container: 'none' },
          },
          agent: {
            listen: { model: 'nova-2' },
            speak: { model: 'aura-asteria-en' },
            think: {
              provider: {
                type: 'custom',
                url: `/api/live-interview/${sessionId}/turn`,
              },
              model: 'claude-sonnet-4-6',
              instructions: systemPrompt,
            },
          },
        }
        ws.send(JSON.stringify(settings))

        const source = audioCtx.createMediaStreamSource(stream)
        // ScriptProcessorNode is deprecated but widely supported; replace with AudioWorklet in production
        const processor = audioCtx.createScriptProcessor(4096, 1, 1)
        processorRef.current = processor

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return
          const float32 = e.inputBuffer.getChannelData(0)
          const int16 = new Int16Array(float32.length)
          for (let i = 0; i < float32.length; i++) {
            const clamped = Math.max(-1, Math.min(1, float32[i]))
            int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
          }
          ws.send(int16.buffer)
        }

        source.connect(processor)
        processor.connect(audioCtx.destination)

        // Signal connected only after mic + audio graph are fully wired
        onConnected()
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Microphone access denied')
      }
    })

    ws.addEventListener('message', (event) => {
      if (event.data instanceof ArrayBuffer) {
        onAudioChunk(event.data)
        return
      }
      try {
        const payload = JSON.parse(event.data as string)
        if (payload.type === 'ConversationText') {
          onTranscript(payload.content, payload.role === 'agent' ? 'luma' : 'user')
        } else if (payload.type === 'AgentStartedSpeaking') {
          onAgentSpeaking?.()
        } else if (payload.type === 'Error') {
          onError(payload.description ?? 'Deepgram error')
        }
      } catch {
        // ignore non-JSON messages
      }
    })

    ws.addEventListener('error', () => {
      onError('WebSocket connection error')
    })

    return () => {
      ws.close()
      wsRef.current = null

      processorRef.current?.disconnect()
      processorRef.current = null

      audioCtxRef.current?.close()
      audioCtxRef.current = null

      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps — systemPrompt is intentionally captured at mount only; changing it would require a new session
  }, [disabled, sessionId])

  return null
}
