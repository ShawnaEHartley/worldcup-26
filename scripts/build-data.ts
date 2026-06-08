import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// ── StatsBomb constants ────────────────────────────────────────────────────
const SB_BASE = 'https://raw.githubusercontent.com/statsbomb/open-data/master/data'
const COMPETITION_ID = 72   // Women's World Cup
const SEASON_ID = 107       // 2023

// StatsBomb pitch: 120×80 yards. Goal line is the 80-yard short end.
// Corner flags at y=0 (left) and y=80 (right).
// Crossbar at z=2.44m.
const PITCH_WIDTH = 80
const CROSSBAR_H = 2.44

// ── Types ──────────────────────────────────────────────────────────────────
type NormalizedOutcome = 'goal' | 'saved' | 'missed' | 'blocked'

interface Shot {
  id: string
  player_id: number
  player_name: string
  team_id: number
  team_name: string
  match_id: number
  minute: number
  outcome: NormalizedOutcome
  reached_goal_line: boolean
  lineX: number | null   // 0 = left corner flag, 1 = right corner flag; null if blocked
  height: number | null  // 0 = ground, 1 = crossbar, >1 = over bar; null if no z data or blocked
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

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

// ── StatsBomb outcome → normalized outcome ─────────────────────────────────
// Vocabulary confirmed against real 2023 WWC data:
//   Goal, Saved, Saved Off Target, Saved to Post, Post, Off T, Blocked, Wayward
//
// New model: plot everything that reached the goal line (goal/saved/missed);
// count blocked shots only (defender stopped it before the goal line).
function normalizeShot(
  sbOutcome: string,
  endLocation: number[]
): Pick<Shot, 'outcome' | 'reached_goal_line' | 'lineX' | 'height'> {
  const y = endLocation[1]
  const z = endLocation.length >= 3 ? endLocation[2] : null

  const lineX = round3(y / PITCH_WIDTH)
  const height = z !== null ? round3(z / CROSSBAR_H) : null

  switch (sbOutcome) {
    case 'Goal':
      return { outcome: 'goal', reached_goal_line: true, lineX, height }

    case 'Saved':
    case 'Saved Off Target':
    case 'Saved to Post':
      return { outcome: 'saved', reached_goal_line: true, lineX, height }

    case 'Post':
    case 'Off T':
    case 'Wayward':
      return { outcome: 'missed', reached_goal_line: true, lineX, height }

    case 'Blocked':
      return { outcome: 'blocked', reached_goal_line: false, lineX: null, height: null }

    default:
      console.warn(`Unknown outcome "${sbOutcome}" — treating as missed`)
      return { outcome: 'missed', reached_goal_line: true, lineX, height }
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

    for (const e of events.filter((e) => e.type.name === 'Shot')) {
      const s = e.shot
      const { outcome, reached_goal_line, lineX, height } = normalizeShot(s.outcome.name, s.end_location)

      shots.push({
        id: e.id,
        player_id: e.player.id,
        player_name: e.player.name,
        team_id: e.team.id,
        team_name: e.team.name,
        match_id: match.match_id,
        minute: e.minute,
        outcome,
        reached_goal_line,
        lineX,
        height,
        xg: s.statsbomb_xg,
      })
    }
  }

  console.log(`\nExtracted ${shots.length} total shots`)

  const breakdown: Record<string, number> = {}
  for (const s of shots) breakdown[s.outcome] = (breakdown[s.outcome] ?? 0) + 1
  console.log('Outcome breakdown:', breakdown)

  // ── Write output files ─────────────────────────────────────────────────
  const outDir = join(process.cwd(), 'src/data/wwc-2023')
  mkdirSync(outDir, { recursive: true })

  writeFileSync(
    join(outDir, 'meta.json'),
    JSON.stringify(
      { competition_id: COMPETITION_ID, season_id: SEASON_ID, name: "Women's World Cup", season: '2023', teams, matches } satisfies TournamentMeta,
      null, 2
    )
  )
  console.log(`Wrote src/data/wwc-2023/meta.json (${teams.length} teams, ${matches.length} matches)`)

  writeFileSync(join(outDir, 'shots.json'), JSON.stringify(shots, null, 2))
  console.log(`Wrote src/data/wwc-2023/shots.json (${shots.length} shots)`)

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
