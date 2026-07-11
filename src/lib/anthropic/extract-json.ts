// Tolerant JSON extraction for LLM output.
//
// Models are instructed to "return ONLY JSON" but probabilistically wrap the
// object in markdown fences, a prose preamble, or trailing commentary. A naive
// `JSON.parse(raw)` then throws "Unexpected non-whitespace character after JSON"
// (valid object + trailing prose) or "Unexpected token" (leading prose), and the
// useful payload is lost. This helper recovers the first balanced JSON object (or
// array) from such output so a stray sentence doesn't discard a good response.
//
// Why a brace-depth scan and not a regex: the greedy `/\{[\s\S]*\}/` matches from
// the FIRST `{` to the LAST `}` in the whole string, so any trailing prose that
// contains a `}` (e.g. "…as shown in obj}.") gets swallowed into the match and the
// parse still fails. The scan below tracks depth and respects string literals /
// escapes, returning the first fully-balanced object.

/** Strip a leading ```json (or ```) fence and a trailing ``` fence, if present. */
function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

interface BalancedSpan {
  /** The balanced substring (including its delimiters). */
  span: string
  /** Index in `text` of this span's opening delimiter. */
  openIndex: number
}

/**
 * Find the first balanced `{...}` or `[...]` span at or after `from`, honoring
 * string literals and escapes so a brace inside a string doesn't skew the depth
 * count. Returns the span and its opening index, or null if none exists.
 */
function nextBalancedSpan(text: string, from: number): BalancedSpan | null {
  // Locate the next opening delimiter at or after `from`.
  let open = -1
  for (let i = from; i < text.length; i++) {
    if (text[i] === '{' || text[i] === '[') {
      open = i
      break
    }
  }
  if (open === -1) return null

  const openChar = text[open]
  const closeChar = openChar === '{' ? '}' : ']'
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = open; i < text.length; i++) {
    const ch = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
    } else if (ch === openChar) {
      depth++
    } else if (ch === closeChar) {
      depth--
      if (depth === 0) {
        return { span: text.slice(open, i + 1), openIndex: open }
      }
    }
  }

  return null
}

/** Cap on candidate spans tried, so pathological input stays roughly O(n). */
const MAX_SPAN_ATTEMPTS = 5

/**
 * Parse a JSON object/array out of raw model output, tolerating markdown fences
 * and surrounding prose. Order of attempts:
 *   1. Parse the fence-stripped text directly (fast path for clean output).
 *   2. Extract the first balanced {...}/[...] span and parse that.
 * Returns the parsed value typed as T, or null if nothing parseable is found.
 * Never throws.
 */
export function extractJson<T = unknown>(raw: string | null | undefined): T | null {
  if (!raw) return null
  const cleaned = stripFences(raw)
  if (!cleaned) return null

  try {
    return JSON.parse(cleaned) as T
  } catch {
    // fall through to balanced-span extraction
  }

  // Try successive balanced spans. A prose preamble can itself contain a brace
  // pair (e.g. `Here is {the result}: {"nudge":"..."}`), so the first balanced
  // span may not be the real payload — resume scanning just past each failed
  // span's opening delimiter and try the next one. Bounded so pathological input
  // stays roughly O(n).
  let from = 0
  for (let attempt = 0; attempt < MAX_SPAN_ATTEMPTS; attempt++) {
    const found = nextBalancedSpan(cleaned, from)
    if (!found) break
    try {
      return JSON.parse(found.span) as T
    } catch {
      // Resume just past this span's opening delimiter so a nested/overlapping
      // candidate can still be discovered on the next pass.
      from = found.openIndex + 1
    }
  }

  return null
}

/** A short, log-safe preview of raw model output for observability on failure. */
export function truncateForLog(raw: string | null | undefined, max = 300): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max)}…[+${trimmed.length - max} chars]` : trimmed
}
