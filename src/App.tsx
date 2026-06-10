import { useEffect, useMemo, useState } from 'react'
import { GoalLineCanvas } from './components/GoalLineCanvas'
import { ShotDot } from './components/ShotDot'
import { ShotCard } from './components/ShotCard'
import { FilterBar } from './components/FilterBar'
import { StatsBar } from './components/StatsBar'
import { MatchCards } from './components/MatchCards'
import { MatchHeader } from './components/MatchHeader'
import { ShootoutStrip } from './components/ShootoutStrip'
import { type TournamentOption } from './components/TournamentPicker'
import { GROUND_Y, CROSSBAR_Y } from './lib/canvas'
import type { Shot, Match, Team } from './lib/types'

const TOURNAMENTS: TournamentOption[] = [
  { id: 'wwc-2023', name: "Women's World Cup", season: '2023' },
  { id: 'wc-2022',  name: "Men's World Cup",   season: '2022' },
  { id: 'wc-2018',  name: "Men's World Cup",   season: '2018' },
  { id: 'euro-2024',name: 'UEFA Euro',         season: '2024' },
  { id: 'euro-2020',name: 'UEFA Euro',         season: '2020' },
]

interface TournamentData {
  teams: Team[]
  matches: Match[]
  shots: Shot[]
}

function dotY(shot: Shot): number {
  return GROUND_Y - shot.height! * (GROUND_Y - CROSSBAR_Y)
}

export default function App() {
  const [tournamentId, setTournamentId] = useState('wwc-2023')
  const [teamId, setTeamId]     = useState<number | null>(null)
  const [playerId, setPlayerId] = useState<number | null>(null)
  const [matchId, setMatchId]   = useState<number | null>(null)

  const [data, setData]       = useState<TournamentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<Shot | null>(null)
  const [selected, setSelected] = useState<Shot | null>(null)

  useEffect(() => {
    setLoading(true)
    setData(null)
    setHovered(null)
    setSelected(null)
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
    const goals  = filteredShots.filter(s => s.outcome === 'goal').length
    const onGoal = filteredShots.filter(s => s.outcome === 'goal' || s.outcome === 'saved').length
    const matches = new Set(filteredShots.map(s => s.match_id)).size
    return { shots: filteredShots.length, onGoal, goals, matches }
  }, [filteredShots])

  // Build a team → country lookup from all shots (not just filtered)
  const teamCountryMap = useMemo(() => {
    if (!data) return new Map<number, string>()
    const map = new Map<number, string>()
    for (const s of data.shots) map.set(s.team_id, s.team_country)
    return map
  }, [data])

  // Active match: from the match filter if set, otherwise from the selected shot
  const selectedMatch = useMemo(() => {
    if (!data) return null
    const id = matchId ?? selected?.match_id ?? null
    if (!id) return null
    return data.matches.find(m => m.match_id === id) ?? null
  }, [matchId, selected, data])

  const opponent = useMemo(() => {
    if (!selected || !selectedMatch) return { name: '', country: '' }
    const isHome = selectedMatch.home_team_id === selected.team_id
    return {
      name:    isHome ? selectedMatch.away_team_name : selectedMatch.home_team_name,
      country: isHome
        ? (teamCountryMap.get(selectedMatch.away_team_id) ?? '')
        : (teamCountryMap.get(selectedMatch.home_team_id) ?? ''),
    }
  }, [selected, selectedMatch, teamCountryMap])

  // Swap target: opponent derived from selected shot (preferred) or from match filter
  const swapTarget = useMemo(() => {
    if (selected && selectedMatch) {
      const isHome = selectedMatch.home_team_id === selected.team_id
      return {
        teamId: isHome ? selectedMatch.away_team_id : selectedMatch.home_team_id,
        name:   isHome ? selectedMatch.away_team_name : selectedMatch.home_team_name,
      }
    }
    if (matchId && teamId && data) {
      const m = data.matches.find(m => m.match_id === matchId)
      if (m) {
        const isHome = m.home_team_id === teamId
        return {
          teamId: isHome ? m.away_team_id : m.home_team_id,
          name:   isHome ? m.away_team_name : m.home_team_name,
        }
      }
    }
    return null
  }, [selected, selectedMatch, matchId, teamId, data])

  function handleTeamChange(id: number | null) {
    setTeamId(id)
    setPlayerId(null)
    setMatchId(null)
    setSelected(null)
  }

  function handleSwapTeam(newTeamId: number) {
    setTeamId(newTeamId)
    setPlayerId(null)
    setSelected(null)
    // matchId kept: if in a match context, stay in it but see the other team
  }

  function handleSelect(shot: Shot) {
    if (selected?.id === shot.id) {
      setSelected(null)
    } else {
      setSelected(shot)
      setTeamId(shot.team_id)
    }
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
        swapTarget={swapTarget}
        onSwapTeam={handleSwapTeam}
      />

      <StatsBar
        shots={stats.shots}
        onGoal={stats.onGoal}
        goals={stats.goals}
        matches={stats.matches}
        blocked={blockedCount}
        noLocation={noLocationCount}
      />

      {selectedMatch && (
        <MatchHeader match={selectedMatch} teamCountryMap={teamCountryMap} />
      )}

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
                isHovered={hovered?.id === shot.id}
                isSelected={selected?.id === shot.id}
                onHover={setHovered}
                onHoverEnd={() => setHovered(null)}
                onSelect={handleSelect}
              />
            ))}
          </GoalLineCanvas>
        )}
      </div>

      {selectedMatch?.shootout && (
        <ShootoutStrip match={selectedMatch} teamCountryMap={teamCountryMap} />
      )}

      {selected && (
        <ShotCard
          shot={selected}
          match={selectedMatch}
          opponentName={opponent.name}
          opponentCountry={opponent.country}
          onSelectPlayer={() => {
            setTeamId(selected.team_id)
            setPlayerId(selected.player_id)
            setMatchId(null)
            setSelected(null)
          }}
          onSelectMatch={() => {
            setTeamId(selected.team_id)
            setMatchId(selected.match_id)
            setPlayerId(null)
            setSelected(null)
          }}
          onClose={() => setSelected(null)}
        />
      )}

      {!selected && (
        <div className="details-bar">
          <span className="details-prompt">Tap a shot to see details</span>
        </div>
      )}

      {teamId && (
        <MatchCards
          matches={data?.matches.filter(m => m.home_team_id === teamId || m.away_team_id === teamId) ?? []}
          teamId={teamId}
          selectedMatchId={matchId}
          teamCountryMap={teamCountryMap}
          onSelectMatch={(id) => {
            setMatchId(id)
            setPlayerId(null)
            setSelected(null)
          }}
        />
      )}

      <footer className="attribution">
        Data: <a href="https://statsbomb.com/what-we-do/hub/free-data/" target="_blank" rel="noreferrer">StatsBomb</a>
      </footer>
    </main>
  )
}
