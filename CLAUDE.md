# CLAUDE.md — Engineering Operating Manual

> Standing context for Claude Code. Read this, then `SPEC.md`. `SPEC.md` = what/why; this = how.
> One ticket at a time, plan mode, PM review between.

---

## What this is
`worldcup-2026` — a **fully static** web app rendering a "goal-line shot explorer" for finalized
tournaments from StatsBomb free open data. See `SPEC.md`.

## Working agreement
- **Plan before building.** One ticket per plan; wait for approval; don't chain tickets.
- **Product questions bounce to the PM.** Behavior/scope decisions are the PM's; implementation
  (libraries, layout, naming) is yours.
- **Report spec-affecting changes.** If a ticket changes product behavior, a definition, a label, a
  count rule, or anything else recorded in `SPEC.md`, **call it out explicitly at the end of the
  ticket** ("SPEC impact: …") so the PM can reflect it back into `SPEC.md`. Don't let the build and
  the spec drift silently — the spec is the shared source of truth across all three teams.
- The §5.4 visual-tuning items (palette, height rendering, horizontal extent, near-miss feel) are now
  **locked** (decided against real data in T12); treat them as settled, not open.

## Tier-0 guardrails (non-negotiable)
- **No backend. No database. No runtime fetching from StatsBomb.**
- **Data is build-time** → committed static JSON; deployed artifact is static files only.
- **Deploy:** Vercel static; auto URL during build; custom domain only in Sprint 3.
- If a ticket seems to need a server/DB/runtime fetch → **stop and flag**.

## Stack (decided)
Vite + React + TypeScript (pure static). SVG for rendering (React owns the DOM; `d3-scale` for math
only). Pipeline = standalone Node + TS script (`scripts/build-data.ts`), dev-time, output committed to
`src/data/`. React state/context for the shared filter state. Minimal dependencies.

## Shared filter state (architecture — get right)
One source of truth: `{ tournamentId, teamId, playerId?, matchId? }`. Both the filter bar and graphic
clicks read/write it. Player and Match are composable (AND-narrow) and independently clearable. Shot
clicks and the card's "doorways" set `playerId` / `matchId`. Never keep two parallel states.

## Data model (enables parked features — get right early)
- **Player-centric**, keyed by **stable StatsBomb `player_id`** (cross-tournament). Never key by name.
- **Normalized coords** in the pipeline (`lineX`, `height`); keep `height` even if v1 wide view omits it.
- **Per-tournament shot files** + index (load only the selected tournament).
- **Per-match meta**: home/away, scores, `result_type` (normal/extra_time/penalties), `stage` (from
  `competition_stage.name`), derived `stage_label`, date, and a `shootout` block when applicable
  (per-team ordered kicks with scored bool, pen tallies, winner). See `SPEC.md` §15.
- **`team → country` map** for flags.

## Pipeline rules (verify against real data)
- Map StatsBomb outcomes → `goal | saved | missed | blocked`; blocked → `reached_goal_line: false`,
  null coords.
- **Shootout kicks: EXCLUDE from the shot set** (filter on StatsBomb penalty-shootout period) and from
  all tournament/team totals. Instead, capture them into the match's `shootout` block (ordered per
  team, scored bool, pen score, winner) for match view.
- **In-game penalties: KEEP**, `is_penalty: true`.
- **Capture rich fields:** `shot_type`, `body_part`, `play_pattern`, `first_time`, `under_pressure`,
  `assisted_by`, `xg`.
- **Capture `result_type`** (normal/extra_time/penalties) + final score for the match-view header.
- **Attribution:** ship a visible "Data: StatsBomb" credit.

## UI rules
- **Tap/click, not hover.** Single-select; highlight the dot; detail card **below** the graphic, never
  an overlay.
- **Plain-language xG** (e.g. `1-in-round(1/xg)`), not the bare term, in primary UI.
- **Flags:** country flags + situational badges (Penalty, body part, situation, first-time, under
  pressure). Keep the card crisp.
- **Match-view header:** result + winner, three states (normal / a.e.t. / on penalties), search-result
  style.
- **Shootout strip:** match view only, when `result_type == penalties`. **Grouped by team** (two rows,
  one per team), kicks **in order within each row**, aligned column-wise; green = scored, red =
  missed/saved; show pen tally + winner.
- **Accessibility:** keyboard-focusable; don't rely on color alone; sensible labels.
- Visual identity: friendly/clean per `SPEC.md` §4 (read `frontend-design` skill when styling).

## Repo conventions
Folder `worldcup-2026`; flat layout (`scripts/build-data.ts`, `src/data/`, `src/components/`,
`src/lib/`, `src/App.tsx`, `README.md`). TypeScript throughout; small named functions; build for the
five tournaments + parked seams, not hypotheticals.

## Run / build / deploy
`npm install` · `npm run dev` · `npm run build-data` · `npm run build` · deploy via Vercel (Vite
preset, static). Confirm the live URL before calling a ticket done.

## Definition of done (every ticket)
Meets "done when"; `npm run build` succeeds; no backend/DB/runtime-fetch; relevant `SPEC.md` §16
criteria advanced, none regressed; clear commit; PM reviewed the diff.

---

## Build plan

### Sprint 1 — tracer bullet (one tournament, end to end)
- **T1 — Scaffold + deploy-first.** ✅ DONE.
- **T2 — Data pipeline (slim).** ✅ DONE (lineX/height/outcome/xg, player-centric).
- **T2b — Pipeline expansion.** Add rich shot fields (`shot_type`, `body_part`, `play_pattern`,
  `first_time`, `under_pressure`, `assisted_by`), `is_penalty`; **exclude shootout kicks** from shots
  and capture them + `result_type` + scores into per-match meta; add `stage`/`stage_label`/date and the
  `team → country` map. Re-run; document schema in `README.md`. *Flag to PM:* the StatsBomb outcome
  labels and the shootout period value used.
- **T3 — Goal-line canvas.** Responsive SVG, corner-to-corner, goal centered, horizontal-only.
- **T4 — Plot shots.** Position by `lineX`; outcome colors (goal green; distinct saved/missed); blocked
  counter; in-game penalty flag. *PM checkpoint:* with real dots, decide palette / whether to add
  height / horizontal extent (`SPEC.md` §5.4).
- **T5 — Basic team filter + ship slice.** Team picker; attribution; README. Sprint 1 live.

### Sprint 2 — full interface + catalog
- **T6 — All five tournaments** + tournament picker.
- **T7 — Synced composable filter bar** (`Tournament → Team → Player + Match`) over the shared state;
  both-way sync with the graphic; Player/Match composable + clearable.
- **T8 — Summary stats bar** (shots / on-goal=goals+saves / goals / matches), consistent with the plot.
- **T9 — Tap-to-select + rich shot card** (single-select; card below graphic; outcome banner, flags,
  plain-language xG, assist, situation badges; two doorways wired to shared state).
- **T10 — Match cards + match view.** Match cards (opponent/stage/result, drill-in); **match-view
  result header** (3 states) and the **shootout strip** (grouped by team) when `result_type == penalties`.
- **T11 — Responsive pass.**

### Sprint 3 — polish
Palette/height/extent tuning vs real data; accessibility; mobile; point `worldcup.shawna.dev`.
