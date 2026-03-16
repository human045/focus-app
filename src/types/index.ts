export interface Todo {
  id: number
  user_id: string
  text: string
  done: boolean
  pinned: boolean
  est_poms: number
  poms_completed: number
  created_at: string
  updated_at: string
}

export interface UserSettings {
  user_id: string
  work_min: number
  short_min: number
  long_min: number
  sessions_per_cycle: number
  auto_break: boolean
  auto_work: boolean
  theme: 'dark' | 'light'
}

export interface PomoSession {
  id: number
  user_id: string
  mode: 'work' | 'short' | 'long'
  duration: number
  todo_id: number | null
  completed: boolean
  started_at: string
}

export interface DailyStats {
  day: string
  work_sessions: number
  focus_seconds: number
}

export type TimerMode = 'work' | 'short' | 'long'
