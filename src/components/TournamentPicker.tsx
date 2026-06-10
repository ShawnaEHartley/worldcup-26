export interface TournamentOption {
  id: string
  name: string
  season: string
}

interface TournamentPickerProps {
  tournaments: TournamentOption[]
  value: string
  onChange: (id: string) => void
}

export function TournamentPicker({ tournaments, value, onChange }: TournamentPickerProps) {
  return (
    <div className="team-picker">
      <label htmlFor="tournament-select" className="team-picker-label">Tournament</label>
      <select
        id="tournament-select"
        className="team-picker-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {tournaments.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} {t.season}
          </option>
        ))}
      </select>
    </div>
  )
}
