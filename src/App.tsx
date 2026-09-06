import { GraduationCap, Shuffle, Users } from 'lucide-react'
import { useState } from 'react'
import { BackupControls } from './components/BackupControls'
import { ExternalPanel } from './components/ExternalPanel'
import { SquadPanel } from './components/SquadPanel'
import { usePlayers } from './hooks/usePlayers'
import type { SquadLocation } from './types/player'

type TabId = SquadLocation

const TABS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: 'senior', label: 'Senior Squad', icon: Users },
  { id: 'academy', label: 'Youth Academy', icon: GraduationCap },
  { id: 'external', label: 'External Regens & Transfers', icon: Shuffle },
]

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('senior')
  const { players, upsertPlayer, setPlayers, removePlayer } = usePlayers()

  return (
    <div className="flex min-h-full flex-col bg-surface text-ink">
      <header className="border-b border-border bg-panel">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2.5 sm:px-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
                FIFA 22 Career Mode
              </p>
              <h1 className="text-xl font-bold tracking-tight text-ink">
                Regens Run The World
              </h1>
              <p className="text-xs text-muted">
                Soft limits on SM/WF (either-or), WR, and positions.
              </p>
            </div>
            <BackupControls players={players} onReplacePlayers={setPlayers} />
          </div>

          <nav className="flex flex-wrap gap-1.5" aria-label="Main sections">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id
              const count = players.filter((p) => p.squadLocation === id).length
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-accent-dim bg-accent/10 text-accent'
                      : 'border-border bg-panel-raised text-muted hover:border-zinc-500 hover:text-ink',
                  ].join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {label}
                  <span className="rounded bg-zinc-800 px-1 py-px text-[10px] tabular-nums text-zinc-400">
                    {count}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-3 sm:px-4">
        {activeTab === 'academy' && (
          <SquadPanel
            title="Youth Academy"
            description="Scout ranges only — set status after promote."
            location="academy"
            variant="academy"
            players={players}
            onUpsertPlayer={upsertPlayer}
            onRemovePlayer={removePlayer}
          />
        )}
        {activeTab === 'senior' && (
          <SquadPanel
            title="Senior Squad"
            description="Badges track challenge limits. Promoted players may be Status unset."
            location="senior"
            variant="senior"
            players={players}
            onUpsertPlayer={upsertPlayer}
          />
        )}
        {activeTab === 'external' && (
          <ExternalPanel players={players} onUpsertPlayer={upsertPlayer} />
        )}
      </main>

      <footer className="border-t border-border bg-panel">
        <div className="mx-auto flex max-w-7xl flex-col gap-0.5 px-3 py-1.5 text-[10px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <p>
            Saves automatically in this browser. Export/Import backup from the
            header if you clear site data.
          </p>
          <p>Soft limits — badges warn; edits never blocked.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
