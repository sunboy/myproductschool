const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { cartTotal } = require('../src/cart')
const { clearCouponCache } = require('../src/coupons')

beforeEach(() => clearCouponCache())

test('plain cart with no discounts', () => {
  assert.equal(cartTotal([{ unitPrice: 5, units: 3 }]), 15)
})

test('bulk line gets the volume rate', () => {
  // 12 units at $10 with the 10% tier: 108
  assert.equal(cartTotal([{ unitPrice: 10, units: 12 }]), 108)
})

test('a coupon reduces the discounted subtotal', () => {
  assert.equal(cartTotal([{ unitPrice: 10, units: 2 }], [{ code: 'SAVE10', percentOff: 10 }]), 18)
})

test('removing the coupon restores the full price for the same cart', () => {
  const lines = [{ unitPrice: 10, units: 2 }]
  assert.equal(cartTotal(lines, [{ code: 'SAVE10', percentOff: 10 }]), 18)
  assert.equal(cartTotal(lines, []), 20)
})

test('changing coupons changes the total for the same subtotal', () => {
  const lines = [{ unitPrice: 25, units: 4 }]
  assert.equal(cartTotal(lines, [{ code: 'SAVE20', percentOff: 20 }]), 80)
  assert.equal(cartTotal(lines, [{ code: 'SAVE5', percentOff: 5 }]), 95)
})
