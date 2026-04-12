import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { fetchPublicConfig } from '../lib/publicConfigClient'
import { setRuntimeCloudinaryCloudName } from '../lib/listingImageUrl'

export type PublicConfigValue = {
  /** Cloudinary cloud name is resolved (from env or public-config). */
  ready: boolean
  /** Google Static Map preview image (marker at coordinates). */
  staticMapPreviewEnabled: boolean
}

const PublicConfigContext = createContext<PublicConfigValue | null>(null)

function isViteExplicitlyDisabled(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase()
  return v === '0' || v === 'false' || v === 'no' || v === 'off'
}

export function PublicConfigProvider({ children }: { children: ReactNode }) {
  const envCloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim()
  const [ready, setReady] = useState(() => Boolean(envCloud))
  const [serverStaticMapPreview, setServerStaticMapPreview] = useState<
    boolean | null
  >(null)

  const viteStaticMapOff = isViteExplicitlyDisabled(
    import.meta.env.VITE_GOOGLE_MAPS_STATIC_MAP_ENABLED,
  )

  const staticMapPreviewEnabled =
    !viteStaticMapOff && serverStaticMapPreview !== false

  useEffect(() => {
    let cancelled = false
    void fetchPublicConfig().then((cfg) => {
      if (cancelled) {
        return
      }
      if (!envCloud) {
        setRuntimeCloudinaryCloudName((cfg.cloudinaryCloudName ?? '').trim())
        setReady(true)
      }
      setServerStaticMapPreview(
        typeof cfg.staticMapPreviewEnabled === 'boolean'
          ? cfg.staticMapPreviewEnabled
          : true,
      )
    })

    return () => {
      cancelled = true
    }
  }, [envCloud])

  const value = useMemo<PublicConfigValue>(
    () => ({
      ready,
      staticMapPreviewEnabled,
    }),
    [ready, staticMapPreviewEnabled],
  )

  return (
    <PublicConfigContext.Provider value={value}>
      {children}
    </PublicConfigContext.Provider>
  )
}

export function usePublicConfig(): PublicConfigValue {
  const ctx = useContext(PublicConfigContext)
  if (!ctx) {
    throw new Error('usePublicConfig must be used within PublicConfigProvider')
  }
  return ctx
}

export function usePublicConfigReady() {
  return usePublicConfig().ready
}
