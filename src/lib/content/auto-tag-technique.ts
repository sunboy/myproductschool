/**
 * Conservative technique-tag inference for coding challenges, so a NEW algorithm
 * row that arrives UNTAGGED still qualifies for the verified stepped walkthrough it
 * would earn if it were tagged.
 *
 * The walkthrough system attaches a machine-verified interactive diagram only when a
 * challenge's tags (or its reference code) route to a verified tracer AND the tracer's
 * canonical run cross-checks against the challenge's own expected output. Many freshly
 * ingested challenges carry no `technique_tags`, so they silently miss a walkthrough
 * they qualify for. This module closes that gap at insert time by probing the SAME
 * verified detectors the tracer uses, and returning the canonical technique tag(s) to
 * ADD to `technique_tags`.
 *
 * Safety contract (why this can never produce a wrong animation):
 *   - It emits a tag ONLY when the full metadata-driven builder for that base returns
 *     a non-null candidate with the tag added. That builder recognizes the pattern,
 *     runs the canonical algorithm on the challenge's REAL visible test cases, and
 *     cross-checks the answer against the challenge's own `expected`. A pattern that
 *     coincidentally matches a tag but fails the cross-check yields no tag.
 *   - It never removes an existing tag; it only adds tags absent from `existingTags`.
 *   - It is pure (no DB, no network, no secrets) and never throws for a caller that
 *     passes a well-formed metadata object; a malformed detector input simply yields
 *     no tag. Callers should still wrap it fail-soft so a commit is never blocked.
 *
 * SQL challenges route to the pipeline walkthrough on a STRUCTURAL basis (a CTE-shaped
 * reference), not on a tag, so no tag is needed there and this returns [].
 */

import {
  buildSteppedTraceFromMetadata,
  detectPattern,
  PATTERN_TO_CANONICAL_TAG,
} from '@/lib/solutions/trace'
import {
  buildSteppedGridFromMetadata,
  detectGridPattern,
  GRID_PATTERN_TO_CANONICAL_TAG,
  GENERIC_DP_TAG,
} from '@/lib/solutions/trace/gridTrace'
import {
  buildSteppedSequenceFromMetadata,
  detectSequencePattern,
  SEQUENCE_PATTERN_TO_CANONICAL_TAG,
} from '@/lib/solutions/trace/sequenceTrace'

/** Read the reference solution source (string or {python|py}) the array/grid detectors want. */
function extractReferenceSource(reference: unknown): string {
  if (typeof reference === 'string') return reference
  if (reference && typeof reference === 'object') {
    const r = reference as Record<string, unknown>
    if (typeof r.python === 'string') return r.python
    if (typeof r.py === 'string') return r.py
  }
  return ''
}

/**
 * Detect the verified technique tag(s) to ADD to a coding challenge's `technique_tags`,
 * deduped against `existingTags` and never removing any existing tag.
 *
 * The goal is strict: after merging the returned tags, at least one of
 * buildSteppedTraceFromMetadata / buildSteppedGridFromMetadata /
 * buildSteppedSequenceFromMetadata returns a non-null (verified, cross-checked)
 * candidate. A tag is emitted ONLY when adding it makes the corresponding builder
 * succeed, so a tag that would not produce an eligible walkthrough is never written.
 *
 * @param challengeType e.g. 'algorithm' | 'sql' | 'coding' (SQL and unknown types tag nothing)
 * @param metadata      the challenge metadata carrying `reference_solution` and `test_cases`
 * @param existingTags  the tags already on the row (technique + topic); used for dedup and detection
 */
export function detectTechniqueTags(
  challengeType: string,
  metadata: Record<string, unknown>,
  existingTags: string[],
): string[] {
  const type = (challengeType ?? '').toLowerCase().trim()

  // SQL routes to the pipeline walkthrough structurally (CTE-shaped reference), not by
  // tag, so there is nothing to add. Anything that is not an algorithm/coding row is out
  // of scope for the array/grid/sequence tracers entirely.
  if (type !== 'algorithm' && type !== 'coding') return []

  const referenceSource = extractReferenceSource(metadata.reference_solution)
  const existingLower = new Set(existingTags.map((t) => t.toLowerCase().trim()))

  // Accumulate proposed additions preserving order, deduped against existing tags AND
  // against tags already proposed in this pass.
  const toAdd: string[] = []
  const proposed = new Set<string>()
  const propose = (tag: string): void => {
    const norm = tag.toLowerCase().trim()
    if (!norm) return
    if (existingLower.has(norm) || proposed.has(norm)) return
    proposed.add(norm)
    toAdd.push(tag)
  }

  // A detector's tag is emitted only when the builder actually certifies the pattern
  // with that tag added. This routes through the identical cross-check the lazy
  // generate route uses, so we never write a tag that would not produce a walkthrough.
  const withTag = (tag: string): string[] => [...existingTags, tag]

  // ── Array / string patterns (binary search, two-pointers, sliding window, etc.) ──
  const arrayPattern = detectPattern(existingTags, referenceSource)
  if (arrayPattern) {
    const tag = PATTERN_TO_CANONICAL_TAG[arrayPattern]
    // The two-pointer area/water variants share the 'two-pointers' tag; the reference
    // code (not the tag) is what refines them, so the builder still certifies with the
    // shared tag added. Only propose when the tag is absent and the build certifies.
    if (tag && !existingLower.has(tag.toLowerCase().trim())) {
      if (buildSteppedTraceFromMetadata(metadata, withTag(tag))) propose(tag)
    }
  }

  // ── Grid / dynamic-programming families (LCS, edit distance, knapsack, etc.) ──
  const gridPattern = detectGridPattern(existingTags, referenceSource)
  if (gridPattern) {
    const familyTag = GRID_PATTERN_TO_CANONICAL_TAG[gridPattern]
    if (familyTag) {
      // Certify with the family tag added. The umbrella 'dynamic-programming' topic is
      // emitted alongside it (it is a helpful topic signal and rides the same family),
      // but only when the family build genuinely certifies.
      const alreadyTagged = existingLower.has(familyTag.toLowerCase().trim())
      const buildsWithFamily = alreadyTagged
        ? !!buildSteppedGridFromMetadata(metadata, existingTags)
        : !!buildSteppedGridFromMetadata(metadata, withTag(familyTag))
      if (buildsWithFamily) {
        propose(familyTag)
        propose(GENERIC_DP_TAG)
      }
    }
  }

  // ── Sequence patterns (linked-list reversal, inorder traversal) ──
  const sequencePattern = detectSequencePattern(existingTags)
  if (sequencePattern) {
    const tag = SEQUENCE_PATTERN_TO_CANONICAL_TAG[sequencePattern]
    if (tag && !existingLower.has(tag.toLowerCase().trim())) {
      if (buildSteppedSequenceFromMetadata(metadata, withTag(tag))) propose(tag)
    }
  }

  return toAdd
}
