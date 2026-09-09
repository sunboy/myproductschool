'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { stripMarkdownForSpeech } from '@/lib/text/stripMarkdownForSpeech'
import {
  stopAndDrainAudioSources,
  voiceCloseAction,
} from '@/lib/live-interview/audio-lifecycle'

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
  /** deviceId chosen in the mic pre-flight; passed as { ideal } constraint so the live session uses the same device. */
  preferredDeviceId?: string
}

const TTS_SAMPLE_RATE = 16000
// Jitter buffer: how far ahead of the clock the first chunk of an utterance
// is scheduled. 40ms proved too thin in the field: any network jitter made
// chunks arrive after their slot, forcing a re-anchor (an audible gap plus
// fade-in) mid-utterance, which users heard as crackle. 150ms costs a hair
// of initial latency and absorbs normal jitter so utterances play through
// gaplessly.
const TTS_PREBUFFER_SECONDS = 0.15
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

// Echo-match tuning. Only utterances at least this many normalized chars are
// considered for echo suppression (short lines are too collision-prone to buffer),
// and a containment match must cover at least this fraction of the longer string to
// count as a near-complete echo rather than an incidental substring overlap.
const ECHO_MIN_LEN = 12
const ECHO_LEN_RATIO = 0.8

// Normalizes transcript text for acoustic-echo matching: lowercased, punctuation
// stripped, whitespace collapsed. Deepgram's STT of Hatch's own TTS rarely comes
// back byte-identical (casing/punctuation differ), so exact matching misses echoes.
// We compare on this normalized form and require a solid length so short filler
// ("yeah", "okay") a user genuinely says isn't suppressed.
function normalizeForEcho(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
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
      preferredDeviceId,
    } = props

    const wsRef = useRef<WebSocket | null>(null)
    const micCtxRef = useRef<AudioContext | null>(null)
    const workletNodeRef = useRef<AudioWorkletNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const ttsCtxRef = useRef<AudioContext | null>(null)
    const ttsAnalyserRef = useRef<AnalyserNode | null>(null)
    const ttsStartTimeRef = useRef<number>(0)
    const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set())
    // Normalized text of recent Hatch utterances (injected messages AND the voice
    // agent's own turns). Used to drop acoustic echoes that the mic captures when
    // Hatch's TTS plays through the speakers — those come back as ConversationText
    // with role 'user', so we suppress on content, not role.
    const suppressedAgentMessagesRef = useRef<string[]>([])
    const connectedRef = useRef(false)
    const hasReceivedTranscriptRef = useRef(false)
    const lastDeepgramEventRef = useRef<string>('none')
    const lastDeepgramErrorRef = useRef<unknown>(null)
    const lastDeepgramWarningRef = useRef<unknown>(null)
    const requestIdRef = useRef<string>('none')
    const callbackOriginRef = useRef<string>('none')
    const wsOpenedAtRef = useRef<number>(0)
    const isMutedRef = useRef(Boolean(isMuted))

    const sendJson = useCallback((payload: unknown) => {
      const ws = wsRef.current
      if (!canSend(ws)) return false
      ws.send(JSON.stringify(payload))
      return true
    }, [])

    const stopScheduledAudio = useCallback(() => {
      stopAndDrainAudioSources(scheduledSourcesRef.current)
      const ctx = ttsCtxRef.current
      ttsStartTimeRef.current = ctx ? ctx.currentTime + TTS_PREBUFFER_SECONDS : 0
    }, [])

    // Record that Hatch just said something, so any near-identical transcript that
    // comes back from the mic (an echo of Hatch's own TTS) can be dropped. Only buffer
    // reasonably long utterances: a short Hatch line ("what metric?") must NOT be able
    // to swallow a long user turn that happens to contain those words.
    const rememberAgentUtterance = useCallback((text: string) => {
      const norm = normalizeForEcho(text)
      if (norm.length < ECHO_MIN_LEN) return
      const buf = suppressedAgentMessagesRef.current
      buf.push(norm)
      if (buf.length > 8) buf.shift()
    }, [])

    // True when an incoming transcript is a near-complete echo of a recent Hatch
    // utterance (the mic capturing Hatch's TTS). We require NEAR-EQUALITY, not mere
    // substring overlap: an echo transcribes almost the whole line, so the two must be
    // close in length. This is deliberately conservative — dropping a real user turn is
    // worse than letting a rare echo through (the server guard is the backstop), and a
    // user quoting a fragment of what Hatch said must never be suppressed. Consumes the
    // match so a genuine later repeat isn't over-suppressed.
    const isEchoOfAgent = useCallback((content: string): boolean => {
      const norm = normalizeForEcho(content)
      if (norm.length < ECHO_MIN_LEN) return false
      const buf = suppressedAgentMessagesRef.current
      const idx = buf.findIndex((msg) => {
        if (msg === norm) return true
        // Containment only counts as an echo when the two are close in length, so a
        // short buffered line can't match a much longer user turn and vice versa.
        const [shorter, longer] = msg.length <= norm.length ? [msg, norm] : [norm, msg]
        return longer.includes(shorter) && shorter.length / longer.length >= ECHO_LEN_RATIO
      })
      if (idx === -1) return false
      buf.splice(idx, 1)
      return true
    }, [])

    useImperativeHandle(ref, () => ({
      injectAgentMessage(content: string) {
        const trimmed = content.trim()
        if (!trimmed) return false
        rememberAgentUtterance(trimmed)
        // Strip markdown before sending to TTS so symbols like ** are not read aloud
        const ttsText = stripMarkdownForSpeech(trimmed)
        return sendJson({ type: 'InjectAgentMessage', message: ttsText })
      },
      injectUserMessage(content: string) {
        const trimmed = content.trim()
        if (!trimmed) return false
        return sendJson({ type: 'InjectUserMessage', content: trimmed })
      },
    }), [sendJson, rememberAgentUtterance])

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
        // Drop buffered agent utterances: on a silent reconnect they'd otherwise be
        // stale and could suppress the first real user turn after reconnecting.
        suppressedAgentMessagesRef.current.length = 0

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
      const handleRecoverableClose = (closedSocket: WebSocket) => {
        const action = voiceCloseAction({
          intentionallyClosed,
          isCurrentSocket: wsRef.current === closedSocket,
          reconnectAttempts,
          maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
        })
        if (action === 'ignore') return
        if (action === 'fallback') {
          teardownConnection()
          onError('Voice connection closed. Using chat mode.')
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
          const audioConstraints: MediaTrackConstraints = {
            sampleRate: TTS_SAMPLE_RATE,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
          if (preferredDeviceId) {
            audioConstraints.deviceId = { ideal: preferredDeviceId }
          }
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
          })

          if (intentionallyClosed || wsRef.current !== ws || !canSend(wsRef.current)) {
            stream.getTracks().forEach((track) => track.stop())
            return
          }

          stream.getAudioTracks().forEach((track) => {
            track.enabled = !isMutedRef.current
          })
          streamRef.current = stream

          const micCtx = new AudioContext({ sampleRate: TTS_SAMPLE_RATE, latencyHint: 'interactive' })
          micCtxRef.current = micCtx

          await micCtx.audioWorklet.addModule('/audio-capture-processor.js')

          // addModule can outlive a socket close, fallback, or navigation. Do not
          // attach its stale graph to a newer connection after that async boundary.
          if (
            intentionallyClosed ||
            wsRef.current !== ws ||
            micCtxRef.current !== micCtx ||
            streamRef.current !== stream ||
            !canSend(wsRef.current)
          ) {
            stream.getTracks().forEach((track) => track.stop())
            if (micCtxRef.current === micCtx) {
              micCtxRef.current = null
              void micCtx.close().catch(() => {})
            }
            if (streamRef.current === stream) streamRef.current = null
            return
          }

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
          if (!intentionallyClosed && wsRef.current === ws) {
            teardownConnection()
            onError(err instanceof Error ? err.message : 'Microphone access denied')
          }
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
        // First chunk of a new utterance (ttsStartTime reset to 0 on
        // AgentStartedSpeaking, or we've fallen behind): prebuffer and apply a
        // tiny fade-in to avoid an initial click. Subsequent chunks play
        // gaplessly at flat gain — fading each chunk to silence at its seam is
        // what caused the crackle between contiguous chunks of one utterance.
        const isUtteranceStart = ttsStartTimeRef.current < now + TTS_PREBUFFER_SECONDS
        if (isUtteranceStart) {
          ttsStartTimeRef.current = now + TTS_PREBUFFER_SECONDS
        }

        const startAt = ttsStartTimeRef.current
        const endAt = startAt + buffer.duration

        if (isUtteranceStart) {
          const fade = Math.min(TTS_FADE_SECONDS, buffer.duration / 3)
          gain.gain.setValueAtTime(0.0001, startAt)
          gain.gain.linearRampToValueAtTime(1, startAt + fade)
        } else {
          gain.gain.setValueAtTime(1, startAt)
        }

        source.addEventListener('ended', () => {
          const wasScheduled = scheduledSourcesRef.current.delete(source)
          try { source.disconnect() } catch { /* already disconnected */ }
          try { gain.disconnect() } catch { /* already disconnected */ }
          if (wasScheduled && scheduledSourcesRef.current.size === 0) {
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
            if (!intentionallyClosed) {
              onError(typeof body?.error === 'string' ? body.error : 'Voice mode is unavailable. Use chat mode.')
            }
            return
          }

          const payload = await settingsResponse.json() as { deepgramToken?: unknown; settings?: unknown; requestId?: unknown; callbackOrigin?: unknown }
          settings = payload.settings ?? null
          deepgramToken = typeof payload.deepgramToken === 'string' ? payload.deepgramToken : ''
          requestIdRef.current = typeof payload.requestId === 'string' ? payload.requestId : 'none'
          callbackOriginRef.current = typeof payload.callbackOrigin === 'string' ? payload.callbackOrigin : 'none'
          if (intentionallyClosed) return
          if (!settings || typeof settings !== 'object' || !deepgramToken) {
            onError('Voice mode is unavailable. Use chat mode.')
            return
          }

          const ws = new WebSocket('wss://agent.deepgram.com/v1/agent/converse', ['bearer', deepgramToken])
          wsRef.current = ws
          ws.binaryType = 'arraybuffer'

          // Match Deepgram's 16 kHz PCM output so the browser doesn't resample
          // every buffer (resampling at chunk boundaries adds clicks/crackle).
          const ttsCtx = new AudioContext({ sampleRate: TTS_SAMPLE_RATE, latencyHint: 'interactive' })
          ttsCtxRef.current = ttsCtx

          const analyser = ttsCtx.createAnalyser()
          analyser.fftSize = 512
          analyser.smoothingTimeConstant = 0.72
          analyser.connect(ttsCtx.destination)
          ttsAnalyserRef.current = analyser
          onAnalyserReady?.(analyser)

          ws.addEventListener('open', () => {
            if (intentionallyClosed || wsRef.current !== ws) return
            wsOpenedAtRef.current = Date.now()
            void ttsCtx.resume().catch(() => {})
          })

          ws.addEventListener('message', (event) => {
            if (intentionallyClosed || wsRef.current !== ws) return
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
                  // Hatch spoke. Record it so the acoustic echo of this line (which
                  // returns as role 'user') can be dropped, then emit as a hatch turn.
                  rememberAgentUtterance(payload.content)
                  onTranscript(payload.content, 'hatch')
                  return
                }
                // Not an agent turn. If it matches something Hatch just said, it's the
                // mic picking up Hatch's TTS through the speakers — drop it instead of
                // persisting Hatch's words as the user's (the greeting-echo / paywall-
                // in-transcript corruption). echoCancellation alone doesn't catch this.
                if (isEchoOfAgent(payload.content)) return
                onTranscript(payload.content, 'user')
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
                intentionallyClosed = true
                teardownConnection()
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
            // Any provider-initiated close leaves the application session active.
            // Rebuild it, then fall back to chat if the retry budget is exhausted.
            handleRecoverableClose(ws)
          })
        } catch {
          if (!intentionallyClosed) {
            teardownConnection()
            onError('Voice mode is unavailable. Use chat mode.')
          }
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
    }, [disabled, sessionId, stopScheduledAudio, preferredDeviceId])

    useEffect(() => {
      isMutedRef.current = Boolean(isMuted)
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
