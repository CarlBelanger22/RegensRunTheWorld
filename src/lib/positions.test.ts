import { describe, expect, it } from 'vitest'
import {
  buildInitialPlayablePositions,
  countExtraPositions,
  ensureSecondaryIncludesCurrent,
  fifaPositionSortKey,
  parsePositions,
} from './positions'

describe('parsePositions', () => {
  it('splits, uppercases, and dedupes', () => {
    expect(parsePositions('cam', 'CM, cam, ST')).toEqual(['CAM', 'CM', 'ST'])
  })
})

describe('fifaPositionSortKey', () => {
  it('follows user squad order: left→right, back→front', () => {
    const order = [
      'GK',
      'LWB',
      'LB',
      'CB',
      'RB',
      'RWB',
      'CDM',
      'LM',
      'CM',
      'CAM',
      'RM',
      'LW',
      'RW',
      'CF',
      'ST',
    ]
    for (let i = 0; i < order.length - 1; i++) {
      expect(fifaPositionSortKey(order[i]!)).toBeLessThan(
        fifaPositionSortKey(order[i + 1]!),
      )
    }
  })
})

describe('buildInitialPlayablePositions', () => {
  it('freezes natural + secondaries', () => {
    expect(buildInitialPlayablePositions('CAM', 'CM, CF')).toEqual([
      'CAM',
      'CM',
      'CF',
    ])
  })
})

describe('countExtraPositions', () => {
  it('counts only positions beyond the initial set', () => {
    const player = {
      naturalPosition: 'CAM',
      secondaryPositions: 'CM, CF',
      initialPlayablePositions: ['CAM', 'CM', 'CF'],
    }
    expect(countExtraPositions(player)).toBe(0)

    expect(
      countExtraPositions({
        ...player,
        secondaryPositions: 'CM, CF, ST',
      }),
    ).toBe(1)

    expect(
      countExtraPositions({
        ...player,
        secondaryPositions: 'CM, CF, ST, LW',
      }),
    ).toBe(2)
  })

  it('does not count playing an already-listed secondary as an extra', () => {
    expect(
      countExtraPositions({
        naturalPosition: 'CAM',
        secondaryPositions: 'ST',
        initialPlayablePositions: ['CAM', 'ST'],
      }),
    ).toBe(0)
  })

  it('counts currentPosition as playable when converted (e.g. CF→RW)', () => {
    expect(
      countExtraPositions({
        naturalPosition: 'CF',
        currentPosition: 'RW',
        secondaryPositions: 'CF, ST',
        initialPlayablePositions: ['CF', 'ST'],
      }),
    ).toBe(1)
  })
})

describe('ensureSecondaryIncludesCurrent', () => {
  it('appends current when it differs from natural', () => {
    expect(ensureSecondaryIncludesCurrent('LB', 'LWB', 'CM, CF')).toBe(
      'CM, CF, LWB',
    )
  })

  it('keeps secondaries when current returns to natural', () => {
    expect(ensureSecondaryIncludesCurrent('LB', 'LB', 'CM, CF, LWB')).toBe(
      'CM, CF, LWB',
    )
  })

  it('is a no-op when current is natural or already listed', () => {
    expect(ensureSecondaryIncludesCurrent('LB', 'LB', 'CM')).toBe('CM')
    expect(ensureSecondaryIncludesCurrent('LB', 'LWB', 'LWB, CM')).toBe(
      'LWB, CM',
    )
  })

  it('appends a second convert (may imply Broken in badges)', () => {
    expect(ensureSecondaryIncludesCurrent('LB', 'CB', 'LWB')).toBe('LWB, CB')
  })
})
