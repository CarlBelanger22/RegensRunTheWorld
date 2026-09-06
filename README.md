# Regens Run The World

Standalone desktop web app for tracking a **FIFA 22 Career Mode Youth & Regen Challenge**. Soft-enforces career limits on Skill Moves, Weak Foot, Work Rates, and one extra playable position via status badges (does not hard-block edits).

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Lucide icons
- Browser `localStorage` (`rrtw:players:v1`)

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

## Tabs

1. **Youth Academy** — scout POT range (min–max); no status yet; promote to senior (status left unset)
2. **Senior Squad** — status required on add; sell/transfer with club + fee
3. **External** — Scouted regens | Regens who left (side by side)

Click any player row to edit. Upgrade badges update live from initial vs current values.

## Challenge rules (badges)

| Rule | Available | Used | Rule broken |
|------|-----------|------|-------------|
| SM/WF (either-or) | neither raised | +1 SM **or** +1 WF | both raised, or either +2+ |
| SM/WF for **GK** | always free (no limit) | — | — |
| Work rate | same as initial | any change | — |
| Position | no extras beyond starting set | +1 new playable position | +2 or more |

Academy stores POT as a range only. After promote/signing, pick one of the four FIFA statuses manually.

## Data

Fresh installs seed **one** Youth Academy example player so the table layout is clear. Add the rest from your career save. Persists under `rrtw:players:v3`.
