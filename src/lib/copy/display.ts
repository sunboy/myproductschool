export function cleanDisplayCopy(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/\s*(?:—|--|&mdash;)\s*/g, ', ')
    .replace(/[ \t]+([,.!?;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}
