import type { ReactNode } from 'react'
import {
  VIEWBOX_WIDTH,
  VIEWBOX_HEIGHT,
  POST_LEFT_X,
  POST_RIGHT_X,
  GROUND_Y,
  CROSSBAR_Y,
} from '../lib/canvas'

const GOAL_W = POST_RIGHT_X - POST_LEFT_X
const GOAL_H = GROUND_Y - CROSSBAR_Y
const POST_STROKE = 0.55

function CornerFlag({ x, side }: { x: number; side: 'left' | 'right' }) {
  const flagW = 1.4
  const flagX = side === 'left' ? x : x - flagW
  return (
    <g>
      <line
        x1={x} y1={GROUND_Y - 3.5}
        x2={x} y2={GROUND_Y}
        stroke="rgba(255,230,80,0.85)"
        strokeWidth={0.28}
      />
      <rect
        x={flagX} y={GROUND_Y - 4.2}
        width={flagW} height={0.9}
        fill="rgba(255,230,80,0.85)"
      />
    </g>
  )
}

export function GoalLineCanvas({ children }: { children?: ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      width="100%"
      role="img"
      aria-label="Goal line view, corner to corner"
      style={{ display: 'block', width: '100%', aspectRatio: '100/28' }}
    >
      <defs>
        {/* Net crosshatch: each tile draws a left edge + top edge → grid appearance */}
        <pattern
          id="net-mesh"
          x={POST_LEFT_X} y={CROSSBAR_Y}
          width={1.6} height={1.6}
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 1.6 0 L 0 0 L 0 1.6"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth={0.12}
          />
        </pattern>
        <clipPath id="net-clip">
          <rect x={POST_LEFT_X} y={CROSSBAR_Y} width={GOAL_W} height={GOAL_H} />
        </clipPath>
      </defs>

      {/* Sky */}
      <rect x={0} y={0} width={VIEWBOX_WIDTH} height={GROUND_Y} fill="#1a2a3a" />

      {/* Field */}
      <rect x={0} y={GROUND_Y} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT - GROUND_Y} fill="#2a4d1e" />

      {/* Subtle pitch-marking feel: faint goal area box */}
      <rect
        x={POST_LEFT_X - 5.5} y={GROUND_Y - 3}
        width={GOAL_W + 11} height={3}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={0.2}
      />

      {/* Goal line, corner to corner */}
      <line
        x1={0} y1={GROUND_Y}
        x2={VIEWBOX_WIDTH} y2={GROUND_Y}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={0.2}
      />

      {/* Net — subtle fill then mesh */}
      <rect
        x={POST_LEFT_X} y={CROSSBAR_Y}
        width={GOAL_W} height={GOAL_H}
        fill="rgba(255,255,255,0.07)"
      />
      <rect
        x={POST_LEFT_X} y={CROSSBAR_Y}
        width={GOAL_W} height={GOAL_H}
        fill="url(#net-mesh)"
        clipPath="url(#net-clip)"
      />

      {/* Crossbar */}
      <line
        x1={POST_LEFT_X} y1={CROSSBAR_Y}
        x2={POST_RIGHT_X} y2={CROSSBAR_Y}
        stroke="white" strokeWidth={POST_STROKE} strokeLinecap="round"
      />

      {/* Left post */}
      <line
        x1={POST_LEFT_X} y1={CROSSBAR_Y}
        x2={POST_LEFT_X} y2={GROUND_Y}
        stroke="white" strokeWidth={POST_STROKE} strokeLinecap="round"
      />

      {/* Right post */}
      <line
        x1={POST_RIGHT_X} y1={CROSSBAR_Y}
        x2={POST_RIGHT_X} y2={GROUND_Y}
        stroke="white" strokeWidth={POST_STROKE} strokeLinecap="round"
      />

      {/* Corner flags */}
      <CornerFlag x={0} side="left" />
      <CornerFlag x={VIEWBOX_WIDTH} side="right" />

      {children}
    </svg>
  )
}
