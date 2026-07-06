import type { UserRoleSlug } from '../interfaces'

const roleClassMap: Record<UserRoleSlug, string> = {
  administrator: 'text-bg-danger',
  'security-analyst': 'text-bg-info',
  user: 'text-bg-secondary',
}

export function RoleBadge({ role }: { role: UserRoleSlug }) {
  return (
    <span className={`badge ${roleClassMap[role]}`}>
      {role.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())}
    </span>
  )
}