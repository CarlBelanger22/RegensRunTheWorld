import { useCallback, useEffect, useState } from 'react'
import { ensureListOrders, nextListOrder } from '../lib/listOrder'
import { markPlayerReleased } from '../lib/releasedNames'
import { loadPlayers, savePlayers } from '../lib/storage'
import type { Player } from '../types/player'

export function usePlayers() {
  const [players, setPlayersState] = useState<Player[]>(() => loadPlayers())

  useEffect(() => {
    savePlayers(players)
  }, [players])

  const replacePlayers = useCallback((next: Player[]) => {
    setPlayersState(ensureListOrders(next))
  }, [])

  const upsertPlayer = useCallback((player: Player) => {
    setPlayersState((prev) => {
      const index = prev.findIndex((p) => p.id === player.id)
      const withOrder: Player =
        typeof player.listOrder === 'number' && Number.isFinite(player.listOrder)
          ? player
          : { ...player, listOrder: nextListOrder(prev) }
      if (index === -1) return [...prev, withOrder]
      const copy = prev.slice()
      copy[index] = withOrder
      return copy
    })
  }, [])

  const removePlayer = useCallback((id: string) => {
    setPlayersState((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) markPlayerReleased(target.name)
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  return {
    players,
    setPlayers: replacePlayers,
    upsertPlayer,
    removePlayer,
  }
}
