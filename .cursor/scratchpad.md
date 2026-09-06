# Scratchpad — FIFA 22 Youth & Regen Challenge Tracker

## Background and Motivation

Build a standalone desktop web app (React + Vite + Tailwind + Lucide + `localStorage`) to track FIFA 22 Career Mode Youth/Regen players while visually enforcing career-long development limits:

- SM: max +1 star career-wide
- WF: max +1 star career-wide
- Work Rates: max 1 upgrade total (any WR change counts as the one upgrade)
- Position: player may already have multiple playable positions; challenge allows **adding exactly one extra** playable position beyond their starting set

The app must **not hard-block** edits; it must surface **dynamic status badges** (Available / Used / Rule Broken) so the user can self-police the challenge.

Greenfield repo (`RegensRunTheWorld`) — no existing code.

**Mode:** Designer — Task 13 (work rate step logic). Awaiting human confirm on dropdown filtering, then Executor.

### Decisions locked (Task 8)
1. Show **current** SM/WF/WR only
2. **Three columns** (SM | WF | WR)
3. Show on **External** too
4. Bump storage to **v3** with one YA example player

---

## Background and Motivation (append — 2026-09-06)

User wants each player **table row** to show **SM, WF, and work rates** (not only in the edit modal). Also add **one example Youth Academy player** so YA isn’t empty while they start logging their real save.

Note: Roster was wiped empty (`rrtw:players:v2`). Empty `[]` in storage does **not** re-trigger seed-on-first-visit; introducing one example likely needs a storage key bump or an explicit empty→seed path.

## Decisions Locked (Designer pass 3 + final confirms)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Position rule | Starting playable set frozen as `initialPlayablePositions`. Allowed **+1 extra** position only. Existing secondaries do not consume allowance. |
| 2 | Academy potential | In academy, user enters/sees **`potRange` as min–max only**. There is **no known exact POT** and **no status yet** (matches FIFA YA scouting). |
| 3 | Senior status | After promote (or for senior players), user **manually selects** one of 4 FIFA statuses. Status is **not** auto-calculated from the range. |
| 4 | Status labels | Keep the four strings exactly as specified (incl. "At Club Since..."). |
| 5 | Tabs | 1 Academy · 2 Senior · 3 External. Scouted \| Left split is on **Tab 3**. |
| 6 | List UI | **Table** (rows). |
| 7 | Accent | **Emerald** on zinc/slate dark. |
| 8 | Work rates | Preset dropdowns only. |
| 9 | Edit modal | Full player form. |
| 10 | External layout | Two side-by-side sections: Scouted Regens \| Regens Who Left. |
| 11 | TypeScript | Yes. |
| 12 | Seed | Generic mocks (no club theme). |
| 13 | Soft rules | Never hard-block invalid SM/WF/WR/position edits; badges warn (Available / Used / Rule Broken). |
| 14 | Promote UX | Do **not** force status on promote; leave unset; show “Status unset” cue on Senior until edited. |
| 15 | potRange after promote | **Keep** showing academy `potRange` as history on senior players. |
| 16 | Add Senior / External | Status **required** at create time. |

### POT / Status model (corrected — replaces earlier auto-derive idea)

**FIFA-accurate flow the user described:**

1. **Youth Academy:** Scouts show a **range** (`min-max`). You do **not** know the true potential band yet → UI shows `potRange`, status field is **unset** (`null` / omitted). Do **not** show a fake status derived from max/min.
2. **Promote to Senior:** In-game you can finally read the development plan / status line → app must let user **pick** one of:
   - `Has Potential to Be Special` (reference: POT 91+)
   - `An Exciting Prospect` (86–90)
   - `Showing Great Potential` (80–85)
   - `At Club Since...` (≤79 or older)
3. The parenthetical POT bands are **reference text in the UI** (help the user choose), not a formula the app runs on `potRange`.

**Outdated (pass 2):** ~~Auto-derive status from max of potRange; never show a status dropdown.~~

---

## Key Challenges and Analysis

