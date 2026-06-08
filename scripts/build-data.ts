import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// ── StatsBomb constants ────────────────────────────────────────────────────
const SB_BASE = 'https://raw.githubusercontent.com/statsbomb/open-data/master/data'
const COMPETITION_ID = 72   // Women's World Cup
const SEASON_ID = 107       // 2023

// Goal frame in StatsBomb pitch coords (120×80 yards)
// Posts: y=36 (left), y=44 (right). Crossbar: z=2.44m.
const POST_LEFT = 36
const POST_RIGHT = 44
const CROSSBAR_H = 2.44

// Near-miss threshold: how far outside the frame still earns a dot.
// Tunable — start tight and widen if the picture looks sparse.
// gx: left post = 0, right post = 1; gz: ground = 0, crossbar = 1.
const NEAR_MISS_GX_MIN = -0.1
const NEAR_MISS_GX_MAX = 1.1
const NEAR_MISS_GZ_MIN = 0
const NEAR_MISS_GZ_MAX = 1.1

// ── Types ──────────────────────────────────────────────────────────────────
type NormalizedOutcome = 'goal' | 'saved' | 'near_miss' | 'blocked' | 'wayward'

interface Shot {
  id: string
  player_id: number
  player_name: string
  team_id: number
  team_name: string
  match_id: number
  minute: number
  outcome: NormalizedOutcome
  reached_goalmouth: boolean
  goalmouth: { gx: number; gz: number } | null
  xg: number
}

interface Team {
  team_id: number
  team_name: string
}

interface Match {
  match_id: number
  match_date: string
  home_team_id: number
  home_team_name: string
  away_team_id: number
  away_team_name: string
  home_score: number
  away_score: number
}

interface TournamentMeta {
  competition_id: number
  season_id: number
  name: string
  season: string
  teams: Team[]
  matches: Match[]
}

// ── Helpers ────────────────────────────────────────────────────────────────
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  return res.json() as Promise<T>
}

function toGxGz(y: number, z: number): { gx: number; gz: number } {
  return {
    gx: Math.round(((y - POST_LEFT) / (POST_RIGHT - POST_LEFT)) * 1000) / 1000,
    gz: Math.round((z / CROSSBAR_H) * 1000) / 1000,
  }
}

function isNearMiss(gx: number, gz: number): boolean {
  return (
    gx >= NEAR_MISS_GX_MIN &&
    gx <= NEAR_MISS_GX_MAX &&
    gz >= NEAR_MISS_GZ_MIN &&
    gz <= NEAR_MISS_GZ_MAX
  )
}

// ── StatsBomb outcome → normalized outcome ─────────────────────────────────
// Vocabulary confirmed against real 2023 WWC data:
// Goal, Saved, Saved Off Target, Saved to Post, Post, Off T, Blocked, Wayward
function normalizeOutcome(
  sbOutcome: string,
  endLocation: number[]
): { outcome: NormalizedOutcome; reached_goalmouth: boolean; goalmouth: { gx: number; gz: number } | null } {
  const hasZ = endLocation.length === 3
  const y = endLocation[1]
  const z = hasZ ? endLocation[2] : null

  switch (sbOutcome) {
    case 'Goal': {
      const goalmouth = toGxGz(y, z!)
      return { outcome: 'goal', reached_goalmouth: true, goalmouth }
    }

    case 'Saved':
    case 'Saved Off Target':
    case 'Saved to Post': {
      const goalmouth = hasZ ? toGxGz(y, z!) : null
      return { outcome: 'saved', reached_goalmouth: true, goalmouth }
    }

    case 'Post': {
      // Hit the post or bar — always a near_miss with a valid position
      const goalmouth = toGxGz(y, z!)
      return { outcome: 'near_miss', reached_goalmouth: true, goalmouth }
    }

    case 'Off T': {
      // Shot reached the goal plane (x=120) but missed.
      // If it has a z coordinate, we can place it; determine near_miss vs wayward by position.
      if (hasZ) {
        const { gx, gz } = toGxGz(y, z!)
        if (isNearMiss(gx, gz)) {
          return { outcome: 'near_miss', reached_goalmouth: true, goalmouth: { gx, gz } }
        }
      }
      return { outcome: 'wayward', reached_goalmouth: false, goalmouth: null }
    }

    case 'Blocked':
      return { outcome: 'blocked', reached_goalmouth: false, goalmouth: null }

    case 'Wayward':
      return { outcome: 'wayward', reached_goalmouth: false, goalmouth: null }

    default:
      console.warn(`Unknown outcome: ${sbOutcome} — treating as wayward`)
      return { outcome: 'wayward', reached_goalmouth: false, goalmouth: null }
  }
}

