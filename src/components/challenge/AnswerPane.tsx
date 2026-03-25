'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChallengeMode } from '@/lib/types'
import { PMCanvas } from './PMCanvas'
import { FrameworkDrawer } from './FrameworkDrawer'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { getWordCount } from '@/lib/utils'

/* ── Types ───────────────────────────────────────────────── */

type AnswerTab = 'answer' | 'canvas'

interface AnswerPaneProps {
  activeTab: AnswerTab
  onTabChange: (tab: AnswerTab) => void
  response: string
  onResponseChange: (value: string) => void
  confidence: number
  onConfidenceChange: (value: number) => void
  onSubmit: () => void
  submitting: boolean
  mode: ChallengeMode
  onModeChange: (mode: ChallengeMode) => void
  // Canvas props
  subQuestions: string[]
  // Save status
  autoSaveText: string
  // Live mode
  lumaMessages: Array<{ role: 'user' | 'luma'; content: string }>
  onLiveSend: () => void
  lumaSending: boolean
  // Timer (for canvas auto-submit)
  timeLeft?: number
  timeExpired?: boolean
  // Drawer control (parent can trigger open via prop)
  drawerOpen?: boolean
  onDrawerClose?: () => void
}

/* ── Tab definitions ─────────────────────────────────────── */

const TABS: Array<{ id: AnswerTab; label: string; icon: string }> = [
  { id: 'canvas', label: 'Guided', icon: 'format_list_numbered' },
  { id: 'answer', label: 'Freeform', icon: 'edit_note' },
]

/* ── Sub-components ──────────────────────────────────────── */

