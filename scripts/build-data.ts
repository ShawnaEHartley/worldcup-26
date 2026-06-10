import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// ── StatsBomb constants ────────────────────────────────────────────────────
const SB_BASE = 'https://raw.githubusercontent.com/statsbomb/open-data/master/data'
const COMPETITION_ID = 72   // Women's World Cup
const SEASON_ID = 107       // 2023

// StatsBomb pitch: 120×80 yards. Goal line is the 80-yard short end.
const PITCH_WIDTH = 80
const CROSSBAR_H = 2.44

// ── Types ──────────────────────────────────────────────────────────────────
type NormalizedOutcome = 'goal' | 'saved' | 'missed' | 'blocked'
type ResultType = 'normal' | 'extra_time' | 'penalties'

interface Shot {
  id: string
  player_id: number
  player_name: string
  team_id: number
  team_name: string
  team_country: string
  match_id: number
  minute: number
  outcome: NormalizedOutcome
  reached_goal_line: boolean
  lineX: number | null
  height: number | null
  xg: number
  is_penalty: boolean
  shot_type: string
  body_part: string
  play_pattern: string
  first_time: boolean
  under_pressure: boolean
  assisted_by: string | null
}

interface ShootoutKick {
  player: string
  scored: boolean
}

interface ShootoutBlock {
  home_kicks: ShootoutKick[]
  away_kicks: ShootoutKick[]
  home_pens: number
  away_pens: number
  winner: string
}

interface Match {
  match_id: number
  date: string
  home_team_id: number
  home_team_name: string
  away_team_id: number
  away_team_name: string
  home_score: number
  away_score: number
  stage: string
  stage_label: string
  result_type: ResultType
  shootout: ShootoutBlock | null
}

interface Team {
  team_id: number
  team_name: string
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

// ── Outcome mapping ────────────────────────────────────────────────────────
// Confirmed vocabulary: Goal, Saved, Saved Off Target, Saved to Post,
// Post, Off T, Blocked, Wayward
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

// ── Result type from max event period ─────────────────────────────────────
// Period 5 = penalty shootout; 3/4 = extra time; 1/2 = normal
function resultType(maxPeriod: number): ResultType {
  if (maxPeriod >= 5) return 'penalties'
  if (maxPeriod >= 3) return 'extra_time'
  return 'normal'
}

// ── Build shootout block ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildShootout(kicks: any[], homeTeamId: number, awayTeamId: number, homeTeamName: string, awayTeamName: string): ShootoutBlock {
  const homeKicks: ShootoutKick[] = []
  const awayKicks: ShootoutKick[] = []

  for (const k of kicks) {
    const scored = k.shot.outcome.name === 'Goal'
    const kick: ShootoutKick = { player: k.player.name, scored }
    if (k.team.id === homeTeamId) homeKicks.push(kick)
    else if (k.team.id === awayTeamId) awayKicks.push(kick)
  }

  const homePens = homeKicks.filter(k => k.scored).length
  const awayPens = awayKicks.filter(k => k.scored).length
  const winner = homePens > awayPens ? homeTeamName : awayTeamName

  return { home_kicks: homeKicks, away_kicks: awayKicks, home_pens: homePens, away_pens: awayPens, winner }
}

