// Coupon evaluation. A coupon is { code, percentOff } and applies to the
// discounted subtotal. Evaluation is memoized because the storefront calls
// it on every cart render.
const cache = new Map()

function couponMultiplier(subtotal, coupons) {
  const key = String(subtotal)
  if (cache.has(key)) {
    return cache.get(key)
  }
  let multiplier = 1
  for (const coupon of coupons) {
    multiplier *= 1 - coupon.percentOff / 100
  }
  cache.set(key, multiplier)
  return multiplier
}

function clearCouponCache() {
  cache.clear()
}

module.exports = { couponMultiplier, clearCouponCache }
