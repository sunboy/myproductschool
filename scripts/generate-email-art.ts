import * as fs from 'fs'
import * as path from 'path'

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.error('OPENAI_API_KEY not set in environment — stopping.')
  process.exit(1)
}

const OUTPUT_DIR = path.join(process.cwd(), 'public/images/email')
fs.mkdirSync(OUTPUT_DIR, { recursive: true })

// Shared style preamble for cohesion across all poses
const STYLE =
  'Flat line-art illustration style. Forest green #4a7c59 ink lines on a cream #faf6f0 background. ' +
  'Clean whimsical cartoon, crisp vector-like edges, no gradients, no photorealism, no shadows. ' +
  '1024x1024.'

// Canonical Hatch traits injected into every prompt
const HATCH_DESC =
  'Hatch is a small friendly robot mascot with a rounded forest-green head frame, ' +
  'cream face and cream body, a graduation cap (mortarboard) on top, a small upward growth arrow ' +
  'attached near the cap, a green H mark on its chest, bright friendly cartoon eyes, ' +
  'and simple mitten hands.'

const POSES: Array<{ name: string; prompt: string }> = [
  {
    name: 'hatch-wave',
    prompt:
      `${HATCH_DESC} Hatch is warmly waving hello with one hand raised high, ` +
      `big welcoming smile on its screen-face, open posture, slightly bouncing energy. ` +
      `${STYLE}`,
  },
  {
    name: 'hatch-point',
    prompt:
      `${HATCH_DESC} Hatch is gesturing enthusiastically with one arm extended, ` +
      `pointing toward an unfinished-looking checkmark list floating beside it. ` +
      `Hatch has an encouraging, nudging expression, leaning slightly forward. ` +
      `${STYLE}`,
  },
  {
    name: 'hatch-read',
    prompt:
      `${HATCH_DESC} Hatch is sitting and reading an open book or article page, ` +
      `one finger tracing the text, focused and curious expression, leaning slightly over the page. ` +
      `${STYLE}`,
  },
  {
    name: 'hatch-unlock',
    prompt:
      `${HATCH_DESC} Hatch is holding a large old-fashioned key in both mitten hands, ` +
      `lifting it toward a glowing open padlock floating in front of it. ` +
      `Hatch has an excited, proud expression, eyes wide. ` +
      `${STYLE}`,
  },
  {
    name: 'hatch-celebrate',
    prompt:
      `${HATCH_DESC} Hatch is celebrating with both arms raised in victory, ` +
      `small sparkles and star bursts around it, graduation cap slightly askew from the excitement, ` +
      `wide joyful smile on its screen-face. ` +
      `${STYLE}`,
  },
  {
    name: 'hatch-insight',
    prompt:
      `${HATCH_DESC} Hatch is holding a small bar chart in one hand and a lit lightbulb in the other, ` +
      `looking thoughtfully at the chart with one eye slightly wider as if having an insight. ` +
      `Small upward arrow on the chart. ` +
      `${STYLE}`,
  },
]

async function generateImage(name: string, prompt: string): Promise<void> {
  console.log(`\nGenerating: ${name}...`)

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      output_format: 'png',
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`API error for ${name}: ${JSON.stringify(data)}`)
  }

  const imageData = data.data?.[0]?.b64_json
  if (!imageData) {
    throw new Error(`No image data returned for ${name}: ${JSON.stringify(data)}`)
  }

  const outputPath = path.join(OUTPUT_DIR, `${name}.png`)
  fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'))

  const stats = fs.statSync(outputPath)
  console.log(`✓ Saved: ${outputPath} (${stats.size} bytes)`)
}

async function main() {
  console.log('Generating 6 Hatch email art illustrations for HackProduct...')
  console.log(`Output directory: ${OUTPUT_DIR}`)

  for (const { name, prompt } of POSES) {
    try {
      await generateImage(name, prompt)
    } catch (err) {
      console.error(`✗ Failed to generate ${name}:`, err)
      process.exit(1)
    }
  }

  console.log('\n✅ All 6 email art images generated successfully.')

  console.log('\nFinal file list:')
  for (const { name } of POSES) {
    const outputPath = path.join(OUTPUT_DIR, `${name}.png`)
    const stats = fs.statSync(outputPath)
    console.log(`  ${outputPath} — ${stats.size} bytes`)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
