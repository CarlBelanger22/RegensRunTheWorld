import { describe, expect, it } from 'vitest'
import { bumpOvr, bumpStar, clampOvr, clampStar } from './quickEdit'

describe('quickEdit', () => {
  it('clamps ovr and stars', () => {
    expect(clampOvr(0)).toBe(1)
    expect(clampOvr(100)).toBe(99)
    expect(clampStar(0)).toBe(1)
    expect(clampStar(9)).toBe(5)
  })

  it('bumps ovr and stars increase-only', () => {
    expect(bumpOvr(58)).toBe(59)
    expect(bumpOvr(99)).toBe(99)
    expect(bumpStar(3)).toBe(4)
    expect(bumpStar(5)).toBe(5)
  })
})
