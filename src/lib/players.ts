import { nanoid } from 'nanoid'
import { buildInitialPlayablePositions } from './positions'
import { applyAutoUpgradesSettled } from './upgradeStatus'
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

  const isGk =
    input.naturalPosition.trim().toUpperCase() === 'GK' ||
    input.currentPosition.trim().toUpperCase() === 'GK'

  const player: Player = {
    ...input,
    id: input.id ?? nanoid(),
    height: (input.height ?? '').trim(),
    initialPlayablePositions,
    // GKs have no SM/WF/WR/pos challenge — mark settled on create
    upgradesSettled: input.upgradesSettled ?? isGk,
    updatedAt: input.updatedAt ?? Date.now(),
  }

  return applyAutoUpgradesSettled(player, {
    upgradesSettledExplicit: input.upgradesSettled !== undefined,
  })
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

  const next: Player = {
    ...player,
    ...safePatch,
    id: player.id,
    initialPlayablePositions: player.initialPlayablePositions,
    initialSM: player.initialSM,
    initialWF: player.initialWF,
    initialWorkRate: player.initialWorkRate,
    updatedAt: Date.now(),
  }

  return applyAutoUpgradesSettled(next, {
    upgradesSettledExplicit: Object.prototype.hasOwnProperty.call(
      patch,
      'upgradesSettled',
    ),
  })
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
    loanClub: '',
  })
}

/** Send on loan — stays senior; club required (no fee). */
export function loanPlayer(player: Player, loanClub: string): Player {
  const club = loanClub.trim()
  return touchPlayer(player, {
    squadLocation: 'senior' satisfies SquadLocation,
    loanClub: club,
  })
}

/** End loan — clear loan club. */
export function recallPlayer(player: Player): Player {
  return touchPlayer(player, { loanClub: '' })
}

export { isGoalkeeper } from './goalkeeper'

export type { PlayerSource, PlayerStatus, SquadLocation }
