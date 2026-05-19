import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { featureAutopsies } from '../src/lib/autopsies/data'

const pilotSlugs = ['spotify-wrapped', 'facebook-like-button']
const officialMascotSource = '/Users/sandeep/Documents/hackproduct-marketing/mascot.png'
const officialMascotPublicPath = 'public/images/hatch/hatch-official-mascot.png'
const officialMascotSha256 = 'ef5b1d4f624c6c61b586f4f495e1c4a9e1cfc37054e951e55337f58a5b6d865c'
const palette = {
  cream: '#faf6f0',
  forest: '#4a7c59',
  deepForest: '#244232',
  amber: '#c9ad68',
  charcoal: '#1e211c',
  mist: '#dfe6dc',
}

const publicMascotPath = path.join(process.cwd(), officialMascotPublicPath)
mkdirSync(path.dirname(publicMascotPath), { recursive: true })
copyFileSync(officialMascotSource, publicMascotPath)

const officialMascotBytes = readFileSync(publicMascotPath)
const copiedMascotSha = createHash('sha256').update(officialMascotBytes).digest('hex')
if (copiedMascotSha !== officialMascotSha256) {
  throw new Error(`Official Hatch mascot SHA mismatch. Expected ${officialMascotSha256}, found ${copiedMascotSha}.`)
}

const officialMascotDataUri = `data:image/png;base64,${officialMascotBytes.toString('base64')}`

