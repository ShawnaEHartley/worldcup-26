import { flag } from '../lib/flags'
import type { Match, ShootoutKick } from '../lib/types'

function KickDot({ kick }: { kick: ShootoutKick }) {
  return (
    <span
      className={`kick-dot ${kick.scored ? 'kick-scored' : 'kick-missed'}`}
      title={`${kick.player} — ${kick.scored ? 'scored' : 'missed'}`}
    />
  )
}

interface ShootoutStripProps {
  match: Match
  teamCountryMap: Map<number, string>
}

export function ShootoutStrip({ match, teamCountryMap }: ShootoutStripProps) {
  const { shootout } = match
  if (!shootout) return null

  const homeFlag = flag(teamCountryMap.get(match.home_team_id) ?? '')
  const awayFlag = flag(teamCountryMap.get(match.away_team_id) ?? '')
  const homeWon  = shootout.winner === match.home_team_name

  return (
    <div className="shootout-strip">
      <div className="shootout-label">Penalty shootout</div>
      <div className="shootout-rows">
        <div className={`shootout-row${homeWon ? ' shootout-row--winner' : ''}`}>
          <span className="shootout-team">{homeFlag} {match.home_team_name}</span>
          <span className="shootout-kicks">
            {shootout.home_kicks.map((k, i) => <KickDot key={i} kick={k} />)}
          </span>
          <span className="shootout-tally">{shootout.home_pens}</span>
        </div>
        <div className={`shootout-row${!homeWon ? ' shootout-row--winner' : ''}`}>
          <span className="shootout-team">{awayFlag} {match.away_team_name}</span>
          <span className="shootout-kicks">
            {shootout.away_kicks.map((k, i) => <KickDot key={i} kick={k} />)}
          </span>
          <span className="shootout-tally">{shootout.away_pens}</span>
        </div>
      </div>
      <div className="shootout-winner">{shootout.winner} win on penalties</div>
    </div>
  )
}
