import type { ApiMessage, Notification, PaginatedResponse } from '../interfaces'
import { apiClient } from './http'

export interface NotificationPayload {
  notifications: PaginatedResponse<Notification>
  unreadCount: number
}

export async function getNotifications(): Promise<NotificationPayload> {
  const { data } = await apiClient.get<NotificationPayload>('/notifications')
  return data
}

export async function markNotificationRead(id: number): Promise<{ message: string; notification: Notification }> {
  const { data } = await apiClient.patch<{ message: string; notification: Notification }>(
    `/notifications/${id}/read`,
  )
  return data
}

export async function markAllNotificationsRead(): Promise<ApiMessage> {
  const { data } = await apiClient.patch<ApiMessage>('/notifications/read-all')
  return data
}