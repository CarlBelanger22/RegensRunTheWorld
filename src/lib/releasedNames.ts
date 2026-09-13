import type { Player } from '../types/player'

export const RELEASED_NAMES_KEY = 'rrtw:released:v1'

/**
 * Names the user already Release'd before tombstones existed.
 * Kept out of auto-merge / stripped if they resurrected into the save.
 */
const LEGACY_RELEASED_SEED = [
  'Lucas Corona',
  'Rafael Pinto',
  'Alfonso Martins',
] as const

function getStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

function readStoredNames(): string[] {
  const storage = getStorage()
  if (!storage) return []
  const raw = storage.getItem(RELEASED_NAMES_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (n): n is string => typeof n === 'string' && n.trim().length > 0,
    )
  } catch {
    return []
  }
}

function writeNames(names: Set<string>): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(
      RELEASED_NAMES_KEY,
      JSON.stringify([...names].sort((a, b) => a.localeCompare(b))),
    )
  } catch (error) {
    console.error('[rrtw] Failed to save released names', error)
  }
}

/** Released names, including one-time seed for known pre-tombstone Releases. */
export function loadReleasedNames(): Set<string> {
  const names = new Set(readStoredNames())
  let changed = false
  for (const name of LEGACY_RELEASED_SEED) {
    if (!names.has(name)) {
      names.add(name)
      changed = true
    }
  }
  if (changed) writeNames(names)
  return names
}

export function isNameReleased(name: string): boolean {
  return loadReleasedNames().has(name.trim())
}

/** Record a Release / delete so auto-merge will not bring the player back. */
export function markPlayerReleased(name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  const names = loadReleasedNames()
  if (names.has(trimmed)) return
  names.add(trimmed)
  writeNames(names)
}

/** Drop resurrected rows that the user already released. */
export function omitReleasedPlayers(players: Player[]): Player[] {
  const released = loadReleasedNames()
  if (released.size === 0) return players
  return players.filter((p) => !released.has(p.name))
}

export function clearReleasedNamesStorage(): void {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(RELEASED_NAMES_KEY)
}

/** Replace the released-name set (e.g. Import backup v2). */
export function replaceReleasedNames(names: string[]): void {
  const next = new Set(
    names.map((n) => n.trim()).filter((n) => n.length > 0),
  )
  writeNames(next)
}
