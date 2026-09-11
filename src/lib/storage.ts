import { createSeedPlayers } from './seed'
import { mergeMissingAcademyAddons } from './academyAddons'
import { mergeMissingSeniorAddons } from './seniorAddons'
import type { Player } from '../types/player'

/** v6: 4 senior + 16 YA from screenshots. */
export const STORAGE_KEY = 'rrtw:players:v6'
const LEGACY_KEYS = [
  'rrtw:players:v1',
  'rrtw:players:v2',
  'rrtw:players:v3',
  'rrtw:players:v4',
  'rrtw:players:v5',
]

function getStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

function purgeLegacyKeys(storage: Storage): void {
  for (const key of LEGACY_KEYS) {
    storage.removeItem(key)
  }
}

/** Names added after the first YA batch — merge into existing saves by name. */
const ACADEMY_ADDONS = [
  'Rafael Pinto',
  'Pedro Martins',
  'Carlos Rodrigues',
  'Cristian Escobar',
  'Lucas Corona',
  'Joaquín Serrano',
  'Alfonso Martins',
  'Fabião Izquierdo',
] as const

/** One-off screenshot typo fixes — does not wipe the roster. */
function applyDataCorrections(players: Player[]): Player[] {
  return players.map((p) => {
    if (p.name === 'Dani Rivas' && p.initialSM === 3) {
      return {
        ...p,
        initialSM: 4,
        currentSM: p.currentSM === 3 ? 4 : p.currentSM,
      }
    }
    // Screenshot showed 5★ SM now, but challenge start was 4★
    if (p.name === 'Julen Pérez' && p.initialSM === 5) {
      return {
        ...p,
        initialSM: 4,
        currentSM: p.currentSM < 4 ? 4 : p.currentSM,
      }
    }
    return p
  })
}

/** Append seed academy players that are missing from an existing save. */
function mergeMissingAcademyPlayers(players: Player[]): Player[] {
  const existing = new Set(players.map((p) => p.name))
  // Only top-up saves that already have the original YA batch
  if (!existing.has('Jack Rogerson') && !existing.has('Julen Pérez')) {
    return players
  }
  const missing = createSeedPlayers().filter(
    (p) =>
      p.squadLocation === 'academy' &&
      (ACADEMY_ADDONS as readonly string[]).includes(p.name) &&
      !existing.has(p.name),
  )
  return missing.length === 0 ? players : [...players, ...missing]
}

export function loadPlayers(): Player[] {
  const storage = getStorage()
  if (!storage) return createSeedPlayers()

  purgeLegacyKeys(storage)

  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) {
    const seed = createSeedPlayers()
    savePlayers(seed)
    return seed
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      const seed = createSeedPlayers()
      savePlayers(seed)
      return seed
    }
    const players = mergeMissingSeniorAddons(
      mergeMissingAcademyAddons(
        mergeMissingAcademyPlayers(
          applyDataCorrections(
            (parsed as Player[]).map((p) => ({
              ...p,
              height: typeof p.height === 'string' ? p.height : '',
            })),
          ),
        ),
      ),
    )
    savePlayers(players)
    return players
  } catch (error) {
    console.warn('[rrtw] Failed to parse players from localStorage', error)
    const seed = createSeedPlayers()
    savePlayers(seed)
    return seed
  }
}

export function savePlayers(players: Player[]): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(players))
  } catch (error) {
    console.error('[rrtw] Failed to save players to localStorage', error)
  }
}

export function clearPlayersStorage(): void {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(STORAGE_KEY)
  purgeLegacyKeys(storage)
}
