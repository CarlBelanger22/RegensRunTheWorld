/** GKs are exempt from SM/WF / WR / position challenge limits. */
export function isGoalkeeper(player: {
  naturalPosition: string
  currentPosition: string
}): boolean {
  return (
    player.naturalPosition.trim().toUpperCase() === 'GK' ||
    player.currentPosition.trim().toUpperCase() === 'GK'
  )
}
