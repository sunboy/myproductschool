'use client'

// Mic capture via AudioWorklet (off main thread) + TTS playback.
// Two separate AudioContexts: micCtx for capture, ttsCtx for playback.

import { useEffect, useRef } from 'react'

interface DeepgramVoiceSessionProps {
  sessionId: string
  systemPrompt: string
  isMuted?: boolean
  onTranscript: (text: string, role: 'luma' | 'user') => void
  onAgentSpeaking?: () => void
  onAgentDoneSpeaking?: () => void
  onConnected: () => void
  onError: (err: string) => void
  disabled?: boolean
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
  const micCtxRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const ttsCtxRef = useRef<AudioContext | null>(null)
  const ttsStartTimeRef = useRef<number>(0)
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set())

  useEffect(() => {
    if (disabled) return

    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ?? ''
    if (!apiKey) {
      onError('Voice unavailable — Deepgram API key not configured. Using chat mode.')
      return
    }

    const ws = new WebSocket('wss://agent.deepgram.com/v1/agent/converse', ['token', apiKey])
    wsRef.current = ws
    ws.binaryType = 'arraybuffer'

    const ttsCtx = new AudioContext()
    ttsCtxRef.current = ttsCtx

    ws.addEventListener('open', () => {
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
            provider: { type: 'anthropic', model: 'claude-sonnet-4-6', temperature: 0.7 },
            prompt: systemPrompt,
          },
        },
      }
      ws.send(JSON.stringify(settings))

      navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      }).then(async (stream) => {
        if (ws.readyState !== WebSocket.OPEN) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        const micCtx = new AudioContext({ sampleRate: 16000 })
        micCtxRef.current = micCtx

        // Load AudioWorklet processor
        await micCtx.audioWorklet.addModule('/audio-capture-processor.js')

        const source = micCtx.createMediaStreamSource(stream)
        const workletNode = new AudioWorkletNode(micCtx, 'audio-capture-processor')
        workletNodeRef.current = workletNode

        // Receive int16 PCM from worklet thread, send to Deepgram
        workletNode.port.onmessage = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(e.data)
          }
        }

        source.connect(workletNode)
        // AudioWorkletNode doesn't need to connect to destination to process

        onConnected()
      }).catch((err) => {
        onError(err instanceof Error ? err.message : 'Microphone access denied')
      })
    })

    ws.addEventListener('message', (event) => {
      if (event.data instanceof ArrayBuffer) {
        playAudio(event.data)
        return
      }
      try {
        const payload = JSON.parse(event.data as string)
        if (payload.type === 'ConversationText') {
          onTranscript(payload.content, payload.role === 'agent' ? 'luma' : 'user')
        } else if (payload.type === 'AgentStartedSpeaking') {
          ttsStartTimeRef.current = 0
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

      workletNodeRef.current?.disconnect()
      workletNodeRef.current = null

      micCtxRef.current?.close()
      micCtxRef.current = null

      ttsCtxRef.current?.close()
      ttsCtxRef.current = null

      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, sessionId])

  // Mute/unmute by disabling mic stream tracks
  useEffect(() => {
    const stream = streamRef.current
    if (!stream) return

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted
    })
  }, [isMuted])

  return null
}
