/**
 * Google Places (New) — same API shape as the web app.
 * Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env (Places API enabled for the key).
 */

const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

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

export function hasGoogleMapsKey(): boolean {
  return Boolean(apiKey.trim())
}

export function createLocationSearchSessionToken(): string {
  return `mobile-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function fetchLocationSuggestions(input: string, sessionToken?: string) {
  if (!apiKey.trim()) {
    throw new Error('Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to use address search.')
  }

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
    const err = await response.text()
    throw new Error(err || 'Google Places autocomplete failed.')
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

  const suggestions =
    payload.suggestions
      ?.map((suggestion) => {
        const prediction = suggestion.placePrediction
        if (!prediction?.placeId) return null
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
      .filter((s): s is LocationSuggestion => Boolean(s))
      .slice(0, 8) ?? []

  return { suggestions }
}

export async function fetchLocationDetails(placeId: string, sessionToken?: string) {
  if (!apiKey.trim()) {
    throw new Error('Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to use address search.')
  }

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
    const err = await response.text()
    throw new Error(err || 'Google Place details failed.')
  }

  const payload = (await response.json()) as {
    id?: string
    displayName?: { text?: string }
    formattedAddress?: string
    location?: { latitude?: number; longitude?: number }
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
