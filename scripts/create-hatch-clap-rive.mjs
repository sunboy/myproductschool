import { readFileSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'

const root = new URL('../', import.meta.url)
const outPath = new URL('public/rive/hatch-clap.riv', root)
const frameUrls = Array.from({ length: 8 }, (_, index) => (
  new URL(`public/rive/hatch-clap-frame-${String(index).padStart(2, '0')}.png`, root)
))

const RIVE_MAJOR = 7
const RIVE_MINOR = 0
const FILE_ID = 20260515
const FRAME_SIZE = 512
const FRAME_COUNT = frameUrls.length

const OBJECT = {
  Artboard: 1,
  Image: 100,
  ImageAsset: 105,
  KeyedObject: 25,
  KeyedProperty: 26,
  KeyFrameDouble: 30,
  LinearAnimation: 31,
  Backboard: 23,
}

const PROP = {
  name: 4,
  parentId: 5,
  width: 7,
  height: 8,
  x: 13,
  y: 14,
  scaleX: 16,
  scaleY: 17,
  opacity: 18,
  objectId: 51,
  propertyKey: 53,
  animationName: 55,
  fps: 56,
  duration: 57,
  speed: 58,
  loop: 59,
  frame: 67,
  value: 70,
  assetName: 203,
  fileAssetId: 204,
  imageAssetId: 206,
  assetHeight: 207,
  assetWidth: 208,
  originX: 380,
  originY: 381,
  fit: 974,
  alignmentX: 975,
  alignmentY: 976,
}

const TOC_FIELD = {
  uint: 0,
  string: 1,
  float: 2,
}

const bytes = []

function pushByte(value) {
  bytes.push(value & 0xff)
}

function pushBuffer(buffer) {
  for (const value of buffer) {
    pushByte(value)
  }
}

function varuint(value) {
  let current = Number(value >>> 0)
  do {
    let byte = current & 0x7f
    current >>>= 7
    if (current !== 0) {
      byte |= 0x80
    }
    pushByte(byte)
  } while (current !== 0)
}

function uint32(value) {
  const buffer = Buffer.allocUnsafe(4)
  buffer.writeUInt32LE(value >>> 0, 0)
  pushBuffer(buffer)
}

function float32(value) {
  const buffer = Buffer.allocUnsafe(4)
  buffer.writeFloatLE(value, 0)
  pushBuffer(buffer)
}

function string(value) {
  const buffer = Buffer.from(value, 'utf8')
  varuint(buffer.length)
  pushBuffer(buffer)
}

function writeToc(entries) {
  for (const [key] of entries) {
    varuint(key)
  }
  varuint(0)

  for (let offset = 0; offset < entries.length; offset += 16) {
    let word = 0
    for (let index = 0; index < 16 && offset + index < entries.length; index += 1) {
      word |= (entries[offset + index][1] & 3) << (index * 2)
    }
    uint32(word)
  }
}

function obj(type, props = []) {
  varuint(type)
  for (const [key, writer, value] of props) {
    varuint(key)
    writer(value)
  }
  varuint(0)
}

function pString(key, value) {
  return [key, string, value]
}

function pUint(key, value) {
  return [key, varuint, value]
}

function pFloat(key, value) {
  return [key, float32, value]
}

function addOpacityTrack(artboardObjectId, frameIndex) {
  obj(OBJECT.KeyedObject, [pUint(PROP.objectId, artboardObjectId)])
  obj(OBJECT.KeyedProperty, [pUint(PROP.propertyKey, PROP.opacity)])

  for (let frame = 0; frame <= FRAME_COUNT; frame += 1) {
    const visibleFrame = frame % FRAME_COUNT
    obj(OBJECT.KeyFrameDouble, [
      pUint(PROP.frame, frame),
      pFloat(PROP.value, visibleFrame === frameIndex ? 1 : 0),
    ])
  }
}

for (const frameUrl of frameUrls) {
  readFileSync(frameUrl)
}

pushBuffer(Buffer.from('RIVE', 'ascii'))
varuint(RIVE_MAJOR)
varuint(RIVE_MINOR)
varuint(FILE_ID)
writeToc([
  [PROP.assetName, TOC_FIELD.string],
  [PROP.fileAssetId, TOC_FIELD.uint],
  [PROP.assetHeight, TOC_FIELD.float],
  [PROP.assetWidth, TOC_FIELD.float],
])

obj(OBJECT.Backboard)

frameUrls.forEach((frameUrl, index) => {
  obj(OBJECT.ImageAsset, [
    pString(PROP.assetName, basename(frameUrl.pathname)),
    pUint(PROP.fileAssetId, 424200 + index),
    pFloat(PROP.assetHeight, FRAME_SIZE),
    pFloat(PROP.assetWidth, FRAME_SIZE),
  ])
})

obj(OBJECT.Artboard, [
  pString(PROP.name, 'Hatch Clap'),
  pFloat(PROP.width, FRAME_SIZE),
  pFloat(PROP.height, FRAME_SIZE),
])

frameUrls.forEach((_, index) => {
  obj(OBJECT.Image, [
    pUint(PROP.parentId, 0),
    pString(PROP.name, `Hatch clap frame ${index}`),
    pFloat(PROP.x, FRAME_SIZE / 2),
    pFloat(PROP.y, FRAME_SIZE / 2),
    pFloat(PROP.opacity, index === 0 ? 1 : 0),
    pUint(PROP.imageAssetId, index),
    pFloat(PROP.originX, 0.5),
    pFloat(PROP.originY, 0.5),
    pUint(PROP.fit, 0),
    pFloat(PROP.alignmentX, 0.5),
    pFloat(PROP.alignmentY, 0.5),
  ])
})

obj(OBJECT.LinearAnimation, [
  pString(PROP.animationName, 'Clap'),
  pUint(PROP.fps, 12),
  pUint(PROP.duration, FRAME_COUNT),
  pFloat(PROP.speed, 1),
  pUint(PROP.loop, 1),
])

frameUrls.forEach((_, index) => {
  addOpacityTrack(index + 1, index)
})

writeFileSync(outPath, Buffer.from(bytes))
console.log(`Wrote ${outPath.pathname} (${bytes.length} bytes)`)
