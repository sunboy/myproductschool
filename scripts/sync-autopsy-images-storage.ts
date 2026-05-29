import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { featureAutopsies } from '../src/lib/autopsies/data'
import { AUTOPSY_REQUIRED_IMAGE_ROLES } from '../src/lib/autopsies/constants'
import { generatedAutopsyImageStorageData } from '../src/lib/autopsies/generated-image-storage-data'
import {
  AUTOPSY_IMAGE_BUCKET,
  AUTOPSY_IMAGE_STORAGE_VERSION,
  getAutopsyImageStoragePath,
} from '../src/lib/autopsies/storage'
import type { AutopsyImage, AutopsyImageRole, FeatureAutopsy } from '../src/lib/autopsies/types'

interface SyncOptions {
  dryRun: boolean
  force: boolean
  skipDb: boolean
  skipUpload: boolean
  stories: Set<string> | null
  storageVersion: string
  writeManifest: boolean
}

interface StorageRecord {
  bucket: string
  storagePath: string
  storageVersion: string
  sha256: string
  publicUrl: string
}

type StorageData = Record<string, Partial<Record<AutopsyImageRole, StorageRecord>>>

interface SyncImageStory {
  slug: string
  companySlug: string
  title: string
  dek?: string
  status?: FeatureAutopsy['status']
  proofreadStatus?: FeatureAutopsy['proofreadStatus']
  images: AutopsyImage[]
}

const cwd = process.cwd()
const generatedStorageDataPath = path.join(cwd, 'src/lib/autopsies/generated-image-storage-data.ts')

loadEnvLocal()

const options = parseArgs(process.argv.slice(2))
const supabaseUrl = requiredEnv('NEXT_PUBLIC_SUPABASE_URL')
const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

async function main() {
  const stories = getSyncImageStories()
    .filter(story => story.images.length > 0)
    .filter(story => !options.stories || options.stories.has(story.slug))

  if (!stories.length) {
    console.log('No autopsy stories with local images matched the sync filters.')
    return
  }

  if (!options.dryRun && !options.skipUpload) {
    await ensureBucket()
  }

  const storageData: StorageData = options.stories
    ? { ...generatedAutopsyImageStorageData }
    : {}
  let uploaded = 0
  let skippedUpload = 0
  let dbRows = 0

  for (const story of stories) {
    const storyRecords: Partial<Record<AutopsyImageRole, StorageRecord>> = {
      ...(storageData[story.slug] ?? {}),
    }
    const roleRecords = buildLocalImageRecords(story, options.storageVersion)

    for (const record of roleRecords) {
      storyRecords[record.role] = {
        bucket: AUTOPSY_IMAGE_BUCKET,
        storagePath: record.storagePath,
        storageVersion: options.storageVersion,
        sha256: record.sha256,
        publicUrl: publicUrlFor(record.storagePath),
      }

      if (options.dryRun || options.skipUpload) {
        skippedUpload += 1
        continue
      }

      const didUpload = await uploadImage(record.localPath, record.storagePath, options.force)
      if (didUpload) uploaded += 1
      else skippedUpload += 1
    }

    if (Object.keys(storyRecords).length > 0) {
      storageData[story.slug] = storyRecords
    }

    if (options.writeManifest && !options.dryRun && Object.keys(storyRecords).length > 0) {
      updateImageManifest(story, roleRecords)
    }

    if (!options.dryRun && !options.skipDb && Object.keys(storyRecords).length > 0) {
      dbRows += await upsertImageRecords(story, roleRecords)
    }
  }

  if (options.writeManifest && !options.dryRun) {
    writeStorageData(storageData)
  }

  console.log([
    `Synced ${Object.keys(storageData).length} autopsy story image set(s).`,
    `uploaded=${uploaded}`,
    `skipped_upload=${skippedUpload}`,
    `db_rows=${dbRows}`,
    `manifest=${options.writeManifest && !options.dryRun ? generatedStorageDataPath : 'not-written'}`,
  ].join(' '))
}

