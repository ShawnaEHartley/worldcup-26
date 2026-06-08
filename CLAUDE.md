# CLAUDE.md — Engineering Operating Manual

> This file is standing context for the engineering agent (Claude Code). Read it, then read
> `SPEC.md` for the product requirements. `SPEC.md` is **what/why**; this file is **how**.
> Build one ticket at a time, in plan mode, with PM review between steps.

---

## What this is

`worldcup-2026` — a **fully static** web app that renders a "goal-frame" shot explorer for
finalized football tournaments using StatsBomb free open data. See `SPEC.md` for the product.

## Working agreement (read first)

- **Plan before building.** For every ticket, propose a plan and wait for approval before writing
  code. Stop at ticket boundaries for review; do not chain tickets unprompted.
- **Product questions bounce to the PM.** If a ticket forces a decision about *what the product
  does* (scope, behavior, what a control means) rather than *how to implement it*, stop and ask.
  Do not silently resolve product ambiguity. Implementation choices (libraries, file structure,
  naming) are yours.
- **Honor the defaults marked "tunable in build"** in `SPEC.md` (cutoff line, palette) as starting
  points; surface them for tuning once real data renders, don't treat them as locked.

## Tier-0 architecture guardrails (non-negotiable)

This project deliberately avoids the failure mode of past projects (a backend + DB that rotted).

- **No backend server.** No Express/Fastify/etc. running at runtime.
- **No database.** None. Not Mongo, not Postgres, not SQLite-at-runtime, not a hosted KV.
- **No runtime data fetching from StatsBomb.** The app ships with its data baked in.
- **Data is build-time.** A script pulls + transforms StatsBomb data into slim app-ready JSON
  that is **committed to the repo**. The deployed artifact is static files only.
- **Deploy target:** Vercel, as a static build. Use Vercel's auto-generated URL during the build;
  the custom domain `worldcup.shawna.dev` is pointed only in Sprint 3.
- If a ticket seems to *need* a server, DB, or runtime fetch, that's a signal to stop and flag —
  it almost certainly means the approach is wrong, not that the guardrail should bend.

## Stack (decided)

- **Vite + React + TypeScript** — produces a pure static build (`dist/`), no SSR ambiguity.
- **SVG** for the goal-frame rendering (vector, scales responsively, trivial hover/tap targets).
- **`d3-scale`** (and only the scale/array helpers if useful) for coordinate math — do **not**
  hand DOM control to D3; React owns the DOM.
- **Data pipeline:** a standalone Node + TypeScript script (e.g. `scripts/build-data.ts`) run
  manually/at dev time, **not** at request time. Output committed under `src/data/` or `public/`.
- No state library needed for v1; React state/context is sufficient.
- Keep dependencies minimal. Justify any new dependency in the ticket plan.

## Data model (enables a parked feature — get this right early)

- **Player-centric.** Every shot references a player as a first-class entity. Use **StatsBomb's
  stable player id** as the canonical identity so the same human resolves across tournaments.
  This is what makes the parked cross-era comparison feature (`SPEC.md` §9) a query later, not a
  rewrite. Do not key players by name or by a per-tournament index.
- **Normalized goalmouth coordinate** lives in the data, not the renderer. Transform StatsBomb's
  raw shot end-location into the `{ gx, gz }` space defined in `SPEC.md` §11 inside the pipeline,
  so the React view consumes clean normalized coords and never touches pitch units.
- **Per-tournament files** so only the selected tournament's data loads. A small top-level index
  lists the five tournaments and their teams.
- The data contract in `SPEC.md` §11 is illustrative — finalize exact field names against real
  data in ticket 2, then keep them stable.

## StatsBomb specifics (verify in ticket 2, don't assume)

- Source repo: `statsbomb/open-data` (JSON on GitHub). Shots live in event data per match;
  competitions/matches are indexed in their own JSON.
- Each shot event carries an **outcome** (Goal / Saved / Blocked / Off T / Post / Wayward / etc.),
  an **xG** value, and an **end location that includes height** — that height is what places a dot
  vertically on the frame. Confirm exact field names and the outcome vocabulary against a real
  match file before building the transform; map their outcomes onto our normalized set
  (`goal | saved | near_miss | blocked | wayward`).
