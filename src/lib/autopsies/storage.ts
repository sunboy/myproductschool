import { generatedAutopsyImageStorageData } from './generated-image-storage-data'
import type { AutopsyImage, AutopsyImageRole, FeatureAutopsy } from './types'

export const AUTOPSY_IMAGE_BUCKET = 'autopsy-images'
export const AUTOPSY_IMAGE_STORAGE_VERSION = 'v1'

export function getAutopsyImageStoragePath(
  storySlug: string,
  role: AutopsyImageRole,
  version = AUTOPSY_IMAGE_STORAGE_VERSION
) {
  return `stories/${storySlug}/${version}/${role}.webp`
}

export function getSupabaseStoragePublicUrl(bucket: string, storagePath: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  if (!supabaseUrl) {
    return null
  }
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`
}

export function resolveAutopsyStorageImage(storySlug: string, image: AutopsyImage): AutopsyImage {
  const generated = generatedAutopsyImageStorageData[storySlug]?.[image.role]
  const bucket = image.bucket ?? generated?.bucket ?? AUTOPSY_IMAGE_BUCKET
  const storageVersion = image.storageVersion ?? generated?.storageVersion ?? AUTOPSY_IMAGE_STORAGE_VERSION
  const storagePath = image.storagePath ?? generated?.storagePath ?? getAutopsyImageStoragePath(storySlug, image.role, storageVersion)
  const publicUrl = image.publicUrl ?? generated?.publicUrl ?? getSupabaseStoragePublicUrl(bucket, storagePath)

  return {
    ...image,
    src: publicUrl ?? image.src,
    bucket,
    storagePath,
    storageVersion,
    sha256: image.sha256 ?? generated?.sha256,
    ...(publicUrl ? { publicUrl } : {}),
  }
}

export function withAutopsyStorageImages<T extends FeatureAutopsy>(story: T): T {
  if (story.images.length === 0) {
    return story
  }
  return {
    ...story,
    images: story.images.map(image => resolveAutopsyStorageImage(story.slug, image)),
  }
}