function getSyncImageStories(): SyncImageStory[] {
  const bySlug = new Map<string, SyncImageStory>()

  for (const story of featureAutopsies) {
    bySlug.set(story.slug, story)
  }

  const manifestsRoot = path.join(cwd, 'content/autopsies')
  if (!existsSync(manifestsRoot)) {
    return Array.from(bySlug.values())
  }

  for (const slug of readdirSync(manifestsRoot)) {
    const manifestPath = path.join(manifestsRoot, slug, 'image-manifest.json')
    if (!existsSync(manifestPath)) continue

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      product_slug?: string
      story_slug?: string
      story_title?: string
      assets?: Array<{
        role?: AutopsyImageRole
        path?: string
        alt?: string
        caption?: string
        qaStatus?: AutopsyImage['qaStatus']
        size_px?: { width?: number; height?: number }
        watermark?: { rendered?: boolean }
      }>
    }

    const storySlug = manifest.story_slug ?? slug
    const existing = bySlug.get(storySlug)
    if (existing?.images.length) continue

    const images = (manifest.assets ?? []).flatMap(asset => {
      if (!asset.role || !AUTOPSY_REQUIRED_IMAGE_ROLES.includes(asset.role)) return []
      const width = asset.size_px?.width
      const height = asset.size_px?.height
      if (!asset.path || !asset.alt || !asset.caption || !width || !height) return []
      return [{
        role: asset.role,
        src: `/${asset.path.replace(/^public\//, '')}`,
        alt: asset.alt,
        caption: asset.caption,
        width,
        height,
        watermark: Boolean(asset.watermark?.rendered),
        qaStatus: asset.qaStatus ?? 'approved',
      }]
    })

    bySlug.set(storySlug, {
      ...existing,
      slug: storySlug,
      companySlug: existing?.companySlug ?? manifest.product_slug ?? storySlug,
      title: existing?.title ?? manifest.story_title ?? storySlug,
      status: existing?.status ?? 'draft',
      proofreadStatus: existing?.proofreadStatus ?? 'approved',
      images,
    })
  }

  return Array.from(bySlug.values())
}

function buildLocalImageRecords(story: SyncImageStory, storageVersion: string) {
  return AUTOPSY_REQUIRED_IMAGE_ROLES.flatMap(role => {
    const image = story.images.find(item => item.role === role)
    if (!image) return []

    const localPath = path.join(cwd, 'public/images/autopsies', story.slug, 'final', `${role}.webp`)
    if (!existsSync(localPath)) return []

    const bytes = readFileSync(localPath)
    return [{
      story,
      image,
      role,
      localPath,
      bytes,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      storagePath: getAutopsyImageStoragePath(story.slug, role, storageVersion),
    }]
  })
}

async function ensureBucket() {
  const { error: getError } = await admin.storage.getBucket(AUTOPSY_IMAGE_BUCKET)
  if (!getError) {
    const { error: updateError } = await admin.storage.updateBucket(AUTOPSY_IMAGE_BUCKET, {
      public: true,
      allowedMimeTypes: ['image/webp'],
      fileSizeLimit: 2_000_000,
    })
    if (updateError) throw new Error(`Could not update ${AUTOPSY_IMAGE_BUCKET} bucket: ${updateError.message}`)
    return
  }

  const { error: createError } = await admin.storage.createBucket(AUTOPSY_IMAGE_BUCKET, {
    public: true,
    allowedMimeTypes: ['image/webp'],
    fileSizeLimit: 2_000_000,
  })
  if (createError) throw new Error(`Could not create ${AUTOPSY_IMAGE_BUCKET} bucket: ${createError.message}`)
}

async function uploadImage(localPath: string, storagePath: string, force: boolean) {
  const { error } = await admin.storage.from(AUTOPSY_IMAGE_BUCKET).upload(storagePath, readFileSync(localPath), {
    cacheControl: '31536000',
    contentType: 'image/webp',
    upsert: force,
  })

  if (!error) return true
  if (!force && /already exists|duplicate/i.test(error.message)) {
    return false
  }
  throw new Error(`Could not upload ${storagePath}: ${error.message}`)
}

async function upsertImageRecords(story: SyncImageStory, records: ReturnType<typeof buildLocalImageRecords>) {
  const storyId = await findLegacyStoryId(story)
  const version = Number(options.storageVersion.replace(/^v/, ''))
  const status = story.status === 'published' ? 'published' : story.proofreadStatus === 'approved' ? 'approved' : 'draft'
  const contentHash = createHash('sha256')
    .update(JSON.stringify({
      companySlug: story.companySlug,
      storySlug: story.slug,
      title: story.title,
      dek: story.dek ?? '',
      images: records.map(record => ({ role: record.role, sha256: record.sha256 })),
    }))
    .digest('hex')

  const { data: versionRow, error: versionError } = await admin
    .from('autopsy_story_versions')
    .upsert({
      story_id: storyId,
      company_slug: story.companySlug,
      story_slug: story.slug,
      version,
      status,
      content_sha256: contentHash,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }, { onConflict: 'company_slug,story_slug,version' })
    .select('id')
    .single()

  if (versionError) {
    throw new Error(`Could not upsert story version for ${story.slug}: ${versionError.message}`)
  }

  const imageRows = records.map(record => ({
    story_id: storyId,
    story_version_id: versionRow.id,
    role: record.role,
    bucket: AUTOPSY_IMAGE_BUCKET,
    storage_path: record.storagePath,
    public_url: publicUrlFor(record.storagePath),
    width: record.image.width,
    height: record.image.height,
    alt: record.image.alt,
    caption: record.image.caption,
    sha256: record.sha256,
    watermark: record.image.watermark,
    qa_status: record.image.qaStatus,
  }))

  if (!imageRows.length) return 0

  const { error: imageError } = await admin
    .from('autopsy_story_images')
    .upsert(imageRows, { onConflict: 'story_version_id,role' })

  if (imageError) {
    throw new Error(`Could not upsert image records for ${story.slug}: ${imageError.message}`)
  }

  return imageRows.length
}

