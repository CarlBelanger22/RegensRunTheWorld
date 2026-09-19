import { describe, expect, it } from 'vitest'
import { createPlayer } from './players'
import {
  canMovePlayerDown,
  canMovePlayerUp,
  ensureListOrders,
  movePlayerAmongVisiblePeers,
  nextListOrder,
} from './listOrder'
import { DEFAULT_FILTERS, filterAndSortPlayers } from './filterPlayers'
import type { Player } from '../types/player'

function cb(name: string, listOrder: number): Player {
  return createPlayer({
    name,
    country: 'Spain',
    naturalPosition: 'CB',
    currentPosition: 'CB',
    secondaryPositions: '',
    ovr: 70,
    potRange: '',
    status: 'Showing Great Potential',
    source: 'Regen',
    initialSM: 2,
    currentSM: 2,
    initialWF: 3,
    currentWF: 3,
    initialWorkRate: 'M/M',
    currentWorkRate: 'M/M',
    squadLocation: 'senior',
    listOrder,
  })
}

describe('listOrder', () => {
  it('assigns sequential orders when none exist', () => {
    const a = cb('A', 0)
    const b = cb('B', 0)
    delete (a as { listOrder?: number }).listOrder
    delete (b as { listOrder?: number }).listOrder
    const next = ensureListOrders([a, b])
    expect(next.map((p) => p.listOrder)).toEqual([0, 1])
  })

  it('fills only missing orders after max', () => {
    const a = cb('A', 5)
    const b = cb('B', 0)
    delete (b as { listOrder?: number }).listOrder
    const next = ensureListOrders([a, b])
    expect(next[0]?.listOrder).toBe(5)
    expect(next[1]?.listOrder).toBe(6)
  })

  it('nextListOrder is max+1', () => {
    expect(nextListOrder([cb('A', 2), cb('B', 7)])).toBe(8)
  })

  it('moves up within same position only', () => {
    const players = [cb('First', 1), cb('Second', 2), cb('Third', 3)]
    const visible = filterAndSortPlayers(players, {
      ...DEFAULT_FILTERS,
      sort: 'pos',
      sortDir: 'asc',
    })
    expect(visible.map((p) => p.name)).toEqual(['First', 'Second', 'Third'])
    expect(canMovePlayerUp(visible, players[1]!.id)).toBe(true)
    expect(canMovePlayerDown(visible, players[1]!.id)).toBe(true)

    const moved = movePlayerAmongVisiblePeers(
      players,
      visible,
      players[1]!.id,
      'up',
    )
    const again = filterAndSortPlayers(moved, {
      ...DEFAULT_FILTERS,
      sort: 'pos',
      sortDir: 'asc',
    })
    expect(again.map((p) => p.name)).toEqual(['Second', 'First', 'Third'])
  })

  it('does not cross into another position', () => {
    const st = createPlayer({
      name: 'Striker',
      country: 'A',
      naturalPosition: 'ST',
      currentPosition: 'ST',
      secondaryPositions: '',
      ovr: 70,
      potRange: '',
      status: null,
      source: 'Academy',
      initialSM: 3,
      currentSM: 3,
      initialWF: 3,
      currentWF: 3,
      initialWorkRate: 'M/M',
      currentWorkRate: 'M/M',
      squadLocation: 'academy',
      listOrder: 10,
    })
    const defender = cb('Def', 1)
    const visible = filterAndSortPlayers([defender, st], {
      ...DEFAULT_FILTERS,
      sort: 'pos',
      sortDir: 'asc',
    })
    // CB then ST — Def cannot move down into ST
    expect(canMovePlayerDown(visible, defender.id)).toBe(false)
    const next = movePlayerAmongVisiblePeers(
      [defender, st],
      visible,
      defender.id,
      'down',
    )
    expect(next).toEqual([defender, st])
  })
})

describe('filterAndSortPlayers listOrder', () => {
  it('uses listOrder within the same Current position', () => {
    const players = [cb('Late', 20), cb('Early', 5)]
    const sorted = filterAndSortPlayers(players, {
      ...DEFAULT_FILTERS,
      sort: 'pos',
      sortDir: 'asc',
    })
    expect(sorted.map((p) => p.name)).toEqual(['Early', 'Late'])
  })
})