// ── Main pipeline ──────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching match list...')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchList = await fetchJson<any[]>(`${SB_BASE}/matches/${COMPETITION_ID}/${SEASON_ID}.json`)
  console.log(`Found ${matchList.length} matches`)

  const teamsMap = new Map<number, string>()
  const matches: Match[] = []

  for (const m of matchList) {
    teamsMap.set(m.home_team.home_team_id, m.home_team.home_team_name)
    teamsMap.set(m.away_team.away_team_id, m.away_team.away_team_name)
    matches.push({
      match_id: m.match_id,
      match_date: m.match_date,
      home_team_id: m.home_team.home_team_id,
      home_team_name: m.home_team.home_team_name,
      away_team_id: m.away_team.away_team_id,
      away_team_name: m.away_team.away_team_name,
      home_score: m.home_score,
      away_score: m.away_score,
    })
  }

  const teams: Team[] = [...teamsMap.entries()]
    .map(([team_id, team_name]) => ({ team_id, team_name }))
    .sort((a, b) => a.team_name.localeCompare(b.team_name))

  console.log(`Found ${teams.length} teams`)

  // Fetch events for every match and extract shots
  const shots: Shot[] = []
  let processed = 0

  for (const match of matches) {
    process.stdout.write(`Processing match ${++processed}/${matches.length} (${match.match_id})...\r`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = await fetchJson<any[]>(`${SB_BASE}/events/${match.match_id}.json`)
    const shotEvents = events.filter((e) => e.type.name === 'Shot')

    for (const e of shotEvents) {
      const s = e.shot
      const { outcome, reached_goalmouth, goalmouth } = normalizeOutcome(s.outcome.name, s.end_location)

      shots.push({
        id: e.id,
        player_id: e.player.id,
        player_name: e.player.name,
        team_id: e.team.id,
        team_name: e.team.name,
        match_id: match.match_id,
        minute: e.minute,
        outcome,
        reached_goalmouth,
        goalmouth,
        xg: s.statsbomb_xg,
      })
    }
  }

  console.log(`\nExtracted ${shots.length} total shots`)

  // Outcome breakdown for PM review
  const breakdown: Record<string, number> = {}
  for (const s of shots) {
    breakdown[s.outcome] = (breakdown[s.outcome] ?? 0) + 1
  }
  console.log('Outcome breakdown:', breakdown)

  // ── Write output files ─────────────────────────────────────────────────
  const outDir = join(process.cwd(), 'src/data/wwc-2023')
  mkdirSync(outDir, { recursive: true })

  const meta: TournamentMeta = {
    competition_id: COMPETITION_ID,
    season_id: SEASON_ID,
    name: "Women's World Cup",
    season: '2023',
    teams,
    matches,
  }

  writeFileSync(join(outDir, 'meta.json'), JSON.stringify(meta, null, 2))
  console.log(`Wrote src/data/wwc-2023/meta.json (${teams.length} teams, ${matches.length} matches)`)

  writeFileSync(join(outDir, 'shots.json'), JSON.stringify(shots, null, 2))
  console.log(`Wrote src/data/wwc-2023/shots.json (${shots.length} shots)`)

  // Top-level index
  const index = [
    { id: 'wwc-2023', name: "Women's World Cup", season: '2023', competition_id: 72, season_id: 107 },
    { id: 'wc-2022', name: "Men's World Cup", season: '2022', competition_id: 43, season_id: 106 },
    { id: 'wc-2018', name: "Men's World Cup", season: '2018', competition_id: 43, season_id: 3 },
    { id: 'euro-2024', name: 'UEFA Euro', season: '2024', competition_id: 55, season_id: 282 },
    { id: 'euro-2020', name: 'UEFA Euro', season: '2020', competition_id: 55, season_id: 43 },
  ]
  writeFileSync(join(process.cwd(), 'src/data/index.json'), JSON.stringify(index, null, 2))
  console.log('Wrote src/data/index.json')

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
