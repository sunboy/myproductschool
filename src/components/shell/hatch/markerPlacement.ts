/**
 * Pure placement math for the Hatch tour marker.
 * No DOM access — unit-testable.
 *
 * Side selection priority: above → below → right → left.
 * Overlap test shifts the marker along the cross-axis to clear the target.
 */

export type MarkerSide = 'above' | 'below' | 'right' | 'left'

export interface PlaceMarkerInput {
  rect: { left: number; top: number; right: number; bottom: number; width: number; height: number }
  viewport: { w: number; h: number }
  topInset: number
  bottomInset: number
  markerSize: number
  gap?: number
  margin?: number
}

export interface PlaceMarkerResult {
  left: number
  top: number
  side: MarkerSide
  visible: boolean
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function placeMarker(input: PlaceMarkerInput): PlaceMarkerResult {
  const { rect, viewport, topInset, bottomInset } = input
  const m = input.markerSize
  const gap = input.gap ?? 12
  const margin = input.margin ?? 16

  if (rect.width <= 0 || rect.height <= 0 || viewport.w <= 0 || viewport.h <= 0) {
    return { left: 0, top: 0, side: 'above', visible: false }
  }

  const spaceAbove = rect.top - topInset
  const spaceBelow = viewport.h - rect.bottom - bottomInset
  const spaceRight = viewport.w - rect.right - margin

  let side: MarkerSide
  if (spaceAbove >= m + gap) side = 'above'
  else if (spaceBelow >= m + gap) side = 'below'
  else if (spaceRight >= m + gap) side = 'right'
  else side = 'left'

  let left: number
  let top: number

  const targetCenterX = rect.left + rect.width / 2
  const targetCenterY = rect.top + rect.height / 2

  if (side === 'above') {
    top = rect.top - m - gap
    left = targetCenterX - m / 2
  } else if (side === 'below') {
    top = rect.bottom + gap
    left = targetCenterX - m / 2
  } else if (side === 'right') {
    left = rect.right + gap
    top = targetCenterY - m / 2
  } else {
    left = rect.left - m - gap
    top = targetCenterY - m / 2
  }

  // Overlap test: if the marker box intersects the target expanded by 8px, shift it along the cross-axis.
  const pad = 8
  const intersects = (l: number, t: number) =>
    l + m > rect.left - pad &&
    l < rect.right + pad &&
    t + m > rect.top - pad &&
    t < rect.bottom + pad

  if (intersects(left, top)) {
    if (side === 'above' || side === 'below') {
      // Try shifting horizontally toward whichever edge has more room.
      const leftShift = rect.left - pad - m
      const rightShift = rect.right + pad
      const tryLeft = leftShift >= margin
      const tryRight = rightShift + m <= viewport.w - margin
      if (tryRight && (!tryLeft || viewport.w - rightShift > leftShift)) left = rightShift
      else if (tryLeft) left = leftShift
    } else {
      const upShift = rect.top - pad - m
      const downShift = rect.bottom + pad
      const tryUp = upShift >= topInset
      const tryDown = downShift + m <= viewport.h - bottomInset
      if (tryDown && (!tryUp || viewport.h - downShift > upShift)) top = downShift
      else if (tryUp) top = upShift
    }
  }

  // Clamp to viewport with margin / insets.
  left = clamp(left, margin, viewport.w - m - margin)
  top = clamp(top, topInset, viewport.h - m - bottomInset)

  return { left, top, side, visible: true }
}
