import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { downloadPlayersBackup, parseBackup } from '../lib/backup'
import type { Player } from '../types/player'

const btnClass =
  'inline-flex items-center gap-1 rounded border border-border bg-panel-raised px-2 py-1 text-xs font-medium text-muted hover:border-zinc-500 hover:text-ink'

interface BackupControlsProps {
  players: Player[]
  onReplacePlayers: (players: Player[]) => void
}

export function BackupControls({
  players,
  onReplacePlayers,
}: BackupControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)

    let text: string
    try {
      text = await file.text()
    } catch {
      setError('Could not read that file.')
      return
    }

    const result = parseBackup(text)
    if (!result.ok) {
      setError(result.error)
      return
    }

    const confirmed = window.confirm(
      `This replaces all players currently in the app with ${result.players.length} player(s) from the backup.\n\nContinue?`,
    )
    if (!confirmed) return

    onReplacePlayers(result.players)
  }

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => downloadPlayersBackup(players)}
          className={btnClass}
          title="Download a JSON backup of all players"
        >
          <Download className="size-3.5 shrink-0" aria-hidden />
          Export backup
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null)
            fileRef.current?.click()
          }}
          className={btnClass}
          title="Replace roster from a JSON backup file"
        >
          <Upload className="size-3.5 shrink-0" aria-hidden />
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            void handleImportFile(file)
            e.target.value = ''
          }}
        />
      </div>
      {error ? (
        <p className="max-w-xs text-right text-[10px] text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