// ── Main pipeline ──────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching match list...')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchList = await fetchJson<any[]>(`${SB_BASE}/matches/${COMPETITION_ID}/${SEASON_ID}.json`)
  console.log(`Found ${matchList.length} matches`)

  // Build team→country map from match list
  const countryMap = new Map<number, string>()
  const teamsMap = new Map<number, string>()

  for (const m of matchList) {
    teamsMap.set(m.home_team.home_team_id, m.home_team.home_team_name)
    teamsMap.set(m.away_team.away_team_id, m.away_team.away_team_name)
    countryMap.set(m.home_team.home_team_id, m.home_team.country?.name ?? m.home_team.home_team_name)
    countryMap.set(m.away_team.away_team_id, m.away_team.country?.name ?? m.away_team.away_team_name)
  }

  const teams: Team[] = [...teamsMap.entries()]
    .map(([team_id, team_name]) => ({ team_id, team_name }))
    .sort((a, b) => a.team_name.localeCompare(b.team_name))

  console.log(`Found ${teams.length} teams`)

  // Process every match
  const shots: Shot[] = []
  const matches: Match[] = []
  let processed = 0

  for (const m of matchList) {
    process.stdout.write(`Processing match ${++processed}/${matchList.length} (${m.match_id})...\r`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = await fetchJson<any[]>(`${SB_BASE}/events/${m.match_id}.json`)

    // Build a fast id→event lookup for key pass resolution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventById = new Map<string, any>(events.map(e => [e.id, e]))

    const maxPeriod = Math.max(...events.map(e => e.period))
    const rType = resultType(maxPeriod)

    // Separate shootout kicks (period 5) from regular shots
    const allShots = events.filter(e => e.type.name === 'Shot')
    const regularShots = allShots.filter(e => e.period !== 5)
    const shootoutKicks = allShots.filter(e => e.period === 5)

    // Build shots (exclude shootout kicks)
    for (const e of regularShots) {
      const s = e.shot
      const { outcome, reached_goal_line, lineX, height } = normalizeShot(s.outcome.name, s.end_location)

      const keyPassEvent = s.key_pass_id ? eventById.get(s.key_pass_id) : null
      const assisted_by = keyPassEvent?.player?.name ?? null

      shots.push({
        id: e.id,
        player_id: e.player.id,
        player_name: e.player.name,
        team_id: e.team.id,
        team_name: e.team.name,
        team_country: countryMap.get(e.team.id) ?? '',
        match_id: m.match_id,
        minute: e.minute,
        outcome,
        reached_goal_line,
        lineX,
        height,
        xg: s.statsbomb_xg,
        is_penalty: s.type.name === 'Penalty',
        shot_type: s.type.name,
        body_part: s.body_part?.name ?? 'Unknown',
        play_pattern: e.play_pattern?.name ?? 'Regular Play',
        first_time: s.first_time ?? false,
        under_pressure: e.under_pressure ?? false,
        assisted_by,
      })
    }

    // Build match meta
    const shootout = rType === 'penalties'
      ? buildShootout(shootoutKicks, m.home_team.home_team_id, m.away_team.away_team_id, m.home_team.home_team_name, m.away_team.away_team_name)
      : null

    matches.push({
      match_id: m.match_id,
      date: m.match_date,
      home_team_id: m.home_team.home_team_id,
      home_team_name: m.home_team.home_team_name,
      away_team_id: m.away_team.away_team_id,
      away_team_name: m.away_team.away_team_name,
      home_score: m.home_score,
      away_score: m.away_score,
      stage: m.competition_stage.name,
      stage_label: m.competition_stage.name,
      result_type: rType,
      shootout,
    })
  }

  console.log(`\nExtracted ${shots.length} shots (shootout kicks excluded)`)

  const breakdown: Record<string, number> = {}
  for (const s of shots) breakdown[s.outcome] = (breakdown[s.outcome] ?? 0) + 1
  console.log('Outcome breakdown:', breakdown)

  const penMatches = matches.filter(m => m.result_type === 'penalties')
  console.log(`Penalty shootout matches: ${penMatches.length} —`, penMatches.map(m => `${m.home_team_name} vs ${m.away_team_name}`))

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
  console.log(`Wrote meta.json (${teams.length} teams, ${matches.length} matches)`)

  writeFileSync(join(outDir, 'shots.json'), JSON.stringify(shots, null, 2))
  console.log(`Wrote shots.json (${shots.length} shots)`)

  // Country map: { team_id → country_name }
  const countries = Object.fromEntries(countryMap.entries())
  writeFileSync(join(outDir, 'countries.json'), JSON.stringify(countries, null, 2))
  console.log(`Wrote countries.json (${countryMap.size} entries)`)

  // Top-level tournament index (unchanged)
  const index = [
    { id: 'wwc-2023', name: "Women's World Cup", season: '2023', competition_id: 72, season_id: 107 },
    { id: 'wc-2022', name: "Men's World Cup", season: '2022', competition_id: 43, season_id: 106 },
    { id: 'wc-2018', name: "Men's World Cup", season: '2018', competition_id: 43, season_id: 3 },
    { id: 'euro-2024', name: 'UEFA Euro', season: '2024', competition_id: 55, season_id: 282 },
    { id: 'euro-2020', name: 'UEFA Euro', season: '2020', competition_id: 55, season_id: 43 },
  ]
  writeFileSync(join(process.cwd(), 'src/data/index.json'), JSON.stringify(index, null, 2))
  console.log('Wrote index.json')

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
