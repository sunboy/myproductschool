// Editorial workflow labels are not useful reading topics.
const INTERNAL_TAGS = new Set(['feature-autopsy', 'company-teardown', 'editorial', 'platform'])

export function readerTopicTags(tags: string[]): string[] {
  return [...new Set(tags.map(tag => tag.trim()).filter(tag =>
    tag && !INTERNAL_TAGS.has(tag.toLowerCase().replace(/[ _]+/g, '-')),
  ))]
}
