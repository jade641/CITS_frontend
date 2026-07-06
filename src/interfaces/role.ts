import type { Permission } from './permission'

export type UserRoleSlug = 'administrator' | 'security-analyst' | 'user'

export interface Role {
  id: number
  name: string
  slug: UserRoleSlug
  description: string | null
  is_system?: boolean
  permissions?: Permission[]
}