'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { Code2, MessageSquareText, Mic2, PenTool, Play, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useReducedMotionSafe } from '@/hooks/useReducedMotionSafe'

const INTRO_AUDIO_SRC = '/landing-v3/live-interviews/hatch-welcome.mp3'
const INTRO_SESSION_KEY = 'v3LiveInterviewIntroPlayed'
const MUTED_KEY = 'hatch-sonics-muted'

const companies = [
  { name: 'Meta', src: '/landing-v3/logos/meta.svg', round: 'Product Sense' },
  { name: 'Google', src: '/landing-v3/logos/google.svg', round: 'Coding' },
  { name: 'Stripe', src: '/landing-v3/logos/stripe.svg', round: 'System Design' },
  { name: 'Airbnb', src: '/landing-v3/logos/airbnb.svg', round: 'Product Strategy' },
  { name: 'Uber', src: '/landing-v3/logos/uber.svg', round: 'Data Modeling' },
  { name: 'DoorDash', src: '/landing-v3/logos/doordash.svg', round: 'Execution' },
]

const modes = [
  { label: 'Chat', icon: MessageSquareText },
  { label: 'Voice', icon: Mic2 },
  { label: 'Coding', icon: Code2 },
  { label: 'Canvas', icon: PenTool },
]

const loopSteps = ['Company brief', 'Live round', 'Artifact work', 'Personalized feedback', 'Next step']

