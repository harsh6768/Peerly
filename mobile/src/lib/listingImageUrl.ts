const WIDTHS = { thumb: 320, card: 640, detail: 1200 } as const

export type ListingImageVariant = keyof typeof WIDTHS

const LEGACY_CLOUDINARY_LISTING_PREFIX = 'trusted-network/'

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

export function getListingImageUrl(publicId: string, variant: ListingImageVariant): string {
  const cloud = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()
  if (!cloud || !publicId?.trim()) {
    return ''
  }
  const w = WIDTHS[variant]
  const forDelivery = normalizeListingImagePublicIdForDelivery(publicId)
  const normalized = forDelivery.split('/').map(encodeURIComponent).join('/')
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,c_limit,w_${w}/${normalized}`
}
