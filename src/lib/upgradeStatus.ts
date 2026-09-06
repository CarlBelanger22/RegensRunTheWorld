import { countExtraPositions } from './positions'
import { isGoalkeeper } from './players'
import { workRateStepDelta } from './workRate'
import type { Player, UpgradeBadge, UpgradeStatus } from '../types/player'

/**
 * SM and WF share one career +1: upgrade either SM or WF once, not both.
 * Goalkeepers have no SM/WF limit.
 */
function smWfBadge(player: Player): UpgradeBadge {
  if (isGoalkeeper(player)) {
    return { kind: 'available', label: 'SM/WF: Free (GK)' }
  }

  const smDelta = Math.max(0, player.currentSM - player.initialSM)
  const wfDelta = Math.max(0, player.currentWF - player.initialWF)
  const total = smDelta + wfDelta

  if (total <= 0) {
    return { kind: 'available', label: 'SM/WF: Avail' }
  }

  if (total === 1) {
    if (smDelta === 1) {
      return { kind: 'used', label: 'SM/WF: +1 SM' }
    }
    return { kind: 'used', label: 'SM/WF: +1 WF' }
  }

  const parts: string[] = []
  if (smDelta > 0) parts.push(`+${smDelta} SM`)
  if (wfDelta > 0) parts.push(`+${wfDelta} WF`)
  return {
    kind: 'broken',
    label: `Broken: ${parts.join(' & ')}`,
  }
}

function workRateBadge(
  initialWorkRate: string,
  currentWorkRate: string,
): UpgradeBadge {
  const steps = workRateStepDelta(initialWorkRate, currentWorkRate)
  if (steps == null) {
    return { kind: 'broken', label: 'Broken: WR?' }
  }
  if (steps <= 0) {
    return { kind: 'available', label: 'WR: Avail' }
  }
  if (steps === 1) {
    return { kind: 'used', label: 'WR: Used' }
  }
  return {
    kind: 'broken',
    label: `Broken: +${steps} WR`,
  }
}

function positionBadge(player: Player): UpgradeBadge {
  const extras = countExtraPositions(player)
  if (extras <= 0) {
    return { kind: 'available', label: 'Pos: Avail' }
  }
  if (extras === 1) {
    return { kind: 'used', label: 'Pos: Used' }
  }
  return {
    kind: 'broken',
    label: `Broken: +${extras} Pos`,
  }
}

export function getUpgradeStatus(player: Player): UpgradeStatus {
  return {
    smWf: smWfBadge(player),
    wr: workRateBadge(player.initialWorkRate, player.currentWorkRate),
    position: positionBadge(player),
  }
}

/** True when destination/fee marks a sold alumni on the external tab. */
export function isSoldAlumni(player: Player): boolean {
  if (player.squadLocation !== 'external') return false
  const hasClub = Boolean(player.destinationClub?.trim())
  const hasFee =
    typeof player.transferFee === 'number' &&
    Number.isFinite(player.transferFee)
  return hasClub || hasFee
}
