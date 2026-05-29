'use client'

import { useRef, useCallback, useEffect, useState, type ChangeEvent } from 'react'
import Editor, { loader, OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type { SupportedLanguage } from '@/lib/coding/types'

export interface PasteEvent {
  length: number
  percentOfBuffer: number
  timestamp: number
}

export interface MonacoCodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: SupportedLanguage
  theme?: 'vs' | 'vs-dark'
  onMount?: (editor: editor.IStandaloneCodeEditor) => void
  onPaste?: (event: PasteEvent) => void
  onCursorMove?: (line: number) => void
  readOnly?: boolean
  height?: string
}

// Simple throttle - no lodash dep needed
function throttle<T extends (...args: Parameters<T>) => void>(fn: T, delayMs: number): T {
  let last = 0
  return ((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - last >= delayMs) {
      last = now
      fn(...args)
    }
  }) as T
}

// Map our SupportedLanguage to Monaco's language identifiers
const MONACO_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
  go: 'go',
  sql: 'sql',
}

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs',
  },
  'vs/nls': {
    availableLanguages: { '*': 'en' },
  },
})

function isMonacoLoadEvent(reason: unknown) {
  return typeof Event !== 'undefined' && reason instanceof Event
}

export function MonacoCodeEditor({
  value,
  onChange,
  language,
  theme = 'vs',
  onMount,
  onPaste,
  onCursorMove,
  readOnly = false,
  height = '100%',
}: MonacoCodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const [isMonacoReady, setIsMonacoReady] = useState(() => Boolean(loader.__getMonacoInstance()))
  const [didMonacoFail, setDidMonacoFail] = useState(false)

  const handleEditorMount = useCallback<OnMount>((editorInstance) => {
    editorRef.current = editorInstance

    // Paste tracking via model content changes captures the actual pasted chars.
    let lastPasteTimestamp = 0
    editorInstance.onDidPaste(() => {
      lastPasteTimestamp = Date.now()
    })

    editorInstance.onDidChangeModelContent((e) => {
      const now = Date.now()
      // If the change happened within 50ms of a paste event, treat it as paste
      if (onPaste && Math.abs(now - lastPasteTimestamp) < 50) {
        const pastedLength = e.changes.reduce((sum, c) => sum + c.text.length, 0)
        const totalLength = editorInstance.getValue().length
        onPaste({
          length: pastedLength,
          percentOfBuffer: totalLength > 0 ? pastedLength / totalLength : 0,
          timestamp: lastPasteTimestamp,
        })
      }
    })

    // Cursor activity - throttled to 5s to avoid noise
    if (onCursorMove) {
      const throttledCursor = throttle((e: editor.ICursorPositionChangedEvent) => {
        onCursorMove(e.position.lineNumber)
      }, 5000)
      editorInstance.onDidChangeCursorPosition(throttledCursor)
    }

    // Notify parent
    if (onMount) {
      onMount(editorInstance)
    }
  }, [onMount, onPaste, onCursorMove])

  const handleChange = useCallback((val: string | undefined) => {
    onChange(val ?? '')
  }, [onChange])

  const handleFallbackChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.currentTarget.value)
  }, [onChange])

  useEffect(() => {
    if (isMonacoReady || didMonacoFail) return

    let isActive = true
    const cancelable = loader.init()

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isMonacoLoadEvent(event.reason)) return
      event.preventDefault()
      if (isActive) setDidMonacoFail(true)
    }

    const handleWindowError = (event: ErrorEvent) => {
      if (!isMonacoLoadEvent(event.error)) return
      event.preventDefault()
      if (isActive) setDidMonacoFail(true)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleWindowError)

    cancelable
      .then(() => {
        if (isActive) setIsMonacoReady(true)
      })
      .catch((error) => {
        if (!isActive || error?.type === 'cancelation') return
        setDidMonacoFail(true)
      })

    return () => {
      isActive = false
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleWindowError)
      if (!loader.__getMonacoInstance()) cancelable.cancel()
    }
  }, [didMonacoFail, isMonacoReady])

  if (didMonacoFail) {
    return (
      <div className="w-full h-full bg-[#101612] rounded overflow-hidden" data-testid="monaco-editor-fallback">
        <textarea
          value={value}
          onChange={handleFallbackChange}
          onPaste={(event) => {
            if (!onPaste) return
            const pasted = event.clipboardData.getData('text')
            const nextLength = value.length + pasted.length
            onPaste({
              length: pasted.length,
              percentOfBuffer: nextLength > 0 ? pasted.length / nextLength : 0,
              timestamp: Date.now(),
            })
          }}
          onSelect={(event) => {
            if (!onCursorMove) return
            const caret = event.currentTarget.selectionStart ?? 0
            const line = value.slice(0, caret).split('\n').length
            onCursorMove(line)
          }}
          readOnly={readOnly}
          spellCheck={false}
          className="h-full w-full resize-none border-0 bg-transparent p-4 font-mono text-sm leading-6 text-[#f3ede0] outline-none placeholder:text-white/35"
          style={{ height }}
          aria-label={`${language} code editor`}
          placeholder={`Write ${language} here...`}
        />
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-surface-container rounded overflow-hidden" data-testid="monaco-editor">
      {isMonacoReady ? (
        <Editor
          height={height}
          language={MONACO_LANGUAGE_MAP[language]}
          value={value}
          theme={theme}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            tabSize: 2,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            readOnly,
            padding: { top: 12, bottom: 12 },
            fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
            lineNumbers: 'on',
            renderLineHighlight: 'gutter',
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
            suggest: { showKeywords: true },
          }}
          onMount={handleEditorMount}
          onChange={handleChange}
          loading={
            <div className="flex items-center justify-center h-full bg-surface-container">
              <span className="text-on-surface-variant text-sm font-label">Loading editor...</span>
            </div>
          }
        />
      ) : (
        <div className="flex items-center justify-center h-full bg-surface-container">
          <span className="text-on-surface-variant text-sm font-label">Loading editor...</span>
        </div>
      )}
    </div>
  )
}
