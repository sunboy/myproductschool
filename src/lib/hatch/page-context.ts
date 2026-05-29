'use client'

export interface HatchPageContextSection {
  label: string
  text: string
}

export interface HatchPageSnapshot {
  title?: string
  url?: string
  selectedText?: string
  visibleText?: string
  headings?: string[]
  sections?: HatchPageContextSection[]
}

export interface HatchPageContextParams {
  slug?: string
  chapterSlug?: string
  id?: string
}

export interface HatchPageContext {
  pageType: string
  entityId: string | null
  pathname: string
  params?: HatchPageContextParams
  snapshot?: HatchPageSnapshot
}

const MAX_SECTION_COUNT = 6
const HATCH_EXCLUDE_SELECTOR = [
  '[data-hatch-ignore]',
  '[data-hatch-chat]',
  '[data-hatch-target-marker]',
  'script',
  'style',
  'noscript',
  'template',
].join(',')

export function parseHatchPageContext(pathname: string): Omit<HatchPageContext, 'snapshot'> {
  const challengeWorkspace = pathname.match(/^\/workspace\/challenges\/([^/]+)/)
  if (challengeWorkspace) {
    return {
      pageType: 'challenge',
      entityId: challengeWorkspace[1],
      pathname,
      params: { slug: challengeWorkspace[1], id: challengeWorkspace[1] },
    }
  }

  const challengeFeedback = pathname.match(/^\/challenges\/([^/]+)\/feedback/)
  if (challengeFeedback) {
    return {
      pageType: 'challenge_feedback',
      entityId: challengeFeedback[1],
      pathname,
      params: { slug: challengeFeedback[1], id: challengeFeedback[1] },
    }
  }

  const studyPlan = pathname.match(/^\/explore\/plans\/([^/]+)/)
  if (studyPlan) {
    return {
      pageType: 'study_plan',
      entityId: studyPlan[1],
      pathname,
      params: { slug: studyPlan[1] },
    }
  }

  const domain = pathname.match(/^\/explore\/domains\/([^/]+)/) ?? pathname.match(/^\/domains\/([^/]+)/)
  if (domain) {
    return {
      pageType: 'domain',
      entityId: domain[1],
      pathname,
      params: { slug: domain[1] },
    }
  }

  const moduleMatch =
    pathname.match(/^\/explore\/modules\/([^/]+)/) ??
    pathname.match(/^\/learn\/modules\/([^/]+)/) ??
    pathname.match(/^\/learn\/(?!modules(?:\/|$)|plans(?:\/|$)|domains(?:\/|$)|flow(?:\/|$))([^/]+)/)
  if (moduleMatch) {
    const chapterSlug = readActiveChapterSlug()
    return {
      pageType: 'learning_module',
      entityId: moduleMatch[1],
      pathname,
      params: { slug: moduleMatch[1], ...(chapterSlug ? { chapterSlug } : {}) },
    }
  }

  if (pathname.startsWith('/dashboard')) return { pageType: 'dashboard', entityId: null, pathname }
  if (pathname.startsWith('/explore')) return { pageType: 'explore', entityId: null, pathname }
  if (pathname.startsWith('/challenges')) return { pageType: 'practice', entityId: null, pathname }
  if (pathname.startsWith('/progress')) return { pageType: 'progress', entityId: null, pathname }
  if (pathname.startsWith('/live-interviews')) return { pageType: 'live_interviews', entityId: null, pathname }

  return { pageType: 'general', entityId: null, pathname }
}

export function buildHatchPageContext(pathname: string): HatchPageContext {
  const context = parseHatchPageContext(pathname)
  return {
    ...context,
    snapshot: collectHatchPageSnapshot(),
  }
}

export function collectHatchPageSnapshot(): HatchPageSnapshot | undefined {
  if (typeof document === 'undefined' || typeof window === 'undefined') return undefined

  const activeRoot = document.querySelector<HTMLElement>('[data-hatch-context-root]')
  const root = activeRoot ?? document.querySelector<HTMLElement>('main') ?? document.body
  if (!root) return undefined

  const selectedText = cleanText(document.getSelection()?.toString() ?? '', 4000)
  const title = cleanText(
    document.querySelector<HTMLElement>('[data-hatch-page-title]')?.innerText ??
      root.querySelector<HTMLElement>('h1')?.innerText ??
      document.title,
    300,
  )
  const headings = Array.from(root.querySelectorAll<HTMLElement>('h1, h2, h3'))
    .filter(isContextReadable)
    .map((heading) => cleanText(heading.innerText, 240))
    .filter(Boolean)
    .slice(0, 12)

  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-hatch-context]'))
    .filter(isContextReadable)
    .map((element) => ({
      label: cleanText(element.dataset.hatchContext || 'Page section', 80),
      text: cleanText(readElementText(element), 1600),
    }))
    .filter((section) => section.label && section.text)
    .slice(0, MAX_SECTION_COUNT)

  const visibleText = cleanText(readElementText(root), 6500)
  const snapshot: HatchPageSnapshot = {}

  if (title) snapshot.title = title
  if (typeof window !== 'undefined') snapshot.url = window.location.href
  if (selectedText) snapshot.selectedText = selectedText
  if (visibleText) snapshot.visibleText = visibleText
  if (headings.length) snapshot.headings = headings
  if (sections.length) snapshot.sections = sections

  return Object.keys(snapshot).length ? snapshot : undefined
}

function readActiveChapterSlug(): string | undefined {
  if (typeof document === 'undefined' || typeof window === 'undefined') return undefined

  const explicit = document.querySelector<HTMLElement>('[data-hatch-active-chapter]')?.dataset.hatchActiveChapter
  if (explicit) return explicit

  const fromSearch = new URLSearchParams(window.location.search).get('chapter')
  return fromSearch || undefined
}

function isContextReadable(element: HTMLElement): boolean {
  if (element.closest(HATCH_EXCLUDE_SELECTOR)) return false
  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden') return false
  return true
}

function readElementText(element: HTMLElement): string {
  if (element.closest(HATCH_EXCLUDE_SELECTOR)) return ''

  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelectorAll(HATCH_EXCLUDE_SELECTOR).forEach((node) => node.remove())
  return clone.innerText || clone.textContent || ''
}

function cleanText(text: string, maxLength: number): string {
  const normalized = text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (normalized.length <= maxLength) return normalized
  return normalized.slice(0, maxLength - 1).trimEnd() + '…'
}
