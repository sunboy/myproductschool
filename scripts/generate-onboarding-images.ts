import * as fs from 'fs'
import * as path from 'path'

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.error('OPENAI_API_KEY not set in environment — stopping.')
  process.exit(1)
}

const OUTPUT_DIR = path.join(process.cwd(), 'public/onboarding')
fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const SCENES: Array<{ screen: string; prompt: string }> = [
  {
    screen: 'intro',
    prompt:
      'Hatch, a small friendly robot mascot with a graduation cap (mortarboard) and a small upward growth arrow icon on its upper-right body, warmly waving hello with one hand raised and a big welcoming smile on its screen-face. Subtle line-art illustration style. Forest green #4a7c59 ink lines on a transparent background. Clean whimsical cartoon, welcoming gesture, open posture, slightly bouncing energy. 1024x1024.',
  },
  {
    screen: 'role',
    prompt:
      'Hatch, a small friendly robot mascot with a graduation cap (mortarboard) and a small upward growth arrow on its upper-right body, holding a small fan of role badge cards in its hands — the cards show simple icons for different engineering roles. Subtle line-art illustration style. Forest green #4a7c59 ink lines on a transparent background. Clean whimsical cartoon, inquisitive expression, presenting options. 1024x1024.',
  },
  {
    screen: 'context',
    prompt:
      'Hatch, a small friendly robot mascot with a graduation cap (mortarboard) and a small upward growth arrow on its upper-right body, standing at a crossroads signpost. One sign points toward a laptop/desk icon (on-the-job), another sign points toward a briefcase/interview icon. Hatch looks thoughtfully at the signs. Subtle line-art illustration style. Forest green #4a7c59 ink lines on a transparent background. Clean whimsical cartoon. 1024x1024.',
  },
  {
    screen: 'goal',
    prompt:
      'Hatch, a small friendly robot mascot with a graduation cap (mortarboard) and a small upward growth arrow on its upper-right body, looking upward with determination at a mountain summit with a small flag at the top. A dotted path curves up the mountain. Hatch has an ambitious, focused expression. Subtle line-art illustration style. Forest green #4a7c59 ink lines on a transparent background. Clean whimsical cartoon. 1024x1024.',
  },
  {
    screen: 'timeline',
    prompt:
      'Hatch, a small friendly robot mascot with a graduation cap (mortarboard) and a small upward growth arrow on its upper-right body, holding a small calendar in one hand and an hourglass in the other. Hatch looks at the calendar with a thoughtful, planning expression. Subtle line-art illustration style. Forest green #4a7c59 ink lines on a transparent background. Clean whimsical cartoon. 1024x1024.',
  },
  {
    screen: 'calibration',
    prompt:
      'Hatch, a small friendly robot mascot with a graduation cap (mortarboard) and a small upward growth arrow on its upper-right body, in a listening pose — headphones on, holding a small notepad and pencil, eyes wide open and attentive. Hatch is in observation mode, ready to assess. Subtle line-art illustration style. Forest green #4a7c59 ink lines on a transparent background. Clean whimsical cartoon. 1024x1024.',
  },
  {
    screen: 'results',
    prompt:
      'Hatch, a small friendly robot mascot with a graduation cap (mortarboard) and a small upward growth arrow on its upper-right body, celebrating with arms raised in victory. Small sparkles and star bursts around it, graduation cap slightly askew from the excitement. Wide joyful smile on its screen-face. Subtle line-art illustration style. Forest green #4a7c59 ink lines on a transparent background. Clean whimsical cartoon. 1024x1024.',
  },
]

async function generateImage(screen: string, prompt: string): Promise<void> {
  console.log(`\nGenerating: ${screen}...`)

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
      background: 'transparent',
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`API error for ${screen}: ${JSON.stringify(data)}`)
  }

  const imageData = data.data?.[0]?.b64_json
  if (!imageData) {
    throw new Error(`No image data returned for ${screen}: ${JSON.stringify(data)}`)
  }

  const outputPath = path.join(OUTPUT_DIR, `${screen}.png`)
  fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'))

  const stats = fs.statSync(outputPath)
  console.log(`✓ Saved: ${outputPath} (${stats.size} bytes)`)
}

async function main() {
  console.log('Generating 7 onboarding illustrations for HackProduct...')
  console.log(`Output directory: ${OUTPUT_DIR}`)

  for (const { screen, prompt } of SCENES) {
    try {
      await generateImage(screen, prompt)
    } catch (err) {
      console.error(`✗ Failed to generate ${screen}:`, err)
      process.exit(1)
    }
  }

  console.log('\n✅ All 7 onboarding images generated successfully.')

  // Print final summary
  console.log('\nFinal file list:')
  for (const { screen } of SCENES) {
    const outputPath = path.join(OUTPUT_DIR, `${screen}.png`)
    const stats = fs.statSync(outputPath)
    console.log(`  ${outputPath} — ${stats.size} bytes`)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
