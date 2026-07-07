const { test } = require('node:test')
const assert = require('node:assert/strict')
const { volumeDiscountRate } = require('../src/discounts')

test('no discount below the first tier', () => {
  assert.equal(volumeDiscountRate(9), 0)
})

test('the 10% tier applies from exactly 10 units', () => {
  assert.equal(volumeDiscountRate(10), 0.1)
})

test('the 10% tier applies above 10 units', () => {
  assert.equal(volumeDiscountRate(11), 0.1)
})

test('the 20% tier applies from exactly 50 units', () => {
  assert.equal(volumeDiscountRate(50), 0.2)
})

test('the 20% tier applies above 50 units', () => {
  assert.equal(volumeDiscountRate(51), 0.2)
})