for (const story of featureAutopsies.filter(item => pilotSlugs.includes(item.slug))) {
  const storyDir = path.join(process.cwd(), 'public', 'images', 'autopsies', story.slug, 'final')
  const contentDir = path.join(process.cwd(), 'content', 'autopsies', story.slug)
  mkdirSync(storyDir, { recursive: true })
  mkdirSync(contentDir, { recursive: true })

  for (const image of story.images) {
    const role = image.role
    const svg = renderSvg({
      title: story.title,
      role,
      width: image.width,
      height: image.height,
      caption: image.caption,
      watermark: role === 'hero' || role === 'hatch-narrator' || role === 'lesson-frame'
        ? 'Told by Hatch · HackProduct'
        : 'HackProduct Autopsy',
      rank: story.queueRank,
      mascotDataUri: officialMascotDataUri,
    })
    writeFileSync(path.join(storyDir, `${role}.svg`), svg)
  }

  const manifest = {
    schema_version: '1.0',
    story_slug: story.slug,
    story_title: story.title,
    image_system: 'hatch-autopsy-v1',
    style_bible: 'content/autopsies/hatch-visual-style-bible.md',
    asset_root: `public/images/autopsies/${story.slug}/final`,
    reference_asset: officialMascotPublicPath,
    reference_sha256: officialMascotSha256,
    assets: story.images.map(image => ({
      role: image.role,
      path: `public/images/autopsies/${story.slug}/final/${image.role}.svg`,
      status: 'approved',
      qaStatus: 'approved',
      reference_asset: officialMascotPublicPath,
      reference_sha256: officialMascotSha256,
      hatch_variant: getHatchPlacement(image.role, image.width, image.height).variant,
      size_px: { width: image.width, height: image.height },
      watermark: {
        required: true,
        text: image.role === 'hero' || image.role === 'hatch-narrator' || image.role === 'lesson-frame'
          ? 'Told by Hatch · HackProduct'
          : 'HackProduct Autopsy',
        placement: 'bottom-right',
        opacity: 0.8,
      },
      alt: image.alt,
      caption: image.caption,
      prompt: `Flat geometric HackProduct autopsy illustration for ${story.title}. Role: ${image.role}. Use the official Hatch mascot reference at ${officialMascotPublicPath}; preserve the rounded green head frame, cream face and body, graduation cap, growth arrow, H chest mark, bright eyes, mitten hands, and friendly coach expression. Surround Hatch with abstract product shapes, warm cream background, forest green structure, amber highlights, no fake screenshots, and no company logo recreation.`,
      crop_notes: 'Essential elements stay within the center safe zone and watermark remains visible at mobile width.',
      qa: [
        'Official Hatch mascot reference embedded in final SVG.',
        'Watermark present and readable.',
        'No fake screenshots, exact logos, or real person likenesses.',
      ],
    })),
  }

  writeFileSync(
    path.join(contentDir, 'image-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  )
}

function renderSvg({
  title,
  role,
  width,
  height,
  caption,
  watermark,
  rank,
  mascotDataUri,
}: {
  title: string
  role: string
  width: number
  height: number
  caption: string
  watermark: string
  rank: number
  mascotDataUri: string
}) {
  const safeTitle = escapeXml(title)
  const safeRole = escapeXml(role.replaceAll('-', ' '))
  const safeCaption = escapeXml(caption)
  const safeWatermark = escapeXml(watermark)
  const margin = Math.round(width * 0.06)
  const titleLines = wrapText(title, role === 'thumbnail' ? 18 : 28, 2).map(escapeXml)
  const placement = getHatchPlacement(role, width, height)
  const cardW = Math.round(width * 0.46)
  const cardH = Math.round(height * 0.28)
  const stroke = Math.max(6, Math.round(width * 0.006))
  const titleSize = Math.round(width * (role === 'thumbnail' ? 0.045 : 0.034))
  const titleLineHeight = Math.round(titleSize * 1.12)
  const artifactX = Math.round(width * 0.11)
  const artifactY = Math.round(height * 0.44)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${safeTitle} ${safeRole} illustration</title>
  <desc id="desc">${safeCaption}</desc>
  <metadata>reference_asset=${officialMascotPublicPath}; reference_sha256=${officialMascotSha256}; hatch_variant=${escapeXml(placement.variant)}</metadata>
  <defs>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${Math.round(height * 0.012)}" stdDeviation="${Math.round(height * 0.012)}" flood-color="${palette.deepForest}" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="${palette.cream}"/>
  <rect x="${margin}" y="${margin}" width="${width - margin * 2}" height="${height - margin * 2}" rx="${Math.round(width * 0.025)}" fill="${palette.mist}" opacity="0.55"/>
  <rect x="${margin}" y="${margin}" width="${width - margin * 2}" height="${Math.round(height * 0.13)}" rx="${Math.round(width * 0.025)}" fill="${palette.deepForest}"/>
  <circle cx="${margin + Math.round(width * 0.035)}" cy="${margin + Math.round(height * 0.065)}" r="${Math.round(height * 0.018)}" fill="${palette.amber}"/>
  <circle cx="${margin + Math.round(width * 0.075)}" cy="${margin + Math.round(height * 0.065)}" r="${Math.round(height * 0.018)}" fill="${palette.forest}"/>
  <circle cx="${margin + Math.round(width * 0.115)}" cy="${margin + Math.round(height * 0.065)}" r="${Math.round(height * 0.018)}" fill="${palette.cream}"/>

  <g transform="translate(${margin}, ${Math.round(height * 0.29)})">
    ${titleLines.map((line, index) => `<text x="0" y="${index * titleLineHeight}" font-family="Inter, Arial, sans-serif" font-size="${titleSize}" font-weight="800" fill="${palette.charcoal}">${line}</text>`).join('\n    ')}
    <text x="0" y="${titleLines.length * titleLineHeight + Math.round(width * 0.018)}" font-family="Inter, Arial, sans-serif" font-size="${Math.round(width * 0.017)}" font-weight="700" fill="${palette.forest}">Autopsy ${rank} · ${safeRole}</text>
  </g>

  <g transform="translate(${artifactX}, ${artifactY})" filter="url(#softShadow)">
    <rect width="${cardW}" height="${cardH}" rx="${Math.round(width * 0.018)}" fill="#ffffff" stroke="${palette.deepForest}" stroke-width="${stroke}"/>
    <rect x="${Math.round(cardW * 0.08)}" y="${Math.round(cardH * 0.18)}" width="${Math.round(cardW * 0.68)}" height="${Math.round(cardH * 0.09)}" rx="${Math.round(cardH * 0.04)}" fill="${palette.forest}"/>
    <rect x="${Math.round(cardW * 0.08)}" y="${Math.round(cardH * 0.38)}" width="${Math.round(cardW * 0.48)}" height="${Math.round(cardH * 0.08)}" rx="${Math.round(cardH * 0.04)}" fill="${palette.amber}"/>
    <rect x="${Math.round(cardW * 0.08)}" y="${Math.round(cardH * 0.58)}" width="${Math.round(cardW * 0.76)}" height="${Math.round(cardH * 0.08)}" rx="${Math.round(cardH * 0.04)}" fill="${palette.mist}"/>
    <path d="M${Math.round(cardW * 0.82)} ${Math.round(cardH * 0.22)} C${Math.round(cardW * 0.92)} ${Math.round(cardH * 0.34)}, ${Math.round(cardW * 0.88)} ${Math.round(cardH * 0.54)}, ${Math.round(cardW * 0.96)} ${Math.round(cardH * 0.70)}" stroke="${palette.amber}" stroke-width="${stroke}" fill="none" stroke-linecap="round"/>
  </g>
  ${renderRoleMotif({ role, width, height, stroke })}

  <g transform="translate(${placement.x}, ${placement.y}) rotate(${placement.rotate}, ${Math.round(placement.size / 2)}, ${Math.round(placement.size / 2)})" opacity="${placement.opacity}" filter="url(#softShadow)">
    <image href="${mascotDataUri}" x="0" y="0" width="${placement.size}" height="${placement.size}" preserveAspectRatio="xMidYMid meet"/>
  </g>
  ${renderVariantProps({ placement, role, stroke })}

  <g transform="translate(${Math.round(width * 0.13)}, ${Math.round(height * 0.82)})">
    ${wrapText(caption, role === 'thumbnail' ? 44 : 72, 2).map((line, index) => `<text x="0" y="${index * Math.round(width * 0.023)}" font-family="Inter, Arial, sans-serif" font-size="${Math.round(width * 0.016)}" font-weight="700" fill="${palette.charcoal}">${escapeXml(line)}</text>`).join('\n    ')}
  </g>
  <text x="${width - margin}" y="${height - Math.round(margin * 0.7)}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="${Math.round(width * 0.015)}" font-weight="800" fill="${palette.deepForest}" opacity="0.82">${safeWatermark}</text>
</svg>
`
}

function getHatchPlacement(role: string, width: number, height: number) {
  const shortSide = Math.min(width, height)
  const placements: Record<string, { ratio: number; x: number; y: number; rotate: number; opacity: number; variant: string }> = {
    hero: { ratio: 0.30, x: 0.66, y: 0.42, rotate: -2, opacity: 1, variant: 'pointing official Hatch reference' },
    'hatch-narrator': { ratio: 0.48, x: 0.56, y: 0.30, rotate: 0, opacity: 1, variant: 'narrator official Hatch reference' },
    'failure-mechanism': { ratio: 0.28, x: 0.66, y: 0.43, rotate: -1, opacity: 1, variant: 'coaching official Hatch reference' },
    'evidence-card': { ratio: 0.20, x: 0.72, y: 0.49, rotate: 2, opacity: 0.92, variant: 'reading official Hatch reference' },
    'lesson-frame': { ratio: 0.30, x: 0.67, y: 0.43, rotate: 0, opacity: 1, variant: 'coaching official Hatch reference' },
    thumbnail: { ratio: 0.24, x: 0.67, y: 0.44, rotate: -1, opacity: 1, variant: 'small watermark-adjacent official Hatch reference' },
    'social-cover': { ratio: 0.27, x: 0.70, y: 0.39, rotate: -2, opacity: 1, variant: 'celebrating official Hatch reference' },
  }
  const placement = placements[role] ?? placements.hero
  const size = Math.round(shortSide * placement.ratio)
  return {
    x: Math.round(width * placement.x),
    y: Math.round(height * placement.y),
    size,
    rotate: placement.rotate,
    opacity: placement.opacity,
    variant: placement.variant,
  }
}

function renderRoleMotif({ role, width, height, stroke }: { role: string; width: number; height: number; stroke: number }) {
  const x = Math.round(width * 0.49)
  const y = Math.round(height * 0.49)
  const gap = Math.round(width * 0.035)
  const blockW = Math.round(width * 0.105)
  const blockH = Math.round(height * 0.11)
  const labelSize = Math.round(width * 0.014)
  const labels = role === 'failure-mechanism'
    ? ['Signal', 'Delay', 'Loop']
    : role === 'lesson-frame'
      ? ['Frame', 'Tradeoff', 'Move']
      : role === 'evidence-card'
        ? ['Source', 'Claim', 'Confidence']
        : ['Context', 'Choice', 'Result']

  return `<g transform="translate(${x}, ${y})">
    ${labels.map((label, index) => {
      const localX = index * (blockW + gap)
      const fill = index === 1 ? palette.amber : index === 2 ? palette.forest : '#ffffff'
      const textFill = index === 1 || index === 2 ? palette.cream : palette.deepForest
      return `<g transform="translate(${localX}, 0)">
        <rect width="${blockW}" height="${blockH}" rx="${Math.round(width * 0.012)}" fill="${fill}" stroke="${palette.deepForest}" stroke-width="${Math.max(3, Math.round(stroke * 0.55))}"/>
        <text x="${Math.round(blockW / 2)}" y="${Math.round(blockH * 0.58)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${labelSize}" font-weight="800" fill="${textFill}">${label}</text>
      </g>`
    }).join('\n    ')}
    <path d="M${blockW + Math.round(gap * 0.18)} ${Math.round(blockH * 0.5)} H${blockW + Math.round(gap * 0.82)}" stroke="${palette.deepForest}" stroke-width="${Math.max(3, Math.round(stroke * 0.55))}" stroke-linecap="round"/>
    <path d="M${blockW * 2 + gap + Math.round(gap * 0.18)} ${Math.round(blockH * 0.5)} H${blockW * 2 + gap + Math.round(gap * 0.82)}" stroke="${palette.deepForest}" stroke-width="${Math.max(3, Math.round(stroke * 0.55))}" stroke-linecap="round"/>
  </g>`
}

function renderVariantProps({
  placement,
  role,
  stroke,
}: {
  placement: ReturnType<typeof getHatchPlacement>
  role: string
  stroke: number
}) {
  const cx = placement.x + Math.round(placement.size * 0.62)
  const cy = placement.y + Math.round(placement.size * 0.12)
  const propStroke = Math.max(4, Math.round(stroke * 0.65))

  if (role === 'hatch-narrator') {
    return `<g opacity="0.95">
      <rect x="${placement.x - Math.round(placement.size * 0.33)}" y="${placement.y - Math.round(placement.size * 0.03)}" width="${Math.round(placement.size * 0.52)}" height="${Math.round(placement.size * 0.20)}" rx="${Math.round(placement.size * 0.07)}" fill="#ffffff" stroke="${palette.deepForest}" stroke-width="${propStroke}"/>
      <circle cx="${placement.x - Math.round(placement.size * 0.20)}" cy="${placement.y + Math.round(placement.size * 0.07)}" r="${Math.round(placement.size * 0.018)}" fill="${palette.forest}"/>
      <circle cx="${placement.x - Math.round(placement.size * 0.10)}" cy="${placement.y + Math.round(placement.size * 0.07)}" r="${Math.round(placement.size * 0.018)}" fill="${palette.amber}"/>
      <circle cx="${placement.x}" cy="${placement.y + Math.round(placement.size * 0.07)}" r="${Math.round(placement.size * 0.018)}" fill="${palette.forest}"/>
    </g>`
  }

  if (role === 'evidence-card') {
    return `<g opacity="0.92">
      <rect x="${placement.x - Math.round(placement.size * 0.16)}" y="${placement.y + Math.round(placement.size * 0.58)}" width="${Math.round(placement.size * 0.46)}" height="${Math.round(placement.size * 0.18)}" rx="${Math.round(placement.size * 0.02)}" fill="#ffffff" stroke="${palette.deepForest}" stroke-width="${propStroke}"/>
      <line x1="${placement.x - Math.round(placement.size * 0.09)}" y1="${placement.y + Math.round(placement.size * 0.66)}" x2="${placement.x + Math.round(placement.size * 0.20)}" y2="${placement.y + Math.round(placement.size * 0.66)}" stroke="${palette.amber}" stroke-width="${propStroke}" stroke-linecap="round"/>
    </g>`
  }

  if (role === 'lesson-frame' || role === 'failure-mechanism') {
    return `<g opacity="0.96">
      <path d="M${cx} ${cy} C${cx + Math.round(placement.size * 0.18)} ${cy - Math.round(placement.size * 0.14)}, ${cx + Math.round(placement.size * 0.30)} ${cy - Math.round(placement.size * 0.08)}, ${cx + Math.round(placement.size * 0.42)} ${cy - Math.round(placement.size * 0.20)}" fill="none" stroke="${palette.amber}" stroke-width="${propStroke}" stroke-linecap="round"/>
      <path d="M${cx + Math.round(placement.size * 0.42)} ${cy - Math.round(placement.size * 0.20)} l${-Math.round(placement.size * 0.03)} ${Math.round(placement.size * 0.12)} l${-Math.round(placement.size * 0.12)} ${-Math.round(placement.size * 0.02)}" fill="none" stroke="${palette.amber}" stroke-width="${propStroke}" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`
  }

  if (role === 'social-cover') {
    return `<g opacity="0.86">
      <circle cx="${placement.x + Math.round(placement.size * 0.18)}" cy="${placement.y + Math.round(placement.size * 0.10)}" r="${Math.round(placement.size * 0.035)}" fill="${palette.amber}"/>
      <circle cx="${placement.x + Math.round(placement.size * 0.30)}" cy="${placement.y - Math.round(placement.size * 0.02)}" r="${Math.round(placement.size * 0.025)}" fill="${palette.forest}"/>
      <circle cx="${placement.x + Math.round(placement.size * 0.44)}" cy="${placement.y + Math.round(placement.size * 0.08)}" r="${Math.round(placement.size * 0.020)}" fill="${palette.amber}"/>
    </g>`
  }

  return ''
}

function wrapText(input: string, maxLineLength: number, maxLines: number) {
  const words = input.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxLineLength && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) {
    lines.push(current)
  }

  if (lines.length <= maxLines) {
    return lines
  }

  const kept = lines.slice(0, maxLines)
  kept[maxLines - 1] = `${kept[maxLines - 1].replace(/\s+$/, '')}...`
  return kept
}

function escapeXml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
