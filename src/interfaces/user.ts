import type { Role } from './role'

export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  department: string | null
  job_title: string | null
  status: UserStatus
  email_verified_at: string | null
  last_login_at: string | null
  last_login_ip: string | null
  primary_role: string | null
  permission_slugs: string[]
  roles: Role[]
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
}