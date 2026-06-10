interface StatsBarProps {
  shots: number
  onGoal: number
  goals: number
  matches: number
  blocked: number
  noLocation: number
}

export function StatsBar({ shots, onGoal, goals, matches, blocked, noLocation }: StatsBarProps) {
  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-number">{shots}</span>
        <span className="stat-label">Shots</span>
      </div>
      <div className="stat">
        <span className="stat-number">{onGoal}</span>
        <span className="stat-label">On goal</span>
      </div>
      <div className="stat">
        <span className="stat-number stat-number--goal">{goals}</span>
        <span className="stat-label">Goals</span>
      </div>
      <div className="stat">
        <span className="stat-number">{matches}</span>
        <span className="stat-label">Matches</span>
      </div>
      <div className="stat stat-dim" data-tooltip="Shot was blocked by a defender before reaching the goal — endpoint not recorded">
        <span className="stat-number">{blocked}</span>
        <span className="stat-label">Blocked</span>
      </div>
      <div className="stat stat-dim" data-tooltip="Shot missed the goal but StatsBomb did not record a precise endpoint — not plotted">
        <span className="stat-number">{noLocation}</span>
        <span className="stat-label">No location</span>
      </div>
    </div>
  )
}
