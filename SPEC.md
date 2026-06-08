# SPEC.md — Goal-Frame Shot Explorer

> Product requirements for `worldcup-2026`. This is the source of truth for **what** we're
> building and **why**. The companion `CLAUDE.md` covers **how** (stack, conventions, guardrails).
> When an implementation choice would change scope or product behavior, it stops being an
> engineering decision and comes back to the PM — see "Working agreement" in `CLAUDE.md`.

---

## 1. One-liner

An interactive viz that lets a fan look **at the goal** and see, for any team in a finalized
tournament, **where every shot ended up** — goals tucked in the corners, saves on the frame,
near-misses just outside — so a team's *finishing signature* reads in seconds.

## 2. Who it's for

The **fan** — casual to curious. No analytics vocabulary required. Someone should be able to
use this without knowing what "xG" means. (xG is used under the hood and may appear as a subtle
visual weight, but it is never the headline and never gating.)

The *audience* evaluating the work is hiring managers looking at a portfolio. We serve them by
serving the fan well: a tight, opinionated, reliable tool is the strongest signal of product
judgment. We do **not** serve them by adding features.

## 3. The core thing (the 10-second takeaway)

Within ten seconds of landing on a team, the user grasps that team's **finishing signature**:
a cluster of green in the top corners reads "clinical"; a spray of dots high and wide reads
"wasteful." That instant, emotional read is the product. Everything else supports it.

## 4. The hero view — the goal-frame

This is the only view in the MVP. There is **no** top-down "where they shot from" pitch map.

**The camera:** we look *at* the goal — net, posts, crossbar — head-on. Each shot is a dot
placed where the ball **ended up** relative to the goal, not where it was struck.

**What earns a dot** (a shot that *reached the goal mouth*):
- **Goal** — crossed the line. Dot inside the frame, in the corner/spot where it went in.
- **Saved** — reached the frame, keeper stopped it. Dot on the frame where it was met.
- **Near-miss** — rang off the post/bar, or missed by a whisker. Dot just outside the frame.

**What does NOT earn a dot** (a shot that never reached the goal mouth):
- **Blocked** — a *defender* (not the keeper) stopped it out in the field; it never reached
  the goal, so it has no goalmouth position and cannot honestly sit on this view.
- **Wild / wayward** — sailed well over or wide; outside the frame's neighborhood.

These are not discarded — they are surfaced as a **count** beside the view
(e.g. "12 blocked · 9 off-target"), so the information is present without polluting the picture.

**Interaction:** hovering (or tapping) a dot reveals the shooter — at minimum player name;
ideally also minute and match. The dot is the atom; the hover is the payoff.

### 4.1 In-view cutoff (default — tunable in build)
A shot earns a dot if its end position is **on the frame or a near-miss**. The precise near-miss
boundary (how far outside the posts/bar still counts) is a **default we set and then tune against
real rendered data** in the build — it does not block the spec. Start tight (on-target + clear
near-misses), widen only if the picture feels too sparse.

### 4.2 Outcome encoding (default — tunable in build)
- **Goal → green.** This one is fixed.
- **Saved** and **off-target/near-miss** get distinct, legible treatments (color and/or shape)
  chosen once we see real shots rendered. Do not finalize the palette from imagination.
- Optional: **xG as dot size** (bigger = higher-quality chance). Subtle, never labeled with the
  term "xG" in the primary UI. Treat as a nice-to-have, not a blocker.

## 5. Content catalog (v1)

Exactly the five tournaments confirmed present in StatsBomb's free open data with full shot data.
**No other tournaments in v1**, and explicitly **no live 2026** (see §8).

1. **2018 Men's World Cup**
2. **2022 Men's World Cup**
3. **2023 Women's World Cup** — richest dataset; includes StatsBomb 360 freeze-frames
4. **UEFA Euro 2020**
5. **UEFA Euro 2024**

> The exact set is **research-confirmed** as of June 2026. If a tournament turns out to be
> missing or incomplete when the pipeline runs (ticket 2), drop it and flag to PM — do not
> substitute a different one without sign-off. Tournaments before 2018 (2010/2014 WC, Euro
> 2012/2016) are **not** in the free set and are out of scope.

## 6. Information architecture / navigation

```
[Tournament]  ->  [Team]  ->  goal-frame for the WHOLE tournament
                    |
                    +--> [Match]    (drill into one game's shots)
                    +--> [Player]   (shots by one player, within the selected team)
```

- **Tournament picker** (top level): choose one of the five.
- **Team picker:** choose a team within that tournament. This is the default landing state —
  goal-frame shows **all of that team's shots across the whole tournament**.
- **Match drill-down:** narrow the goal-frame to a single match.
- **Player view:** within a selected team, pick a player to see only their shots.
  Player is a lens *inside* a team in v1 (you pick team first, then player).

## 7. Acceptance criteria (MVP)

The MVP is "done" when all of the following are true:

