import { describe, expect, it } from 'vitest'
import { createPlayer } from './players'
import { filterAndSortPlayers, heightSortKey } from './filterPlayers'

const players = [
  createPlayer({
    name: 'Alpha',
    country: 'Spain',
    naturalPosition: 'ST',
    currentPosition: 'ST',
    secondaryPositions: '',
    ovr: 60,
    height: "5'10\"",
    potRange: '70-80',
    status: null,
    source: 'Academy',
    initialSM: 3,
    currentSM: 3,
    initialWF: 3,
    currentWF: 3,
    initialWorkRate: 'M/M',
    currentWorkRate: 'M/M',
    squadLocation: 'academy',
  }),
  createPlayer({
    name: 'Bravo',
    country: 'France',
    naturalPosition: 'CAM',
    currentPosition: 'CAM',
    secondaryPositions: 'CM',
    ovr: 75,
    height: "6'1\"",
    potRange: '80-92',
    status: 'Has Potential to Be Special',
    source: 'Regen',
    initialSM: 3,
    currentSM: 3,
    initialWF: 3,
    currentWF: 3,
    initialWorkRate: 'H/M',
    currentWorkRate: 'H/M',
    squadLocation: 'senior',
  }),
]

const baseFilters = {
  search: '',
  source: 'all' as const,
  position: 'all' as const,
  status: 'all' as const,
  sort: 'ovr' as const,
  sortDir: 'desc' as const,
}

describe('heightSortKey', () => {
  it('parses feet and inches', () => {
    expect(heightSortKey(`6'2"`)).toBe(74)
    expect(heightSortKey("5'10\"")).toBe(70)
  })
})

describe('filterAndSortPlayers', () => {
  it('filters by search name/country', () => {
    const byName = filterAndSortPlayers(players, {
      ...baseFilters,
      search: 'alp',
      sort: 'name',
      sortDir: 'asc',
    })
    expect(byName.map((p) => p.name)).toEqual(['Alpha'])

    const byCountry = filterAndSortPlayers(players, {
      ...baseFilters,
      search: 'france',
      sort: 'name',
      sortDir: 'asc',
    })
    expect(byCountry.map((p) => p.name)).toEqual(['Bravo'])
  })

  it('filters by source, position, and unset status', () => {
    expect(
      filterAndSortPlayers(players, {
        ...baseFilters,
        source: 'Regen',
      }).map((p) => p.name),
    ).toEqual(['Bravo'])

    expect(
      filterAndSortPlayers(players, {
        ...baseFilters,
        position: 'CAM',
      }).map((p) => p.name),
    ).toEqual(['Bravo'])

    expect(
      filterAndSortPlayers(players, {
        ...baseFilters,
        status: 'unset',
      }).map((p) => p.name),
    ).toEqual(['Alpha'])
  })

  it('sorts by ovr descending and name ascending', () => {
    const byOvr = filterAndSortPlayers(players, {
      ...baseFilters,
      sort: 'ovr',
      sortDir: 'desc',
    })
    expect(byOvr.map((p) => p.name)).toEqual(['Bravo', 'Alpha'])

    const byName = filterAndSortPlayers(players, {
      ...baseFilters,
      sort: 'name',
      sortDir: 'asc',
    })
    expect(byName.map((p) => p.name)).toEqual(['Alpha', 'Bravo'])
  })

  it('sorts positions in FIFA ID order by default key', () => {
    const mixed = [
      createPlayer({
        name: 'Striker',
        country: 'A',
        naturalPosition: 'ST',
        currentPosition: 'ST',
        secondaryPositions: '',
        ovr: 70,
        potRange: '70-80',
        status: null,
        source: 'Academy',
        initialSM: 3,
        currentSM: 3,
        initialWF: 3,
        currentWF: 3,
        initialWorkRate: 'M/M',
        currentWorkRate: 'M/M',
        squadLocation: 'academy',
      }),
      createPlayer({
        name: 'Keeper',
        country: 'B',
        naturalPosition: 'GK',
        currentPosition: 'GK',
        secondaryPositions: '',
        ovr: 70,
        potRange: '70-80',
        status: null,
        source: 'Academy',
        initialSM: 1,
        currentSM: 1,
        initialWF: 3,
        currentWF: 3,
        initialWorkRate: 'M/M',
        currentWorkRate: 'M/M',
        squadLocation: 'academy',
      }),
      createPlayer({
        name: 'Mid',
        country: 'C',
        naturalPosition: 'CM',
        currentPosition: 'CM',
        secondaryPositions: '',
        ovr: 70,
        potRange: '70-80',
        status: null,
        source: 'Academy',
        initialSM: 3,
        currentSM: 3,
        initialWF: 3,
        currentWF: 3,
        initialWorkRate: 'M/M',
        currentWorkRate: 'M/M',
        squadLocation: 'academy',
      }),
    ]
    const sorted = filterAndSortPlayers(mixed, {
      ...baseFilters,
      sort: 'pos',
      sortDir: 'asc',
    })
    expect(sorted.map((p) => p.currentPosition)).toEqual(['GK', 'CM', 'ST'])
  })
})
