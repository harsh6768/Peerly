const WIDTHS = { thumb: 320, card: 640, detail: 1200 } as const

export type ListingImageVariant = keyof typeof WIDTHS

export function getListingImageUrl(publicId: string, variant: ListingImageVariant): string {
  const cloud = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()
  if (!cloud || !publicId?.trim()) {
    return ''
  }
  const w = WIDTHS[variant]
  const normalized = publicId.split('/').map(encodeURIComponent).join('/')
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,c_limit,w_${w}/${normalized}`
}
