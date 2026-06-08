import type { Shot } from '../lib/types'
import { toSVGX } from '../lib/canvas'

export const OUTCOME_COLORS: Record<string, string> = {
  goal:   '#4ade80',  // green — fixed per spec
  saved:  '#fbbf24',  // amber
  missed: '#64748b',  // slate — recedes, lets goals pop
}

interface ShotDotProps {
  shot: Shot
  y: number
  radius: number
  isActive: boolean
  onActivate: (shot: Shot) => void
  onDeactivate: () => void
}

export function ShotDot({ shot, y, radius, isActive, onActivate, onDeactivate }: ShotDotProps) {
  const x = toSVGX(shot.lineX!)
  const color = OUTCOME_COLORS[shot.outcome] ?? '#94a3b8'

  return (
    <circle
      cx={x}
      cy={y}
      r={isActive ? radius * 1.6 : radius}
      fill={color}
      opacity={isActive ? 1 : 0.72}
      stroke={isActive ? 'white' : 'none'}
      strokeWidth={isActive ? 0.3 : 0}
      style={{ cursor: 'pointer', transition: 'r 0.1s, opacity 0.1s' }}
      onMouseEnter={() => onActivate(shot)}
      onMouseLeave={onDeactivate}
      onClick={() => onActivate(shot)}
      tabIndex={0}
      role="button"
      aria-label={`${shot.outcome} by ${shot.player_name}, minute ${shot.minute}`}
      onFocus={() => onActivate(shot)}
      onBlur={onDeactivate}
    />
  )
}