- [ ] User can select any of the five tournaments.
- [ ] User can select any team in that tournament and see a goal-frame of **all** that team's
      qualifying shots for the whole tournament.
- [ ] Goals render green, inside the frame, at their end position.
- [ ] Saved shots and near-misses render on/just-outside the frame with distinct treatments.
- [ ] Blocked and wild shots are **not** plotted, but their counts are shown beside the view.
- [ ] Hovering/tapping any dot reveals at least the shooter's name.
- [ ] User can drill from team -> a single match and the goal-frame updates accordingly.
- [ ] User can select a player within a team and see only that player's shots.
- [ ] The view is legible on desktop and usable on mobile (responsive; polish can follow).
- [ ] A visible **"Data: StatsBomb"** attribution line is present (see §10).
- [ ] The site is a fully static deploy on Vercel with no backend and no database.

## 8. Out of scope (v1) — say no on purpose

- **The live 2026 tournament tab.** Different data, different fidelity, different scope —
  it gets its **own spec** later. Research confirmed free 2026 data is goals/scores only
  (no shot placement), so it can never be a goal-frame; do not stub it into this codebase.
- **Top-down "where they shot from" pitch map.** A different camera. Not in v1.
- **Cross-team / cross-tournament player comparison** (the Bellingham-vs-Schweinsteiger idea).
  Parked — but the data model must not preclude it (see §9).
- **Any tournament not in the five-tournament catalog.**
- **Accounts, saving, sharing links, server-side anything.**

## 9. Parked features (design the seams now, build later)

These are **not** built in v1, but the architecture must not make them expensive later:

1. **Live 2026 tab** — isolated behind a tab boundary; the hero must not depend on it.
2. **"Players of the tournament"** — auto-select a tournament's top finishers as a starting view.
3. **Cross-era player comparison** — overlay one player's finishing signature against another's,
   across teams and tournaments (bounded to tournaments in our catalog).

**Required seam for #3:** the data model is **player-centric**. Every shot is tagged to a player
as a first-class entity with a **stable identity that is consistent across tournaments**
(use StatsBomb's stable player id as canonical). With that in place, comparison is later just a
query, not a rebuild. See `CLAUDE.md` "Data model".

## 10. Data & attribution

- **Source:** StatsBomb free open data (`statsbomb/open-data`), static JSON.
- **Attribution is non-negotiable.** StatsBomb's free terms require visible credit. A persistent,
  legible **"Data: StatsBomb"** line must appear in the UI (e.g. footer). This is an acceptance
  criterion, not a nicety.
- **Non-commercial.** This is a portfolio piece; do not present it as a commercial product.
- **The app never fetches StatsBomb at runtime.** Data is pulled and transformed at **build time**
  into a slim, app-ready JSON contract that is committed to the repo. See `CLAUDE.md` for the
  pipeline and the exact data contract.

## 11. The data contract (what the app consumes)

This shape is **ours to define** (engineering owns the mapping *from* StatsBomb *to* this). The
goal-frame depends on each shot's **goalmouth end-position**, which StatsBomb's shot data carries
(end location including height). Exact field names are confirmed against real data in ticket 2.

A normalized **goalmouth coordinate** is defined in our own space so the renderer never touches
raw pitch units:
- `gx`: horizontal position where `0` = left post, `1` = right post; `<0` / `>1` = wide of the post.
- `gz`: height where `0` = ground, `1` = crossbar; `>1` = over the bar.
- `reached_goalmouth: false` (blocked/wild) -> `goalmouth` is `null` and the shot is counted, not plotted.

Conceptual per-shot record (illustrative; finalize names in build):

```json
{
  "id": "shot_uuid",
  "player_id": "sb_player_id",
  "player_name": "...",
  "team_id": "sb_team_id",
  "team_name": "...",
  "match_id": "sb_match_id",
  "minute": 67,
  "outcome": "goal | saved | near_miss | blocked | wayward",
  "reached_goalmouth": true,
  "goalmouth": { "gx": 0.92, "gz": 0.71 },
  "xg": 0.34
}
```

`player_id` is stable across tournaments and is the canonical identity that makes the parked
comparison feature a query later. Per-tournament files (teams, players, matches, shots) keep
payloads small so only the selected tournament loads. Engineering decides exact file layout;
the contract above is the seam.

## 12. Phasing

The full MVP (sections 4-7) is the target. The path:

- **Sprint 1 — the tracer bullet.** One tournament, goal-frame hero, team filter, deployed to a
  Vercel staging URL end-to-end. Proves data -> render -> deploy through every layer on real data.
  This is the **floor**: a real, demoable thing that exists regardless of what comes after.
- **Sprint 2 — fill the catalog + drill-downs.** All five tournaments; match drill-down; player
  view; the blocked/wild counts; responsive pass.
- **Sprint 3 — polish.** Palette tuning against real data, accessibility, mobile refinement,
  point `worldcup.shawna.dev` at it.

Sprint 1 ticket breakdown lives in `CLAUDE.md` so engineering builds against it directly.
