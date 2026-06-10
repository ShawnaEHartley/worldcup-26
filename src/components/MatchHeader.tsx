import { flag } from '../lib/flags'
import type { Match } from '../lib/types'

interface MatchHeaderProps {
  match: Match
  teamCountryMap: Map<number, string>
}

export function MatchHeader({ match, teamCountryMap }: MatchHeaderProps) {
  const homeFlag = flag(teamCountryMap.get(match.home_team_id) ?? '')
  const awayFlag = flag(teamCountryMap.get(match.away_team_id) ?? '')
  const score    = `${match.home_score}–${match.away_score}`

  let detail: string
  if (match.result_type === 'penalties' && match.shootout) {
    const { home_pens, away_pens, winner } = match.shootout
    detail = `${winner} win ${home_pens}–${away_pens} on penalties · ${match.stage_label}`
  } else {
    const suffix = match.result_type === 'extra_time' ? ' · a.e.t.' : ''
    detail = `${match.stage_label}${suffix}`
  }

  return (
    <div className="match-header">
      <div className="match-header-row">
        <span className="match-header-team match-header-team--home">
          <span className="match-header-flag">{homeFlag}</span>
          <span className="match-header-team-name">{match.home_team_name}</span>
        </span>
        <span className="match-header-score">{score}</span>
        <span className="match-header-team match-header-team--away">
          <span className="match-header-team-name">{match.away_team_name}</span>
          <span className="match-header-flag">{awayFlag}</span>
        </span>
      </div>
      <div className="match-header-detail">{detail}</div>
    </div>
  )
}
