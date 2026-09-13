import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from 'lucide-react'
import { UpgradeBadges } from './UpgradeBadges'
import type { SortDir, SortKey } from '../lib/filterPlayers'
import { formatTransferFee } from '../lib/formatMoney'
import { isPotRangeDiffSix, parsePotRange } from '../lib/potRange'
import { bumpOvr, bumpStar } from '../lib/quickEdit'
import { isOnLoan, isUpgradesSettled, playerRowTintClass, playerSettledRailClass } from '../lib/rowStyle'
import { STATUS_POT_BANDS, type Player } from '../types/player'

export type TableVariant = 'academy' | 'senior' | 'external'

interface PlayerTableProps {
  players: Player[]
  variant: TableVariant
  emptyMessage?: string
  renderActions?: (player: Player) => ReactNode
  onRowClick?: (player: Player) => void
  /** Patch current fields without opening the edit modal. */
  onPatchPlayer?: (player: Player, patch: Partial<Player>) => void
  /** Hide transfer column (useful inside already-split external sections). */
  hideTransferColumn?: boolean
  /** Hide SM / WF / WR (e.g. Regens Who Left). */
  hideSmWfWr?: boolean
  sort: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}

const th = 'px-2 py-1.5 font-medium'
const td = 'px-2 py-1.5'

function IncrementCell({
  display,
  canIncrement,
  label,
  onIncrement,
}: {
  display: string
  canIncrement: boolean
  label: string
  onIncrement: () => void
}) {
  return (
    <div
      className="group/inc flex items-center gap-0.5"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <span className="tabular-nums text-ink">{display}</span>
      {canIncrement ? (
        <button
          type="button"
          title={`Increase ${label}`}
          aria-label={`Increase ${label}`}
          className="invisible inline-flex size-4 shrink-0 items-center justify-center rounded text-accent group-hover/inc:visible hover:bg-accent/20"
          onClick={(e) => {
            e.stopPropagation()
            onIncrement()
          }}
        >
          <Plus className="size-3" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}

function EditablePotCell({
  potRange,
  onSave,
  underlineNarrow,
}: {
  potRange: string
  onSave: (next: string) => void
  /** YA: underline when scout range width is exactly 6. */
  underlineNarrow?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(potRange)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    const next = draft.trim()
    if (next && !parsePotRange(next)) {
      setError('Use e.g. 78-94')
      return
    }
    setError(null)
    setEditing(false)
    if (next !== potRange.trim()) onSave(next)
  }

  const cancel = () => {
    setDraft(potRange)
    setError(null)
    setEditing(false)
  }

  if (editing) {
    return (
      <div
        className="flex flex-col gap-0.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="w-20 rounded border border-accent-dim bg-panel-raised px-1 py-0.5 font-mono text-xs text-ink outline-none"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setError(null)
          }}
          onBlur={commit}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              cancel()
            }
          }}
        />
        {error ? (
          <span className="text-[9px] text-red-300">{error}</span>
        ) : null}
      </div>
    )
  }

  const narrow =
    underlineNarrow === true && isPotRangeDiffSix(potRange)

  return (
    <button
      type="button"
      className="rounded px-0.5 text-left hover:bg-panel-raised"
      title="Click to edit POT"
      onClick={(e) => {
        e.stopPropagation()
        setDraft(potRange)
        setError(null)
        setEditing(true)
      }}
    >
      {potRange.trim() ? (
        <span
          className={[
            'font-mono text-xs text-accent',
            narrow ? 'underline decoration-accent underline-offset-2' : '',
          ].join(' ')}
        >
          {potRange}
        </span>
      ) : (
        <span className="text-[10px] text-zinc-500">—</span>
      )}
    </button>
  )
}

function StatusCell({ player }: { player: Player }) {
  if (player.status === null) {
    return (
      <span className="rounded border border-amber-700/80 bg-amber-950/40 px-1 py-px text-[10px] font-medium text-amber-200">
        Unset
      </span>
    )
  }

  return (
    <div className="flex flex-col leading-tight">
      <span className="text-xs text-ink">{player.status}</span>
      <span className="text-[10px] text-muted">
        {STATUS_POT_BANDS[player.status]}
      </span>
    </div>
  )
}

