import { describe, expect, it } from 'vitest'
import { createPlayer } from './players'
import { getUpgradeStatus, isSoldAlumni } from './upgradeStatus'

function basePlayer(
  overrides: Partial<ReturnType<typeof createPlayer>> = {},
) {
  return createPlayer({
    name: 'Test',
    country: 'Testland',
    naturalPosition: 'CAM',
    currentPosition: 'CAM',
    secondaryPositions: 'CM',
    ovr: 70,
    potRange: '75-88',
    status: null,
    source: 'Academy',
    initialSM: 3,
    currentSM: 3,
    initialWF: 3,
    currentWF: 3,
    initialWorkRate: 'M/M',
    currentWorkRate: 'M/M',
    squadLocation: 'academy',
    ...overrides,
  })
}

describe('getUpgradeStatus', () => {
  it('marks SM/WF available when neither changed', () => {
    expect(getUpgradeStatus(basePlayer()).smWf).toEqual({
      kind: 'available',
      label: 'SM/WF: Avail',
    })
  })

  it('marks SM/WF used for +1 SM or +1 WF (either-or)', () => {
    expect(getUpgradeStatus(basePlayer({ currentSM: 4 })).smWf).toEqual({
      kind: 'used',
      label: 'SM/WF: +1 SM',
    })
    expect(getUpgradeStatus(basePlayer({ currentWF: 4 })).smWf).toEqual({
      kind: 'used',
      label: 'SM/WF: +1 WF',
    })
  })

  it('marks SM/WF broken if both upgraded or one exceeds +1', () => {
    expect(
      getUpgradeStatus(basePlayer({ currentSM: 4, currentWF: 4 })).smWf,
    ).toEqual({
      kind: 'broken',
      label: 'Broken: +1 SM & +1 WF',
    })
    expect(getUpgradeStatus(basePlayer({ currentSM: 5 })).smWf).toEqual({
      kind: 'broken',
      label: 'Broken: +2 SM',
    })
  })

  it('does not limit SM/WF for goalkeepers (UI hides all GK badges)', () => {
    expect(
      getUpgradeStatus(
        basePlayer({
          naturalPosition: 'GK',
          currentPosition: 'GK',
          currentSM: 5,
          currentWF: 5,
        }),
      ).smWf,
    ).toEqual({
      kind: 'available',
      label: 'SM/WF: Free (GK)',
    })
  })

  it('marks WR used for +1 step and broken for +2+', () => {
    expect(
      getUpgradeStatus(basePlayer({ currentWorkRate: 'H/M' })).wr,
    ).toEqual({
      kind: 'used',
      label: 'WR: Used',
    })
    expect(
      getUpgradeStatus(
        basePlayer({
          initialWorkRate: 'L/H',
          currentWorkRate: 'H/H',
        }),
      ).wr,
    ).toEqual({
      kind: 'broken',
      label: 'Broken: +2 WR',
    })
  })

  it('marks WR used/max when baseline is already H/H (cannot upgrade)', () => {
    expect(
      getUpgradeStatus(
        basePlayer({
          initialWorkRate: 'H/H',
          currentWorkRate: 'H/H',
        }),
      ).wr,
    ).toEqual({
      kind: 'used',
      label: 'WR: Max',
    })
  })

  it('marks position available / used / broken by extra count', () => {
    const player = basePlayer()
    expect(getUpgradeStatus(player).position.kind).toBe('available')

    const used = getUpgradeStatus({
      ...player,
      secondaryPositions: 'CM, ST',
    })
    expect(used.position).toEqual({
      kind: 'used',
      label: 'Pos: Used',
    })

    const broken = getUpgradeStatus({
      ...player,
      secondaryPositions: 'CM, ST, LW',
    })
    expect(broken.position).toEqual({
      kind: 'broken',
      label: 'Broken: +2 Pos',
    })
  })

  it('marks position used when currentPosition is the +1 convert', () => {
    const player = basePlayer({
      naturalPosition: 'CF',
      currentPosition: 'RW',
      secondaryPositions: 'CF, ST',
      initialPlayablePositions: ['CF', 'ST'],
    })
    expect(getUpgradeStatus(player).position).toEqual({
      kind: 'used',
      label: 'Pos: Used',
    })
  })
})

describe('isSoldAlumni', () => {
  it('detects sold by club or fee on external players', () => {
    expect(
      isSoldAlumni(
        basePlayer({
          squadLocation: 'external',
          destinationClub: 'Somewhere FC',
        }),
      ),
    ).toBe(true)

    expect(
      isSoldAlumni(
        basePlayer({
          squadLocation: 'external',
          transferFee: 12_000_000,
        }),
      ),
    ).toBe(true)

    expect(
      isSoldAlumni(basePlayer({ squadLocation: 'external' })),
    ).toBe(false)
  })
})
