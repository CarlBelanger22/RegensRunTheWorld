import {
  DEFAULT_FILTERS,
  type PlayerFilterState,
} from '../lib/filterPlayers'
import {
  PLAYER_SOURCES,
  PLAYER_STATUSES,
  POSITION_CODES,
} from '../types/player'

interface PlayerFiltersProps {
  value: PlayerFilterState
  onChange: (next: PlayerFilterState) => void
  variant: 'academy' | 'senior' | 'external'
}

const selectClass =
  'rounded border border-border bg-panel-raised px-1.5 py-1 text-xs text-ink outline-none focus:border-accent-dim'

export function PlayerFilters({
  value,
  onChange,
  variant,
}: PlayerFiltersProps) {
  const patch = (partial: Partial<PlayerFilterState>) =>
    onChange({ ...value, ...partial })

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-panel px-2 py-2 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="flex min-w-[10rem] flex-1 flex-col gap-0.5 text-[10px] text-muted">
        Search
        <input
          type="search"
          value={value.search}
          onChange={(e) => patch({ search: e.target.value })}
          placeholder="Name or country"
          className={`${selectClass} w-full`}
        />
      </label>

      <label className="flex flex-col gap-0.5 text-[10px] text-muted">
        Source
        <select
          value={value.source}
          onChange={(e) =>
            patch({
              source: e.target.value as PlayerFilterState['source'],
            })
          }
          className={selectClass}
        >
          <option value="all">All</option>
          {PLAYER_SOURCES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-0.5 text-[10px] text-muted">
        Position
        <select
          value={value.position}
          onChange={(e) => patch({ position: e.target.value })}
          className={selectClass}
        >
          <option value="all">All</option>
          {POSITION_CODES.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </label>

      {variant !== 'academy' && (
        <label className="flex flex-col gap-0.5 text-[10px] text-muted">
          Status
          <select
            value={value.status}
            onChange={(e) =>
              patch({
                status: e.target.value as PlayerFilterState['status'],
              })
            }
            className={selectClass}
          >
            <option value="all">All</option>
            <option value="unset">Unset</option>
            {PLAYER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="button"
        onClick={() => onChange({ ...DEFAULT_FILTERS })}
        className="rounded border border-border px-2 py-1 text-xs text-muted hover:border-zinc-500 hover:text-ink"
      >
        Reset
      </button>
    </div>
  )
}
