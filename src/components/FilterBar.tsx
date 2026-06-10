import { useMemo } from 'react'
import { ClearableSelect } from './ClearableSelect'
import { TournamentPicker, type TournamentOption } from './TournamentPicker'
import type { Shot, Match, Team } from '../lib/types'

interface FilterBarProps {
  // Tournament
  tournaments: TournamentOption[]
  tournamentId: string
  onTournamentChange: (id: string) => void
  // Team
  teams: Team[]
  teamId: number | null
  onTeamChange: (id: number | null) => void
  // Player
  playerId: number | null
  onPlayerChange: (id: number | null) => void
  // Match
  matchId: number | null
  onMatchChange: (id: number | null) => void
  // Data needed to populate player + match options
  shots: Shot[]
  matches: Match[]
}

export function FilterBar({
  tournaments, tournamentId, onTournamentChange,
  teams, teamId, onTeamChange,
  playerId, onPlayerChange,
  matchId, onMatchChange,
  shots, matches,
}: FilterBarProps) {
  // Players in the current team selection, sorted by name
  const players = useMemo(() => {
    if (!teamId) return []
    const seen = new Map<number, string>()
    for (const s of shots) {
      if (s.team_id === teamId && !seen.has(s.player_id)) {
        seen.set(s.player_id, s.player_name)
      }
    }
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [shots, teamId])

  // Matches relevant to the current team selection, sorted by date
  const teamMatches = useMemo(() => {
    if (!teamId) return []
    return matches
      .filter(m => m.home_team_id === teamId || m.away_team_id === teamId)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [matches, teamId])

  function matchLabel(m: Match): string {
    const opponent = m.home_team_id === teamId ? m.away_team_name : m.home_team_name
    return `vs ${opponent} · ${m.stage_label}`
  }

  return (
    <div className="filter-bar">
      <div className="controls">
        <TournamentPicker
          tournaments={tournaments}
          value={tournamentId}
          onChange={onTournamentChange}
        />

        <ClearableSelect
          id="team-select"
          label="Team"
          value={teamId}
          onChange={(v) => onTeamChange(v ? Number(v) : null)}
          onClear={() => { onTeamChange(null); onPlayerChange(null); onMatchChange(null) }}
        >
          <option value="">All teams</option>
          {teams.map(t => (
            <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
          ))}
        </ClearableSelect>
      </div>

      {teamId && (
        <div className="controls">
          <ClearableSelect
            id="player-select"
            label="Player"
            value={playerId}
            onChange={(v) => onPlayerChange(v ? Number(v) : null)}
            onClear={() => onPlayerChange(null)}
          >
            <option value="">All players</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </ClearableSelect>

          <ClearableSelect
            id="match-select"
            label="Match"
            value={matchId}
            onChange={(v) => onMatchChange(v ? Number(v) : null)}
            onClear={() => onMatchChange(null)}
          >
            <option value="">All matches</option>
            {teamMatches.map(m => (
              <option key={m.match_id} value={m.match_id}>{matchLabel(m)}</option>
            ))}
          </ClearableSelect>
        </div>
      )}
    </div>
  )
}
