/**
 * Generate system design + data modeling interview challenges using Claude Haiku.
 * Writes staged output to seeds/staged-interview-challenges.json with approved: false.
 *
 * Run with:
 *   ANTHROPIC_API_KEY=... npx tsx scripts/seed-interview-challenges.ts
 *
 * After reviewing, set approved: true on the challenges you want to publish,
 * then run: npx tsx scripts/commit-interview-seeds.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_DESIGN_PROMPT = (alreadyCovered: string[], difficulty: string) => `
You are generating an original system design interview question for HackProduct.

RESEARCH PHASE: Survey common system design interview topics for difficulty: ${difficulty}.
Domains: URL shorteners, chat apps, social feeds, rate limiters, notification systems,
video streaming, ride-sharing, payment processing, search engines, caching layers,
leaderboards, ticket booking, file storage, recommendation engines.
Already covered in this batch: ${alreadyCovered.join(', ') || 'none'}.
Pick a domain NOT already covered.

GENERATION: Write an ORIGINAL problem brief. Domain can be familiar, scenario must be fresh.

REQUIREMENTS:
- Problem statement: 150-300 words
- Clear functional requirements (what users do)
- Scale assumptions (users, QPS, data size)
- 5-10 required components for a strong answer
- 3-5 scalability considerations

OUTPUT — return ONLY valid JSON, no preamble, no markdown fences:
{
  "title": "Design a Rate Limiter",
  "difficulty": "standard",
  "estimated_minutes": 45,
  "industry": "infrastructure",
  "problem_statement_markdown": "...",
  "metadata": {
    "requirements": ["...", "..."],
    "required_components": ["API Gateway", "Redis cluster", "Token bucket algorithm", "..."],
    "scalability_signals": ["horizontal scaling", "distributed rate tracking", "..."],
    "reference_diagram_description": "Clients hit an API Gateway..."
  }
}
`

const DATA_MODELING_PROMPT = (alreadyCovered: string[], difficulty: string) => `
You are generating an original data modeling interview question for HackProduct.

RESEARCH PHASE: Survey common data modeling scenarios for difficulty: ${difficulty}.
Domains: e-commerce, social graphs, booking/scheduling, content platforms,
finance, healthcare, multi-tenant SaaS, inventory, event ticketing.
Already covered: ${alreadyCovered.join(', ') || 'none'}.
Pick a domain NOT already covered.

GENERATION: Write an ORIGINAL prompt. Include at least one non-trivial modeling challenge
(temporal validity, soft deletes, M:M with attributes, polymorphic relationships, multi-tenancy).

REQUIREMENTS:
- Problem statement: 100-250 words
- 5-10 business requirements
- 4-8 core entities
- Relationships and constraints to model

OUTPUT — return ONLY valid JSON, no preamble, no markdown fences:
{
  "title": "Design an Event Ticketing Schema",
  "difficulty": "standard",
  "estimated_minutes": 30,
  "industry": "events",
  "problem_statement_markdown": "...",
  "metadata": {
    "requirements": ["...", "..."],
    "required_entities": ["Event", "Venue", "Ticket", "Order", "User"],
    "modeling_signals": ["soft delete via deleted_at", "M:M with price attributes", "..."],
    "reference_schema_description": "..."
  }
}
`

async function generateChallenge(
  category: 'system_design' | 'data_modeling',
  alreadyCovered: string[],
  difficulty: string
): Promise<Record<string, unknown> | null> {
  const prompt =
    category === 'system_design'
      ? SYSTEM_DESIGN_PROMPT(alreadyCovered, difficulty)
      : DATA_MODELING_PROMPT(alreadyCovered, difficulty)

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('\n')

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error(`  Error generating ${category}: ${(err as Error).message}`)
    return null
  }
}

async function main() {
  const difficulties = {
    system_design: ['standard', 'standard', 'advanced', 'standard', 'advanced'],
    data_modeling: ['standard', 'standard', 'advanced', 'standard', 'advanced'],
  }

  const staged: unknown[] = []

  for (const category of ['system_design', 'data_modeling'] as const) {
    console.log(`\nGenerating ${category} challenges...`)
    const covered: string[] = []
    const diffs = difficulties[category]

    for (let i = 0; i < 5; i++) {
      console.log(`  [${i + 1}/5] difficulty: ${diffs[i]}...`)
      const challenge = await generateChallenge(category, covered, diffs[i])
      if (challenge) {
        covered.push((challenge.title as string) ?? '')
        staged.push({
          ...challenge,
          challenge_type: category,
          approved: false,
          generated_at: new Date().toISOString(),
        })
        console.log(`  Generated: "${challenge.title}"`)
      } else {
        console.log(`  Skipped`)
      }
    }
  }

  const outDir = path.join(process.cwd(), 'seeds')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'staged-interview-challenges.json')
  fs.writeFileSync(outPath, JSON.stringify(staged, null, 2))
  console.log(`\n${staged.length} challenges staged -> ${outPath}`)
  console.log('Review each, set approved: true, then run: npx tsx scripts/commit-interview-seeds.ts')
}

main().catch(console.error)
