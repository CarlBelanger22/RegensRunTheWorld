import { potRangeSortKey } from './potRange'
import { fifaPositionSortKey } from './positions'
import {
  PLAYER_STATUSES,
  type Player,
  type PlayerSource,
  type PlayerStatus,
} from '../types/player'

export type SortKey =
  | 'pos'
  | 'name'
  | 'nation'
  | 'ovr'
  | 'pot'
  | 'height'
  | 'sm'
  | 'wf'
  | 'wr'
  | 'source'
  | 'status'
  | 'transfer'

export type SortDir = 'asc' | 'desc'

export interface PlayerFilterState {
  search: string
  source: PlayerSource | 'all'
  position: string | 'all'
  status: PlayerStatus | 'unset' | 'all'
  sort: SortKey
  sortDir: SortDir
}

export const DEFAULT_FILTERS: PlayerFilterState = {
  search: '',
  source: 'all',
  position: 'all',
  status: 'all',
  sort: 'pos',
  sortDir: 'asc',
}

const STATUS_RANK: Record<PlayerStatus, number> = {
  'Has Potential to Be Special': 0,
  'An Exciting Prospect': 1,
  'Showing Great Potential': 2,
  'At Club Since...': 3,
}

const NUMERIC_SORT_KEYS: SortKey[] = [
  'ovr',
  'pot',
  'height',
  'sm',
  'wf',
  'transfer',
]

/** Parse 6'2" / 6'2 into total inches for sorting. */
export function heightSortKey(height: string): number {
  const match = height.trim().match(/^(\d+)\s*['′]\s*(\d+)/)
  if (!match) return -1
  return Number(match[1]) * 12 + Number(match[2])
}

export function nextSortState(
  current: Pick<PlayerFilterState, 'sort' | 'sortDir'>,
  key: SortKey,
): Pick<PlayerFilterState, 'sort' | 'sortDir'> {
  if (current.sort === key) {
    return {
      sort: key,
      sortDir: current.sortDir === 'asc' ? 'desc' : 'asc',
    }
  }
  return {
    sort: key,
    sortDir: NUMERIC_SORT_KEYS.includes(key) ? 'desc' : 'asc',
  }
}

function matchesSearch(player: Player, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return (
    player.name.toLowerCase().includes(q) ||
    player.country.toLowerCase().includes(q)
  )
}

function matchesPosition(player: Player, position: string): boolean {
  if (position === 'all') return true
  const code = position.toUpperCase()
  const haystack = [
    player.naturalPosition,
    player.currentPosition,
    player.secondaryPositions,
  ]
    .join(',')
    .toUpperCase()
  return haystack.split(/[,/|\s]+/).includes(code)
}

function matchesStatus(
  player: Player,
  status: PlayerFilterState['status'],
): boolean {
  if (status === 'all') return true
  if (status === 'unset') return player.status === null
  return player.status === status
}

/** Ascending compare; caller flips for desc. */
function comparePlayers(a: Player, b: Player, sort: SortKey): number {
  switch (sort) {
    case 'pos':
      return (
        fifaPositionSortKey(a.currentPosition) -
        fifaPositionSortKey(b.currentPosition)
      )
    case 'name':
      return a.name.localeCompare(b.name)
    case 'nation':
      return a.country.localeCompare(b.country)
    case 'ovr':
      return a.ovr - b.ovr
    case 'pot':
      return potRangeSortKey(a.potRange) - potRangeSortKey(b.potRange)
    case 'height':
      return heightSortKey(a.height ?? '') - heightSortKey(b.height ?? '')
    case 'sm':
      return a.currentSM - b.currentSM
    case 'wf':
      return a.currentWF - b.currentWF
    case 'wr':
      return a.currentWorkRate.localeCompare(b.currentWorkRate)
    case 'source':
      return a.source.localeCompare(b.source)
    case 'status': {
      const rankA = a.status === null ? 99 : STATUS_RANK[a.status]
      const rankB = b.status === null ? 99 : STATUS_RANK[b.status]
      return rankA - rankB
    }
    case 'transfer': {
      const feeA = a.transferFee ?? -1
      const feeB = b.transferFee ?? -1
      return feeA - feeB
    }
    default:
      return 0
  }
}

export function filterAndSortPlayers(
  players: Player[],
  filters: PlayerFilterState,
): Player[] {
  const dir = filters.sortDir === 'asc' ? 1 : -1
  return players
    .filter(
      (p) =>
        matchesSearch(p, filters.search) &&
        (filters.source === 'all' || p.source === filters.source) &&
        matchesPosition(p, filters.position) &&
        matchesStatus(p, filters.status),
    )
    .slice()
    .sort((a, b) => dir * comparePlayers(a, b, filters.sort))
}

export { PLAYER_STATUSES }
