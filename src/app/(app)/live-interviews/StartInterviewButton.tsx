'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { InterviewPaywallGate } from '@/components/paywalls/InterviewPaywallGate'
import { useIsAtLimit, useUsage } from '@/context/UsageContext'
import { useUpgrade } from '@/hooks/useUpgrade'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface StartInterviewButtonProps {
  companyId: string
  roleId: string
  challengeId?: string
  companyName?: string
}

export default function StartInterviewButton({ companyId, roleId, challengeId, companyName }: StartInterviewButtonProps) {
  const router = useRouter()
  const { startUpgrade } = useUpgrade()
  const [loading, setLoading] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallData, setPaywallData] = useState<{ used: number; limit: number } | null>(null)
  const [showReadyModal, setShowReadyModal] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [modalCompany, setModalCompany] = useState(companyName ?? '')
  const [modalRole, setModalRole] = useState(roleId)
  const isAtLimit = useIsAtLimit('interviews')
  const usage = useUsage()

  async function handleClick() {
    if (isAtLimit) {
      setPaywallData({ used: usage.interviews.used, limit: usage.interviews.limit })
      setShowPaywall(true)
      return
    }

    setLoading(true)
    setSessionError(null)
    try {
      const res = await fetch('/api/live-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, roleId, challengeId }),
      })

      if (res.status === 402) {
        const data = await res.json()
        setPaywallData({ used: data.used, limit: data.limit })
        setShowPaywall(true)
        setLoading(false)
        return
      }

      if (!res.ok) throw new Error('Failed to start interview')
      const data = await res.json()
      setSessionId(data.sessionId)
      // Stash systemPrompt so the interview page can read it in autostart mode
      if (data.sessionId && data.systemPrompt) {
        sessionStorage.setItem(`luma_prompt_${data.sessionId}`, data.systemPrompt)
      }
      // Cache company/role for modal display and URL params
      if (data.companyName) setModalCompany(data.companyName)
      if (data.role) setModalRole(data.role)
      setShowReadyModal(true)
    } catch {
      setSessionError('Failed to start — please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleStartInterview() {
    if (!sessionId) return
    const params = new URLSearchParams({ autostart: '1' })
    if (modalCompany) params.set('company', modalCompany)
    if (modalRole) params.set('role', modalRole)
    router.push(`/live-interviews/${sessionId}?${params.toString()}`)
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-1 bg-primary text-on-primary rounded-full px-3 py-1 text-xs font-label font-semibold transition-opacity',
          loading && 'opacity-60 cursor-not-allowed',
          isAtLimit && 'bg-surface-container-high text-on-surface-variant'
        )}
      >
        {isAtLimit ? (
          <>
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Upgrade
          </>
        ) : loading ? 'Starting…' : 'Start Interview →'}
      </button>

      {/* Ready modal — overlays the list page */}
      {showReadyModal && sessionId && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 200 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowReadyModal(false) }}
        >
          <div
            className="relative flex flex-col items-center gap-5 text-center mx-4 w-full"
            style={{
              maxWidth: 420,
              background: '#1a2420',
              borderRadius: 20,
              padding: '32px 32px 28px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              animation: 'readyModalIn 0.25s ease-out',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setShowReadyModal(false)}
              className="absolute top-4 right-4 flex items-center justify-center rounded-full transition-colors"
              style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.07)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)' }}
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ color: 'rgba(255,255,255,0.5)' }}>close</span>
            </button>

            <LumaGlyph size={64} state="idle" className="text-primary" />

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {modalCompany && (
                <span
                  className="rounded-full px-3 py-1 font-label text-xs font-semibold"
                  style={{ background: 'rgba(74,124,89,0.2)', color: 'rgba(126,224,153,0.85)' }}
                >
                  {modalCompany}
                </span>
              )}
              <span className="font-label text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {modalRole} Round
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="font-headline text-xl font-bold" style={{ color: 'rgba(243,237,224,0.95)' }}>
                Ready to begin?
              </h2>
              <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Luma will play the role of your interviewer. Speak naturally — your microphone
                activates when you start. Cover all four FLOW moves: Frame, List, Optimize, Win.
              </p>
            </div>

            {sessionError && (
              <div
                className="rounded-lg px-4 py-2 w-full"
                style={{ background: 'rgba(178,58,42,0.15)', border: '1px solid rgba(178,58,42,0.3)' }}
              >
                <p className="font-body text-sm" style={{ color: '#e37d4a' }}>{sessionError}</p>
              </div>
            )}

            {/* Mic notice */}
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2 w-full"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ color: 'rgba(255,255,255,0.3)' }}>mic</span>
              <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Your browser will request microphone access when you start.
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full pt-1">
              <button
                onClick={handleStartInterview}
                className="w-full rounded-full py-3 font-label font-semibold text-base transition-opacity hover:opacity-90"
                style={{ background: '#4a7c59', color: '#ffffff' }}
              >
                Start Interview
              </button>
              <button
                onClick={() => setShowReadyModal(false)}
                className="w-full rounded-full py-2.5 font-label text-sm font-semibold transition-colors"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                ← Back to interviews
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes readyModalIn {
              from { opacity: 0; transform: translateY(12px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {showPaywall && paywallData && (
        <InterviewPaywallGate
          used={paywallData.used}
          limit={paywallData.limit}
          onUpgrade={startUpgrade}
          onDismiss={() => setShowPaywall(false)}
        />
      )}
    </>
  )
}
