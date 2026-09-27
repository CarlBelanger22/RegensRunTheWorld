import { describe, expect, it } from 'vitest'
import { parsePotRange, potRangeSortKey, isPotRangeSpanUnderSix } from './potRange'

describe('parsePotRange', () => {
  it('parses min-max with hyphen or en-dash', () => {
    expect(parsePotRange('78-94')).toEqual({ min: 78, max: 94 })
    expect(parsePotRange('78 – 94')).toEqual({ min: 78, max: 94 })
  })

  it('parses a single number as min=max', () => {
    expect(parsePotRange('82')).toEqual({ min: 82, max: 82 })
  })

  it('returns null for garbage', () => {
    expect(parsePotRange('high')).toBeNull()
    expect(parsePotRange('')).toBeNull()
  })
})

describe('potRangeSortKey', () => {
  it('uses max for ordering', () => {
    expect(potRangeSortKey('78-94')).toBe(94)
    expect(potRangeSortKey('72-86')).toBe(86)
    expect(potRangeSortKey('bad')).toBe(-1)
  })
})

describe('isPotRangeSpanUnderSix', () => {
  it('is true when max - min is 6 or less', () => {
    expect(isPotRangeSpanUnderSix('88-94')).toBe(true)
    expect(isPotRangeSpanUnderSix('89-94')).toBe(true)
    expect(isPotRangeSpanUnderSix('89 – 94')).toBe(true)
    expect(isPotRangeSpanUnderSix('82-94')).toBe(false)
    expect(isPotRangeSpanUnderSix('')).toBe(false)
  })
})
