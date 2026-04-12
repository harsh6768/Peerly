import { apiBaseUrl } from './api'

export type PublicConfigPayload = {
  cloudinaryCloudName?: string | null
  /** When false, skip Google Static Map image requests (saves billing). */
  staticMapPreviewEnabled?: boolean
}

let inflight: Promise<PublicConfigPayload> | null = null

/** Single in-flight fetch (dedupes StrictMode double mount and concurrent callers). */
export function fetchPublicConfig(): Promise<PublicConfigPayload> {
  if (!inflight) {
    inflight = fetch(`${apiBaseUrl}/public-config`)
      .then(async (res) => {
        if (!res.ok) {
          return {} as PublicConfigPayload
        }
        return ((await res.json()) as PublicConfigPayload) ?? {}
      })
      .catch(() => ({} as PublicConfigPayload))
  }
  return inflight
}
