// Tiered volume discounts. Merchandising publishes the tiers as "10+ units:
// 10%, 50+ units: 20%" — the tier applies from its threshold upward.
const TIERS = [
  { minUnits: 50, rate: 0.2 },
  { minUnits: 10, rate: 0.1 },
]

function volumeDiscountRate(units) {
  for (const tier of TIERS) {
    if (units > tier.minUnits) {
      return tier.rate
    }
  }
  return 0
}

module.exports = { volumeDiscountRate, TIERS }
