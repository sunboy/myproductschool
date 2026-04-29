/**
 * compare.ts — shared output comparator for coding challenge test evaluation.
 *
 * Supports four compare modes:
 *   'exact'       — JSON.stringify equality (default, current behaviour)
 *   'set'         — sort top-level array elements before comparing (any order)
 *   'sorted'      — cast to numbers and sort numerically (pure numeric arrays)
 *   'sorted_each' — sort each sub-array, then sort the outer array
 *                   (for 3Sum / Group Anagrams where both the inner groups
 *                    and the outer list are unordered)
 *
 * Keep in sync with scripts/validate-coding-seeds.ts if you ever inline a copy.
 */

export type CompareMode = 'exact' | 'set' | 'sorted' | 'sorted_each'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Stable JSON key for a JS value — used as a sort key when values are objects. */
function toSortKey(v: unknown): string {
  return JSON.stringify(v) ?? ''
}

/**
 * Sort a top-level array in a canonical order.
 * Primitives are sorted by their string representation; objects/arrays by JSON.
 */
function sortArray(arr: unknown[]): unknown[] {
  return [...arr].sort((a, b) => {
    const ka = toSortKey(a)
    const kb = toSortKey(b)
    return ka < kb ? -1 : ka > kb ? 1 : 0
  })
}

/** Sort a numeric array numerically. Falls back to toSortKey ordering. */
function sortNumeric(arr: unknown[]): unknown[] {
  return [...arr].sort((a, b) => {
    const na = typeof a === 'number' ? a : parseFloat(String(a))
    const nb = typeof b === 'number' ? b : parseFloat(String(b))
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return toSortKey(a) < toSortKey(b) ? -1 : 1
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compare two already-parsed values using the requested mode.
 * Always returns false (not true) when actual is null/undefined and expected isn't.
 */
export function compareOutputs(
  actual: unknown,
  expected: unknown,
  mode: CompareMode = 'exact'
): boolean {
  // Null / undefined fast-path
  if (actual === null || actual === undefined) {
    return actual === expected
  }

  switch (mode) {
    case 'exact':
      return JSON.stringify(actual) === JSON.stringify(expected)

    case 'set': {
      // Defensive: fall back to exact if either value isn't an array
      if (!Array.isArray(actual) || !Array.isArray(expected)) {
        return JSON.stringify(actual) === JSON.stringify(expected)
      }
      if (actual.length !== expected.length) return false
      const sortedActual = sortArray(actual)
      const sortedExpected = sortArray(expected)
      return JSON.stringify(sortedActual) === JSON.stringify(sortedExpected)
    }

    case 'sorted': {
      if (!Array.isArray(actual) || !Array.isArray(expected)) {
        return JSON.stringify(actual) === JSON.stringify(expected)
      }
      if (actual.length !== expected.length) return false
      const sortedActual = sortNumeric(actual)
      const sortedExpected = sortNumeric(expected)
      return JSON.stringify(sortedActual) === JSON.stringify(sortedExpected)
    }

    case 'sorted_each': {
      // Sort each sub-array, then sort the outer array
      if (!Array.isArray(actual) || !Array.isArray(expected)) {
        return JSON.stringify(actual) === JSON.stringify(expected)
      }
      if (actual.length !== expected.length) return false

      function normalizeSortedEach(arr: unknown[]): string {
        const normalizedRows = arr.map((row) => {
          if (!Array.isArray(row)) return toSortKey(row)
          return toSortKey(sortArray(row))
        })
        normalizedRows.sort()
        return JSON.stringify(normalizedRows)
      }

      return normalizeSortedEach(actual) === normalizeSortedEach(expected)
    }

    default:
      // Unknown mode — fall back to exact
      return JSON.stringify(actual) === JSON.stringify(expected)
  }
}
