import { createPlayer } from './players'
import { isNameReleased } from './releasedNames'
import type { Player } from '../types/player'

/**
 * Academy prospects added from screenshots after the initial seed.
 * Merged into existing browser saves by name (never duplicates).
 */
export function createAcademyAddonPlayers(now = Date.now()): Player[] {
  return [
    createPlayer({
      name: 'Austin Ashworth',
      country: 'England',
      naturalPosition: 'CM',
      currentPosition: 'CM',
      secondaryPositions: 'CDM',
      ovr: 55,
      height: "5'5\"",
      potRange: '82-94',
      status: null,
      source: 'Academy',
      initialSM: 4,
      currentSM: 4,
      initialWF: 2,
      currentWF: 2,
      initialWorkRate: 'M/M',
      currentWorkRate: 'M/M',
      squadLocation: 'academy',
      updatedAt: now,
    }),
    createPlayer({
      name: 'Steven Gordson',
      country: 'Canada',
      naturalPosition: 'RB',
      currentPosition: 'RB',
      secondaryPositions: 'CB',
      ovr: 56,
      height: "5'9\"",
      potRange: '81-94',
      status: null,
      source: 'Academy',
      initialSM: 3,
      currentSM: 3,
      initialWF: 3,
      currentWF: 3,
      initialWorkRate: 'L/H',
      currentWorkRate: 'L/H',
      squadLocation: 'academy',
      updatedAt: now,
    }),
    createPlayer({
      name: 'Marco Santoro',
      country: 'Italy',
      naturalPosition: 'CDM',
      currentPosition: 'CDM',
      secondaryPositions: 'CM',
      ovr: 62,
      height: "5'7\"",
      potRange: '82-94',
      status: null,
      source: 'Academy',
      initialSM: 3,
      currentSM: 3,
      initialWF: 3,
      currentWF: 3,
      initialWorkRate: 'L/H',
      currentWorkRate: 'L/H',
      squadLocation: 'academy',
      updatedAt: now,
    }),
    createPlayer({
      name: 'Lucas Bird',
      country: 'Canada',
      naturalPosition: 'RB',
      currentPosition: 'RB',
      secondaryPositions: 'CB',
      ovr: 56,
      height: "5'7\"",
      potRange: '77-94',
      status: null,
      source: 'Academy',
      initialSM: 3,
      currentSM: 3,
      initialWF: 4,
      currentWF: 4,
      initialWorkRate: 'M/M',
      currentWorkRate: 'M/M',
      squadLocation: 'academy',
      updatedAt: now,
    }),
    createPlayer({
      name: 'Giacomo Bianchi',
      country: 'Italy',
      naturalPosition: 'RWB',
      currentPosition: 'RWB',
      secondaryPositions: '',
      ovr: 56,
      height: "5'8\"",
      potRange: '76-94',
      status: null,
      source: 'Academy',
      initialSM: 3,
      currentSM: 3,
      initialWF: 5,
      currentWF: 5,
      initialWorkRate: 'L/M',
      currentWorkRate: 'L/M',
      squadLocation: 'academy',
      updatedAt: now,
    }),
  ]
}

/**
 * Append screenshot YA players missing from an existing save (by name).
 * Only tops up saves that already have the original YA batch.
 */
export function mergeMissingAcademyAddons(players: Player[]): Player[] {
  const existing = new Set(players.map((p) => p.name))
  if (!existing.has('Jack Rogerson') && !existing.has('Julen Pérez')) {
    return players
  }
  const missing = createAcademyAddonPlayers().filter(
    (p) => !existing.has(p.name) && !isNameReleased(p.name),
  )
  return missing.length === 0 ? players : [...players, ...missing]
}
