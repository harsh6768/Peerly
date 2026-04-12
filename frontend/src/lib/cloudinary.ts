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

export async function uploadListingImageToCloudinary(
  file: File,
  sessionToken: string,
  listingId?: string,
): Promise<ListingImageUploadPayload> {
  let signedUpload: SignedUploadSignature

  try {
    signedUpload = await apiRequest<SignedUploadSignature>('/listings/upload-signature', {
      method: 'POST',
      token: sessionToken,
      body: JSON.stringify(listingId ? { listingId } : {}),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to prepare secure image upload.'

    if (
      message.includes('Cannot POST /api/listings/upload-signature') ||
      message.includes('Failed to fetch') ||
      message.includes('Something went wrong while calling the API.')
    ) {
      throw new Error(
        'Secure image upload is unavailable right now. Restart the backend so the latest listings upload route is loaded, then try again.',
      )
    }

    throw error
  }

  const formData = new FormData()
  formData.append('file', file)
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
    const payload = (await tryParseJson(response)) as { error?: { message?: string } } | undefined
    throw new Error(payload?.error?.message ?? 'Unable to upload image to Cloudinary.')
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
  if (assetIds.length === 0) {
    return
  }

  await apiRequest('/listings/cleanup-uploads', {
    method: 'POST',
    token: sessionToken,
    body: JSON.stringify({ assetIds }),
  })
}

async function tryParseJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}
