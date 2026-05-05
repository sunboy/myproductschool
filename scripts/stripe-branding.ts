import { loadEnvConfig } from '@next/env'
import fs from 'fs'
import path from 'path'
import Stripe from 'stripe'
import { STRIPE_API_VERSION } from '../src/lib/stripe/config'

loadEnvConfig(process.cwd())

type Mode = 'live' | 'test'

interface ImageInfo {
  filePath: string
  width: number
  height: number
  size: number
  mimeType: 'image/png'
}

const args = process.argv.slice(2)

function argValue(flag: string, fallback: string): string {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] ?? fallback : fallback
}

function hasFlag(flag: string): boolean {
  return args.includes(flag)
}

function resolveMode(): Mode {
  if (hasFlag('--test')) return 'test'
  if (hasFlag('--live')) return 'live'
  return process.env.STRIPE_MODE === 'test' || process.env.NEXT_PUBLIC_STRIPE_MODE === 'test'
    ? 'test'
    : 'live'
}

function getSecretKey(mode: Mode, dryRun: boolean): string | null {
  const key = mode === 'test'
    ? process.env.STRIPE_TEST_SECRET_KEY
      ?? (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? process.env.STRIPE_SECRET_KEY : null)
    : process.env.STRIPE_SECRET_KEY

  if (dryRun) return key ?? null

  const expectedPrefix = mode === 'test' ? 'sk_test_' : 'sk_live_'
  if (!key?.startsWith(expectedPrefix)) {
    throw new Error(`Set a standard ${expectedPrefix} Stripe key before updating branding.`)
  }

  return key
}

function readPngInfo(filePath: string): ImageInfo {
  const absolutePath = path.resolve(filePath)
  const buffer = fs.readFileSync(absolutePath)
  const signature = buffer.subarray(0, 8).toString('hex')
  if (signature !== '89504e470d0a1a0a') {
    throw new Error(`${filePath} must be a PNG file.`)
  }

  return {
    filePath: absolutePath,
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    size: buffer.byteLength,
    mimeType: 'image/png',
  }
}

function validateForStripe(name: string, info: ImageInfo, square: boolean): void {
  const maxBytes = 512 * 1024
  if (info.size >= maxBytes) {
    throw new Error(`${name} must be smaller than 512KB. Current size: ${Math.round(info.size / 1024)}KB.`)
  }

  if (info.width < 128 || info.height < 128) {
    throw new Error(`${name} must be at least 128px by 128px. Current size: ${info.width}x${info.height}.`)
  }

  if (square && info.width !== info.height) {
    throw new Error(`${name} must be square. Current size: ${info.width}x${info.height}.`)
  }
}

async function uploadFile(
  stripe: Stripe,
  info: ImageInfo,
  purpose: 'business_icon' | 'business_logo'
): Promise<Stripe.File> {
  return stripe.files.create({
    purpose,
    file: {
      data: fs.createReadStream(info.filePath),
      name: path.basename(info.filePath),
      type: info.mimeType,
    },
  })
}

async function main() {
  const mode = resolveMode()
  const dryRun = hasFlag('--dry-run')
  const icon = readPngInfo(argValue('--icon', 'public/images/logo.png'))
  const logo = readPngInfo(argValue('--logo', 'public/images/wordmark.png'))
  const primaryColor = argValue('--primary-color', '#2d5a3d')
  const secondaryColor = argValue('--secondary-color', '#f8f3ea')

  validateForStripe('Icon', icon, true)
  validateForStripe('Logo', logo, false)

  console.log(`Stripe branding ${dryRun ? 'dry run' : 'update'} (${mode} mode)`)
  console.log(`Icon: ${icon.filePath} ${icon.width}x${icon.height} ${Math.round(icon.size / 1024)}KB`)
  console.log(`Logo: ${logo.filePath} ${logo.width}x${logo.height} ${Math.round(logo.size / 1024)}KB`)
  console.log(`Colors: primary ${primaryColor}, secondary ${secondaryColor}`)

  const secretKey = getSecretKey(mode, dryRun)
  if (dryRun) {
    if (!secretKey) console.log('No usable key checked in; dry-run validation only.')
    return
  }

  if (mode === 'test') {
    throw new Error(
      'Stripe account-level branding updates require live mode. Test checkout sessions use per-session branding_settings from the app checkout route.'
    )
  }

  const stripe = new Stripe(secretKey!, { apiVersion: STRIPE_API_VERSION })
  const account = await stripe.accounts.retrieve()
  const [iconUpload, logoUpload] = await Promise.all([
    uploadFile(stripe, icon, 'business_icon'),
    uploadFile(stripe, logo, 'business_logo'),
  ])

  await stripe.accounts.update(account.id, {
    settings: {
      branding: {
        icon: iconUpload.id,
        logo: logoUpload.id,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      },
    },
  })

  console.log(`Updated Stripe account branding for ${account.id}.`)
  console.log(`Icon file: ${iconUpload.id}`)
  console.log(`Logo file: ${logoUpload.id}`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
