import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { sellPlayer } from '../lib/players'
import type { Player } from '../types/player'

const fieldClass =
  'w-full rounded-md border border-border bg-panel-raised px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent-dim'

interface SellTransferModalProps {
  player: Player | null
  open: boolean
  onClose: () => void
  onConfirm: (player: Player) => void
}

export function SellTransferModal({
  player,
  open,
  onClose,
  onConfirm,
}: SellTransferModalProps) {
  const [destinationClub, setDestinationClub] = useState('')
  const [transferFee, setTransferFee] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resetAndClose = () => {
    setDestinationClub('')
    setTransferFee('')
    setError(null)
    onClose()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!player) return

    const club = destinationClub.trim()
    const fee = Number(transferFee)

    if (!club) {
      setError('Destination club is required.')
      return
    }
    if (!Number.isFinite(fee) || fee < 0) {
      setError('Transfer fee must be a number (0 or more). Use full euros, e.g. 8500000.')
      return
    }

    onConfirm(sellPlayer(player, club, fee))
    setDestinationClub('')
    setTransferFee('')
    setError(null)
    onClose()
  }

  return (
    <Modal
      title={player ? `Sell / Transfer — ${player.name}` : 'Sell / Transfer'}
      open={open && player != null}
      onClose={resetAndClose}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-xs text-muted">
          Moves the player to External with destination club and transfer fee
          recorded.
        </p>

        <label className="flex flex-col gap-1 text-xs text-muted">
          Destination club *
          <input
            className={fieldClass}
            value={destinationClub}
            onChange={(e) => {
              setDestinationClub(e.target.value)
              setError(null)
            }}
            autoFocus
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-muted">
          Transfer fee (€) *
          <input
            className={fieldClass}
            type="number"
            min={0}
            step={1000}
            value={transferFee}
            onChange={(e) => {
              setTransferFee(e.target.value)
              setError(null)
            }}
            placeholder="8500000"
            required
          />
          <span className="text-[11px] text-zinc-500">
            Enter full amount in euros (e.g. 12.5M → 12500000).
          </span>
        </label>

        {error ? (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md border border-amber-700/80 bg-amber-950/40 px-3 py-1.5 text-sm font-medium text-amber-200 hover:bg-amber-950/70"
          >
            Confirm transfer
          </button>
        </div>
      </form>
    </Modal>
  )
}
