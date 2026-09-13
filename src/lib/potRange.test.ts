import { describe, expect, it } from 'vitest'
import { parsePotRange, potRangeSortKey, isPotRangeDiffSix } from './potRange'

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

describe('isPotRangeDiffSix', () => {
  it('is true only when max - min === 6', () => {
    expect(isPotRangeDiffSix('85-91')).toBe(true)
    expect(isPotRangeDiffSix('85 – 91')).toBe(true)
    expect(isPotRangeDiffSix('82-94')).toBe(false)
    expect(isPotRangeDiffSix('82')).toBe(false)
    expect(isPotRangeDiffSix('')).toBe(false)
  })
})
