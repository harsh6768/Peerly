import type { ListingImage } from './types'

/**
 * Ensures Cloudinary URLs load on iOS (ATS allows https; some stored URLs may be http).
 */
export function normalizeCloudinaryUri(uri: string | null | undefined): string | undefined {
  if (uri == null || typeof uri !== 'string') return undefined
  const t = uri.trim()
  if (!t) return undefined
  if (t.startsWith('http://res.cloudinary.com') || t.startsWith('http://')) {
    try {
      const u = new URL(t)
      if (u.protocol === 'http:' && (u.hostname.includes('cloudinary.com') || u.hostname.includes('res.cloudinary.com'))) {
        u.protocol = 'https:'
        return u.toString()
      }
    } catch {
      // fall through
    }
    if (t.startsWith('http://')) {
      return `https://${t.slice('http://'.length)}`
    }
  }
  return t
}

export function getListingCoverUri(images: ListingImage[] | undefined | null): string | undefined {
  if (!images?.length) return undefined
  const img = images.find((i) => i.isCover) ?? images[0]
  return (
    normalizeCloudinaryUri(img.thumbnailUrl) ??
    normalizeCloudinaryUri(img.imageUrl) ??
    normalizeCloudinaryUri(img.detailUrl)
  )
}

export function getListingHeroUri(img: ListingImage | undefined): string | undefined {
  if (!img) return undefined
  return (
    normalizeCloudinaryUri(img.detailUrl) ??
    normalizeCloudinaryUri(img.imageUrl) ??
    normalizeCloudinaryUri(img.thumbnailUrl)
  )
}

export function getListingThumbUri(img: ListingImage | undefined): string | undefined {
  if (!img) return undefined
  return (
    normalizeCloudinaryUri(img.thumbnailUrl) ??
    normalizeCloudinaryUri(img.imageUrl) ??
    normalizeCloudinaryUri(img.detailUrl)
  )
}
