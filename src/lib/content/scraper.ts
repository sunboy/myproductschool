// src/lib/content/scraper.ts
import * as cheerio from 'cheerio'

export interface ScrapeResult {
  title: string
  text: string
  dataPoints: string[]   // quantitative facts found in article
}

function extractDataPoints(text: string): string[] {
  // Match sentences with numbers, %, $, or stats
  const sentences = text.split(/[.!?]\s+/)
  return sentences
    .filter(s => /\d+(\.\d+)?[%$BMK]?|\b\d{4}\b/.test(s) && s.length > 20 && s.length < 200)
    .slice(0, 5)
    .map(s => s.trim())
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HackProduct/1.0)' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  // Remove nav, footer, scripts, ads
  $('nav, footer, script, style, aside, .ad, .advertisement, [aria-hidden="true"]').remove()

  const title = $('h1').first().text().trim() || $('title').text().trim()

  // Prefer article/main content
  const contentEl = $('article, main, [role="main"], .post-content, .article-body').first()
  const raw = contentEl.length ? contentEl.text() : $('body').text()

  // Normalise whitespace
  const text = raw.replace(/\s+/g, ' ').trim().slice(0, 8000)
  const dataPoints = extractDataPoints(text)

  return { title, text, dataPoints }
}
