import type { Player } from '../types/player'

/** True when the player is currently out on loan. */
export function isOnLoan(player: Player): boolean {
  return Boolean(player.loanClub?.trim())
}

/** True when the user marked challenge upgrades as finished. */
export function isUpgradesSettled(player: Player): boolean {
  return player.upgradesSettled === true
}

/**
 * Left-rail color: settled = solid accent; open = muted zinc.
 */
export function playerSettledRailClass(player: Player): string {
  if (isUpgradesSettled(player)) {
    return 'bg-accent hover:bg-emerald-300'
  }
  return 'bg-zinc-700/90 hover:bg-zinc-500'
}

/**
 * Row background for tables.
 * Loan (light blue) overrides status tint.
 */
export function playerRowTintClass(player: Player): string {
  if (isOnLoan(player)) {
    return 'bg-sky-950/60 hover:bg-sky-900/55'
  }

  switch (player.status) {
    case 'Has Potential to Be Special':
      return 'bg-emerald-950/75 hover:bg-emerald-900/60'
    case 'An Exciting Prospect':
      return 'bg-emerald-800/40 hover:bg-emerald-700/35'
    case 'Showing Great Potential':
      return 'bg-amber-950/55 hover:bg-amber-900/45'
    default:
      // At Club Since…, unset, academy
      return 'hover:bg-zinc-900/60'
  }
}
