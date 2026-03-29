const DEFAULT_API_BASE_URL = 'http://localhost:4000/api'

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL

type ApiRequestOptions = RequestInit & {
  token?: string | null
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorPayload = (await tryParseJson(response)) as
      | { message?: string | string[] }
      | undefined

    const message = Array.isArray(errorPayload?.message)
      ? errorPayload?.message.join(', ')
      : errorPayload?.message

    throw new Error(message ?? 'Something went wrong while calling the API.')
  }

  return (await response.json()) as T
}

async function tryParseJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

