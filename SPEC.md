# SPEC.md — Goal-Line Shot Explorer

> Product requirements for `worldcup-2026`. Source of truth for **what** we're building and **why**.
> `CLAUDE.md` covers **how**. Product/scope decisions come back to the PM, not the engineer.

> **REVISION — consolidated + final.** Folds in the full discovery/mockup sessions: corner-to-corner
> canvas, summary stats bar, synced/composable filters, rich shot-detail card with flags,
> tap-to-select (no hover), shot-as-doorway navigation, match cards, penalty handling, and the
> **match-view result header + in-match shootout strip**. Replace any older copy.

---

## 1. One-liner
An interactive viz that puts a fan in the shooter's shoes — looking at the **whole goal line, corner
to corner** — and plots where every shot ended up. A team's **finishing signature** reads in seconds,
and any shot can be clicked to learn more and jump to that player or match.

## 2. Who it's for
The **fan** — casual to curious. No analytics vocabulary required (xG appears only in plain language).
Audience is hiring managers; we serve them by serving the fan well — tight, polished, reliable.

## 3. The core thing (10-second takeaway)
A team's **finishing signature** as an accuracy story: shots tight around the goal read "clinical";
sprayed toward the corners reads "wild." Instant, no-jargon.

## 4. Look & feel
Friendly, characterful, clean — **not** clinical-grey like FBref/Understat, **not** childish. "Polished
and warm," like a well-made app: rounded, soft, a little playful, always legible. Cute *and* tight.

## 5. The hero view — the goal line, corner to corner
The only spatial view in v1. (A zoomed goal-only "placement" view is parked — §14.)

**Camera:** the shooter's perspective on the entire short end of the pitch — goal centered, corner
flags at the edges. **Placement:** each shot is a dot by **where it crossed the goal line, left-to-right**
(`lineX`) — the accuracy axis.

### 5.1 Plotted vs counted
| Outcome | Ended by | In the view |
|---------|----------|-------------|
| Goal    | went in  | **plotted** (net, center) |
| Saved   | the keeper | **plotted** (at goal, center) |
| Missed  | nobody — wide/over | **plotted** (by how wide, toward corners) |
| Blocked | a defender, in the field | **counted** beside the view (no goal-line position) |

