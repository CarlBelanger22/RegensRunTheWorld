import { getUpgradeStatus } from '../lib/upgradeStatus'
import { isGoalkeeper } from '../lib/players'
import type { Player, UpgradeBadge } from '../types/player'

const KIND_CLASS: Record<UpgradeBadge['kind'], string> = {
  available: 'border-zinc-600 bg-zinc-800/80 text-zinc-300',
  used: 'border-amber-700/80 bg-amber-950/50 text-amber-200',
  broken: 'border-red-600 bg-red-950/60 text-red-300',
}

const TITLE: Record<string, string> = {
  'SM/WF: Avail': 'SM/WF upgrade available (either-or)',
  'SM/WF: +1 SM': 'SM/WF upgrade used (+1 Skill Moves)',
  'SM/WF: +1 WF': 'SM/WF upgrade used (+1 Weak Foot)',
  'WR: Avail': 'Work rate upgrade available',
  'WR: Used': 'Work rate upgrade used',
  'WR: Max': 'Work rate already H/H — cannot go higher',
  'Pos: Avail': 'Position change available',
  'Pos: Used': 'Position change used',
}

function BadgePill({ badge }: { badge: UpgradeBadge }) {
  return (
    <span
      title={TITLE[badge.label] ?? badge.label}
      className={[
        'inline-flex whitespace-nowrap rounded border px-1 py-px text-[10px] font-medium leading-tight',
        KIND_CLASS[badge.kind],
      ].join(' ')}
    >
      {badge.label}
    </span>
  )
}

export function UpgradeBadges({ player }: { player: Player }) {
  if (isGoalkeeper(player)) {
    return (
      <span
        className="text-[10px] text-zinc-500"
        title="SM/WF, WR, and position upgrades do not apply to goalkeepers"
      >
        GK — upgrades n/a
      </span>
    )
  }

  const status = getUpgradeStatus(player)
  return (
    <div className="flex flex-wrap gap-0.5">
      <BadgePill badge={status.smWf} />
      <BadgePill badge={status.wr} />
      <BadgePill badge={status.position} />
    </div>
  )
}
