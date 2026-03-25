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
    <div className="border-b border-outline-variant/10 px-8 pt-6 flex items-end justify-between flex-shrink-0">
      <div className="flex items-end gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'px-6 py-3 text-sm font-bold text-primary border-b-2 border-primary -mb-px transition-colors'
                : 'px-6 py-3 text-sm font-medium text-outline hover:text-on-surface-variant transition-colors'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        {/* Framework reference lightbulb button */}
        <button
          onClick={onOpenDrawer}
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
          title="Framework Reference"
          aria-label="Open framework reference"
        >
          <span
            className="material-symbols-outlined text-on-surface-variant"
            style={{ fontSize: 20 }}
          >
            lightbulb
          </span>
        </button>

        {/* Solo / Live mode toggle */}
        <div className="flex items-center bg-surface-container-high/50 rounded-full p-0.5">
          <button
            onClick={() => onModeChange('solo')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              mode === 'solo' ? 'bg-primary-container text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">edit_note</span>
            Solo
          </button>
          <button
            onClick={() => onModeChange('live')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              mode === 'live' ? 'bg-primary-container text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">chat</span>
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
    <div className="w-1/2 h-full bg-surface-container-lowest border-l border-outline-variant/20 flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
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
            <div className="flex-1 p-6 lg:p-8 overflow-hidden flex flex-col gap-4">
              <textarea
                value={response}
                onChange={(e) => onResponseChange(e.target.value)}
                placeholder="Write your complete answer here — structure it however you like..."
                className="w-full h-full border-none focus:ring-0 text-on-surface-variant font-headline text-lg leading-relaxed placeholder:text-outline/40 bg-transparent resize-none outline-none"
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
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
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
