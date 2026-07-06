import type { User } from './user'

export interface Comment {
  id: number
  incident_id: number
  user_id: number
  body: string
  is_internal: boolean
  user?: User
  created_at: string
  updated_at: string
}