import fs from 'node:fs'
import path from 'node:path'

const stagedPath = path.resolve('seeds/staged-interview-challenges.json')
const sources = [
  '/tmp/scraped-python-challenges.json',
  '/tmp/scraped-java-challenges.json',
  '/tmp/scraped-sql-challenges.json',
]

const staged: Array<Record<string, unknown>> = JSON.parse(fs.readFileSync(stagedPath, 'utf-8'))
const existingTitles = new Set(staged.map(c => c.title as string))

let added = 0
for (const src of sources) {
  if (!fs.existsSync(src)) {
    console.warn(`skip missing ${src}`)
    continue
  }
  const arr: Array<Record<string, unknown>> = JSON.parse(fs.readFileSync(src, 'utf-8'))
  for (const c of arr) {
    if (existingTitles.has(c.title as string)) {
      console.warn(`skip duplicate title: ${c.title}`)
      continue
    }
    c.approved = true
    staged.push(c)
    existingTitles.add(c.title as string)
    added++
  }
}

fs.writeFileSync(stagedPath, JSON.stringify(staged, null, 2))
console.log(`merged ${added} new challenges into ${stagedPath}`)
console.log(`total entries: ${staged.length}`)
const codingApproved = staged.filter(c => c.challenge_type === 'coding' && c.approved === true)
console.log(`coding (approved): ${codingApproved.length}`)