export function V3LiveInterviewSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isActiveRef = useRef(false)
  const [isActive, setIsActive] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [audioPlayed, setAudioPlayed] = useState(false)
  const shouldReduce = useReducedMotionSafe()

  const playIntro = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (typeof window === 'undefined') {
        return
      }

      if (!force) {
        if (audioPlayed || window.sessionStorage.getItem(INTRO_SESSION_KEY) === '1') {
          return
        }

        if (window.localStorage.getItem(MUTED_KEY) === '1') {
          setAudioBlocked(true)
          return
        }
      }

      try {
        const audio = audioRef.current ?? new Audio(INTRO_AUDIO_SRC)
        audioRef.current = audio
        audio.volume = 0.86
        audio.currentTime = 0
        await audio.play()
        window.sessionStorage.setItem(INTRO_SESSION_KEY, '1')
        setAudioPlayed(true)
        setAudioBlocked(false)
      } catch {
        setAudioBlocked(true)
      }
    },
    [audioPlayed],
  )

  const activateSection = useCallback(() => {
    isActiveRef.current = true
    setIsActive(true)

  }, [])

  useEffect(() => {
    const audio = new Audio(INTRO_AUDIO_SRC)
    audio.preload = 'auto'
    audioRef.current = audio

    if (window.sessionStorage.getItem(INTRO_SESSION_KEY) === '1') {
      setAudioPlayed(true)
    }

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const section = sectionRef.current

    if (!section) {
      return
    }

    if (!('IntersectionObserver' in window)) {
      activateSection()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nextActive = entry.isIntersecting
        isActiveRef.current = nextActive
        setIsActive(nextActive)


      },
      { threshold: 0.22 },
    )

    observer.observe(section)

    return () => observer.disconnect()
  }, [activateSection])

  useEffect(() => {
    let frame = 0

    const checkVisibility = () => {
      frame = 0

      const section = sectionRef.current

      if (!section) {
        return
      }

      const rect = section.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const visiblePixels = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0))
      const activationPixels = Math.min(320, rect.height * 0.18)

      if (visiblePixels >= activationPixels) {
        activateSection()
        return
      }

      isActiveRef.current = false
      setIsActive(false)
    }

    const scheduleCheck = () => {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(checkVisibility)
    }

    checkVisibility()
    window.addEventListener('scroll', scheduleCheck, { passive: true })
    window.addEventListener('resize', scheduleCheck)
    window.visualViewport?.addEventListener('resize', scheduleCheck)

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }

      window.removeEventListener('scroll', scheduleCheck)
      window.removeEventListener('resize', scheduleCheck)
      window.visualViewport?.removeEventListener('resize', scheduleCheck)
    }
  }, [activateSection])


  return (
    <section className="live-interview-section" id="live" ref={sectionRef} aria-labelledby="live-interview-heading">
      <div className="shell live-interview-shell">
        <motion.div
          animate={shouldReduce ? { opacity: 1, y: 0 } : isActive ? { opacity: 1, y: 0 } : { opacity: 0.82, y: 12 }}
          className="live-interview-copy"
          initial={shouldReduce ? false : { opacity: 0, y: 20 }}
          transition={{ duration: 0.62 }}
        >
          <h2 id="live-interview-heading">Live interviews with Hatch.</h2>
          <p>
            Voice, chat, code, and a shared canvas in one session, with feedback as you go.
          </p>

          <div className="live-company-panel" aria-label="Company interview sessions">
            {companies.map((company, index) => (
              <div className={`live-company-chip${index === 2 ? ' is-active' : ''}`} key={company.name}>
                <Image src={company.src} alt="" aria-hidden="true" width={26} height={26} />
                <span>
                  <strong>{company.name}</strong>
                  <small>{company.round}</small>
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          animate={shouldReduce ? { opacity: 1, y: 0 } : isActive ? { opacity: 1, y: 0 } : { opacity: 0.82, y: 12 }}
          className="live-cockpit"
          initial={shouldReduce ? false : { opacity: 0, y: 20 }}
          transition={{ duration: 0.72, delay: 0.08 }}
        >
          <div className="live-cockpit-topline">
            <div>
              <span>Round 2 of 5</span>
              <strong>Stripe system design interview</strong>
            </div>
            <div className="live-status-pill">
              <span aria-hidden="true" />
              Live with Hatch
            </div>
          </div>

          <div className="live-loop-rail" aria-label="Live interview progress">
            {loopSteps.map((step, index) => (
              <div className={`live-loop-step${index <= 2 ? ' is-complete' : ''}`} key={step}>
                <span>{index + 1}</span>
                {step}
              </div>
            ))}
          </div>

          <div className="live-session-grid">
            <div className="live-hatch-console">
              <div className="live-hatch-orb">
                <Image
                  src="/mascots/hatch/generated/interview-conversation-v1/speaking.webp"
                  alt="Hatch leading a live interview."
                  width={420}
                  height={420}
                  sizes="(max-width: 700px) 132px, 168px"
                  unoptimized
                />
              </div>

              <div className={`live-waveform${isActive ? ' is-active' : ''}`} aria-hidden="true">
                {Array.from({ length: 18 }, (_, index) => (
                  <span key={index} style={{ '--wave-index': index } as CSSProperties} />
                ))}
              </div>

              <div className="live-audio-row">
                <Sparkles aria-hidden="true" strokeWidth={2} />
                <span>{audioBlocked ? 'Audio unavailable. Try again.' : audioPlayed ? 'Intro played' : 'Preview Hatch’s voice'}</span>
                <button type="button" onClick={() => void playIntro({ force: true })}>
                    <Play aria-hidden="true" fill="currentColor" size={12} />
                    Play Hatch intro
                  </button>
              </div>
            </div>

            <div className="live-transcript" aria-label="Live interview transcript">
              <div className="live-message is-hatch">
                <span>Hatch</span>
                <p>Start with the tradeoff. What would you protect first in this payments flow?</p>
              </div>
              <div className="live-message is-candidate">
                <span>You</span>
                <p>I would preserve trust signals before optimizing conversion, then test the riskier paths.</p>
              </div>
              <div className="live-message is-hatch">
                <span>Hatch</span>
                <p>Good. Now defend the failure mode and sketch the recovery path.</p>
              </div>
            </div>
          </div>

          <div className="live-mode-row" aria-label="Interview modes">
            {modes.map((mode, index) => {
              const Icon = mode.icon

              return (
                <div className={`live-mode-chip${index === 1 ? ' is-active' : ''}`} key={mode.label}>
                  <Icon aria-hidden="true" strokeWidth={2} />
                  {mode.label}
                </div>
              )
            })}
          </div>

          <div className="live-artifact-grid">
            <div className="live-code-panel" aria-label="Coding interview surface">
              <div className="live-panel-header">
                <span>coding.py</span>
                <small>Hatch is watching complexity</small>
              </div>
              <pre>
                <code>{`def rank_candidates(events):
    trust = score_signal(events.checkout)
    speed = p95_latency(events.route)
    return blend(trust, speed, weight=0.72)`}</code>
              </pre>
            </div>

            <div className="live-canvas-panel" aria-label="Canvas interview surface">
              <div className="live-panel-header">
                <span>canvas</span>
                <small>Draw product and system flows</small>
              </div>
              <svg viewBox="0 0 420 230" role="img" aria-label="A sketched interview canvas with boxes and angled connectors">
                <path className="live-canvas-gridline" d="M26 46 H394 M26 100 H394 M26 154 H394 M78 24 V206 M184 24 V206 M290 24 V206" />
                <rect className="live-canvas-node is-primary" x="38" y="68" width="100" height="44" rx="12" />
                <rect className="live-canvas-node" x="166" y="36" width="96" height="44" rx="12" />
                <rect className="live-canvas-node" x="282" y="118" width="102" height="44" rx="12" />
                <path className="live-canvas-line" d="M138 90 L166 58 M262 58 L306 118" />
                <path className="live-canvas-pen" d="M68 174 C112 142 146 204 188 172 C226 142 248 192 286 164 C312 144 334 148 360 130" />
                <circle className="live-canvas-dot" cx="306" cy="118" r="5" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
