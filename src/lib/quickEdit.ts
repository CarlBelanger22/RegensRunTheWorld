/** Clamp overall rating to FIFA bounds. */
export function clampOvr(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(99, Math.max(1, Math.round(value)))
}

/** Clamp skill moves / weak foot stars. */
export function clampStar(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(5, Math.max(1, Math.round(value)))
}

/** Increase-only bump for OVR (no-op at 99). */
export function bumpOvr(current: number): number {
  return clampOvr(current + 1)
}

/** Increase-only bump for SM/WF (no-op at 5). */
export function bumpStar(current: number): number {
  return clampStar(current + 1)
}
