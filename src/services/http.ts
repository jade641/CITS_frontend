import axios from 'axios'

// Use relative paths so requests go through the Vite dev proxy (same-origin)
const productionApiBaseUrl = 'https://cits-backend-s12z.onrender.com/api'
const apiBaseUrl = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '/api' : productionApiBaseUrl)

const TOKEN_KEY = 'cits_auth_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
} as const

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: defaultHeaders,
})

// Attach Bearer token to every request if available
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function buildQuery(
  params: Record<string, any>,
): URLSearchParams {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  return searchParams
}

type ValidationErrors = Record<string, string[]>

interface ErrorPayload {
  message?: string
  errors?: ValidationErrors
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ErrorPayload | undefined
    const firstValidationError = payload?.errors
      ? Object.values(payload.errors)[0]?.[0]
      : undefined

    return firstValidationError ?? payload?.message ?? error.message
  }

  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

export function getDownloadFilename(
  contentDisposition: string | undefined,
  fallbackFilename: string,
): string {
  const fileNameMatch = contentDisposition?.match(/filename="?([^\\"]+)"?/)?.[1]

  return fileNameMatch ?? fallbackFilename
}

export function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const downloadUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(downloadUrl)
}

export { apiBaseUrl }