### 5.2 Penalties & shootouts
- **In-game penalties** (awarded during play): **kept** in the view, with a **"Penalty" flag** (§9).
- **Shootout kicks** (the post-120' tiebreaker): **not** plotted on the goal-line map and **not** in
  the summary totals at tournament/team level — they're all identical central high-xG kicks and would
  distort a finishing signature. **Important:** this excludes only the shootout *kicks themselves* —
  the full 90/120-minute match is always included. Shootouts are instead surfaced in **match view**
  (§10), where they're relevant. Nothing is erased.

### 5.3 Outcome encoding (defaults — tunable against real data in build)
Goal → **green** (fixed). Saved and missed get distinct legible treatments, chosen once shots render.

### 5.4 Deliberately deferred to "tune against real rendered data" (build-time)
- Saved/missed **palette**.
- Whether the wide view renders **height** at all + compression (over-bar shots reach ~2× crossbar;
  §15). First render: **horizontal-only**.
- Exact **horizontal extent** — true corner-to-corner makes the goal ~10% of width with central
  clustering; a tighter frame may read better. Validate against real spread.
- Near-miss "feel."

## 6. Summary stats bar (top of the view)
For the current selection: **Shots taken** · **On goal** (`outcome in (goal, saved)` only — a *missed*
shot crossed the line but is NOT on goal; don't use `reached_goal_line`) · **Goals** · **Matches**
(distinct matches). Totals reflect the **same exclusions as the plot** (shootout kicks out).

## 7. Filters & navigation — one shared, composable state
Single filter state driven by two interchangeable controls: the filter bar and graphic clicks.
**Bar:** `[Tournament] → [Team] → [Player] [Match]`. Tournament + Team are the required cascade;
**Player and Match are optional, composable narrowers** (usable together = "that player in that match"),
each clearable (✕). **Two-way sync:** clicking a shot's player sets Player; clicking its match sets
Match; changing a dropdown redraws. Same state, two doors.

## 8. Selecting a shot — tap to a detail card (no hover)
**Tap/click, not hover** (works on touch; nothing floats over the graphic). **Single-select** (each tap
replaces). Selected dot highlights; details appear in a **card below the graphic**:
- **Outcome** banner (color-coded).
- **Player** + country flag; **opponent** + country flag.
- **Minute**, **stage**, **match result**.
- **Chance quality** — xG in **plain language** ("0.34 xG — about a 1-in-3 chance"). Never lead with
  the bare term.
- **Set up by** — assisting player, if any.
- **"How it happened" flags/badges** — body part, situation (open play / from corner / free kick),
  and contextual flags (Penalty, First-time, Under pressure).
- **Two doorways:** "See all of [player]'s shots" → sets Player; "Open the [opponent] match" → sets
  Match. (Reuses existing navigation via shared state.)

Keep the card crisp — "everything useful," trim if heavy.

## 9. Match cards (the matches in the current view)
Below the card, the matches in the current selection appear as cards with **opponent, stage, result**
in fan phrasing ("vs Germany · Group Stage · Match 2 · W 2–1"). Tapping drills into that match.

## 10. Match view — result header + shootout strip
When the selection is narrowed to a **single match**:
- **Result header** reads like a quick search result: score and winner, with knockout nuance —
  normal time ("England 2–1 Colombia · Quarter-final"), after extra time ("… a.e.t."), or on penalties
  ("Sweden 0–0 USA · Sweden win 5–4 on penalties · Round of 16").
- **Shootout strip** (only if the match went to penalties): a small display **below the graphic**,
  **grouped by team** (two rows, one per team) — broadcast style. Each row shows the team's kicks **in
  order**, aligned column-wise, **green = scored, red = missed/saved**, with the pen tally and the
  winner. This is where shootout kicks live (they're excluded from the goal-line map per §5.2).

## 11. Content catalog (v1)
Five tournaments confirmed in StatsBomb free data: 2018 Men's WC, 2022 Men's WC, 2023 Women's WC
(richest), Euro 2020, Euro 2024. No others; no live 2026. If one is missing/incomplete at pipeline
time, drop it and flag to PM.

## 12. Data & attribution
StatsBomb free open data (static JSON). **Visible "Data: StatsBomb"** credit (non-negotiable).
Non-commercial. **No runtime fetching** — build-time transform into committed JSON (§15).

## 13. Out of scope (v1)
Live 2026 tab (own spec); zoomed goal-only/placement view (parked); cross-era player comparison
(parked); tournaments outside the five; accounts/saved-state/server-side anything.

## 14. Parked features (don't preclude them now)
1. **Zoom-to-goal (placement) view** — toggle into a goal-only frame where **height** is the primary
   axis. Needs `height` retained (§15). Home for the over-the-bar story.
2. **Live 2026 tab** — isolated behind a tab boundary.
3. **"Players of the tournament"** — auto-select top finishers.
4. **Cross-era player comparison** — enabled by player-centric model + stable `player_id`.

## 15. The data contract
Ours to define; engineering maps from StatsBomb (confirm fields against real data). Normalized coords
keep raw pitch units out of the renderer.
- `lineX`: 0 = left corner, 1 = right corner (posts ~0.45–0.55). `height`: 0 = ground, 1 = crossbar,
  >1 = over (retained for parked zoom; not v1 axis). `reached_goal_line`: false for blocked → counted.

**Per-shot record (illustrative):**
```json
{
  "id": "shot_uuid", "player_id": 402661, "player_name": "Linda Caicedo",
  "team_id": 16802, "team_name": "Colombia Women's", "team_country": "Colombia",
  "match_id": 3893834, "minute": 39,
  "outcome": "goal | saved | missed | blocked",
  "reached_goal_line": true, "lineX": 0.51, "height": 0.78, "xg": 0.34,
  "is_penalty": false,
  "shot_type": "Open Play | Penalty | Free Kick",
  "body_part": "Right Foot | Left Foot | Head | Other",
  "play_pattern": "Regular Play | From Corner | From Free Kick | ...",
  "first_time": true, "under_pressure": true,
  "assisted_by": "Mayra Ramírez"
}
```
Shootout kicks are **excluded from the shot set** (filter on StatsBomb period) — they live in match
meta instead. `player_id` is the stable cross-tournament identity.

**Per-match meta (stats bar, match cards, match-view header, shootout strip, flags):**
```json
{
  "match_id": 3901797,
  "home_team": "Sweden Women's", "away_team": "United States Women's",
  "home_score": 0, "away_score": 0,
  "result_type": "normal | extra_time | penalties",
  "stage": "Round of 16", "stage_label": "Round of 16", "date": "2023-08-06",
  "shootout": {
    "home_kicks": [{ "player": "Fridolina Rolfö", "scored": true }, "..."],
    "away_kicks": [{ "player": "Megan Rapinoe", "scored": false }, "..."],
    "home_pens": 5, "away_pens": 4, "winner": "Sweden Women's"
  }
}
```
`shootout` present only when `result_type == penalties`. `stage` from `competition_stage.name`. A
`team → country` map drives flags.

## 16. Acceptance criteria (MVP)
- [ ] Select any of five tournaments; select any team.
- [ ] Corner-to-corner view of all that team's plottable shots; goals green/center; saved/missed
      distinct; blocked as a count; in-game penalties flagged.
- [ ] Shootout kicks excluded from the map and tournament/team totals.
- [ ] Summary stats bar (shots / on-goal=goals+saves / goals / matches), consistent with the dots.
- [ ] Filter bar shares one state with graphic clicks, both ways; Player & Match composable/clearable.
- [ ] Tap a dot → highlight + detail card below (no hover); single-select; card has outcome,
      player+flag, opponent+flag, minute, stage, plain-language xG, assist, situation flags, two doorways.
- [ ] Match cards list matches in view (opponent/stage/result); tapping drills in.
- [ ] Match view shows a result header (normal / a.e.t. / penalties, with winner); when applicable, a
      shootout strip grouped by team (green/red, in order, winner).
- [ ] Visible "Data: StatsBomb" attribution. Fully static on Vercel; no backend/DB.

## 17. Phasing
- **Sprint 1 — tracer bullet:** scaffold+deploy, data pipeline, goal-line canvas + plotted shots +
  basic team filter, one tournament, deployed.
- **Sprint 2 — full interface + catalog:** five tournaments; synced composable filters; stats bar;
  tap-to-select rich shot card + doorways; match cards; **match view (result header + shootout strip)**.
- **Sprint 3 — polish:** palette/height/extent tuning, accessibility, mobile, custom domain.

Ticket breakdown in `CLAUDE.md`.
