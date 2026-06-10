import { useEffect, useMemo, useState } from 'react'
import { GoalLineCanvas } from './components/GoalLineCanvas'
import { ShotDot, OUTCOME_COLORS } from './components/ShotDot'
import { FilterBar } from './components/FilterBar'
import { StatsBar } from './components/StatsBar'
import { type TournamentOption } from './components/TournamentPicker'
import { GROUND_Y, CROSSBAR_Y } from './lib/canvas'
import type { Shot, Match, Team } from './lib/types'

// ── Tournament catalog (mirrors public/data/index.json) ───────────────────
const TOURNAMENTS: TournamentOption[] = [
  { id: 'wwc-2023', name: "Women's World Cup", season: '2023' },
  { id: 'wc-2022',  name: "Men's World Cup",   season: '2022' },
  { id: 'wc-2018',  name: "Men's World Cup",   season: '2018' },
  { id: 'euro-2024',name: 'UEFA Euro',         season: '2024' },
  { id: 'euro-2020',name: 'UEFA Euro',         season: '2020' },
]

// ── Tournament data shape ─────────────────────────────────────────────────
interface TournamentData {
  teams: Team[]
  matches: Match[]
  shots: Shot[]
}

// ── Coordinate helpers ────────────────────────────────────────────────────
function dotRadius(xg: number): number {
  return 0.55 + Math.sqrt(xg) * 0.45
}

function dotY(shot: Shot): number {
  if (shot.height !== null) {
    return GROUND_Y - shot.height * (GROUND_Y - CROSSBAR_Y)
  }
  let h = 0
  for (let i = 0; i < Math.min(shot.id.length, 12); i++) {
    h = (Math.imul(31, h) + shot.id.charCodeAt(i)) | 0
  }
  return GROUND_Y - 0.5 - ((Math.abs(h) % 100) / 99) * 1.5
}

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  // ── Shared filter state ──────────────────────────────────────────────
  const [tournamentId, setTournamentId] = useState('wwc-2023')
  const [teamId, setTeamId] = useState<number | null>(null)
  const [playerId, setPlayerId] = useState<number | null>(null)
  const [matchId, setMatchId] = useState<number | null>(null)

  // ── Tournament data (lazy-loaded) ────────────────────────────────────
  const [data, setData] = useState<TournamentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Shot | null>(null)

  useEffect(() => {
    setLoading(true)
    setData(null)
    setActive(null)
    setTeamId(null)
    setPlayerId(null)
    setMatchId(null)

    const base = `/data/${tournamentId}`
    Promise.all([
      fetch(`${base}/meta.json`).then(r => r.json()),
      fetch(`${base}/shots.json`).then(r => r.json()),
    ]).then(([meta, shots]) => {
      setData({ teams: meta.teams, matches: meta.matches, shots })
      setLoading(false)
    }).catch(err => {
      console.error('Failed to load tournament data', err)
      setLoading(false)
    })
  }, [tournamentId])

  // ── Filtered shots ───────────────────────────────────────────────────
  const filteredShots = useMemo(() => {
    if (!data) return []
    let shots = data.shots
    if (teamId)   shots = shots.filter(s => s.team_id   === teamId)
    if (playerId) shots = shots.filter(s => s.player_id === playerId)
    if (matchId)  shots = shots.filter(s => s.match_id  === matchId)
    return shots
  }, [data, teamId, playerId, matchId])

  const plottable = useMemo(
    () => filteredShots.filter(s => s.reached_goal_line && s.lineX !== null && s.height !== null),
    [filteredShots]
  )

  const blockedCount = useMemo(
    () => filteredShots.filter(s => s.outcome === 'blocked').length,
    [filteredShots]
  )

  const noLocationCount = useMemo(
    () => filteredShots.filter(s => s.reached_goal_line && (s.lineX === null || s.height === null)).length,
    [filteredShots]
  )

  const stats = useMemo(() => {
    const goals   = filteredShots.filter(s => s.outcome === 'goal').length
    const onGoal  = filteredShots.filter(s => s.outcome === 'goal' || s.outcome === 'saved').length
    const matches = new Set(filteredShots.map(s => s.match_id)).size
    return { shots: filteredShots.length, onGoal, goals, matches }
  }, [filteredShots])

  // Clear player + match when team changes
  function handleTeamChange(id: number | null) {
    setTeamId(id)
    setPlayerId(null)
    setMatchId(null)
    setActive(null)
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>World Cup Shot Explorer</h1>
      </header>

      <FilterBar
        tournaments={TOURNAMENTS}
        tournamentId={tournamentId}
        onTournamentChange={setTournamentId}
        teams={data?.teams ?? []}
        teamId={teamId}
        onTeamChange={handleTeamChange}
        playerId={playerId}
        onPlayerChange={setPlayerId}
        matchId={matchId}
        onMatchChange={setMatchId}
        shots={data?.shots ?? []}
        matches={data?.matches ?? []}
      />

      <StatsBar
        shots={stats.shots}
        onGoal={stats.onGoal}
        goals={stats.goals}
        matches={stats.matches}
        blocked={blockedCount}
        noLocation={noLocationCount}
      />

      <div className="canvas-wrapper">
        {loading ? (
          <div className="canvas-loading">Loading…</div>
        ) : (
          <GoalLineCanvas>
            {plottable.map((shot) => (
              <ShotDot
                key={shot.id}
                shot={shot}
                y={dotY(shot)}
                radius={dotRadius(shot.xg)}
                isActive={active?.id === shot.id}
                onActivate={setActive}
                onDeactivate={() => setActive(null)}
              />
            ))}
          </GoalLineCanvas>
        )}
      </div>

      <div className="details-bar">
        {active ? (
          <div className="details-active">
            <span className="details-dot" style={{ background: OUTCOME_COLORS[active.outcome] }} />
            <span className="details-name">{active.player_name}</span>
            <span className="details-sep">·</span>
            <span className="details-outcome">{active.outcome}</span>
            <span className="details-sep">·</span>
            <span className="details-minute">{active.minute}&prime;</span>
            <span className="details-sep">·</span>
            <span className="details-xg" title="chance quality">{active.xg.toFixed(2)}</span>
          </div>
        ) : (
          <span className="details-prompt">Hover a shot to see details</span>
        )}
      </div>

      <footer className="attribution">
        Data: <a href="https://statsbomb.com/what-we-do/hub/free-data/" target="_blank" rel="noreferrer">StatsBomb</a>
      </footer>
    </main>
  )
}
