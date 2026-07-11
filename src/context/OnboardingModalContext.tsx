'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSession } from '@/context/SessionContext'
import { getOnboardingState } from '@/lib/onboarding/state-client'

// ── Constants ──────────────────────────────────────────────────────────────────

const DISMISSED_KEY = 'onboarding-modal-dismissed'

// ── Types ──────────────────────────────────────────────────────────────────────

type ModalSource = 'auto' | 'hero' | 'settings'

interface OnboardingModalState {
  open: boolean
  hasMeaningfulProgress: boolean
  completed: boolean
  /** onboarding_value_first flag (src/lib/config/app-flags.ts), fetched once per session. */
  valueFirst: boolean
}

interface OnboardingModalContextValue extends OnboardingModalState {
  openModal: (source?: ModalSource) => void
  closeModal: () => void
  markCompleted: () => void
}

// ── Context ────────────────────────────────────────────────────────────────────

const OnboardingModalContext = createContext<OnboardingModalContextValue>({
  open: false,
  hasMeaningfulProgress: false,
  completed: false,
  valueFirst: false,
  openModal: () => {},
  closeModal: () => {},
  markCompleted: () => {},
})

// ── Provider ───────────────────────────────────────────────────────────────────

export function OnboardingModalProvider({ children }: { children: ReactNode }) {
  const { profile } = useSession()

  const [open, setOpen] = useState(false)
  const [hasMeaningfulProgress, setHasMeaningfulProgress] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [valueFirst, setValueFirst] = useState(false)

  // Track whether we've done the one-time mount check so we don't re-run
  const mounted = useRef(false)

  // Fetch the flag once per session, same pattern as usePlanLimits. Fails
  // safe to false (current byte-for-byte behavior) on any error.
  useEffect(() => {
    let active = true
    fetch('/api/config/flags')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (active && data?.onboarding_value_first) setValueFirst(true)
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  // ── Mount effect: auto-launch logic ──────────────────────────────────────
  useEffect(() => {
    // Wait for the profile to load before deciding
    if (profile === null) return
    // Already ran
    if (mounted.current) return
    mounted.current = true

    // Already calibrated — nothing to do
    if (profile.onboarding_completed_at) {
      setCompleted(true)
      return
    }

    // Fetch server-side onboarding state once to check meaningful progress.
    // This feeds a dismissible "resume calibration" CTA — it NO LONGER
    // auto-launches the 12-screen CalibrationFlow. The old auto-open on
    // /dashboard was the onboarding re-wall: a signed-up user who completed the
    // one-tap first-run path (which sets onboarding_completed_at) skips this
    // entirely, but anyone who bounced before that got the full calibration
    // shoved in front of the dashboard as an interstitial. Calibration is now
    // strictly opt-in — reachable only through the explicit
    // 'open-onboarding-modal' event (TopNav / an optional dashboard CTA) below.
    getOnboardingState()
      .then(state => {
        if (!state) return
        const data = state.data as Record<string, unknown> | undefined
        // Meaningful = they got past the intro screen
        const screen = typeof data?.screen === 'string' ? data.screen : 'intro'
        const meaningful = screen !== 'intro' && screen !== 'results'
        setHasMeaningfulProgress(meaningful)
      })
      .catch(() => {})
  }, [profile])

  // ── Window event listener: mirror open-upgrade-modal pattern ─────────────
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-onboarding-modal', handler)
    return () => window.removeEventListener('open-onboarding-modal', handler)
  }, [])

  // ── Methods ───────────────────────────────────────────────────────────────

  const openModal = useCallback((_source?: ModalSource) => {
    setOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(DISMISSED_KEY, '1')
    }
  }, [])

  const markCompleted = useCallback(() => {
    setCompleted(true)
    setOpen(false)
    // Fire profile-stats-updated so SessionContext.refresh re-reads
    // onboarding_completed_at and flips the dashboard to State A.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('profile-stats-updated'))
    }
  }, [])

  return (
    <OnboardingModalContext.Provider
      value={{ open, hasMeaningfulProgress, completed, valueFirst, openModal, closeModal, markCompleted }}
    >
      {children}
    </OnboardingModalContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useOnboardingModal(): OnboardingModalContextValue {
  return useContext(OnboardingModalContext)
}
