interface Team {
  team_id: number
  team_name: string
}

interface TeamPickerProps {
  teams: Team[]
  value: number | null
  onChange: (teamId: number | null) => void
}

export function TeamPicker({ teams, value, onChange }: TeamPickerProps) {
  return (
    <div className="team-picker">
      <label htmlFor="team-select" className="team-picker-label">Team</label>
      <select
        id="team-select"
        className="team-picker-select"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === '' ? null : Number(v))
        }}
      >
        <option value="">All teams</option>
        {teams.map((t) => (
          <option key={t.team_id} value={t.team_id}>
            {t.team_name}
          </option>
        ))}
      </select>
    </div>
  )
}
