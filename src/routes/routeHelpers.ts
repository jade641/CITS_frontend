import type { User, UserRoleSlug } from '../interfaces'

export function getUserRole(user: User | null | undefined): UserRoleSlug {
  return user?.roles[0]?.slug ?? 'user'
}

export function getHomePathForRole(role: UserRoleSlug): string {
  switch (role) {
    case 'administrator':
      return '/admin/dashboard'
    case 'security-analyst':
      return '/analyst/dashboard'
    default:
      return '/dashboard'
  }
}

export function getHomePathForUser(user: User | null | undefined): string {
  return getHomePathForRole(getUserRole(user))
}

export function userHasRole(
  user: User | null | undefined,
  roles: UserRoleSlug[],
): boolean {
  return user ? roles.includes(getUserRole(user)) : false
}

export function userHasPermission(
  user: User | null | undefined,
  permission: string,
): boolean {
  return user?.permission_slugs.includes(permission) ?? false
}