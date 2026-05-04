'use client'

import { useCallback, useEffect, useState } from 'react'

export type HatchSound =
  | 'open'
  | 'close'
  | 'send'
  | 'reply'
  | 'draw'
  | 'nudge'
  | 'submit'
  | 'success'
  | 'error'

const STORAGE_KEY = 'hatch-sonics-muted'
const MUTED_EVENT = 'hatch-sonics-muted-change'

let audioContext: AudioContext | null = null

function getMutedPreference(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(STORAGE_KEY) === '1'
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtor = window.AudioContext ?? window.webkitAudioContext
  if (!AudioCtor) return null
  if (!audioContext) audioContext = new AudioCtor()
  return audioContext
}

function envelope(gain: GainNode, start: number, peak: number, duration: number) {
  gain.gain.cancelScheduledValues(start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
}

function tone(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  start: number,
  duration: number,
  gainValue: number,
  type: OscillatorType = 'sine',
  endFrequency?: number,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  if (endFrequency) {
    osc.frequency.exponentialRampToValueAtTime(endFrequency, start + duration)
  }
  envelope(gain, start, gainValue, duration)
  osc.connect(gain)
  gain.connect(destination)
  osc.start(start)
  osc.stop(start + duration + 0.03)
}

function noiseTap(ctx: AudioContext, destination: AudioNode, start: number, duration: number, gainValue: number) {
  const sampleRate = ctx.sampleRate
  const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2)
  }

  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(1800, start)
  filter.Q.setValueAtTime(4, start)
  envelope(gain, start, gainValue, duration)
  source.buffer = buffer
  source.connect(filter)
  filter.connect(gain)
  gain.connect(destination)
  source.start(start)
}

function makeDestination(ctx: AudioContext): { input: AudioNode; output: AudioNode } {
  const master = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  const compressor = ctx.createDynamicsCompressor()

  master.gain.value = 0.7
  filter.type = 'lowpass'
  filter.frequency.value = 4600
  filter.Q.value = 0.3
  compressor.threshold.value = -22
  compressor.knee.value = 20
  compressor.ratio.value = 5
  compressor.attack.value = 0.003
  compressor.release.value = 0.14

  master.connect(filter)
  filter.connect(compressor)
  compressor.connect(ctx.destination)
  return { input: master, output: compressor }
}

function playSound(sound: HatchSound) {
  if (getMutedPreference()) return
  const ctx = getContext()
  if (!ctx) return

  void ctx.resume().catch(() => {})

  const now = ctx.currentTime + 0.012
  const { input, output } = makeDestination(ctx)

  switch (sound) {
    case 'open':
      tone(ctx, input, 392, now, 0.13, 0.038, 'sine', 440)
      tone(ctx, input, 659, now + 0.055, 0.18, 0.034, 'triangle')
      break
    case 'close':
      tone(ctx, input, 494, now, 0.11, 0.025, 'sine', 392)
      break
    case 'send':
      tone(ctx, input, 523, now, 0.08, 0.028, 'triangle', 587)
      noiseTap(ctx, input, now, 0.055, 0.012)
      break
    case 'reply':
      tone(ctx, input, 392, now, 0.1, 0.025, 'sine')
      tone(ctx, input, 523, now + 0.045, 0.12, 0.027, 'sine')
      tone(ctx, input, 659, now + 0.09, 0.16, 0.025, 'triangle')
      break
    case 'draw':
      tone(ctx, input, 330, now, 0.09, 0.028, 'triangle', 392)
      tone(ctx, input, 494, now + 0.055, 0.12, 0.027, 'triangle', 659)
      noiseTap(ctx, input, now + 0.02, 0.08, 0.011)
      break
    case 'nudge':
      tone(ctx, input, 659, now, 0.09, 0.024, 'sine')
      tone(ctx, input, 784, now + 0.12, 0.12, 0.022, 'sine')
      break
    case 'submit':
      tone(ctx, input, 294, now, 0.09, 0.027, 'triangle')
      tone(ctx, input, 392, now + 0.045, 0.11, 0.029, 'triangle')
      tone(ctx, input, 587, now + 0.1, 0.18, 0.031, 'sine')
      break
    case 'success':
      tone(ctx, input, 392, now, 0.08, 0.025, 'sine')
      tone(ctx, input, 523, now + 0.06, 0.11, 0.027, 'sine')
      tone(ctx, input, 784, now + 0.13, 0.22, 0.032, 'triangle')
      break
    case 'error':
      tone(ctx, input, 220, now, 0.13, 0.025, 'sine', 196)
      tone(ctx, input, 165, now + 0.11, 0.16, 0.02, 'sine')
      break
  }

  window.setTimeout(() => {
    try { input.disconnect() } catch { /* already disconnected */ }
    try { output.disconnect() } catch { /* already disconnected */ }
  }, 900)
}

export function useHatchSonics() {
  const [muted, setMuted] = useState(getMutedPreference)

  useEffect(() => {
    const sync = () => setMuted(getMutedPreference())
    window.addEventListener('storage', sync)
    window.addEventListener(MUTED_EVENT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(MUTED_EVENT, sync)
    }
  }, [])

  const play = useCallback((sound: HatchSound) => {
    playSound(sound)
  }, [])

  const setSoundMuted = useCallback((nextMuted: boolean) => {
    window.localStorage.setItem(STORAGE_KEY, nextMuted ? '1' : '0')
    window.dispatchEvent(new Event(MUTED_EVENT))
    setMuted(nextMuted)
    if (!nextMuted) playSound('open')
  }, [])

  const toggleMuted = useCallback(() => {
    setSoundMuted(!getMutedPreference())
  }, [setSoundMuted])

  return {
    muted,
    play,
    setMuted: setSoundMuted,
    toggleMuted,
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
