import { getSingletonHighlighter, type BundledLanguage } from 'shiki'

// Shared across every code block in a chapter (and across chapters) — Shiki's
// own singleton loads each language grammar once and reuses the WASM engine,
// so repeated calls here are cheap after the first hit for a given language.
const LOADED_LANGS = new Set<string>(['python', 'sql', 'javascript', 'typescript', 'json', 'bash'])

const FALLBACK_LANG = 'text'

function normalizeLang(lang: string): string {
  const l = lang.trim().toLowerCase()
  if (l === 'py') return 'python'
  if (l === 'js') return 'javascript'
  if (l === 'ts') return 'typescript'
  if (l === 'sh' || l === 'shell') return 'bash'
  return l || FALLBACK_LANG
}

/**
 * Server-safe-shaped (no DOM APIs used) HTML string for a highlighted code
 * block. Falls back to an unhighlighted <pre><code> block — matching the
 * pane's existing plain-code styling — if the language isn't recognized or
 * highlighting fails for any reason, so a bad `lang` token never breaks the
 * chapter body.
 */
export async function highlightCodeHtml(code: string, lang: string): Promise<string> {
  const normalized = normalizeLang(lang)
  try {
    const highlighter = await getSingletonHighlighter({
      themes: ['github-dark'],
      langs: normalized === FALLBACK_LANG ? [] : [normalized as BundledLanguage],
    })
    if (normalized !== FALLBACK_LANG && !highlighter.getLoadedLanguages().includes(normalized)) {
      await highlighter.loadLanguage(normalized as BundledLanguage)
    }
    LOADED_LANGS.add(normalized)
    return highlighter.codeToHtml(code, {
      lang: normalized === FALLBACK_LANG ? 'text' : normalized,
      theme: 'github-dark',
    })
  } catch {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<pre class="bg-inverse-surface rounded-lg p-4 overflow-x-auto text-sm font-mono text-inverse-on-surface my-4 whitespace-pre"><code>${escaped}</code></pre>`
  }
}
