import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { DatePickerField } from '../components/DatePickerField'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { HousingNeed } from '../lib/types'

const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Gurgaon', 'Noida']

const propertyTypes: { label: string; value: string }[] = [
  { label: 'Apartment', value: 'APARTMENT' },
  { label: 'Room', value: 'ROOM' },
  { label: 'Studio', value: 'STUDIO' },
  { label: 'PG', value: 'PG' },
  { label: 'House', value: 'HOUSE' },
]

const occupancyTypes: { label: string; value: string }[] = [
  { label: 'Single', value: 'SINGLE' },
  { label: 'Double', value: 'DOUBLE' },
  { label: 'Shared', value: 'SHARED' },
]

const urgencyOptions: { label: string; value: string }[] = [
  { label: 'Flexible', value: 'FLEXIBLE' },
  { label: 'This week', value: 'THIS_WEEK' },
  { label: 'Immediate', value: 'IMMEDIATE' },
]

const amenitiesPick = ['Wifi', 'Parking', 'Gym', 'Power backup', 'Gated security', 'Lift']

function Pill({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

export function RoomNeedScreen() {
  const navigation = useNavigation()
  const { sessionToken, user } = useAuth()
  const insets = useSafeAreaInsets()

  const [needs, setNeeds] = useState<HousingNeed[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [saving, setSaving] = useState(false)

  const [city, setCity] = useState('')
  const [locality, setLocality] = useState('')
  const [maxRent, setMaxRent] = useState('')
  const [maxDeposit, setMaxDeposit] = useState('')
  const [maxMaint, setMaxMaint] = useState('')
  const [propertyType, setPropertyType] = useState('APARTMENT')
  const [occupancy, setOccupancy] = useState('SHARED')
  const [moveInDate, setMoveInDate] = useState('')
  const [urgency, setUrgency] = useState('FLEXIBLE')
  const [notes, setNotes] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])

  const moveInMinimumDate = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const fetchMine = useCallback(async () => {
    if (!sessionToken) return
    try {
      const data = await apiRequest<HousingNeed[]>('/housing-needs/mine', { token: sessionToken })
      setNeeds(Array.isArray(data) ? data : [])
    } catch {
      setNeeds([])
    }
  }, [sessionToken])

  useEffect(() => {
    setLoadingList(true)
    void fetchMine().finally(() => setLoadingList(false))
  }, [fetchMine])

  function toggleAmenity(a: string) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  async function saveNeed() {
    if (!user || !sessionToken) {
      Alert.alert('Sign in', 'Please sign in from the Profile tab.')
      return
    }
    if (!city.trim()) {
      Alert.alert('City required', 'Select a city.')
      return
    }
    if (!moveInDate.trim()) {
      Alert.alert('Move-in date', 'Enter move-in as YYYY-MM-DD.')
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        city: city.trim(),
        preferredPropertyType: propertyType,
        preferredOccupancy: occupancy,
        moveInDate: new Date(`${moveInDate.trim()}T12:00:00.000Z`).toISOString(),
        urgencyLevel: urgency,
        preferredContactMode: 'WHATSAPP',
        preferredAmenities: amenities,
      }
      if (locality.trim()) body.locality = locality.trim()
      if (maxRent.trim()) body.maxRentAmount = Number(maxRent)
      if (maxDeposit.trim()) body.maxDepositAmount = Number(maxDeposit)
      if (maxMaint.trim()) body.maxMaintenanceAmount = Number(maxMaint)
      if (notes.trim()) body.notes = notes.trim()

      await apiRequest('/housing-needs', {
        method: 'POST',
        token: sessionToken,
        body: JSON.stringify(body),
      })
      Alert.alert('Saved', 'Your room need is live. We use it to rank better matches.')
      setNotes('')
      void fetchMine()
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom + 100 }]}>
        <Text style={styles.guestTitle}>Your room need</Text>
        <Text style={styles.guestText}>
          Sign in to post what you are looking for so Cirvo can rank listings for you.
        </Text>
        <Button onPress={() => navigation.navigate('Profile' as never)}>Go to sign in</Button>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Room need</Text>
        <Text style={styles.pageSub}>
          Short structured preferences — we use them to sort the feed toward stronger matches.
        </Text>

        {loadingList ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
        ) : needs.length > 0 ? (
          <View style={styles.listSection}>
            <Text style={styles.sectionLabel}>Your active posts</Text>
            {needs.map((n) => (
              <View key={n.id} style={styles.needCard}>
                <View style={styles.needTop}>
                  <Text style={styles.needLoc}>
                    {n.locality ? `${n.locality}, ${n.city}` : n.city}
                  </Text>
                  <Badge tone={n.status === 'OPEN' ? 'green' : 'gray'}>{n.status}</Badge>
                </View>
                {n.maxRentAmount ? (
                  <Text style={styles.needMeta}>Up to ₹{n.maxRentAmount.toLocaleString('en-IN')}/mo</Text>
                ) : null}
                <Text style={styles.needDate}>
                  Move-in {new Date(n.moveInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Post or update preferences</Text>

        <Text style={styles.fieldLabel}>City</Text>
        <View style={styles.pillRow}>
          {cities.map((c) => (
            <Pill key={c} active={city === c} label={c} onPress={() => setCity(city === c ? '' : c)} />
          ))}
        </View>

        <Text style={styles.fieldLabel}>Locality / area</Text>
        <TextInput
          onChangeText={setLocality}
          placeholder="e.g. Koramangala, Whitefield"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          value={locality}
        />

        <Text style={styles.fieldLabel}>Max rent (₹/mo)</Text>
        <TextInput
          keyboardType="numeric"
          onChangeText={setMaxRent}
          placeholder="e.g. 25000"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          value={maxRent}
        />

        <Text style={styles.fieldLabel}>Max deposit (₹)</Text>
        <TextInput
          keyboardType="numeric"
          onChangeText={setMaxDeposit}
          placeholder="Optional"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          value={maxDeposit}
        />

        <Text style={styles.fieldLabel}>Maintenance (₹/mo)</Text>
        <TextInput
          keyboardType="numeric"
          onChangeText={setMaxMaint}
          placeholder="Optional"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          value={maxMaint}
        />

        <Text style={styles.fieldLabel}>Property type</Text>
        <View style={styles.pillRow}>
          {propertyTypes.map((p) => (
            <Pill
              key={p.value}
              active={propertyType === p.value}
              label={p.label}
              onPress={() => setPropertyType(p.value)}
            />
          ))}
        </View>

        <Text style={styles.fieldLabel}>Occupancy</Text>
        <View style={styles.pillRow}>
          {occupancyTypes.map((p) => (
            <Pill key={p.value} active={occupancy === p.value} label={p.label} onPress={() => setOccupancy(p.value)} />
          ))}
        </View>

        <Text style={styles.fieldLabel}>Move-in date</Text>
        <DatePickerField
          minimumDate={moveInMinimumDate}
          onChange={setMoveInDate}
          placeholder="Select move-in date"
          value={moveInDate}
        />

        <Text style={styles.fieldLabel}>Urgency</Text>
        <View style={styles.pillRow}>
          {urgencyOptions.map((p) => (
            <Pill key={p.value} active={urgency === p.value} label={p.label} onPress={() => setUrgency(p.value)} />
          ))}
        </View>

        <Text style={styles.fieldLabel}>Amenities</Text>
        <View style={styles.pillRow}>
          {amenitiesPick.map((a) => (
            <Pill key={a} active={amenities.includes(a)} label={a} onPress={() => toggleAmenity(a)} />
          ))}
        </View>

        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput
          multiline
          numberOfLines={4}
          onChangeText={setNotes}
          placeholder="Anything else hosts should know"
          placeholderTextColor={colors.textTertiary}
          style={styles.textArea}
          value={notes}
        />

        <Button fullWidth loading={saving} onPress={() => void saveNeed()}>
          Save room need
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  guestTitle: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  guestText: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  scroll: { padding: spacing.md },
  pageTitle: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold, color: colors.textPrimary },
  pageSub: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 20 },
  sectionLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textTertiary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  listSection: { marginBottom: spacing.lg },
  needCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  needTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  needLoc: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.textPrimary, flex: 1 },
  needMeta: { fontSize: fontSizes.sm, color: colors.primary, fontWeight: fontWeights.semibold },
  needDate: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 4 },
  fieldLabel: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primaryLight, borderColor: 'rgba(79, 70, 229, 0.35)' },
  pillText: { fontSize: fontSizes.sm, color: colors.textSecondary, fontWeight: fontWeights.medium },
  pillTextActive: { color: colors.primary, fontWeight: fontWeights.semibold },
})
