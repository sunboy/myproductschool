#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const STAGED_ONLY = process.argv.includes('--staged')
const MAX_FILE_BYTES = 1024 * 1024

const SECRET_PATTERNS = [
  {
    name: 'JWT-looking token',
    re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  },
  {
    name: 'Supabase service role assignment',
    re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*["'][^"'\s]+["']/g,
  },
  {
    name: 'OpenAI API key',
    re: /sk-(?:proj|live|test|svcacct)-[A-Za-z0-9_-]{20,}/g,
  },
  {
    name: 'Anthropic API key',
    re: /sk-ant-[A-Za-z0-9_-]{20,}/g,
  },
]

const SKIP_DIRS = new Set([
  '.git',
  '.next',
  'node_modules',
  'public/sql.js',
])

function runGit(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' })
}

function candidateFiles() {
  const output = STAGED_ONLY
    ? runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
    : runGit(['ls-files'])

  return output
    .split('\n')
    .map(file => file.trim())
    .filter(Boolean)
    .filter(file => ![...SKIP_DIRS].some(dir => file === dir || file.startsWith(`${dir}/`)))
}

function isProbablyText(buffer) {
  return !buffer.includes(0)
}

function scanFile(file) {
  const absolute = path.join(ROOT, file)
  if (!fs.existsSync(absolute)) return []

  const stat = fs.statSync(absolute)
  if (!stat.isFile() || stat.size > MAX_FILE_BYTES) return []

  const buffer = fs.readFileSync(absolute)
  if (!isProbablyText(buffer)) return []

  const text = buffer.toString('utf8')
  const findings = []

  for (const pattern of SECRET_PATTERNS) {
    pattern.re.lastIndex = 0
    for (const match of text.matchAll(pattern.re)) {
      const line = text.slice(0, match.index ?? 0).split('\n').length
      findings.push({ file, line, name: pattern.name })
    }
  }

  return findings
}

const findings = candidateFiles().flatMap(scanFile)

if (findings.length > 0) {
  console.error('Secret scan failed. Remove these values before committing:')
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.name}`)
  }
  process.exit(1)
}

console.log(`Secret scan passed (${STAGED_ONLY ? 'staged files' : 'tracked files'}).`)
