import type { Shot } from '../lib/types'
import { toSVGX } from '../lib/canvas'

export const OUTCOME_COLORS: Record<string, string> = {
  goal:   '#4ade80',
  saved:  '#fbbf24',
  missed: '#64748b',
}

interface ShotDotProps {
  shot: Shot
  y: number
  radius: number
  isHovered: boolean
  isSelected: boolean
  onHover: (shot: Shot) => void
  onHoverEnd: () => void
  onSelect: (shot: Shot) => void
}

export function ShotDot({ shot, y, radius, isHovered, isSelected, onHover, onHoverEnd, onSelect }: ShotDotProps) {
  const x = toSVGX(shot.lineX!)
  const color = OUTCOME_COLORS[shot.outcome] ?? '#94a3b8'

  const r       = isSelected ? radius * 1.6 : isHovered ? radius * 1.2 : radius
  const opacity = isSelected ? 1 : isHovered ? 0.9 : 0.72
  const stroke  = isSelected ? 'white' : 'none'

  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      fill={color}
      opacity={opacity}
      stroke={stroke}
      strokeWidth={isSelected ? 0.3 : 0}
      style={{ cursor: 'pointer', transition: 'r 0.1s, opacity 0.1s' }}
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
