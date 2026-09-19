import { Plus, ArrowUpRight, Banknote, Plane, Undo2, UserMinus } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { EditPlayerModal } from './EditPlayerModal'
import { LoanModal } from './LoanModal'
import { Modal } from './Modal'
import { PlayerFilters } from './PlayerFilters'
import { PlayerForm, type PlayerFormMode } from './PlayerForm'
import { PlayerTable, type TableVariant } from './PlayerTable'
import { SellTransferModal } from './SellTransferModal'
import {
  DEFAULT_FILTERS,
  filterAndSortPlayers,
  nextSortState,
  type PlayerFilterState,
  type SortKey,
} from '../lib/filterPlayers'
import { movePlayerAmongVisiblePeers } from '../lib/listOrder'
import { isOnLoan } from '../lib/rowStyle'
import { promoteToSenior, recallPlayer, touchPlayer } from '../lib/players'
import type { Player, SquadLocation } from '../types/player'

interface SquadPanelProps {
  title: string
  description: string
  location: SquadLocation
  variant: Exclude<TableVariant, 'external'>
  players: Player[]
  onUpsertPlayer: (player: Player) => void
  /** Bulk replace (used for within-position reorder). */
  onReplacePlayers?: (players: Player[]) => void
  /** Academy Release — permanently deletes the player. */
  onRemovePlayer?: (id: string) => void
  headerAction?: ReactNode
  renderRowActions?: (player: Player) => ReactNode
}

