import { useState, type FormEvent } from 'react'
import { Pencil } from 'lucide-react'
import { Modal } from './Modal'
import { UpgradeBadges } from './UpgradeBadges'
import { correctFrozenBaseline, touchPlayer } from '../lib/players'
import {
  buildInitialPlayablePositions,
  ensureSecondaryIncludesCurrent,
  parsePositions,
} from '../lib/positions'
import { parsePotRange } from '../lib/potRange'
import { applyAutoUpgradesSettled } from '../lib/upgradeStatus'
import { workRateOptionsFromBaseline } from '../lib/workRate'
import {
  PLAYER_SOURCES,
  PLAYER_STATUSES,
  POSITION_CODES,
  WORK_RATE_PRESETS,
  type Player,
  type PlayerSource,
  type PlayerStatus,
} from '../types/player'

const fieldClass =
  'w-full rounded border border-border bg-panel-raised px-2 py-1 text-xs text-ink outline-none focus:border-accent-dim'

const labelClass = 'flex flex-col gap-0.5 text-[10px] text-muted'

interface EditPlayerModalProps {
  player: Player | null
  open: boolean
  onClose: () => void
  onSave: (player: Player) => void
}

interface EditFormState {
  name: string
  country: string
  naturalPosition: string
  currentPosition: string
  secondaryPositions: string
  ovr: string
  height: string
  potRange: string
  status: PlayerStatus | ''
  source: PlayerSource
  regenOf: string
  currentSM: string
  currentWF: string
  currentWorkRate: string
  destinationClub: string
  transferFee: string
  notes: string
}

function toForm(player: Player): EditFormState {
  return {
    name: player.name,
    country: player.country,
    naturalPosition: player.naturalPosition,
    currentPosition: player.currentPosition,
    secondaryPositions: player.secondaryPositions,
    ovr: String(player.ovr),
    height: player.height ?? '',
    potRange: player.potRange,
    status: player.status ?? '',
    source: player.source,
    regenOf: player.regenOf ?? '',
    currentSM: String(player.currentSM),
    currentWF: String(player.currentWF),
    currentWorkRate: player.currentWorkRate,
    destinationClub: player.destinationClub ?? '',
    transferFee:
      player.transferFee != null ? String(player.transferFee) : '',
    notes: player.notes ?? '',
  }
}

function clampStar(value: number): number {
  if (!Number.isFinite(value)) return 3
  return Math.min(5, Math.max(1, Math.round(value)))
}

function previewPlayer(base: Player, form: EditFormState): Player {
  const secondaryPositions = ensureSecondaryIncludesCurrent(
    form.naturalPosition,
    form.currentPosition,
    form.secondaryPositions,
  )
  const preview: Player = {
    ...base,
    name: form.name.trim() || base.name,
    country: form.country.trim() || base.country,
    naturalPosition: form.naturalPosition,
    currentPosition: form.currentPosition,
    secondaryPositions,
    ovr: Number(form.ovr) || base.ovr,
    height: form.height.trim(),
    potRange: form.potRange.trim(),
    status:
      base.squadLocation === 'academy'
        ? null
        : form.status === ''
          ? null
          : (form.status as PlayerStatus),
    source: form.source,
    regenOf: form.regenOf.trim() || undefined,
    currentSM: clampStar(Number(form.currentSM)),
    currentWF: clampStar(Number(form.currentWF)),
    currentWorkRate: form.currentWorkRate,
    destinationClub: form.destinationClub.trim() || undefined,
    transferFee:
      form.transferFee.trim() === ''
        ? undefined
        : Number(form.transferFee),
    notes: form.notes.trim() || undefined,
  }
  return applyAutoUpgradesSettled(preview)
}

/** Remounts form state whenever the edited player changes. */
export function EditPlayerModal({
  player,
  open,
  onClose,
  onSave,
}: EditPlayerModalProps) {
  if (!player || !open) return null
  return (
    <EditPlayerModalInner
      key={player.id}
      player={player}
      onClose={onClose}
      onSave={onSave}
    />
  )
}

