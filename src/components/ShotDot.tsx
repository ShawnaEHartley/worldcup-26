import { useState } from 'react'
import type { Shot } from '../lib/types'
import { toSVGX } from '../lib/canvas'

export const OUTCOME_COLORS: Record<string, string> = {
  goal:   '#4ade80',
  saved:  '#fbbf24',
  missed: '#64748b',
}

const BASE_R  = 0.45
const HOVER_R = 0.60

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
  const [isFocused, setIsFocused] = useState(false)
  const x     = toSVGX(shot.lineX!)
  const color = OUTCOME_COLORS[shot.outcome] ?? '#94a3b8'

  const active = isHovered || isSelected || isFocused
  const r           = active ? HOVER_R : BASE_R
  const opacity     = active ? 1 : 0.48
  const stroke      = active ? 'white' : 'none'
  const strokeWidth = (isSelected || isFocused) ? 0.28 : isHovered ? 0.20 : 0

  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      fill={color}
      opacity={opacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={{ cursor: 'pointer', transition: 'r 0.1s, opacity 0.1s', outline: 'none' }}
      onMouseEnter={() => onHover(shot)}
      onMouseLeave={onHoverEnd}
      onClick={() => onSelect(shot)}
      tabIndex={0}
      role="button"
      aria-label={`${shot.outcome} by ${shot.player_name}, minute ${shot.minute}`}
      onFocus={() => { setIsFocused(true); onHover(shot) }}
      onBlur={() => { setIsFocused(false); onHoverEnd() }}
    />
  )
}
