import { flag } from '../lib/flags'
import { OUTCOME_COLORS } from './ShotDot'
import type { Shot, Match } from '../lib/types'

const BODY_PART: Record<string, string> = {
  'Right Foot': 'Right foot',
  'Left Foot':  'Left foot',
  'Head':       'Header',
  'No Touch':   'No touch',
}

const PLAY_PATTERN: Record<string, string> = {
  'Regular Play':    'Open play',
  'From Corner':     'Corner',
  'From Free Kick':  'Free kick',
  'From Throw In':   'Throw-in',
  'From Goal Kick':  'Goal kick',
  'From Keeper':     'From keeper',
  'From Counter':    'Counter',
}

function xgPlain(xg: number): string {
  if (xg >= 0.9) return 'almost certain'
  if (xg >= 0.5) return 'better than even chance'
  return `about a 1-in-${Math.round(1 / xg)} chance`
}

function matchResult(match: Match, teamId: number): string {
  const isHome = match.home_team_id === teamId
  const teamScore = isHome ? match.home_score : match.away_score
  const oppScore  = isHome ? match.away_score : match.home_score
  const score = `${teamScore}–${oppScore}`
  const suffix = match.result_type === 'penalties'   ? ' (pens)'   :
                 match.result_type === 'extra_time'  ? ' (a.e.t.)' : ''
  if (teamScore > oppScore) return `W ${score}${suffix}`
  if (teamScore < oppScore) return `L ${score}${suffix}`
  return `D ${score}${suffix}`
}

interface ShotCardProps {
  shot: Shot
  match: Match | null
  opponentName: string
  opponentCountry: string
  onSelectPlayer: () => void
  onSelectMatch: () => void
  onClose: () => void
}

export function ShotCard({
  shot, match, opponentName, opponentCountry,
  onSelectPlayer, onSelectMatch, onClose,
}: ShotCardProps) {
  const outcomeColor = OUTCOME_COLORS[shot.outcome] ?? '#94a3b8'
  const outcomeLabel = shot.outcome.charAt(0).toUpperCase() + shot.outcome.slice(1)

  const badges: string[] = []
  if (shot.is_penalty)      badges.push('Penalty')
  badges.push(BODY_PART[shot.body_part] ?? shot.body_part)
  if (shot.play_pattern && shot.play_pattern !== 'Regular Play') {
    badges.push(PLAY_PATTERN[shot.play_pattern] ?? shot.play_pattern)
  }
  if (shot.first_time)      badges.push('First-time')
  if (shot.under_pressure)  badges.push('Under pressure')

  return (
    <div className="shot-card">
      <div className="shot-card-banner" style={{ color: outcomeColor }}>
        <span>{outcomeLabel}</span>
        <button className="shot-card-close" onClick={onClose} aria-label="Close shot detail" type="button">✕</button>
      </div>

      <div className="shot-card-body">
        <div>
          <div className="shot-card-player">
            {flag(shot.team_country)} {shot.player_name}
          </div>
          <div className="shot-card-meta">
            vs {flag(opponentCountry)} {opponentName}
            {match && <> · {match.stage_label} · {shot.minute}&prime; · {matchResult(match, shot.team_id)}</>}
          </div>
        </div>

        <div className="shot-card-xg">
          {shot.xg.toFixed(2)} xG — {xgPlain(shot.xg)}
        </div>

        {shot.assisted_by && (
          <div className="shot-card-assist">Set up by {shot.assisted_by}</div>
        )}

        {badges.length > 0 && (
          <div className="shot-badges">
            {badges.map(b => <span key={b} className="badge">{b}</span>)}
          </div>
        )}

        <div className="shot-card-doorways">
          <button className="doorway-btn" onClick={onSelectPlayer} type="button">
            See all of {shot.player_name.split(' ').pop()}'s shots →
          </button>
          {opponentName && (
            <button className="doorway-btn" onClick={onSelectMatch} type="button">
              Open the {opponentName} match →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
