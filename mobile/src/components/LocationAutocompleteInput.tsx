import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import {
  createLocationSearchSessionToken,
  fetchLocationDetails,
  fetchLocationSuggestions,
  hasGoogleMapsKey,
  type LocationSuggestion,
  type SelectedPlaceLocation,
} from '../lib/googleMaps'

type Props = {
  inputValue: string
  onInputValueChange: (v: string) => void
  selected: SelectedPlaceLocation | null
  onSelect: (loc: SelectedPlaceLocation) => void
  onClear: () => void
}

export function LocationAutocompleteInput({
  inputValue,
  onInputValueChange,
  selected,
  onSelect,
  onClear,
}: Props) {
  const sessionRef = useRef(createLocationSearchSessionToken())
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!hasGoogleMapsKey()) {
      setSuggestions([])
      return
    }

    const q = inputValue.trim()
    if (q.length < 3) {
      setSuggestions([])
      return
    }

    if (selected && q === selected.locationName.trim()) {
      setSuggestions([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      setErr(null)
      void fetchLocationSuggestions(q, sessionRef.current)
        .then((res) => setSuggestions(res.suggestions))
        .catch((e: Error) => setErr(e.message))
        .finally(() => setLoading(false))
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [inputValue, selected])

  async function pick(s: LocationSuggestion) {
    setLoading(true)
    setErr(null)
    try {
      const details = await fetchLocationDetails(s.placeId, sessionRef.current)
      onSelect({
        locationName: details.locationName,
        latitude: details.latitude,
        longitude: details.longitude,
      })
      onInputValueChange(details.locationName)
      setSuggestions([])
      sessionRef.current = createLocationSearchSessionToken()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load place.')
    } finally {
      setLoading(false)
    }
  }

  if (!hasGoogleMapsKey()) {
    return (
      <Text style={styles.hintMuted}>
        Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to enable Google address search (same key as web).
      </Text>
    )
  }

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          onChangeText={onInputValueChange}
          placeholder="Start typing address (min 3 characters)"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={inputValue}
        />
        {selected ? (
          <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      {err ? <Text style={styles.err}>{err}</Text> : null}
      {suggestions.length > 0 ? (
        <FlatList
          data={suggestions}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.placeId}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => void pick(item)} style={styles.suggestion}>
              <Text style={styles.sugPrimary}>{item.primaryText}</Text>
              {item.secondaryText ? (
                <Text style={styles.sugSecondary}>{item.secondaryText}</Text>
              ) : null}
            </TouchableOpacity>
          )}
          style={styles.sugList}
        />
      ) : null}
      {selected ? (
        <Text style={styles.pinned}>
          Pinned on map · {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  hintMuted: { fontSize: fontSizes.xs, color: colors.textTertiary, lineHeight: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  clearBtn: { padding: spacing.sm },
  clearText: { fontSize: fontSizes.sm, color: colors.primary, fontWeight: fontWeights.semibold },
  loader: { marginTop: spacing.sm },
  err: { color: colors.urgent, fontSize: fontSizes.xs, marginTop: spacing.xs },
  sugList: {
    maxHeight: 200,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  suggestion: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sugPrimary: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.textPrimary },
  sugSecondary: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 2 },
  pinned: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: spacing.xs },
})