async function findLegacyStoryId(story: SyncImageStory) {
  const { data: product, error: productError } = await admin
    .from('autopsy_products')
    .select('id')
    .eq('slug', story.companySlug)
    .maybeSingle()

  if (productError || !product) return null

  const { data: storyRow, error: storyError } = await admin
    .from('autopsy_stories')
    .select('id')
    .eq('product_id', product.id)
    .eq('slug', story.slug)
    .maybeSingle()

  if (storyError || !storyRow) return null
  return storyRow.id as string
}

function writeStorageData(storageData: StorageData) {
  const payload = JSON.stringify(storageData, null, 2)
  writeFileSync(
    generatedStorageDataPath,
    `import type { AutopsyImageRole } from './types'\n\n` +
      `export interface GeneratedAutopsyImageStorageRecord {\n` +
      `  bucket: string\n` +
      `  storagePath: string\n` +
      `  storageVersion: string\n` +
      `  sha256: string\n` +
      `  publicUrl?: string\n` +
      `}\n\n` +
      `export type GeneratedAutopsyImageStorageData = Record<\n` +
      `  string,\n` +
      `  Partial<Record<AutopsyImageRole, GeneratedAutopsyImageStorageRecord>>\n` +
      `>\n\n` +
      `export const generatedAutopsyImageStorageData: GeneratedAutopsyImageStorageData = ${payload}\n`,
    'utf8'
  )
}

function updateImageManifest(story: SyncImageStory, records: ReturnType<typeof buildLocalImageRecords>) {
  const manifestPath = path.join(cwd, 'content/autopsies', story.slug, 'image-manifest.json')
  if (!existsSync(manifestPath)) return

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    assets?: Array<{
      role?: string
      storage_bucket?: string
      storage_path?: string
      storage_version?: string
      public_url?: string
      final_image_sha256?: string
    }>
    storage_bucket?: string
    storage_version?: string
    storage_asset_root?: string
  }
  const byRole = new Map(records.map(record => [record.role, record]))

  manifest.storage_bucket = AUTOPSY_IMAGE_BUCKET
  manifest.storage_version = options.storageVersion
  manifest.storage_asset_root = `${AUTOPSY_IMAGE_BUCKET}/stories/${story.slug}/${options.storageVersion}`
  manifest.assets = (manifest.assets ?? []).map(asset => {
    const role = asset.role as AutopsyImageRole | undefined
    const record = role ? byRole.get(role) : null
    if (!record) return asset
    return {
      ...asset,
      storage_bucket: AUTOPSY_IMAGE_BUCKET,
      storage_path: record.storagePath,
      storage_version: options.storageVersion,
      public_url: publicUrlFor(record.storagePath),
      final_image_sha256: record.sha256,
    }
  })

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
}

function publicUrlFor(storagePath: string) {
  const { data } = admin.storage.from(AUTOPSY_IMAGE_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

function loadEnvLocal() {
  const envPath = path.join(cwd, '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key]) continue
    process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, '')
  }
}

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function parseArgs(args: string[]): SyncOptions {
  const options: SyncOptions = {
    dryRun: false,
    force: false,
    skipDb: false,
    skipUpload: false,
    stories: null,
    storageVersion: AUTOPSY_IMAGE_STORAGE_VERSION,
    writeManifest: true,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--force') options.force = true
    else if (arg === '--skip-db') options.skipDb = true
    else if (arg === '--skip-upload') options.skipUpload = true
    else if (arg === '--no-write-manifest') options.writeManifest = false
    else if (arg === '--version') options.storageVersion = args[++index] ?? options.storageVersion
    else if (arg === '--story') {
      options.stories ??= new Set<string>()
      options.stories.add(args[++index] ?? '')
    } else if (arg === '--stories') {
      options.stories = new Set((args[++index] ?? '').split(',').map(item => item.trim()).filter(Boolean))
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (!/^v[1-9]\d*$/.test(options.storageVersion)) {
    throw new Error('--version must look like v1, v2, v3, ...')
  }

  return options
}
