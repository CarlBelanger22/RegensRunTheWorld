import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EditPlayerModal } from './EditPlayerModal'
import { Modal } from './Modal'
import { PlayerFilters } from './PlayerFilters'
import { PlayerForm } from './PlayerForm'
import { PlayerTable } from './PlayerTable'
import {
  DEFAULT_FILTERS,
  filterAndSortPlayers,
  nextSortState,
  type PlayerFilterState,
  type SortKey,
} from '../lib/filterPlayers'
import { isSoldAlumni } from '../lib/upgradeStatus'
import { touchPlayer } from '../lib/players'
import type { Player } from '../types/player'

interface ExternalPanelProps {
  players: Player[]
  onUpsertPlayer: (player: Player) => void
}

export function ExternalPanel({
  players,
  onUpsertPlayer,
}: ExternalPanelProps) {
  const [filters, setFilters] = useState<PlayerFilterState>(DEFAULT_FILTERS)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Player | null>(null)

  const external = useMemo(
    () => players.filter((p) => p.squadLocation === 'external'),
    [players],
  )

  const filtered = useMemo(
    () => filterAndSortPlayers(external, filters),
    [external, filters],
  )

  const scouted = useMemo(
    () => filtered.filter((p) => !isSoldAlumni(p)),
    [filtered],
  )
  const left = useMemo(
    () => filtered.filter((p) => isSoldAlumni(p)),
    [filtered],
  )

  const handleSort = (key: SortKey) => {
    setFilters((prev) => ({ ...prev, ...nextSortState(prev, key) }))
  }

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">
            External Regens & Transfers
          </h2>
          <p className="text-xs text-muted">
            Scouted left · sold right · hover OVR/SM/WF for + · click row to
            edit
          </p>
          <p className="text-[10px] text-zinc-500">
            {scouted.length} scouted · {left.length} left · {filtered.length}/
            {external.length} shown
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1 rounded border border-accent-dim bg-accent/15 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/25"
        >
          <Plus className="size-3.5" aria-hidden />
          Add External Regen
        </button>
      </div>

      <PlayerFilters
        value={filters}
        onChange={setFilters}
        variant="external"
      />

      <div className="grid gap-2.5 lg:grid-cols-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold text-ink">
            Scouted External Regens
          </h3>
          <PlayerTable
            players={scouted}
            variant="external"
            hideTransferColumn
            onRowClick={setEditTarget}
            onPatchPlayer={(player, patch) =>
              onUpsertPlayer(touchPlayer(player, patch))
            }
            sort={filters.sort}
            sortDir={filters.sortDir}
            onSort={handleSort}
            emptyMessage="No scouted regens match these filters."
          />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold text-ink">Regens Who Left</h3>
          <PlayerTable
            players={left}
            variant="external"
            hideSmWfWr
            onRowClick={setEditTarget}
            onPatchPlayer={(player, patch) =>
              onUpsertPlayer(touchPlayer(player, patch))
            }
            sort={filters.sort}
            sortDir={filters.sortDir}
            onSort={handleSort}
            emptyMessage="No sold/transferred players match these filters."
          />
        </div>
      </div>

      <Modal
        title="Add External Regen"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        wide
      >
        <PlayerForm
          mode="create-external"
          onCancel={() => setAddOpen(false)}
          onSubmit={(player) => {
            onUpsertPlayer(player)
            setAddOpen(false)
          }}
        />
      </Modal>

      <EditPlayerModal
        player={editTarget}
        open={editTarget != null}
        onClose={() => setEditTarget(null)}
        onSave={onUpsertPlayer}
      />
    </section>
  )
}
