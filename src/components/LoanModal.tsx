import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { loanPlayer } from '../lib/players'
import type { Player } from '../types/player'

const fieldClass =
  'w-full rounded-md border border-border bg-panel-raised px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent-dim'

interface LoanModalProps {
  player: Player | null
  open: boolean
  onClose: () => void
  onConfirm: (player: Player) => void
}

export function LoanModal({
  player,
  open,
  onClose,
  onConfirm,
}: LoanModalProps) {
  const [loanClub, setLoanClub] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resetAndClose = () => {
    setLoanClub('')
    setError(null)
    onClose()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!player) return

    const club = loanClub.trim()
    if (!club) {
      setError('Loan club is required.')
      return
    }

    onConfirm(loanPlayer(player, club))
    setLoanClub('')
    setError(null)
    onClose()
  }

  return (
    <Modal
      title={player ? `Loan — ${player.name}` : 'Loan'}
      open={open && player != null}
      onClose={resetAndClose}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-xs text-muted">
          Keeps the player on Senior Squad and marks them out on loan (club
          only — no fee).
        </p>

        <label className="flex flex-col gap-1 text-xs text-muted">
          Loan club *
          <input
            className={fieldClass}
            value={loanClub}
            onChange={(e) => {
              setLoanClub(e.target.value)
              setError(null)
            }}
            autoFocus
            required
          />
        </label>

        {error ? (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded border border-sky-700/80 bg-sky-950/50 px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-sky-900/50"
          >
            Confirm loan
          </button>
        </div>
      </form>
    </Modal>
  )
}
