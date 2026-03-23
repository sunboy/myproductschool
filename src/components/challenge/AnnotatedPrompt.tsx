'use client'

import { useMemo } from 'react'
import { GlossaryTooltip } from '@/components/challenge/GlossaryTooltip'
import { MOCK_GLOSSARY_TERMS } from '@/lib/mock-data'
import type { GlossaryTerm } from '@/lib/types'

interface AnnotatedPromptProps {
  text: string
  className?: string
}

export function AnnotatedPrompt({ text, className }: AnnotatedPromptProps) {
  const annotated = useMemo(() => {
    const terms = MOCK_GLOSSARY_TERMS
    if (!terms || terms.length === 0) {
      return [text]
    }

    // Build lookup: collect all matchable strings, longest first
    const entries: { match: string; term: GlossaryTerm }[] = []
    for (const t of terms) {
      if (t.fullName) {
        entries.push({ match: t.fullName, term: t })
      }
      entries.push({ match: t.term, term: t })
    }
    entries.sort((a, b) => b.match.length - a.match.length)

    // Build regex from all matchable strings (longest first, word boundary, case-insensitive)
    const escaped = entries.map((e) => e.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi')

    const annotatedSet = new Set<string>() // track which terms have been annotated (by lowercase term key)
    const parts: (string | { term: GlossaryTerm; matched: string })[] = []
    let lastIndex = 0

    // Walk through all matches
    let m: RegExpExecArray | null
    while ((m = pattern.exec(text)) !== null) {
      const matchedText = m[1]
      const entry = entries.find((e) => e.match.toLowerCase() === matchedText.toLowerCase())
      if (!entry) continue

      const termKey = entry.term.term.toLowerCase()

      // Only annotate first occurrence of each term
      if (annotatedSet.has(termKey)) continue
      annotatedSet.add(termKey)

      // Push preceding text
      if (m.index > lastIndex) {
        parts.push(text.slice(lastIndex, m.index))
      }

      parts.push({ term: entry.term, matched: matchedText })
      lastIndex = m.index + matchedText.length
    }

    // Push remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts.length > 0 ? parts : [text]
  }, [text])

  return (
    <span className={className}>
      {annotated.map((part, i) => {
        if (typeof part === 'string') {
          return <span key={i}>{part}</span>
        }
        return (
          <GlossaryTooltip key={i} term={part.term}>
            {part.matched}
          </GlossaryTooltip>
        )
      })}
    </span>
  )
}
