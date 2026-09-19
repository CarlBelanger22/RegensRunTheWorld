import { ensureSecondaryIncludesCurrent } from './positions'
import { loadReleasedNames } from './releasedNames'
import type { Player } from '../types/player'

export const BACKUP_VERSION = 2 as const

export interface PlayersBackup {
  version: typeof BACKUP_VERSION
  exportedAt: string
  players: Player[]
  /** Tombstones so Release survives Import on another machine. */
  releasedNames: string[]
}

export type ParseBackupResult =
  | { ok: true; players: Player[]; releasedNames?: string[] }
  | { ok: false; error: string }

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizePlayer(raw: unknown): Player | null {
  if (raw == null || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  if (typeof p.id !== 'string' || !p.id.trim()) return null
  if (typeof p.name !== 'string' || !p.name.trim()) return null

  const naturalPosition = asString(p.naturalPosition, 'CM')
  const currentPosition = asString(p.currentPosition, naturalPosition)
  const secondaryPositions = ensureSecondaryIncludesCurrent(
    naturalPosition,
    currentPosition,
    asString(p.secondaryPositions),
  )

  const loanClub =
    typeof p.loanClub === 'string' && p.loanClub.trim()
      ? p.loanClub.trim()
      : undefined

  const upgradesSettled =
    typeof p.upgradesSettled === 'boolean' ? p.upgradesSettled : undefined

  const initialPlayablePositions = Array.isArray(p.initialPlayablePositions)
    ? p.initialPlayablePositions.filter(
        (x): x is string => typeof x === 'string' && x.trim().length > 0,
      )
    : [naturalPosition]

  return {
    ...(p as unknown as Player),
    id: p.id,
    name: p.name,
    country: asString(p.country),
    naturalPosition,
    currentPosition,
    secondaryPositions,
    initialPlayablePositions,
    ovr: asNumber(p.ovr, 50),
    height: asString(p.height),
    potRange: asString(p.potRange),
    status: (p.status as Player['status']) ?? null,
    source: (p.source as Player['source']) ?? 'Unknown',
    regenOf:
      typeof p.regenOf === 'string' && p.regenOf.trim()
        ? p.regenOf.trim()
        : undefined,
    initialSM: asNumber(p.initialSM, 3),
    currentSM: asNumber(p.currentSM, asNumber(p.initialSM, 3)),
    initialWF: asNumber(p.initialWF, 3),
    currentWF: asNumber(p.currentWF, asNumber(p.initialWF, 3)),
    initialWorkRate: asString(p.initialWorkRate, 'M/M'),
    currentWorkRate: asString(p.currentWorkRate, asString(p.initialWorkRate, 'M/M')),
    squadLocation: (p.squadLocation as Player['squadLocation']) ?? 'academy',
    transferFee:
      typeof p.transferFee === 'number' && Number.isFinite(p.transferFee)
        ? p.transferFee
        : undefined,
    destinationClub:
      typeof p.destinationClub === 'string' && p.destinationClub.trim()
        ? p.destinationClub.trim()
        : undefined,
    loanClub,
    upgradesSettled,
    listOrder:
      typeof p.listOrder === 'number' && Number.isFinite(p.listOrder)
        ? p.listOrder
        : undefined,
    notes:
      typeof p.notes === 'string' && p.notes.trim() ? p.notes.trim() : undefined,
    updatedAt: asNumber(p.updatedAt, Date.now()),
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

function normalizeReleasedNames(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  return raw
    .filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
    .map((n) => n.trim())
}

/** Build a versioned backup object for download / workspace save. */
export function serializeBackup(
  players: Player[],
  options: {
    exportedAt?: string
    releasedNames?: string[]
  } = {},
): PlayersBackup {
  const releasedNames =
    options.releasedNames ??
    [...loadReleasedNames()].sort((a, b) => a.localeCompare(b))

  return {
    version: BACKUP_VERSION,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    players,
    releasedNames,
  }
}

/** Parse backup JSON text (envelope v1/v2 or bare Player[]). */
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

  const releasedNames = normalizeReleasedNames(envelope.releasedNames)
  return { ok: true, players, releasedNames }
}

/** e.g. rrtw-backup-2026-09-06.json */
export function backupFilename(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `rrtw-backup-${y}-${m}-${d}.json`
}

export type DownloadBackupResult = {
  filename: string
  workspaceSaved: boolean
}

/**
 * Browser download + best-effort write to workspace `backups/` via Vite
 * middleware (local `npm run dev` only).
 */
export async function downloadPlayersBackup(
  players: Player[],
): Promise<DownloadBackupResult> {
  const filename = backupFilename()
  const backup = serializeBackup(players)
  const json = JSON.stringify(backup, null, 2)

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)

  let workspaceSaved = false
  try {
    const res = await fetch('/__rrtw/save-backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, backup }),
    })
    workspaceSaved = res.ok
  } catch {
    workspaceSaved = false
  }

  return { filename, workspaceSaved }
}
