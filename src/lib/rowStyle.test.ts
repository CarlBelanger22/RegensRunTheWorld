import { describe, expect, it } from 'vitest'
import { createPlayer } from './players'
import {
  isOnLoan,
  isUpgradesSettled,
  playerRowTintClass,
  playerSettledRailClass,
} from './rowStyle'

function senior(
  overrides: Partial<ReturnType<typeof createPlayer>> = {},
) {
  return createPlayer({
    name: 'Tint',
    country: 'Test',
    naturalPosition: 'CM',
    currentPosition: 'CM',
    secondaryPositions: '',
    ovr: 70,
    potRange: '',
    status: 'At Club Since...',
    source: 'Academy',
    initialSM: 3,
    currentSM: 3,
    initialWF: 3,
    currentWF: 3,
    initialWorkRate: 'M/M',
    currentWorkRate: 'M/M',
    squadLocation: 'senior',
    ...overrides,
  })
}

describe('playerRowTintClass', () => {
  it('uses status greens/yellow and default for At Club / unset', () => {
    expect(
      playerRowTintClass(
        senior({ status: 'Has Potential to Be Special' }),
      ),
    ).toContain('emerald-950')
    expect(
      playerRowTintClass(senior({ status: 'An Exciting Prospect' })),
    ).toContain('emerald-800')
    expect(
      playerRowTintClass(senior({ status: 'Showing Great Potential' })),
    ).toContain('amber')
    expect(playerRowTintClass(senior({ status: 'At Club Since...' }))).toBe(
      'hover:bg-zinc-900/60',
    )
    expect(playerRowTintClass(senior({ status: null }))).toBe(
      'hover:bg-zinc-900/60',
    )
  })

  it('loan blue overrides status tint', () => {
    const tint = playerRowTintClass(
      senior({
        status: 'Has Potential to Be Special',
        loanClub: 'Rival FC',
      }),
    )
    expect(tint).toContain('sky')
    expect(tint).not.toContain('emerald')
    expect(isOnLoan(senior({ loanClub: 'Rival FC' }))).toBe(true)
    expect(isOnLoan(senior({ loanClub: '  ' }))).toBe(false)
  })
})

describe('upgradesSettled rail', () => {
  it('detects settled and uses accent rail class', () => {
    expect(isUpgradesSettled(senior())).toBe(false)
    expect(isUpgradesSettled(senior({ upgradesSettled: true }))).toBe(true)
    expect(playerSettledRailClass(senior())).toContain('zinc')
    expect(playerSettledRailClass(senior({ upgradesSettled: true }))).toContain(
      'accent',
    )
  })
})
