'use client'

import { useRef, useEffect } from 'react'
import type { ChallengeMode } from '@/lib/types'
import { PMCanvas } from './PMCanvas'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { getWordCount } from '@/lib/utils'

/* ── Types ───────────────────────────────────────────────── */

type AnswerTab = 'answer' | 'canvas' | 'frameworks'

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
  hatchMessages: Array<{ role: 'user' | 'hatch'; content: string }>
  onLiveSend: () => void
  hatchSending: boolean
  // Timer (for canvas auto-submit)
  timeLeft?: number
  timeExpired?: boolean
}

/* ── Frameworks stub content ─────────────────────────────── */

const FRAMEWORKS = [
  {
    id: 'circles',
    name: 'CIRCLES Method',
    purpose: 'Comprehensive product design framework',
    steps: [
      'Comprehend the situation',
      'Identify the customer',
      'Report customer needs',
      'Cut through prioritization',
      'List solutions',
      'Evaluate trade-offs',
      'Summarize recommendations',
    ],
  },
  {
    id: 'heart',
    name: 'HEART Framework',
    purpose: 'Measure user experience quality',
    steps: ['Happiness', 'Engagement', 'Adoption', 'Retention', 'Task success'],
  },
  {
    id: 'rice',
    name: 'RICE Scoring',
    purpose: 'Prioritize features objectively',
    steps: ['Reach', 'Impact', 'Confidence', 'Effort'],
  },
  {
    id: 'jobs',
    name: 'Jobs to Be Done',
    purpose: 'Understand user motivation',
    steps: [
      'Functional job',
      'Emotional job',
      'Social job',
      'Identify underserved jobs',
      'Map to solutions',
    ],
  },
  {
    id: 'prfaq',
    name: 'PR/FAQ',
    purpose: 'Work backwards from the customer',
    steps: [
      'Write the press release',
      'Define customer problem',
      'Describe the solution',
      'Anticipate FAQs',
      'Define success metrics',
    ],
  },
]

/* ── Tab definitions ─────────────────────────────────────── */

const TABS: Array<{ id: AnswerTab; label: string; icon: string }> = [
  { id: 'answer', label: 'Freeform', icon: 'edit_note' },
  { id: 'canvas', label: 'Guided', icon: 'format_list_numbered' },
  { id: 'frameworks', label: 'Frameworks', icon: 'import_contacts' },
]

/* ── Sub-components ──────────────────────────────────────── */

function TabBar({
  activeTab,
  onTabChange,
  mode,
  onModeChange,
}: {
  activeTab: AnswerTab
  onTabChange: (tab: AnswerTab) => void
  mode: ChallengeMode
  onModeChange: (mode: ChallengeMode) => void
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
      <div className="flex items-center bg-surface-container-high/50 rounded-full p-0.5 mb-2">
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
  hatchMessages,
  hatchSending,
  response,
  onResponseChange,
  onLiveSend,
  onSubmit,
  submitting,
}: {
  hatchMessages: Array<{ role: 'user' | 'hatch'; content: string }>
  hatchSending: boolean
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
  }, [hatchMessages, hatchSending])

  return (
    <div className="flex flex-col h-full">
      {/* Message thread */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-10 py-6 space-y-4"
      >
        {hatchMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1 max-w-[85%] ${
              msg.role === 'user' ? 'ml-auto items-end' : 'items-start'
            }`}
          >
            <div
              className={
                msg.role === 'hatch'
                  ? 'bg-surface-container-high text-on-surface-variant p-4 rounded-r-xl rounded-bl-xl text-sm leading-relaxed font-body'
                  : 'bg-primary/10 text-on-surface p-4 rounded-l-xl rounded-br-xl text-sm leading-relaxed font-body ml-auto'
              }
            >
              {msg.content}
            </div>
            <span className="text-[10px] font-label font-bold text-outline uppercase tracking-wider">
              {msg.role === 'hatch' ? 'Hatch' : 'You'}
            </span>
          </div>
        ))}

        {/* Typing indicator */}
        {hatchSending && (
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
      <div className="px-10 pb-4 flex gap-3 items-end flex-shrink-0">
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
          disabled={!response.trim() || hatchSending}
          className="flex-shrink-0 px-5 py-3 bg-primary text-on-primary rounded-full font-label font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Send →
        </button>
      </div>

      {/* Finish & Submit */}
      <div className="px-10 pb-6 flex-shrink-0">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || hatchMessages.filter((m) => m.role === 'user').length === 0}
          className="w-full flex items-center justify-center gap-3 bg-primary text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:opacity-90 disabled:opacity-40 transition-opacity font-label"
        >
          {submitting ? (
            <>
              <HatchGlyph size={18} className="animate-hatch-glow text-white" />
              Hatch is thinking...
            </>
          ) : (
            'Finish & Submit Answer'
          )}
        </button>
      </div>
    </div>
  )
}

/* ── Frameworks tab ──────────────────────────────────────── */

function FrameworksTab() {
  return (
    <div className="h-full overflow-y-auto px-10 py-8 space-y-4">
      <p className="text-xs font-label font-bold text-outline uppercase tracking-wider mb-6">
        Reference frameworks
      </p>
      {FRAMEWORKS.map((fw) => (
        <div
          key={fw.id}
          className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/20 space-y-3"
        >
          <div>
            <h3 className="font-headline font-bold text-on-surface text-base">{fw.name}</h3>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">{fw.purpose}</p>
          </div>
          <ol className="space-y-1.5 pl-1">
            {fw.steps.map((step, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm text-on-surface-variant font-body"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold font-label">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      ))}
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
  hatchMessages,
  onLiveSend,
  hatchSending,
  timeLeft,
  timeExpired,
}: AnswerPaneProps) {
  const wordCount = getWordCount(response)

  return (
    <div className="w-1/2 h-full bg-surface-container-lowest border-l border-outline-variant/20 flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
      {/* Tab bar */}
      <TabBar activeTab={activeTab} onTabChange={onTabChange} mode={mode} onModeChange={onModeChange} />

      {/* Tab content — fills remaining height, no outer scroll */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* ── Your Answer tab ── */}
        {activeTab === 'answer' && mode !== 'live' && (
          <>
            {/* Textarea area */}
            <div className="flex-1 p-10 overflow-hidden flex flex-col gap-4">
              <textarea
                value={response}
                onChange={(e) => onResponseChange(e.target.value)}
                placeholder="Write your complete answer here — structure it however you like..."
                className="w-full h-full border-none focus:ring-0 text-on-surface-variant font-headline text-lg leading-relaxed placeholder:text-outline/40 bg-transparent resize-none outline-none"
              />
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-8 bg-surface-container-low/30 border-t border-outline-variant/10">
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
                      <HatchGlyph size={18} className="animate-hatch-glow text-white" />
                      Hatch is thinking...
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Your Answer tab (Live mode) ── */}
        {activeTab === 'answer' && mode === 'live' && (
          <LiveChatView
            hatchMessages={hatchMessages}
            hatchSending={hatchSending}
            response={response}
            onResponseChange={onResponseChange}
            onLiveSend={onLiveSend}
            onSubmit={onSubmit}
            submitting={submitting}
          />
        )}

        {/* ── Canvas tab ── */}
        {activeTab === 'canvas' && (
          <div className="flex-1 overflow-y-auto p-10">
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

        {/* ── Frameworks tab ── */}
        {activeTab === 'frameworks' && <FrameworksTab />}
      </div>
    </div>
  )
}
