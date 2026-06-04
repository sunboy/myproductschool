'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { stripMarkdownForSpeech } from '@/lib/text/stripMarkdownForSpeech'

export interface DeepgramVoiceSessionHandle {
  injectAgentMessage: (content: string) => boolean
  injectUserMessage: (content: string) => boolean
}

interface DeepgramVoiceSessionProps {
  sessionId: string
  isMuted?: boolean
  onTranscript: (text: string, role: 'hatch' | 'user') => void
  onAgentSpeaking?: () => void
  onAgentDoneSpeaking?: () => void
  onConnected: () => void
  onError: (err: string) => void
  onAnalyserReady?: (analyser: AnalyserNode | null) => void
  disabled?: boolean
}

const TTS_SAMPLE_RATE = 16000
const TTS_PREBUFFER_SECONDS = 0.04
const TTS_FADE_SECONDS = 0.004
// Deepgram closes an idle agent socket if it sees no audio/keepalive for ~10s.
// Send a KeepAlive well inside that window so a thinking pause never drops voice.
const KEEPALIVE_INTERVAL_MS = 5000
// Silent auto-reconnect: how many times to transparently rebuild the socket on a
// benign drop before falling back to chat, and the backoff between attempts.
const MAX_RECONNECT_ATTEMPTS = 2
const RECONNECT_BACKOFF_MS = [400, 1200]

function canSend(ws: WebSocket | null): ws is WebSocket {
  return !!ws && ws.readyState === WebSocket.OPEN
}

