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

1. **Senior Squad** — Add players with a FIFA status. Sell/transfer with destination club and fee. Click a row to edit. Players promoted from the academy arrive with status unset until you set it.
2. **Youth Academy** — Track scout **POT as a min–max range** (no status yet). Promote to senior, or **Release** to remove a prospect from the app.
3. **External Regens & Transfers** — Two columns: **Scouted** and **Who Left**. Who Left hides SM / WF / WR columns.

### Challenge rules (badges)

| Rule | Available | Used | Rule broken |
|------|-----------|------|-------------|
| SM/WF (either-or) | neither raised | +1 SM **or** +1 WF | both raised, or either +2+ |
| Goalkeepers | upgrades n/a (SM/WF, WR, position) | — | — |
| Work rate | 0 steps from baseline | +1 L→M→H step total (Att + Def) | ≥2 steps, or any side decreased |
| Position | no extras beyond starting playable set | +1 new playable position | +2 or more |

Starting SM, WF, WR, and playable positions are frozen as the challenge baseline. Current values are compared to that baseline for badges.

Academy keeps POT as a range only. After promote or when adding a senior/external player, pick one of the four FIFA statuses manually (not derived from the range).

### Day to day

- Changes save automatically in this browser.
- Use **Export backup** / **Import backup** in the header to move a save between machines (import replaces the whole roster after confirm).
- Tips: hover **+** on OVR / SM / WF to bump; click POT to edit inline; in Edit, use **Edit baseline** if a frozen init value was logged wrong.
