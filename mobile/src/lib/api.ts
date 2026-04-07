const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api'

type ApiRequestOptions = RequestInit & {
  token?: string | null
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  })

  if (!response.ok) {
    let message = 'Something went wrong while calling the API.'
    try {
      const errorPayload = await response.json() as { message?: string | string[] }
      if (Array.isArray(errorPayload?.message)) {
        message = errorPayload.message.join(', ')
      } else if (errorPayload?.message) {
        message = errorPayload.message
      }
    } catch {
      // ignore parse error
    }
    throw new Error(message)
  }

  return (await response.json()) as T
}
