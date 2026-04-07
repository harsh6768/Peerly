import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Listing } from '../lib/types'
import type { RootStackScreenProps } from '../navigation/types'

type Props = RootStackScreenProps<'ListingDetail'>

function formatRent(amount: number | null): string {
  if (!amount) return 'Rent TBD'
  return `₹${amount.toLocaleString('en-IN')}/mo`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Flexible'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ListingDetailScreen({ route, navigation }: Props) {
  const { listingId, listing: passedListing } = route.params
  const { sessionToken, user } = useAuth()
  const insets = useSafeAreaInsets()

  const [listing, setListing] = useState<Listing | null>(passedListing ?? null)
  const [isLoading, setIsLoading] = useState(!passedListing)
  const [error, setError] = useState<string | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [inquiryBudget, setInquiryBudget] = useState('')
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false)

  useEffect(() => {
    if (passedListing) return
    setIsLoading(true)
    void apiRequest<Listing>(`/listings/${listingId}`, { token: sessionToken })
      .then(setListing)
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [listingId, passedListing, sessionToken])

  async function submitInquiry() {
    if (!user) {
      navigation.navigate('Auth')
      return
    }

    if (!inquiryMessage.trim()) {
      Alert.alert('Message required', 'Please write a message to the host.')
      return
    }

    setIsSubmittingInquiry(true)
    try {
      const parsedBudget = inquiryBudget.trim() ? parseInt(inquiryBudget.trim(), 10) : undefined
      await apiRequest('/listing-inquiries', {
        method: 'POST',
        token: sessionToken,
        body: JSON.stringify({
          listingId,
          message: inquiryMessage.trim() || undefined,
          budgetAmount: parsedBudget && !isNaN(parsedBudget) ? parsedBudget : undefined,
        }),
      })
      setShowInquiryForm(false)
      setInquiryMessage('')
      setInquiryBudget('')
      Alert.alert('Sent!', 'Your inquiry has been sent to the host.')
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send inquiry.')
    } finally {
      setIsSubmittingInquiry(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (error || !listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Listing not found.'}</Text>
      </View>
    )
  }

  const coverImage = listing.images.find((img) => img.isCover) ?? listing.images[0]
  const location = [listing.locationName, listing.locality, listing.city]
    .filter(Boolean)
    .join(', ')

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {listing.images.length > 0 ? (
          <View>
            <Image
              resizeMode="cover"
              source={{ uri: listing.images[activeImageIndex]?.detailUrl || listing.images[activeImageIndex]?.imageUrl }}
              style={styles.heroImage}
            />
            {listing.images.length > 1 && (
              <ScrollView
                contentContainerStyle={styles.thumbnailRow}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnails}
              >
                {listing.images.map((img, idx) => (
                  <TouchableOpacity
                    key={img.id}
                    activeOpacity={0.8}
                    onPress={() => setActiveImageIndex(idx)}
                  >
                    <Image
                      resizeMode="cover"
                      source={{ uri: img.thumbnailUrl || img.imageUrl }}
                      style={[styles.thumbnail, idx === activeImageIndex && styles.thumbnailActive]}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.rent}>{formatRent(listing.rentAmount)}</Text>
              {listing.depositAmount ? (
                <Text style={styles.deposit}>
                  + ₹{listing.depositAmount.toLocaleString('en-IN')} deposit
                </Text>
              ) : null}
            </View>
            <View style={styles.badges}>
              {listing.owner.isVerified && <Badge tone="green">Verified host</Badge>}
              {listing.urgencyLevel === 'HIGH' && <Badge tone="red">Urgent</Badge>}
            </View>
          </View>

          <Text style={styles.title}>{listing.title}</Text>

          {location ? (
            <Text style={styles.location}>{location}</Text>
          ) : null}

          <View style={styles.metaRow}>
            {listing.propertyType && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>
                  {listing.propertyType.charAt(0) + listing.propertyType.slice(1).toLowerCase()}
                </Text>
              </View>
            )}
            {listing.occupancyType && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>
                  {listing.occupancyType.charAt(0) + listing.occupancyType.slice(1).toLowerCase()} occupancy
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Move-in</Text>
          <Text style={styles.sectionValue}>{formatDate(listing.moveInDate)}</Text>

          {listing.amenities.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Amenities</Text>
              <View style={styles.amenityGrid}>
                {listing.amenities.map((a) => (
                  <View key={a} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {listing.nearbyPlaces.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Nearby</Text>
              {listing.nearbyPlaces.map((place) => (
                <Text key={place.name} style={styles.nearbyItem}>
                  {place.name}{place.type === 'tech_park' ? ' (Tech park)' : ' (Company)'}
                </Text>
              ))}
            </>
          )}

          {listing.description ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>About this place</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </>
          ) : null}

          {listing.maintenanceAmount || listing.miscCharges ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Charges</Text>
              {listing.maintenanceAmount ? (
                <Text style={styles.chargesRow}>
                  Maintenance: ₹{listing.maintenanceAmount.toLocaleString('en-IN')}/mo
                </Text>
              ) : null}
              {listing.miscCharges ? (
                <Text style={styles.chargesRow}>{listing.miscCharges}</Text>
              ) : null}
            </>
          ) : null}

          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Host</Text>
          <View style={styles.hostRow}>
            <Text style={styles.hostName}>{listing.owner.fullName}</Text>
            {listing.owner.companyName ? (
              <Text style={styles.hostCompany}>{listing.owner.companyName}</Text>
            ) : null}
          </View>
        </View>

        {showInquiryForm && (
          <View style={styles.inquiryForm}>
            <Text style={styles.inquiryFormTitle}>Send inquiry</Text>
            <Text style={styles.inquiryFormLabel}>Message to host *</Text>
            <TextInput
              multiline
              numberOfLines={4}
              onChangeText={setInquiryMessage}
              placeholder="Introduce yourself and tell the host why you're interested..."
              placeholderTextColor={colors.textSecondary}
              style={styles.textArea}
              value={inquiryMessage}
            />
            <Text style={[styles.inquiryFormLabel, { marginTop: spacing.md }]}>Your budget (optional)</Text>
            <TextInput
              keyboardType="numeric"
              onChangeText={setInquiryBudget}
              placeholder="e.g. 25000"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              value={inquiryBudget}
            />
            <View style={styles.formActions}>
              <Button
                fullWidth
                loading={isSubmittingInquiry}
                onPress={() => void submitInquiry()}
              >
                Send inquiry
              </Button>
              <Button
                fullWidth
                onPress={() => setShowInquiryForm(false)}
                variant="ghost"
              >
                Cancel
              </Button>
            </View>
          </View>
        )}
      </ScrollView>

      {!showInquiryForm && (
        <View style={[styles.cta, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            fullWidth
            onPress={() => {
              if (!user) {
                navigation.navigate('Auth')
                return
              }
              setShowInquiryForm(true)
            }}
          >
            Enquire about this room
          </Button>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.urgent, fontSize: fontSizes.base, textAlign: 'center', padding: spacing.lg },
  heroImage: { width: '100%', height: 280, backgroundColor: colors.bgLight },
  thumbnails: { backgroundColor: colors.white },
  thumbnailRow: { padding: spacing.sm, gap: spacing.xs },
  thumbnail: {
    width: 72, height: 56, borderRadius: radius.sm,
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbnailActive: { borderColor: colors.primary },
  content: { padding: spacing.md },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  titleLeft: { flex: 1 },
  rent: { fontSize: fontSizes.xxl, fontWeight: fontWeights.bold, color: colors.primary, letterSpacing: -0.5 },
  deposit: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: 2 },
  badges: { flexDirection: 'row', gap: spacing.xs, flexShrink: 0, marginLeft: spacing.sm },
  title: { fontSize: fontSizes.xl, fontWeight: fontWeights.semibold, color: colors.textPrimary, marginBottom: spacing.xs },
  location: { fontSize: fontSizes.base, color: colors.textSecondary, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  metaChip: {
    paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill, backgroundColor: colors.bgLight, borderWidth: 1, borderColor: colors.border,
  },
  metaChipText: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  sectionLabel: { fontSize: fontSizes.xs, fontWeight: fontWeights.bold, color: colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: spacing.xs },
  sectionValue: { fontSize: fontSizes.base, color: colors.textPrimary },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  amenityChip: {
    paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill, backgroundColor: colors.bgLight, borderWidth: 1, borderColor: colors.border,
  },
  amenityText: { fontSize: fontSizes.sm, color: colors.textSecondary, fontWeight: fontWeights.medium },
  nearbyItem: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  description: { fontSize: fontSizes.base, color: colors.textPrimary, lineHeight: 22 },
  chargesRow: { fontSize: fontSizes.base, color: colors.textSecondary, marginBottom: spacing.xs },
  hostRow: { gap: 2 },
  hostName: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.textPrimary },
  hostCompany: { fontSize: fontSizes.sm, color: colors.textSecondary },
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md, backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 8,
  },
  inquiryForm: {
    margin: spacing.md, padding: spacing.md,
    backgroundColor: colors.bgLight, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  inquiryFormTitle: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.textPrimary, marginBottom: spacing.md },
  inquiryFormLabel: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.textSecondary, marginBottom: spacing.xs },
  textArea: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, fontSize: fontSizes.base, color: colors.textPrimary,
    backgroundColor: colors.white, minHeight: 120, textAlignVertical: 'top',
  },
  input: {
    height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, fontSize: fontSizes.base, color: colors.textPrimary, backgroundColor: colors.white,
  },
  formActions: { gap: spacing.sm, marginTop: spacing.md },
})
