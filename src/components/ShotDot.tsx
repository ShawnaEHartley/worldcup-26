import type { Shot } from '../lib/types'
import { toSVGX } from '../lib/canvas'

export const OUTCOME_COLORS: Record<string, string> = {
  goal:   '#4ade80',
  saved:  '#fbbf24',
  missed: '#64748b',
}

const DOT_R = 0.75

interface ShotDotProps {
  shot: Shot
  y: number
  isHovered: boolean
  isSelected: boolean
  onHover: (shot: Shot) => void
  onHoverEnd: () => void
  onSelect: (shot: Shot) => void
}

export function ShotDot({ shot, y, isHovered, isSelected, onHover, onHoverEnd, onSelect }: ShotDotProps) {
  const x     = toSVGX(shot.lineX!)
  const color = OUTCOME_COLORS[shot.outcome] ?? '#94a3b8'
  const r       = isHovered ? DOT_R * 1.3 : DOT_R
  const opacity = isSelected || isHovered ? 1 : 0.72

  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      fill={color}
      opacity={opacity}
      stroke={isSelected ? 'white' : 'none'}
      strokeWidth={isSelected ? 0.25 : 0}
      style={{ cursor: 'pointer', transition: 'r 0.1s, opacity 0.1s', outline: 'none' }}
      onMouseEnter={() => onHover(shot)}
      onMouseLeave={onHoverEnd}
      onClick={() => onSelect(shot)}
      tabIndex={0}
      role="button"
      aria-label={`${shot.outcome} by ${shot.player_name}, minute ${shot.minute}`}
      onFocus={() => onHover(shot)}
      onBlur={onHoverEnd}
    />
  )
}
