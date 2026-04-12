import { LoaderCircle, MapPin } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from './Button'
import { usePublicConfig } from '../context/PublicConfigContext'
import {
  buildGoogleMapsOpenUrl,
  buildGoogleStaticMapUrl,
  createLocationSearchSessionToken,
  fetchLocationDetails,
  fetchLocationSuggestions,
  type LocationSuggestion,
  type SelectedPlaceLocation,
} from '../lib/googleMaps'

type PlaceAutocompleteFieldProps = {
  label: string
  placeholder?: string
  helperText?: string
  inputValue: string
  onInputValueChange: (value: string) => void
  value: SelectedPlaceLocation | null
  onSelect: (value: SelectedPlaceLocation) => void
  onClear?: () => void
  showSelectionCard?: boolean
}

type AutocompleteSuggestionItem = {
  placeId: string
  mainText: string
  secondaryText: string
  fullText: string
}

export function PlaceAutocompleteField({
  label,
  placeholder = 'Search for the property on Google Maps',
  helperText,
  inputValue,
  onInputValueChange,
  value,
  onSelect,
  onClear,
  showSelectionCard = true,
}: PlaceAutocompleteFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const requestSequenceRef = useRef(0)
  const sessionTokenRef = useRef(createLocationSearchSessionToken())
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const [isFetchingLocationDetails, setIsFetchingLocationDetails] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestionItem[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    const nextQuery = inputValue.trim()
    const selectedLocationName = value?.locationName.trim() ?? ''

    if (selectedLocationName && nextQuery === selectedLocationName) {
      setSuggestions([])
      setActiveSuggestionIndex(-1)
      setShowSuggestions(false)
      setIsFetchingSuggestions(false)
      return
    }

    if (nextQuery.length < 3) {
      setSuggestions([])
      setActiveSuggestionIndex(-1)
      setShowSuggestions(false)
      setIsFetchingSuggestions(false)
      return
    }

    const debounceTimeout = window.setTimeout(async () => {
      const currentRequestSequence = requestSequenceRef.current + 1
      requestSequenceRef.current = currentRequestSequence
      setIsFetchingSuggestions(true)
      setErrorMessage(null)

      try {
        const response = await fetchLocationSuggestions(nextQuery, sessionTokenRef.current)

        if (requestSequenceRef.current !== currentRequestSequence) {
          return
        }

        const nextSuggestions =
          response.suggestions
            ?.map((suggestion) => mapSuggestion(suggestion))
            .filter((suggestion): suggestion is AutocompleteSuggestionItem => Boolean(suggestion))
            .slice(0, 5) ?? []

        setSuggestions(nextSuggestions)
        setActiveSuggestionIndex(nextSuggestions.length > 0 ? 0 : -1)
        setShowSuggestions(true)
      } catch (error) {
        setSuggestions([])
        setActiveSuggestionIndex(-1)
        setShowSuggestions(false)
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load Google place suggestions right now.',
        )
      } finally {
        setIsFetchingSuggestions(false)
      }
    }, 220)

    return () => {
      window.clearTimeout(debounceTimeout)
    }
  }, [inputValue, value?.locationName])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    return () => window.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  async function handleSuggestionSelect(suggestion: AutocompleteSuggestionItem) {
    try {
      setIsFetchingLocationDetails(true)
      setErrorMessage(null)

      const location = await fetchLocationDetails(suggestion.placeId, sessionTokenRef.current)

      onInputValueChange(location.locationName)
      setSuggestions([])
      setActiveSuggestionIndex(-1)
      setShowSuggestions(false)
      onSelect(location)
      sessionTokenRef.current = createLocationSearchSessionToken()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load the selected location right now.',
      )
    } finally {
      setIsFetchingLocationDetails(false)
    }
  }

  function handleInputChange(nextValue: string) {
    onInputValueChange(nextValue)
    setShowSuggestions(nextValue.trim().length >= 3)

    const normalizedNextValue = nextValue.trim()
    const normalizedSelectedValue = value?.locationName.trim() ?? ''

    if (!normalizedNextValue) {
      setSuggestions([])
      setActiveSuggestionIndex(-1)
      setErrorMessage(null)
      sessionTokenRef.current = createLocationSearchSessionToken()
      onClear?.()
      return
    }

    if (normalizedSelectedValue && normalizedNextValue !== normalizedSelectedValue) {
      sessionTokenRef.current = createLocationSearchSessionToken()
      onClear?.()
    }
  }

  async function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) {
      if (event.key === 'Escape') {
        setShowSuggestions(false)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1))
      return
    }

    if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
      event.preventDefault()
      await handleSuggestionSelect(suggestions[activeSuggestionIndex])
      return
    }

    if (event.key === 'Escape') {
      setSuggestions([])
      setActiveSuggestionIndex(-1)
    }
  }

  return (
    <div className="field" ref={containerRef}>
      <label>{label}</label>
      <div className="location-autocomplete-shell">
        <div className="location-autocomplete-input-wrap">
          <input
            autoComplete="off"
            className="location-autocomplete-input"
            onChange={(event) => handleInputChange(event.target.value)}
            onFocus={() => {
              const nextQuery = inputValue.trim()
              const selectedLocationName = value?.locationName.trim() ?? ''
              setShowSuggestions(nextQuery.length >= 3 && nextQuery !== selectedLocationName)
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            ref={inputRef}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-label={label}
            value={inputValue}
          />

          {(isFetchingSuggestions || isFetchingLocationDetails) && (
            <span className="location-autocomplete-spinner">
              <LoaderCircle className="spin" size={16} />
            </span>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="location-autocomplete-suggestions">
            {suggestions.map((suggestion, index) => (
              <button
                className={`location-autocomplete-option${index === activeSuggestionIndex ? ' active' : ''}`}
                key={suggestion.placeId}
                onMouseDown={(event) => {
                  event.preventDefault()
                  void handleSuggestionSelect(suggestion)
                }}
                onMouseEnter={() => setActiveSuggestionIndex(index)}
                type="button"
              >
                <span className="location-autocomplete-option-main">{suggestion.mainText}</span>
                {suggestion.secondaryText && <span>{suggestion.secondaryText}</span>}
              </button>
            ))}
          </div>
        )}

        {showSuggestions && !isFetchingSuggestions && inputValue.trim().length >= 3 && suggestions.length === 0 && !errorMessage && (
          <div className="location-autocomplete-empty">No matching places yet. Try a more specific locality or street.</div>
        )}
      </div>

      {errorMessage && <p className="helper-copy">{errorMessage}</p>}
      {helperText && !errorMessage && <p className="helper-copy">{helperText}</p>}

      {showSelectionCard && <LocationSummaryCard location={value} onClear={onClear} />}
    </div>
  )
}

function mapSuggestion(suggestion: LocationSuggestion): AutocompleteSuggestionItem | null {
  if (!suggestion.placeId) {
    return null
  }

  return {
    placeId: suggestion.placeId,
    mainText: suggestion.primaryText || suggestion.fullText || 'Suggested place',
    secondaryText: suggestion.secondaryText,
    fullText: suggestion.fullText,
  }
}

type LocationSummaryCardProps = {
  location: SelectedPlaceLocation | null
  onClear?: () => void
  compact?: boolean
  /** When false, hide lat/lng line (e.g. listing detail — address is enough). */
  showCoordinates?: boolean
}

export function LocationSummaryCard({
  location,
  onClear,
  compact = false,
  showCoordinates = true,
}: LocationSummaryCardProps) {
  const { staticMapPreviewEnabled } = usePublicConfig()
  const [previewFailed, setPreviewFailed] = useState(false)

  useEffect(() => {
    setPreviewFailed(false)
  }, [location?.latitude, location?.longitude])

  if (!location) {
    return null
  }

  const staticMapUrl =
    staticMapPreviewEnabled &&
    buildGoogleStaticMapUrl(location.latitude, location.longitude)

  return (
    <div className={`location-summary-card${compact ? ' compact' : ''}`}>
      <div className="location-summary-head">
        <div className="location-summary-title">
          <MapPin className="location-summary-pin" size={18} />
          <div>
            <strong>{location.locationName}</strong>
            {showCoordinates ? (
              <p>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            ) : null}
          </div>
        </div>
        {onClear && (
          <Button onClick={onClear} variant="ghost">
            Clear
          </Button>
        )}
      </div>

      {staticMapUrl && !previewFailed && (
        <div className="location-summary-preview">
          <img
            alt={`Map preview for ${location.locationName}`}
            loading="lazy"
            onError={() => setPreviewFailed(true)}
            src={staticMapUrl}
          />
        </div>
      )}

      <div className="location-summary-actions">
        <Button
          onClick={() => window.open(buildGoogleMapsOpenUrl(location.latitude, location.longitude), '_blank', 'noopener,noreferrer')}
          variant="secondary"
        >
          Open in Maps
        </Button>
      </div>
    </div>
  )
}
