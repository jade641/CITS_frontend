import type { User } from './user'

export interface Attachment {
  id: number
  incident_id: number
  user_id: number
  original_name: string
  stored_name: string
  disk: string
  file_path: string
  mime_type: string
  size_bytes: number
  user?: User
  created_at: string
  updated_at: string
}