### 1. Position rule (locked)
- Freeze `initialPlayablePositions: string[]` at create from natural + initial secondaries.
- Current playable set = natural + parsed `secondaryPositions` (and/or explicit list maintained in form).
- Extra count = positions in current set not in initial set.
- Available (0) / Used (1) / Rule Broken (≥2).
- Soft-warn if `currentPosition` ∉ current playable set.

### 2. Status lifecycle (locked)
- `potRange: string` — academy scout range; **kept** after promote as history.
- `status: PlayerStatus | null` — `null` in academy and after promote until user sets it.
- Promote: instant move to senior; **no** forced status; show “Status unset” on Senior until edited.
- Add Senior / Add External: status **required** at create. Academy add: status hidden.

### 3. Filtering & sorting implications
- Status filter: include “Unset / Academy (no status)” option, or hide status filter on Academy tab.
- Academy sort “by POT”: sort by **max of potRange** (or min–max string), not by status.
- Senior/External sort “by status”: ordered Special → Exciting → Great → At Club → Unset.

### 4. External tab
Two columns; sold = has destinationClub and/or transferFee; else scouted.

### 5. Persistence & seed
`rrtw:players:v1`; seed mix e.g. 2 academy (range, no status), 1 senior (status set), 1 external scouted optional.

### 6. Scope
No backend/auth/charts/DnD. Vitest for upgrade helpers + position extras + potRange parse (for sorting/display only).

---

## Background and Motivation (append — modal focus bug)

User reports Sell / Transfer modal: after typing **one character**, the destination-club field loses focus (close **X** becomes focused — visible in screenshot). Designer mode: plan fix only; do not implement until human switches to Executor.

---

## Key Challenges and Analysis (append — modal focus)

### Root cause (confirmed in code)

In `src/components/Modal.tsx`, a `useEffect` runs whenever `[open, onClose]` changes and does:

```ts
queueMicrotask(() => closeRef.current?.focus())
```

`SellTransferModal` recreates `resetAndClose` on **every keystroke** (local `useState` → re-render → new function) and passes it as `Modal`’s `onClose`. That re-triggers the effect, which steals focus from the input to the close button. Matches the screenshot (X outlined after typing “Ma”).

This is **not** a controlled-input remount / unstable `key` bug in the field itself.

### Why Sell is hit hardest

Edit / Add keep form state in a child; parent `onClose` arrow often stays stable while typing. Sell keeps form state in the same component that invents `onClose` each render → bug every character.

### Fix approach (simplest)

1. **Primary (Modal):** Only auto-focus the close control when the dialog **opens** (`open` goes false→true), not when `onClose` identity changes. Keep Escape/overlay working via a **ref** for the latest `onClose` so the effect need not list `onClose` as a focus dependency.
2. **Optional belt-and-suspenders:** `useCallback` for Sell’s `resetAndClose` — nice but insufficient alone if any parent passes inline `onClose`.
3. **UX note:** After the steal-focus fix, `autoFocus` on Destination club should keep working so open lands in the field, not the X. Do not remove Escape / click-outside / body scroll lock.

### Out of scope

Rewriting modal architecture, focus traps libraries, or changing sell business logic.

---

## Background and Motivation (append — Export/Import)

User wants a backup so clearing site data (or switching machines) is recoverable. Agreed approach: **Export / Import JSON** (not cloud). Day-to-day still uses `localStorage`; export is insurance; import is restore only.

---

## Key Challenges and Analysis (append — Export/Import)

### Decisions locked (Designer)
1. **Export** downloads a `.json` file of the current roster.
2. **Import** **replaces** the entire current roster (no merge). Confirm before applying: “This replaces all players currently in the app.”
3. **File shape:** versioned envelope (future-proof), not a bare array alone:
   ```json
   { "version": 1, "exportedAt": "<ISO>", "players": [ /* Player[] */ ] }
   ```
