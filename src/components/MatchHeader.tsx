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
    const suffix = match.result_type === 'extra_time' ? ' (a.e.t.)' : ''
    detail = `${match.stage_label}${suffix}`
  }

  return (
    <div className="match-header">
      <span className="match-header-teams">
        {homeFlag} {match.home_team_name} {score} {match.away_team_name} {awayFlag}
      </span>
      <span className="match-header-detail">{detail}</span>
    </div>
  )
}
