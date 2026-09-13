import { useState, type FormEvent } from 'react'
import { createPlayer } from '../lib/players'
import { ensureSecondaryIncludesCurrent } from '../lib/positions'
import { parsePotRange } from '../lib/potRange'
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
  'w-full rounded-md border border-border bg-panel-raised px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent-dim'

const labelClass = 'flex flex-col gap-1 text-xs text-muted'

export type PlayerFormMode =
  | 'create-academy'
  | 'create-senior'
  | 'create-external'

interface PlayerFormProps {
  mode: PlayerFormMode
  onSubmit: (player: Player) => void
  onCancel: () => void
}

interface CreateFormState {
  name: string
  country: string
  naturalPosition: string
  currentPosition: string
  secondaryPositions: string
  ovr: string
  potRange: string
  status: PlayerStatus | ''
  source: PlayerSource
  regenOf: string
  initialSM: string
  initialWF: string
  initialWorkRate: string
  height: string
  notes: string
}

function emptyForm(mode: PlayerFormMode): CreateFormState {
  const isAcademy = mode === 'create-academy'
  const isExternal = mode === 'create-external'
  return {
    name: '',
    country: '',
    naturalPosition: isAcademy ? 'CAM' : 'ST',
    currentPosition: isAcademy ? 'CAM' : 'ST',
    secondaryPositions: '',
    ovr: isAcademy ? '60' : '72',
    potRange: isAcademy ? '70-85' : '70-88',
    status: isAcademy ? '' : 'Showing Great Potential',
    source: isAcademy ? 'Academy' : isExternal ? 'Regen' : 'Unknown',
    regenOf: '',
    initialSM: '3',
    initialWF: '3',
    initialWorkRate: 'M/M',
    height: "5'10\"",
    notes: '',
  }
}

function clampStar(value: number): number {
  if (!Number.isFinite(value)) return 3
  return Math.min(5, Math.max(1, Math.round(value)))
}

export function PlayerForm({ mode, onSubmit, onCancel }: PlayerFormProps) {
  const [form, setForm] = useState<CreateFormState>(() => emptyForm(mode))
  const [error, setError] = useState<string | null>(null)

  const isAcademy = mode === 'create-academy'
  const requiresStatus = mode === 'create-senior' || mode === 'create-external'

  const patch = (partial: Partial<CreateFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...partial }
      if (
        partial.naturalPosition != null &&
        prev.currentPosition === prev.naturalPosition
      ) {
        next.currentPosition = partial.naturalPosition
      }
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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const name = form.name.trim()
    const country = form.country.trim()
    const potRange = form.potRange.trim()
    const ovr = Number(form.ovr)
    const sm = clampStar(Number(form.initialSM))
    const wf = clampStar(Number(form.initialWF))

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
    if (requiresStatus && !form.status) {
      setError('Status is required.')
      return
    }

    const squadLocation =
      mode === 'create-academy'
        ? 'academy'
        : mode === 'create-external'
          ? 'external'
          : 'senior'

    const currentPosition = form.currentPosition || form.naturalPosition
    const player = createPlayer({
      name,
      country,
      naturalPosition: form.naturalPosition,
      currentPosition,
      secondaryPositions: ensureSecondaryIncludesCurrent(
        form.naturalPosition,
        currentPosition,
        form.secondaryPositions,
      ),
      ovr,
      height: form.height.trim(),
      potRange: potRange || '',
      status: isAcademy ? null : (form.status as PlayerStatus),
      source: form.source,
      regenOf: form.regenOf.trim() || undefined,
      initialSM: sm,
      currentSM: sm,
      initialWF: wf,
      currentWF: wf,
      initialWorkRate: form.initialWorkRate,
      currentWorkRate: form.initialWorkRate,
      squadLocation,
      notes: form.notes.trim() || undefined,
    })

    onSubmit(player)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <p className="text-xs text-muted">
        {isAcademy
          ? 'Academy players store a scout POT range only. Status stays unset until after promotion.'
          : mode === 'create-external'
            ? 'Scouted external regens require a status. Leave transfer fields empty so they stay in Scouted.'
            : 'Senior players require a FIFA potential status. Optional scout range can be kept as history.'}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Name *
          <input
            className={fieldClass}
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            autoFocus
            required
          />
        </label>
        <label className={labelClass}>
          Country *
          <input
            className={fieldClass}
            value={form.country}
            onChange={(e) => patch({ country: e.target.value })}
            required
          />
        </label>
        <label className={labelClass}>
          Natural position
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
          Current position
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
        <label className={`${labelClass} sm:col-span-2`}>
          Secondary positions
          <input
            className={fieldClass}
            value={form.secondaryPositions}
            onChange={(e) => patch({ secondaryPositions: e.target.value })}
            placeholder="e.g. CM, CF"
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
          Height (ft/in)
          <input
            className={fieldClass}
            value={form.height}
            onChange={(e) => patch({ height: e.target.value })}
            placeholder={`6'2"`}
          />
        </label>
        <label className={labelClass}>
          POT range {isAcademy ? '(min-max) *' : '(optional history)'}
          <input
            className={fieldClass}
            value={form.potRange}
            onChange={(e) => patch({ potRange: e.target.value })}
            placeholder="78-94"
            required={isAcademy}
          />
        </label>

        {requiresStatus ? (
          <label className={`${labelClass} sm:col-span-2`}>
            Status *
            <select
              className={fieldClass}
              value={form.status}
              onChange={(e) =>
                patch({ status: e.target.value as PlayerStatus })
              }
              required
            >
              {PLAYER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-zinc-500">
              Reference: Special 91+ · Exciting 86–90 · Great 80–85 · At Club
              ≤79
            </span>
          </label>
        ) : null}

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
        <label className={labelClass}>
          Regen of (optional)
          <input
            className={fieldClass}
            value={form.regenOf}
            onChange={(e) => patch({ regenOf: e.target.value })}
            placeholder="Retired player name"
          />
        </label>
        <label className={labelClass}>
          Skill Moves (1–5)
          <input
            className={fieldClass}
            type="number"
            min={1}
            max={5}
            value={form.initialSM}
            onChange={(e) => patch({ initialSM: e.target.value })}
          />
        </label>
        <label className={labelClass}>
          Weak Foot (1–5)
          <input
            className={fieldClass}
            type="number"
            min={1}
            max={5}
            value={form.initialWF}
            onChange={(e) => patch({ initialWF: e.target.value })}
          />
        </label>
        <label className={labelClass}>
          Work rate
          <select
            className={fieldClass}
            value={form.initialWorkRate}
            onChange={(e) => patch({ initialWorkRate: e.target.value })}
          >
            {WORK_RATE_PRESETS.map((wr) => (
              <option key={wr} value={wr}>
                {wr}
              </option>
            ))}
          </select>
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Notes
          <textarea
            className={`${fieldClass} min-h-[4rem] resize-y`}
            value={form.notes}
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </label>
      </div>

      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md border border-accent-dim bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/25"
        >
          {mode === 'create-academy'
            ? 'Add academy player'
            : mode === 'create-external'
              ? 'Add external regen'
              : 'Add senior player'}
        </button>
      </div>
    </form>
  )
}
