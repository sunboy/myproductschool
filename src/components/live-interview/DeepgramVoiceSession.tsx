'use client'

// Mic capture + TTS playback for Deepgram Voice Agent API.
// Architecture follows deepgram/browser-agent: two separate AudioContexts
// (micCtx for capture, ttsCtx for playback) to avoid hardware contention.

import { useEffect, useRef } from 'react'

interface DeepgramVoiceSessionProps {
  sessionId: string
  systemPrompt: string
  isMuted?: boolean
  onTranscript: (text: string, role: 'luma' | 'user') => void
  onAudioChunk?: (buffer: ArrayBuffer) => void
  onAgentSpeaking?: () => void
  onAgentDoneSpeaking?: () => void
  onConnected: () => void
  onError: (err: string) => void
  disabled?: boolean
}

function firstChannelToInt16(inputBuffer: AudioBuffer): Int16Array {
  const float32 = inputBuffer.getChannelData(0)
  const int16 = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]))
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
  }
  return int16
}

export default function DeepgramVoiceSession(props: DeepgramVoiceSessionProps): null {
  const {
    sessionId,
    systemPrompt,
    isMuted,
    onTranscript,
    onAgentSpeaking,
    onAgentDoneSpeaking,
    onConnected,
    onError,
    disabled,
  } = props

  const wsRef = useRef<WebSocket | null>(null)
  // Mic capture context — separate from TTS to avoid crackling
  const micCtxRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // TTS playback context
  const ttsCtxRef = useRef<AudioContext | null>(null)
  const ttsStartTimeRef = useRef<number>(0)
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set())

  useEffect(() => {
    if (disabled) return

    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ?? ''
    if (!apiKey) return

    const ws = new WebSocket('wss://agent.deepgram.com/v1/agent/converse', ['token', apiKey])
    wsRef.current = ws
    ws.binaryType = 'arraybuffer'

    // Create TTS playback context (system default rate for smooth output)
    const ttsCtx = new AudioContext()
    ttsCtxRef.current = ttsCtx

    ws.addEventListener('open', () => {
      // Send Settings immediately — Deepgram times out if delayed
      const settings = {
        type: 'Settings',
        audio: {
          input: { encoding: 'linear16', sample_rate: 16000 },
          output: { encoding: 'linear16', sample_rate: 16000 },
        },
        agent: {
          listen: {
            provider: { type: 'deepgram', model: 'nova-3', language: 'en-US' },
          },
          speak: {
            provider: { type: 'deepgram', model: 'aura-2-asteria-en' },
          },
          think: {
            provider: { type: 'open_ai', model: 'gpt-4o-mini' },
            prompt: systemPrompt,
          },
        },
      }
      ws.send(JSON.stringify(settings))

      // Request mic after Settings sent (permission prompt can block)
      navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      }).then((stream) => {
        if (ws.readyState !== WebSocket.OPEN) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        // Mic context — separate from TTS context
        const micCtx = new AudioContext({ sampleRate: 16000 })
        micCtxRef.current = micCtx

        const source = micCtx.createMediaStreamSource(stream)
        sourceNodeRef.current = source
        const processor = micCtx.createScriptProcessor(4096, 1, 1)
        processorRef.current = processor

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return
          const int16 = firstChannelToInt16(e.inputBuffer)
          ws.send(int16.buffer)
        }

        source.connect(processor)
        // Must connect to destination for onaudioprocess to fire.
        // micCtx.destination is separate from ttsCtx — no speaker interference.
        processor.connect(micCtx.destination)

        onConnected()
      }).catch((err) => {
        onError(err instanceof Error ? err.message : 'Microphone access denied')
      })
    })

    ws.addEventListener('message', (event) => {
      if (event.data instanceof ArrayBuffer) {
        // TTS audio — play through ttsCtx
        playAudio(event.data)
        return
      }
      try {
        const payload = JSON.parse(event.data as string)
        if (payload.type === 'ConversationText') {
          onTranscript(payload.content, payload.role === 'agent' ? 'luma' : 'user')
        } else if (payload.type === 'AgentStartedSpeaking') {
          ttsStartTimeRef.current = 0 // reset schedule for new utterance
          onAgentSpeaking?.()
        } else if (payload.type === 'Error') {
          onError(payload.description ?? 'Deepgram error')
        }
      } catch {
        // ignore non-JSON messages
      }
    })

    let intentionallyClosed = false

    ws.addEventListener('error', () => {
      if (!intentionallyClosed) onError('WebSocket connection error')
    })

    function playAudio(data: ArrayBuffer) {
      const ctx = ttsCtxRef.current
      if (!ctx) return

      const int16 = new Int16Array(data)
      if (int16.length === 0) return

      const buffer = ctx.createBuffer(1, int16.length, 16000)
      const channelData = buffer.getChannelData(0)
      for (let i = 0; i < int16.length; i++) {
        channelData[i] = int16[i] / 32768
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)

      const now = ctx.currentTime
      if (ttsStartTimeRef.current < now) {
        ttsStartTimeRef.current = now
      }

      source.addEventListener('ended', () => {
        scheduledSourcesRef.current.delete(source)
        if (scheduledSourcesRef.current.size === 0) {
          onAgentDoneSpeaking?.()
        }
      })

      source.start(ttsStartTimeRef.current)
      ttsStartTimeRef.current += buffer.duration
      scheduledSourcesRef.current.add(source)
    }

    return () => {
      intentionallyClosed = true
      ws.close()
      wsRef.current = null

      processorRef.current?.disconnect()
      processorRef.current = null
      sourceNodeRef.current = null

      micCtxRef.current?.close()
      micCtxRef.current = null

      ttsCtxRef.current?.close()
      ttsCtxRef.current = null

      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, sessionId])

  // Mute/unmute by disconnecting/reconnecting source→processor
  useEffect(() => {
    const source = sourceNodeRef.current
    const processor = processorRef.current
    if (!source || !processor) return

    if (isMuted) {
      try { source.disconnect(processor) } catch { /* already disconnected */ }
    } else {
      try { source.connect(processor) } catch { /* already connected */ }
    }
  }, [isMuted])

  return null
}
