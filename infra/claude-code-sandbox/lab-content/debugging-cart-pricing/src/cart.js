const { volumeDiscountRate } = require('./discounts')
const { couponMultiplier } = require('./coupons')

// A line is { unitPrice, units }. Coupons apply to the whole cart after
// volume discounts.
function cartTotal(lines, coupons = []) {
  let subtotal = 0
  for (const line of lines) {
    const rate = volumeDiscountRate(line.units)
    subtotal += line.unitPrice * line.units * (1 - rate)
  }
  const total = subtotal * couponMultiplier(subtotal, coupons)
  return Math.round(total * 100) / 100
}

module.exports = { cartTotal }