function SortableTh({
  label,
  sortKey,
  activeSort,
  sortDir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  activeSort: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}) {
  const active = activeSort === sortKey
  const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown

  return (
    <th className={th} aria-sort={active ? `${sortDir}ending` : 'none'}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={[
          'inline-flex items-center gap-0.5 uppercase tracking-wide hover:text-ink',
          active ? 'text-accent' : 'text-muted',
        ].join(' ')}
      >
        {label}
        <Icon className="size-3 shrink-0 opacity-80" aria-hidden />
      </button>
    </th>
  )
}

export function PlayerTable({
  players,
  variant,
  emptyMessage = 'No players match these filters.',
  renderActions,
  onRowClick,
  onPatchPlayer,
  hideTransferColumn = false,
  hideSmWfWr = false,
  sort,
  sortDir,
  onSort,
}: PlayerTableProps) {
  if (players.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-panel px-3 py-6 text-center">
        <p className="text-xs text-muted">{emptyMessage}</p>
        <p className="mt-0.5 text-[10px] text-zinc-500">
          Use Add above, or Reset filters.
        </p>
      </div>
    )
  }

  const showPotRange = variant === 'academy' || variant === 'senior'
  const showStatus = variant === 'senior' || variant === 'external'
  const showActions = Boolean(renderActions)
  const showTransfer = variant === 'external' && !hideTransferColumn
  const showUpgrades = variant !== 'external'
  const showSmWfWr = !hideSmWfWr
  const quick = Boolean(onPatchPlayer)

  const sortTh = (label: string, sortKey: SortKey) => (
    <SortableTh
      label={label}
      sortKey={sortKey}
      activeSort={sort}
      sortDir={sortDir}
      onSort={onSort}
    />
  )

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-panel">
      <table className="min-w-full border-collapse text-left text-xs">
        <thead className="border-b border-border bg-panel-raised text-[10px] tracking-wide text-muted uppercase">
          <tr>
            {sortTh('Pos', 'pos')}
            {sortTh('Name', 'name')}
            {sortTh('Nation', 'nation')}
            {sortTh('OVR', 'ovr')}
            {showPotRange ? sortTh('POT', 'pot') : null}
            {sortTh('Ht', 'height')}
            {showSmWfWr ? sortTh('SM', 'sm') : null}
            {showSmWfWr ? sortTh('WF', 'wf') : null}
            {showSmWfWr ? sortTh('WR', 'wr') : null}
            {showStatus ? sortTh('Status', 'status') : null}
            {sortTh('Source', 'source')}
            {showUpgrades ? <th className={th}>Upgrades</th> : null}
            {showTransfer ? sortTh('Transfer', 'transfer') : null}
            {showActions ? <th className={th}>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr
              key={player.id}
              className={[
                'border-b border-border/70 last:border-0',
                playerRowTintClass(player),
                onRowClick ? 'cursor-pointer' : '',
              ].join(' ')}
              onClick={onRowClick ? () => onRowClick(player) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick(player)
                      }
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
            >
              <td className={`${td} relative pl-3`}>
                {onPatchPlayer ? (
                  <button
                    type="button"
                    title={
                      isUpgradesSettled(player)
                        ? 'Settled — click to unset'
                        : 'Click to mark upgrades settled'
                    }
                    aria-label={
                      isUpgradesSettled(player)
                        ? `${player.name}: upgrades settled, click to unset`
                        : `${player.name}: mark upgrades settled`
                    }
                    aria-pressed={isUpgradesSettled(player)}
                    className={[
                      'absolute top-0 bottom-0 left-0 w-1.5 cursor-pointer border-0 p-0 transition-colors',
                      playerSettledRailClass(player),
                    ].join(' ')}
                    onClick={(e) => {
                      e.stopPropagation()
                      onPatchPlayer(player, {
                        upgradesSettled: !isUpgradesSettled(player),
                      })
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    aria-hidden
                    className={[
                      'pointer-events-none absolute top-0 bottom-0 left-0 w-1.5',
                      playerSettledRailClass(player),
                    ].join(' ')}
                  />
                )}
                <span className="font-mono font-medium text-ink">
                  {player.currentPosition}
                </span>
                {player.naturalPosition !== player.currentPosition ? (
                  <span className="ml-1 text-[10px] text-muted">
                    ({player.naturalPosition})
                  </span>
                ) : null}
              </td>
              <td className={td}>
                <div className="font-medium leading-tight text-ink">
                  {player.name}
                </div>
                {isOnLoan(player) ? (
                  <div className="text-[10px] leading-tight text-sky-300/90">
                    On loan @ {player.loanClub?.trim()}
                  </div>
                ) : null}
                {player.regenOf?.trim() ? (
                  <div className="text-[10px] leading-tight text-muted">
                    {player.regenOf.trim()}
                  </div>
                ) : null}
              </td>
              <td className={`${td} text-muted`}>{player.country}</td>
              <td className={`${td} font-semibold`}>
                {quick ? (
                  <IncrementCell
                    display={String(player.ovr)}
                    canIncrement={player.ovr < 99}
                    label="OVR"
                    onIncrement={() =>
                      onPatchPlayer?.(player, { ovr: bumpOvr(player.ovr) })
                    }
                  />
                ) : (
                  <span className="tabular-nums text-ink">{player.ovr}</span>
                )}
              </td>
              {showPotRange ? (
                <td className={td}>
                  {quick ? (
                    <EditablePotCell
                      potRange={player.potRange}
                      underlineNarrow={variant === 'academy'}
                      onSave={(next) =>
                        onPatchPlayer?.(player, { potRange: next })
                      }
                    />
                  ) : player.potRange.trim() ? (
                    <span
                      className={[
                        'font-mono text-xs text-accent',
                        variant === 'academy' &&
                        isPotRangeDiffSix(player.potRange)
                          ? 'underline decoration-accent underline-offset-2'
                          : '',
                      ].join(' ')}
                    >
                      {player.potRange}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">—</span>
                  )}
                </td>
              ) : null}
              <td className={`${td} font-mono text-muted`}>
                {player.height?.trim() ? player.height : '—'}
              </td>
              {showSmWfWr ? (
                <>
                  <td className={td}>
                    {quick ? (
                      <IncrementCell
                        display={`${player.currentSM}★`}
                        canIncrement={player.currentSM < 5}
                        label="SM"
                        onIncrement={() =>
                          onPatchPlayer?.(player, {
                            currentSM: bumpStar(player.currentSM),
                          })
                        }
                      />
                    ) : (
                      <span className="tabular-nums text-ink">
                        {player.currentSM}★
                      </span>
                    )}
                  </td>
                  <td className={td}>
                    {quick ? (
                      <IncrementCell
                        display={`${player.currentWF}★`}
                        canIncrement={player.currentWF < 5}
                        label="WF"
                        onIncrement={() =>
                          onPatchPlayer?.(player, {
                            currentWF: bumpStar(player.currentWF),
                          })
                        }
                      />
                    ) : (
                      <span className="tabular-nums text-ink">
                        {player.currentWF}★
                      </span>
                    )}
                  </td>
                  <td className={`${td} font-mono text-ink`}>
                    {player.currentWorkRate}
                  </td>
                </>
              ) : null}
              {showStatus ? (
                <td className={td}>
                  <StatusCell player={player} />
                </td>
              ) : null}
              <td className={`${td} text-muted`}>{player.source}</td>
              {showUpgrades ? (
                <td className={td}>
                  <UpgradeBadges player={player} />
                </td>
              ) : null}
              {showTransfer ? (
                <td className={`${td} text-muted`}>
                  {player.destinationClub || player.transferFee != null ? (
                    <div className="flex flex-col leading-tight">
                      {player.destinationClub ? (
                        <span>{player.destinationClub}</span>
                      ) : null}
                      {player.transferFee != null ? (
                        <span className="tabular-nums text-[10px]">
                          {formatTransferFee(player.transferFee)}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-500">Scouted</span>
                  )}
                </td>
              ) : null}
              {showActions ? (
                <td
                  className={td}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {renderActions?.(player)}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
