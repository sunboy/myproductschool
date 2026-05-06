'use client'

import { useRef, useCallback } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
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

  return (
    <div className="w-full h-full bg-surface-container rounded overflow-hidden" data-testid="monaco-editor">
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
    </div>
  )
}
