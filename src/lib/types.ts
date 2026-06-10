export type Outcome = 'goal' | 'saved' | 'missed' | 'blocked'
export type ResultType = 'normal' | 'extra_time' | 'penalties'

export interface Shot {
  id: string
  player_id: number
  player_name: string
  team_id: number
  team_name: string
  team_country: string
  match_id: number
  minute: number
  outcome: Outcome
  reached_goal_line: boolean
  lineX: number | null
  height: number | null
  xg: number
  is_penalty: boolean
  shot_type: string
  body_part: string
  play_pattern: string
  first_time: boolean
  under_pressure: boolean
  assisted_by: string | null
}

export interface ShootoutKick {
  player: string
  scored: boolean
}

export interface ShootoutBlock {
  home_kicks: ShootoutKick[]
  away_kicks: ShootoutKick[]
  home_pens: number
  away_pens: number
  winner: string
}

export interface Match {
  match_id: number
  date: string
  home_team_id: number
  home_team_name: string
  away_team_id: number
  away_team_name: string
  home_score: number
  away_score: number
  stage: string
  stage_label: string
  result_type: ResultType
  shootout: ShootoutBlock | null
}

export interface Team {
  team_id: number
  team_name: string
}
