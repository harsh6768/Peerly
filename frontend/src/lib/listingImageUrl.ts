export type ListingImageVariant = 'thumb' | 'card' | 'detail'

const WIDTHS: Record<ListingImageVariant, number> = {
  thumb: 320,
  card: 640,
  detail: 1200,
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
  const normalized = publicId.split('/').map(encodeURIComponent).join('/')
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,c_limit,w_${w}/${normalized}`
}
