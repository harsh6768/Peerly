import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { InquiryTimeline } from '../components/InquiryTimeline'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/auth'
import { buildInquiryTimeline } from '../lib/inquiryTimeline'
import type { Inquiry, ListingInquiryStatus } from '../lib/types'
import type { RootStackScreenProps } from '../navigation/types'

type Props = RootStackScreenProps<'InquiryDetail'>

function statusTone(status: string) {
  const map: Record<string, 'primary' | 'amber' | 'green' | 'gray' | 'red'> = {
    NEW: 'primary',
    CONTACTED: 'amber',
    SCHEDULED: 'green',
    CLOSED: 'gray',
    DECLINED: 'red',
  }
  return map[status] ?? 'gray'
}

function statusLabel(status: string, owner: boolean) {
  if (owner) {
    const map: Record<string, string> = {
      NEW: 'New lead',
      CONTACTED: 'Contacted',
      SCHEDULED: 'Visit scheduled',
      CLOSED: 'Closed',
      DECLINED: 'Declined',
    }
    return map[status] ?? status
  }
  const map: Record<string, string> = {
    NEW: 'Inquiry sent',
    CONTACTED: 'In review',
    SCHEDULED: 'Visit scheduled',
    CLOSED: 'Closed',
    DECLINED: 'Declined',
  }
  return map[status] ?? status
}

function Section({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionValue}>{value}</Text>
    </View>
  )
}

function normalizePhoneForLink(phone: string | null) {
  return (phone ?? '').replace(/[^\d+]/g, '')
}

