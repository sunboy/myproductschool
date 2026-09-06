const DEFAULT_REPORT_PATH_PATTERN = '\\/workspace\\/[\\w./-]*report[\\w.-]*\\.md'

const COMPLETED_WRITE_BEFORE_PATH_RE =
  /(?:\b(?:wrote|written|created|updated|modified|saved)\b|(?:Write|Update)\()(?:(?![.!?]\s)[^\n]){0,120}$/i
const COMPLETED_WRITE_AFTER_PATH_RE =
  /^[^\n]{0,80}\b(?:written|created|updated|modified|saved)\b/i
const RELATIVE_REPORT_PATH_RE = /(?:^|[\s('"`])((?:[\w.-]+\/)*report[\w.-]*\.md)(?=$|[\s)'"`,:])/i

/** Find a report path on a line that also proves a file write completed. */
export function findWrittenReportPath(scan: string, pattern?: string): string | null {
  let absolutePathRe: RegExp
  try {
    absolutePathRe = new RegExp(`(${pattern ?? DEFAULT_REPORT_PATH_PATTERN})`, 'i')
  } catch {
    absolutePathRe = new RegExp(`(${DEFAULT_REPORT_PATH_PATTERN})`, 'i')
  }

  const lines = scan.split(/\r?\n/)
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]
    const absolute = absolutePathRe.exec(line)
    const relative = absolute ? null : RELATIVE_REPORT_PATH_RE.exec(line)
    const match = absolute ?? relative
    if (!match?.[1]) continue

    const before = line.slice(0, match.index)
    const after = line.slice(match.index + match[0].length)
    if (!COMPLETED_WRITE_BEFORE_PATH_RE.test(before) && !COMPLETED_WRITE_AFTER_PATH_RE.test(after)) {
      continue
    }

    const path = match[1]
    return path.startsWith('/workspace/') ? path : `/workspace/${path.replace(/^\.\//, '')}`
  }

  return null
}
