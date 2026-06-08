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

Top-level list of all tournaments. Shape:

```json
[
  {
    "id": "wwc-2023",
    "name": "Women's World Cup",
    "season": "2023",
    "competition_id": 72,
    "season_id": 107
  }
]
```

### `src/data/{tournament-id}/meta.json`

Teams and matches for one tournament.

```json
{
  "competition_id": 72,
  "season_id": 107,
  "name": "Women's World Cup",
  "season": "2023",
  "teams": [
    { "team_id": 2391, "team_name": "Morocco Women's" }
  ],
  "matches": [
    {
      "match_id": 3893834,
      "match_date": "2023-08-03",
      "home_team_id": 2391,
      "home_team_name": "Morocco Women's",
      "away_team_id": 16802,
      "away_team_name": "Colombia Women's",
      "home_score": 1,
      "away_score": 0
    }
  ]
}
```

### `src/data/{tournament-id}/shots.json`

All shots for the tournament. One record per shot:

```json
{
  "id": "uuid",
  "player_id": 31629,
  "player_name": "Anissa Lahmari",
  "team_id": 2391,
  "team_name": "Morocco Women's",
  "match_id": 3893834,
  "minute": 48,
  "outcome": "goal",
  "reached_goal_line": true,
  "lineX": 0.525,
  "height": 0.451,
  "xg": 0.706
}
```

#### Field notes

**`player_id`** — StatsBomb's stable player id. Consistent across tournaments; this is
the canonical identity that enables cross-tournament player comparison (parked feature).

**`outcome`** — Normalized from StatsBomb's vocabulary:

| Normalized | StatsBomb source outcomes | Plotted? |
|---|---|---|
| `goal` | `Goal` | Yes |
| `saved` | `Saved`, `Saved Off Target`, `Saved to Post` | Yes |
| `missed` | `Post`, `Off T`, `Wayward` | Yes — positioned by how wide |
| `blocked` | `Blocked` | No — count shown beside view |

**`reached_goal_line`** — `false` only for `blocked` shots. `lineX` and `height` are
`null` when false.

**`lineX`** — Horizontal position along the goal line. `0` = left corner flag, `1` = right
corner flag. The goal posts sit at approximately `0.45` (left) and `0.55` (right).

Derived as `lineX = y / 80` from StatsBomb's `shot.end_location [x, y, z]`, where `y`
is the cross-pitch coordinate on StatsBomb's 120×80-yard pitch.

**`height`** — `0` = ground, `1` = crossbar, `>1` = over the bar. `null` if the shot had
no z coordinate (some `missed` shots) or was blocked.

Derived as `height = z / 2.44` (crossbar = 2.44m in StatsBomb's coordinate system).
Not the organizing axis in the v1 wide view — retained for the parked zoom-to-goal view.

## Attribution

Data: [StatsBomb](https://statsbomb.com/what-we-do/hub/free-data/) open data.
Used under StatsBomb's free data terms (non-commercial).
