export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export type SelectedPlaceLocation = {
  locationName: string
  latitude: number
  longitude: number
}

export type LocationSuggestion = {
  placeId: string
  primaryText: string
  secondaryText: string
  fullText: string
}

export function createLocationSearchSessionToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `location-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function fetchLocationSuggestions(input: string, sessionToken?: string) {
  const apiKey = getGoogleMapsApiKey()

  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text',
    },
    body: JSON.stringify({
      input: input.trim(),
      includedRegionCodes: ['in'],
      ...(sessionToken ? { sessionToken } : {}),
    }),
  })

  if (!response.ok) {
    throw new Error(await extractGooglePlacesError(response))
  }

  const payload = (await response.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string
        text?: { text?: string }
        structuredFormat?: {
          mainText?: { text?: string }
          secondaryText?: { text?: string }
        }
      }
    }>
  }

  return {
    suggestions:
      payload.suggestions
        ?.map((suggestion) => {
          const prediction = suggestion.placePrediction

          if (!prediction?.placeId) {
            return null
          }

          const primaryText = prediction.structuredFormat?.mainText?.text?.trim() ?? ''
          const secondaryText = prediction.structuredFormat?.secondaryText?.text?.trim() ?? ''
          const fullText =
            prediction.text?.text?.trim() ?? [primaryText, secondaryText].filter(Boolean).join(', ')

          return {
            placeId: prediction.placeId,
            primaryText: primaryText || fullText || 'Suggested place',
            secondaryText,
            fullText: fullText || primaryText || secondaryText || 'Suggested place',
          } satisfies LocationSuggestion
        })
        .filter((suggestion): suggestion is LocationSuggestion => Boolean(suggestion))
        .slice(0, 5) ?? [],
  }
}

export async function fetchLocationDetails(placeId: string, sessionToken?: string) {
  const apiKey = getGoogleMapsApiKey()

  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId.trim())}`)
  url.searchParams.set('languageCode', 'en')
  url.searchParams.set('regionCode', 'IN')
  if (sessionToken) {
    url.searchParams.set('sessionToken', sessionToken)
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
    },
  })

  if (!response.ok) {
    throw new Error(await extractGooglePlacesError(response))
  }

  const payload = (await response.json()) as {
    id?: string
    displayName?: { text?: string }
    formattedAddress?: string
    location?: {
      latitude?: number
      longitude?: number
    }
  }

  const latitude = payload.location?.latitude
  const longitude = payload.location?.longitude

  if (latitude == null || longitude == null) {
    throw new Error('Google returned a place without coordinates.')
  }

  return {
    placeId: payload.id ?? placeId,
    locationName: payload.formattedAddress ?? payload.displayName?.text ?? placeId,
    latitude,
    longitude,
  }
}

export function buildGoogleMapsOpenUrl(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    api: '1',
    query: `${latitude},${longitude}`,
  })

  return `https://www.google.com/maps/search/?${params.toString()}`
}

export function buildGoogleStaticMapUrl(latitude: number, longitude: number) {
  if (!googleMapsApiKey) {
    return null
  }

  const params = new URLSearchParams({
    center: `${latitude},${longitude}`,
    zoom: '15',
    size: '640x280',
    scale: '2',
    maptype: 'roadmap',
    language: 'en',
    region: 'IN',
    markers: `color:0x6c63ff|${latitude},${longitude}`,
    key: googleMapsApiKey,
  })

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
}

function getGoogleMapsApiKey() {
  if (!googleMapsApiKey) {
    throw new Error('Add VITE_GOOGLE_MAPS_API_KEY to the frontend to use location search.')
  }

  return googleMapsApiKey
}

async function extractGooglePlacesError(response: Response) {
  try {
    const payload = (await response.json()) as
      | {
          error?: {
            message?: string
          }
        }
      | undefined

    return payload?.error?.message ?? 'Google location search failed.'
  } catch {
    return 'Google location search failed.'
  }
}
