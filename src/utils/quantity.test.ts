import { describe, it, expect } from 'vitest'
import { quantityPercentage, isLowQuantity } from './quantity'

describe('quantityPercentage', () => {
  it('returns 100 when full', () => {
    expect(quantityPercentage(500, 500)).toBe(100)
  })

  it('returns 50 when half full', () => {
    expect(quantityPercentage(250, 500)).toBe(50)
  })

  it('returns 0 when empty', () => {
    expect(quantityPercentage(0, 500)).toBe(0)
  })

  it('returns 0 when initial is 0 (prevents division by zero)', () => {
    expect(quantityPercentage(0, 0)).toBe(0)
  })

  it('clamps to 100 even if current exceeds initial', () => {
    expect(quantityPercentage(600, 500)).toBe(100)
  })

  it('clamps to 0 for negative current', () => {
    expect(quantityPercentage(-10, 500)).toBe(0)
  })
})

describe('isLowQuantity', () => {
  it('returns true when exactly at threshold', () => {
    expect(isLowQuantity(125, 500, 25)).toBe(true) // 25%
  })

  it('returns true when below threshold', () => {
    expect(isLowQuantity(100, 500, 25)).toBe(true) // 20%
  })

  it('returns false when above threshold', () => {
    expect(isLowQuantity(200, 500, 25)).toBe(false) // 40%
  })

  it('returns true when empty', () => {
    expect(isLowQuantity(0, 500, 25)).toBe(true)
  })
})