export function SquadPanel({
  title,
  description,
  location,
  variant,
  players,
  onUpsertPlayer,
  onReplacePlayers,
  onRemovePlayer,
  headerAction,
  renderRowActions,
}: SquadPanelProps) {
  const [filters, setFilters] = useState<PlayerFilterState>(DEFAULT_FILTERS)
  const [addOpen, setAddOpen] = useState(false)
  const [sellTarget, setSellTarget] = useState<Player | null>(null)
  const [loanTarget, setLoanTarget] = useState<Player | null>(null)
  const [editTarget, setEditTarget] = useState<Player | null>(null)
  const [showOrderColumn, setShowOrderColumn] = useState(false)

  const scoped = useMemo(
    () => players.filter((p) => p.squadLocation === location),
    [players, location],
  )

  const visible = useMemo(
    () => filterAndSortPlayers(scoped, filters),
    [scoped, filters],
  )

  const allowReorder =
    showOrderColumn && filters.sort === 'pos' && Boolean(onReplacePlayers)

  const handleSort = (key: SortKey) => {
    setFilters((prev) => ({ ...prev, ...nextSortState(prev, key) }))
  }

  const handleReorder = (playerId: string, direction: 'up' | 'down') => {
    if (!onReplacePlayers) return
    onReplacePlayers(
      movePlayerAmongVisiblePeers(players, visible, playerId, direction),
    )
  }

  const addMode: PlayerFormMode =
    variant === 'academy' ? 'create-academy' : 'create-senior'

  const addLabel =
    variant === 'academy' ? 'Add Academy Player' : 'Add Senior Player'

  const releasePlayer = (player: Player) => {
    const ok = window.confirm(
      `Release ${player.name} from the Youth Academy?\n\nThis permanently removes them from the app.`,
    )
    if (!ok || !onRemovePlayer) return
    if (editTarget?.id === player.id) setEditTarget(null)
    onRemovePlayer(player.id)
  }

  const defaultActions =
    renderRowActions ??
    (variant === 'academy'
      ? (player: Player) => (
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => onUpsertPlayer(promoteToSenior(player))}
              className="inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-ink hover:border-accent-dim hover:text-accent"
            >
              <ArrowUpRight className="size-3" aria-hidden />
              Promote
            </button>
            <button
              type="button"
              onClick={() => releasePlayer(player)}
              className="inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-ink hover:border-red-700 hover:text-red-300"
            >
              <UserMinus className="size-3" aria-hidden />
              Release
            </button>
          </div>
        )
      : (player: Player) => (
          <div className="flex flex-wrap gap-1">
            {isOnLoan(player) ? (
              <button
                type="button"
                onClick={() => onUpsertPlayer(recallPlayer(player))}
                className="inline-flex items-center gap-0.5 rounded border border-sky-700/80 px-1.5 py-0.5 text-[10px] font-medium text-sky-200 hover:bg-sky-950/50"
              >
                <Undo2 className="size-3" aria-hidden />
                Recall
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLoanTarget(player)}
                className="inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-ink hover:border-sky-700 hover:text-sky-200"
              >
                <Plane className="size-3" aria-hidden />
                Loan
              </button>
            )}
            <button
              type="button"
              onClick={() => setSellTarget(player)}
              className="inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-ink hover:border-amber-700 hover:text-amber-200"
            >
              <Banknote className="size-3" aria-hidden />
              Sell
            </button>
          </div>
        ))

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="text-xs text-muted">{description}</p>
          <p className="text-[10px] text-zinc-500">
            {visible.length}/{scoped.length} · click headers to sort · use
            Reorder to show ↑↓ for same position · hover OVR/SM/WF for + · click
            POT to edit · left rail = settled · click row for full edit
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {headerAction}
          {onReplacePlayers ? (
            <button
              type="button"
              onClick={() => {
                setShowOrderColumn((v) => {
                  const next = !v
                  if (next) {
                    setFilters((prev) =>
                      prev.sort === 'pos'
                        ? prev
                        : { ...prev, sort: 'pos', sortDir: 'asc' },
                    )
                  }
                  return next
                })
              }}
              aria-pressed={showOrderColumn}
              title={
                showOrderColumn
                  ? 'Hide the Ord column'
                  : 'Show Ord ↑↓ to reshuffle within the same position'
              }
              className={[
                'inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium transition-colors',
                showOrderColumn
                  ? 'border-accent-dim bg-accent/15 text-accent'
                  : 'border-border bg-panel-raised text-muted hover:border-zinc-500 hover:text-ink',
              ].join(' ')}
            >
              {showOrderColumn ? 'Hide reorder' : 'Reorder'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1 rounded border border-accent-dim bg-accent/15 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/25"
          >
            <Plus className="size-3.5" aria-hidden />
            {addLabel}
          </button>
        </div>
      </div>

      <PlayerFilters
        value={filters}
        onChange={setFilters}
        variant={variant}
      />

      <PlayerTable
        players={visible}
        variant={variant}
        renderActions={defaultActions}
        onRowClick={setEditTarget}
        onPatchPlayer={(player, patch) =>
          onUpsertPlayer(touchPlayer(player, patch))
        }
        sort={filters.sort}
        sortDir={filters.sortDir}
        onSort={handleSort}
        allowReorder={allowReorder}
        onReorderPlayer={allowReorder ? handleReorder : undefined}
        emptyMessage={
          scoped.length === 0
            ? 'No players in this squad yet.'
            : 'No players match these filters.'
        }
      />

      <Modal
        title={addLabel}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        wide
      >
        <PlayerForm
          mode={addMode}
          onCancel={() => setAddOpen(false)}
          onSubmit={(player) => {
            onUpsertPlayer(player)
            setAddOpen(false)
          }}
        />
      </Modal>

      <SellTransferModal
        player={sellTarget}
        open={sellTarget != null}
        onClose={() => setSellTarget(null)}
        onConfirm={(player) => {
          onUpsertPlayer(player)
          setSellTarget(null)
        }}
      />

      <LoanModal
        player={loanTarget}
        open={loanTarget != null}
        onClose={() => setLoanTarget(null)}
        onConfirm={(player) => {
          onUpsertPlayer(player)
          setLoanTarget(null)
        }}
      />

      <EditPlayerModal
        player={editTarget}
        open={editTarget != null}
        onClose={() => setEditTarget(null)}
        onSave={onUpsertPlayer}
      />
    </section>
  )
}
