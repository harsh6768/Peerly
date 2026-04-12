import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { useState } from 'react'
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
import { DatePickerField } from '../components/DatePickerField'
import { LocationAutocompleteInput } from '../components/LocationAutocompleteInput'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import { bangaloreCompanies, bangaloreTechParks } from '../lib/bangaloreNearby'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import { cleanupUploadedListingImages, type ListingImageUploadPayload, uploadListingImageToCloudinary } from '../lib/cloudinary'
import type { SelectedPlaceLocation } from '../lib/googleMaps'
import { getListingImageUrl } from '../lib/listingImageUrl'
import type { Listing } from '../lib/types'
import type { RootStackScreenProps } from '../navigation/types'

type Props = RootStackScreenProps<'PostListing'>

type LocalPhotoRow = {
  id: string
  localUri: string
  mimeType: string
  upload?: ListingImageUploadPayload
}

type PropertyType = 'ROOM' | 'STUDIO' | 'APARTMENT' | 'PG' | 'HOUSE'
type OccupancyType = 'SINGLE' | 'DOUBLE' | 'SHARED'
type ContactMode = 'WHATSAPP' | 'CALL' | 'CHAT'
type NearbyPlaceType = 'tech_park' | 'company'

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

/** Floating tab bar in RootNavigator: height 62 + margin above home indicator */
const TAB_BAR_CLEARANCE = 74

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