export function InquiryDetailScreen({ route }: Props) {
  const { inquiryId } = route.params
  const { sessionToken, user } = useAuth()
  const insets = useSafeAreaInsets()

  const [inquiry, setInquiry] = useState<Inquiry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusBusy, setStatusBusy] = useState(false)

  const loadInquiry = useCallback(async () => {
    if (!sessionToken) return
    setError(null)
    const data = await apiRequest<Inquiry>(`/listing-inquiries/${inquiryId}`, { token: sessionToken })
    setInquiry(data)
  }, [inquiryId, sessionToken])

  useEffect(() => {
    setIsLoading(true)
    void loadInquiry()
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [loadInquiry])

  async function patchStatus(status: ListingInquiryStatus) {
    if (!sessionToken || !inquiry) return
    setStatusBusy(true)
    try {
      await apiRequest(`/listing-inquiries/${inquiry.id}/status`, {
        method: 'PATCH',
        token: sessionToken,
        body: JSON.stringify({ status }),
      })
      await loadInquiry()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not update inquiry.')
    } finally {
      setStatusBusy(false)
    }
  }

  function confirmDecline() {
    Alert.alert(
      'Decline inquiry?',
      'The seeker will see this inquiry as declined.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => void patchStatus('DECLINED') },
      ],
    )
  }

  function confirmClose() {
    Alert.alert('Close inquiry?', 'You can still find it under the Closed filter in your inbox.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', onPress: () => void patchStatus('CLOSED') },
    ])
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (error || !inquiry) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Inquiry not found.'}</Text>
      </View>
    )
  }

  const isOwnerView = user ? inquiry.listingOwnerUserId === user.id : false
  const s = inquiry.status
  const ownerShowContact = isOwnerView && s === 'NEW'
  const ownerShowClose = isOwnerView && (s === 'CONTACTED' || s === 'SCHEDULED')
  const ownerShowDecline = isOwnerView && (s === 'NEW' || s === 'CONTACTED' || s === 'SCHEDULED')
  const seekerPhone = normalizePhoneForLink(inquiry.requester.phone)
  const phoneDigits = (inquiry.requester.phone ?? '').replace(/\D/g, '')
  const waLink = phoneDigits.length >= 8 ? `https://wa.me/${phoneDigits}` : null

  const location = [inquiry.listing.locality, inquiry.listing.city].filter(Boolean).join(', ')
  const rent = inquiry.listing.rentAmount
    ? `₹${inquiry.listing.rentAmount.toLocaleString('en-IN')}/mo`
    : 'Rent TBD'

  const timelineEvents = buildInquiryTimeline(inquiry, isOwnerView ? 'owner' : 'requester')

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Status */}
      <View style={styles.statusRow}>
        <Badge tone={statusTone(inquiry.status)}>{statusLabel(inquiry.status, isOwnerView)}</Badge>
        <Text style={styles.date}>
          {new Date(inquiry.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.card}>
        <InquiryTimeline events={timelineEvents} />
      </View>

      {/* Listing summary */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Listing</Text>
        <Text style={styles.cardTitle}>{inquiry.listing.title}</Text>
        {location ? <Text style={styles.cardMeta}>{location}</Text> : null}
        <Text style={styles.cardRent}>{rent}</Text>
      </View>

      {/* Inquiry details */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{isOwnerView ? 'Message from seeker' : 'Your inquiry'}</Text>
        {inquiry.message ? (
          <Text style={styles.message}>{inquiry.message}</Text>
        ) : (
          <Text style={styles.cardMeta}>No message provided.</Text>
        )}
      </View>

      {/* Facts */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Details</Text>
        {inquiry.budgetAmount ? (
          <Section
            label={isOwnerView ? 'Their budget' : 'Your budget'}
            value={`₹${inquiry.budgetAmount.toLocaleString('en-IN')}/mo`}
          />
        ) : null}
        {inquiry.preferredMoveInDate ? (
          <Section
            label="Preferred move-in"
            value={new Date(inquiry.preferredMoveInDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          />
        ) : null}
        {inquiry.preferredOccupancy ? (
          <Section
            label="Occupancy preference"
            value={
              inquiry.preferredOccupancy.charAt(0) +
              inquiry.preferredOccupancy.slice(1).toLowerCase()
            }
          />
        ) : null}
      </View>

      {/* Counterparty */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{isOwnerView ? 'Seeker' : 'Host'}</Text>
        <Text style={styles.cardTitle}>
          {isOwnerView ? inquiry.requester.fullName : inquiry.listingOwner.fullName}
        </Text>
        {(isOwnerView ? inquiry.requester.companyName : inquiry.listingOwner.companyName) ? (
          <Text style={styles.cardMeta}>
            {isOwnerView ? inquiry.requester.companyName : inquiry.listingOwner.companyName}
          </Text>
        ) : null}
        {isOwnerView && inquiry.requester.phone ? (
          <Text style={styles.phoneLine}>{inquiry.requester.phone}</Text>
        ) : null}
        <View style={styles.verifyRow}>
          {isOwnerView ? (
            inquiry.requester.isVerified ? (
              <Badge tone="green">Verified seeker</Badge>
            ) : (
              <Badge tone="gray">Unverified</Badge>
            )
          ) : inquiry.listingOwner.isVerified ? (
            <Badge tone="green">Verified host</Badge>
          ) : (
            <Badge tone="gray">Unverified</Badge>
          )}
        </View>
        {isOwnerView && seekerPhone ? (
          <View style={styles.contactLinks}>
            <Text
              onPress={() => void Linking.openURL(`tel:${seekerPhone}`)}
              style={styles.linkText}
            >
              Call seeker
            </Text>
            {waLink ? (
              <Text onPress={() => void Linking.openURL(waLink)} style={styles.linkText}>
                WhatsApp
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {isOwnerView && (ownerShowContact || ownerShowClose || ownerShowDecline) ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Manage inquiry</Text>
          <View style={styles.ownerActions}>
            {ownerShowContact ? (
              <Button
                disabled={statusBusy}
                fullWidth
                loading={statusBusy}
                onPress={() => void patchStatus('CONTACTED')}
                variant="secondary"
              >
                Mark contacted
              </Button>
            ) : null}
            {ownerShowClose ? (
              <Button
                disabled={statusBusy}
                fullWidth
                loading={statusBusy}
                onPress={confirmClose}
                variant="secondary"
              >
                Close inquiry
              </Button>
            ) : null}
            {ownerShowDecline ? (
              <Button
                disabled={statusBusy}
                fullWidth
                loading={statusBusy}
                onPress={confirmDecline}
                variant="ghost"
              >
                Decline
              </Button>
            ) : null}
          </View>
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.urgent, fontSize: fontSizes.base, textAlign: 'center', padding: spacing.lg },
  content: { padding: spacing.md, gap: spacing.md },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: { fontSize: fontSizes.sm, color: colors.textSecondary },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  cardTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.textPrimary },
  cardMeta: { fontSize: fontSizes.sm, color: colors.textSecondary },
  cardRent: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, color: colors.primary, marginTop: spacing.xs },
  message: { fontSize: fontSizes.base, color: colors.textPrimary, lineHeight: 22 },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionLabel: { fontSize: fontSizes.sm, color: colors.textSecondary, fontWeight: fontWeights.medium },
  sectionValue: { fontSize: fontSizes.sm, color: colors.textPrimary, fontWeight: fontWeights.semibold },
  verifyRow: { marginTop: spacing.xs },
  phoneLine: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.textPrimary, marginTop: spacing.xs },
  contactLinks: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  linkText: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, color: colors.primary },
  ownerActions: { gap: spacing.sm, marginTop: spacing.sm },
})
