import type { UserRoleSlug } from '../interfaces'

export interface NavigationItem {
  label: string
  to: string
  icon: string
  roles?: UserRoleSlug[]
  permission?: string
}

export const navigationItems: NavigationItem[] = [
  { label: 'Home', to: '/dashboard/user', icon: 'bi-house-fill', roles: ['user'] },
  { label: 'Report Incident', to: '/incidents/report', icon: 'bi-exclamation-octagon-fill', roles: ['user'] },
  { label: 'My Tickets', to: '/tickets/my', icon: 'bi-ticket-detailed-fill', roles: ['user'] },
  { label: 'Notifications', to: '/notifications', icon: 'bi-bell-fill', roles: ['user'] },
  { label: 'Profile', to: '/profile', icon: 'bi-person-badge-fill', roles: ['user'] },
]