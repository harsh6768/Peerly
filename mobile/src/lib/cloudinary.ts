import { apiRequest } from './api'

export type ListingImageUploadPayload = {
  assetProvider: 'CLOUDINARY'
  providerAssetId: string
  width?: number
  height?: number
  bytes?: number
  isCover?: boolean
  sortOrder?: number
}

type SignedUploadSignature = {
  cloudName: string
  apiKey: string
  timestamp: number
  folder: string
  signature: string
}

type CloudinaryUploadResponse = {
  public_id: string
  secure_url: string
  width: number
  height: number
  bytes: number
}

/**
 * Upload a local image (e.g. from expo-image-picker) to Cloudinary using a backend-signed upload.
 * Pass listingId for tenant-replacement listings (per-listing folder). Omit for legacy flows.
 */
export async function uploadListingImageToCloudinary(
  uri: string,
  mimeType: string | undefined,
  sessionToken: string,
  listingId?: string,
): Promise<ListingImageUploadPayload> {
  const signedUpload = await apiRequest<SignedUploadSignature>('/listings/upload-signature', {
    method: 'POST',
    token: sessionToken,
    body: JSON.stringify(listingId ? { listingId } : {}),
  })

  const formData = new FormData()
  // React Native file descriptor (not a web Blob)
  formData.append(
    'file',
    { uri, name: 'listing.jpg', type: mimeType ?? 'image/jpeg' } as unknown as Blob,
  )
  formData.append('api_key', signedUpload.apiKey)
  formData.append('timestamp', String(signedUpload.timestamp))
  formData.append('signature', signedUpload.signature)
  formData.append('folder', signedUpload.folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signedUpload.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    let message = 'Unable to upload image to Cloudinary.'
    try {
      const payload = (await response.json()) as { error?: { message?: string } }
      message = payload?.error?.message ?? message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  const payload = (await response.json()) as CloudinaryUploadResponse

  return {
    assetProvider: 'CLOUDINARY',
    providerAssetId: payload.public_id,
    width: payload.width,
    height: payload.height,
    bytes: payload.bytes,
  }
}

export async function cleanupUploadedListingImages(assetIds: string[], sessionToken: string) {
  if (assetIds.length === 0) return
  await apiRequest('/listings/cleanup-uploads', {
    method: 'POST',
    token: sessionToken,
    body: JSON.stringify({ assetIds }),
  })
}
