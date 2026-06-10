# World Cup Shot Explorer

An interactive viz that lets a fan look at the goal and see, for any team in a finalized
tournament, where every shot ended up. Built with Vite + React + TypeScript on StatsBomb
free open data.

## Running locally

```bash
npm install
npm run dev          # local dev server at http://localhost:5173
npm run build        # produce static dist/
```

## Regenerating data

```bash
npm run build-data   # pulls from StatsBomb open-data repo, writes to src/data/
```

The script requires network access to `raw.githubusercontent.com`. Output is committed to
the repo so the app build is fully offline.

## Data schema

### `src/data/index.json`

Top-level list of all tournaments:

```json
[{ "id": "wwc-2023", "name": "Women's World Cup", "season": "2023", "competition_id": 72, "season_id": 107 }]
```

### `src/data/{tournament-id}/countries.json`

`{ team_id → country_name }` map for flag rendering. Built from match metadata.

### `src/data/{tournament-id}/meta.json`

Teams and matches for one tournament. Each match:

```json
{
  "match_id": 3902968,
  "date": "2023-08-12",
  "home_team_id": 1205, "home_team_name": "Australia Women's",
  "away_team_id": 861,  "away_team_name": "France Women's",
  "home_score": 0, "away_score": 0,
  "stage": "Quarter-finals", "stage_label": "Quarter-finals",
  "result_type": "penalties",
  "shootout": {
    "home_kicks": [{ "player": "Caitlin Foord", "scored": true }, "..."],
    "away_kicks": [{ "player": "Selma Bacha",   "scored": false }, "..."],
    "home_pens": 7, "away_pens": 6,
    "winner": "Australia Women's"
  }
}
```

**`result_type`** — `normal` | `extra_time` | `penalties`. Derived from StatsBomb event
periods (period 3/4 = extra time; period 5 = penalty shootout).

**`shootout`** — present only when `result_type === 'penalties'`. Kicks are in chronological
order within each team's row. `scored: true` = goal; `scored: false` = missed or saved.

### `src/data/{tournament-id}/shots.json`

All shots for the tournament. **Shootout kicks are excluded** (period 5); in-game penalties
are included with `is_penalty: true`. One record per shot:

```json
{
  "id": "uuid",
  "player_id": 402661,
  "player_name": "Ibtissam Jraïdi",
  "team_id": 2391,
  "team_name": "Morocco Women's",
  "team_country": "Morocco",
  "match_id": 3893834,
  "minute": 0,
  "outcome": "saved",
  "reached_goal_line": true,
  "lineX": 0.445,
  "height": 0.533,
  "xg": 0.0116,
  "is_penalty": false,
  "shot_type": "Open Play",
  "body_part": "Right Foot",
  "play_pattern": "Regular Play",
  "first_time": false,
  "under_pressure": false,
  "assisted_by": "Ghizlane Chebbak"
}
```

#### Field notes

**`player_id`** — StatsBomb's stable player id, consistent across tournaments. The canonical
identity that enables the parked cross-tournament player comparison feature.

**`outcome`** — Normalized from StatsBomb's vocabulary:

| Normalized | StatsBomb source outcomes | Plotted? |
|---|---|---|
| `goal` | `Goal` | Yes — center band |
| `saved` | `Saved`, `Saved Off Target`, `Saved to Post` | Yes — center band |
| `missed` | `Post`, `Off T`, `Wayward` | Yes — by how wide |
| `blocked` | `Blocked` | No — count shown beside view |

**`reached_goal_line`** — `false` only for `blocked`. `lineX` and `height` are `null` when false.

**`lineX`** — `0` = left corner flag, `1` = right corner flag. Posts at ~0.45 (left) and ~0.55 (right).
Derived: `lineX = y / 80` from `shot.end_location[1]` on StatsBomb's 120×80-yard pitch.

**`height`** — `0` = ground, `1` = crossbar, `>1` = over the bar. `null` when no z data or blocked.
Derived: `height = z / 2.44`. Not the primary v1 axis — retained for the parked zoom-to-goal view.

**`is_penalty`** — `true` for in-game penalties (`shot.type.name === 'Penalty'`). These are kept
in the shot set and flagged in the UI. Shootout kicks are excluded entirely.

**`shot_type`** — StatsBomb `shot.type.name`: `Open Play`, `Penalty`, `Free Kick`, etc.

**`body_part`** — `Right Foot`, `Left Foot`, `Head`, etc.

**`play_pattern`** — `Regular Play`, `From Corner`, `From Free Kick`, etc.

**`first_time`** — `true` if shot was struck first-time. Omitted in source when false.

**`under_pressure`** — `true` if shooter was under pressure from a defender. Omitted in source when false.

**`assisted_by`** — name of the player who played the key pass, or `null` if unassisted.
Resolved by looking up `shot.key_pass_id` in the match event list.

## Attribution

Data: [StatsBomb](https://statsbomb.com/what-we-do/hub/free-data/) open data.
Used under StatsBomb's free data terms (non-commercial).
