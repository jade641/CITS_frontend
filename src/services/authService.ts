import type { ApiMessage, User } from '../interfaces'
import { apiClient, setStoredToken, removeStoredToken } from './http'

export interface LoginPayload {
  email: string
  password: string
  remember: boolean
}

export interface RegisterPayload {
  name: string
  email: string
  phone: string
  department: string
  job_title: string
  password: string
  password_confirmation: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export interface UpdateProfilePayload {
  name: string
  email: string
  phone: string
  department: string
  job_title: string
  current_password?: string
  password?: string
  password_confirmation?: string
}

export interface AuthResponse extends ApiMessage {
  user: User
  token: string
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload)
  // Store the Bearer token for all subsequent requests
  setStoredToken(data.token)
  return data
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload)
  setStoredToken(data.token)
  return data
}

export async function logout(): Promise<ApiMessage> {
  try {
    const { data } = await apiClient.post<ApiMessage>('/auth/logout')
    return data
  } finally {
    // Always remove the token, even if the API call fails
    removeStoredToken()
  }
}

export async function getCurrentUser(): Promise<{ user: User }> {
  const { data } = await apiClient.get<{ user: User }>('/auth/me')
  return data
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<ApiMessage> {
  const { data } = await apiClient.post<ApiMessage>('/auth/forgot-password', payload)
  return data
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<ApiMessage> {
  const { data } = await apiClient.post<ApiMessage>('/auth/reset-password', payload)
  return data
}

export async function getProfile(): Promise<{ user: User }> {
  const { data } = await apiClient.get<{ user: User }>('/profile')
  return data
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthResponse> {
  const { data } = await apiClient.put<AuthResponse>('/profile', payload)
  return data
}