const DeepgramVoiceSession = forwardRef<DeepgramVoiceSessionHandle, DeepgramVoiceSessionProps>(
  function DeepgramVoiceSession(props, ref): null {
    const {
      sessionId,
      isMuted,
      onTranscript,
      onAgentSpeaking,
      onAgentDoneSpeaking,
      onConnected,
      onError,
      onAnalyserReady,
      disabled,
    } = props

    const wsRef = useRef<WebSocket | null>(null)
    const micCtxRef = useRef<AudioContext | null>(null)
    const workletNodeRef = useRef<AudioWorkletNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const ttsCtxRef = useRef<AudioContext | null>(null)
    const ttsAnalyserRef = useRef<AnalyserNode | null>(null)
    const ttsStartTimeRef = useRef<number>(0)
    const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set())
    const suppressedAgentMessagesRef = useRef<string[]>([])
    const connectedRef = useRef(false)
    const hasReceivedTranscriptRef = useRef(false)
    const lastDeepgramEventRef = useRef<string>('none')
    const lastDeepgramErrorRef = useRef<unknown>(null)
    const lastDeepgramWarningRef = useRef<unknown>(null)
    const requestIdRef = useRef<string>('none')
    const callbackOriginRef = useRef<string>('none')
    const wsOpenedAtRef = useRef<number>(0)

    const sendJson = useCallback((payload: unknown) => {
      const ws = wsRef.current
      if (!canSend(ws)) return false
      ws.send(JSON.stringify(payload))
      return true
    }, [])

    const stopScheduledAudio = useCallback(() => {
      for (const source of scheduledSourcesRef.current) {
        try { source.stop() } catch { /* source may already be stopped */ }
      }
      scheduledSourcesRef.current.clear()
      const ctx = ttsCtxRef.current
      ttsStartTimeRef.current = ctx ? ctx.currentTime + TTS_PREBUFFER_SECONDS : 0
    }, [])

    useImperativeHandle(ref, () => ({
      injectAgentMessage(content: string) {
        const trimmed = content.trim()
        if (!trimmed) return false
        suppressedAgentMessagesRef.current.push(trimmed)
        if (suppressedAgentMessagesRef.current.length > 5) {
          suppressedAgentMessagesRef.current.shift()
        }
        // Strip markdown before sending to TTS so symbols like ** are not read aloud
        const ttsText = stripMarkdownForSpeech(trimmed)
        return sendJson({ type: 'InjectAgentMessage', message: ttsText })
      },
      injectUserMessage(content: string) {
        const trimmed = content.trim()
        if (!trimmed) return false
        return sendJson({ type: 'InjectUserMessage', content: trimmed })
      },
    }), [sendJson])

    useEffect(() => {
      if (disabled) return

      let intentionallyClosed = false
      let reconnectAttempts = 0
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null
      let keepAliveTimer: ReturnType<typeof setInterval> | null = null
      // Per-connection state. Reset on every (re)connect so a rebuilt socket
      // starts clean.
      let micStarted = false
      let settingsSent = false
      let settings: unknown = null
      let deepgramToken = ''

      const clearKeepAlive = () => {
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer)
          keepAliveTimer = null
        }
      }

      const startKeepAlive = () => {
        clearKeepAlive()
        keepAliveTimer = setInterval(() => {
          // Mic audio normally keeps the socket alive, but during a thinking pause
          // the mic is near-silent; a KeepAlive guarantees Deepgram won't time out.
          sendJson({ type: 'KeepAlive' })
        }, KEEPALIVE_INTERVAL_MS)
      }

      // Tear down the audio graph + socket for the current connection without
      // ending the whole session, so a reconnect can rebuild from scratch.
      const teardownConnection = () => {
        clearKeepAlive()
        stopScheduledAudio()

        const ws = wsRef.current
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
          try { ws.close() } catch { /* already closing */ }
        }
        wsRef.current = null

        workletNodeRef.current?.disconnect()
        workletNodeRef.current = null

        micCtxRef.current?.close().catch(() => {})
        micCtxRef.current = null

        onAnalyserReady?.(null)
        ttsAnalyserRef.current?.disconnect()
        ttsAnalyserRef.current = null
        ttsCtxRef.current?.close().catch(() => {})
        ttsCtxRef.current = null

        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      // Decide whether a close is benign-and-recoverable (reconnect) or terminal
      // (surface the chat fallback). Mirrors the close-handler classification.
      const handleRecoverableClose = () => {
        if (intentionallyClosed) return
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          if (connectedRef.current) onError('Voice connection closed. Using chat mode.')
          return
        }
        const backoff = RECONNECT_BACKOFF_MS[reconnectAttempts] ?? 1200
        reconnectAttempts += 1
        teardownConnection()
        reconnectTimer = setTimeout(() => {
          if (intentionallyClosed) return
          void startVoice()
        }, backoff)
      }

      const startMic = async () => {
        const ws = wsRef.current
        if (micStarted || intentionallyClosed || !canSend(ws)) return
        micStarted = true

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              sampleRate: TTS_SAMPLE_RATE,
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })

          if (intentionallyClosed || !canSend(wsRef.current)) {
            stream.getTracks().forEach((track) => track.stop())
            return
          }

          streamRef.current = stream

          const micCtx = new AudioContext({ sampleRate: TTS_SAMPLE_RATE, latencyHint: 'interactive' })
          micCtxRef.current = micCtx

          await micCtx.audioWorklet.addModule('/audio-capture-processor.js')

          const source = micCtx.createMediaStreamSource(stream)
          const workletNode = new AudioWorkletNode(micCtx, 'audio-capture-processor')
          workletNodeRef.current = workletNode

          workletNode.port.onmessage = (event) => {
            if (!canSend(wsRef.current)) return
            wsRef.current.send(event.data)
          }

          source.connect(workletNode)
          connectedRef.current = true
          onConnected()
        } catch (err) {
          onError(err instanceof Error ? err.message : 'Microphone access denied')
        }
      }

      const sendSettings = () => {
        const ws = wsRef.current
        if (settingsSent || !canSend(ws)) return
        if (!settings || typeof settings !== 'object') return
        settingsSent = true
        ws.send(JSON.stringify(settings))
      }

      function playAudio(data: ArrayBuffer) {
        const ctx = ttsCtxRef.current
        const analyserNode = ttsAnalyserRef.current
        if (!ctx || !analyserNode) return

        void ctx.resume().catch(() => {})

        const int16 = new Int16Array(data)
        if (int16.length === 0) return

        const buffer = ctx.createBuffer(1, int16.length, TTS_SAMPLE_RATE)
        const channelData = buffer.getChannelData(0)
        for (let i = 0; i < int16.length; i++) {
          channelData[i] = int16[i] / 32768
        }

        const source = ctx.createBufferSource()
        const gain = ctx.createGain()
        source.buffer = buffer
        source.connect(gain)
        gain.connect(analyserNode)

        const now = ctx.currentTime
        if (ttsStartTimeRef.current < now + TTS_PREBUFFER_SECONDS) {
          ttsStartTimeRef.current = now + TTS_PREBUFFER_SECONDS
        }

        const startAt = ttsStartTimeRef.current
        const endAt = startAt + buffer.duration
        const fade = Math.min(TTS_FADE_SECONDS, buffer.duration / 3)

        gain.gain.setValueAtTime(0.0001, startAt)
        gain.gain.linearRampToValueAtTime(1, startAt + fade)
        gain.gain.setValueAtTime(1, Math.max(startAt + fade, endAt - fade))
        gain.gain.linearRampToValueAtTime(0.0001, endAt)

        source.addEventListener('ended', () => {
          scheduledSourcesRef.current.delete(source)
          try { source.disconnect() } catch { /* already disconnected */ }
          try { gain.disconnect() } catch { /* already disconnected */ }
          if (scheduledSourcesRef.current.size === 0) {
            onAgentDoneSpeaking?.()
          }
        })

        source.start(startAt)
        ttsStartTimeRef.current = endAt
        scheduledSourcesRef.current.add(source)
      }

      const startVoice = async () => {
        // Reset per-connection state so a reconnect rebuilds cleanly.
        micStarted = false
        settingsSent = false
        settings = null
        deepgramToken = ''
        try {
          const settingsResponse = await fetch(`/api/live-interview/${sessionId}/voice-settings`)
          if (!settingsResponse.ok) {
            const body = await settingsResponse.json().catch(() => null) as { error?: unknown } | null
            onError(typeof body?.error === 'string' ? body.error : 'Voice mode is unavailable. Use chat mode.')
            return
          }

          const payload = await settingsResponse.json() as { deepgramToken?: unknown; settings?: unknown; requestId?: unknown; callbackOrigin?: unknown }
          settings = payload.settings ?? null
          deepgramToken = typeof payload.deepgramToken === 'string' ? payload.deepgramToken : ''
          requestIdRef.current = typeof payload.requestId === 'string' ? payload.requestId : 'none'
          callbackOriginRef.current = typeof payload.callbackOrigin === 'string' ? payload.callbackOrigin : 'none'
          if (!settings || typeof settings !== 'object' || !deepgramToken) {
            onError('Voice mode is unavailable. Use chat mode.')
            return
          }
          if (intentionallyClosed) return

          const ws = new WebSocket('wss://agent.deepgram.com/v1/agent/converse', ['bearer', deepgramToken])
          wsRef.current = ws
          ws.binaryType = 'arraybuffer'

          const ttsCtx = new AudioContext({ latencyHint: 'interactive' })
          ttsCtxRef.current = ttsCtx

          const analyser = ttsCtx.createAnalyser()
          analyser.fftSize = 512
          analyser.smoothingTimeConstant = 0.72
          analyser.connect(ttsCtx.destination)
          ttsAnalyserRef.current = analyser
          onAnalyserReady?.(analyser)

          ws.addEventListener('open', () => {
            wsOpenedAtRef.current = Date.now()
            void ttsCtx.resume().catch(() => {})
          })

          ws.addEventListener('message', (event) => {
            if (event.data instanceof ArrayBuffer) {
              playAudio(event.data)
              return
            }

            try {
              const payload = JSON.parse(event.data as string) as {
                type?: string
                content?: string
                role?: string
                description?: string
                message?: string
              }

              if (payload.type) lastDeepgramEventRef.current = payload.type

              if (payload.type === 'Welcome') {
                sendSettings()
                return
              }

              if (payload.type === 'SettingsApplied') {
                startKeepAlive()
                void startMic()
                return
              }

              if (payload.type === 'ConversationText' && payload.content) {
                hasReceivedTranscriptRef.current = true
                // A healthy turn flowed — reset the reconnect budget so a later
                // transient drop gets its full retry allowance again.
                reconnectAttempts = 0
                if (payload.role === 'agent') {
                  const idx = suppressedAgentMessagesRef.current.findIndex((msg) => msg === payload.content)
                  if (idx !== -1) {
                    suppressedAgentMessagesRef.current.splice(idx, 1)
                    return
                  }
                }
                onTranscript(payload.content, payload.role === 'agent' ? 'hatch' : 'user')
                return
              }

              if (payload.type === 'AgentThinking') {
                onAgentDoneSpeaking?.()
                return
              }

              if (payload.type === 'AgentStartedSpeaking') {
                ttsStartTimeRef.current = 0
                onAgentSpeaking?.()
                return
              }

              if (payload.type === 'AgentAudioDone') {
                if (scheduledSourcesRef.current.size === 0) onAgentDoneSpeaking?.()
                return
              }

              if (payload.type === 'UserStartedSpeaking') {
                stopScheduledAudio()
                onAgentDoneSpeaking?.()
                return
              }

              if (payload.type === 'InjectionRefused') return

              if (payload.type === 'Error') lastDeepgramErrorRef.current = payload
              if (payload.type === 'Warning') lastDeepgramWarningRef.current = payload
              if (payload.type === 'Error') {
                onError(payload.description ?? payload.message ?? 'Deepgram error')
              }
            } catch {
              // Ignore non-JSON messages.
            }
          })

          ws.addEventListener('error', () => {
            // A socket error is followed by a `close` event; let the close handler
            // own the reconnect/fallback decision so we don't double-fire.
          })

          ws.addEventListener('close', (event) => {
            // Diagnostic: capture everything needed to disambiguate why Deepgram closed the socket.
            // Correlate `requestId` with the prod [voice-think] branch logs and [voice-settings] line.
            console.log('[voice-ws-close]', JSON.stringify({
              requestId: requestIdRef.current,
              callbackOrigin: callbackOriginRef.current,
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
              connected: connectedRef.current,
              hasReceivedTranscript: hasReceivedTranscriptRef.current,
              lastDeepgramEvent: lastDeepgramEventRef.current,
              lastDeepgramError: lastDeepgramErrorRef.current,
              lastDeepgramWarning: lastDeepgramWarningRef.current,
              msSinceOpen: wsOpenedAtRef.current ? Date.now() - wsOpenedAtRef.current : null,
              intentional: intentionallyClosed,
            }))
            if (intentionallyClosed) return
            // Code 1000 after transcripts have flowed = natural session end (Deepgram closed its turn).
            // Surface the fallback only for abnormal closes or sessions that never produced a transcript.
            const isNormalClose = event.code === 1000
            const hadActivity = hasReceivedTranscriptRef.current
            if (isNormalClose && hadActivity) return
            // Abnormal close (or a session that never produced a transcript): try to
            // silently rebuild the socket before falling back to chat.
            handleRecoverableClose()
          })
        } catch {
          if (!intentionallyClosed) onError('Voice mode is unavailable. Use chat mode.')
        }
      }

      void startVoice()

      return () => {
        intentionallyClosed = true
        connectedRef.current = false
        hasReceivedTranscriptRef.current = false

        clearKeepAlive()
        if (reconnectTimer) {
          clearTimeout(reconnectTimer)
          reconnectTimer = null
        }

        stopScheduledAudio()

        const ws = wsRef.current
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
          ws.close()
        }
        wsRef.current = null

        workletNodeRef.current?.disconnect()
        workletNodeRef.current = null

        micCtxRef.current?.close().catch(() => {})
        micCtxRef.current = null

        onAnalyserReady?.(null)
        ttsAnalyserRef.current?.disconnect()
        ttsAnalyserRef.current = null
        ttsCtxRef.current?.close().catch(() => {})
        ttsCtxRef.current = null

        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [disabled, sessionId, stopScheduledAudio])

    useEffect(() => {
      const stream = streamRef.current
      if (!stream) return

      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted
      })
    }, [isMuted])

    return null
  }
)

DeepgramVoiceSession.displayName = 'DeepgramVoiceSession'

export default DeepgramVoiceSession
