import { existsSync, readFileSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { featureAutopsies } from '../src/lib/autopsies/data'
import { AUTOPSY_REQUIRED_IMAGE_ROLES, AUTOPSY_WATERMARK_OPTIONS } from '../src/lib/autopsies/constants'
import { validateAutopsyContent } from '../src/lib/autopsies/validation'
import type { AutopsyValidationIssue } from '../src/lib/autopsies/types'

interface ManifestAsset {
  role?: string
  path?: string
  file?: string
  alt?: string
  caption?: string
  size_px?: {
    width?: number
    height?: number
  }
  watermark?: boolean | {
    required?: boolean
    text?: string
    placement?: string
    rendered?: boolean
  }
  qaStatus?: string
  qa_status?: string
  status?: string
  reference_asset?: string
  reference_sha256?: string
  hatch_variant?: string
  storage_bucket?: string
  storage_path?: string
  storage_version?: string
  public_url?: string
  final_image_sha256?: string
}

interface ImageManifest {
  story_slug?: string
  storySlug?: string
  asset_root?: string
  reference_asset?: string
  reference_sha256?: string
  storage_bucket?: string
  storage_version?: string
  storage_asset_root?: string
  assets?: ManifestAsset[]
}

const cwd = process.cwd()
const officialMascotReferenceAsset = 'public/images/hatch/hatch-official-mascot.png'
const officialMascotSha256 = 'ef5b1d4f624c6c61b586f4f495e1c4a9e1cfc37054e951e55337f58a5b6d865c'

const issues: AutopsyValidationIssue[] = [
  ...validateAutopsyContent(),
  ...validateOfficialHatchReference(),
  ...validateImageManifests(),
]

const errors = issues.filter(issue => issue.level === 'error')
const warnings = issues.filter(issue => issue.level === 'warning')

for (const warning of warnings) {
  console.warn(`WARN ${warning.path}: ${warning.message}`)
}

for (const error of errors) {
  console.error(`ERROR ${error.path}: ${error.message}`)
}

if (errors.length > 0) {
  console.error(`Autopsy validation failed with ${errors.length} error(s).`)
  process.exit(1)
}

console.log(`Autopsy validation passed for ${featureAutopsies.length} queued feature autopsies.`)

function validateOfficialHatchReference(): AutopsyValidationIssue[] {
  const referenceIssues: AutopsyValidationIssue[] = []
  const referencePath = path.join(cwd, officialMascotReferenceAsset)

  if (!existsSync(referencePath)) {
    referenceIssues.push({
      level: 'error',
      path: referencePath,
      message: 'Official Hatch mascot reference asset is missing.',
    })
    return referenceIssues
  }

  const referenceBytes = readFileSync(referencePath)
  const referenceSha = createHash('sha256').update(referenceBytes).digest('hex')
  if (referenceSha !== officialMascotSha256) {
    referenceIssues.push({
      level: 'error',
      path: referencePath,
      message: `Official Hatch mascot SHA mismatch. Expected ${officialMascotSha256}.`,
    })
  }

  return referenceIssues
}

function validateImageManifests(): AutopsyValidationIssue[] {
  const manifestIssues: AutopsyValidationIssue[] = []

  for (const story of featureAutopsies.filter(item => item.status === 'published' || item.images.length > 0)) {
    const manifestPath = path.join(cwd, 'content', 'autopsies', story.slug, 'image-manifest.json')
    if (!existsSync(manifestPath)) {
      manifestIssues.push({
        level: 'error',
        path: manifestPath,
        message: 'Story with final image roles requires an image manifest.',
      })
      continue
    }

    let manifest: ImageManifest
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ImageManifest
    } catch {
      manifestIssues.push({
        level: 'error',
        path: manifestPath,
        message: 'Image manifest is not valid JSON.',
      })
      continue
    }

    const manifestSlug = manifest.story_slug ?? manifest.storySlug
    if (manifestSlug !== story.slug) {
      manifestIssues.push({
        level: 'error',
        path: manifestPath,
        message: `Image manifest story slug mismatch. Expected ${story.slug}.`,
      })
    }

    const expectedRoot = `public/images/autopsies/${story.slug}/final`
    const expectedStorageRoot = `autopsy-images/stories/${story.slug}/v1`
    if (manifest.asset_root !== expectedRoot) {
      manifestIssues.push({
        level: 'error',
        path: manifestPath,
        message: `Image manifest asset_root must be ${expectedRoot}.`,
      })
    }
    if (manifest.storage_bucket !== 'autopsy-images') {
      manifestIssues.push({
        level: 'error',
        path: manifestPath,
        message: 'Image manifest must record autopsy-images storage bucket.',
      })
    }
    if (manifest.storage_version !== 'v1') {
      manifestIssues.push({
        level: 'error',
        path: manifestPath,
        message: 'Image manifest must record immutable storage version v1.',
      })
    }
    if (manifest.storage_asset_root !== expectedStorageRoot) {
      manifestIssues.push({
        level: 'error',
        path: manifestPath,
        message: `Image manifest storage_asset_root must be ${expectedStorageRoot}.`,
      })
    }

    if (manifest.reference_asset !== officialMascotReferenceAsset) {
      manifestIssues.push({
        level: 'error',
        path: manifestPath,
        message: `Image manifest must reference official Hatch asset: ${officialMascotReferenceAsset}.`,
      })
    }

    if (manifest.reference_sha256 !== officialMascotSha256) {
      manifestIssues.push({
        level: 'error',
        path: manifestPath,
        message: 'Image manifest must record the official Hatch reference SHA.',
      })
    }

    const assets = manifest.assets ?? []
    for (const role of AUTOPSY_REQUIRED_IMAGE_ROLES) {
      const asset = assets.find(item => item.role === role)
      if (!asset) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest missing role: ${role}.`,
        })
        continue
      }

      const assetPath = asset.path ?? asset.file
      const expectedStoragePath = `stories/${story.slug}/v1/${role}.webp`
      if (!assetPath) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role lacks path: ${role}.`,
        })
        continue
      }
      if (asset.storage_bucket !== 'autopsy-images') {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role must record autopsy-images bucket: ${role}.`,
        })
      }
      if (asset.storage_version !== 'v1') {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role must record storage version v1: ${role}.`,
        })
      }
      if (asset.storage_path !== expectedStoragePath) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role storage path must be ${expectedStoragePath}: ${role}.`,
        })
      }
      if (!asset.public_url?.includes(`/storage/v1/object/public/autopsy-images/${expectedStoragePath}`)) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role must include Supabase public URL: ${role}.`,
        })
      }
      if (!asset.final_image_sha256 || !/^[0-9a-f]{64}$/.test(asset.final_image_sha256)) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role must include final image SHA-256: ${role}.`,
        })
      }

      if (!assetPath.startsWith(`${expectedRoot}/`)) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image role must live under ${expectedRoot}: ${role}.`,
        })
      }

      const absoluteAssetPath = path.join(cwd, assetPath)
      let assetContents = ''
      const isSvgAsset = assetPath.endsWith('.svg')
      if (!existsSync(absoluteAssetPath)) {
        manifestIssues.push({
          level: 'error',
          path: absoluteAssetPath,
          message: `Final image file is missing for role: ${role}.`,
        })
      } else {
        const fileSha = createHash('sha256').update(readFileSync(absoluteAssetPath)).digest('hex')
        if (asset.final_image_sha256 && asset.final_image_sha256 !== fileSha) {
          manifestIssues.push({
            level: 'error',
            path: absoluteAssetPath,
            message: `Image manifest SHA does not match final image file for role: ${role}.`,
          })
        }
        const assetStats = statSync(absoluteAssetPath)
        if (assetStats.size <= 0) {
          manifestIssues.push({
            level: 'error',
            path: absoluteAssetPath,
            message: `Final image file is empty for role: ${role}.`,
          })
        }
        if (assetStats.size > 2_000_000) {
          manifestIssues.push({
            level: 'error',
            path: absoluteAssetPath,
            message: `Final image file exceeds 2MB budget for role: ${role}.`,
          })
        }
        if (isSvgAsset) {
          assetContents = readFileSync(absoluteAssetPath, 'utf8')
        }
      }

      if (!asset.alt?.trim()) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role lacks alt text: ${role}.`,
        })
      }

      if (!asset.caption?.trim()) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role lacks caption: ${role}.`,
        })
      }

      const watermarkRequired = typeof asset.watermark === 'boolean'
        ? asset.watermark
        : asset.watermark?.required
      const watermarkText = typeof asset.watermark === 'boolean'
        ? undefined
        : asset.watermark?.text
      const watermarkRendered = typeof asset.watermark === 'boolean'
        ? undefined
        : asset.watermark?.rendered
      if (!watermarkRequired) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Final image must be watermarked: ${role}.`,
        })
      }
      if (!watermarkText || !AUTOPSY_WATERMARK_OPTIONS.includes(watermarkText)) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role has unsupported watermark text: ${role}.`,
        })
      }
      if (isSvgAsset && watermarkText && assetContents && !assetContents.includes(watermarkText)) {
        manifestIssues.push({
          level: 'error',
          path: absoluteAssetPath,
          message: `Final image file does not contain required watermark text for role: ${role}.`,
        })
      }
      if (!isSvgAsset && watermarkRequired && watermarkRendered !== true) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Raster image manifest must mark watermark as rendered: ${role}.`,
        })
      }

      const qaStatus = asset.qaStatus ?? asset.qa_status ?? asset.status
      if (qaStatus !== 'approved') {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role is not approved: ${role}.`,
        })
      }

      if (asset.reference_asset !== officialMascotReferenceAsset) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role must trace back to official Hatch asset: ${role}.`,
        })
      }
      if (asset.reference_sha256 !== officialMascotSha256) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role must include official Hatch SHA: ${role}.`,
        })
      }
      if (!asset.hatch_variant?.trim()) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role must include Hatch variant label: ${role}.`,
        })
      }
      if (isSvgAsset && assetContents && !assetContents.includes(`reference_asset=${officialMascotReferenceAsset}`)) {
        manifestIssues.push({
          level: 'error',
          path: absoluteAssetPath,
          message: `Final image file does not include official Hatch reference asset metadata for role: ${role}.`,
        })
      }
      if (isSvgAsset && assetContents && !assetContents.includes(`reference_sha256=${officialMascotSha256}`)) {
        manifestIssues.push({
          level: 'error',
          path: absoluteAssetPath,
          message: `Final image file does not include official Hatch reference SHA metadata for role: ${role}.`,
        })
      }
      if (isSvgAsset && assetContents && !assetContents.includes('data:image/png;base64')) {
        manifestIssues.push({
          level: 'error',
          path: absoluteAssetPath,
          message: `Final SVG must embed the official Hatch reference image for role: ${role}.`,
        })
      }

      if (!asset.size_px?.width || !asset.size_px?.height) {
        manifestIssues.push({
          level: 'error',
          path: manifestPath,
          message: `Image manifest role lacks dimensions: ${role}.`,
        })
      }
      if (
        isSvgAsset
        && asset.size_px?.width
        && asset.size_px?.height
        && assetContents
        && (
          !assetContents.includes(`width="${asset.size_px.width}"`)
          || !assetContents.includes(`height="${asset.size_px.height}"`)
        )
      ) {
        manifestIssues.push({
          level: 'error',
          path: absoluteAssetPath,
          message: `SVG dimensions do not match manifest for role: ${role}.`,
        })
      }
    }
  }

  return manifestIssues
}