function TabBar({
  activeTab,
  onTabChange,
  mode,
  onModeChange,
  onOpenDrawer,
}: {
  activeTab: AnswerTab
  onTabChange: (tab: AnswerTab) => void
  mode: ChallengeMode
  onModeChange: (mode: ChallengeMode) => void
  onOpenDrawer: () => void
}) {
  return (
    <div className="border-b border-outline-variant/20 px-5 flex items-center justify-between flex-shrink-0 h-12">
      {/* Pill-style tabs */}
      <div className="flex items-center gap-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container transition-colors'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {/* Framework reference lightbulb button */}
        <div className="group relative">
          <button
            onClick={onOpenDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-tertiary transition-colors"
            title="Framework Reference"
            aria-label="Open framework reference"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
            >
              lightbulb
            </span>
          </button>
          <div className="absolute right-0 top-10 w-24 bg-on-surface text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-center z-[60]">
            Frameworks
          </div>
        </div>

        <div className="w-px h-5 bg-outline-variant/30 mx-0.5" />

        {/* Solo / Live mode toggle */}
        <div className="flex items-center bg-surface-container p-0.5 rounded-full">
          <button
            onClick={() => onModeChange('solo')}
            className={`px-3 py-0.5 text-[10px] font-bold rounded-full transition-all ${
              mode === 'solo' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Solo
          </button>
          <button
            onClick={() => onModeChange('live')}
            className={`px-3 py-0.5 text-[10px] font-bold rounded-full transition-all ${
              mode === 'live' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Live
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  // confidence is 0–5; render as fraction of w-48 bar
  const fill = Math.max(0, Math.min(1, confidence / 5))
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
        Confidence
      </span>
      <div className="w-48 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${fill * 100}%` }}
        />
      </div>
    </div>
  )
}

/* ── Live mode chat view ─────────────────────────────────── */

function LiveChatView({
  lumaMessages,
  lumaSending,
  response,
  onResponseChange,
  onLiveSend,
  onSubmit,
  submitting,
}: {
  lumaMessages: Array<{ role: 'user' | 'luma'; content: string }>
  lumaSending: boolean
  response: string
  onResponseChange: (v: string) => void
  onLiveSend: () => void
  onSubmit: () => void
  submitting: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lumaMessages, lumaSending])

  return (
    <div className="flex flex-col h-full">
      {/* Message thread */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 lg:px-8 py-4 space-y-4"
      >
        {lumaMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1 max-w-[85%] ${
              msg.role === 'user' ? 'ml-auto items-end' : 'items-start'
            }`}
          >
            <div
              className={
                msg.role === 'luma'
                  ? 'bg-surface-container-high text-on-surface-variant p-4 rounded-r-xl rounded-bl-xl text-sm leading-relaxed font-body'
                  : 'bg-primary/10 text-on-surface p-4 rounded-l-xl rounded-br-xl text-sm leading-relaxed font-body ml-auto'
              }
            >
              {msg.content}
            </div>
            <span className="text-[10px] font-label font-bold text-outline uppercase tracking-wider">
              {msg.role === 'luma' ? 'Luma' : 'You'}
            </span>
          </div>
        ))}

        {/* Typing indicator */}
        {lumaSending && (
          <div className="flex items-start gap-2 max-w-[85%]">
            <div className="bg-surface-container-high p-4 rounded-r-xl rounded-bl-xl">
              <div className="flex gap-1 items-center">
                <span
                  className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="px-6 lg:px-8 pb-4 flex gap-3 items-end flex-shrink-0">
        <textarea
          value={response}
          onChange={(e) => onResponseChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onLiveSend()
            }
          }}
          placeholder="Type your response..."
          rows={3}
          className="flex-1 border border-outline-variant/30 bg-surface-container-low rounded-xl p-3 text-sm text-on-surface font-body placeholder:text-outline/40 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none transition-all outline-none"
        />
        <button
          type="button"
          onClick={onLiveSend}
          disabled={!response.trim() || lumaSending}
          className="flex-shrink-0 px-5 py-3 bg-primary text-on-primary rounded-full font-label font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Send →
        </button>
      </div>

      {/* Finish & Submit */}
      <div className="px-6 lg:px-8 pb-4 flex-shrink-0">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || lumaMessages.filter((m) => m.role === 'user').length === 0}
          className="w-full flex items-center justify-center gap-3 bg-primary text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:opacity-90 disabled:opacity-40 transition-opacity font-label"
        >
          {submitting ? (
            <>
              <LumaGlyph size={18} className="animate-luma-glow text-white" />
              Luma is thinking...
            </>
          ) : (
            'Finish & Submit Answer'
          )}
        </button>
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────── */

export function AnswerPane({
  activeTab,
  onTabChange,
  response,
  onResponseChange,
  confidence,
  onConfidenceChange: _onConfidenceChange,
  onSubmit,
  submitting,
  mode,
  onModeChange,
  subQuestions,
  autoSaveText,
  lumaMessages,
  onLiveSend,
  lumaSending,
  timeLeft,
  timeExpired,
  drawerOpen: externalDrawerOpen,
  onDrawerClose: externalDrawerClose,
}: AnswerPaneProps) {
  const wordCount = getWordCount(response)
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false)

  // Merge external and internal drawer state (external wins when provided)
  const drawerOpen = externalDrawerOpen !== undefined ? externalDrawerOpen : internalDrawerOpen
  const handleDrawerClose = () => {
    setInternalDrawerOpen(false)
    externalDrawerClose?.()
  }

  return (
    <div className="w-1/2 h-full bg-white border-l border-outline-variant/20 flex flex-col relative overflow-hidden">
      {/* Tab bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={onTabChange}
        mode={mode}
        onModeChange={onModeChange}
        onOpenDrawer={() => setInternalDrawerOpen(true)}
      />

      {/* Tab content — fills remaining height, no outer scroll */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* ── Your Answer tab (Freeform) ── */}
        {activeTab === 'answer' && mode !== 'live' && (
          <>
            {/* Textarea area */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col bg-surface-container-low/30">
              <textarea
                value={response}
                onChange={(e) => onResponseChange(e.target.value)}
                placeholder="Write your complete answer here — structure it however you like..."
                className="w-full h-full border-none focus:ring-0 text-on-surface font-body text-sm leading-relaxed placeholder:text-outline/40 bg-transparent resize-none outline-none"
              />
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-5 lg:p-6 bg-surface-container-low/30 border-t border-outline-variant/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-outline font-bold uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    {autoSaveText}
                  </span>
                  <ConfidenceBar confidence={confidence} />
                </div>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitting || !response.trim()}
                  className="flex items-center gap-3 bg-primary text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:opacity-90 disabled:opacity-40 transition-opacity font-label"
                >
                  {submitting ? (
                    <>
                      <LumaGlyph size={18} className="animate-luma-glow text-white" />
                      Luma is thinking...
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Freeform tab (Live mode) ── */}
        {activeTab === 'answer' && mode === 'live' && (
          <LiveChatView
            lumaMessages={lumaMessages}
            lumaSending={lumaSending}
            response={response}
            onResponseChange={onResponseChange}
            onLiveSend={onLiveSend}
            onSubmit={onSubmit}
            submitting={submitting}
          />
        )}

        {/* ── Guided tab ── */}
        {activeTab === 'canvas' && (
          <div className="flex-1 overflow-y-auto p-6 bg-surface-container-low/30">
            <PMCanvas
              subQuestions={subQuestions}
              onSubmit={(responses, conf) => {
                // Merge canvas responses into a single text block and submit
                onResponseChange(responses.join('\n\n'))
                _onConfidenceChange(conf)
                onSubmit()
              }}
              submitting={submitting}
              mode={mode}
              nudge={null}
              timeLeft={timeLeft}
              timeExpired={timeExpired}
            />
          </div>
        )}
      </div>

      {/* Framework side drawer */}
      <FrameworkDrawer open={drawerOpen} onClose={handleDrawerClose} />
    </div>
  )
}
