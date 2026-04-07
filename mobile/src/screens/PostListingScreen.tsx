import { useEffect, useState } from 'react'
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '../components/Button'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { RootStackScreenProps } from '../navigation/types'

type Props = RootStackScreenProps<'PostListing'>

type PropertyType = 'ROOM' | 'STUDIO' | 'APARTMENT' | 'PG' | 'HOUSE'
type OccupancyType = 'SINGLE' | 'DOUBLE' | 'SHARED'
type ContactMode = 'WHATSAPP' | 'CALL' | 'CHAT'

const propertyTypes: { label: string; value: PropertyType }[] = [
  { label: 'Room', value: 'ROOM' },
  { label: 'Studio', value: 'STUDIO' },
  { label: 'Apartment', value: 'APARTMENT' },
  { label: 'PG', value: 'PG' },
  { label: 'House', value: 'HOUSE' },
]

const occupancyTypes: { label: string; value: OccupancyType }[] = [
  { label: 'Single', value: 'SINGLE' },
  { label: 'Double', value: 'DOUBLE' },
  { label: 'Shared', value: 'SHARED' },
]

const standardAmenities = [
  'Wifi', 'Parking', 'Washing machine', 'Fridge', 'Power backup',
  'Lift', 'Gated security', 'Gym', 'Air conditioning', 'Balcony',
]

const majorCities = [
  'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune',
  'Chennai', 'Gurgaon', 'Noida',
]

type PillProps = {
  label: string
  active: boolean
  onPress: () => void
}

function SelectPill({ label, active, onPress }: PillProps) {
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

type FormState = {
  title: string
  city: string
  locality: string
  rentAmount: string
  depositAmount: string
  maintenanceAmount: string
  propertyType: PropertyType | ''
  occupancyType: OccupancyType | ''
  amenities: string[]
  moveInDate: string
  contactPhone: string
  description: string
  contactMode: ContactMode
}

const defaultForm: FormState = {
  title: '',
  city: '',
  locality: '',
  rentAmount: '',
  depositAmount: '',
  maintenanceAmount: '',
  propertyType: '',
  occupancyType: '',
  amenities: [],
  moveInDate: '',
  contactPhone: '',
  description: '',
  contactMode: 'WHATSAPP',
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {label}{required ? <Text style={{ color: colors.urgent }}> *</Text> : null}
    </Text>
  )
}

