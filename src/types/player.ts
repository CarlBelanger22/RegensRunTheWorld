export const PLAYER_STATUSES = [
  'Has Potential to Be Special',
  'An Exciting Prospect',
  'Showing Great Potential',
  'At Club Since...',
] as const

export type PlayerStatus = (typeof PLAYER_STATUSES)[number]

/** Reference POT bands shown under each status (not derived from potRange). */
export const STATUS_POT_BANDS: Record<PlayerStatus, string> = {
  'Has Potential to Be Special': 'POT 91+',
  'An Exciting Prospect': 'POT 86–90',
  'Showing Great Potential': 'POT 80–85',
  'At Club Since...': 'POT ≤79',
}


export const PLAYER_SOURCES = ['Academy', 'Regen', 'Unknown'] as const
export type PlayerSource = (typeof PLAYER_SOURCES)[number]

export const SQUAD_LOCATIONS = ['academy', 'senior', 'external'] as const
export type SquadLocation = (typeof SQUAD_LOCATIONS)[number]

export const WORK_RATE_PRESETS = [
  'H/H',
  'H/M',
  'H/L',
  'M/H',
  'M/M',
  'M/L',
  'L/H',
  'L/M',
  'L/L',
] as const

export type WorkRate = (typeof WORK_RATE_PRESETS)[number]

export const POSITION_CODES = [
  'GK',
  'LWB',
  'LB',
  'CB',
  'RB',
  'RWB',
  'CDM',
  'LM',
  'CM',
  'CAM',
  'RM',
  'LW',
  'RW',
  'CF',
  'ST',
] as const

export type PositionCode = (typeof POSITION_CODES)[number]

export interface Player {
  id: string
  name: string
  country: string
  naturalPosition: string
  currentPosition: string
  secondaryPositions: string
  /** Frozen at create — used to detect +1 extra playable position. */
  initialPlayablePositions: string[]
  ovr: number
  /** Feet/inches display, e.g. 6'2" */
  height: string
  potRange: string
  /** null in academy / after promote until user sets it */
  status: PlayerStatus | null
  source: PlayerSource
  regenOf?: string
  initialSM: number
  currentSM: number
  initialWF: number
  currentWF: number
  initialWorkRate: string
  currentWorkRate: string
  squadLocation: SquadLocation
  transferFee?: number
  destinationClub?: string
  /** Set while out on loan; player stays on Senior. */
  loanClub?: string
  /**
   * Player-level: challenge upgrades are done (even if some badges still Avail).
   * Shown as a left rail on the row — independent of FIFA status tint.
   */
  upgradesSettled?: boolean
  /**
   * Manual list order within a Current-position group (Pos sort secondary key).
   * Lower = higher in the table when sorted by Pos ascending.
   */
  listOrder?: number
  notes?: string
  updatedAt: number
}

export type BadgeKind = 'available' | 'used' | 'broken'

export interface UpgradeBadge {
  kind: BadgeKind
  label: string
}

export interface UpgradeStatus {
  /** Shared either/or allowance: max +1 total across SM and WF. */
  smWf: UpgradeBadge
  wr: UpgradeBadge
  position: UpgradeBadge
}
