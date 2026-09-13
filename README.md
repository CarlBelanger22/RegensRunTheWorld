# Regens Run The World

Standalone desktop web app for a **FIFA 22 Career Mode Youth & Regen Challenge**. It tracks your academy and senior regens and shows soft status badges for Skill Moves, Weak Foot, Work Rates, and one extra playable position. Badges warn when a rule is used or broken; the app never hard-blocks edits.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Lucide icons

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173/).

```bash
npm test      # Vitest unit tests
npm run build # production build
```

## How it works

### Tabs (in order)

1. **Senior Squad** — Add players with a FIFA status. **Sell/transfer** (club + fee) or **Loan / Recall** (club only; player stays on Senior). Click a row to edit. Players promoted from the academy arrive with status unset until you set it.
2. **Youth Academy** — Track scout **POT as a min–max range** (no status yet). Promote to senior, or **Release** to remove a prospect (they stay gone after refresh / merge).
3. **External Regens & Transfers** — Two columns: **Scouted** and **Who Left**. Who Left hides SM / WF / WR columns.

### Challenge rules (badges)

| Rule | Available | Used | Rule broken |
|------|-----------|------|-------------|
| SM/WF (either-or) | neither raised | +1 SM **or** +1 WF | both raised, or either +2+ |
| Goalkeepers | upgrades n/a (SM/WF, WR, position); settled by default | — | — |
| Work rate | 0 steps from baseline | +1 L→M→H step total (Att + Def); H/H counts as max | ≥2 steps, or any side decreased |
| Position | no extras beyond starting playable set | +1 new playable position | +2 or more |

Starting SM, WF, WR, and playable positions are frozen as the challenge baseline. Current values are compared to that baseline for badges.

**Settled rail** — Click the colored strip on the left of a row when challenge upgrades are done for that player. Settled hides Avail/Used (shows “Settled — upgrades n/a”); Rule Broken still shows if you keep upgrading. The rail auto-turns on when SM/WF, WR, and position are all used. GKs start settled.

**Positions** — Natural is shown as e.g. `(LB)`. If **Current** differs from Natural, that code is added to **Secondaries** on create/save so converts stick when Current returns to Natural.

Academy keeps POT as a range only (a 6-point span is underlined as a cue). After promote or when adding a senior/external player, pick one of the four FIFA statuses manually (not derived from the range).

### Row colors

Senior and External rows tint by FIFA status. Players **on loan** use a sky-blue row (overrides status tint). Academy rows stay default unless on loan (loans are Senior-only in the UI).

### Day to day

- Changes save automatically in this browser.
- **Export backup** / **Import backup** in the header move a save between machines (import replaces the whole roster after confirm). Export is **v2**: full player fields (including settled, loan club, secondaries) plus the **released-name** list so Releases survive on another browser. Older backups still import and keep this browser’s released list. With `npm run dev`, Export also writes `backups/rrtw-backup-YYYY-MM-DD.json` (replaces prior dated files there).
- Tips: hover **+** on OVR / SM / WF to bump; click POT to edit inline; in Edit, use **Edit baseline** if a frozen init value was logged wrong.
