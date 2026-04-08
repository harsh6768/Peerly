/**
 * API origin is fixed at **build** time (`import.meta.env.VITE_*`). Netlify (and other hosts)
 * must define `VITE_API_BASE_URL` for the build step, then redeploy — changing env without
 * rebuilding leaves the old URL in `dist/` JS bundles.
 */
export const apiBaseUrl = resolveApiBaseUrl()

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

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '')
  }

  throw new Error(
    'VITE_API_BASE_URL is missing. For local dev: add it to frontend/.env (see .env.example). ' +
      'For Netlify: Site → Environment variables → add VITE_API_BASE_URL, save, then Deploy → Trigger deploy ' +
      '(Vite embeds this at build time, not at request time).',
  )
}