export function PostListingScreen({ navigation }: Props) {
  const { sessionToken, user } = useAuth()
  const insets = useSafeAreaInsets()
  const [form, setForm] = useState<FormState>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoRows, setPhotoRows] = useState<LocalPhotoRow[]>([])
  const [isPhotoUploadPhase, setIsPhotoUploadPhase] = useState(false)
  const [addressInput, setAddressInput] = useState('')
  const [pinnedLocation, setPinnedLocation] = useState<SelectedPlaceLocation | null>(null)
  const [nearbyPlaces, setNearbyPlaces] = useState<Array<{ name: string; type: NearbyPlaceType }>>([])
  const [nearbyKind, setNearbyKind] = useState<NearbyPlaceType>('tech_park')
  const [customNearby, setCustomNearby] = useState('')

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

  function addNearby(name: string, type: NearbyPlaceType) {
    const trimmed = name.trim().replace(/\s+/g, ' ')
    if (!trimmed) return
    if (nearbyPlaces.length >= 5) {
      Alert.alert('Limit', 'You can add up to 5 nearby workplaces.')
      return
    }
    if (nearbyPlaces.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return
    setNearbyPlaces((prev) => [...prev, { name: trimmed, type }])
  }

  function removeNearby(name: string) {
    setNearbyPlaces((prev) => prev.filter((p) => p.name !== name))
  }

  async function pickPhotos() {
    if (!sessionToken) return
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to upload listing images.')
      return
    }
    const remaining = 8 - photoRows.length
    if (remaining <= 0) {
      Alert.alert('Limit', 'You can upload up to 8 photos.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: remaining,
    })

    if (result.canceled) return

    const newRows: LocalPhotoRow[] = result.assets.map((asset, i) => ({
      id: `local-${Date.now()}-${i}`,
      localUri: asset.uri,
      mimeType: asset.mimeType ?? 'image/jpeg',
    }))
    setPhotoRows((prev) => [...prev, ...newRows])
  }

  function removeImageAt(index: number) {
    setPhotoRows((prev) => prev.filter((_, i) => i !== index))
  }

  function setAsCover(index: number) {
    if (index === 0) return
    setPhotoRows((prev) => {
      const next = [...prev]
      const [item] = next.splice(index, 1)
      return [item, ...next]
    })
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
    if (!form.locality.trim()) {
      Alert.alert('Locality required', 'Please add locality / area (e.g. HSR Layout).')
      return
    }
    if (!form.rentAmount) {
      Alert.alert('Rent required', 'Please enter the monthly rent amount.')
      return
    }
    if (!form.propertyType) {
      Alert.alert('Property type', 'Please select a property type.')
      return
    }
    if (!form.occupancyType) {
      Alert.alert('Occupancy', 'Please select occupancy.')
      return
    }
    if (!form.moveInDate.trim()) {
      Alert.alert('Move-in date', 'Please enter move-in date (YYYY-MM-DD).')
      return
    }
    if (!form.contactPhone.trim()) {
      Alert.alert('Contact phone', 'Please add a contact phone number.')
      return
    }
    if (photoRows.length < 2) {
      Alert.alert('Photos required', 'Please add at least 2 photos for a published listing.')
      return
    }
    await submitListing('PUBLISHED')
  }

  function mapUploadsToPayload(uploads: ListingImageUploadPayload[]) {
    return uploads.map((img, index) => ({
      assetProvider: img.assetProvider,
      providerAssetId: img.providerAssetId,
      width: img.width,
      height: img.height,
      bytes: img.bytes,
      sortOrder: index,
      isCover: index === 0,
    }))
  }

  function buildListingBody(
    status: 'DRAFT' | 'PUBLISHED',
    imagesPayload?: ReturnType<typeof mapUploadsToPayload>,
  ) {
    return {
      ownerUserId: user!.id,
      type: 'tenant_replacement' as const,
      title: form.title.trim(),
      city: form.city || undefined,
      locality: form.locality.trim() || undefined,
      locationName: pinnedLocation?.locationName ?? undefined,
      latitude: pinnedLocation?.latitude,
      longitude: pinnedLocation?.longitude,
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
      nearbyPlaces: nearbyPlaces.length > 0 ? nearbyPlaces : undefined,
      status,
      images: imagesPayload && imagesPayload.length > 0 ? imagesPayload : undefined,
    }
  }

  async function submitListing(status: 'DRAFT' | 'PUBLISHED') {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to post a listing.')
      navigation.navigate('Auth')
      return
    }

    setIsSubmitting(true)
    setIsPhotoUploadPhase(false)
    const uploadedIdsForCleanup: string[] = []
    try {
      const created = await apiRequest<Listing>('/listings', {
        method: 'POST',
        token: sessionToken,
        body: JSON.stringify(buildListingBody('DRAFT')),
      })

      setIsPhotoUploadPhase(true)
      const uploads: ListingImageUploadPayload[] = []
      for (const row of photoRows) {
        if (row.upload) {
          uploads.push(row.upload)
          continue
        }
        const uploaded = await uploadListingImageToCloudinary(
          row.localUri,
          row.mimeType,
          sessionToken!,
          created.id,
        )
        uploadedIdsForCleanup.push(uploaded.providerAssetId)
        uploads.push(uploaded)
      }

      if (uploads.length > 0 || status === 'PUBLISHED') {
        await apiRequest(`/listings/${created.id}`, {
          method: 'PATCH',
          token: sessionToken,
          body: JSON.stringify(buildListingBody(status, mapUploadsToPayload(uploads))),
        })
      }

      Alert.alert(
        status === 'PUBLISHED' ? 'Listing published!' : 'Draft saved',
        status === 'PUBLISHED'
          ? 'Your listing is now live.'
          : 'Your draft has been saved. Publish it when ready.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack()
              } else {
                navigation.navigate('MyListings' as never)
              }
            },
          },
        ],
      )
    } catch (err) {
      if (uploadedIdsForCleanup.length > 0 && sessionToken) {
        await cleanupUploadedListingImages(uploadedIdsForCleanup, sessionToken)
      }
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save listing.')
    } finally {
      setIsSubmitting(false)
      setIsPhotoUploadPhase(false)
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

  const suggestionList = nearbyKind === 'tech_park' ? bangaloreTechParks : bangaloreCompanies

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.scrollFlex}
      >
        <Text style={styles.pageTitle}>Post a listing</Text>
        <Text style={styles.pageSubtitle}>
          Add photos, pin the address when possible, and tag nearby tech parks or offices (Bangalore-focused
          suggestions).
        </Text>

        <View style={styles.section}>
          <FieldLabel label="Photos" required={false} />
          <Text style={styles.helper}>
            Photos upload after you save: we create your listing draft first, then send images to your listing folder
            (max 8). The first photo is the cover — tap Set cover to reorder.
          </Text>
          <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} style={styles.photoRow}>
            {photoRows.map((row, index) => (
              <View key={row.id} style={styles.photoWrap}>
                <Image
                  contentFit="cover"
                  source={{
                    uri: row.upload
                      ? getListingImageUrl(row.upload.providerAssetId, 'card')
                      : row.localUri,
                  }}
                  style={styles.photoThumb}
                />
                {index === 0 ? (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Cover</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setAsCover(index)}
                    style={styles.setCoverBtn}
                  >
                    <Text style={styles.setCoverBtnText}>Set cover</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => removeImageAt(index)} style={styles.photoRemove}>
                  <Text style={styles.photoRemoveText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photoRows.length < 8 ? (
              <TouchableOpacity
                disabled={isSubmitting && isPhotoUploadPhase}
                onPress={() => void pickPhotos()}
                style={styles.addPhoto}
              >
                <Text style={styles.addPhotoText}>{isSubmitting && isPhotoUploadPhase ? '…' : '+'}</Text>
                <Text style={styles.addPhotoHint}>Add</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>

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
          <FieldLabel label="Locality / area" required />
          <TextInput
            onChangeText={(v) => update('locality', v)}
            placeholder="e.g. Indiranagar, HSR Layout"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={form.locality}
          />
        </View>

        <View style={styles.section}>
          <FieldLabel label="Address (Google Maps)" />
          <LocationAutocompleteInput
            inputValue={addressInput}
            onClear={() => {
              setPinnedLocation(null)
              setAddressInput('')
            }}
            onInputValueChange={setAddressInput}
            onSelect={setPinnedLocation}
            selected={pinnedLocation}
          />
        </View>

        <View style={styles.section}>
          <FieldLabel label="Nearby tech parks / offices (Bangalore)" />
          <Text style={styles.helper}>Pick suggestions or add your own (max 5).</Text>
          <View style={styles.pillRow}>
            <SelectPill
              active={nearbyKind === 'tech_park'}
              label="Tech park"
              onPress={() => setNearbyKind('tech_park')}
            />
            <SelectPill
              active={nearbyKind === 'company'}
              label="Company"
              onPress={() => setNearbyKind('company')}
            />
          </View>
          <View style={styles.pillRow}>
            {suggestionList.map((name) => (
              <SelectPill
                key={name}
                active={nearbyPlaces.some((p) => p.name === name)}
                label={name}
                onPress={() => addNearby(name, nearbyKind)}
              />
            ))}
          </View>
          <View style={styles.customNearbyRow}>
            <TextInput
              onChangeText={setCustomNearby}
              onSubmitEditing={() => {
                addNearby(customNearby, nearbyKind)
                setCustomNearby('')
              }}
              placeholder="Custom name"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { flex: 1 }]}
              value={customNearby}
            />
            <Button onPress={() => { addNearby(customNearby, nearbyKind); setCustomNearby('') }} variant="secondary">
              Add
            </Button>
          </View>
          {nearbyPlaces.length > 0 ? (
            <View style={styles.pillRow}>
              {nearbyPlaces.map((p) => (
                <TouchableOpacity
                  key={p.name}
                  onPress={() => removeNearby(p.name)}
                  style={[styles.pill, styles.nearbyChip]}
                >
                  <Text style={styles.pillText}>
                    {p.name} · {p.type === 'tech_park' ? 'Park' : 'Co.'} ✕
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
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
          <FieldLabel label="Move-in date" required />
          <DatePickerField
            onChange={(v) => update('moveInDate', v)}
            placeholder="Select move-in date"
            value={form.moveInDate}
          />
        </View>

        <View style={styles.section}>
          <FieldLabel label="Contact phone" required />
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

      <View
        style={[
          styles.actions,
          { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + spacing.sm },
        ]}
      >
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
  container: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  guestTitle: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.textPrimary, textAlign: 'center' },
  guestText: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  scroll: { padding: spacing.md },
  scrollFlex: { flex: 1 },
  pageTitle: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  pageSubtitle: { fontSize: fontSizes.base, color: colors.textSecondary, marginBottom: spacing.lg },
  section: { marginBottom: spacing.md },
  helper: { fontSize: fontSizes.xs, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 18 },
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
  nearbyChip: { backgroundColor: colors.bgLight },
  customNearbyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  photoRow: { flexDirection: 'row', marginTop: spacing.sm },
  photoWrap: { marginRight: spacing.sm, position: 'relative' },
  photoThumb: { width: 120, height: 120, borderRadius: radius.md, backgroundColor: colors.bgLight },
  coverBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    alignItems: 'center',
  },
  coverBadgeText: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.white },
  setCoverBtn: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 5,
    backgroundColor: 'rgba(108, 99, 255, 0.92)',
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    alignItems: 'center',
  },
  setCoverBtnText: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, color: colors.white },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: { color: colors.white, fontSize: 16, fontWeight: fontWeights.bold, lineHeight: 18 },
  addPhoto: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  addPhotoText: { fontSize: fontSizes.xl, color: colors.primary, fontWeight: fontWeights.bold },
  addPhotoHint: { fontSize: fontSizes.xs, color: colors.textSecondary },
  actions: {
    flexDirection: 'row', gap: spacing.sm,
    padding: spacing.md, backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 8,
  },
})
