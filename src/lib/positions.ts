/** Normalize and dedupe position codes from free text / arrays. */
export function parsePositions(
  ...inputs: Array<string | string[] | undefined | null>
): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const input of inputs) {
    if (input == null) continue
    const parts = Array.isArray(input) ? input : input.split(/[,/|]+/)
    for (const part of parts) {
      const code = part.trim().toUpperCase()
      if (!code || seen.has(code)) continue
      seen.add(code)
      result.push(code)
    }
  }

  return result
}

/**
 * Squad position order (user-specified, left→right / back→front):
 * GK, LWB, LB, CB, RB, RWB, CDM, LM, CM, CAM, RM, LW, RW, CF, ST
 */
const POSITION_SORT_RANK: Record<string, number> = {
  GK: 0,
  LWB: 1,
  LB: 2,
  CB: 3,
  RB: 4,
  RWB: 5,
  CDM: 6,
  LM: 7,
  CM: 8,
  CAM: 9,
  RM: 10,
  LW: 11,
  RW: 12,
  CF: 13,
  ST: 14,
}

/** Lower = earlier in squad position ordering. Unknown codes sort last. */
export function fifaPositionSortKey(position: string): number {
  const code = position.trim().toUpperCase()
  return POSITION_SORT_RANK[code] ?? 999
}

export function buildInitialPlayablePositions(
  naturalPosition: string,
  secondaryPositions: string,
): string[] {
  return parsePositions(naturalPosition, secondaryPositions)
}

export function getCurrentPlayablePositions(player: {
  naturalPosition: string
  secondaryPositions: string
  currentPosition?: string
}): string[] {
  return parsePositions(
    player.naturalPosition,
    player.currentPosition,
    player.secondaryPositions,
  )
}

/** How many playable positions were added beyond the frozen initial set. */
export function countExtraPositions(player: {
  naturalPosition: string
  secondaryPositions: string
  currentPosition?: string
  initialPlayablePositions: string[]
}): number {
  const initial = new Set(
    player.initialPlayablePositions.map((p) => p.trim().toUpperCase()),
  )
  const current = getCurrentPlayablePositions(player)
  return current.filter((p) => !initial.has(p)).length
}
