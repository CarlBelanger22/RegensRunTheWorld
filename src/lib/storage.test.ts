import { beforeEach, describe, expect, it } from 'vitest'
import { createPlayer, promoteToSenior, sellPlayer, correctFrozenBaseline, touchPlayer } from './players'
import { createSeedPlayers } from './seed'
import {
  createAcademyAddonPlayers,
  mergeMissingAcademyAddons,
} from './academyAddons'
import {
  createSeniorAddonPlayers,
  mergeMissingSeniorAddons,
} from './seniorAddons'
import {
  STORAGE_KEY,
  clearPlayersStorage,
  loadPlayers,
  savePlayers,
} from './storage'

describe('seed', () => {
  it('seeds 4 senior + 24 academy players from screenshots', () => {
    const seed = createSeedPlayers(1_700_000_000_000)
    expect(seed).toHaveLength(28)
    expect(seed.filter((p) => p.squadLocation === 'senior')).toHaveLength(4)
    expect(seed.filter((p) => p.squadLocation === 'academy')).toHaveLength(24)
    expect(seed.every((p) => p.squadLocation !== 'academy' || p.status === null)).toBe(
      true,
    )
    expect(seed.find((p) => p.name === 'Jack Rogerson')?.potRange).toBe('88-94')
    expect(seed.find((p) => p.name === 'Julen Pérez')?.initialSM).toBe(4)
    expect(seed.find((p) => p.name === 'Julen Pérez')?.currentSM).toBe(5)
    expect(seed.find((p) => p.name === 'Rafael Pinto')?.initialWF).toBe(1)
    expect(seed.find((p) => p.name === 'Pedro Martins')?.currentPosition).toBe(
      'RWB',
    )
    expect(seed.find((p) => p.name === 'Cristian Escobar')?.potRange).toBe(
      '69-93',
    )
    expect(seed.find((p) => p.name === 'Joaquín Serrano')?.ovr).toBe(41)
    expect(seed.find((p) => p.name === 'Alfonso Martins')?.secondaryPositions).toBe(
      'CDM, CAM',
    )
    expect(seed.find((p) => p.name === 'Fabião Izquierdo')?.ovr).toBe(65)
  })
})

describe('players helpers', () => {
  it('correctFrozenBaseline can rewrite initials; touchPlayer cannot', () => {
    const player = createPlayer({
      name: 'Fix Me',
      country: 'Canada',
      naturalPosition: 'CF',
      currentPosition: 'CF',
      secondaryPositions: 'ST',
      ovr: 60,
      potRange: '80-90',
      status: null,
      source: 'Academy',
      initialSM: 3,
      currentSM: 4,
      initialWF: 3,
      currentWF: 4,
      initialWorkRate: 'H/M',
      currentWorkRate: 'H/M',
      squadLocation: 'academy',
    })

    const touched = touchPlayer(player, {
      initialPlayablePositions: ['RW'],
      initialSM: 1,
    })
    expect(touched.initialPlayablePositions).toEqual(['CF', 'ST'])
    expect(touched.initialSM).toBe(3)

    const corrected = correctFrozenBaseline(player, {
      initialPlayablePositions: ['RW', 'CF', 'ST'],
      initialSM: 3,
      initialWF: 3,
      initialWorkRate: 'H/M',
    })
    expect(corrected.initialPlayablePositions).toEqual(['RW', 'CF', 'ST'])
    expect(corrected.initialSM).toBe(3)
    expect(corrected.currentSM).toBe(4)
  })

  it('promoteToSenior leaves status unset and keeps potRange', () => {
    const academy = createPlayer({
      name: 'Kid',
      country: 'Spain',
      naturalPosition: 'ST',
      currentPosition: 'ST',
      secondaryPositions: '',
      ovr: 60,
      potRange: '78-92',
      status: null,
      source: 'Academy',
      initialSM: 3,
      currentSM: 3,
      initialWF: 3,
      currentWF: 3,
      initialWorkRate: 'M/M',
      currentWorkRate: 'M/M',
      squadLocation: 'academy',
    })
    const senior = promoteToSenior(academy)
    expect(senior.squadLocation).toBe('senior')
    expect(senior.status).toBeNull()
    expect(senior.potRange).toBe('78-92')
    expect(senior.initialPlayablePositions).toEqual(
      academy.initialPlayablePositions,
    )
  })

  it('sellPlayer moves to external with club and fee', () => {
    const sold = sellPlayer(
      createPlayer({
        name: 'Pro',
        country: 'France',
        naturalPosition: 'CM',
        currentPosition: 'CM',
        secondaryPositions: '',
        ovr: 78,
        potRange: '70-82',
        status: 'At Club Since...',
        source: 'Academy',
        initialSM: 3,
        currentSM: 3,
        initialWF: 3,
        currentWF: 3,
        initialWorkRate: 'H/M',
        currentWorkRate: 'H/M',
        squadLocation: 'senior',
      }),
      'Rival FC',
      8_500_000,
    )
    expect(sold.squadLocation).toBe('external')
    expect(sold.destinationClub).toBe('Rival FC')
    expect(sold.transferFee).toBe(8_500_000)
  })
})

describe('storage', () => {
  beforeEach(() => {
    clearPlayersStorage()
    localStorage.clear()
  })

  it('seeds roster and round-trips saves', () => {
    const first = loadPlayers()
    expect(first).toHaveLength(28)
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()

    const player = createPlayer({
      name: 'Solo',
      country: 'Brazil',
      naturalPosition: 'ST',
      currentPosition: 'ST',
      secondaryPositions: '',
      ovr: 65,
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
    })
    savePlayers([player])

    const second = loadPlayers()
    expect(second).toHaveLength(1)
    expect(second[0]?.name).toBe('Solo')
  })

  it('merges missing screenshot seniors into an existing career save', () => {
    const base = createSeedPlayers().filter((p) => p.squadLocation === 'senior')
    expect(base.some((p) => p.name === 'Matěj Liška')).toBe(true)
    savePlayers(base)

    const loaded = loadPlayers()
    const addons = createSeniorAddonPlayers()
    for (const addon of addons) {
      expect(loaded.some((p) => p.name === addon.name)).toBe(true)
    }
    expect(loaded.filter((p) => p.squadLocation === 'senior').length).toBe(
      base.length + addons.length,
    )
  })
})

describe('seniorAddons', () => {
  it('does not duplicate names already present', () => {
    const first = createSeniorAddonPlayers()
    const merged = mergeMissingSeniorAddons([
      ...createSeedPlayers().filter((p) => p.name === 'Matěj Liška'),
      ...first,
    ])
    expect(merged.filter((p) => p.name === 'Ager Correa')).toHaveLength(1)
  })
})

describe('academyAddons', () => {
  it('merges Austin Ashworth into a career YA save', () => {
    const base = createSeedPlayers().filter((p) => p.name === 'Jack Rogerson')
    const merged = mergeMissingAcademyAddons(base)
    expect(merged.some((p) => p.name === 'Austin Ashworth')).toBe(true)
    expect(createAcademyAddonPlayers()[0]?.squadLocation).toBe('academy')
    expect(createAcademyAddonPlayers()[0]?.potRange).toBe('82-94')
  })
})
