/**
 * Splits a coding challenge description into the left-panel doc tabs
 * (Description / Examples / Constraints), per CHALLENGE_DESCRIPTION_SPEC:
 * algorithm descriptions carry `## Examples` and `## Constraints`; sql
 * descriptions carry `## Output`, which stays inside Description because it
 * is the ask, not an example.
 *
 * Pure string module, no React. A missing section means the tab is absent,
 * never an empty pane.
 */

export interface ProblemSections {
  /** Everything that is not an Examples/Constraints section, joined in order. */
  description: string
  /** Body of `## Examples` (heading stripped), when present and non-empty. */
  examples?: string
  /** Body of `## Constraints` (heading stripped), when present and non-empty. */
  constraints?: string
}

type SectionKey = 'description' | 'examples' | 'constraints'

function headingKey(line: string): SectionKey | null {
  const match = /^##\s+(.+?)\s*$/.exec(line)
  if (!match) return null
  const title = match[1].trim().toLowerCase()
  if (title === 'example' || title === 'examples') return 'examples'
  if (title === 'constraint' || title === 'constraints') return 'constraints'
  // Any other `##` heading (## Output, ## Follow-up, …) resumes Description.
  return 'description'
}

/**
 * Split on `## Examples` / `## Constraints` boundaries. Content under a
 * recognized heading belongs to that tab until the next `##` heading; any
 * other `##` heading (including its line) flows back into Description.
 * Fenced code blocks are opaque: a `## ` line inside ``` fences never splits.
 */
export function splitProblemSections(markdown: string): ProblemSections {
  const buckets: Record<SectionKey, string[]> = {
    description: [],
    examples: [],
    constraints: [],
  }
  let current: SectionKey = 'description'
  let inFence = false

  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      buckets[current].push(line)
      continue
    }
    if (!inFence) {
      const key = headingKey(line)
      if (key) {
        current = key
        // Recognized section headings are stripped (the tab is the heading);
        // other headings stay in the Description flow verbatim.
        if (key === 'description') buckets.description.push(line)
        continue
      }
    }
    buckets[current].push(line)
  }

  const description = buckets.description.join('\n').trim()
  const examples = buckets.examples.join('\n').trim()
  const constraints = buckets.constraints.join('\n').trim()

  return {
    description,
    ...(examples ? { examples } : {}),
    ...(constraints ? { constraints } : {}),
  }
}

/** Left-panel doc tabs present for a given description. Order is fixed. */
export function codingDocTabs(sections: ProblemSections): Array<'Description' | 'Examples' | 'Constraints'> {
  const tabs: Array<'Description' | 'Examples' | 'Constraints'> = ['Description']
  if (sections.examples) tabs.push('Examples')
  if (sections.constraints) tabs.push('Constraints')
  return tabs
}
