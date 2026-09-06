import { useCallback, useEffect, useState } from 'react'
import { loadPlayers, savePlayers } from '../lib/storage'
import type { Player } from '../types/player'

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>(() => loadPlayers())

  useEffect(() => {
    savePlayers(players)
  }, [players])

  const replacePlayers = useCallback((next: Player[]) => {
    setPlayers(next)
  }, [])

  const upsertPlayer = useCallback((player: Player) => {
    setPlayers((prev) => {
      const index = prev.findIndex((p) => p.id === player.id)
      if (index === -1) return [...prev, player]
      const copy = prev.slice()
      copy[index] = player
      return copy
    })
  }, [])

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return { players, setPlayers: replacePlayers, upsertPlayer, removePlayer }
}