4. **Import also accepts** a bare `Player[]` array (same shape as localStorage) for flexibility.
5. **UI:** two small controls in the **header** (Export backup / Import backup) — always visible, not buried per-tab.
6. **Filename:** `rrtw-backup-YYYY-MM-DD.json` (local date).
7. **Out of scope:** cloud sync, auto-export reminders, merge-import, encrypting files.

### Validation on import
- Reject non-JSON / wrong shape with a clear error (alert or inline message).
- Require `players` to be an array; each item must have at least `id` + `name` (minimal sanity). Soft-normalize `height` like `loadPlayers` does.
- Do **not** re-seed on failed import — leave current roster unchanged.

### Persistence after import
- Call existing `setPlayers` / `replacePlayers` so `usePlayers` effect writes to `localStorage` as today.

### Tests (TDD)
- Pure helpers: `serializeBackup(players)`, `parseBackup(json)` — round-trip + reject garbage + accept bare array.

---

## High-level Task Breakdown

### Task 0 — Close last confirms ✅
**Success:** Answers locked (promote leave unset; keep potRange; status required on Add Senior/External).

### Task 1 — Scaffold
Vite + React + TS, Tailwind, Lucide, nanoid, emerald/zinc dark shell, 3 tabs.  
**Success:** `npm run dev` works.

### Task 2 — Data layer + tests
Types (`status: PlayerStatus | null`, `initialPlayablePositions`, etc.), storage, seed, WR presets, `getUpgradeStatus`, potRange parse helpers (sort only — **not** status).  
**Success:** Tests green; localStorage round-trip.

### Task 3 — Shared UI
Search, filters, sort, upgrade badges, table. Tab-aware columns (Academy shows range; Senior shows status).  
**Success:** Correct columns/filters per tab on seed data.

### Task 4 — Youth Academy
List, Add (range, no status), Promote flow (per confirmed UX).  
**Success:** Promote moves to Senior; status behavior matches decision.

### Task 5 — Senior Squad
List + badges, Add Senior (status required), Sell → Left section.  
**Success:** Sell + badges work.

### Task 6 — External + Edit modal
Two-column layout; Add External Regen; full Edit (status visible when not academy).  
**Success:** Split + edit persist.

### Task 7 — Polish ✅ (pending human + Designer cross-check)
Empty states, modal body scroll lock + Escape/focus, dark color-scheme meta, footer, project README.  
**Success:** Checklist below; human smoke test; Designer marks complete.

### Task 8 — Row SM/WF/WR + one YA example (Designer)
8b: Compact current SM / WF / WR on each player row (all tabs).  
8c: Seed exactly one academy example player (migration TBD).  
**Success:** YA shows one example with SM/WF/WR visible; real adds still work.

### Task 9 — Fix modal input focus steal (Designer 2026-09-06)
**9a.** Change `Modal` so close-button autofocus runs only on open transition; Escape/`onClose` via ref (stable while typing).  
**Success:** Typing many characters in Sell destination + fee never moves focus to X; Escape still closes; overlay click still closes; body scroll still locked while open.

**9b.** Smoke-check Add + Edit modals for same symptom; optional `useCallback` only if still needed after 9a.  
**Success:** Human can type continuously in Sell, Add, and Edit without unfocus.

**9c.** `npm test && npm run build` green.  
**Success:** Exit 0.

### Task 10 — Export / Import backup (Designer 2026-09-06)
**10a.** Add `src/lib/backup.ts` (+ tests): `serializeBackup`, `parseBackup` (envelope v1 + bare array; reject invalid; normalize height).  
**Success:** Vitest covers round-trip, bare array, and bad JSON/shape.

**10b.** Wire Export: header button → download current `players` as `rrtw-backup-YYYY-MM-DD.json`.  
**Success:** Manual: add a player, Export, open file — see that player in `players`.

**10c.** Wire Import: header button → file picker → confirm replace → `replacePlayers(parsed)` → persists to localStorage. Show error if parse fails (roster unchanged).  
**Success:** Manual: Export → clear/change roster → Import file → roster matches backup; Cancel on confirm leaves data alone.

**10d.** `npm test && npm run build` green; short footer note optional (“Export backups from header”).  
**Success:** Exit 0; human smoke test.