- **Attribution is required** by StatsBomb's free terms — a visible "Data: StatsBomb" credit must
  ship in the UI (`SPEC.md` §10). This is an acceptance criterion.

## Repo conventions

- Repo/folder name: `worldcup-2026`.
- Suggested layout (adjust as sensible, keep it flat and obvious):
  ```
  worldcup-2026/
    SPEC.md
    CLAUDE.md
    scripts/build-data.ts      # build-time pipeline; not shipped to client
    src/
      data/                    # committed app-ready JSON output
      components/              # GoalFrame, ShotDot, pickers, etc.
      lib/                     # coordinate + filtering helpers
      App.tsx
    public/
    README.md
  ```
- TypeScript throughout. Prefer small, named functions over clever abstractions. No premature
  generalization — build for the five tournaments and the parked seams, not for hypotheticals.
- Accessibility basics from the start: keyboard-focusable controls, sensible labels, don't encode
  meaning by color alone (pair color with shape/position where it matters).

## Run / build / deploy

- `npm install`
- `npm run dev` — local dev server
- `npm run build-data` (or `tsx scripts/build-data.ts`) — regenerate committed JSON from StatsBomb
- `npm run build` — produce static `dist/`
- Deploy: connect the repo to Vercel; framework preset Vite; output is static. Confirm the live
  staging URL renders before considering a ticket done.

## Definition of done (every ticket)

- Meets the ticket's stated "done when" criteria.
- `npm run build` succeeds and the static output works.
- No backend / DB / runtime-fetch introduced.
- Relevant acceptance criteria in `SPEC.md` §7 advanced (or unaffected), none regressed.
- Committed with a clear message; PM has reviewed the diff.

---

## Sprint 1 — the tracer bullet (build in this order)

Goal: a deployed static site on a Vercel staging URL that renders a real goal-frame with real
shots from **one** tournament, end to end. One ticket per plan-mode pass.

**Ticket 1 — Scaffold + deploy-first.**
Init `worldcup-2026` (Vite + React + TS), commit, connect to Vercel, deploy an empty shell.
*Done when:* a live Vercel URL renders a placeholder. (Deploy is proven on day one, not at the end.)

**Ticket 2 — Static data pipeline (one tournament).**
Write `scripts/build-data.ts` to pull one tournament from StatsBomb (suggest **2018 Men's WC** or
**2023 Women's WC**), transform shots into the §11 contract (normalized `{gx,gz}`, normalized
outcomes, stable `player_id`), and commit the output JSON. Document the final schema in `README.md`.
*Done when:* a clean per-tournament JSON exists, schema documented, field names locked.
*Flag to PM:* confirm the outcome vocabulary and end-location fields you found, and the
near-miss boundary you propose for the cutoff.

**Ticket 3 — The goal-frame component.**
A responsive SVG goal (posts, crossbar, net) — the canvas everything renders on. No data yet.
*Done when:* it renders cleanly across widths and has a defined coordinate space matching `{gx,gz}`.

**Ticket 4 — Shot-map render.**
Plot shots from the committed JSON onto the frame: position by `{gx,gz}`, color by outcome
(goal = green; distinct treatments for saved vs near-miss), optionally size by xG. Show the
blocked/wild **counts** beside the frame. Hover/tap reveals the shooter's name.
*Done when:* real shots are visible, legible, and outcome-encoded; counts shown; hover works.

**Ticket 5 — Team filter.**
A team picker that narrows the frame to one team's shots for the tournament.
*Done when:* selecting a team updates the goal-frame.

**Ticket 6 — Ship the slice + docs.**
Attribution line in the UI; finalize `README.md` (what it is, how to run, how to regen data).
*Done when:* all of the above is live on the staging URL with attribution and a working README.

Sprint 1 deliberately defers: the other four tournaments, match drill-down, player view, mobile
polish, accessibility pass, and the custom domain. Those are Sprint 2+ in `SPEC.md` §12.
