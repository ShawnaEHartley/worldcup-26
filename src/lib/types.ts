export type Outcome = 'goal' | 'saved' | 'missed' | 'blocked'

export interface Shot {
  id: string
  player_id: number
  player_name: string
  team_id: number
  team_name: string
  match_id: number
  minute: number
  outcome: Outcome
  reached_goal_line: boolean
  lineX: number | null
  height: number | null
  xg: number
}
