import { MOCK_GLOSSARY_TERMS } from '@/lib/mock-data'
import type { GlossaryTerm } from '@/lib/types'

export function getGlossaryTerms(): GlossaryTerm[] {
  return MOCK_GLOSSARY_TERMS
}

export function buildGlossaryMap(): Map<string, GlossaryTerm> {
  const map = new Map<string, GlossaryTerm>()
  for (const term of MOCK_GLOSSARY_TERMS) {
    map.set(term.term.toLowerCase(), term)
    if (term.fullName) {
      map.set(term.fullName.toLowerCase(), term)
    }
  }
  return map
}
