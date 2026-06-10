import type { ReactNode } from 'react'

interface ClearableSelectProps {
  id: string
  label: string
  value: string | number | null
  onChange: (value: string) => void
  onClear: () => void
  disabled?: boolean
  children: ReactNode
}

export function ClearableSelect({
  id, label, value, onChange, onClear, disabled = false, children
}: ClearableSelectProps) {
  return (
    <div className="clearable-select">
      <label htmlFor={id} className="team-picker-label">{label}</label>
      <div className="clearable-select-row">
        <select
          id={id}
          className="team-picker-select"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {children}
        </select>
        {value !== null && (
          <button
            className="clear-btn"
            onClick={onClear}
            aria-label={`Clear ${label} filter`}
            type="button"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
