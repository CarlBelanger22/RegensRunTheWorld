import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { downloadPlayersBackup, parseBackup } from '../lib/backup'
import { replaceReleasedNames } from '../lib/releasedNames'
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
  const [note, setNote] = useState<string | null>(null)

  const handleExport = async () => {
    setError(null)
    setNote(null)
    const { filename, workspaceSaved } = await downloadPlayersBackup(players)
    setNote(
      workspaceSaved
        ? `Downloaded ${filename} and saved to backups/`
        : `Downloaded ${filename} (workspace backups/ only when running npm run dev)`,
    )
  }

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setNote(null)

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

    const releasedLine =
      result.releasedNames !== undefined
        ? `\nReleased names in file: ${result.releasedNames.length} (will replace tombstones).`
        : '\nOlder backup: existing released-name list in this browser will be kept.'

    const confirmed = window.confirm(
      `This replaces all players currently in the app with ${result.players.length} player(s) from the backup.${releasedLine}\n\nContinue?`,
    )
    if (!confirmed) return

    onReplacePlayers(result.players)
    if (result.releasedNames !== undefined) {
      replaceReleasedNames(result.releasedNames)
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            void handleExport()
          }}
          className={btnClass}
          title="Download a JSON backup (and write backups/ while on local dev server)"
        >
          <Download className="size-3.5 shrink-0" aria-hidden />
          Export backup
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null)
            setNote(null)
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
      {!error && note ? (
        <p className="max-w-xs text-right text-[10px] text-muted">{note}</p>
      ) : null}
    </div>
  )
}
