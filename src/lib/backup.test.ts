import { describe, expect, it } from 'vitest'
import { createPlayer } from './players'
import { backupFilename, parseBackup, serializeBackup } from './backup'

function samplePlayer(name = 'Backup Kid') {
  return createPlayer({
    name,
    country: 'Spain',
    naturalPosition: 'CAM',
    currentPosition: 'CAM',
    secondaryPositions: '',
    ovr: 60,
    height: "5'10\"",
    potRange: '80-90',
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
}

describe('serializeBackup', () => {
  it('wraps players and released names in a v2 envelope', () => {
    const players = [samplePlayer()]
    const backup = serializeBackup(players, {
      exportedAt: '2026-09-06T00:00:00.000Z',
      releasedNames: ['Lucas Corona'],
    })
    expect(backup).toEqual({
      version: 2,
      exportedAt: '2026-09-06T00:00:00.000Z',
      players,
      releasedNames: ['Lucas Corona'],
    })
  })
})

describe('backupFilename', () => {
  it('uses rrtw-backup-YYYY-MM-DD.json', () => {
    expect(backupFilename(new Date(2026, 8, 6))).toBe('rrtw-backup-2026-09-06.json')
  })
})

describe('parseBackup', () => {
  it('round-trips a serialized v2 envelope', () => {
    const players = [samplePlayer('A'), samplePlayer('B')]
    const json = JSON.stringify(
      serializeBackup(players, {
        exportedAt: '2026-09-06T00:00:00.000Z',
        releasedNames: ['Gone'],
      }),
    )
    const result = parseBackup(json)
    expect(result).toEqual({
      ok: true,
      players,
      releasedNames: ['Gone'],
    })
  })

  it('accepts a bare players array without releasedNames', () => {
    const players = [samplePlayer()]
    const result = parseBackup(JSON.stringify(players))
    expect(result).toEqual({ ok: true, players })
    expect(result.ok && result.releasedNames).toBeUndefined()
  })

  it('keeps releasedNames undefined for v1 envelopes', () => {
    const players = [samplePlayer()]
    const result = parseBackup(
      JSON.stringify({
        version: 1,
        exportedAt: '2026-09-01T00:00:00.000Z',
        players,
      }),
    )
    expect(result).toEqual({ ok: true, players })
    expect(result.ok && result.releasedNames).toBeUndefined()
  })

  it('preserves loanClub and upgradesSettled', () => {
    const player = {
      ...samplePlayer(),
      loanClub: 'Ajax',
      upgradesSettled: true,
    }
    const result = parseBackup(
      JSON.stringify(
        serializeBackup([player], {
          releasedNames: [],
          exportedAt: '2026-09-13T00:00:00.000Z',
        }),
      ),
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.players[0]?.loanClub).toBe('Ajax')
      expect(result.players[0]?.upgradesSettled).toBe(true)
      expect(result.releasedNames).toEqual([])
    }
  })

  it('normalizes missing height to empty string', () => {
    const player = samplePlayer()
    const { height: _h, ...withoutHeight } = player
    const result = parseBackup(JSON.stringify([withoutHeight]))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.players[0]?.height).toBe('')
      expect(result.players[0]?.name).toBe(player.name)
    }
  })

  it('rejects invalid JSON', () => {
    expect(parseBackup('{not json')).toEqual({
      ok: false,
      error: 'File is not valid JSON.',
    })
  })

  it('rejects objects without players array', () => {
    expect(parseBackup(JSON.stringify({ version: 1 }))).toEqual({
      ok: false,
      error: 'Backup is missing a players array.',
    })
  })

  it('rejects players missing id or name', () => {
    const result = parseBackup(JSON.stringify([{ id: 'x' }]))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/id and name/i)
    }
  })
})
