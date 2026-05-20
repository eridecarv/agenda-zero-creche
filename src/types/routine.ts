/**
 * Tipos relacionados aos registros diários de rotina da criança.
 * Inclui presença, alimentação, higiene e resumo narrativo.
 */

export type Mood =
  | 'happy'
  | 'calm'
  | 'restless'
  | 'tearful'

export type Sleep =
  | 'good'
  | 'fair'
  | 'poor'
  | 'did_not_sleep'

export type Meal =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'afternoon_snack'
  | 'dinner'

export type Acceptance =
  | 'good'
  | 'fair'
  | 'refused'

export type DailyLog = {
  id: string
  school_id: string
  child_id: string
  date: string
  mood: Mood | null
  sleep: Sleep | null
  notes: string | null
  recorded_by: string | null
  updated_at: string
  created_at: string
}

export type AttendanceLog = {
  id: string
  daily_log_id: string
  present: boolean
  check_in: string | null
  check_out: string | null
  picked_up_by: string | null
  created_at: string
}

export type FeedingLog = {
  id: string
  daily_log_id: string
  meal: Meal
  acceptance: Acceptance
  notes: string | null
  created_at: string
}

export type HygieneLog = {
  id: string
  daily_log_id: string
  bath: boolean
  brushing: boolean
  bowel_movement: boolean
  notes: string | null
  created_at: string
}

export type DailyReport = {
  id: string
  daily_log_id: string
  generated_text: string
  generated_at: string
  created_at: string
}