## Background and Motivation (append — inline quick edit)

User wants to bump **OVR / SM / WF** and edit **POT** from the table without opening the full Edit modal. Suggested double-click; asked for alternatives if better. Row click currently opens Edit — any cell interaction must not fight that.

---

## Key Challenges and Analysis (append — inline quick edit)

### Interaction options (compare)

| Approach | Pros | Cons |
|---|---|---|
| **A. Double-click cell** | Familiar “edit cell” pattern; single-click row still opens full Edit | Easy to miss; accidental dblclick; slower for “+1 OVR many times” |
| **B. Click cell → inline edit** (recommended for POT) | Fast type-in for ranges like `81-87` | Conflicts with row-click Edit unless cell `stopPropagation` |
| **C. Click ± steppers on OVR/SM/WF** | Fastest for +1/-1 bumps during a session; hard to mis-tap | Slightly busier UI; need clamp (OVR 1–99, SM/WF 1–5) |
| **D. Alt/⌘+click cell** | No conflict with row click | Discoverability poor for non-technical user |
| **E. “Quick edit mode” toggle** | Clear mode switch | Extra step; easy to leave on |

### Recommendation (Designer)

**Hybrid — not pure double-click:**

1. **OVR, SM, WF:** small **− / +** controls on the cell (or appear on hover). Click +/− adjusts by 1, clamped. `stopPropagation` so row Edit does not open. Badges update live (soft rules unchanged).
2. **POT:** **single click** the POT value → becomes an inline text field (focus + select). Enter/blur saves; Escape cancels. `stopPropagation`. Validate with existing `parsePotRange` (empty OK on senior; required only if we later enforce on academy — keep same rules as Edit modal: academy needs valid range when non-empty / required on create already done).
3. **Name / rest of row:** still opens full Edit (unchanged).
4. Optional polish: double-click OVR/SM/WF opens a tiny numeric input if they need jump (e.g. 48→55) — **phase 2**, not required for v1.

**Why not double-click alone:** for OVR you often want many +1s after matches; dblclick-to-type is worse than +/−. For POT you need free text, so inline field beats steppers.

### Scope locked if approved
- Columns: OVR, SM, WF, POT (where POT column exists — Academy + Senior).
- Who Left / External without SM/WF: only OVR (and POT if shown — External has no POT today).
- Persist via existing `onUpsertPlayer` / `touchPlayer`.
- Do **not** change frozen `initialSM` / `initialWF` via quick edit (only `current*`).
- Soft badges only — no hard block on SM/WF breaks.

### Out of scope
WR quick edit, Status quick edit, Height, full spreadsheet mode.

---

### Task 11 — Inline quick-edit OVR / SM / WF / POT (Designer 2026-09-06)
**11a.** Confirm interaction model with human (hybrid ± + POT inline vs pure dblclick).  
**Success:** Human picks model.

**11b.** Table cells: OVR/SM/WF ± steppers (hover or always-visible compact); `stopPropagation`; clamp; call upsert.  
**Success:** Manual: + OVR on a YA player persists after refresh; SM/WF badges update; row click elsewhere still opens Edit.

**11c.** POT cell: click → inline input; Enter/blur save; Escape cancel; validate range.  
**Success:** Edit POT without modal; invalid input shows brief error / revert.

**11d.** Tests for clamp helpers + pot inline validation; `npm test && npm run build`.  
**Success:** Exit 0; human smoke.

---

## Project Status Board

- [x] Tasks 0–10: prior work
- [x] Task 11a: Confirm quick-edit interaction model
- [x] Task 11b: OVR/SM/WF hover + (increase only)
- [x] Task 11c: POT inline edit
- [ ] Task 11d: Tests/build + smoke — **Executor done; awaiting human verify**
- [ ] Designer: mark project complete after human + cross-check

---

## Background and Motivation (append — edit frozen baseline)

User wants an **Edit** control on the frozen baseline row in the player Edit modal (next to `Frozen: … · SM / WF / WR`) so they can correct screenshot typos / mistakes without fighting the challenge badges. Designer mode only for now.

