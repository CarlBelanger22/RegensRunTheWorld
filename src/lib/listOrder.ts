import type { Player } from '../types/player'

function hasListOrder(player: Player): boolean {
  return typeof player.listOrder === 'number' && Number.isFinite(player.listOrder)
}

/** Next order value for a newly added player (bottom of overall list). */
export function nextListOrder(players: Player[]): number {
  let max = -1
  for (const p of players) {
    if (hasListOrder(p) && (p.listOrder as number) > max) {
      max = p.listOrder as number
    }
  }
  return max + 1
}

/**
 * Fill missing `listOrder` without reshuffling players that already have one.
 * If nobody has an order yet, assign by current array index (preserves storage order).
 */
export function ensureListOrders(players: Player[]): Player[] {
  const anyOrdered = players.some(hasListOrder)
  if (!anyOrdered) {
    return players.map((p, i) =>
      hasListOrder(p) ? p : { ...p, listOrder: i },
    )
  }

  let max = -1
  for (const p of players) {
    if (hasListOrder(p) && (p.listOrder as number) > max) {
      max = p.listOrder as number
    }
  }

  let changed = false
  const next = players.map((p) => {
    if (hasListOrder(p)) return p
    changed = true
    max += 1
    return { ...p, listOrder: max }
  })
  return changed ? next : players
}

export function listOrderValue(player: Player): number {
  return hasListOrder(player) ? (player.listOrder as number) : Number.MAX_SAFE_INTEGER
}

/** True if the row above in the visible list is the same Current position. */
export function canMovePlayerUp(visibleOrdered: Player[], playerId: string): boolean {
  const idx = visibleOrdered.findIndex((p) => p.id === playerId)
  if (idx <= 0) return false
  const player = visibleOrdered[idx]!
  const peer = visibleOrdered[idx - 1]!
  return peer.currentPosition === player.currentPosition
}

/** True if the row below in the visible list is the same Current position. */
export function canMovePlayerDown(
  visibleOrdered: Player[],
  playerId: string,
): boolean {
  const idx = visibleOrdered.findIndex((p) => p.id === playerId)
  if (idx < 0 || idx >= visibleOrdered.length - 1) return false
  const player = visibleOrdered[idx]!
  const peer = visibleOrdered[idx + 1]!
  return peer.currentPosition === player.currentPosition
}

/**
 * Swap `listOrder` with the adjacent same-position peer in the visible Pos list.
 * ↑ = toward top of table (earlier index). No-op across position boundaries.
 */
export function movePlayerAmongVisiblePeers(
  allPlayers: Player[],
  visibleOrdered: Player[],
  playerId: string,
  direction: 'up' | 'down',
): Player[] {
  const idx = visibleOrdered.findIndex((p) => p.id === playerId)
  if (idx < 0) return allPlayers

  const peerIdx = direction === 'up' ? idx - 1 : idx + 1
  if (peerIdx < 0 || peerIdx >= visibleOrdered.length) return allPlayers

  const player = visibleOrdered[idx]!
  const peer = visibleOrdered[peerIdx]!
  if (peer.currentPosition !== player.currentPosition) return allPlayers

  const orderA = listOrderValue(player)
  const orderB = listOrderValue(peer)
  const now = Date.now()

  // Identical orders: nudge so the swap actually changes sort position.
  const nextA = orderA === orderB ? orderB + (direction === 'up' ? -1 : 1) : orderB
  const nextB = orderA === orderB ? orderA : orderA

  return allPlayers.map((p) => {
    if (p.id === player.id) return { ...p, listOrder: nextA, updatedAt: now }
    if (p.id === peer.id) return { ...p, listOrder: nextB, updatedAt: now }
    return p
  })
}
