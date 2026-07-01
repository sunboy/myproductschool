'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useReducedMotionSafe } from '@/hooks/useReducedMotionSafe'

const callouts = [
  {
    className: 'callout-trained',
    label: 'Trained on interviews',
    text: 'Rubrics, loops, and real practice patterns shape every nudge.',
  },
  {
    className: 'callout-native',
    label: 'AI native',
    text: 'Hatch reads the rep, not just the answer key.',
  },
  {
    className: 'callout-calibrated',
    label: 'Calibrated coaching',
    text: 'Feedback lands where the next attempt can use it.',
  },
]

export function V3HatchReveal() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const shouldReduce = useReducedMotionSafe()
  const scrollProgress = useMotionValue(0)

  useEffect(() => {
    let frame = 0

    const updateProgress = () => {
      frame = 0
      const section = sectionRef.current

      if (!section) {
        return
      }

      const sectionTop = section.getBoundingClientRect().top + window.scrollY
      const travel = Math.max(1, section.offsetHeight - window.innerHeight)
      const nextProgress = (window.scrollY - sectionTop) / travel

      scrollProgress.set(Math.min(1, Math.max(0, nextProgress)))
    }

    const scheduleUpdate = () => {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(updateProgress)
    }

    updateProgress()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    window.visualViewport?.addEventListener('resize', scheduleUpdate)

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }

      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      window.visualViewport?.removeEventListener('resize', scheduleUpdate)
    }
  }, [scrollProgress])

  const capX = useTransform(scrollProgress, [0.02, 0.24], [-170, 0])
  const capY = useTransform(scrollProgress, [0.02, 0.24], [-230, -92])
  const capScale = useTransform(scrollProgress, [0.02, 0.24, 0.38], [1.06, 1, 0.98])
  const capRotate = useTransform(scrollProgress, [0.02, 0.24], [-11, 0])
  const capOpacity = useTransform(scrollProgress, [0.02, 0.28, 0.38], [1, 1, 0])
  const bodyOpacity = useTransform(scrollProgress, [0.24, 0.46], [0, 1])
  const bodyY = useTransform(scrollProgress, [0.24, 0.48], [92, 0])
  const bodyClip = useTransform(scrollProgress, [0.24, 0.5], ['inset(74% 0 0 0)', 'inset(0% 0 0 0)'])
  const haloOpacity = useTransform(scrollProgress, [0.12, 0.48], [0.16, 1])
  const trainedOpacity = useTransform(scrollProgress, [0.36, 0.52], [0, 1])
  const nativeOpacity = useTransform(scrollProgress, [0.44, 0.6], [0, 1])
  const calibratedOpacity = useTransform(scrollProgress, [0.52, 0.68], [0, 1])
  const connectorOpacity = useTransform(scrollProgress, [0.42, 0.68], [0, 1])
  const labelY = useTransform(scrollProgress, [0.42, 0.68], [22, 0])

  return (
    <section className="hatch-reveal-section" id="hatch" ref={sectionRef} aria-labelledby="hatch-reveal-heading">
      <div className="hatch-reveal-sticky">
        <div className="shell hatch-reveal-shell">
          <div className="hatch-reveal-copy">
            <h2 id="hatch-reveal-heading">Hatch grades every rep and names the gap.</h2>
            <p>It scores every answer live and tells you what to fix next.</p>
          </div>

          <div className="hatch-stage" aria-label="Scroll animation introducing Hatch">
            <motion.div className="hatch-stage-halo" style={shouldReduce ? { opacity: 1 } : { opacity: haloOpacity }} />

            <motion.div
              className="hatch-body-layer"
              style={shouldReduce ? { opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)' } : { opacity: bodyOpacity, y: bodyY, clipPath: bodyClip }}
            >
              <Image
                src="/landing-v3/section-2/hatch-coach-cutout.png"
                alt="Hatch, the HackProduct mascot."
                width={1254}
                height={1254}
                priority={false}
                sizes="(max-width: 700px) 72vw, 430px"
              />
            </motion.div>

            <div className="hatch-cap-origin" aria-hidden="true">
              <motion.div
                className="hatch-cap-layer"
                style={shouldReduce ? { x: 0, y: -178, scale: 0.98, rotate: 0, opacity: 0 } : { x: capX, y: capY, scale: capScale, rotate: capRotate, opacity: capOpacity }}
              >
                <Image
                  src="/landing-v3/section-2/hatch-cap-cutout.png"
                  alt=""
                  width={612}
                  height={202}
                  sizes="220px"
                />
              </motion.div>
            </div>

            <motion.svg
              className="hatch-connector-layer"
              viewBox="0 0 1000 680"
              aria-hidden="true"
              focusable="false"
              preserveAspectRatio="none"
              style={shouldReduce ? { opacity: 1 } : { opacity: connectorOpacity }}
            >
              <path className="hatch-connector-line" d="M70 156 H462 L494 224" />
              <path className="hatch-connector-line" d="M930 156 H542 L636 218" />
              <path className="hatch-connector-line" d="M14 536 H382 L492 462" />
              <circle className="hatch-connector-dot" cx="494" cy="224" r="5" />
              <circle className="hatch-connector-dot" cx="636" cy="218" r="5" />
              <circle className="hatch-connector-dot" cx="492" cy="462" r="5" />
            </motion.svg>

            {callouts.map((callout, index) => {
              const opacity = index === 0 ? trainedOpacity : index === 1 ? nativeOpacity : calibratedOpacity
              return (
                <motion.div
                  className={`hatch-callout ${callout.className}`}
                  key={callout.label}
                  style={shouldReduce ? { opacity: 1, y: 0 } : { opacity, y: labelY }}
                >
                  <span>{callout.label}</span>
                  <p>{callout.text}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
