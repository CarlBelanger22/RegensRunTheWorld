import type { Player } from '../types/player'

export const BACKUP_VERSION = 1 as const

export interface PlayersBackup {
  version: typeof BACKUP_VERSION
  exportedAt: string
  players: Player[]
}

export type ParseBackupResult =
  | { ok: true; players: Player[] }
  | { ok: false; error: string }

function normalizePlayer(raw: unknown): Player | null {
  if (raw == null || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  if (typeof p.id !== 'string' || !p.id.trim()) return null
  if (typeof p.name !== 'string' || !p.name.trim()) return null

  return {
    ...(p as unknown as Player),
    id: p.id,
    name: p.name,
    height: typeof p.height === 'string' ? p.height : '',
  }
}

function normalizePlayers(list: unknown[]): Player[] | null {
  const players: Player[] = []
  for (const item of list) {
    const player = normalizePlayer(item)
    if (!player) return null
    players.push(player)
  }
  return players
}

/** Build a versioned backup object for download. */
export function serializeBackup(
  players: Player[],
  exportedAt = new Date().toISOString(),
): PlayersBackup {
  return {
    version: BACKUP_VERSION,
    exportedAt,
    players,
  }
}

/** Parse backup JSON text (envelope v1 or bare Player[]). */
export function parseBackup(jsonText: string): ParseBackupResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { ok: false, error: 'File is not valid JSON.' }
  }

  if (Array.isArray(parsed)) {
    const players = normalizePlayers(parsed)
    if (!players) {
      return {
        ok: false,
        error: 'Backup array has invalid players (each needs id and name).',
      }
    }
    return { ok: true, players }
  }

  if (parsed == null || typeof parsed !== 'object') {
    return { ok: false, error: 'Backup must be a JSON object or array.' }
  }

  const envelope = parsed as Record<string, unknown>
  if (!Array.isArray(envelope.players)) {
    return { ok: false, error: 'Backup is missing a players array.' }
  }

  const players = normalizePlayers(envelope.players)
  if (!players) {
    return {
      ok: false,
      error: 'Backup players are invalid (each needs id and name).',
    }
  }

  return { ok: true, players }
}

/** e.g. rrtw-backup-2026-09-06.json */
export function backupFilename(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `rrtw-backup-${y}-${m}-${d}.json`
}

/** Trigger a browser download of the current roster backup. */
export function downloadPlayersBackup(players: Player[]): void {
  const json = JSON.stringify(serializeBackup(players), null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = backupFilename()
  anchor.click()
  URL.revokeObjectURL(url)
}