---

## Key Challenges and Analysis (append — frozen edit)

### Why this exists
Frozen fields (`initialPlayablePositions`, `initialSM`, `initialWF`, `initialWorkRate`) define challenge baselines. Badges compare **current** vs **initial**. Wrong initials (e.g. SM logged as 3 when it was 4) make badges lie (`Broken` when it should be fine, or the reverse).

### Current code constraint
`touchPlayer` **always** keeps the old `initialPlayablePositions` (ignores patch). Any frozen-edit path must either:
- add `correctFrozenBaseline(player, patch)` that is allowed to set initials, or
- extend `touchPlayer` with an explicit `{ allowFrozen: true }` flag.

Prefer a dedicated helper so normal edits stay safe.

### Proposed UX (simplest)
1. On the badges/frozen row: **Edit** button to the right.
2. Click → row expands (or swaps) into compact fields:
   - **Init positions** — text (`CF, ST`), parsed/deduped like secondaries
   - **Init SM** / **Init WF** — number 1–5
   - **Init WR** — preset dropdown
3. **Apply** / **Cancel** on that mini row (does **not** require main form Save). Applying updates the player immediately via `onSave`/`upsert`, remounts preview badges.
4. Main form still edits **current** SM/WF/WR/positions as today.
5. Soft badges only — no hard block if correcting initials makes deltas look “used.”

### Sparring note
Editing “frozen” is powerful and easy to abuse mid-challenge. That’s fine as a **correction tool**, but the UI label should stay clear: e.g. **Edit baseline** not just “Edit”, so it’s obvious you’re changing the challenge start line.

### Out of scope
Auto-sync current SM/WF down to new initials; resetting natural/current from initials; per-field history.

---

### Task 12 — Edit frozen init values (Designer 2026-09-07)
**12a.** Lock UX answers (below).  
**Success:** Human confirms.

**12b.** Add `correctFrozenBaseline` (or equivalent) that can update initial positions/SM/WF/WR; tests.  
**Success:** Unit tests green; normal `touchPlayer` still freezes positions.

**12c.** Edit-modal UI: Edit baseline button → inline fields → Apply/Cancel; live badges update.  
**Success:** Manual: open Patrick MacDonald, set init SM/WF to match reality, badges stop showing Broken incorrectly (or show expected state).

**12d.** `npm test && npm run build`.  
**Success:** Exit 0.

---

## Background and Motivation (append — WR step logic)

User clarified FIFA-style work rates: Att/Def sides are L → M → H (increase only). Challenge allows **+1 step total** across both sides (same spirit as SM/WF either-or). Example: baseline `L/H` → only legal +1 is `M/H`; `H/H` is +2 (L→H on attack) and must show **Broken**. Today the app only checks string equality → any change is “Used,” so Leonardo `L/H` → `H/H` wrongly shows Used instead of Broken.

---

## Key Challenges and Analysis (append — WR steps)

### Correct model
- Parse `A/D` into two ranks: L=0, M=1, H=2.
- `attackDelta = max(0, curA - initA)`, `defDelta = max(0, curD - initD)`.
- `totalSteps = attackDelta + defDelta`.
- Badge: 0 → Avail · 1 → Used · ≥2 → Broken (label e.g. `Broken: +2 WR`).
- Decreases (cur < init on a side) are invalid for challenge; treat as Broken or block in UI (see Q1).

### Leonardo example
- Init `L/H` (0/2), current `H/H` (2/2) → attack +2, def +0 → total 2 → **Broken**. ✓

### M/M example
- Legal +1: `H/M`, `M/H`
- `H/H` → +2 → Broken

### Dropdown filtering (proposal)
Show only presets where **each side ≥ baseline** (no decreases). Still include multi-step options so soft badge can show Broken (matches SM/WF soft rules). Optionally hide ≥+2 choices — that would hard-block, which conflicts with “badges warn; edits never blocked.”