function EditPlayerModalInner({
  player,
  onClose,
  onSave,
}: {
  player: Player
  onClose: () => void
  onSave: (player: Player) => void
}) {
  const [base, setBase] = useState(player)
  const [form, setForm] = useState<EditFormState>(() => toForm(player))
  const [error, setError] = useState<string | null>(null)
  const [editingBaseline, setEditingBaseline] = useState(false)
  const [baselineDraft, setBaselineDraft] = useState({
    positions: player.initialPlayablePositions.join(', '),
    initialSM: String(player.initialSM),
    initialWF: String(player.initialWF),
    initialWorkRate: player.initialWorkRate,
  })

  const preview = {
    ...previewPlayer(base, form),
    initialPlayablePositions: base.initialPlayablePositions,
    initialSM: base.initialSM,
    initialWF: base.initialWF,
    initialWorkRate: base.initialWorkRate,
  }
  const isAcademy = base.squadLocation === 'academy'
  const isExternal = base.squadLocation === 'external'

  const patch = (partial: Partial<EditFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...partial }
      if (
        partial.currentPosition != null ||
        partial.naturalPosition != null ||
        partial.secondaryPositions != null
      ) {
        next.secondaryPositions = ensureSecondaryIncludesCurrent(
          next.naturalPosition,
          next.currentPosition,
          next.secondaryPositions,
        )
      }
      return next
    })
    setError(null)
  }

  const openBaselineEditor = () => {
    setBaselineDraft({
      positions: base.initialPlayablePositions.join(', '),
      initialSM: String(base.initialSM),
      initialWF: String(base.initialWF),
      initialWorkRate: base.initialWorkRate,
    })
    setEditingBaseline(true)
    setError(null)
  }

  const applyBaseline = () => {
    const positions = parsePositions(baselineDraft.positions)
    const next = correctFrozenBaseline(base, {
      initialPlayablePositions: positions,
      initialSM: clampStar(Number(baselineDraft.initialSM)),
      initialWF: clampStar(Number(baselineDraft.initialWF)),
      initialWorkRate: baselineDraft.initialWorkRate,
    })
    onSave(next)
    setBase(next)
    setEditingBaseline(false)
    setError(null)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const name = form.name.trim()
    const country = form.country.trim()
    const potRange = form.potRange.trim()
    const ovr = Number(form.ovr)

    if (!name) {
      setError('Name is required.')
      return
    }
    if (!country) {
      setError('Country is required.')
      return
    }
    if (!Number.isFinite(ovr) || ovr < 1 || ovr > 99) {
      setError('OVR must be between 1 and 99.')
      return
    }
    if (potRange && !parsePotRange(potRange)) {
      setError('POT range must look like 78-94 (or a single number).')
      return
    }
    if (isAcademy && !potRange) {
      setError('POT range is required for academy players.')
      return
    }
    if (
      form.transferFee.trim() !== '' &&
      (!Number.isFinite(Number(form.transferFee)) ||
        Number(form.transferFee) < 0)
    ) {
      setError('Transfer fee must be a non-negative number.')
      return
    }

    const feeRaw = form.transferFee.trim()
    onSave(
      touchPlayer(base, {
        name,
        country,
        naturalPosition: form.naturalPosition,
        currentPosition: form.currentPosition,
        secondaryPositions: ensureSecondaryIncludesCurrent(
          form.naturalPosition,
          form.currentPosition,
          form.secondaryPositions,
        ),
        ovr,
        height: form.height.trim(),
        potRange,
        status: isAcademy
          ? null
          : form.status === ''
            ? null
            : (form.status as PlayerStatus),
        source: form.source,
        regenOf: form.regenOf.trim() || undefined,
        currentSM: clampStar(Number(form.currentSM)),
        currentWF: clampStar(Number(form.currentWF)),
        currentWorkRate: form.currentWorkRate,
        destinationClub: form.destinationClub.trim() || undefined,
        transferFee: feeRaw === '' ? undefined : Number(feeRaw),
        notes: form.notes.trim() || undefined,
      }),
    )
    onClose()
  }

  return (
    <Modal title={`Edit — ${base.name}`} open onClose={onClose} wide>
      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <div className="rounded border border-border bg-panel-raised/50 px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <UpgradeBadges player={preview} />
            {!editingBaseline ? (
              <>
                <span className="text-[10px] text-zinc-500">
                  Frozen: {base.initialPlayablePositions.join(', ') || '—'} · SM{' '}
                  {base.initialSM} / WF {base.initialWF} / WR{' '}
                  {base.initialWorkRate}
                </span>
                <button
                  type="button"
                  onClick={openBaselineEditor}
                  className="ml-auto inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted hover:border-accent-dim hover:text-accent"
                  title="Correct challenge baseline (init values)"
                >
                  <Pencil className="size-3" aria-hidden />
                  Edit baseline
                </button>
              </>
            ) : null}
          </div>

          {editingBaseline ? (
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <label className={`${labelClass} col-span-2 sm:col-span-4`}>
                Init positions
                <input
                  className={fieldClass}
                  value={baselineDraft.positions}
                  onChange={(e) =>
                    setBaselineDraft((d) => ({
                      ...d,
                      positions: e.target.value,
                    }))
                  }
                  placeholder="CF, ST"
                />
              </label>
              <label className={labelClass}>
                Init SM
                <input
                  className={fieldClass}
                  type="number"
                  min={1}
                  max={5}
                  value={baselineDraft.initialSM}
                  onChange={(e) =>
                    setBaselineDraft((d) => ({
                      ...d,
                      initialSM: e.target.value,
                    }))
                  }
                />
              </label>
              <label className={labelClass}>
                Init WF
                <input
                  className={fieldClass}
                  type="number"
                  min={1}
                  max={5}
                  value={baselineDraft.initialWF}
                  onChange={(e) =>
                    setBaselineDraft((d) => ({
                      ...d,
                      initialWF: e.target.value,
                    }))
                  }
                />
              </label>
              <label className={`${labelClass} col-span-2`}>
                Init WR
                <select
                  className={fieldClass}
                  value={baselineDraft.initialWorkRate}
                  onChange={(e) =>
                    setBaselineDraft((d) => ({
                      ...d,
                      initialWorkRate: e.target.value,
                    }))
                  }
                >
                  {WORK_RATE_PRESETS.map((wr) => (
                    <option key={wr} value={wr}>
                      {wr}
                    </option>
                  ))}
                </select>
              </label>
              <div className="col-span-2 flex flex-wrap gap-1 sm:col-span-4">
                <button
                  type="button"
                  onClick={() =>
                    setBaselineDraft((d) => ({
                      ...d,
                      positions: buildInitialPlayablePositions(
                        form.naturalPosition,
                        form.secondaryPositions,
                      ).join(', '),
                    }))
                  }
                  className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted hover:text-ink"
                >
                  Reset from Natural + Secondaries
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBaseline(false)}
                  className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyBaseline}
                  className="rounded border border-accent-dim bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent hover:bg-accent/25"
                >
                  Apply
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <label className={`${labelClass} col-span-1 sm:col-span-2`}>
            Name *
            <input
              className={fieldClass}
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              required
            />
          </label>
          <label className={`${labelClass} col-span-1 sm:col-span-2`}>
            Country *
            <input
              className={fieldClass}
              value={form.country}
              onChange={(e) => patch({ country: e.target.value })}
              required
            />
          </label>

          <label className={labelClass}>
            Natural
            <select
              className={fieldClass}
              value={form.naturalPosition}
              onChange={(e) => patch({ naturalPosition: e.target.value })}
            >
              {POSITION_CODES.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Current
            <select
              className={fieldClass}
              value={form.currentPosition}
              onChange={(e) => patch({ currentPosition: e.target.value })}
            >
              {POSITION_CODES.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </label>
          <label className={`${labelClass} col-span-2`}>
            Secondaries (+1 max)
            <input
              className={fieldClass}
              value={form.secondaryPositions}
              onChange={(e) => patch({ secondaryPositions: e.target.value })}
              placeholder="CM, CF"
            />
          </label>

          <label className={labelClass}>
            OVR
            <input
              className={fieldClass}
              type="number"
              min={1}
              max={99}
              value={form.ovr}
              onChange={(e) => patch({ ovr: e.target.value })}
            />
          </label>
          <label className={labelClass}>
            Height
            <input
              className={fieldClass}
              value={form.height}
              onChange={(e) => patch({ height: e.target.value })}
              placeholder={`6'2"`}
            />
          </label>
          <label className={labelClass}>
            POT range
            <input
              className={fieldClass}
              value={form.potRange}
              onChange={(e) => patch({ potRange: e.target.value })}
              placeholder="78-94"
            />
          </label>
          {!isAcademy ? (
            <label className={labelClass}>
              Status
              <select
                className={fieldClass}
                value={form.status}
                onChange={(e) =>
                  patch({
                    status: e.target.value as PlayerStatus | '',
                  })
                }
              >
                <option value="">Unset</option>
                {PLAYER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="hidden sm:block" aria-hidden />
          )}

          <label className={labelClass}>
            Source
            <select
              className={fieldClass}
              value={form.source}
              onChange={(e) =>
                patch({ source: e.target.value as PlayerSource })
              }
            >
              {PLAYER_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
          <label className={`${labelClass} col-span-1 sm:col-span-3`}>
            Regen of
            <input
              className={fieldClass}
              value={form.regenOf}
              onChange={(e) => patch({ regenOf: e.target.value })}
            />
          </label>

          <label className={labelClass}>
            SM (init {base.initialSM})
            <input
              className={fieldClass}
              type="number"
              min={1}
              max={5}
              value={form.currentSM}
              onChange={(e) => patch({ currentSM: e.target.value })}
            />
          </label>
          <label className={labelClass}>
            WF (init {base.initialWF})
            <input
              className={fieldClass}
              type="number"
              min={1}
              max={5}
              value={form.currentWF}
              onChange={(e) => patch({ currentWF: e.target.value })}
            />
          </label>
          <label className={`${labelClass} col-span-2`}>
            WR (init {base.initialWorkRate})
            <select
              className={fieldClass}
              value={form.currentWorkRate}
              onChange={(e) => patch({ currentWorkRate: e.target.value })}
            >
              {workRateOptionsFromBaseline(
                base.initialWorkRate,
                form.currentWorkRate,
              ).map((wr) => (
                <option key={wr} value={wr}>
                  {wr}
                </option>
              ))}
            </select>
          </label>

          {isExternal ? (
            <>
              <label className={`${labelClass} col-span-2`}>
                Destination club
                <input
                  className={fieldClass}
                  value={form.destinationClub}
                  onChange={(e) => patch({ destinationClub: e.target.value })}
                />
              </label>
              <label className={`${labelClass} col-span-2`}>
                Transfer fee (€)
                <input
                  className={fieldClass}
                  type="number"
                  min={0}
                  value={form.transferFee}
                  onChange={(e) => patch({ transferFee: e.target.value })}
                />
              </label>
            </>
          ) : null}

          <label className={`${labelClass} col-span-2 sm:col-span-4`}>
            Notes
            <input
              className={fieldClass}
              value={form.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </label>
        </div>

        {error ? (
          <p className="text-xs text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-1.5 border-t border-border pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-border px-2.5 py-1 text-xs text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded border border-accent-dim bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/25"
          >
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  )
}
