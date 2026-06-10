import { useMemo, useState } from 'react'
import { GoalLineCanvas } from './components/GoalLineCanvas'
import { ShotDot, OUTCOME_COLORS } from './components/ShotDot'
import { TeamPicker } from './components/TeamPicker'
import { GROUND_Y, CROSSBAR_Y } from './lib/canvas'
import type { Shot } from './lib/types'
import rawShots from './data/wwc-2023/shots.json'
import rawMeta from './data/wwc-2023/meta.json'

const shots = rawShots as Shot[]
const teams = rawMeta.teams

// Dot radius scales subtly with xG so higher-quality chances read slightly larger.
function dotRadius(xg: number): number {
  return 0.55 + Math.sqrt(xg) * 0.45
}

// Map shot height (0=ground, 1=crossbar, >1=over bar) to SVG y coordinate.
// Shots with no height data fall back to a jittered ground position.
function dotY(shot: Shot): number {
  if (shot.height !== null) {
    return GROUND_Y - shot.height * (GROUND_Y - CROSSBAR_Y)
  }
  let h = 0
  for (let i = 0; i < Math.min(shot.id.length, 12); i++) {
    h = (Math.imul(31, h) + shot.id.charCodeAt(i)) | 0
  }
  return GROUND_Y - 0.5 - ((Math.abs(h) % 100) / 99) * 1.5
}

export default function App() {
  const [active, setActive] = useState<Shot | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

  const filteredShots = useMemo(
    () => (selectedTeamId ? shots.filter((s) => s.team_id === selectedTeamId) : shots),
    [selectedTeamId]
  )

  const plottable = useMemo(
    () => filteredShots.filter((s) => s.reached_goal_line),
    [filteredShots]
  )

  const blockedCount = useMemo(
    () => filteredShots.filter((s) => s.outcome === 'blocked').length,
    [filteredShots]
  )

  return (
    <main className="app">
      <header className="app-header">
        <h1>World Cup Shot Explorer</h1>
      </header>

      <div className="controls">
        <TeamPicker
          teams={teams}
          value={selectedTeamId}
          onChange={(id) => { setSelectedTeamId(id); setActive(null) }}
        />
      </div>

      <div className="canvas-wrapper">
        <GoalLineCanvas>
          {plottable.map((shot) => (
            <ShotDot
              key={shot.id}
              shot={shot}
              y={dotY(shot)}
              radius={dotRadius(shot.xg)}
              isActive={active?.id === shot.id}
              onActivate={setActive}
              onDeactivate={() => setActive(null)}
            />
          ))}
        </GoalLineCanvas>
      </div>

      <div className="details-bar">
        {active ? (
          <div className="details-active">
            <span
              className="details-dot"
              style={{ background: OUTCOME_COLORS[active.outcome] }}
            />
            <span className="details-name">{active.player_name}</span>
            <span className="details-sep">·</span>
            <span className="details-outcome">{active.outcome}</span>
            <span className="details-sep">·</span>
            <span className="details-minute">{active.minute}&prime;</span>
            <span className="details-sep">·</span>
            <span className="details-xg" title="chance quality">{active.xg.toFixed(2)}</span>
          </div>
        ) : (
          <span className="details-prompt">
            Hover a shot to see details &nbsp;·&nbsp; {blockedCount} blocked (not shown)
          </span>
        )}
      </div>
    </main>
  )
}
