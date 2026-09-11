import { describe, expect, it } from 'vitest'
import {
  parseWorkRate,
  workRateOptionsFromBaseline,
  workRateStepDelta,
  isWorkRateMaxed,
} from './workRate'

describe('parseWorkRate', () => {
  it('parses attack/defense sides', () => {
    expect(parseWorkRate('L/H')).toEqual({ attack: 'L', defense: 'H' })
    expect(parseWorkRate('m / m')).toEqual({ attack: 'M', defense: 'M' })
    expect(parseWorkRate('bad')).toBeNull()
  })
})

describe('workRateStepDelta', () => {
  it('counts L→M→H steps across both sides', () => {
    expect(workRateStepDelta('L/H', 'L/H')).toBe(0)
    expect(workRateStepDelta('L/H', 'M/H')).toBe(1)
    expect(workRateStepDelta('L/H', 'H/H')).toBe(2)
    expect(workRateStepDelta('M/M', 'H/M')).toBe(1)
    expect(workRateStepDelta('M/M', 'M/H')).toBe(1)
    expect(workRateStepDelta('M/M', 'H/H')).toBe(2)
  })

  it('treats decreases as broken-level (>=2)', () => {
    expect(workRateStepDelta('H/H', 'M/H')).toBeGreaterThanOrEqual(2)
  })
})

describe('isWorkRateMaxed', () => {
  it('is true only when both sides are H', () => {
    expect(isWorkRateMaxed('H/H')).toBe(true)
    expect(isWorkRateMaxed('h / h')).toBe(true)
    expect(isWorkRateMaxed('H/M')).toBe(false)
    expect(isWorkRateMaxed('M/H')).toBe(false)
    expect(isWorkRateMaxed('bad')).toBe(false)
  })
})

describe('workRateOptionsFromBaseline', () => {
  it('only offers same-or-higher sides (keeps +2 options)', () => {
    expect(workRateOptionsFromBaseline('M/M')).toEqual([
      'H/H',
      'H/M',
      'M/H',
      'M/M',
    ])
    expect(workRateOptionsFromBaseline('L/H')).toEqual(['H/H', 'M/H', 'L/H'])
    expect(workRateOptionsFromBaseline('L/H')).not.toContain('L/M')
    expect(workRateOptionsFromBaseline('M/M')).not.toContain('L/L')
    expect(workRateOptionsFromBaseline('M/M')).not.toContain('L/M')
    expect(workRateOptionsFromBaseline('M/M')).not.toContain('M/L')
  })

  it('keeps a saved illegal current value visible', () => {
    expect(workRateOptionsFromBaseline('H/H', 'M/H')).toContain('M/H')
  })
})
