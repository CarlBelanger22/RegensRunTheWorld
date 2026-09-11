import { createPlayer } from './players'
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
  const missing = createAcademyAddonPlayers().filter((p) => !existing.has(p.name))
  return missing.length === 0 ? players : [...players, ...missing]
}
