export type ListingImageVariant = 'thumb' | 'card' | 'detail'

const WIDTHS: Record<ListingImageVariant, number> = {
  thumb: 320,
  card: 640,
  detail: 1200,
}

const LEGACY_CLOUDINARY_LISTING_PREFIX = 'trusted-network/'

/**
 * Map stored public_ids that still use the legacy folder to `cirvo/…` in delivery URLs.
 * Use after assets exist under `cirvo/listings/…` in Cloudinary (rename/move) or for new data; otherwise the URL may 404.
 */
export function normalizeListingImagePublicIdForDelivery(publicId: string): string {
  const t = publicId.trim()
  const legacy = LEGACY_CLOUDINARY_LISTING_PREFIX
  if (
    t.length >= legacy.length &&
    t.slice(0, legacy.length).toLowerCase() === legacy
  ) {
    return `cirvo/${t.slice(legacy.length)}`
  }
  return t
}

/** Set by `PublicConfigProvider` when `VITE_CLOUDINARY_CLOUD_NAME` is not set at build time. */
let runtimeCloudinaryCloudName = ''

export function setRuntimeCloudinaryCloudName(name: string) {
  runtimeCloudinaryCloudName = (name || '').trim()
}

/**
 * Build a Cloudinary delivery URL from a stored public_id (no persisted URLs in DB).
 */
export function getListingImageUrl(publicId: string, variant: ListingImageVariant): string {
  const cloud =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() ||
    runtimeCloudinaryCloudName ||
    ''
  if (!cloud || !publicId?.trim()) {
    return ''
  }

  const w = WIDTHS[variant]
  const forDelivery = normalizeListingImagePublicIdForDelivery(publicId)
  const normalized = forDelivery.split('/').map(encodeURIComponent).join('/')
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,c_limit,w_${w}/${normalized}`
}
