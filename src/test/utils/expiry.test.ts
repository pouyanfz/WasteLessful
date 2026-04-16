import { describe, it, expect } from 'vitest'
import {
  daysUntilExpiry,
  isExpired,
  isExpiringSoon,
  daysSinceAdded,
} from '../../utils/expiry'

const today = new Date('2026-04-08')

function date(offsetDays: number) {
  const d = new Date(today)
  d.setDate(d.getDate() + offsetDays)
  return d
}

describe('daysUntilExpiry', () => {
  it('returns 0 when expiry is today', () => {
    expect(daysUntilExpiry(date(0), today)).toBe(0)
  })

  it('returns positive number for future expiry', () => {
    expect(daysUntilExpiry(date(5), today)).toBe(5)
  })

  it('returns negative number for past expiry', () => {
    expect(daysUntilExpiry(date(-3), today)).toBe(-3)
  })
})

describe('isExpired', () => {
  it('returns true when expiry is in the past', () => {
    expect(isExpired(date(-1), today)).toBe(true)
  })

  it('returns false when expiry is today', () => {
    expect(isExpired(date(0), today)).toBe(false)
  })

  it('returns false when expiry is in the future', () => {
    expect(isExpired(date(10), today)).toBe(false)
  })
})

describe('isExpiringSoon', () => {
  it('returns true when expiry is exactly today (0 days)', () => {
    expect(isExpiringSoon(date(0), 3, today)).toBe(true)
  })

  it('returns true when expiry is within the window', () => {
    expect(isExpiringSoon(date(2), 3, today)).toBe(true)
  })

  it('returns true when expiry equals the window boundary', () => {
    expect(isExpiringSoon(date(3), 3, today)).toBe(true)
  })

  it('returns false when expiry is outside the window', () => {
    expect(isExpiringSoon(date(4), 3, today)).toBe(false)
  })

  it('returns false when item is already expired', () => {
    expect(isExpiringSoon(date(-1), 3, today)).toBe(false)
  })
})

describe('daysSinceAdded', () => {
  it('returns 0 when added today', () => {
    expect(daysSinceAdded(date(0), today)).toBe(0)
  })

  it('returns correct number of days', () => {
    expect(daysSinceAdded(date(-10), today)).toBe(10)
  })
})
