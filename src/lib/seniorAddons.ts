import { createPlayer } from './players'
import type { Player } from '../types/player'

/**
 * Seniors added from screenshots after the initial seed.
 * Merged into existing browser saves by name (never duplicates).
 */
export function createSeniorAddonPlayers(now = Date.now()): Player[] {
  return [
    createPlayer({
      name: 'Laurenço Couto',
      country: 'Portugal',
      naturalPosition: 'CM',
      currentPosition: 'CM',
      secondaryPositions: 'CDM',
      ovr: 66,
      height: "5'9\"",
      potRange: '',
      status: null,
      source: 'Unknown',
      initialSM: 3,
      currentSM: 3,
      initialWF: 3,
      currentWF: 3,
      initialWorkRate: 'M/H',
      currentWorkRate: 'M/H',
      squadLocation: 'senior',
      updatedAt: now,
    }),
    createPlayer({
      name: 'Pablo Campos',
      country: 'Argentina',
      naturalPosition: 'CB',
      currentPosition: 'CB',
      secondaryPositions: '',
      ovr: 63,
      height: "6'0\"",
      potRange: '',
      status: null,
      source: 'Unknown',
      initialSM: 3,
      currentSM: 3,
      initialWF: 3,
      currentWF: 3,
      initialWorkRate: 'L/H',
      currentWorkRate: 'L/H',
      squadLocation: 'senior',
      updatedAt: now,
    }),
    createPlayer({
      name: 'Alessandro Branco',
      country: 'Brazil',
      naturalPosition: 'RB',
      currentPosition: 'RB',
      secondaryPositions: '',
      ovr: 69,
      height: "5'7\"",
      potRange: '',
      status: null,
      source: 'Unknown',
      initialSM: 2,
      currentSM: 2,
      initialWF: 3,
      currentWF: 3,
      initialWorkRate: 'H/H',
      currentWorkRate: 'H/H',
      squadLocation: 'senior',
      updatedAt: now,
    }),
    createPlayer({
      name: 'Mauro Poli',
      country: 'Italy',
      naturalPosition: 'GK',
      currentPosition: 'GK',
      secondaryPositions: '',
      ovr: 69,
      height: "6'3\"",
      potRange: '',
      status: null,
      source: 'Unknown',
      initialSM: 1,
      currentSM: 1,
      initialWF: 3,
      currentWF: 3,
      initialWorkRate: 'M/L',
      currentWorkRate: 'M/L',
      squadLocation: 'senior',
      updatedAt: now,
    }),
    createPlayer({
      name: 'Ager Correa',
      country: 'Spain',
      naturalPosition: 'GK',
      currentPosition: 'GK',
      secondaryPositions: '',
      ovr: 66,
      height: "6'5\"",
      potRange: '',
      status: null,
      source: 'Unknown',
      initialSM: 1,
      currentSM: 1,
      initialWF: 3,
      currentWF: 3,
      initialWorkRate: 'M/L',
      currentWorkRate: 'M/L',
      squadLocation: 'senior',
      updatedAt: now,
    }),
    createPlayer({
      name: 'Alex Aguilar',
      country: 'Argentina',
      naturalPosition: 'LB',
      currentPosition: 'LB',
      secondaryPositions: '',
      ovr: 69,
      height: "5'7\"",
      potRange: '',
      status: null,
      source: 'Unknown',
      initialSM: 2,
      currentSM: 2,
      initialWF: 5,
      currentWF: 5,
      initialWorkRate: 'L/M',
      currentWorkRate: 'L/M',
      squadLocation: 'senior',
      updatedAt: now,
    }),
    createPlayer({
      name: 'Xacobe Ojeda',
      country: 'Spain',
      naturalPosition: 'RW',
      currentPosition: 'RW',
      secondaryPositions: 'RM',
      ovr: 71,
      height: "5'9\"",
      potRange: '',
      status: null,
      source: 'Unknown',
      initialSM: 3,
      currentSM: 3,
      initialWF: 4,
      currentWF: 4,
      initialWorkRate: 'M/M',
      currentWorkRate: 'M/M',
      squadLocation: 'senior',
      updatedAt: now,
    }),
  ]
}

/**
 * Append screenshot seniors missing from an existing save (by name).
 * Only tops up saves that already look like this career (not empty / toy lists).
 */
export function mergeMissingSeniorAddons(players: Player[]): Player[] {
  const existing = new Set(players.map((p) => p.name))
  if (
    !existing.has('Matěj Liška') &&
    !existing.has('Breno Duarte') &&
    !existing.has('Peetu Jaatinen')
  ) {
    return players
  }
  const missing = createSeniorAddonPlayers().filter((p) => !existing.has(p.name))
  return missing.length === 0 ? players : [...players, ...missing]
}
