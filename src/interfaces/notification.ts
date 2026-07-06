export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: string
  data: Record<string, string | number | boolean | null> | null
  read_at: string | null
  created_at: string
  updated_at: string
}