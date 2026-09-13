export interface PotRangeBounds {
  min: number
  max: number
}

/**
 * Parse academy scout range like "78-94", "78 – 94", or a single "82".
 * Returns null if unparseable. Used for sorting/display — never for status.
 */
export function parsePotRange(potRange: string): PotRangeBounds | null {
  const cleaned = potRange.trim()
  if (!cleaned) return null

  const rangeMatch = cleaned.match(/^(\d{1,2})\s*[-–—]\s*(\d{1,2})$/)
  if (rangeMatch) {
    const min = Number(rangeMatch[1])
    const max = Number(rangeMatch[2])
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null
    return { min: Math.min(min, max), max: Math.max(min, max) }
  }

  const singleMatch = cleaned.match(/^(\d{1,2})$/)
  if (singleMatch) {
    const value = Number(singleMatch[1])
    if (!Number.isFinite(value)) return null
    return { min: value, max: value }
  }

  return null
}

/** Sort key: higher max first; unknown ranges sort last. */
export function potRangeSortKey(potRange: string): number {
  const bounds = parsePotRange(potRange)
  return bounds ? bounds.max : -1
}

/** True when scout range width is exactly 6 (e.g. 85–91). */
export function isPotRangeDiffSix(potRange: string): boolean {
  const bounds = parsePotRange(potRange)
  if (!bounds) return false
  return bounds.max - bounds.min === 6
}
