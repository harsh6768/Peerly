import type { ListingImage } from './types'
import { getListingImageUrl } from './listingImageUrl'

export function getListingCoverUri(images: ListingImage[] | undefined | null): string | undefined {
  if (!images?.length) return undefined
  const img = images.find((i) => i.isCover) ?? images[0]
  const u = getListingImageUrl(img.providerAssetId, 'card')
  return u || undefined
}

export function getListingHeroUri(img: ListingImage | undefined): string | undefined {
  if (!img) return undefined
  const u = getListingImageUrl(img.providerAssetId, 'detail')
  return u || undefined
}

export function getListingThumbUri(img: ListingImage | undefined): string | undefined {
  if (!img) return undefined
  const u = getListingImageUrl(img.providerAssetId, 'thumb')
  return u || undefined
}