export function PostListingScreen({ route, navigation }: Props) {
  const { sessionToken, user } = useAuth()
  const insets = useSafeAreaInsets()
  const [form, setForm] = useState<FormState>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function update(key: keyof FormState, value: string | string[]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleAmenity(amenity: string) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  async function saveDraft() {
    await submitListing('DRAFT')
  }

  async function publishListing() {
    if (!form.title.trim()) {
      Alert.alert('Title required', 'Please add a title for your listing.')
      return
    }
    if (!form.city) {
      Alert.alert('City required', 'Please select the city for your listing.')
      return
    }
    if (!form.rentAmount) {
      Alert.alert('Rent required', 'Please enter the monthly rent amount.')
      return
    }
    await submitListing('PUBLISHED')
  }

  async function submitListing(status: 'DRAFT' | 'PUBLISHED') {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to post a listing.')
      navigation.navigate('Auth')
      return
    }

    setIsSubmitting(true)
    try {
      await apiRequest('/listings', {
        method: 'POST',
        token: sessionToken,
        body: JSON.stringify({
          ownerUserId: user.id,           // required by CreateListingDto
          title: form.title.trim(),
          city: form.city || undefined,
          locality: form.locality.trim() || undefined,
          rentAmount: form.rentAmount ? Number(form.rentAmount) : undefined,
          depositAmount: form.depositAmount ? Number(form.depositAmount) : undefined,
          maintenanceAmount: form.maintenanceAmount ? Number(form.maintenanceAmount) : undefined,
          propertyType: form.propertyType || undefined,
          occupancyType: form.occupancyType || undefined,
          amenities: form.amenities.length > 0 ? form.amenities : undefined,
          moveInDate: form.moveInDate || undefined,
          contactPhone: form.contactPhone.trim() || undefined,
          description: form.description.trim() || undefined,
          contactMode: form.contactMode,
          status,
        }),
      })
      Alert.alert(
        status === 'PUBLISHED' ? 'Listing published!' : 'Draft saved',
        status === 'PUBLISHED'
          ? 'Your listing is now live.'
          : 'Your draft has been saved. Publish it when ready.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      )
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save listing.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom }]}>
        <Text style={styles.guestTitle}>Sign in to post</Text>
        <Text style={styles.guestText}>Create an account to list your room and find a tenant replacement.</Text>
        <Button onPress={() => navigation.navigate('Auth')}>Sign in</Button>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Post a listing</Text>
        <Text style={styles.pageSubtitle}>Fill in the details to help tenants find your room.</Text>

        <View style={styles.section}>
          <FieldLabel label="Listing title" required />
          <TextInput
            onChangeText={(v) => update('title', v)}
            placeholder="e.g. Private room in 3BHK near Koramangala metro"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={form.title}
          />
        </View>

        <View style={styles.section}>
          <FieldLabel label="City" required />
          <View style={styles.pillRow}>
            {majorCities.map((c) => (
              <SelectPill
                key={c}
                active={form.city === c}
                label={c}
                onPress={() => update('city', form.city === c ? '' : c)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <FieldLabel label="Locality / area" />
          <TextInput
            onChangeText={(v) => update('locality', v)}
            placeholder="e.g. Indiranagar, HSR Layout"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={form.locality}
          />
        </View>

        <View style={styles.section}>
          <FieldLabel label="Monthly rent (₹)" required />
          <TextInput
            keyboardType="numeric"
            onChangeText={(v) => update('rentAmount', v)}
            placeholder="e.g. 22000"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={form.rentAmount}
          />
        </View>

        <View style={styles.section}>
          <FieldLabel label="Deposit (₹)" />
          <TextInput
            keyboardType="numeric"
            onChangeText={(v) => update('depositAmount', v)}
            placeholder="e.g. 44000"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={form.depositAmount}
          />
        </View>

        <View style={styles.section}>
          <FieldLabel label="Maintenance (₹/mo)" />
          <TextInput
            keyboardType="numeric"
            onChangeText={(v) => update('maintenanceAmount', v)}
            placeholder="e.g. 1500"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={form.maintenanceAmount}
          />
        </View>

        <View style={styles.section}>
          <FieldLabel label="Property type" />
          <View style={styles.pillRow}>
            {propertyTypes.map(({ label, value }) => (
              <SelectPill
                key={value}
                active={form.propertyType === value}
                label={label}
                onPress={() => update('propertyType', form.propertyType === value ? '' : value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <FieldLabel label="Occupancy" />
          <View style={styles.pillRow}>
            {occupancyTypes.map(({ label, value }) => (
              <SelectPill
                key={value}
                active={form.occupancyType === value}
                label={label}
                onPress={() => update('occupancyType', form.occupancyType === value ? '' : value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <FieldLabel label="Amenities" />
          <View style={styles.pillRow}>
            {standardAmenities.map((a) => (
              <SelectPill
                key={a}
                active={form.amenities.includes(a)}
                label={a}
                onPress={() => toggleAmenity(a)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <FieldLabel label="Move-in date" />
          <TextInput
            onChangeText={(v) => update('moveInDate', v)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={form.moveInDate}
          />
        </View>

        <View style={styles.section}>
          <FieldLabel label="Contact phone" />
          <TextInput
            keyboardType="phone-pad"
            onChangeText={(v) => update('contactPhone', v)}
            placeholder="e.g. 9876543210"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={form.contactPhone}
          />
        </View>

        <View style={styles.section}>
          <FieldLabel label="Description" />
          <TextInput
            multiline
            numberOfLines={5}
            onChangeText={(v) => update('description', v)}
            placeholder="Describe the room, building, and neighborhood. Be specific — it helps tenants decide faster."
            placeholderTextColor={colors.textSecondary}
            style={styles.textArea}
            value={form.description}
          />
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Button
          loading={isSubmitting}
          onPress={() => void publishListing()}
          style={{ flex: 1 }}
        >
          Publish
        </Button>
        <Button
          loading={isSubmitting}
          onPress={() => void saveDraft()}
          style={{ flex: 1 }}
          variant="secondary"
        >
          Save draft
        </Button>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  guestTitle: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.textPrimary, textAlign: 'center' },
  guestText: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  scroll: { padding: spacing.md },
  pageTitle: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  pageSubtitle: { fontSize: fontSizes.base, color: colors.textSecondary, marginBottom: spacing.lg },
  section: { marginBottom: spacing.md },
  fieldLabel: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.textPrimary, marginBottom: spacing.xs },
  input: {
    height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, fontSize: fontSizes.base, color: colors.textPrimary, backgroundColor: colors.white,
  },
  textArea: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, fontSize: fontSizes.base, color: colors.textPrimary,
    backgroundColor: colors.white, minHeight: 130, textAlignVertical: 'top',
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primaryLight, borderColor: 'rgba(108, 99, 255, 0.3)' },
  pillText: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.textSecondary },
  pillTextActive: { color: colors.primaryDark, fontWeight: fontWeights.semibold },
  actions: {
    flexDirection: 'row', gap: spacing.sm,
    padding: spacing.md, backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 8,
  },
})
