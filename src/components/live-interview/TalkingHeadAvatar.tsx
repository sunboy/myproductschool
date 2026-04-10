'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { LumaAvatarState } from './LumaAvatar'

// TalkingHead is loaded as a native ES module from /public to avoid
// Turbopack choking on its dynamic import() for lip-sync modules.
// three.js is resolved via esm.sh CDN (patched in the .mjs files).

/* eslint-disable @typescript-eslint/no-explicit-any */
type TalkingHeadInstance = any

export interface TalkingHeadHandle {
  setAnalyser: (analyser: AnalyserNode | null) => void
}

interface TalkingHeadAvatarProps {
  lumaState?: LumaAvatarState
  avatarUrl?: string
  className?: string
  onError?: (err: string) => void
  onReady?: () => void
}

const DEFAULT_AVATAR_URL = '/luma-interviewer.glb'

const STATE_TO_MOOD: Record<string, string> = {
  idle: 'neutral',
  listening: 'neutral',
  speaking: 'neutral',
  thinking: 'neutral',
  intrigued: 'happy',
  challenging: 'angry',
  delighted: 'happy',
  celebrating: 'happy',
  reviewing: 'neutral',
}

/** Load TalkingHead class from /public as native ES module (bypasses bundler). */
async function loadTalkingHead(): Promise<any> {
  const url = new URL('/talkinghead/talkinghead.mjs', window.location.origin).href
  const module = await import(/* webpackIgnore: true */ url)
  return module.TalkingHead
}

// Walk the avatar's three.js scene graph and apply a morph target influence
// to every mesh that has it. Ready Player Me avatars expose ARKit blendshapes
// like `jawOpen`, `mouthOpen`, `viseme_aa`, etc.
function applyMorph(scene: any, morphName: string, value: number) {
  if (!scene) return
  scene.traverse((obj: any) => {
    if (obj.isMesh && obj.morphTargetDictionary && obj.morphTargetInfluences) {
      const idx = obj.morphTargetDictionary[morphName]
      if (idx !== undefined) {
        obj.morphTargetInfluences[idx] = value
      }
    }
  })
}

const TalkingHeadAvatar = forwardRef<TalkingHeadHandle, TalkingHeadAvatarProps>(
  function TalkingHeadAvatar({ lumaState = 'idle', avatarUrl, className, onError, onReady }, ref) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const headRef = useRef<TalkingHeadInstance | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const rafRef = useRef<number | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const wrapper = wrapperRef.current
      if (!wrapper) return

      // Dedicated div for TalkingHead (outside React's DOM tree) to avoid
      // conflicts when React unmounts and TalkingHead has mutated the DOM.
      const container = document.createElement('div')
      container.style.cssText = 'width:100%;height:100%;position:absolute;inset:0'
      wrapper.appendChild(container)

      let cancelled = false

      async function init() {
        try {
          const TalkingHead = await loadTalkingHead()
          if (cancelled) return

          const head = new TalkingHead(container, {
            ttsEndpoint: null,
            lipsyncModules: ['en'],
            cameraView: 'upper',
            modelFPS: 30,
          })

          await head.showAvatar({
            url: avatarUrl ?? DEFAULT_AVATAR_URL,
            body: 'F',
            lipsyncLang: 'en',
            avatarMood: 'neutral',
          })

          if (cancelled) {
            container.remove()
            return
          }

          headRef.current = head
          setLoading(false)
          onReady?.()

          // Start the amplitude-driven jaw animation loop
          const freqData = new Uint8Array(256)
          let currentJaw = 0
          const tick = () => {
            rafRef.current = requestAnimationFrame(tick)
            const analyser = analyserRef.current
            const scene = head.armature?.parent ?? head.scene
            if (!analyser || !scene) {
              if (currentJaw > 0.01) {
                currentJaw *= 0.8
                applyMorph(scene, 'jawOpen', currentJaw)
                applyMorph(scene, 'mouthOpen', currentJaw * 0.6)
              }
              return
            }
            analyser.getByteFrequencyData(freqData)
            // Focus on speech band (roughly bins 1..40 for mid-low frequencies)
            let sum = 0
            for (let i = 1; i < 40; i++) sum += freqData[i]
            const avg = sum / 39 / 255 // 0..1
            // Non-linear mapping so quiet parts stay closed, loud parts open wider
            const target = Math.min(1, Math.pow(avg * 2.5, 1.3))
            // Smooth toward target
            currentJaw += (target - currentJaw) * 0.5
            applyMorph(scene, 'jawOpen', currentJaw * 0.55)
            applyMorph(scene, 'mouthOpen', currentJaw * 0.4)
            applyMorph(scene, 'viseme_aa', currentJaw * 0.3)
          }
          tick()
        } catch (err) {
          if (!cancelled) {
            onError?.(err instanceof Error ? err.message : 'Failed to load avatar')
          }
        }
      }

      init()

      return () => {
        cancelled = true
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        const head = headRef.current
        if (head) {
          try { head.audioCtx?.close() } catch { /* ignore */ }
        }
        headRef.current = null
        analyserRef.current = null
        container.remove()
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [avatarUrl])

    // Sync lumaState -> mood
    useEffect(() => {
      const head = headRef.current
      if (!head) return
      const mood = STATE_TO_MOOD[lumaState] ?? 'neutral'
      head.setMood(mood)
    }, [lumaState])

    useImperativeHandle(ref, () => ({
      setAnalyser(analyser) {
        analyserRef.current = analyser
      },
    }), [])

    return (
      <div ref={wrapperRef} className={`w-full h-full relative ${className ?? ''}`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container/50 z-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
          </div>
        )}
      </div>
    )
  }
)

export default TalkingHeadAvatar
