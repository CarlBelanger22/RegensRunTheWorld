import { WORK_RATE_PRESETS, type WorkRate } from '../types/player'

const RANK: Record<string, number> = { L: 0, M: 1, H: 2 }

export interface WorkRateParts {
  attack: 'L' | 'M' | 'H'
  defense: 'L' | 'M' | 'H'
}

/** Parse "H/M" style work rates. */
export function parseWorkRate(value: string): WorkRateParts | null {
  const match = value.trim().toUpperCase().match(/^([LMH])\s*\/\s*([LMH])$/)
  if (!match) return null
  return {
    attack: match[1] as WorkRateParts['attack'],
    defense: match[2] as WorkRateParts['defense'],
  }
}

function rank(side: string): number {
  return RANK[side] ?? -1
}

/** True when both Att and Def are already High (no legal WR upgrade left). */
export function isWorkRateMaxed(value: string): boolean {
  const parts = parseWorkRate(value)
  return parts != null && parts.attack === 'H' && parts.defense === 'H'
}

/**
 * Total upward steps from baseline → current (attack + defense).
 * Decreases on either side count as broken-level (return a high sentinel via negative?);
 * we return null for unparseable; for decreases return steps as if broken (>=2) by
 * counting absolute drop + any ups, or simpler: if any side decreased, treat as broken.
 */
export function workRateStepDelta(
  initialWorkRate: string,
  currentWorkRate: string,
): number | null {
  const init = parseWorkRate(initialWorkRate)
  const cur = parseWorkRate(currentWorkRate)
  if (!init || !cur) return null

  const atk = rank(cur.attack) - rank(init.attack)
  const def = rank(cur.defense) - rank(init.defense)

  if (atk < 0 || def < 0) {
    // Illegal decrease — surface as broken (>=2)
    return 2 + Math.max(0, -atk) + Math.max(0, -def)
  }

  return atk + def
}

/**
 * Presets that do not lower either side vs baseline.
 * Always includes `current` if provided so a saved illegal value stays selectable to fix.
 */
export function workRateOptionsFromBaseline(
  baseline: string,
  current?: string,
): WorkRate[] {
  const init = parseWorkRate(baseline)
  if (!init) {
    return [...WORK_RATE_PRESETS]
  }

  const allowed = WORK_RATE_PRESETS.filter((preset) => {
    const p = parseWorkRate(preset)
    if (!p) return false
    return (
      rank(p.attack) >= rank(init.attack) &&
      rank(p.defense) >= rank(init.defense)
    )
  })

  const cur = current?.trim()
  if (cur && !allowed.includes(cur as WorkRate)) {
    return [cur as WorkRate, ...allowed]
  }

  return allowed
}
