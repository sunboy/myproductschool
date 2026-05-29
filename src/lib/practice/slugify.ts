/**
 * Normalise a user-supplied industry/tag string to a URL-safe slug.
 * Trims whitespace, lowercases, collapses non-alphanumeric runs to a single
 * dash, and strips any leading/trailing dashes. Returns '' for strings that
 * reduce to nothing but punctuation.
 */
export function slugifyIndustry(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
