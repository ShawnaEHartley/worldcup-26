import { flag } from '../lib/flags'
import type { Match } from '../lib/types'

function teamResult(match: Match, teamId: number): { label: string; cls: string } {
  const isHome = match.home_team_id === teamId
  const teamScore = isHome ? match.home_score : match.away_score
  const oppScore  = isHome ? match.away_score : match.home_score
  const suffix = match.result_type === 'penalties'  ? ' (pens)'   :
                 match.result_type === 'extra_time' ? ' (a.e.t.)' : ''
  const score = `${teamScore}–${oppScore}`
  if (teamScore > oppScore) return { label: `W ${score}${suffix}`, cls: 'result-w' }
  if (teamScore < oppScore) return { label: `L ${score}${suffix}`, cls: 'result-l' }
  return { label: `D ${score}${suffix}`, cls: 'result-d' }
}

interface MatchCardsProps {
  matches: Match[]
  teamId: number
  selectedMatchId: number | null
  teamCountryMap: Map<number, string>
  onSelectMatch: (matchId: number) => void
}

export function MatchCards({ matches, teamId, selectedMatchId, teamCountryMap, onSelectMatch }: MatchCardsProps) {
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="match-cards">
      <div className="match-cards-label">Matches</div>
      {sorted.map(m => {
        const isHome = m.home_team_id === teamId
        const oppId      = isHome ? m.away_team_id   : m.home_team_id
        const oppName    = isHome ? m.away_team_name  : m.home_team_name
        const oppCountry = teamCountryMap.get(oppId) ?? ''
        const result     = teamResult(m, teamId)
        const isSelected = m.match_id === selectedMatchId

        return (
          <button
            key={m.match_id}
            className={`match-card${isSelected ? ' match-card--selected' : ''}`}
            onClick={() => onSelectMatch(m.match_id)}
            type="button"
          >
            <span className="match-card-opponent">
              {flag(oppCountry)} {oppName}
            </span>
            <span className="match-card-stage">{m.stage_label}</span>
            <span className={`match-card-result ${result.cls}`}>{result.label}</span>
          </button>
        )
      })}
    </div>
  )
}
