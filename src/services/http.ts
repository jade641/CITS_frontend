import axios from 'axios'

// Use relative paths so requests go through the Vite dev proxy (same-origin)
const apiBaseUrl = import.meta.env.VITE_API_URL ?? '/api'

function getSanctumBaseUrl(baseUrl: string): string {
  if (/^https?:\/\//i.test(baseUrl)) {
    try {
      return `${new URL(baseUrl).origin}/`
    } catch {
      return '/'
    }
  }

  return '/'
}

const defaultHeaders = {
  Accept: 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
} as const

const sanctumClient = axios.create({
  baseURL: getSanctumBaseUrl(apiBaseUrl),
  withCredentials: true,
  headers: defaultHeaders,
})

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: defaultHeaders,
})

let csrfRequest: Promise<void> | null = null

export async function ensureCsrfCookie(): Promise<void> {
  if (!csrfRequest) {
    csrfRequest = sanctumClient.get('/sanctum/csrf-cookie').then(() => undefined).finally(() => {
      csrfRequest = null
    })
  }

  await csrfRequest
}

apiClient.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase()

  if (method && !['get', 'head', 'options'].includes(method)) {
    await ensureCsrfCookie()
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
  const fileNameMatch = contentDisposition?.match(/filename="?([^\"]+)"?/)?.[1]

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