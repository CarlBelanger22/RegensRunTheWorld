import { nanoid } from 'nanoid'
import { buildInitialPlayablePositions } from './positions'
import type { Player, PlayerSource, PlayerStatus, SquadLocation } from '../types/player'

export type NewPlayerInput = Omit<
  Player,
  'id' | 'initialPlayablePositions' | 'updatedAt' | 'height'
> & {
  id?: string
  height?: string
  initialPlayablePositions?: string[]
  updatedAt?: number
}

export function createPlayer(input: NewPlayerInput): Player {
  const initialPlayablePositions =
    input.initialPlayablePositions ??
    buildInitialPlayablePositions(
      input.naturalPosition,
      input.secondaryPositions,
    )

  return {
    ...input,
    id: input.id ?? nanoid(),
    height: (input.height ?? '').trim(),
    initialPlayablePositions,
    updatedAt: input.updatedAt ?? Date.now(),
  }
}

export function touchPlayer(player: Player, patch: Partial<Player>): Player {
  const {
    initialPlayablePositions: _positions,
    initialSM: _sm,
    initialWF: _wf,
    initialWorkRate: _wr,
    id: _id,
    ...safePatch
  } = patch

  return {
    ...player,
    ...safePatch,
    id: player.id,
    initialPlayablePositions: player.initialPlayablePositions,
    initialSM: player.initialSM,
    initialWF: player.initialWF,
    initialWorkRate: player.initialWorkRate,
    updatedAt: Date.now(),
  }
}

export type FrozenBaselinePatch = {
  initialPlayablePositions: string[]
  initialSM: number
  initialWF: number
  initialWorkRate: string
}

/**
 * Correct challenge baseline fields (screenshot typos, etc.).
 * Unlike touchPlayer, this is allowed to rewrite frozen initials.
 */
export function correctFrozenBaseline(
  player: Player,
  patch: FrozenBaselinePatch,
): Player {
  const sm = Math.min(5, Math.max(1, Math.round(patch.initialSM)))
  const wf = Math.min(5, Math.max(1, Math.round(patch.initialWF)))
  return {
    ...player,
    initialPlayablePositions: patch.initialPlayablePositions.map((p) =>
      p.trim().toUpperCase(),
    ).filter(Boolean),
    initialSM: sm,
    initialWF: wf,
    initialWorkRate: patch.initialWorkRate.trim(),
    updatedAt: Date.now(),
  }
}

export function promoteToSenior(player: Player): Player {
  return touchPlayer(player, {
    squadLocation: 'senior' satisfies SquadLocation,
    // status left unset on purpose
  })
}

export function sellPlayer(
  player: Player,
  destinationClub: string,
  transferFee: number,
): Player {
  return touchPlayer(player, {
    squadLocation: 'external',
    destinationClub,
    transferFee,
  })
}

/** GKs are exempt from SM/WF either-or challenge limits. */
export function isGoalkeeper(player: {
  naturalPosition: string
  currentPosition: string
}): boolean {
  return (
    player.naturalPosition.trim().toUpperCase() === 'GK' ||
    player.currentPosition.trim().toUpperCase() === 'GK'
  )
}

export type { PlayerSource, PlayerStatus, SquadLocation }