**Recommendation:** Filter out decreases only; keep +2 options visible; badge shows Broken.

### Edit baseline WR
Init WR editor should still offer full `WORK_RATE_PRESETS` (setting the baseline, not an upgrade).

### Code touchpoints
- New helpers: `parseWorkRate`, `workRateStepDelta`, `workRateOptionsFromBaseline`
- `upgradeStatus.workRateBadge` uses step delta
- Edit + Create forms: current WR `<select>` options filtered from baseline (create: baseline = chosen initial WR)

---

### Task 13 — Work rate step upgrades (Designer 2026-09-07)
**13a.** Confirm dropdown policy (below).  
**Success:** Human picks.

**13b.** Helpers + tests (L/H→M/H =1, L/H→H/H =2, M/M→H/H =2, decreases).  
**Success:** Vitest green.

**13c.** Wire badge + filter current-WR dropdowns (edit/create); baseline editor stays full list.  
**Success:** Leonardo `H/H` shows Broken; dropdown from `L/H` includes `L/H`, `M/H`, `H/H` (no `L/M` etc. that drop a side).

**13d.** `npm test && npm run build` + human smoke.  
**Success:** Exit 0.

---

## Project Status Board

- [x] Tasks 0–12: prior work (12 smoke may still be pending human)
- [ ] Task 13a: Confirm WR dropdown policy — **awaiting human**
- [ ] Task 13b: WR step helpers + tests
- [ ] Task 13c: Badge + dropdown filtering in forms
- [ ] Task 13d: Build/smoke
- [ ] Designer: mark project complete after human + cross-check

---

## Remaining Questions

1. For **current WR** dropdown: show only “no decrease from baseline” (incl. +2 so Broken can appear — **recommended**), or also **hide +2 / Broken options** (harder filter)?
2. If someone already saved an illegal decrease (e.g. init `H/H`, current `M/H`): keep it visible + **Broken**, or auto-clamp on load?

---

## Executor's Feedback or Assistance Requests

- **Executor (Task 12):** Edit baseline on frozen row — Apply saves immediately; free-text positions + Reset from Natural/Secondaries; no confirm popup. Please try on Patrick MacDonald (fix init SM/WF/positions).
- **Executor (Task 13):** WR uses L→M→H step counts; `L/H`→`H/H` = Broken +2; current WR dropdown only upward vs baseline (keeps +2 picks). Please check Leonardo Cardoso.
---
## Lessons

- Modal `useEffect(..., [open, onClose])` + `closeRef.focus()` will steal focus every time parent recreates `onClose` (e.g. Sell form state in same component). Autofocus close only when `open` becomes true; keep latest `onClose` in a ref for Escape.
- Position sort order is user-specified (not FIFA DB IDs): GK, LWB, LB, CB, RB, RWB, CDM, LM, CM, CAM, RM, LW, RW, CF, ST.
- localStorage persists same-browser sessions; Export/Import is the insurance against clear-site-data — not a daily import ritual.
- User rule: Designer vs Executor must be explicit.
- Do not implement until ≥95% confidence.
- **OUTDATED:** Assuming status is auto-derived from potRange max. **Correct:** Academy = range only; Senior = user-selected status (FIFA reveal on signing/promote).
- Position rule is “+1 extra playable position,” with frozen `initialPlayablePositions`.
- External scouted/left split is Tab 3, two columns.
- Prefer sparring: earlier “use MAX for status” was solving the wrong problem — the user never gets an exact number in YA; status is observed later in senior squad.
- Executor: only one Project Status Board task at a time; ask human to verify before marking complete.
- create-vite cancels on non-empty dir (`.cursor`); scaffold via temp folder then copy.
- When testing position extras, mutate `secondaryPositions` *after* `createPlayer` — passing overrides into create rebuilds `initialPlayablePositions` and falsely shows Available.
- Empty `[]` in localStorage blocks “seed if missing key”; re-adding demo players needs a key bump or length-0 seed policy — don’t wipe user data without asking.
- SM/WF badges are either-or; row display still shows both star counts.